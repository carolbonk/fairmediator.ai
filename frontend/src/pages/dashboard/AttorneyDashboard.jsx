import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaSearch, FaEye, FaBookmark, FaUsers, FaFileAlt, FaBalanceScale } from 'react-icons/fa';
import StatCard from '../../components/dashboard/StatCard';
import SimpleLineChart from '../../components/dashboard/SimpleLineChart';
import SimpleBarChart from '../../components/dashboard/SimpleBarChart';

/**
 * AttorneyDashboard - Dashboard for attorneys
 * Shows search activity, saved mediators, cases, and research tools
 */
export default function AttorneyDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [savedMediators, setSavedMediators] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);

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

      // Fetch attorney stats
      const statsRes = await fetch(`/api/dashboard/stats?days=${timeRange}`, { headers });
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.data);
      }

      // Fetch saved mediators
      const savedRes = await fetch('/api/attorneys/saved-mediators', { headers });
      if (savedRes.ok) {
        const data = await savedRes.json();
        setSavedMediators(data.data || []);
      }

      // Fetch recent searches
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
      <div className="min-h-screen bg-gradient-to-br from-neu-100 via-neu-150 to-neu-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-900">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const searchActivityData = stats?.dailyActivity?.map(day => ({
    label: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: day.count
  })) || [];

  const practiceAreaData = stats?.topPracticeAreas?.map(area => ({
    label: area._id,
    value: area.count
  })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neu-100 via-neu-150 to-neu-200 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
            Attorney Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Find mediators, track cases, and access legal tools
          </p>

          {/* Time Range Selector */}
          <div className="flex gap-2 mt-4">
            {[7, 30, 90].map(days => (
              <button
                key={days}
                onClick={() => setTimeRange(days)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  timeRange === days
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                    : 'bg-neu-200 text-gray-700 shadow-neu'
                }`}
              >
                {days === 7 ? '7 Days' : days === 30 ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Mediator Searches"
            value={stats?.byType?.search || 0}
            subtitle={`Last ${timeRange} days`}
            icon={FaSearch}
            color="#3B82F6"
          />
          <StatCard
            title="Profiles Viewed"
            value={stats?.byType?.profileView || 0}
            subtitle={`Last ${timeRange} days`}
            icon={FaEye}
            color="#06B6D4"
          />
          <StatCard
            title="Saved Mediators"
            value={savedMediators.length}
            subtitle="Your shortlist"
            icon={FaBookmark}
            color="#8B5CF6"
          />
          <StatCard
            title="Active Cases"
            value={stats?.activeCases || 0}
            subtitle="In mediation"
            icon={FaFileAlt}
            color="#10B981"
          />
        </div>

        {/* Search Activity Chart */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Search Activity
          </h2>
          <SimpleLineChart
            data={searchActivityData}
            height={250}
            lineColor="#3B82F6"
            fillColor="#3B82F6"
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Practice Areas */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Practice Areas Searched
            </h2>
            <SimpleBarChart
              data={practiceAreaData}
              height={280}
              horizontal={true}
            />
          </div>

          {/* Recent Searches */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Recent Searches
            </h2>
            <div className="bg-neu-200 rounded-2xl p-6 shadow-neu space-y-3">
              {recentSearches.length > 0 ? (
                recentSearches.map((search, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                    <div>
                      <p className="font-semibold text-gray-900">{search.query || 'General search'}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(search.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <a
                      href={`/search?q=${encodeURIComponent(search.query || '')}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Repeat
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No recent searches</p>
              )}
            </div>
          </div>
        </div>

        {/* Saved Mediators */}
        {savedMediators.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Saved Mediators
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedMediators.slice(0, 6).map((mediator) => (
                <div key={mediator._id} className="bg-neu-200 rounded-2xl p-6 shadow-neu hover:shadow-neu-lg transition-all">
                  <h3 className="font-bold text-gray-900 mb-1">{mediator.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{mediator.specializations?.join(', ')}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center">
                      <FaStar className="text-yellow-500 text-sm" />
                      <span className="ml-1 font-semibold text-gray-900">{mediator.rating?.toFixed(1)}</span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-600">{mediator.yearsExperience}+ years</span>
                  </div>
                  <a
                    href={`/mediators/${mediator._id}`}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
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
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All Saved Mediators →
                </a>
              </div>
            )}
          </div>
        )}

        {/* Quick Tools */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a
              href="/search"
              className="bg-neu-200 rounded-2xl p-6 shadow-neu hover:shadow-neu-lg transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FaSearch className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Find Mediators</h3>
                  <p className="text-sm text-gray-600">Search & filter</p>
                </div>
              </div>
            </a>

            <a
              href="/conflict-checker"
              className="bg-neu-200 rounded-2xl p-6 shadow-neu hover:shadow-neu-lg transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-pink-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FaUsers className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Conflict Checker</h3>
                  <p className="text-sm text-gray-600">Verify neutrality</p>
                </div>
              </div>
            </a>

            <a
              href="/compare"
              className="bg-neu-200 rounded-2xl p-6 shadow-neu hover:shadow-neu-lg transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FaBalanceScale className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Compare</h3>
                  <p className="text-sm text-gray-600">Side-by-side</p>
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* Upgrade CTA */}
        {user?.subscriptionTier === 'free' && (
          <div className="rounded-2xl p-8 text-center bg-gradient-to-r from-blue-600 to-cyan-600 shadow-xl">
            <h3 className="text-2xl font-bold text-white mb-2">
              Unlock Premium Tools
            </h3>
            <p className="text-blue-100 mb-4">
              Advanced conflict detection, unlimited searches, and AI-powered mediator matching
            </p>
            <button
              onClick={() => window.location.href = '/upgrade'}
              className="px-8 py-3 bg-white text-blue-600 rounded-xl font-bold hover:scale-105 transition-transform"
            >
              Upgrade to Premium
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
