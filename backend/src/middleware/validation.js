/**
 * Validation Middleware
 * Provides input validation using Joi for all API routes
 * Security: Prevents injection attacks and ensures data integrity
 */

const Joi = require('joi');

/**
 * Generic validation middleware factory
 * @param {Object} schema - Joi schema object with body, query, params
 * @returns {Function} Express middleware function
 */
const validate = (schema) => {
  return (req, res, next) => {
    const validationOptions = {
      abortEarly: false, // Return all errors
      allowUnknown: false, // Reject unknown fields
      stripUnknown: true, // Remove unknown fields
    };

    // Validate each part of the request
    const toValidate = {};
    if (schema.body) toValidate.body = req.body;
    if (schema.query) toValidate.query = req.query;
    if (schema.params) toValidate.params = req.params;

    const { error, value } = Joi.object(schema).validate(toValidate, validationOptions);

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type,
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
    }

    // Replace request values with validated values
    if (schema.body) req.body = value.body;
    if (schema.query) req.query = value.query;
    if (schema.params) req.params = value.params;

    next();
  };
};

/**
 * Sanitize string to prevent XSS
 * Removes potentially dangerous HTML/script tags
 */
const sanitizeString = (value, helpers) => {
  if (typeof value !== 'string') return value;

  // Remove script tags and event handlers
  const sanitized = value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '');

  return sanitized.trim();
};

/**
 * Custom Joi string validator with XSS protection
 */
const sanitizedString = Joi.string().custom(sanitizeString);

/**
 * Password validation rules
 * Enforces strong password policies
 */
const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .required()
  .messages({
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password must not exceed 128 characters',
  });

/**
 * Email validation
 */
const emailSchema = Joi.string()
  .email()
  .lowercase()
  .trim()
  .max(255)
  .required()
  .messages({
    'string.email': 'Please provide a valid email address',
  });

/**
 * MongoDB ObjectId validation
 */
const objectIdSchema = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .required()
  .messages({
    'string.pattern.base': 'Invalid ID format',
  });

/**
 * Pagination validation
 */
const paginationSchema = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
};

module.exports = {
  validate,
  sanitizedString,
  passwordSchema,
  emailSchema,
  objectIdSchema,
  paginationSchema,
};
