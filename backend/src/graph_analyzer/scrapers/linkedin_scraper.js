/**
 * LinkedIn Scraper - Professional Network Data
 *
 * Manual LinkedIn profile enrichment (user-initiated only).
 * Respects robots.txt and LinkedIn Terms of Service.
 *
 * IMPORTANT: This is NOT automated scraping. Users must manually provide
 * LinkedIn profile URLs, and we extract only PUBLIC profile data.
 *
 * @module graph_analyzer/scrapers/linkedin_scraper
 */

const axios = require('axios');
const BaseScraper = require('./base_scraper');
const logger = require('../../utils/logger');
const { Entity, Relationship } = require('../models/graph_schema');

class LinkedInScraper extends BaseScraper {
  constructor() {
    super('LinkedIn Scraper (Manual)', {
      rateLimit: 10, // 10 requests per minute
      timeout: 30000
    });
  }

  /**
   * Extract LinkedIn profile ID from URL
   *
   * @param {String} profileUrl - LinkedIn profile URL
   * @returns {String} Profile ID
   */
  extractProfileId(profileUrl) {
    const match = profileUrl.match(/linkedin\.com\/in\/([^/?]+)/);
    if (!match) {
      throw new Error('Invalid LinkedIn profile URL');
    }
    return match[1];
  }

