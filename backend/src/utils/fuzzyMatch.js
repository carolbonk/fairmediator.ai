/**
 * Fuzzy Matching Utility
 * Implements Levenshtein distance for typo-tolerant search
 *
 * Examples:
 * - "divorse" → "divorce" (distance: 1)
 * - "empoyment" → "employment" (distance: 1)
 * - "arbitraton" → "arbitration" (distance: 1)
 */

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Edit distance (number of changes needed)
 */
function levenshteinDistance(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  const len1 = s1.length;
  const len2 = s2.length;

  // Create 2D array for dynamic programming
  const dp = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  // Initialize base cases
  for (let i = 0; i <= len1; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    dp[0][j] = j;
  }

  // Fill the DP table
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]; // No change needed
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // Deletion
          dp[i][j - 1] + 1,     // Insertion
          dp[i - 1][j - 1] + 1  // Substitution
        );
      }
    }
  }

  return dp[len1][len2];
}

/**
 * Check if two strings are similar within a threshold
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @param {number} maxDistance - Maximum edit distance (default: 2)
 * @returns {boolean} True if strings are similar
 */
function isSimilar(str1, str2, maxDistance = 2) {
  // Quick optimization: if length difference > maxDistance, can't be similar
  if (Math.abs(str1.length - str2.length) > maxDistance) {
    return false;
  }

  const distance = levenshteinDistance(str1, str2);
  return distance <= maxDistance;
}

/**
 * Calculate similarity ratio (0-1 scale, 1 = identical)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity ratio (0-1)
 */
function similarityRatio(str1, str2) {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1.0;

  const distance = levenshteinDistance(str1, str2);
  return 1 - (distance / maxLen);
}

/**
 * Find best fuzzy match from array of candidates
 * @param {string} query - Search query
 * @param {array} candidates - Array of candidate strings
 * @param {object} options - Options { threshold: 0.7, maxResults: 5 }
 * @returns {array} Array of matches with scores
 */
function fuzzySearch(query, candidates, options = {}) {
  const {
    threshold = 0.7,    // Minimum similarity ratio
    maxResults = 5,     // Maximum number of results
    maxDistance = 2     // Maximum edit distance
  } = options;

  const matches = [];

  for (const candidate of candidates) {
    const ratio = similarityRatio(query, candidate);
    const distance = levenshteinDistance(query, candidate);

    if (ratio >= threshold || distance <= maxDistance) {
      matches.push({
        match: candidate,
        similarity: ratio,
        distance: distance,
        score: ratio // Use similarity as score
      });
    }
  }

  // Sort by score (descending)
  matches.sort((a, b) => b.score - a.score);

  return matches.slice(0, maxResults);
}

/**
 * Expand query with fuzzy matches from a dictionary
 * @param {string} query - Original search query
 * @param {array} dictionary - Array of valid terms
 * @param {object} options - Options { maxDistance: 1, maxExpansions: 3 }
 * @returns {array} Array of expanded terms
 */
function expandQueryWithFuzzy(query, dictionary, options = {}) {
  const {
    maxDistance = 1,      // Maximum typo distance
    maxExpansions = 3     // Maximum number of fuzzy matches to add
  } = options;

  const words = query.toLowerCase().split(/\s+/);
  const expandedTerms = new Set([query]); // Always include original

  words.forEach(word => {
    if (word.length < 4) return; // Skip short words (likely correct)

    // Find fuzzy matches in dictionary
    const matches = dictionary.filter(term =>
      isSimilar(word, term, maxDistance) && word !== term
    );

    // Add top matches
    matches.slice(0, maxExpansions).forEach(match => {
      expandedTerms.add(match);
      // Also add original query with corrected word
      const correctedQuery = query.replace(new RegExp(word, 'i'), match);
      expandedTerms.add(correctedQuery);
    });
  });

  return Array.from(expandedTerms);
}

/**
 * Suggest corrections for misspelled words
 * @param {string} word - Potentially misspelled word
 * @param {array} dictionary - Array of correct words
 * @param {number} maxSuggestions - Maximum suggestions (default: 3)
 * @returns {array} Array of suggestions
 */
function suggestCorrections(word, dictionary, maxSuggestions = 3) {
  const suggestions = fuzzySearch(word, dictionary, {
    threshold: 0.6,
    maxResults: maxSuggestions,
    maxDistance: 2
  });

  return suggestions.map(s => ({
    suggestion: s.match,
    confidence: s.similarity,
    distance: s.distance
  }));
}

module.exports = {
  levenshteinDistance,
  isSimilar,
  similarityRatio,
  fuzzySearch,
  expandQueryWithFuzzy,
  suggestCorrections
};
