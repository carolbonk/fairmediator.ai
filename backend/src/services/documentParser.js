/**
 * Document Parser Service
 * Extracts text and metadata from uploaded legal documents
 * Supports: PDF, Word (.docx), and plain text files
 * FREE/OPEN-SOURCE ONLY - No paid APIs
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * CASE TYPE PATTERNS
 * Add more patterns as needed for different case types
 */
const CASE_TYPE_PATTERNS = {
  employment: /employment|workplace|discrimination|wrongful termination|harassment|labor dispute/i,
  business: /business|commercial|contract|breach|partnership|corporate/i,
  family: /divorce|custody|child support|alimony|domestic|family law/i,
  property: /property|real estate|landlord|tenant|lease|eviction/i,
  personal_injury: /personal injury|accident|negligence|malpractice|tort/i,
  intellectual_property: /patent|trademark|copyright|ip|intellectual property/i,
  construction: /construction|building|contractor|defect|mechanics lien/i,
  insurance: /insurance|claim|coverage|bad faith|subrogation/i,
  probate: /probate|estate|will|trust|inheritance/i,
  consumer: /consumer|fraud|warranty|debt collection|credit/i
};

/**
 * US CITY PATTERNS
 * Matches common city name patterns
 */
const CITY_PATTERN = /(?:in|at|located in|city of|county of)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s*([A-Z]{2})/g;

/**
 * PARTY NAME PATTERNS
 * Extracts opposing party names from legal documents
 */
