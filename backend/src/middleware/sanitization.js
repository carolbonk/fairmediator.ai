/**
 * Input Sanitization Middleware
 * Prevents XSS attacks by sanitizing user input
 */

const sanitizeHtml = require('sanitize-html');
const mongoSanitize = require('express-mongo-sanitize');

/**
 * Sanitize HTML to prevent XSS attacks
 * Allows only safe HTML tags and attributes
 */
const sanitizeOptions = {
  allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
  allowedAttributes: {
    'a': ['href', 'title']
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  textFilter: function(text) {
    // Remove any remaining script-like patterns
    return text.replace(/javascript:/gi, '')
               .replace(/on\w+\s*=/gi, '');
  }
};

/**
 * Sanitize string input
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return sanitizeHtml(str, sanitizeOptions).trim();
};

/**
 * Recursively sanitize object
 */
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Express middleware to sanitize request body, query, and params
 */
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

/**
 * MongoDB injection protection middleware
 * Removes any keys that start with '$' or contain '.'
 */
const mongoSanitizeMiddleware = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Potential MongoDB injection attempt detected: ${key} in ${req.originalUrl}`);
  }
});

module.exports = {
  sanitizeInput,
  sanitizeString,
  sanitizeObject,
  mongoSanitizeMiddleware
};
