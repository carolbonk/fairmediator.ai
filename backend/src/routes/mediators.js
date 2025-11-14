/**
 * Mediator Routes
 * CRUD operations for mediator profiles with authentication and usage tracking
 * Now using FREE Hugging Face models!
 *
 * DRY: Reuses auth middleware, usage tracking, and validation patterns
 */

const express = require('express');
const router = express.Router();
const Mediator = require('../models/Mediator');
const UsageLog = require('../models/UsageLog');
const { authenticate, optionalAuth, checkUsageLimit } = require('../middleware/auth');
const ideologyClassifier = require('../services/huggingface/ideologyClassifier');

/**
 * GET /api/mediators
 * Search mediators with optional filtering
 * DRY: Reuses authentication and usage tracking middleware
 *
 * Free tier: 5 searches/day
 * Premium: Unlimited
 */
router.get('/', authenticate, checkUsageLimit('search'), async (req, res) => {
  try {
    const {
      practiceArea,
      location,
      ideology,
      minExperience,
      excludeAffiliations, // Comma-separated list of entities to avoid conflicts
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    if (practiceArea) {
      query.practiceAreas = { $in: [practiceArea] };
    }

    if (location) {
      query['location.state'] = new RegExp(location, 'i');
    }

    if (ideology) {
      const ideologyMap = {
        'liberal': { $lte: -1 },
        'conservative': { $gte: 1 },
        'neutral': { $gt: -1, $lt: 1 }
      };
      query.ideologyScore = ideologyMap[ideology.toLowerCase()];
    }

    if (minExperience) {
      query.yearsExperience = { $gte: parseInt(minExperience) };
    }

    // Filter out mediators with conflicting affiliations
    if (excludeAffiliations) {
      const excludeList = excludeAffiliations.split(',').map(e => e.trim());
      query['knownAffiliations.entity'] = { $nin: excludeList };
    }

    const mediators = await Mediator.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ rating: -1, yearsExperience: -1 });

    const total = await Mediator.countDocuments(query);

    // Increment usage counter
    await req.user.incrementSearch();

    // Log usage for analytics
    await UsageLog.create({
      user: req.user._id,
      eventType: 'search',
      metadata: {
        filters: { practiceArea, location, ideology, minExperience, excludeAffiliations },
        resultCount: mediators.length,
        page: parseInt(page)
      }
    });

    res.json({
      success: true,
      data: mediators,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      usage: {
        searchesToday: req.user.usageStats.searchesToday,
        searchLimit: req.user.subscriptionTier === 'premium' ? 'unlimited' : 5
      }
    });
  } catch (error) {
    console.error('Get mediators error:', error);
    res.status(500).json({ error: 'Failed to fetch mediators' });
  }
});

/**
 * GET /api/mediators/:id
 * Get detailed mediator profile
 * DRY: Reuses authentication and usage tracking middleware
 *
 * Free tier: 10 profile views/day
 * Premium: Unlimited
 */
router.get('/:id', authenticate, checkUsageLimit('profileView'), async (req, res) => {
  try {
    const mediator = await Mediator.findById(req.params.id);

    if (!mediator) {
      return res.status(404).json({ error: 'Mediator not found' });
    }

    // Increment profile view counter
    await req.user.incrementProfileView();

    // Log usage for analytics
    await UsageLog.create({
      user: req.user._id,
      eventType: 'profile_view',
      metadata: {
        mediatorId: mediator._id,
        mediatorName: mediator.name,
        ideologyScore: mediator.ideologyScore
      }
    });

    res.json({
      success: true,
      data: mediator,
      usage: {
        profileViewsToday: req.user.usageStats.profileViewsToday,
        profileViewLimit: req.user.subscriptionTier === 'premium' ? 'unlimited' : 10
      }
    });
  } catch (error) {
    console.error('Get mediator error:', error);
    res.status(500).json({ error: 'Failed to fetch mediator' });
  }
});

/**
 * POST /api/mediators
 * Create a new mediator profile
 */
