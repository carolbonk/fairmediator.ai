import { FaCheck, FaCrown, FaStar } from 'react-icons/fa';

/**
 * PricingCard - Subscription tier display card
 * DRY: Reusable for free and premium tiers
 * Neomorphic design with gradient accents
 */
export default function PricingCard({ 
  tier = 'free',
  price = 0,
  features = [],
  currentTier = false,
  onUpgrade,
  recommended = false
}) {
  const isPremium = tier === 'premium';

  return (
    <div
      className="relative rounded-2xl p-6"
      style={{
        background: isPremium 
          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          : '#F0F2F5',
        boxShadow: isPremium
          ? '8px 8px 24px rgba(102, 126, 234, 0.4), -4px -4px 16px rgba(255, 255, 255, 0.3)'
          : '8px 8px 16px rgba(163, 177, 198, 0.6), -8px -8px 16px rgba(255, 255, 255, 0.5)',
      }}
    >
      {/* Recommended Badge */}
      {recommended && (
        <div
          className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full flex items-center space-x-2"
          style={{
            background: 'linear-gradient(90deg, #F59E0B 0%, #FBBF24 100%)',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
          }}
        >
          <FaStar className="text-white text-xs" />
          <span className="text-white text-xs font-bold">RECOMMENDED</span>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-3">
          {isPremium && <FaCrown className="text-yellow-300 text-2xl mr-2" />}
          <h3
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: isPremium ? '#FFFFFF' : '#1F2937',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            {tier}
          </h3>
        </div>

        <div className="mb-2">
          <span
            style={{
              fontSize: '3rem',
              fontWeight: 800,
              color: isPremium ? '#FFFFFF' : '#111827',
            }}
          >
            ${price}
          </span>
          <span
            style={{
              fontSize: '1rem',
              color: isPremium ? '#E0E7FF' : '#6B7280',
              marginLeft: '0.5rem'
            }}
          >
            /month
          </span>
        </div>

        {currentTier && (
          <div
            className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              background: isPremium ? '#FFFFFF20' : '#10B98120',
              color: isPremium ? '#FFFFFF' : '#059669',
            }}
          >
            Current Plan
          </div>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <div
              className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 mr-3"
              style={{
                background: isPremium 
                  ? '#FFFFFF30'
                  : 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
              }}
            >
              <FaCheck 
                className="text-xs" 
                style={{ color: isPremium ? '#FFFFFF' : '#FFFFFF' }}
              />
            </div>
            <span
              style={{
                fontSize: '0.9375rem',
                color: isPremium ? '#E0E7FF' : '#374151',
                lineHeight: '1.5'
              }}
            >
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {/* Action Button */}
      {!currentTier && (
        <button
          onClick={onUpgrade}
          className="w-full py-3 rounded-xl font-bold text-base transition-all duration-200 hover:transform hover:scale-105"
          style={{
            background: isPremium
              ? '#FFFFFF'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: isPremium ? '#667eea' : '#FFFFFF',
            boxShadow: isPremium
              ? '0 4px 12px rgba(255, 255, 255, 0.3)'
              : '4px 4px 12px rgba(102, 126, 234, 0.4)',
          }}
        >
          {isPremium ? 'Upgrade to Premium' : 'Continue with Free'}
        </button>
      )}

      {currentTier && isPremium && (
        <button
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200"
          style={{
            background: 'transparent',
            color: '#FFFFFF',
            border: '2px solid #FFFFFF40',
          }}
        >
          Manage Subscription
        </button>
      )}
    </div>
  );
}