  /**
   * Manual profile enrichment (user provides data)
   * This method does NOT scrape LinkedIn - it stores user-provided data
   *
   * @param {Object} profileData - User-provided LinkedIn profile data
   * @returns {Object} Enrichment result
   */
  async enrichProfile(profileData) {
    this.validateFields(profileData, ['mediatorId', 'linkedinUrl'], 'profile data');

    try {
      const profileId = this.extractProfileId(profileData.linkedinUrl);
      const entityId = `linkedin_${profileId}`;

      // Store LinkedIn profile as entity
      const entity = await Entity.findOneAndUpdate(
        { entityId },
        {
          entityType: 'Professional',
          entityId,
          name: profileData.fullName || 'Unknown',
          metadata: {
            linkedinUrl: profileData.linkedinUrl,
            profileId,
            headline: profileData.headline,
            location: profileData.location,
            connections: profileData.connections || 0,
            mutualConnections: profileData.mutualConnections || 0,
            currentCompany: profileData.currentCompany,
            pastCompanies: profileData.pastCompanies || [],
            education: profileData.education || [],
            skills: profileData.skills || []
          },
          dataSource: 'LINKEDIN',
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      );

      // Create relationship between mediator and LinkedIn profile
      const relationship = await Relationship.findOneAndUpdate(
        {
          sourceId: profileData.mediatorId,
          targetId: entityId,
          relationshipType: 'HAS_LINKEDIN_PROFILE'
        },
        {
          sourceType: 'Mediator',
          sourceId: profileData.mediatorId,
          targetType: 'Professional',
          targetId: entityId,
          relationshipType: 'HAS_LINKEDIN_PROFILE',
          weight: 0, // No conflict weight for self-relationship
          metadata: {
            connections: profileData.connections || 0,
            mutualConnections: profileData.mutualConnections || 0,
            verified: profileData.verified || false
          },
          confidence: profileData.verified ? 1.0 : 0.8,
          dataSource: 'LINKEDIN',
          lastVerified: new Date(),
          isActive: true
        },
        { upsert: true, new: true }
      );

      logger.info(`[LinkedIn] Enriched profile for ${profileData.fullName} (${profileData.mutualConnections || 0} mutual connections)`);

      return {
        success: true,
        entity,
        relationship,
        mutualConnections: profileData.mutualConnections || 0
      };

    } catch (error) {
      logger.error('[LinkedIn] Error enriching profile:', error);
      throw error;
    }
  }

  /**
   * Store mutual connection data between two profiles
   * This amplifies conflict risk when mediator has many mutual connections with opposing counsel
   *
   * @param {String} mediatorId - Mediator entity ID
   * @param {String} opposingCounselId - Opposing counsel entity ID
   * @param {Number} mutualConnectionCount - Number of mutual connections
   * @returns {Object} Relationship record
   */
  async storeMutualConnections(mediatorId, opposingCounselId, mutualConnectionCount) {
    // Weight mutual connections: 1 point per 10 connections (max 5 points)
    const weight = Math.min(Math.floor(mutualConnectionCount / 10), 5);

    const relationship = await Relationship.findOneAndUpdate(
      {
        sourceId: mediatorId,
        targetId: opposingCounselId,
        relationshipType: 'LINKEDIN_MUTUAL_CONNECTIONS'
      },
      {
        sourceType: 'Mediator',
        sourceId: mediatorId,
        targetType: 'Professional',
        targetId: opposingCounselId,
        relationshipType: 'LINKEDIN_MUTUAL_CONNECTIONS',
        weight,
        metadata: {
          mutualConnectionCount,
          lastChecked: new Date()
        },
        confidence: 0.9, // Manual data, high confidence
        dataSource: 'LINKEDIN',
        lastVerified: new Date(),
        isActive: true
      },
      { upsert: true, new: true }
    );

    logger.info(`[LinkedIn] Stored mutual connection relationship: ${mutualConnectionCount} connections (weight: ${weight})`);

    return relationship;
  }

  /**
   * Extract employment history and create WORKED_AT relationships
   *
   * @param {String} mediatorId - Mediator entity ID
   * @param {Array} employmentHistory - Array of employment records
   * @returns {Array} Created relationships
   */
  async storeEmploymentHistory(mediatorId, employmentHistory) {
    const relationships = [];

    for (const job of employmentHistory) {
      if (!job.company) continue;

      const companyId = `company_${this.normalizeEntityName(job.company)}`;

      // Create entity for company
      await Entity.findOneAndUpdate(
        { entityId: companyId },
        {
          entityType: 'LawFirm', // Assuming legal industry
          entityId: companyId,
          name: job.company,
          metadata: {
            industry: job.industry,
            location: job.location
          },
          dataSource: 'LINKEDIN',
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      );

      // Create WORKED_AT relationship
      const relationship = await Relationship.findOneAndUpdate(
        {
          sourceId: mediatorId,
          targetId: companyId,
          relationshipType: 'WORKED_AT'
        },
        {
          sourceType: 'Mediator',
          sourceId: mediatorId,
          targetType: 'LawFirm',
          targetId: companyId,
          relationshipType: 'WORKED_AT',
          weight: 10, // Employment = strong indicator
          metadata: {
            title: job.title,
            startDate: job.startDate,
            endDate: job.endDate,
            duration: job.duration,
            description: job.description
          },
          confidence: 0.95, // LinkedIn employment data is usually accurate
          dataSource: 'LINKEDIN',
          lastVerified: new Date(),
          isActive: !job.endDate // Still employed if no end date
        },
        { upsert: true, new: true }
      );

      relationships.push(relationship);
    }

    logger.info(`[LinkedIn] Stored ${relationships.length} employment relationships`);
    return relationships;
  }

  /**
   * Main scrape method - implements BaseScraper interface
   * NOTE: This doesn't actually "scrape" - it processes user-provided data
   *
   * @param {Object} params - Profile data provided by user
   * @returns {Object} Enrichment results
   */
  async scrape(params) {
    if (params.type === 'profile') {
      return this.enrichProfile(params.data);
    } else if (params.type === 'employment') {
      return this.storeEmploymentHistory(params.mediatorId, params.employmentHistory);
    } else if (params.type === 'mutualConnections') {
      return this.storeMutualConnections(
        params.mediatorId,
        params.opposingCounselId,
        params.mutualConnectionCount
      );
    } else {
      throw new Error('Invalid LinkedIn scrape type. Use: profile, employment, or mutualConnections');
    }
  }
}

module.exports = LinkedInScraper;
