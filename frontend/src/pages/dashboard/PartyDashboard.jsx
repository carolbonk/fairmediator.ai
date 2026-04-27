import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaSearch, FaHandshake, FaInfoCircle, FaFileAlt, FaQuestionCircle, FaShieldAlt } from 'react-icons/fa';
import StatCard from '../../components/dashboard/StatCard';

// Brand palette (mirrors Mediator/Attorney dashboards)
const BRAND = {
  blue: '#2563EB',
  blueDark: '#1E3A8A',
  blueDeep: '#1D4ED8',
  golden: '#F5D15C',
  graphite: '#252D3A',
};

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

      const caseRes = await fetch('/api/parties/my-case', { headers });
      if (caseRes.ok) {
        const data = await caseRes.json();
        setCaseInfo(data.data);
      }

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
      <div className="min-h-screen bg-gradient-to-br from-neu-100 to-neu-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-lg font-semibold text-neu-800">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neu-100 to-neu-200 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-700 to-dark-neu-300 bg-clip-text text-transparent mb-2">
            Your Mediation Journey
          </h1>
          <p className="text-lg text-neu-600">
            Find the right mediator and resolve your dispute fairly
          </p>
        </div>

        {/* Welcome Guide */}
        <div className="bg-neu-100 rounded-neu-lg p-6 mb-8 shadow-neu border-l-4 border-accent-yellow">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-neu-sm flex items-center justify-center flex-shrink-0 shadow-neu-inset-sm bg-neu-100">
              <FaInfoCircle className="text-blue-700 text-xl" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-neu-800 mb-2">Welcome to FairMediator</h3>
              <p className="text-neu-700 mb-4">
                We help you find neutral, qualified mediators to resolve your dispute efficiently and fairly.
                Our platform screens for conflicts of interest and matches you with experienced professionals.
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href="/how-it-works"
                  className="px-4 py-2 rounded-neu-sm font-semibold text-sm text-white shadow-neu-sm hover:shadow-neu transition-all"
                  style={{ background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.blueDeep})` }}
                >
                  How It Works
                </a>
                <a
                  href="/faq"
                  className="px-4 py-2 bg-neu-100 text-blue-700 rounded-neu-sm font-semibold text-sm shadow-neu-sm hover:shadow-neu transition-all"
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
            color={BRAND.blue}
          />
          <StatCard
            title="Success Rate"
            value="87%"
            subtitle="Cases resolved"
            icon={FaShieldAlt}
            color={BRAND.blueDeep}
          />
          <StatCard
            title="Your Case Status"
            value={caseInfo?.status || 'Not Started'}
            subtitle="Current stage"
            icon={FaFileAlt}
            color={BRAND.golden}
          />
        </div>

        {/* Case Information */}
        {caseInfo && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-neu-800 mb-4">Your Case</h2>
            <div className="bg-neu-100 rounded-neu-lg p-6 shadow-neu">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neu-600 mb-1">Case Type</p>
                  <p className="font-semibold text-neu-800">{caseInfo.type || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-neu-600 mb-1">Dispute Value</p>
                  <p className="font-semibold text-neu-800">{caseInfo.value || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-neu-600 mb-1">Filed Date</p>
                  <p className="font-semibold text-neu-800">
                    {caseInfo.filedDate ? new Date(caseInfo.filedDate).toLocaleDateString() : 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neu-600 mb-1">Status</p>
                  <p className="font-semibold text-neu-800">{caseInfo.status || 'Active'}</p>
                </div>
              </div>
              <div className="mt-4">
                <a
                  href="/parties/case-details"
                  className="text-blue-700 hover:text-blue-900 font-medium text-sm"
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
            <h2 className="text-2xl font-bold text-neu-800 mb-4">
              Recommended Mediators for Your Case
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedMediators.map((mediator) => (
                <div key={mediator._id} className="bg-neu-100 rounded-neu-lg p-6 shadow-neu hover:shadow-neu-lg transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-neu-800">{mediator.name}</h3>
                    {mediator.isVerified && (
                      <span className="px-2 py-1 bg-accent-yellow text-dark-neu-400 text-xs font-semibold rounded shadow-neu-sm">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neu-600 mb-3">
                    {mediator.specializations?.slice(0, 2).join(', ')}
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center">
                      <span className="text-accent-yellow text-sm">★</span>
                      <span className="ml-1 font-semibold text-neu-800">{mediator.rating?.toFixed(1)}</span>
                    </div>
                    <span className="text-neu-400">•</span>
                    <span className="text-sm text-neu-600">{mediator.yearsExperience}+ years</span>
                  </div>
                  <p className="text-xs text-neu-500 mb-4">
                    {mediator.location?.city}, {mediator.location?.state}
                  </p>
                  <a
                    href={`/mediators/${mediator._id}`}
                    className="block w-full text-center px-4 py-2 rounded-neu-sm font-semibold text-sm text-white shadow-neu-sm hover:shadow-neu transition-all"
                    style={{ background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.blueDeep})` }}
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
          <h2 className="text-2xl font-bold text-neu-800 mb-4">Next Steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a
              href="/search"
              className="bg-neu-100 rounded-neu-lg p-6 shadow-neu hover:shadow-neu-lg transition-all group"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-neu-sm flex items-center justify-center shadow-neu-sm group-hover:scale-105 transition-transform" style={{ background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.blueDeep})` }}>
                  <FaSearch className="text-white text-xl" />
                </div>
                <h3 className="font-bold text-neu-800">Find a Mediator</h3>
              </div>
              <p className="text-sm text-neu-600">
                Search our database of verified mediators by practice area and location
              </p>
            </a>

            <a
              href="/conflict-checker"
              className="bg-neu-100 rounded-neu-lg p-6 shadow-neu hover:shadow-neu-lg transition-all group"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-neu-sm flex items-center justify-center shadow-neu-sm group-hover:scale-105 transition-transform" style={{ background: `linear-gradient(135deg, ${BRAND.graphite}, ${BRAND.blueDark})` }}>
                  <FaShieldAlt className="text-white text-xl" />
                </div>
                <h3 className="font-bold text-neu-800">Check for Conflicts</h3>
              </div>
              <p className="text-sm text-neu-600">
                Verify that your mediator has no conflicts of interest with your case
              </p>
            </a>

            <a
              href="/resources"
              className="bg-neu-100 rounded-neu-lg p-6 shadow-neu hover:shadow-neu-lg transition-all group"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-neu-sm flex items-center justify-center shadow-neu-sm group-hover:scale-105 transition-transform" style={{ background: `linear-gradient(135deg, ${BRAND.golden}, #E0B83A)` }}>
                  <FaQuestionCircle className="text-dark-neu-400 text-xl" />
                </div>
                <h3 className="font-bold text-neu-800">Learn About Mediation</h3>
              </div>
              <p className="text-sm text-neu-600">
                Educational resources to help you understand the mediation process
              </p>
            </a>
          </div>
        </div>

        {/* Educational Section */}
        <div className="bg-neu-100 rounded-neu-lg p-8 shadow-neu">
          <h2 className="text-2xl font-bold text-neu-800 mb-4">What is Mediation?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="w-10 h-10 rounded-neu-sm flex items-center justify-center mb-3 shadow-neu-sm" style={{ background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.blueDeep})` }}>
                <span className="text-white font-bold text-lg">1</span>
              </div>
              <h3 className="font-bold text-neu-800 mb-2">Neutral Third Party</h3>
              <p className="text-sm text-neu-600">
                A mediator helps both parties communicate and reach a mutually agreeable solution
              </p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-neu-sm flex items-center justify-center mb-3 shadow-neu-sm" style={{ background: `linear-gradient(135deg, ${BRAND.graphite}, ${BRAND.blueDark})` }}>
                <span className="text-white font-bold text-lg">2</span>
              </div>
              <h3 className="font-bold text-neu-800 mb-2">Confidential Process</h3>
              <p className="text-sm text-neu-600">
                Everything discussed in mediation remains private and confidential
              </p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-neu-sm flex items-center justify-center mb-3 shadow-neu-sm" style={{ background: `linear-gradient(135deg, ${BRAND.golden}, #E0B83A)` }}>
                <span className="text-dark-neu-400 font-bold text-lg">3</span>
              </div>
              <h3 className="font-bold text-neu-800 mb-2">Voluntary Agreement</h3>
              <p className="text-sm text-neu-600">
                Both parties must agree to the final resolution - nothing is forced
              </p>
            </div>
          </div>
        </div>

        {/* Upgrade CTA — graffiti dark with golden accent */}
        {user?.subscriptionTier === 'free' && (
          <div className="rounded-neu-lg p-8 text-center bg-gradient-to-br from-dark-neu-300 to-dark-neu-500 shadow-dark-neu-lg mt-8">
            <h3 className="text-2xl font-bold text-white mb-2">
              Get Premium Support
            </h3>
            <p className="text-neu-300 mb-4">
              Premium members get priority mediator matching, case management tools, and dedicated support
            </p>
            <button
              onClick={() => window.location.href = '/upgrade'}
              className="px-8 py-3 bg-accent-yellow text-dark-neu-400 rounded-neu-sm font-bold shadow-neu-sm hover:shadow-neu transition-all"
            >
              Upgrade to Premium
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
