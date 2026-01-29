/**
 * Netlify Function - Express Backend Wrapper
 *
 * This function wraps the entire Express backend and runs it as a serverless function.
 * All /api/* routes are handled by the Express app.
 *
 * Usage: /.netlify/functions/api/* → backend/src/server.js
 *
 * Environment Variables (set in Netlify Dashboard):
 * - MONGODB_URI
 * - JWT_SECRET
 * - JWT_REFRESH_SECRET
 * - HUGGINGFACE_API_KEY
 * - RESEND_API_KEY (optional)
 * - NODE_ENV=production
 */

const serverless = require('serverless-http');

// Netlify provides environment variables automatically
// No need to load .env file in production

// Import the Express app
const app = require('../../backend/src/server');

// Wrap Express app with serverless-http
const handler = serverless(app, {
  // Binary support for file uploads/downloads
  binary: ['image/*', 'application/pdf', 'application/octet-stream'],

  // Request/response customization
  request(request, event, context) {
    // Add Netlify context to request
    request.netlifyContext = context;
    request.netlifyEvent = event;
  }
});

// Export the serverless handler
exports.handler = async (event, context) => {
  // Connection reuse for MongoDB (important for serverless)
  context.callbackWaitsForEmptyEventLoop = false;

  // Handle the request
  return await handler(event, context);
};
