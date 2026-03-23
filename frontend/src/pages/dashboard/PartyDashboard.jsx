import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaSearch, FaHandshake, FaInfoCircle, FaFileAlt, FaQuestionCircle, FaShieldAlt } from 'react-icons/fa';
import StatCard from '../../components/dashboard/StatCard';

/**
 * PartyDashboard - Dashboard for parties in disputes
 * Shows case guidance, mediator search, and educational resources
 */
export default function PartyDashboard() {
  const { user } = useAuth();
  const [caseInfo, setCaseInfo] = useState(null);
  const [recommendedMediators, setRecommendedMediators] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPartyData();
  }, []);

  const fetchPartyData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      };

      // Fetch case information
      const caseRes = await fetch('/api/parties/my-case', { headers });
      if (caseRes.ok) {
        const data = await caseRes.json();
        setCaseInfo(data.data);
      }

      // Fetch recommended mediators
      const mediatorRes = await fetch('/api/parties/recommended-mediators', { headers });
      if (mediatorRes.ok) {
        const data = await mediatorRes.json();
        setRecommendedMediators(data.data || []);
      }
    } catch (error) {
      console.error('Party dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neu-100 via-neu-150 to-neu-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-900">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neu-100 via-neu-150 to-neu-200 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            Your Mediation Journey
          </h1>
          <p className="text-lg text-gray-600">
            Find the right mediator and resolve your dispute fairly
          </p>
        </div>

        {/* Welcome Guide */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FaInfoCircle className="text-green-600 text-xl" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-2">Welcome to FairMediator</h3>
              <p className="text-gray-700 mb-4">
                We help you find neutral, qualified mediators to resolve your dispute efficiently and fairly.
                Our platform screens for conflicts of interest and matches you with experienced professionals.
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href="/how-it-works"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition-colors"
                >
                  How It Works
                </a>
                <a
                  href="/faq"
                  className="px-4 py-2 bg-white text-green-600 border border-green-600 rounded-lg font-semibold text-sm hover:bg-green-50 transition-colors"
                >
                  FAQs
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Mediators Available"
            value="500+"
            subtitle="Verified professionals"
            icon={FaHandshake}
            color="#10B981"
          />
          <StatCard
            title="Success Rate"
            value="87%"
            subtitle="Cases resolved"
            icon={FaShieldAlt}
            color="#3B82F6"
          />
          <StatCard
            title="Your Case Status"
            value={caseInfo?.status || 'Not Started'}
            subtitle="Current stage"
            icon={FaFileAlt}
            color="#8B5CF6"
          />
        </div>

        {/* Case Information */}
        {caseInfo && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Case</h2>
            <div className="bg-neu-200 rounded-2xl p-6 shadow-neu">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Case Type</p>
                  <p className="font-semibold text-gray-900">{caseInfo.type || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Dispute Value</p>
                  <p className="font-semibold text-gray-900">{caseInfo.value || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Filed Date</p>
                  <p className="font-semibold text-gray-900">
                    {caseInfo.filedDate ? new Date(caseInfo.filedDate).toLocaleDateString() : 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <p className="font-semibold text-gray-900">{caseInfo.status || 'Active'}</p>
                </div>
              </div>
              <div className="mt-4">
                <a
                  href="/parties/case-details"
                  className="text-green-600 hover:text-green-700 font-medium text-sm"
                >
                  View Full Case Details →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Recommended Mediators */}
        {recommendedMediators.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Recommended Mediators for Your Case
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedMediators.map((mediator) => (
                <div key={mediator._id} className="bg-neu-200 rounded-2xl p-6 shadow-neu hover:shadow-neu-lg transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-gray-900">{mediator.name}</h3>
                    {mediator.isVerified && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {mediator.specializations?.slice(0, 2).join(', ')}
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center">
                      <span className="text-yellow-500 text-sm">★</span>
                      <span className="ml-1 font-semibold text-gray-900">{mediator.rating?.toFixed(1)}</span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-600">{mediator.yearsExperience}+ years</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    {mediator.location?.city}, {mediator.location?.state}
                  </p>
                  <a
                    href={`/mediators/${mediator._id}`}
                    className="block w-full text-center px-4 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition-colors"
                  >
                    View Profile
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Next Steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a
              href="/search"
              className="bg-neu-200 rounded-2xl p-6 shadow-neu hover:shadow-neu-lg transition-all group"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FaSearch className="text-white text-xl" />
                </div>
                <h3 className="font-bold text-gray-900">Find a Mediator</h3>
              </div>
              <p className="text-sm text-gray-600">
                Search our database of verified mediators by practice area and location
              </p>
            </a>

            <a
              href="/conflict-checker"
              className="bg-neu-200 rounded-2xl p-6 shadow-neu hover:shadow-neu-lg transition-all group"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FaShieldAlt className="text-white text-xl" />
                </div>
                <h3 className="font-bold text-gray-900">Check for Conflicts</h3>
              </div>
              <p className="text-sm text-gray-600">
                Verify that your mediator has no conflicts of interest with your case
              </p>
            </a>

            <a
              href="/resources"
              className="bg-neu-200 rounded-2xl p-6 shadow-neu hover:shadow-neu-lg transition-all group"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FaQuestionCircle className="text-white text-xl" />
                </div>
                <h3 className="font-bold text-gray-900">Learn About Mediation</h3>
              </div>
              <p className="text-sm text-gray-600">
                Educational resources to help you understand the mediation process
              </p>
            </a>
          </div>
        </div>

        {/* Educational Section */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">What is Mediation?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                <span className="text-green-600 font-bold text-lg">1</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Neutral Third Party</h3>
              <p className="text-sm text-gray-600">
                A mediator helps both parties communicate and reach a mutually agreeable solution
              </p>
            </div>
            <div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <span className="text-blue-600 font-bold text-lg">2</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Confidential Process</h3>
              <p className="text-sm text-gray-600">
                Everything discussed in mediation remains private and confidential
              </p>
            </div>
            <div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                <span className="text-purple-600 font-bold text-lg">3</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Voluntary Agreement</h3>
              <p className="text-sm text-gray-600">
                Both parties must agree to the final resolution - nothing is forced
              </p>
            </div>
          </div>
        </div>

        {/* Upgrade CTA */}
        {user?.subscriptionTier === 'free' && (
          <div className="rounded-2xl p-8 text-center bg-gradient-to-r from-green-600 to-emerald-600 shadow-xl mt-8">
            <h3 className="text-2xl font-bold text-white mb-2">
              Get Premium Support
            </h3>
            <p className="text-green-100 mb-4">
              Premium members get priority mediator matching, case management tools, and dedicated support
            </p>
            <button
              onClick={() => window.location.href = '/upgrade'}
              className="px-8 py-3 bg-white text-green-600 rounded-xl font-bold hover:scale-105 transition-transform"
            >
              Upgrade to Premium
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
