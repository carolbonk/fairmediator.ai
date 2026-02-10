import PropTypes from 'prop-types';

const SubscriptionCard = ({
  tier,
  price,
  features = [],
  highlighted = false,
  onUpgrade,
  currentTier = false,
  billingPeriod = 'month'
}) => {
  const isFreeTier = tier.toLowerCase() === 'free';
  const isPremiumTier = tier.toLowerCase() === 'premium';

  return (
    <div
      className={`
        relative bg-gray-100 rounded-3xl shadow-neumorphic p-8
        transition-all duration-300 hover:shadow-neumorphic-hover
        ${highlighted ? 'ring-2 ring-blue-500 scale-105' : ''}
        ${currentTier ? 'ring-2 ring-green-500' : ''}
      `}
    >
      {/* Current Plan Badge */}
      {currentTier && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="inline-flex items-center px-4 py-1 rounded-full text-xs font-semibold
                         bg-gradient-to-r from-green-500 to-green-600 text-white
                         shadow-lg">
            Current Plan
          </span>
        </div>
      )}

      {/* Popular/Recommended Badge */}
      {highlighted && !currentTier && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="inline-flex items-center px-4 py-1 rounded-full text-xs font-semibold
                         bg-gradient-to-r from-slate-600 to-slate-700 text-white
                         shadow-lg">
            Recommended
          </span>
        </div>
      )}

      {/* Tier Name */}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2 capitalize">
          {tier}
        </h3>

        {/* Price */}
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold text-gray-900">
            ${typeof price === 'number' ? price.toFixed(2) : price}
          </span>
          {!isFreeTier && (
            <span className="text-gray-600 text-sm">
              /{billingPeriod}
            </span>
          )}
        </div>

        {isFreeTier && (
          <p className="text-gray-600 text-sm mt-1">Forever free</p>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-6" />

      {/* Features List */}
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            {/* Checkmark Icon */}
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-400 to-green-500
                            flex items-center justify-center shadow-sm">
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <span className="text-gray-700 text-sm leading-tight">
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {/* Upgrade Button */}
      <button
        onClick={onUpgrade}
        disabled={currentTier || !onUpgrade}
        className={`
          w-full py-3 px-6 rounded-xl font-medium
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-2
          ${
            currentTier
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-neumorphic-inset'
              : isPremiumTier || highlighted
              ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-neumorphic hover:shadow-neumorphic-hover focus:ring-slate-600'
              : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-neumorphic hover:shadow-neumorphic-hover focus:ring-gray-500'
          }
          ${!onUpgrade && !currentTier ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {currentTier ? (
          'Current Plan'
        ) : isFreeTier ? (
          'Get Started'
        ) : (
          'Upgrade Now'
        )}
      </button>

      {/* Additional Info for Premium */}
      {isPremiumTier && !currentTier && (
        <p className="text-center text-xs text-gray-500 mt-4">
          Cancel anytime. No questions asked.
        </p>
      )}
    </div>
  );
};

SubscriptionCard.propTypes = {
  tier: PropTypes.oneOf(['free', 'Free', 'premium', 'Premium']).isRequired,
  price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  features: PropTypes.arrayOf(PropTypes.string).isRequired,
  highlighted: PropTypes.bool,
  onUpgrade: PropTypes.func,
  currentTier: PropTypes.bool,
  billingPeriod: PropTypes.oneOf(['month', 'year'])
};

export default SubscriptionCard;