const PARTY_PATTERNS = {
  vs: /(?:vs\.?|v\.?|versus)\s+([A-Z][A-Za-z\s&,\.]+?)(?:\n|,|;|\()/g,
  defendant: /defendant[s]?:?\s+([A-Z][A-Za-z\s&,\.]+?)(?:\n|,|;|\()/gi,
  respondent: /respondent[s]?:?\s+([A-Z][A-Za-z\s&,\.]+?)(?:\n|,|;|\()/gi,
  against: /against\s+([A-Z][A-Za-z\s&,\.]+?)(?:\n|,|;|\()/g
};

/**
 * SENTIMENT PATTERNS
 * Simple keyword-based sentiment analysis
 */
const SENTIMENT_PATTERNS = {
  frustrated: /frustrat|angry|upset|outraged|furious|dissatisfied/gi,
  urgent: /urgent|immediately|asap|emergency|critical|time-sensitive/gi,
  formal: /hereby|pursuant|whereas|therefore|aforementioned/gi,
  emotional: /devastated|heartbroken|traumatized|suffering|distressed/gi
};

class DocumentParser {
  /**
   * Parse text content and extract legal metadata
   * @param {string} text - Raw text content
   * @param {string} filename - Original filename for context
   * @returns {Object} Parsed document data
   */
  async parseText(text, filename = '') {
    try {
      const result = {
        caseType: this.extractCaseType(text),
        jurisdiction: this.extractJurisdiction(text),
        opposingParties: this.extractOpposingParties(text),
        sentiment: this.analyzeSentiment(text),
        keywords: this.extractKeywords(text),
        metadata: {
          filename,
          wordCount: text.split(/\s+/).length,
          characterCount: text.length,
          extractedAt: new Date()
        }
      };

      return result;
    } catch (error) {
      console.error('Document parsing error:', error);
      throw new Error('Failed to parse document');
    }
  }

  /**
   * Extract case type from document text
   * @param {string} text
   * @returns {string|null}
   */
  extractCaseType(text) {
    const lowerText = text.toLowerCase();

    // Count matches for each case type
    const scores = {};
    for (const [type, pattern] of Object.entries(CASE_TYPE_PATTERNS)) {
      const matches = lowerText.match(pattern);
      scores[type] = matches ? matches.length : 0;
    }

    // Return type with highest score
    const bestMatch = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)[0];

    return bestMatch && bestMatch[1] > 0 ? bestMatch[0] : 'general';
  }

  /**
   * Extract jurisdiction (city and state) from document
   * @param {string} text
   * @returns {Object|null}
   */
  extractJurisdiction(text) {
    const cityMatches = [...text.matchAll(CITY_PATTERN)];

    if (cityMatches.length > 0) {
      // Return the first match (usually the most relevant)
      const [, city, state] = cityMatches[0];
      return {
        city: city.trim(),
        state: state.trim()
      };
    }

    // Try to extract just state mentions
    const stateMatch = text.match(/\b([A-Z]{2})\b/);
    if (stateMatch) {
      return {
        city: null,
        state: stateMatch[1]
      };
    }

    return null;
  }

  /**
   * Extract opposing party names
   * @param {string} text
   * @returns {Array<string>}
   */
  extractOpposingParties(text) {
    const parties = new Set();

    // Try each pattern
    for (const [, pattern] of Object.entries(PARTY_PATTERNS)) {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        if (match[1]) {
          // Clean up the party name
          const party = match[1]
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[,;]$/, '');

          if (party.length > 2 && party.length < 100) {
            parties.add(party);
          }
        }
      });
    }

    return Array.from(parties).slice(0, 5); // Limit to 5 parties
  }

  /**
   * Analyze sentiment from text
   * @param {string} text
   * @returns {Object}
   */
  analyzeSentiment(text) {
    const sentiment = {
      tone: 'neutral',
      confidence: 0,
      signals: []
    };

    let maxScore = 0;
    let dominantTone = 'neutral';

    for (const [tone, pattern] of Object.entries(SENTIMENT_PATTERNS)) {
      const matches = text.match(pattern);
      const score = matches ? matches.length : 0;

      if (score > 0) {
        sentiment.signals.push(tone);
      }

      if (score > maxScore) {
        maxScore = score;
        dominantTone = tone;
      }
    }

    sentiment.tone = dominantTone;
    sentiment.confidence = Math.min(maxScore * 20, 100); // Scale to percentage

    return sentiment;
  }

  /**
   * Extract important keywords
   * @param {string} text
   * @returns {Array<string>}
   */
  extractKeywords(text) {
    // Common legal stopwords to exclude
    const stopwords = new Set([
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
      'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
      'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she'
    ]);

    // Extract words (3+ characters, capitalized or frequent)
    const words = text.toLowerCase()
      .match(/\b[a-z]{3,}\b/g) || [];

    // Count frequency
    const frequency = {};
    words.forEach(word => {
      if (!stopwords.has(word)) {
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });

    // Return top 10 keywords
    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Parse uploaded file buffer
   * NOTE: For production, integrate proper PDF/DOCX parsers
   * Current implementation handles plain text only
   *
   * UPGRADE PATH:
   * - For PDF: Add 'pdf-parse' NPM package
   * - For DOCX: Add 'mammoth' NPM package
   *
   * @param {Buffer} buffer - File buffer
   * @param {string} mimetype - File MIME type
   * @param {string} filename - Original filename
   * @returns {Object} Parsed document data
   */
  async parseFile(buffer, mimetype, filename) {
    try {
      let text = '';

      // Handle different file types
      if (mimetype === 'text/plain' || filename.endsWith('.txt')) {
        text = buffer.toString('utf-8');
      }
      else if (mimetype === 'application/pdf' || filename.endsWith('.pdf')) {
        // TODO: Integrate pdf-parse package
        // const pdfParse = require('pdf-parse');
        // const data = await pdfParse(buffer);
        // text = data.text;

        // STUB: Return instruction for now
        throw new Error('PDF parsing requires pdf-parse package. Install with: npm install pdf-parse');
      }
      else if (mimetype.includes('word') || filename.endsWith('.docx')) {
        // TODO: Integrate mammoth package
        // const mammoth = require('mammoth');
        // const result = await mammoth.extractRawText({ buffer });
        // text = result.value;

        // STUB: Return instruction for now
        throw new Error('DOCX parsing requires mammoth package. Install with: npm install mammoth');
      }
      else {
        throw new Error('Unsupported file type. Please upload .txt, .pdf, or .docx files.');
      }

      // Parse the extracted text
      return await this.parseText(text, filename);
    } catch (error) {
      console.error('File parsing error:', error);
      throw error;
    }
  }
}

module.exports = new DocumentParser();
