/**
 * Stripe Service
 * Handles subscription management, payments, and billing
 * OPTIONAL: The app works perfectly fine without Stripe configured!
 *
 * If Stripe keys are not configured, subscription features will be disabled
 * but the core app functionality remains available.
 */

const User = require('../../models/User');
const Subscription = require('../../models/Subscription');

// Check if Stripe is enabled
const isStripeEnabled = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  return !!(key && key !== 'sk_test_your_stripe_secret_key_here' && key.length > 10);
};

// Initialize Stripe only if configured
let stripe = null;
if (isStripeEnabled()) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  console.log('✅ Stripe enabled - Premium subscriptions available');
} else {
  console.log('ℹ️  Stripe not configured - Running in free-only mode');
}

class StripeService {
  /**
   * Create Stripe customer for new user
   * DRY: Called once during registration
   */
  async createCustomer(user) {
    if (!isStripeEnabled()) {
      throw new Error('Stripe is not configured. Payment processing is disabled.');
    }

    try {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString()
        }
      });

      // Update user with Stripe customer ID
      await User.findByIdAndUpdate(user._id, {
        stripeCustomerId: customer.id
      });

      return customer;
    } catch (error) {
      console.error('Create customer error:', error);
      throw new Error('Failed to create Stripe customer');
    }
  }

  /**
   * Create checkout session for subscription upgrade
   * DRY: Reusable for any subscription tier
   */
  async createCheckoutSession(userId, priceId, successUrl, cancelUrl) {
    if (!isStripeEnabled()) {
      throw new Error('Stripe is not configured. Please add STRIPE_SECRET_KEY to enable payments.');
    }

    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      // Get or create Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await this.createCustomer(user);
        customerId = customer.id;
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          }
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: userId.toString()
        },
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
      });

      return session;
    } catch (error) {
      console.error('Create checkout session error:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  /**
   * Create billing portal session for managing subscriptions
   * DRY: Allows users to manage their own billing
   */
  async createBillingPortalSession(userId, returnUrl) {
    if (!isStripeEnabled()) {
      throw new Error('Stripe is not configured. Payment processing is disabled.');
    }

    try {
      const user = await User.findById(userId);

      if (!user || !user.stripeCustomerId) {
        throw new Error('No Stripe customer found');
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: returnUrl,
      });

      return session;
    } catch (error) {
      console.error('Create portal session error:', error);
      throw new Error('Failed to create billing portal session');
    }
  }

  /**
   * Handle webhook events from Stripe
   * DRY: Single handler for all subscription lifecycle events
   */
  async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutComplete(event.data.object);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancelled(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailure(event.data.object);
          break;

        default:
          console.log('Unhandled event type: ' + event.type);
      }

      return { received: true };
    } catch (error) {
      console.error('Webhook handling error:', error);
      throw error;
    }
  }

  /**
   * Handle successful checkout completion
   */
  async handleCheckoutComplete(session) {
    const userId = session.metadata.userId;
    const subscriptionId = session.subscription;

    await User.findByIdAndUpdate(userId, {
      stripeSubscriptionId: subscriptionId,
      subscriptionTier: 'premium',
      subscriptionStatus: 'active',
      subscriptionStartDate: new Date(),
    });

    await Subscription.findOneAndUpdate(
      { user: userId },
      {
        tier: 'premium',
        status: 'active',
        stripeSubscriptionId: subscriptionId,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      { upsert: true }
    );
  }

  /**
   * Handle subscription updates
   */
  async handleSubscriptionUpdate(subscription) {
    const customerId = subscription.customer;
    const user = await User.findOne({ stripeCustomerId: customerId });

    if (!user) {
      console.error('User not found for subscription update');
      return;
    }

    const status = subscription.status === 'active' ? 'active' : 
                   subscription.status === 'past_due' ? 'active' : 
                   'cancelled';

    await User.findByIdAndUpdate(user._id, {
      subscriptionStatus: status,
      subscriptionEndDate: new Date(subscription.current_period_end * 1000),
    });

    await Subscription.findOneAndUpdate(
      { user: user._id },
      {
        status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      }
    );
  }

  /**
   * Handle subscription cancellation
   */
  async handleSubscriptionCancelled(subscription) {
    const customerId = subscription.customer;
    const user = await User.findOne({ stripeCustomerId: customerId });

    if (!user) {
      console.error('User not found for subscription cancellation');
      return;
    }

    await User.findByIdAndUpdate(user._id, {
      subscriptionTier: 'free',
      subscriptionStatus: 'cancelled',
    });

    await Subscription.findOneAndUpdate(
      { user: user._id },
      {
        tier: 'free',
        status: 'cancelled',
      }
    );
  }

  /**
   * Handle successful payment
   */
  async handlePaymentSuccess(invoice) {
    // Log successful payment for analytics
    console.log('Payment succeeded for invoice: ' + invoice.id);
  }

  /**
   * Handle failed payment
   */
  async handlePaymentFailure(invoice) {
    const customerId = invoice.customer;
    const user = await User.findOne({ stripeCustomerId: customerId });

    if (user) {
      // Update subscription status
      await User.findByIdAndUpdate(user._id, {
        subscriptionStatus: 'past_due',
      });
    }

    console.error('Payment failed for invoice: ' + invoice.id);
  }

  /**
   * Get subscription details
   * DRY: Reusable for displaying subscription info
   * Works even without Stripe configured!
   */
  async getSubscription(userId) {
    try {
      const user = await User.findById(userId);

      // If Stripe not configured, return basic subscription info
      if (!isStripeEnabled()) {
        return {
          tier: user?.subscriptionTier || 'free',
          status: 'active',
          stripeEnabled: false,
          features: {
            searches: user?.subscriptionTier === 'premium' ? 'unlimited' : 5,
            profileViews: user?.subscriptionTier === 'premium' ? 'unlimited' : 10,
            aiCalls: user?.subscriptionTier === 'premium' ? 'unlimited' : 20,
          },
          message: 'Payment processing not configured'
        };
      }

      if (!user || !user.stripeSubscriptionId) {
        return {
          tier: 'free',
          status: 'active',
          stripeEnabled: true,
          features: {
            searches: 5,
            profileViews: 10,
            aiCalls: 20,
          }
        };
      }

      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

      return {
        tier: 'premium',
        status: subscription.status,
        stripeEnabled: true,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        features: {
          searches: 'unlimited',
          profileViews: 'unlimited',
          aiCalls: 'unlimited',
        }
      };
    } catch (error) {
      console.error('Get subscription error:', error);
      throw new Error('Failed to retrieve subscription');
    }
  }

  /**
   * Cancel subscription
   * DRY: Handles both immediate and end-of-period cancellation
   */
  async cancelSubscription(userId, immediate = false) {
    if (!isStripeEnabled()) {
      throw new Error('Stripe is not configured. Payment processing is disabled.');
    }

    try {
      const user = await User.findById(userId);

      if (!user || !user.stripeSubscriptionId) {
        throw new Error('No active subscription found');
      }

      if (immediate) {
        await stripe.subscriptions.cancel(user.stripeSubscriptionId);
      } else {
        await stripe.subscriptions.update(user.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Cancel subscription error:', error);
      throw new Error('Failed to cancel subscription');
    }
  }
}

module.exports = new StripeService();
