import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaSearch, FaUsers, FaBalanceScale, FaStar, FaInfoCircle, FaMapMarkerAlt } from 'react-icons/fa';
import SimpleLineChart from '../../components/dashboard/SimpleLineChart';
import { PRACTICE_AREA_CATEGORIES } from '../../data/practiceAreas';
import { US_STATES } from '../../data/mockMediators';

// Brand palette (mirrors MediatorDashboard)
const BRAND = {
  blue: '#2563EB',
  blueDark: '#1E3A8A',
  blueDeep: '#1D4ED8',
  golden: '#F5D15C',
  graphite: '#252D3A',
};

export default function AttorneyDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [savedMediators, setSavedMediators] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange] = useState(30);

  const [practiceFilter, setPracticeFilter] = useState('');
  const [jurisdictionState, setJurisdictionState] = useState('');

  const userState = user?.state || user?.profile?.state || null;

  const filteredCategories = useMemo(() => {
    const q = practiceFilter.trim().toLowerCase();
    if (!q) return PRACTICE_AREA_CATEGORIES;
    return PRACTICE_AREA_CATEGORIES
      .map(c => ({
        ...c,
        areas: c.areas.filter(a => a.toLowerCase().includes(q)),
      }))
      .filter(c => c.areas.length > 0);
  }, [practiceFilter]);

  const handlePracticeAreaSearch = (area) => {
    // TODO(human): decide what happens when an attorney clicks a practice area chip.
    // Inputs available: `area` (string, e.g. "Water Rights"), `userState` (string|null,
    // e.g. "Texas"). You should navigate the user toward results AND record the
    // selection so the dashboard's recent searches / topPracticeAreas analytics
    // can pick it up on the next fetch. Consider: scoping to the attorney's state,
    // URL param naming, and whether to fire-and-forget the analytics call.
  };

  useEffect(() => {
    fetchAttorneyData();
  }, [timeRange]);

  const fetchAttorneyData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      };

      const statsRes = await fetch(`/api/dashboard/stats?days=${timeRange}`, { headers });
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.data);
      }

      const savedRes = await fetch('/api/attorneys/saved-mediators', { headers });
      if (savedRes.ok) {
        const data = await savedRes.json();
        const mediators = (data.data || []).map(saved => saved.mediator).filter(Boolean);
        setSavedMediators(mediators);
      }

      const searchesRes = await fetch('/api/attorneys/recent-searches?limit=5', { headers });
      if (searchesRes.ok) {
        const data = await searchesRes.json();
        setRecentSearches(data.data || []);
      }
    } catch (error) {
      console.error('Attorney dashboard fetch error:', error);
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

  const searchActivityData = stats?.dailyActivity?.map(day => ({
    label: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: day.count
  })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neu-100 to-neu-200 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-700 to-dark-neu-300 bg-clip-text text-transparent mb-2">
            Attorney Analytics Dashboard
          </h1>
          <p className="text-lg text-neu-600">
            Find mediators, track cases, and access legal tools
          </p>
        </div>

        {/* Welcome Guide */}
        <div className="bg-neu-100 rounded-neu-lg p-6 mb-8 shadow-neu border-l-4 border-accent-yellow">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-neu-sm flex items-center justify-center flex-shrink-0 shadow-neu-inset-sm bg-neu-100">
              <FaInfoCircle className="text-blue-700 text-xl" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-neu-800 mb-2">Welcome to Fair Mediator</h3>
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

        {/* Recent Searches */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-neu-800 mb-4">
            Recent Searches
          </h2>
          <div className="bg-neu-100 rounded-neu-lg p-6 shadow-neu space-y-3">
            {recentSearches.length > 0 ? (
              recentSearches.map((search, idx) => (
                <div key={search.id || idx} className="flex items-center justify-between py-2 border-b border-neu-200 last:border-0">
                  <div>
                    <p className="font-semibold text-neu-800">{search.query || 'General search'}</p>
                    <p className="text-sm text-neu-600">
                      {new Date(search.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <a
                    href={`/search?q=${encodeURIComponent(search.query || '')}`}
                    className="text-blue-700 hover:text-blue-900 text-sm font-medium"
                  >
                    Repeat
                  </a>
                </div>
              ))
            ) : (
              <p className="text-neu-500 text-center py-4">No recent searches</p>
            )}
          </div>
        </div>

        {/* Search for Mediator's Practice Areas */}
        <div className="mb-8">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-2xl font-bold text-neu-800">
              Search for Mediator's Practice Areas
            </h2>
            {userState && (
              <span className="text-sm text-neu-600">
                Available in {userState}
              </span>
            )}
          </div>

          <div className="bg-neu-100 rounded-neu-lg shadow-neu p-4 mb-4">
            <label htmlFor="jurisdiction-select" className="flex items-center gap-2 text-sm font-semibold text-neu-700 mb-2">
              <FaMapMarkerAlt style={{ color: BRAND.blueDark }} />
              Mediation rules differ by jurisdiction.
            </label>
            <select
              id="jurisdiction-select"
              value={jurisdictionState}
              onChange={(e) => setJurisdictionState(e.target.value)}
              className="w-full px-4 py-3 rounded-neu-sm bg-neu-100 text-neu-800 text-sm font-medium shadow-neu-inset-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="">Select a state…</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="bg-neu-100 rounded-neu-lg shadow-neu p-4">
            <div className="relative mb-3">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neu-400 text-sm" />
              <input
                type="text"
                value={practiceFilter}
                onChange={(e) => setPracticeFilter(e.target.value)}
                placeholder="Filter practice areas…"
                className="w-full pl-9 pr-3 py-2 rounded-neu-sm bg-neu-100 text-sm text-neu-800 placeholder-neu-400 shadow-neu-inset focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                aria-label="Filter practice areas"
              />
            </div>
            <div
              className="overflow-y-auto pr-2 space-y-8 py-2"
              style={{ maxHeight: '560px' }}
            >
              {filteredCategories.length === 0 ? (
                <p className="text-neu-500 text-sm text-center py-6">
                  No practice areas match “{practiceFilter}”.
                </p>
              ) : (
                filteredCategories.map(({ category, areas }) => (
                  <div key={category} className="pb-4 border-b border-neu-200 last:border-0 last:pb-0">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-neu-600 mb-3">
                      {category}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {areas.map((area) => (
                        <button
                          key={area}
                          type="button"
                          onClick={() => handlePracticeAreaSearch(area)}
                          className="px-3 py-1.5 rounded-full text-xs font-medium bg-neu-100 text-neu-800 shadow-neu-sm hover:shadow-neu hover:text-blue-700 transition-all"
                          style={{ borderLeft: `3px solid ${BRAND.blue}33` }}
                        >
                          {area}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Search Activity Chart */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-neu-800 mb-4">
            Search Activity
          </h2>
          <SimpleLineChart
            data={searchActivityData}
            height={250}
            lineColor={BRAND.blue}
            fillColor={BRAND.blue}
          />
        </div>

        {/* Saved Mediators */}
        {savedMediators.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-neu-800 mb-4">
              Saved Mediators
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedMediators.slice(0, 6).map((mediator) => (
                <div key={mediator._id} className="bg-neu-100 rounded-neu-lg p-6 shadow-neu hover:shadow-neu-lg transition-all">
                  <h3 className="font-bold text-neu-800 mb-1">{mediator.name}</h3>
                  <p className="text-sm text-neu-600 mb-3">{mediator.specializations?.join(', ')}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center">
                      <FaStar className="text-accent-yellow text-sm" />
                      <span className="ml-1 font-semibold text-neu-800">{mediator.rating?.toFixed(1)}</span>
                    </div>
                    <span className="text-neu-400">•</span>
                    <span className="text-sm text-neu-600">{mediator.yearsExperience}+ years</span>
                  </div>
                  <a
                    href={`/mediators/${mediator._id}`}
                    className="text-blue-700 hover:text-blue-900 text-sm font-medium"
                  >
                    View Profile →
                  </a>
                </div>
              ))}
            </div>
            {savedMediators.length > 6 && (
              <div className="text-center mt-4">
                <a
                  href="/attorneys/saved-mediators"
                  className="text-blue-700 hover:text-blue-900 font-medium"
                >
                  View All Saved Mediators →
                </a>
              </div>
            )}
          </div>
        )}

        {/* Quick Tools */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-neu-800 mb-4">Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a
              href="/search"
              className="bg-neu-100 rounded-neu-lg p-6 shadow-neu hover:shadow-neu-lg transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-neu-sm flex items-center justify-center shadow-neu-sm group-hover:scale-105 transition-transform" style={{ background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.blueDeep})` }}>
                  <FaSearch className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="font-bold text-neu-800">Find Mediators</h3>
                  <p className="text-sm text-neu-600">Search & filter</p>
                </div>
              </div>
            </a>

            <a
              href="/conflict-checker"
              className="bg-neu-100 rounded-neu-lg p-6 shadow-neu hover:shadow-neu-lg transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-neu-sm flex items-center justify-center shadow-neu-sm group-hover:scale-105 transition-transform" style={{ background: `linear-gradient(135deg, ${BRAND.graphite}, ${BRAND.blueDark})` }}>
                  <FaUsers className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="font-bold text-neu-800">Conflict Checker</h3>
                  <p className="text-sm text-neu-600">Verify neutrality</p>
                </div>
              </div>
            </a>

            <a
              href="/compare"
              className="bg-neu-100 rounded-neu-lg p-6 shadow-neu hover:shadow-neu-lg transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-neu-sm flex items-center justify-center shadow-neu-sm group-hover:scale-105 transition-transform" style={{ background: `linear-gradient(135deg, ${BRAND.golden}, #E0B83A)` }}>
                  <FaBalanceScale className="text-dark-neu-400 text-xl" />
                </div>
                <div>
                  <h3 className="font-bold text-neu-800">Compare</h3>
                  <p className="text-sm text-neu-600">Side-by-side</p>
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* Upgrade CTA — graffiti dark with golden accent */}
        {user?.subscriptionTier === 'free' && (
          <div className="rounded-neu-lg p-8 text-center bg-gradient-to-br from-dark-neu-300 to-dark-neu-500 shadow-dark-neu-lg">
            <h3 className="text-2xl font-bold text-white mb-2">
              Unlock Premium Tools
            </h3>
            <p className="text-neu-300 mb-4">
              Advanced conflict detection, unlimited searches, and AI-powered mediator matching
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