router.post('/', async (req, res) => {
  try {
    const mediator = new Mediator(req.body);
    mediator.calculateCompleteness();
    
    await mediator.save();
    
    res.status(201).json({
      success: true,
      data: mediator
    });
  } catch (error) {
    console.error('Create mediator error:', error);
    res.status(500).json({ error: 'Failed to create mediator' });
  }
});

/**
 * PUT /api/mediators/:id
 * Update a mediator profile
 */
router.put('/:id', async (req, res) => {
  try {
    const mediator = await Mediator.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastUpdated: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!mediator) {
      return res.status(404).json({ error: 'Mediator not found' });
    }
    
    mediator.calculateCompleteness();
    await mediator.save();
    
    res.json({
      success: true,
      data: mediator
    });
  } catch (error) {
    console.error('Update mediator error:', error);
    res.status(500).json({ error: 'Failed to update mediator' });
  }
});

/**
 * POST /api/mediators/check-conflicts
 * Check for affiliation conflicts across multiple mediators
 * DRY: Reuses authentication middleware
 *
 * Premium feature - requires premium subscription
 */
router.post('/check-conflicts', authenticate, async (req, res) => {
  try {
    const { mediatorIds, parties } = req.body;

    if (!mediatorIds || !Array.isArray(mediatorIds) || mediatorIds.length === 0) {
      return res.status(400).json({ error: 'mediatorIds array is required' });
    }

    if (!parties || !Array.isArray(parties) || parties.length === 0) {
      return res.status(400).json({ error: 'parties array is required' });
    }

    // Get mediators with their affiliations
    const mediators = await Mediator.find({ _id: { $in: mediatorIds } });

    // Check each mediator against all parties
    const conflicts = mediators.map(mediator => {
      const mediatorConflicts = [];

      // Check known affiliations against parties
      if (mediator.knownAffiliations && mediator.knownAffiliations.length > 0) {
        for (const party of parties) {
          for (const affiliation of mediator.knownAffiliations) {
            // Simple string matching - could be enhanced with fuzzy matching
            if (
              affiliation.entity.toLowerCase().includes(party.name.toLowerCase()) ||
              party.name.toLowerCase().includes(affiliation.entity.toLowerCase())
            ) {
              mediatorConflicts.push({
                party: party.name,
                affiliation: affiliation.entity,
                riskLevel: affiliation.riskLevel,
                type: affiliation.type,
                details: affiliation.details
              });
            }
          }
        }
      }

      return {
        mediatorId: mediator._id,
        mediatorName: mediator.name,
        conflicts: mediatorConflicts,
        hasConflicts: mediatorConflicts.length > 0
      };
    });

    // Log usage
    await UsageLog.create({
      user: req.user._id,
      eventType: 'conflict_check',
      metadata: {
        mediatorCount: mediatorIds.length,
        partyCount: parties.length,
        conflictsFound: conflicts.filter(c => c.hasConflicts).length
      }
    });

    res.json({
      success: true,
      data: {
        mediators: conflicts,
        summary: {
          totalChecked: mediators.length,
          withConflicts: conflicts.filter(c => c.hasConflicts).length,
          withoutConflicts: conflicts.filter(c => !c.hasConflicts).length
        }
      }
    });
  } catch (error) {
    console.error('Conflict check error:', error);
    res.status(500).json({ error: 'Failed to check conflicts' });
  }
});

/**
 * POST /api/mediators/:id/analyze-ideology
 * Trigger ideology classification for a mediator
 */
router.post('/:id/analyze-ideology', async (req, res) => {
  try {
    const mediator = await Mediator.findById(req.params.id);
    
    if (!mediator) {
      return res.status(404).json({ error: 'Mediator not found' });
    }
    
    const analysis = await ideologyClassifier.classifyIdeology(mediator);
    
    // Update mediator with analysis results
    mediator.ideologyScore = analysis.score;
    mediator.ideologyLabel = analysis.label;
    mediator.ideologyConfidence = analysis.confidence;
    mediator.ideologyAnalysis = {
      factors: analysis.factors,
      summary: analysis.summary,
      analyzedAt: new Date()
    };
    
    await mediator.save();
    
    res.json({
      success: true,
      data: {
        mediator,
        analysis
      }
    });
  } catch (error) {
    console.error('Ideology analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze ideology' });
  }
});

module.exports = router;
