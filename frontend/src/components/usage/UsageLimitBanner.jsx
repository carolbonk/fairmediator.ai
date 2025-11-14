import { FaExclamationTriangle, FaCrown } from 'react-icons/fa';

/**
 * UsageLimitBanner - Shows usage limits and upgrade prompts
 * DRY: Reusable component for all usage-limited features
 * Neomorphic design with gradient accents
 */
export default function UsageLimitBanner({ 
  type = 'search',           // 'search', 'profileView', 'aiCall'
  current, 
  limit, 
  onUpgrade 
}) {
  // Calculate percentage used
  const percentage = limit === 'unlimited' ? 0 : Math.min((current / limit) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  // Don't show banner for unlimited users
  if (limit === 'unlimited') {
    return null;
  }

  const typeLabels = {
    search: 'Searches',
    profileView: 'Profile Views',
    aiCall: 'AI Calls'
  };

  const label = typeLabels[type] || 'Actions';

  return (
    <div
      className="mb-4 p-4 rounded-xl"
      style={{
        background: isAtLimit 
          ? 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)'
          : isNearLimit 
          ? 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)'
          : '#F0F2F5',
        boxShadow: isAtLimit || isNearLimit
          ? '4px 4px 12px rgba(163, 177, 198, 0.4), -2px -2px 8px rgba(255, 255, 255, 0.5)'
          : 'inset 2px 2px 4px rgba(163, 177, 198, 0.2), inset -2px -2px 4px rgba(255, 255, 255, 0.5)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {(isAtLimit || isNearLimit) && (
            <FaExclamationTriangle 
              className={isAtLimit ? 'text-yellow-600' : 'text-blue-600'}
              style={{ fontSize: '1.125rem' }}
            />
          )}
          <span
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: isAtLimit ? '#92400E' : isNearLimit ? '#1E40AF' : '#4B5563',
            }}
          >
            {label} {isAtLimit ? '(Limit Reached)' : `${current} / ${limit}`}
          </span>
        </div>

        {isNearLimit && (
          <button
            onClick={onUpgrade}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
              boxShadow: '2px 2px 6px rgba(245, 158, 11, 0.3)',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <FaCrown style={{ fontSize: '0.875rem' }} />
            <span>Upgrade</span>
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-2 rounded-full overflow-hidden"
        style={{
          background: '#D1D5DB',
          boxShadow: 'inset 1px 1px 2px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            background: isAtLimit
              ? 'linear-gradient(90deg, #DC2626 0%, #EF4444 100%)'
              : isNearLimit
              ? 'linear-gradient(90deg, #F59E0B 0%, #FBBF24 100%)'
              : 'linear-gradient(90deg, #10B981 0%, #34D399 100%)',
          }}
        />
      </div>

      {isAtLimit && (
        <p style={{ fontSize: '0.75rem', color: '#92400E', marginTop: '0.5rem' }}>
          Upgrade to Premium for unlimited {label.toLowerCase()}
        </p>
      )}
    </div>
  );
}
