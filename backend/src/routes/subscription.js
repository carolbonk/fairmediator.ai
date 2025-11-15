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

/**
 * GET /api/subscription
 * Get current user's subscription details
 */
router.get('/', authenticate, async (req, res) => {
  try {
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

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to retrieve subscription' });
  }
});

/**
 * POST /api/subscription/checkout
 * Create Stripe checkout session for upgrade
 */
router.post('/checkout', authenticate, async (req, res) => {
  try {
    const { priceId } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required' });
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

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url
      }
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

/**
 * POST /api/subscription/portal
 * Create Stripe billing portal session
 */
router.post('/portal', authenticate, async (req, res) => {
  try {
    const returnUrl = process.env.FRONTEND_URL + '/dashboard';

    const session = await stripeService.createBillingPortalSession(
      req.user._id,
      returnUrl
    );

    res.json({
      success: true,
      data: {
        url: session.url
      }
    });
  } catch (error) {
    console.error('Create portal session error:', error);
    res.status(500).json({ error: 'Failed to create billing portal session' });
  }
});

/**
 * POST /api/subscription/cancel
 * Cancel subscription (at end of period)
 */
router.post('/cancel', authenticate, async (req, res) => {
  try {
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

    res.json({
      success: true,
      message: immediate
        ? 'Subscription cancelled immediately'
        : 'Subscription will cancel at the end of the billing period'
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

/**
 * POST /api/subscription/webhook
 * Stripe webhook endpoint
 * No authentication - verified via Stripe signature
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
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

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook error: ' + error.message });
  }
});

module.exports = router;
