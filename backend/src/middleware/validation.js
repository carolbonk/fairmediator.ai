/**
 * Input Validation Middleware
 * Comprehensive Joi schemas for all API endpoints
 * Prevents injection attacks and ensures data integrity
 */

const Joi = require('joi');

/**
 * Validation middleware factory
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {string} property - Request property to validate ('body', 'query', 'params')
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true, // Remove unknown properties
      errors: {
        wrap: {
          label: '' // Don't wrap field names in quotes
        }
      }
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    // Replace request property with validated and sanitized value
    req[property] = value;
    next();
  };
};

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

const passwordSchema = Joi.string()
  .min(12)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .required()
  .messages({
    'string.min': 'Password must be at least 12 characters long',
    'string.max': 'Password must not exceed 128 characters',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
  });

const emailSchema = Joi.string()
  .email({ tlds: { allow: true } })
  .lowercase()
  .trim()
  .max(254) // RFC 5321
  .required()
  .messages({
    'string.email': 'Please provide a valid email address'
  });

const schemas = {
  // User Registration
  register: Joi.object({
    email: emailSchema,
    password: passwordSchema,
    name: Joi.string()
      .min(2)
      .max(100)
      .trim()
      .pattern(/^[a-zA-Z\s'-]+$/)
      .required()
      .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name must not exceed 100 characters',
        'string.pattern.base': 'Name can only contain letters, spaces, hyphens, and apostrophes'
      })
  }),

  // User Login
  login: Joi.object({
    email: emailSchema,
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  }),

  // Password Reset Request
  passwordResetRequest: Joi.object({
    email: emailSchema
  }),

  // Password Reset Confirm
  passwordResetConfirm: Joi.object({
    token: Joi.string()
      .length(64) // SHA256 hex = 64 chars
      .hex()
      .required(),
    newPassword: passwordSchema
  }),

  // Change Password
  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: passwordSchema
  }),

  // Refresh Token
  refreshToken: Joi.object({
    refreshToken: Joi.string().required()
  }),

  // ============================================================================
  // MEDIATOR SEARCH SCHEMAS
  // ============================================================================

  mediatorSearch: Joi.object({
    name: Joi.string()
      .max(100)
      .trim()
      .pattern(/^[a-zA-Z\s'-.,]+$/),
    location: Joi.string()
      .max(100)
      .trim()
      .pattern(/^[a-zA-Z\s,.-]+$/),
    specialization: Joi.string()
      .max(100)
      .trim()
      .pattern(/^[a-zA-Z\s,-]+$/),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string()
      .valid('name', 'experience', 'rating', 'createdAt')
      .default('name'),
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('asc')
  }),

  // ============================================================================
  // CONFLICT CHECKER SCHEMAS
  // ============================================================================

  conflictCheck: Joi.object({
    mediatorName: Joi.string()
      .required()
      .max(100)
      .trim()
      .pattern(/^[a-zA-Z\s'-.,]+$/),
    parties: Joi.array()
      .items(
        Joi.object({
          name: Joi.string()
            .required()
            .max(100)
            .trim()
            .pattern(/^[a-zA-Z\s'-.,]+$/),
          role: Joi.string()
            .valid('plaintiff', 'defendant', 'petitioner', 'respondent', 'party')
            .required()
        })
      )
      .min(1)
      .max(20)
      .required()
  }),

  bulkConflictCheck: Joi.object({
    file: Joi.object({
      mimetype: Joi.string()
        .valid('text/csv', 'application/vnd.ms-excel')
        .required(),
      size: Joi.number()
        .max(1048576) // 1MB
        .required()
    }).unknown(true) // Allow other file properties from multer
  }),

  // ============================================================================
  // AI CHAT SCHEMAS
  // ============================================================================

  chatMessage: Joi.object({
    message: Joi.string()
      .required()
      .max(2000)
      .trim()
      .pattern(/^[\s\S]*$/) // Allow all characters including newlines
      .messages({
        'string.max': 'Message must not exceed 2000 characters'
      }),
    conversationId: Joi.string()
      .pattern(/^[a-f0-9]{24}$/) // MongoDB ObjectId
      .optional()
  }),

  // ============================================================================
  // SUBSCRIPTION SCHEMAS
  // ============================================================================

  createCheckoutSession: Joi.object({
    priceId: Joi.string()
      .pattern(/^price_[a-zA-Z0-9]+$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid Stripe price ID'
      })
  }),

  cancelSubscription: Joi.object({
    subscriptionId: Joi.string()
      .pattern(/^sub_[a-zA-Z0-9]+$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid Stripe subscription ID'
      })
  }),

  // ============================================================================
  // MONGODB OBJECTID SCHEMA
  // ============================================================================

  objectId: Joi.object({
    id: Joi.string()
      .pattern(/^[a-f0-9]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid ID format'
      })
  }),

  // ============================================================================
  // SCRAPING SCHEMAS (Admin only)
  // ============================================================================

  scrapeState: Joi.object({
    state: Joi.string()
      .length(2)
      .uppercase()
      .pattern(/^[A-Z]{2}$/)
      .required()
      .messages({
        'string.length': 'State code must be 2 characters (e.g., CA, NY)',
        'string.pattern.base': 'State code must contain only uppercase letters'
      }),
    options: Joi.object({
      forceRefresh: Joi.boolean().default(false),
      includeDetails: Joi.boolean().default(true)
    }).optional()
  }),

  // ============================================================================
  // RATING AND REVIEW SCHEMAS
  // ============================================================================

  submitReview: Joi.object({
    mediatorId: Joi.string()
      .pattern(/^[a-f0-9]{24}$/)
      .required(),
    rating: Joi.number()
      .integer()
      .min(1)
      .max(5)
      .required()
      .messages({
        'number.min': 'Rating must be between 1 and 5',
        'number.max': 'Rating must be between 1 and 5'
      }),
    comment: Joi.string()
      .max(1000)
      .trim()
      .optional()
      .allow('')
  }),

  // ============================================================================
  // PROFILE UPDATE SCHEMAS
  // ============================================================================

  updateProfile: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .trim()
      .pattern(/^[a-zA-Z\s'-]+$/)
      .optional(),
    email: emailSchema.optional(),
    preferences: Joi.object({
      emailNotifications: Joi.boolean(),
      searchHistory: Joi.boolean(),
      dataSharing: Joi.boolean()
    }).optional()
  }).min(1) // At least one field required
};

/**
 * Sanitize string to prevent XSS and injection attacks
 * @param {string} str - Input string
 * @returns {string} Sanitized string
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;

  return str
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Sanitize object recursively
 * @param {Object} obj - Input object
 * @returns {Object} Sanitized object
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

module.exports = {
  validate,
  schemas,
  sanitizeString,
  sanitizeObject
};
