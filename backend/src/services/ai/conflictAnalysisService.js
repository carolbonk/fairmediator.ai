/**
 * Conflict Analysis Service
 * Analyzes mediator conflicts using RECAP case history
 *
 * IMPORTANT: Conflict detection requires understanding user's position in the case.
 * Not all past relationships with opposing counsel are conflicts - we must analyze:
 * 1. What side is the user on? (plaintiff/defendant)
 * 2. Did opposing counsel WIN or LOSE in past cases with this mediator?
 * 3. What was the case outcome? (settled, dismissed, judgment for plaintiff/defendant)
 *
 * Risk Levels:
 * - 🟢 CLEAR: No history OR opposing counsel has LOSING track record with mediator
 * - 🟡 YELLOW: Past relationship exists, outcome unclear - disclose to parties
 * - 🔴 RED: Opposing counsel has WINNING track record with this mediator (bias risk)
 *
 * TODO: Enhance with case outcome analysis (Win/Loss ratio for opposing counsel)
 */

const recapClient = require('../external/recapClient');
const linkedinScraper = require('../external/linkedinScraper');
const multiSignalBiasDetection = require('./multiSignalBiasDetection');
const Mediator = require('../../models/Mediator');
const logger = require('../../config/logger');

class ConflictAnalysisService {
  /**
   * Analyze conflicts for a specific mediator and case
   * @param {string} mediatorId - Mediator MongoDB ID
   * @param {object} caseInfo - Case details
   * @param {string} caseInfo.opposingCounsel - Opposing counsel name/firm
   * @param {string} caseInfo.currentParty - Your party name (optional)
   * @param {string} caseInfo.userPosition - Your position: 'plaintiff', 'defendant', 'petitioner', 'respondent'
   * @param {object} options - { forceRefresh, cacheDuration, includeMultiSignalBias }
   * @returns {Promise<object>} Conflict analysis with risk level
   */
  async analyzeConflicts(mediatorId, caseInfo, options = {}) {
    const {
      opposingCounsel,
      currentParty = null,
      userPosition = null // NEW: plaintiff/defendant/etc
    } = caseInfo;

    const {
      forceRefresh = false,
      cacheDuration = 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      includeMultiSignalBias = false // NEW: Include comprehensive bias scoring
    } = options;

    try {
      const mediator = await Mediator.findById(mediatorId);
      if (!mediator) {
        throw new Error('Mediator not found');
      }

      // Check cache first (unless forceRefresh)
      if (!forceRefresh && this._isCacheValid(mediator, caseInfo, cacheDuration)) {
        logger.info('Conflict analysis cache hit', { mediatorId, opposingCounsel });
        return this._formatCachedResult(mediator);
      }

      // Cache miss or expired - perform fresh analysis
      logger.info('Performing fresh conflict analysis', { mediatorId, opposingCounsel });

      // Step 1: Get mediator's case history from RECAP
      const recapResults = await this._getRecapCaseHistory(mediator);

      // Step 2: Check for conflicts with opposing counsel
      const conflictCheck = await recapClient.checkCaseHistoryConflict(
        recapResults.cases,
        opposingCounsel,
        currentParty
      );

      // Step 2.5: NEW - Analyze case outcomes (win/loss rate)
      const outcomeAnalysis = recapClient.analyzeCaseOutcomes(
        conflictCheck.conflicts,
        opposingCounsel,
        userPosition
      );

      // Step 3: Combine with existing affiliation data
      const affiliationConflicts = this._checkAffiliationConflicts(
        mediator,
        opposingCounsel,
        currentParty
      );

      // Step 3.5: Get LinkedIn data if available (manual enrichment)
      const linkedinData = await this._getLinkedInData(mediator, opposingCounsel, caseInfo);

      // Step 4: Calculate overall risk level (with LinkedIn mutual connections + case outcomes)
      const analysis = this._calculateOverallRisk(
        conflictCheck,
        affiliationConflicts,
        linkedinData,
        outcomeAnalysis
      );

      // Step 5: Update mediator with results and cache
      await this._updateMediatorConflictData(mediator, {
        ...analysis,
        opposingCounsel,
        currentParty,
        recapResults,
        cacheDuration
      });

      // Step 6: Optionally calculate multi-signal bias score
      let multiSignalBias = null;
      if (includeMultiSignalBias) {
        const signals = {
          caseOutcomes: outcomeAnalysis?.totalCases > 0 ? {
            totalCases: outcomeAnalysis.totalCases,
            wins: outcomeAnalysis.wins,
            losses: outcomeAnalysis.losses,
            winRate: outcomeAnalysis.winRate,
            statistically_significant: outcomeAnalysis.statistically_significant
          } : null,
          caseHistory: conflictCheck.hasConflict ? {
            hasConflict: true,
            conflicts: conflictCheck.conflicts
          } : null,
          linkedinData: linkedinData || null,
          affiliations: mediator.affiliations || [],
          donations: mediator.biasIndicators?.donationHistory || [],
          publicStatements: mediator.biasIndicators?.publicStatements || []
        };

        multiSignalBias = multiSignalBiasDetection.calculateBiasScore(signals);
      }

      return {
        success: true,
        mediatorId: mediator._id,
        mediatorName: mediator.name,
        ...analysis,
        // NEW: Multi-signal bias assessment (if requested)
        multiSignalBias,
        metadata: {
          searchedCases: recapResults.cases.length,
          lastUpdated: new Date(),
          cacheExpiresAt: new Date(Date.now() + cacheDuration),
          includesMultiSignalBias: includeMultiSignalBias
        }
      };

    } catch (error) {
      logger.error('Conflict analysis failed', {
        mediatorId,
        opposingCounsel,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get RECAP case history for mediator
   * @private
   */
  async _getRecapCaseHistory(mediator) {
    // Check if we have recent RECAP data (< 30 days old)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    if (mediator.recapData?.lastSearched > thirtyDaysAgo) {
      logger.info('Using cached RECAP data', {
        mediatorId: mediator._id,
        casesFound: mediator.recapData.casesFound
      });
      return {
        cases: mediator.recapData.cases || [],
        total: mediator.recapData.casesFound || 0
      };
    }

    // Fetch fresh RECAP data
    logger.info('Fetching fresh RECAP data', { mediatorName: mediator.name });
    const recapResults = await recapClient.searchMediatorCases(mediator.name, {
      limit: 50,
      startDate: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000) // Last 5 years
    });

    // Update mediator with RECAP data
    mediator.recapData = {
      lastSearched: new Date(),
      casesFound: recapResults.total,
      cases: recapResults.cases.slice(0, 20) // Store top 20 cases
    };
    await mediator.save();

    return recapResults;
  }

  /**
   * Check affiliation-based conflicts
   * @private
   */
  _checkAffiliationConflicts(mediator, opposingCounsel, currentParty) {
    const conflicts = [];
    const opposingCounselLower = opposingCounsel.toLowerCase();
    const currentPartyLower = currentParty?.toLowerCase();

    // Check current affiliations
    mediator.affiliations?.forEach(affiliation => {
      const affiliationName = affiliation.name?.toLowerCase() || '';

      const counselMatch = affiliationName.includes(opposingCounselLower) ||
                          opposingCounselLower.includes(affiliationName);

      const partyMatch = currentPartyLower && (
        affiliationName.includes(currentPartyLower) ||
        currentPartyLower.includes(affiliationName)
      );

      if (counselMatch || partyMatch) {
        conflicts.push({
          type: 'affiliation',
          name: affiliation.name,
          role: affiliation.role,
          isCurrent: affiliation.isCurrent,
          matchType: counselMatch ? 'counsel' : 'party',
          confidence: affiliation.isCurrent ? 0.9 : 0.6,
          description: `${affiliation.isCurrent ? 'Current' : 'Past'} affiliation with ${affiliation.name}`
        });
      }
    });

    return conflicts;
  }

  /**
   * Get LinkedIn data if available (from manual enrichment)
   * @private
   */
  async _getLinkedInData(mediator, opposingCounsel, caseInfo) {
    // Check if mediator has LinkedIn data stored
    if (!mediator.sources || !Array.isArray(mediator.sources)) {
      return null;
    }

    const linkedinSource = mediator.sources.find(s =>
      s.sourceType === 'linkedin' || s.url?.includes('linkedin.com')
    );

    if (!linkedinSource) {
      return null;
    }

    // Check if we have mutual connections data
    // This would be populated by the manual enrichment endpoint
    const linkedinEnrichment = mediator.linkedinEnrichment;

    if (!linkedinEnrichment) {
      return null;
    }

    // Calculate relationship strength if we have mutual connections
    if (linkedinEnrichment.opposingCounsel === opposingCounsel &&
        linkedinEnrichment.mutualConnectionsCount !== null) {

      const relationshipStrength = linkedinScraper.calculateRelationshipStrength(
        linkedinEnrichment,
        linkedinEnrichment.mutualConnectionsCount
      );

      return {
        mutualConnectionsCount: linkedinEnrichment.mutualConnectionsCount,
        relationshipStrength,
        lastChecked: linkedinEnrichment.checkedAt
      };
    }

    return null;
  }

  /**
   * Calculate overall risk level
   * Enhanced to factor in LinkedIn mutual connections
   * PHASE 1 IMPROVEMENT: Now includes confidence scores, evidence strength, and data completeness
   * PHASE 2 IMPROVEMENT: Now includes case outcome win/loss analysis
   * @private
   */
  _calculateOverallRisk(recapConflicts, affiliationConflicts, linkedinData = null, outcomeAnalysis = null) {
    const allReasons = [];
    const evidenceStrength = {
      recap: 'none',
      linkedin: 'none',
      affiliations: 'none'
    };

    // Process RECAP conflicts with impact scoring
    if (recapConflicts.hasConflict) {
      const caseCount = recapConflicts.conflicts.length;
      evidenceStrength.recap = caseCount >= 3 ? 'strong' : caseCount >= 2 ? 'moderate' : 'weak';

      recapConflicts.conflicts.forEach(conflict => {
        const yearsAgo = conflict.dateFiled
          ? (Date.now() - new Date(conflict.dateFiled)) / (1000 * 60 * 60 * 24 * 365)
          : null;

        allReasons.push({
          type: 'case_history',
          description: `Appeared in case ${conflict.caseNumber} with ${conflict.matchType === 'counsel' ? 'opposing counsel' : 'party'}`,
          confidence: conflict.confidence,
          impact: yearsAgo && yearsAgo < 3 ? 'HIGH' : yearsAgo && yearsAgo < 5 ? 'MEDIUM' : 'LOW',
          source: 'recap',
          caseReference: conflict.caseNumber,
          dateFiled: conflict.dateFiled,
          yearsAgo: yearsAgo ? Math.round(yearsAgo * 10) / 10 : null,
          url: conflict.url,
          weight: 0.6 // Case history is weighted most heavily
        });
      });
    }

    // Process affiliation conflicts with impact scoring
    affiliationConflicts.forEach(conflict => {
      if (affiliationConflicts.length > 0) {
        evidenceStrength.affiliations = conflict.isCurrent ? 'strong' : 'moderate';
      }

      allReasons.push({
        type: conflict.type,
        description: conflict.description,
        confidence: conflict.confidence,
        impact: conflict.isCurrent ? 'HIGH' : 'MEDIUM',
        source: 'affiliation',
        weight: conflict.isCurrent ? 0.5 : 0.3
      });
    });

    // Process LinkedIn data
    if (linkedinData && linkedinData.mutualConnectionsCount) {
      const strengthLevel = linkedinData.relationshipStrength?.strengthLevel;
      evidenceStrength.linkedin = strengthLevel === 'very_strong' ? 'strong'
        : strengthLevel === 'strong' ? 'moderate'
        : 'weak';

      const impact = strengthLevel === 'very_strong' || strengthLevel === 'strong' ? 'HIGH' : 'MEDIUM';

      allReasons.push({
        type: 'linkedin_connections',
        description: `${linkedinData.mutualConnectionsCount} mutual LinkedIn connection(s) with opposing counsel (${strengthLevel || 'weak'} relationship)`,
        confidence: linkedinData.relationshipStrength.confidence,
        impact,
        source: 'linkedin',
        mutualConnectionsCount: linkedinData.mutualConnectionsCount,
        weight: strengthLevel === 'very_strong' ? 0.4 : strengthLevel === 'strong' ? 0.3 : 0.2
      });
    }

    // Calculate overall confidence score (weighted average)
    let overallConfidence = 0;
    let totalWeight = 0;

    allReasons.forEach(reason => {
      const weight = reason.weight || 0.3;
      overallConfidence += reason.confidence * weight;
      totalWeight += weight;
    });

    overallConfidence = totalWeight > 0 ? overallConfidence / totalWeight : 0;

    // Determine overall risk level
    let riskLevel = 'clear';
    let recommendation = 'No conflicts detected. Mediator appears clear for this case.';
    let detailedReasoning = [];

    if (allReasons.length > 0) {
      // Analyze risk factors
      const highConfidence = allReasons.some(r => r.confidence >= 0.85);
      const multipleConflicts = allReasons.length > 2;
      const highImpactConflicts = allReasons.filter(r => r.impact === 'HIGH').length;
      const recentCase = allReasons.some(r => r.yearsAgo !== null && r.yearsAgo < 3);
      const linkedinAmplification = linkedinData &&
        (linkedinData.relationshipStrength?.strengthLevel === 'strong' ||
         linkedinData.relationshipStrength?.strengthLevel === 'very_strong');

      // NEW PHASE 2: Case outcome bias amplification
      let outcomeAmplification = false;
      if (outcomeAnalysis && outcomeAnalysis.totalCases > 0) {
        // Add outcome data to evidence strength
        evidenceStrength.case_outcomes = outcomeAnalysis.statistically_significant ? 'strong' : 'weak';

        // High win rate (75%+) for opposing counsel = RED FLAG
        if (outcomeAnalysis.biasRisk === 'high') {
          outcomeAmplification = true;

          allReasons.push({
            type: 'case_outcome_bias',
            description: `Opposing counsel won ${outcomeAnalysis.winRate}% of cases (${outcomeAnalysis.wins}/${outcomeAnalysis.wins + outcomeAnalysis.losses}) with this mediator`,
            confidence: outcomeAnalysis.statistically_significant ? 0.9 : 0.6,
            impact: 'CRITICAL',
            source: 'recap_outcome_analysis',
            weight: 0.8, // Highest weight - this is direct evidence of bias
            winRate: outcomeAnalysis.winRate,
            totalDecisiveCases: outcomeAnalysis.wins + outcomeAnalysis.losses
          });

          detailedReasoning.push({
            factor: 'Case outcome pattern',
            description: outcomeAnalysis.recommendation,
            contributes_to: 'Strong evidence of mediator bias toward opposing counsel'
          });
        } else if (outcomeAnalysis.biasRisk === 'moderate') {
          allReasons.push({
            type: 'case_outcome_pattern',
            description: `Opposing counsel won ${outcomeAnalysis.winRate}% of cases (${outcomeAnalysis.wins}/${outcomeAnalysis.wins + outcomeAnalysis.losses})`,
            confidence: 0.7,
            impact: 'HIGH',
            source: 'recap_outcome_analysis',
            weight: 0.6,
            winRate: outcomeAnalysis.winRate
          });

          detailedReasoning.push({
            factor: 'Moderate win rate pattern',
            description: outcomeAnalysis.recommendation,
            contributes_to: 'Possible favoritism - disclose and monitor'
          });
        } else if (outcomeAnalysis.biasRisk === 'low' && outcomeAnalysis.lossRate >= 75) {
          // Opposing counsel has LOSING track record = actually GOOD for user
          allReasons.push({
            type: 'case_outcome_favorable',
            description: `Opposing counsel lost ${outcomeAnalysis.lossRate}% of cases (${outcomeAnalysis.losses}/${outcomeAnalysis.wins + outcomeAnalysis.losses})`,
            confidence: 0.8,
            impact: 'LOW',
            source: 'recap_outcome_analysis',
            weight: -0.3, // Negative weight = reduces risk
            lossRate: outcomeAnalysis.lossRate
          });

          detailedReasoning.push({
            factor: 'Opposing counsel losing pattern',
            description: outcomeAnalysis.recommendation,
            contributes_to: 'No evidence of favoritism - mediator historically ruled against opposing counsel'
          });
        }
      }

      // Build detailed reasoning
      if (highConfidence) {
        detailedReasoning.push({
          factor: 'High confidence match',
          description: 'One or more conflicts have 85%+ confidence',
          contributes_to: 'Increased risk level'
        });
      }

      if (multipleConflicts) {
        detailedReasoning.push({
          factor: 'Multiple conflicts',
          description: `${allReasons.length} separate conflict indicators found`,
          contributes_to: 'Pattern of relationship'
        });
      }

      if (recentCase) {
        detailedReasoning.push({
          factor: 'Recent case history',
          description: 'Case(s) filed within past 3 years',
          contributes_to: 'Active ongoing relationship'
        });
      }

      if (linkedinAmplification) {
        detailedReasoning.push({
          factor: 'Strong social connection',
          description: `${linkedinData.mutualConnectionsCount}+ mutual connections indicates close professional network`,
          contributes_to: 'Relationship amplification'
        });
      }

      // Calculate final risk level
      if (highConfidence || multipleConflicts || recentCase || linkedinAmplification || outcomeAmplification) {
        riskLevel = 'red';
        if (outcomeAmplification) {
          recommendation = `🚨 HIGH BIAS RISK: Opposing counsel won ${outcomeAnalysis.winRate}% of cases with this mediator. ${linkedinAmplification ? `Plus ${linkedinData.mutualConnectionsCount} mutual connections. ` : ''}Select different mediator.`;
        } else if (linkedinAmplification && recapConflicts.hasConflict) {
          recommendation = `CONFLICT DETECTED: Case history with opposing counsel + ${linkedinData.mutualConnectionsCount} mutual connections indicates close relationship. Select different mediator.`;
        } else {
          recommendation = 'CONFLICT DETECTED: Consider selecting a different mediator or disclose relationship to all parties.';
        }
      } else {
        riskLevel = 'yellow';
        recommendation = 'Possible indirect connection detected. Review details and disclose to parties before proceeding.';
      }
    } else if (linkedinData && linkedinData.mutualConnectionsCount > 30) {
      // Edge case: No case history but MANY mutual connections = still mention it
      riskLevel = 'clear';
      recommendation = `No case history with opposing counsel, but ${linkedinData.mutualConnectionsCount} mutual LinkedIn connections detected. Consider disclosing social relationship.`;
      overallConfidence = 0.4;

      allReasons.push({
        type: 'linkedin_connections',
        description: `${linkedinData.mutualConnectionsCount} mutual LinkedIn connections (no case history)`,
        confidence: 0.4,
        impact: 'LOW',
        source: 'linkedin',
        mutualConnectionsCount: linkedinData.mutualConnectionsCount,
        weight: 0.2
      });

      detailedReasoning.push({
        factor: 'Social connections without case history',
        description: 'Many mutual connections but no professional case history',
        contributes_to: 'Transparency recommendation only'
      });
    }

    // Data completeness assessment
    const dataCompleteness = {
      recap: recapConflicts.hasConflict ? 'available' : 'no_data',
      linkedin: linkedinData ? 'available' : 'not_provided',
      affiliations: affiliationConflicts.length > 0 ? 'available' : 'no_data',
      overall: this._calculateDataCompletenesScore({
        recap: recapConflicts.hasConflict,
        linkedin: linkedinData !== null,
        affiliations: affiliationConflicts.length > 0
      })
    };

    return {
      riskLevel,
      reasons: allReasons,
      recommendation,
      conflictCount: allReasons.length,
      // NEW: Phase 1 enhancements
      overallConfidence: Math.round(overallConfidence * 100) / 100,
      evidenceStrength,
      detailedReasoning,
      dataCompleteness,
      // NEW: Phase 2 enhancement
      caseOutcomeAnalysis: outcomeAnalysis
    };
  }

  /**
   * Calculate data completeness score
   * @private
   */
  _calculateDataCompletenesScore(sources) {
    const available = Object.values(sources).filter(Boolean).length;
    const total = Object.keys(sources).length;
    const percentage = Math.round((available / total) * 100);

    if (percentage === 100) return 'complete';
    if (percentage >= 66) return 'good';
    if (percentage >= 33) return 'partial';
    return 'limited';
  }

  /**
   * Check if cached conflict data is still valid
   * @private
   */
  _isCacheValid(mediator, caseInfo, cacheDuration) {
    const cache = mediator.conflictRiskCache;

    if (!cache || !cache.checkedAt || !cache.expiresAt) {
      return false;
    }

    // Check if cache expired
    if (cache.expiresAt < new Date()) {
      return false;
    }

    // Check if same opposing counsel and party
    if (cache.opposingCounsel !== caseInfo.opposingCounsel ||
        cache.currentParty !== caseInfo.currentParty) {
      return false;
    }

    return true;
  }

  /**
   * Format cached result
   * @private
   */
  _formatCachedResult(mediator) {
    const cache = mediator.conflictRiskCache;

    return {
      success: true,
      mediatorId: mediator._id,
      mediatorName: mediator.name,
      riskLevel: cache.riskLevel,
      reasons: cache.reasons,
      recommendation: this._generateRecommendationText(cache.riskLevel, cache.reasons),
      conflictCount: cache.reasons?.length || 0,
      metadata: {
        cached: true,
        lastUpdated: cache.checkedAt,
        cacheExpiresAt: cache.expiresAt
      }
    };
  }

  /**
   * Generate recommendation text from risk level
   * @private
   */
  _generateRecommendationText(riskLevel, reasons) {
    if (riskLevel === 'clear') {
      return 'No conflicts detected. Mediator appears clear for this case.';
    }

    if (riskLevel === 'red') {
      return 'CONFLICT DETECTED: Consider selecting a different mediator or disclose relationship to all parties.';
    }

    return 'Possible indirect connection detected. Review details and disclose to parties before proceeding.';
  }

  /**
   * Update mediator with conflict analysis results
   * @private
   */
  async _updateMediatorConflictData(mediator, analysisData) {
    const { opposingCounsel, currentParty, riskLevel, reasons, recapResults, cacheDuration } = analysisData;

    // Update conflict risk cache
    mediator.conflictRiskCache = {
      opposingCounsel,
      currentParty: currentParty || '',
      riskLevel,
      reasons,
      checkedAt: new Date(),
      expiresAt: new Date(Date.now() + cacheDuration)
    };

    // Update known counsel relationships
    if (reasons.some(r => r.type === 'case_history')) {
      const counselRelationship = mediator.recapData.knownCounselRelationships?.find(
        rel => rel.counselName === opposingCounsel
      );

      if (counselRelationship) {
        counselRelationship.caseCount++;
        counselRelationship.mostRecentCase = new Date();
        counselRelationship.riskLevel = riskLevel;
      } else {
        if (!mediator.recapData.knownCounselRelationships) {
          mediator.recapData.knownCounselRelationships = [];
        }
        mediator.recapData.knownCounselRelationships.push({
          counselName: opposingCounsel,
          firm: '',
          caseCount: 1,
          mostRecentCase: new Date(),
          riskLevel
        });
      }
    }

    await mediator.save();
  }

  /**
   * Clear conflict cache for a mediator (force refresh on next check)
   * @param {string} mediatorId - Mediator MongoDB ID
   */
  async clearConflictCache(mediatorId) {
    const mediator = await Mediator.findById(mediatorId);
    if (!mediator) {
      throw new Error('Mediator not found');
    }

    mediator.conflictRiskCache = undefined;
    await mediator.save();

    logger.info('Conflict cache cleared', { mediatorId });
  }

  /**
   * Calculate comprehensive bias score using multi-signal detection
   * Combines all available signals with weighted scoring
   * @param {string} mediatorId - Mediator MongoDB ID
   * @param {object} caseInfo - Case details
   * @returns {Promise<object>} Comprehensive bias assessment
   */
  async calculateComprehensiveBiasScore(mediatorId, caseInfo) {
    const {
      opposingCounsel,
      currentParty = null,
      userPosition = null
    } = caseInfo;

    try {
      const mediator = await Mediator.findById(mediatorId);
      if (!mediator) {
        throw new Error('Mediator not found');
      }

      logger.info('Calculating comprehensive bias score', { mediatorId, opposingCounsel });

      // Get all available data sources
      const recapResults = await this._getRecapCaseHistory(mediator);
      const conflictCheck = await recapClient.checkCaseHistoryConflict(
        recapResults.cases,
        opposingCounsel,
        currentParty
      );
      const outcomeAnalysis = recapClient.analyzeCaseOutcomes(
        conflictCheck.conflicts,
        opposingCounsel,
        userPosition
      );
      const linkedinData = await this._getLinkedInData(mediator, opposingCounsel, caseInfo);

      // Gather all signals for multi-signal detection
      const signals = {
        // Signal 1: Case outcomes (from RECAP analysis)
        caseOutcomes: outcomeAnalysis.totalCases > 0 ? {
          totalCases: outcomeAnalysis.totalCases,
          wins: outcomeAnalysis.wins,
          losses: outcomeAnalysis.losses,
          winRate: outcomeAnalysis.winRate,
          statistically_significant: outcomeAnalysis.statistically_significant
        } : null,

        // Signal 2: Case history (from RECAP conflicts)
        caseHistory: conflictCheck.hasConflict ? {
          hasConflict: true,
          conflicts: conflictCheck.conflicts.map(c => ({
            caseNumber: c.caseNumber,
            dateFiled: c.dateFiled,
            confidence: c.confidence
          }))
        } : null,

        // Signal 3: LinkedIn connections
        linkedinData: linkedinData ? {
          mutualConnectionsCount: linkedinData.mutualConnectionsCount,
          relationshipStrength: linkedinData.relationshipStrength
        } : null,

        // Signal 4: Affiliations
        affiliations: mediator.affiliations || [],

        // Signal 5: Donations (from biasIndicators)
        donations: mediator.biasIndicators?.donationHistory || [],

        // Signal 6: Public statements (from biasIndicators)
        publicStatements: mediator.biasIndicators?.publicStatements || []
      };

      // Calculate multi-signal bias score
      const biasAssessment = multiSignalBiasDetection.calculateBiasScore(signals);

      // Also get traditional conflict analysis for comparison
      const affiliationConflicts = this._checkAffiliationConflicts(
        mediator,
        opposingCounsel,
        currentParty
      );
      const traditionalRisk = this._calculateOverallRisk(
        conflictCheck,
        affiliationConflicts,
        linkedinData,
        outcomeAnalysis
      );

      return {
        success: true,
        mediatorId: mediator._id,
        mediatorName: mediator.name,

        // Multi-signal bias assessment
        biasScore: biasAssessment.biasScore,
        biasLevel: biasAssessment.biasLevel,
        recommendation: biasAssessment.recommendation,
        activeSignals: biasAssessment.activeSignals,
        signalBreakdown: biasAssessment.breakdown,

        // Traditional risk assessment (for comparison)
        traditionalRiskLevel: traditionalRisk.riskLevel,
        traditionalRecommendation: traditionalRisk.recommendation,

        // Data sources
        dataSources: {
          recap: recapResults.total > 0,
          linkedin: linkedinData !== null,
          affiliations: mediator.affiliations?.length > 0,
          donations: signals.donations.length > 0,
          publicStatements: signals.publicStatements.length > 0
        },

        metadata: {
          signalCount: biasAssessment.signalCount,
          totalWeight: biasAssessment.totalWeight,
          calculatedAt: new Date()
        }
      };

    } catch (error) {
      logger.error('Comprehensive bias calculation failed', {
        mediatorId,
        opposingCounsel,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new ConflictAnalysisService();
