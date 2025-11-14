/**
 * Validation Schemas
 * Joi schemas for all API endpoints
 */

const Joi = require('joi');
const {
  sanitizedString,
  passwordSchema,
  emailSchema,
  objectIdSchema,
  paginationSchema,
} = require('./validation');

/**
 * User Authentication Schemas
 */
const userSchemas = {
  // User registration
  register: {
    body: Joi.object({
      email: emailSchema,
      password: passwordSchema,
      name: sanitizedString.min(2).max(100).optional(),
      acceptTerms: Joi.boolean().valid(true).required().messages({
        'any.only': 'You must accept the terms and conditions',
      }),
    }),
  },

  // User login
  login: {
    body: Joi.object({
      email: emailSchema,
      password: Joi.string().required().messages({
        'string.empty': 'Password is required',
      }),
    }),
  },

  // Password reset request
  requestPasswordReset: {
    body: Joi.object({
      email: emailSchema,
    }),
  },

  // Password reset
  resetPassword: {
    body: Joi.object({
      token: Joi.string().required(),
      password: passwordSchema,
    }),
  },

  // Update user profile
  updateProfile: {
    body: Joi.object({
      name: sanitizedString.min(2).max(100).optional(),
      preferences: Joi.object({
        emailNotifications: Joi.boolean().optional(),
        savedSearchAlerts: Joi.boolean().optional(),
      }).optional(),
    }),
  },
};

/**
 * Mediator Schemas
 */
const mediatorSchemas = {
  // Get mediators (query filters)
  getMediators: {
    query: Joi.object({
      practiceArea: sanitizedString.max(100).optional(),
      location: sanitizedString.max(100).optional(),
      ideology: Joi.string().valid('liberal', 'conservative', 'neutral').optional(),
      minExperience: Joi.number().integer().min(0).max(100).optional(),
      ...paginationSchema,
    }),
  },

  // Get single mediator
  getMediator: {
    params: Joi.object({
      id: objectIdSchema,
    }),
  },

  // Create mediator
  createMediator: {
    body: Joi.object({
      name: sanitizedString.min(2).max(200).required(),
      email: emailSchema,
      phone: Joi.string()
        .pattern(/^\+?[1-9]\d{1,14}$/)
        .optional()
        .messages({
          'string.pattern.base': 'Please provide a valid phone number',
        }),
      bio: sanitizedString.max(2000).optional(),
      practiceAreas: Joi.array()
        .items(sanitizedString.max(100))
        .min(1)
        .max(20)
        .required(),
      location: Joi.object({
        city: sanitizedString.max(100).required(),
        state: sanitizedString.length(2).uppercase().required(),
        country: sanitizedString.max(100).default('USA'),
      }).required(),
      yearsExperience: Joi.number().integer().min(0).max(100).required(),
      education: Joi.array()
        .items(
          Joi.object({
            degree: sanitizedString.max(200).required(),
            institution: sanitizedString.max(200).required(),
            year: Joi.number().integer().min(1950).max(new Date().getFullYear()),
          })
        )
        .max(10)
        .optional(),
      certifications: Joi.array().items(sanitizedString.max(200)).max(20).optional(),
      languages: Joi.array().items(sanitizedString.max(50)).max(20).optional(),
      hourlyRate: Joi.number().min(0).max(10000).optional(),
      website: Joi.string().uri().max(500).optional(),
      linkedIn: Joi.string().uri().max(500).optional(),
    }),
  },

  // Update mediator
  updateMediator: {
    params: Joi.object({
      id: objectIdSchema,
    }),
    body: Joi.object({
      name: sanitizedString.min(2).max(200).optional(),
      email: emailSchema.optional(),
      phone: Joi.string()
        .pattern(/^\+?[1-9]\d{1,14}$/)
        .optional(),
      bio: sanitizedString.max(2000).optional(),
      practiceAreas: Joi.array()
        .items(sanitizedString.max(100))
        .min(1)
        .max(20)
        .optional(),
      location: Joi.object({
        city: sanitizedString.max(100).optional(),
        state: sanitizedString.length(2).uppercase().optional(),
        country: sanitizedString.max(100).optional(),
      }).optional(),
      yearsExperience: Joi.number().integer().min(0).max(100).optional(),
      education: Joi.array()
        .items(
          Joi.object({
            degree: sanitizedString.max(200).required(),
            institution: sanitizedString.max(200).required(),
            year: Joi.number().integer().min(1950).max(new Date().getFullYear()),
          })
        )
        .max(10)
        .optional(),
      certifications: Joi.array().items(sanitizedString.max(200)).max(20).optional(),
      languages: Joi.array().items(sanitizedString.max(50)).max(20).optional(),
      hourlyRate: Joi.number().min(0).max(10000).optional(),
      website: Joi.string().uri().max(500).optional(),
      linkedIn: Joi.string().uri().max(500).optional(),
    }),
  },

  // Analyze ideology
  analyzeIdeology: {
    params: Joi.object({
      id: objectIdSchema,
    }),
  },
};

