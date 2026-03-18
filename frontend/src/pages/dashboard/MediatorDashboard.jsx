import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaEye, FaStar, FaGavel, FaChartLine, FaUser, FaCheckCircle } from 'react-icons/fa';
import StatCard from '../../components/dashboard/StatCard';
import SimpleLineChart from '../../components/dashboard/SimpleLineChart';
import SimpleBarChart from '../../components/dashboard/SimpleBarChart';

/**
 * MediatorDashboard - Dashboard for mediators
 * Shows profile views, case stats, reviews, and performance metrics
 */
export default function MediatorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    fetchMediatorData();
  }, [timeRange]);

  const fetchMediatorData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      };

      // Fetch mediator profile stats
      const statsRes = await fetch(`/api/mediators/my-stats?days=${timeRange}`, { headers });
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.data);
      }

      // Fetch mediator profile
      const profileRes = await fetch('/api/mediators/my-profile', { headers });
      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data.data);
      }
    } catch (error) {
      console.error('Mediator dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neu-100 via-neu-150 to-neu-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-900">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const profileViewsData = stats?.dailyViews?.map(day => ({
    label: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: day.count
  })) || [];

  const casesByAreaData = stats?.casesByArea?.map(area => ({
    label: area._id,
    value: area.count
  })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neu-100 via-neu-150 to-neu-200 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Mediator Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Track your profile performance and case activity
          </p>

          {/* Time Range Selector */}
          <div className="flex gap-2 mt-4">
            {[7, 30, 90].map(days => (
              <button
                key={days}
                onClick={() => setTimeRange(days)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  timeRange === days
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                    : 'bg-neu-200 text-gray-700 shadow-neu'
                }`}
              >
                {days === 7 ? '7 Days' : days === 30 ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Profile Completion Alert */}
        {profile && profile.dataQuality?.completeness < 80 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8 flex items-start gap-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FaUser className="text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1">Complete Your Profile</h3>
              <p className="text-sm text-gray-600 mb-3">
                Your profile is {profile.dataQuality.completeness}% complete.
                Complete profiles get 3x more views!
              </p>
              <a
                href="/mediators/my-profile/edit"
                className="inline-block px-4 py-2 bg-yellow-600 text-white rounded-lg font-semibold text-sm hover:bg-yellow-700 transition-colors"
              >
                Complete Profile
              </a>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Profile Views"
            value={stats?.totalViews || 0}
            subtitle={`Last ${timeRange} days`}
            icon={FaEye}
            color="#8B5CF6"
          />
          <StatCard
            title="Average Rating"
            value={profile?.rating?.toFixed(1) || '5.0'}
            subtitle={`${profile?.totalMediations || 0} cases`}
            icon={FaStar}
            color="#F59E0B"
          />
          <StatCard
            title="Active Cases"
            value={stats?.activeCases || 0}
            subtitle="In progress"
            icon={FaGavel}
            color="#10B981"
          />
          <StatCard
            title="Success Rate"
            value={`${stats?.successRate || 0}%`}
            subtitle="Settlement rate"
            icon={FaCheckCircle}
            color="#3B82F6"
          />
        </div>

        {/* Profile Views Chart */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Profile Views Over Time
          </h2>
          <SimpleLineChart
            data={profileViewsData}
            height={250}
            lineColor="#8B5CF6"
            fillColor="#8B5CF6"
          />
        </div>

        {/* Cases by Practice Area */}
        {casesByAreaData.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Cases by Practice Area
            </h2>
            <SimpleBarChart
              data={casesByAreaData}
              height={280}
              horizontal={true}
            />
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <a
            href="/mediators/my-profile/edit"
            className="bg-neu-200 rounded-2xl p-6 shadow-neu hover:shadow-neu-lg transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <FaUser className="text-white text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Edit Profile</h3>
                <p className="text-sm text-gray-600">Update your information</p>
              </div>
            </div>
          </a>

          <a
            href="/mediators/my-cases"
            className="bg-neu-200 rounded-2xl p-6 shadow-neu hover:shadow-neu-lg transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <FaGavel className="text-white text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">My Cases</h3>
                <p className="text-sm text-gray-600">View case history</p>
              </div>
            </div>
          </a>

          <a
            href="/mediators/analytics"
            className="bg-neu-200 rounded-2xl p-6 shadow-neu hover:shadow-neu-lg transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <FaChartLine className="text-white text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Analytics</h3>
                <p className="text-sm text-gray-600">Detailed insights</p>
              </div>
            </div>
          </a>
        </div>

        {/* Upgrade CTA for Free Tier Mediators */}
        {user?.subscriptionTier === 'free' && (
          <div className="rounded-2xl p-8 text-center bg-gradient-to-r from-purple-600 to-indigo-600 shadow-xl">
            <h3 className="text-2xl font-bold text-white mb-2">
              Boost Your Visibility
            </h3>
            <p className="text-purple-100 mb-4">
              Premium mediators appear 5x higher in search results and get featured badges
            </p>
            <button
              onClick={() => window.location.href = '/upgrade'}
              className="px-8 py-3 bg-white text-purple-600 rounded-xl font-bold hover:scale-105 transition-transform"
            >
              Upgrade to Premium
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
