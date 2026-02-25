/**
 * Data Organizer Service
 * Converts unstructured text into structured JSON using structured prompting
 *
 * Use cases:
 * - Mediator bio parsing (extract name, credentials, practice areas, affiliations)
 * - RECAP case data structuring (extract parties, attorneys, outcomes)
 * - LinkedIn profile parsing (extract employment history, connections)
 * - FEC donation records (extract amounts, recipients, dates)
 *
 * This service uses HuggingFace Transformers API (100% FREE)
 */

const hfClient = require('../huggingface/hfClient');
const logger = require('../../config/logger');

class DataOrganizer {
  /**
   * System prompt for data organization
   */
  static SYSTEM_PROMPT = `Your task is to take the unstructured text provided and convert it into a well-organized table format using JSON. Identify the main entities, attributes, or categories mentioned in the text and use them as keys in the JSON object. Then, extract the relevant information from the text and populate the corresponding values in the JSON object. Ensure that the data is accurately represented and properly formatted within the JSON structure. The resulting JSON table should provide a clear, structured overview of the information presented in the original text.`;

  /**
   * Extract structured mediator profile from unstructured bio text
   * @param {string} bioText - Unstructured mediator bio
   * @returns {Object} Structured mediator data
   */
  async extractMediatorProfile(bioText) {
    const prompt = `${DataOrganizer.SYSTEM_PROMPT}

Extract the following fields from this mediator bio:
- name (full name)
- credentials (array of degrees, certifications)
- yearsExperience (number, if mentioned)
- practiceAreas (array of specializations)
- lawFirm (current firm name, if mentioned)
- previousEmployers (array of past firms/organizations)
- education (array of schools)
- barAdmissions (array of states)
- publications (array of article titles)
- memberships (array of professional organizations)

Bio text:
${bioText}

Return ONLY valid JSON with these fields. Use null for missing data. Example:
{
  "name": "John Smith",
  "credentials": ["J.D.", "LL.M."],
  "yearsExperience": 15,
  "practiceAreas": ["Employment Law", "Contract Disputes"],
  "lawFirm": "Smith & Associates",
  "previousEmployers": ["BigLaw LLP"],
  "education": ["Harvard Law School", "Yale University"],
  "barAdmissions": ["California", "New York"],
  "publications": ["Mediation in the Modern Age"],
  "memberships": ["American Bar Association"]
}`;

    try {
      const response = await hfClient.extractStructured(prompt);

      // Validate response structure
      if (!response || typeof response !== 'object') {
        logger.warn('Invalid response from data organizer', { bioText: bioText.slice(0, 100) });
        return this._fallbackMediatorExtraction(bioText);
      }

      return response;
    } catch (error) {
      logger.error('Data organizer extraction failed', { error: error.message });
      return this._fallbackMediatorExtraction(bioText);
    }
  }

  /**
   * Extract signals (employment, publications, memberships) from text
   * Returns normalized Signal objects for the Signal collection
   * @param {string} text - Unstructured text mentioning affiliations
   * @param {string} mediatorId - Mediator ID for reference
   * @returns {Array} Array of Signal objects
   */
  async extractSignals(text, mediatorId) {
    const prompt = `${DataOrganizer.SYSTEM_PROMPT}

Extract professional affiliations and activities from this text. Return JSON array with these signal types:
- EMPLOYMENT: Current or past employment at a firm/organization
- PUBLICATION: Authored articles, books, or papers
- MEMBERSHIP: Professional organization memberships (e.g., Federalist Society, ACS, bar associations)
- PANEL: Service on panels, committees, or boards
- SPEAKING: Conference presentations or lectures
- DONATION: Political donations (if mentioned)

For each signal, extract:
- type: One of the types above
- value: The firm name, publication title, organization name, etc.
- startDate: If mentioned (YYYY-MM-DD format or null)
- endDate: If mentioned (YYYY-MM-DD format or null)
- source: "bio" (since we're extracting from bio text)
- details: Any additional context

Text:
${text}

Return ONLY valid JSON array. Example:
[
  {
    "type": "EMPLOYMENT",
    "value": "Jones Day LLP",
    "startDate": "2015-01-01",
    "endDate": null,
    "source": "bio",
    "details": "Partner in the Labor & Employment practice"
  },
  {
    "type": "MEMBERSHIP",
    "value": "Federalist Society",
    "startDate": "2010-01-01",
    "endDate": null,
    "source": "bio",
    "details": "Active member since 2010"
  }
]`;

    try {
      const response = await hfClient.extractStructured(prompt);

      if (!Array.isArray(response)) {
        logger.warn('Invalid signal extraction response', { text: text.slice(0, 100) });
        return this._fallbackSignalExtraction(text);
      }

      // Add mediatorId to each signal
      return response.map(signal => ({
        ...signal,
        mediatorId,
        weight: this._calculateSignalWeight(signal.type),
        createdAt: new Date()
      }));
    } catch (error) {
      logger.error('Signal extraction failed', { error: error.message });
      return this._fallbackSignalExtraction(text);
    }
  }