/**
 * Chat Schemas
 */
const chatSchemas = {
  // Send chat message
  sendMessage: {
    body: Joi.object({
      message: sanitizedString.min(1).max(2000).required().messages({
        'string.min': 'Message cannot be empty',
        'string.max': 'Message is too long (maximum 2000 characters)',
      }),
      history: Joi.array()
        .items(
          Joi.object({
            role: Joi.string().valid('user', 'assistant', 'system').required(),
            content: sanitizedString.max(5000).required(),
          })
        )
        .max(50)
        .default([]),
    }),
  },

  // Stream chat
  streamMessage: {
    body: Joi.object({
      message: sanitizedString.min(1).max(2000).required(),
      history: Joi.array()
        .items(
          Joi.object({
            role: Joi.string().valid('user', 'assistant', 'system').required(),
            content: sanitizedString.max(5000).required(),
          })
        )
        .max(50)
        .default([]),
    }),
  },
};

/**
 * Subscription Schemas
 */
const subscriptionSchemas = {
  // Create subscription
  createSubscription: {
    body: Joi.object({
      tier: Joi.string().valid('free', 'premium', 'enterprise').required(),
      billingCycle: Joi.string().valid('monthly', 'annual').optional(),
    }),
  },

  // Update subscription
  updateSubscription: {
    params: Joi.object({
      id: objectIdSchema,
    }),
    body: Joi.object({
      tier: Joi.string().valid('free', 'premium', 'enterprise').optional(),
      status: Joi.string()
        .valid('active', 'cancelled', 'expired', 'trial', 'past_due', 'paused')
        .optional(),
    }),
  },

  // Cancel subscription
  cancelSubscription: {
    params: Joi.object({
      id: objectIdSchema,
    }),
    body: Joi.object({
      reason: Joi.string()
        .valid('too_expensive', 'missing_features', 'switching_provider', 'no_longer_needed', 'other')
        .required(),
      feedback: sanitizedString.max(1000).optional(),
    }),
  },
};

/**
 * Affiliation Schemas
 */
const affiliationSchemas = {
  // Check affiliations
  checkAffiliations: {
    body: Joi.object({
      mediatorIds: Joi.array().items(objectIdSchema).min(1).max(50).required(),
      parties: Joi.array().items(sanitizedString.max(200)).min(1).max(20).required(),
    }),
  },

  // Quick check affiliations
  quickCheckAffiliations: {
    body: Joi.object({
      mediatorIds: Joi.array().items(objectIdSchema).min(1).max(50).required(),
      parties: Joi.array().items(sanitizedString.max(200)).min(1).max(20).required(),
    }),
  },

  // Get mediator affiliations
  getMediatorAffiliations: {
    params: Joi.object({
      id: objectIdSchema,
    }),
  },
};

/**
 * Search Schemas
 */
const searchSchemas = {
  // General search
  search: {
    query: Joi.object({
      q: sanitizedString.min(1).max(500).required().messages({
        'string.min': 'Search query cannot be empty',
        'string.max': 'Search query is too long',
      }),
      type: Joi.string().valid('mediator', 'case', 'article').optional(),
      ...paginationSchema,
    }),
  },
};

module.exports = {
  userSchemas,
  mediatorSchemas,
  chatSchemas,
  subscriptionSchemas,
  affiliationSchemas,
  searchSchemas,
};
