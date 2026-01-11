/**
 * Subscription Routes
 * Handles premium subscription management via Stripe
 * DRY: Reuses auth middleware and Stripe service
 */

const express = require('express');
const router = express.Router();
const stripeService = require('../services/stripe/stripeService');
const { authenticate } = require('../middleware/auth');
const UsageLog = require('../models/UsageLog');
const { sendSuccess, sendError, sendValidationError, asyncHandler } = require('../utils/responseHandlers');

/**
 * GET /api/subscription
 * Get current user's subscription details
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const subscription = await stripeService.getSubscription(req.user._id);

  // Log subscription check for analytics
  await UsageLog.create({
    user: req.user._id,
    eventType: 'subscription_check',
    metadata: {
      tier: subscription.tier,
      status: subscription.status
    }
  });

  sendSuccess(res, subscription);
}));

/**
 * POST /api/subscription/checkout
 * Create Stripe checkout session for upgrade
 */
router.post('/checkout', authenticate, asyncHandler(async (req, res) => {
  const { priceId } = req.body;

  if (!priceId) {
    return sendValidationError(res, 'Price ID is required');
  }

  const successUrl = process.env.FRONTEND_URL + '/subscription/success?session_id={CHECKOUT_SESSION_ID}';
  const cancelUrl = process.env.FRONTEND_URL + '/subscription/cancelled';

  const session = await stripeService.createCheckoutSession(
    req.user._id,
    priceId,
    successUrl,
    cancelUrl
  );

  // Log upgrade attempt for analytics
  await UsageLog.create({
    user: req.user._id,
    eventType: 'upgrade_initiated',
    metadata: {
      priceId,
      sessionId: session.id
    }
  });

  sendSuccess(res, {
    sessionId: session.id,
    url: session.url
  });
}));

/**
 * POST /api/subscription/portal
 * Create Stripe billing portal session
 */
router.post('/portal', authenticate, asyncHandler(async (req, res) => {
  const returnUrl = process.env.FRONTEND_URL + '/dashboard';

  const session = await stripeService.createBillingPortalSession(
    req.user._id,
    returnUrl
  );

  sendSuccess(res, {
    url: session.url
  });
}));

/**
 * POST /api/subscription/cancel
 * Cancel subscription (at end of period)
 */
router.post('/cancel', authenticate, asyncHandler(async (req, res) => {
  const { immediate = false } = req.body;

  await stripeService.cancelSubscription(req.user._id, immediate);

  // Log cancellation for analytics
  await UsageLog.create({
    user: req.user._id,
    eventType: 'subscription_cancelled',
    metadata: {
      immediate,
      previousTier: req.user.subscriptionTier
    }
  });

  sendSuccess(res, null, 200, immediate
    ? 'Subscription cancelled immediately'
    : 'Subscription will cancel at the end of the billing period'
  );
}));

/**
 * POST /api/subscription/webhook
 * Stripe webhook endpoint
 * No authentication - verified via Stripe signature
 */
router.post('/webhook', express.raw({ type: 'application/json' }), asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  if (webhookSecret) {
    // Verify webhook signature
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } else {
    // For development without webhook secret
    event = JSON.parse(req.body.toString());
  }

  // Handle the event
  await stripeService.handleWebhook(event);

  sendSuccess(res, { received: true });
}));

module.exports = router;
