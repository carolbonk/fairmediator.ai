/**
 * Intelligent Document Processing (IDP) Service
 * Uses existing BERT + DeBERTa models to extract structured data from documents
 * FREE TIER - No new dependencies
 */

const hfClient = require('../huggingface/hfClient');
const logger = require('../../config/logger');

class IDPService {
  constructor() {
    this.initialized = true;
  }

  /**
   * Process PDF/document and extract mediator information
   * @param {string} textContent - Extracted text from PDF
   * @returns {object} Structured mediator data
   */
  async processDocument(textContent) {
    try {
      logger.info('Processing document for mediator data extraction');

      // Extract entities using NER (use existing BERT model)
      const entities = await this.extractEntities(textContent);

      // Classify document type
      const docType = await this.classifyDocumentType(textContent);

      // Extract structured fields based on document type
      const structuredData = await this.extractStructuredData(textContent, docType, entities);

      return {
        success: true,
        documentType: docType,
        data: structuredData,
        entities,
        confidence: this.calculateConfidence(structuredData)
      };
    } catch (error) {
      logger.error('Document processing failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Extract named entities using BERT
   * (Leveraging existing HuggingFace integration)
   */
  async extractEntities(text) {
    try {
      // Use HuggingFace NER model (BERT-based)
      const response = await hfClient.makeRequest(
        'dslim/bert-base-NER',  // Free BERT NER model
        { inputs: text.substring(0, 1000) }  // Limit for free tier
      );

      if (!Array.isArray(response)) {
        return [];
      }

      // Group entities by type
      const entities = {
        persons: [],
        organizations: [],
        locations: [],
        dates: [],
        other: []
      };

      response.forEach(ent => {
        const type = ent.entity_group || ent.entity;
        const value = ent.word;

        if (type.includes('PER')) entities.persons.push(value);
        else if (type.includes('ORG')) entities.organizations.push(value);
        else if (type.includes('LOC')) entities.locations.push(value);
        else if (type.includes('DATE') || type.includes('TIME')) entities.dates.push(value);
        else entities.other.push(value);
      });

      return entities;
    } catch (error) {
      logger.warn('Entity extraction failed, using fallback:', error.message);
      return this.fallbackEntityExtraction(text);
    }
  }

  /**
   * Classify document type using patterns and keywords
   * (Rule-based - FREE, no AI tokens)
   */
  classifyDocumentType(text) {
    const lowerText = text.toLowerCase();

    // Bar association directory
    if (lowerText.includes('bar association') ||
        lowerText.includes('attorney directory') ||
        lowerText.includes('member roster')) {
      return 'bar_directory';
    }

    // Mediator profile/CV
    if (lowerText.includes('curriculum vitae') ||
        lowerText.includes('professional experience') ||
        lowerText.includes('education') && lowerText.includes('bar admission')) {
      return 'mediator_cv';
    }

    // Court opinion mentioning mediator
    if (lowerText.includes('opinion') &&
        (lowerText.includes('mediator') || lowerText.includes('mediation'))) {
      return 'court_opinion';
    }

    // Mediator organization listing
    if (lowerText.includes('roster') ||
        lowerText.includes('panel') ||
        lowerText.includes('mediator list')) {
      return 'organization_listing';
    }

    return 'unknown';
  }

  /**
   * Extract structured data based on document type
   */
  async extractStructuredData(text, docType, entities) {
    const data = {};

    // Extract name (use first person found or parse from common patterns)
    data.name = entities.persons[0] || this.extractNamePattern(text);

    // Extract bar number using regex
    data.barNumber = this.extractBarNumber(text);

    // Extract location
    data.location = entities.locations[0] || this.extractLocation(text);

    // Extract specializations using keyword matching
    data.specializations = this.extractSpecializations(text);

    // Extract years of experience
    data.yearsExperience = this.extractExperience(text);

    // Extract education
    data.education = this.extractEducation(text, entities);

    // Extract contact info
    data.contact = this.extractContactInfo(text);

    // Extract practice areas
    data.practiceAreas = this.extractPracticeAreas(text);

    return data;
  }

  /**
   * Fallback entity extraction using regex patterns
   * FREE - No AI calls
   */
  fallbackEntityExtraction(text) {
    const entities = {
      persons: [],
      organizations: [],
      locations: [],
      dates: [],
      other: []
    };

    // Extract names (Mr., Ms., Dr., followed by capitalized words)
    const namePattern = /(?:Mr\.|Ms\.|Dr\.|Prof\.)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/g;
    let match;
    while ((match = namePattern.exec(text)) !== null) {
      entities.persons.push(match[1]);
    }

    // Extract states (CA, NY, etc.)
    const statePattern = /\b([A-Z]{2})\b/g;
    while ((match = statePattern.exec(text)) !== null) {
      if (match[1].length === 2) {
        entities.locations.push(match[1]);
      }
    }

    return entities;
  }

  /**
   * Extract bar number using common patterns
   */
  extractBarNumber(text) {
    const patterns = [
      /bar\s+(?:number|#|no\.?)\s*:?\s*(\d{5,10})/i,
      /(?:state\s+)?bar\s+id\s*:?\s*(\d{5,10})/i,
      /license\s+(?:number|#|no\.?)\s*:?\s*(\d{5,10})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }

    return null;
  }

  /**
   * Extract location from text
   */
  extractLocation(text) {
    const cityStatePattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s+([A-Z]{2})/;
    const match = text.match(cityStatePattern);
    if (match) {
      return { city: match[1], state: match[2] };
    }
    return null;
  }

  /**
   * Extract specializations using keywords
   */
  extractSpecializations(text) {
    const specializations = [
      'employment', 'family', 'commercial', 'real estate', 'ip', 'intellectual property',
      'personal injury', 'medical malpractice', 'construction', 'securities',
      'environmental', 'labor', 'divorce', 'custody', 'contract'
    ];

    const found = [];
    const lowerText = text.toLowerCase();

    specializations.forEach(spec => {
      if (lowerText.includes(spec)) {
        found.push(spec);
      }
    });

    return found;
  }

  /**
   * Extract years of experience
   */
  extractExperience(text) {
    const patterns = [
      /(\d+)\+?\s+years?\s+of\s+experience/i,
      /experience:\s*(\d+)\s+years?/i,
      /admitted\s+to\s+practice\s+since\s+(\d{4})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const value = parseInt(match[1]);
        // If it's a year (like 1995), calculate years from that
        if (value > 1900) {
          return new Date().getFullYear() - value;
        }
        return value;
      }
    }

    return null;
  }

  /**
   * Extract education
   */
  extractEducation(text, entities) {
    const schools = [];

    // Look for common law school patterns
    const lawSchoolPattern = /(University\s+of\s+[A-Z][a-z]+|[A-Z][a-z]+\s+University|[A-Z][a-z]+\s+Law\s+School)/g;
    let match;
    while ((match = lawSchoolPattern.exec(text)) !== null) {
      schools.push(match[1]);
    }

    // Also check entities for organizations that might be schools
    entities.organizations?.forEach(org => {
      if (org.toLowerCase().includes('university') || org.toLowerCase().includes('school')) {
        schools.push(org);
      }
    });

    return [...new Set(schools)]; // Remove duplicates
  }

  /**
   * Extract contact information
   */
  extractContactInfo(text) {
    const contact = {};

    // Email
    const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
    const emailMatch = text.match(emailPattern);
    if (emailMatch) contact.email = emailMatch[1];

    // Phone
    const phonePattern = /(\+?1?\s*\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/;
    const phoneMatch = text.match(phonePattern);
    if (phoneMatch) contact.phone = phoneMatch[1];

    return contact;
  }

  /**
   * Extract practice areas
   */
  extractPracticeAreas(text) {
    const areas = [
      'Civil Litigation', 'Family Law', 'Employment Law', 'Commercial Disputes',
      'Real Estate', 'Intellectual Property', 'Personal Injury', 'Medical Malpractice',
      'Construction', 'Securities', 'Environmental Law', 'Labor Law'
    ];

    const found = [];
    const lowerText = text.toLowerCase();

    areas.forEach(area => {
      if (lowerText.includes(area.toLowerCase())) {
        found.push(area);
      }
    });

    return found;
  }

  /**
   * Extract name using common patterns
   */
  extractNamePattern(text) {
    // Try to find name after common prefixes
    const patterns = [
      /Name:\s*([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
      /^([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/m,  // First line
      /(?:Mr\.|Ms\.|Dr\.)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }

    return null;
  }

  /**
   * Calculate confidence score for extracted data
   */
  calculateConfidence(data) {
    let score = 0;
    let total = 0;

    const fields = ['name', 'barNumber', 'location', 'specializations', 'yearsExperience'];
    fields.forEach(field => {
      total++;
      if (data[field] && (Array.isArray(data[field]) ? data[field].length > 0 : data[field])) {
        score++;
      }
    });

    return (score / total) * 100;
  }

  /**
   * Parse PDF text (requires pdf-parse npm package)
   * Note: pdf-parse is free and lightweight
   */
  async parsePDF(pdfBuffer) {
    try {
      // Check if pdf-parse is available
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(pdfBuffer);
      return data.text;
    } catch (error) {
      logger.warn('pdf-parse not available. Install with: npm install pdf-parse');
      throw new Error('PDF parsing requires pdf-parse package. Run: npm install pdf-parse');
    }
  }

  /**
   * Process PDF buffer and extract mediator data
   */
  async processPDF(pdfBuffer) {
    const text = await this.parsePDF(pdfBuffer);
    return await this.processDocument(text);
  }
}

module.exports = new IDPService();
