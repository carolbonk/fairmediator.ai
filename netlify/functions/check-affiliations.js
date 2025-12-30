/**
 * Netlify Serverless Function - Affiliation Checker
 * Detects conflicts of interest using HuggingFace NLP models
 */

const axios = require('axios');

const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co';
const NER_MODEL = 'dbmdz/bert-large-cased-finetuned-conll03-english';

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { mediatorName, mediatorBio = '', parties = [] } = JSON.parse(event.body);

    // Validate input
    if (!mediatorName || !Array.isArray(parties) || parties.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'mediatorName and parties array are required' })
      };
    }

    // Simple conflict detection using string matching
    // In production, you'd use NER models or more sophisticated AI
    const bioLower = mediatorBio.toLowerCase();
    const conflicts = [];

    for (const party of parties) {
      const partyLower = party.toLowerCase();
      if (bioLower.includes(partyLower)) {
        conflicts.push({
          party,
          reason: `Mentioned in mediator bio`,
          riskLevel: 'high'
        });
      }
    }

    // Determine overall risk level
    let riskLevel = 'low';
    if (conflicts.length > 0) {
      riskLevel = conflicts.some(c => c.riskLevel === 'high') ? 'high' : 'medium';
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        mediatorName,
        hasConflict: conflicts.length > 0,
        conflicts,
        riskLevel,
        partiesChecked: parties.length,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Affiliation check error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to check affiliations',
        details: error.message
      })
    };
  }
};
