/**
 * Shared Sanitization Utilities
 * DRY utility to eliminate duplicate sanitization logic
 */

const sanitizeHtml = require('sanitize-html');
const mongoSanitize = require('express-mongo-sanitize');

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} dirty - Potentially unsafe HTML string
 * @returns {string} - Sanitized HTML string
 */
const sanitizeString = (dirty) => {
  if (typeof dirty !== 'string') {
    return dirty;
  }

  return sanitizeHtml(dirty, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'recursiveEscape'
  });
};

/**
 * Recursively sanitize object properties
 * Removes HTML tags and MongoDB operators
 * @param {Object|Array|string} obj - Object to sanitize
 * @returns {Object|Array|string} - Sanitized object
 */
const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Remove MongoDB operators ($, .)
        const sanitizedKey = key.replace(/\$/g, '').replace(/\./g, '');
        sanitized[sanitizedKey] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
};

/**
 * Sanitize request body middleware
 * Applies HTML and MongoDB sanitization
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const sanitizeRequest = (req, res, next) => {
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
 * Escape special regex characters in a string to prevent ReDoS attacks.
 * Use this whenever building a RegExp from user-supplied or external input.
 * @param {string} str - Input string (potentially from user)
 * @returns {string} - String safe to use inside new RegExp()
 */
const escapeRegex = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Remove dangerous characters from input
 * @param {string} input - Input string
 * @returns {string} - Sanitized string
 */
const removeDangerousChars = (input) => {
  if (typeof input !== 'string') {
    return input;
  }

  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/eval\(/gi, '')
    .replace(/expression\(/gi, '');
};

module.exports = {
  sanitizeString,
  sanitizeObject,
  sanitizeRequest,
  removeDangerousChars,
  escapeRegex
};
