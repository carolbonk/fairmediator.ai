import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaSearch, FaEye, FaComments, FaTrophy, FaChartLine, FaUsers } from 'react-icons/fa';
import StatCard from '../../components/dashboard/StatCard';
import SimpleLineChart from '../../components/dashboard/SimpleLineChart';
import SimpleBarChart from '../../components/dashboard/SimpleBarChart';
import SimpleDonutChart from '../../components/dashboard/SimpleDonutChart';

/**
 * DashboardPage - User analytics dashboard
 * Shows usage stats, trends, and insights
 * Premium users get platform-wide analytics
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState(null);
  const [popularMediators, setPopularMediators] = useState(null);
  const [platformStats, setPlatformStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30); // days

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      };

      // Fetch user stats
      const statsRes = await fetch('/api/dashboard/stats?days=' + timeRange, { headers });
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.data);
      }

      // Fetch trends
      const trendsRes = await fetch('/api/dashboard/trends?days=' + timeRange, { headers });
      if (trendsRes.ok) {
        const data = await trendsRes.json();
        setTrends(data.data);
      }

      // Fetch popular mediators
      const mediatorsRes = await fetch('/api/dashboard/popular-mediators?days=' + timeRange, { headers });
      if (mediatorsRes.ok) {
        const data = await mediatorsRes.json();
        setPopularMediators(data.data);
      }

      // Fetch platform stats (premium only)
      if (user?.subscriptionTier === 'premium') {
        const platformRes = await fetch('/api/dashboard/platform?days=' + timeRange, { headers });
        if (platformRes.ok) {
          const data = await platformRes.json();
          setPlatformStats(data.data);
        }
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neu-100 via-neu-150 to-neu-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827' }}>
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Transform data for charts
  const activityChartData = stats?.dailyActivity?.map(day => ({
    label: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: day.count
  })) || [];

  const activityTypeData = stats ? [
    { label: 'Searches', value: stats.byType.search || 0, color: '#667eea' },
    { label: 'Profile Views', value: stats.byType.profileView || 0, color: '#764ba2' },
    { label: 'AI Chats', value: stats.byType.aiCall || 0, color: '#f093fb' }
  ] : [];

  const practiceAreaData = stats?.topPracticeAreas?.map(area => ({
    label: area._id,
    value: area.count
  })) || [];

  const popularMediatorData = popularMediators?.map(m => ({
    label: m.name,
    value: m.viewCount
  })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neu-100 via-neu-150 to-neu-200 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.5rem'
            }}
          >
            Your Dashboard
          </h1>
          <p style={{ fontSize: '1.125rem', color: '#6B7280' }}>
            Track your usage and discover insights
          </p>

          {/* Time Range Selector */}
          <div className="flex gap-2 mt-4">
            {[7, 30, 90].map(days => (
              <button
                key={days}
                onClick={() => setTimeRange(days)}
                className="px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                style={{
                  background: timeRange === days
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : '#F0F2F5',
                  color: timeRange === days ? '#FFFFFF' : '#374151',
                  boxShadow: timeRange === days
                    ? '4px 4px 12px rgba(102, 126, 234, 0.4)'
                    : '4px 4px 8px rgba(163, 177, 198, 0.6), -4px -4px 8px rgba(255, 255, 255, 0.5)'
                }}
              >
                {days === 7 ? '7 Days' : days === 30 ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Searches"
            value={stats?.byType?.search || 0}
            subtitle={'Last ' + timeRange + ' days'}
            icon={FaSearch}
            color="#667eea"
          />
          <StatCard
            title="Profile Views"
            value={stats?.byType?.profileView || 0}
            subtitle={'Last ' + timeRange + ' days'}
            icon={FaEye}
            color="#764ba2"
          />
          <StatCard
            title="AI Conversations"
            value={stats?.byType?.aiCall || 0}
            subtitle={'Last ' + timeRange + ' days'}
            icon={FaComments}
            color="#f093fb"
          />
        </div>

        {/* Activity Chart */}
        <div className="mb-8">
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#111827',
              marginBottom: '1rem'
            }}
          >
            Activity Over Time
          </h2>
          <SimpleLineChart
            data={activityChartData}
            height={250}
            lineColor="#667eea"
            fillColor="#667eea"
          />
        </div>

        {/* Activity Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#111827',
                marginBottom: '1rem'
              }}
            >
              Activity Breakdown
            </h2>
            <SimpleDonutChart
              data={activityTypeData}
              size={280}
              innerRadius={0.65}
            />
          </div>

          <div>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#111827',
                marginBottom: '1rem'
              }}
            >
              Top Practice Areas
            </h2>
            <SimpleBarChart
              data={practiceAreaData}
              height={280}
              horizontal={true}
            />
          </div>
        </div>

        {/* Popular Mediators */}
        {popularMediatorData.length > 0 && (
          <div className="mb-8">
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#111827',
                marginBottom: '1rem'
              }}
            >
              Most Viewed Mediators
            </h2>
            <SimpleBarChart
              data={popularMediatorData}
              height={250}
            />
          </div>
        )}

        {/* Premium Analytics */}
        {user?.subscriptionTier === 'premium' && platformStats && (
          <div className="mt-12">
            <div className="flex items-center mb-6">
              <FaTrophy className="text-yellow-500 text-2xl mr-3" />
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: '#111827'
                }}
              >
                Premium Platform Analytics
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Users"
                value={platformStats.totalUsers || 0}
                icon={FaUsers}
                color="#10B981"
              />
              <StatCard
                title="Active Users"
                value={platformStats.activeUsers || 0}
                subtitle={'Last ' + timeRange + ' days'}
                icon={FaChartLine}
                color="#3B82F6"
              />
              <StatCard
                title="Total Searches"
                value={platformStats.totalSearches || 0}
                icon={FaSearch}
                color="#8B5CF6"
              />
              <StatCard
                title="Conversion Rate"
                value={(platformStats.conversionRate || 0).toFixed(1) + '%'}
                subtitle="Free to Premium"
                icon={FaTrophy}
                color="#F59E0B"
              />
            </div>
          </div>
        )}

        {/* Upgrade CTA for Free Users */}
        {user?.subscriptionTier === 'free' && (
          <div
            className="rounded-2xl p-8 text-center mt-8"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '8px 8px 24px rgba(102, 126, 234, 0.4)'
            }}
          >
            <h3
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#FFFFFF',
                marginBottom: '1rem'
              }}
            >
              Want More Insights?
            </h3>
            <p style={{ fontSize: '1rem', color: '#E0E7FF', marginBottom: '1.5rem' }}>
              Upgrade to Premium for platform-wide analytics, conversion funnels, and advanced metrics
            </p>
            <button
              onClick={() => window.location.href = '/upgrade'}
              className="px-8 py-3 rounded-xl font-bold text-base transition-all duration-200 hover:transform hover:scale-105"
              style={{
                background: '#FFFFFF',
                color: '#667eea',
                boxShadow: '0 4px 12px rgba(255, 255, 255, 0.3)'
              }}
            >
              Upgrade to Premium
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