  /**
   * Extract firm information with aliases
   * @param {string} text - Text mentioning law firms
   * @returns {Array} Array of Firm objects with aliases
   */
  async extractFirms(text) {
    const prompt = `${DataOrganizer.SYSTEM_PROMPT}

Extract law firm names and their common aliases from this text. Return JSON array with:
- name: Official firm name
- aliases: Array of alternate names (abbreviations, informal names, etc.)

Text:
${text}

Example:
[
  {
    "name": "Jones Day",
    "aliases": ["Jones, Day, Reavis & Pogue", "JD"]
  }
]`;

    try {
      const response = await hfClient.extractStructured(prompt);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      logger.error('Firm extraction failed', { error: error.message });
      return [];
    }
  }

  /**
   * Extract RECAP case data into structured format
   * @param {string} caseText - Unstructured case description from RECAP
   * @returns {Object} Structured case data
   */
  async extractCaseData(caseText) {
    const prompt = `${DataOrganizer.SYSTEM_PROMPT}

Extract case information from this court record text:
- docketNumber: Case number
- caseName: Full case name
- court: Court name
- dateFiled: Filing date (YYYY-MM-DD or null)
- parties: Array of party names
- attorneys: Array of attorney names with their firms
- outcome: Case outcome/status
- mediator: Mediator name if mentioned

Text:
${caseText}

Return ONLY valid JSON.`;

    try {
      return await hfClient.extractStructured(prompt);
    } catch (error) {
      logger.error('Case data extraction failed', { error: error.message });
      return null;
    }
  }

  /**
   * Calculate signal weight based on type
   * @private
   */
  _calculateSignalWeight(type) {
    const weights = {
      DONATION: 0.8,        // Strongest signal
      MEMBERSHIP: 0.7,      // Strong signal (e.g., Federalist Society)
      EMPLOYMENT: 0.6,      // Moderate signal
      PANEL: 0.5,           // Moderate signal
      PUBLICATION: 0.4,     // Weaker signal (depends on content)
      SPEAKING: 0.3         // Weak signal
    };
    return weights[type] || 0.3;
  }

  /**
   * Fallback mediator extraction using regex
   * @private
   */
  _fallbackMediatorExtraction(bioText) {
    const nameMatch = bioText.match(/(?:^|\n)([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
    const credentialsMatch = bioText.match(/\b(J\.?D\.?|LL\.?M\.?|Ph\.?D\.?|Esq\.?)\b/gi);
    const yearsMatch = bioText.match(/(\d{1,2})\+?\s*years?\s*(?:of\s*)?experience/i);

    return {
      name: nameMatch ? nameMatch[1] : null,
      credentials: credentialsMatch || [],
      yearsExperience: yearsMatch ? parseInt(yearsMatch[1]) : null,
      practiceAreas: [],
      lawFirm: null,
      previousEmployers: [],
      education: [],
      barAdmissions: [],
      publications: [],
      memberships: []
    };
  }

  /**
   * Fallback signal extraction using keyword matching
   * @private
   */
  _fallbackSignalExtraction(text) {
    const signals = [];

    // Check for Federalist Society
    if (/federalist society/i.test(text)) {
      signals.push({
        type: 'MEMBERSHIP',
        value: 'Federalist Society',
        startDate: null,
        endDate: null,
        source: 'bio',
        details: 'Mentioned in bio',
        weight: 0.9
      });
    }

    // Check for ACS
    if (/american constitution society/i.test(text)) {
      signals.push({
        type: 'MEMBERSHIP',
        value: 'American Constitution Society',
        startDate: null,
        endDate: null,
        source: 'bio',
        details: 'Mentioned in bio',
        weight: 0.7
      });
    }

    return signals;
  }
}

module.exports = new DataOrganizer();
