import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PricingCard from './PricingCard';

/**
 * UpgradePage - Premium subscription upgrade flow
 * DRY: Reuses PricingCard component
 */
export default function UpgradePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const freeTierFeatures = [
    '5 mediator searches per day',
    '10 profile views per day',
    '20 AI chat messages per day',
    'Basic search filters',
    'Conflict checking',
    'Email support'
  ];

  const premiumTierFeatures = [
    'Unlimited mediator searches',
    'Unlimited profile views',
    'Unlimited AI chat messages',
    'Advanced search filters',
    'Multi-perspective AI analysis',
    'Enhanced conflict detection with NLP',
    'Smart mediator recommendations',
    'Usage analytics dashboard',
    'Priority email support',
    'Early access to new features'
  ];

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      // Call subscription API to create checkout session
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
        },
        body: JSON.stringify({
          priceId: process.env.VITE_STRIPE_PRICE_ID || 'price_premium'
        })
      });

      const data = await response.json();

      if (data.success && data.data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.data.url;
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to initiate upgrade. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neu-100 via-neu-150 to-neu-200 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '1rem'
            }}
          >
            Choose Your Plan
          </h1>
          <p style={{ fontSize: '1.125rem', color: '#6B7280' }}>
            Start free, upgrade anytime for unlimited access
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <PricingCard
            tier="free"
            price={0}
            features={freeTierFeatures}
            currentTier={user?.subscriptionTier === 'free'}
            onUpgrade={() => navigate('/')}
          />

          {/* Premium Tier */}
          <PricingCard
            tier="premium"
            price={19.99}
            features={premiumTierFeatures}
            currentTier={user?.subscriptionTier === 'premium'}
            onUpgrade={handleUpgrade}
            recommended={true}
          />
        </div>

        {/* FAQ Section */}
        <div
          className="mt-16 max-w-3xl mx-auto rounded-2xl p-8"
          style={{
            background: '#F0F2F5',
            boxShadow: 'inset 2px 2px 4px rgba(163, 177, 198, 0.3), inset -2px -2px 4px rgba(255, 255, 255, 0.5)',
          }}
        >
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#111827',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}
          >
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1F2937', marginBottom: '0.5rem' }}>
                Can I cancel anytime?
              </h3>
              <p style={{ fontSize: '0.9375rem', color: '#6B7280' }}>
                Yes! You can cancel your premium subscription at any time. You'll continue to have access until the end of your billing period.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1F2937', marginBottom: '0.5rem' }}>
                What payment methods do you accept?
              </h3>
              <p style={{ fontSize: '0.9375rem', color: '#6B7280' }}>
                We accept all major credit cards through our secure payment processor, Stripe.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1F2937', marginBottom: '0.5rem' }}>
                Is my data secure?
              </h3>
              <p style={{ fontSize: '0.9375rem', color: '#6B7280' }}>
                Absolutely. We use industry-standard encryption and never store your payment information. All transactions are processed securely through Stripe.
              </p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-xl font-semibold"
            style={{
              background: 'transparent',
              color: '#667eea',
              border: '2px solid #667eea',
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827' }}>
              Redirecting to secure checkout...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
