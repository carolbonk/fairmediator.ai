/**
 * Netlify Serverless Function
 * Wraps the Express backend for serverless deployment
 */

const serverless = require('serverless-http');
const app = require('../../backend/src/server');

// Export handler for Netlify Functions
exports.handler = serverless(app);
