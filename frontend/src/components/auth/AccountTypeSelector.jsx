import { useState } from 'react';
import { FaGavel, FaBriefcase, FaBalanceScale } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const ACCOUNT_TYPES = [
  {
    value: 'mediator',
    label: 'Mediator',
    icon: FaGavel,
    description: 'I provide mediation services to parties in disputes',
    color: 'from-purple-600 to-indigo-600'
  },
  {
    value: 'attorney',
    label: 'Attorney',
    icon: FaBriefcase,
    description: 'I represent clients and search for mediators',
    color: 'from-blue-600 to-cyan-600'
  },
  {
    value: 'party',
    label: 'Party',
    icon: FaBalanceScale,
    description: 'I am involved in a dispute and need a mediator',
    color: 'from-green-600 to-emerald-600'
  }
];

/**
 * AccountTypeSelector Modal
 * Shows when a user logs in without an accountType (legacy migration)
 */
export default function AccountTypeSelector({ onComplete }) {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Don't show if user already has accountType
  if (user?.accountType) {
    return null;
  }

  const handleSubmit = async () => {
    if (!selectedType) {
      setError('Please select an account type');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.put(
        `${API_URL}/auth/select-account-type`,
        { accountType: selectedType },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Update local user state
        if (onComplete) {
          onComplete(response.data.data.user);
        }
        // Reload page to update dashboard
        window.location.reload();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to set account type');
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]" />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-[101] p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-8 text-center">
            <h2 className="text-3xl font-bold mb-2">Welcome to FairMediator!</h2>
            <p className="text-gray-300">Please tell us about yourself to get started</p>
          </div>

          {/* Content */}
          <div className="p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-2">I am a...</h3>
            <p className="text-gray-600 mb-6">Select the option that best describes your role</p>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Account Type Options */}
            <div className="space-y-4 mb-8">
              {ACCOUNT_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.value;

                return (
                  <button
                    key={type.value}
                    onClick={() => setSelectedType(type.value)}
                    disabled={loading}
                    className={`w-full p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                      isSelected
                        ? 'border-gray-800 bg-gray-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="text-white text-2xl" />
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-lg font-bold text-gray-900">{type.label}</h4>
                          {isSelected && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                              Selected
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{type.description}</p>
                      </div>

                      {/* Radio Indicator */}
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'border-gray-800' : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <div className="w-3 h-3 rounded-full bg-gray-800" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!selectedType || loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-gray-800 to-gray-900 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Setting up your account...
                </span>
              ) : (
                'Continue to Dashboard'
              )}
            </button>

            {/* Help Text */}
            <p className="text-center text-xs text-gray-500 mt-4">
              This helps us personalize your experience. You can contact support to change this later.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
