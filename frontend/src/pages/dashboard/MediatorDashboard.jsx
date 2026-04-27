import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaEye, FaStar, FaGavel, FaChartLine, FaUser, FaCheckCircle, FaPlus, FaMapMarkerAlt, FaBriefcase, FaInfoCircle, FaRobot, FaStore, FaTimes } from 'react-icons/fa';
import StatCard from '../../components/dashboard/StatCard';
import SimpleLineChart from '../../components/dashboard/SimpleLineChart';
import SimpleBarChart from '../../components/dashboard/SimpleBarChart';
import { US_STATES } from '../../data/mockMediators';
import { PRACTICE_AREA_CATEGORIES, ALL_PRACTICE_AREAS } from '../../data/practiceAreas';

// Brand palette tokens
const BRAND = {
  blue: '#2563EB',
  blueDark: '#1E3A8A',
  blueDeep: '#1D4ED8',
  golden: '#F5D15C',
  graphite: '#252D3A',
};

// Brand-only palette for chart bars (cycled in order)
const CHART_PALETTE = [BRAND.blue, BRAND.blueDeep, BRAND.blueDark, BRAND.golden, BRAND.graphite];

// Welcome-banner CTAs in display order. The first CTA whose `key` is returned
// by `getPrimaryCta` is rendered with the filled/primary style; the rest are secondary.
const WELCOME_CTAS = [
  {
    key: 'how-it-works',
    label: 'How It Works',
    href: '/mediator/how-it-works',
    icon: FaInfoCircle,
  },
  {
    key: 'crm',
    label: 'How the Mediators CRM Works',
    href: '/mediator/how-it-works/crm',
    icon: FaRobot,
  },
  {
    key: 'marketplace',
    label: 'How the Mediators Marketplace Works',
    href: '/mediator/how-it-works/marketplace',
    icon: FaStore,
  },
];

function getPrimaryCta(profile, stats) {
  if ((stats?.activeCases ?? 0) > 0) return 'crm';
  if ((profile?.dataQuality?.completeness ?? 0) >= 80) return 'marketplace';
  return 'how-it-works';
}

export default function MediatorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);

  // Practice-area selection + state-scoped custom areas
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [savedAreas, setSavedAreas] = useState([]); // last persisted snapshot — drives dirty/save-bar
  const [customAreas, setCustomAreas] = useState([]); // [{ state, name }]
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaState, setNewAreaState] = useState('');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);
  const [savingCoverage, setSavingCoverage] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    fetchMediatorData();
  }, [timeRange]);

  // Hydrate practice-area UI when the profile loads.
  // Prefer canonical `specializations`; fall back to deprecated `practiceAreas` alias for one release.
  useEffect(() => {
    if (!profile) return;
    const initial = Array.isArray(profile.specializations)
      ? profile.specializations
      : Array.isArray(profile.practiceAreas)
        ? profile.practiceAreas
        : [];
    setSelectedAreas(initial);
    setSavedAreas(initial);
    if (Array.isArray(profile.customPracticeAreas)) setCustomAreas(profile.customPracticeAreas);
  }, [profile]);

  const saveProfile = async (patch) => {
    const token = localStorage.getItem('accessToken');
    const res = await fetch('/api/mediators/my-profile', {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(patch)
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error?.message || body?.message || `Save failed (${res.status})`);
    }
    return res.json();
  };

  // Dirty check — order-insensitive set comparison so toggle order doesn't matter.
  const isCoverageDirty = (() => {
    if (selectedAreas.length !== savedAreas.length) return true;
    const savedSet = new Set(savedAreas);
    return selectedAreas.some(a => !savedSet.has(a));
  })();

  const saveCoverage = async () => {
    setSaveError('');
    setSavingCoverage(true);
    try {
      await saveProfile({ specializations: selectedAreas });
      setSavedAreas(selectedAreas);
    } catch (err) {
      setSaveError(err.message || 'Could not save coverage changes.');
    } finally {
      setSavingCoverage(false);
    }
  };

  const discardCoverage = () => {
    setSelectedAreas(savedAreas);
    setSaveError('');
  };

  const toggleArea = (area) => {
    setSelectedAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const handleAddPracticeArea = async () => {
    setAddError('');
    const name = newAreaName.trim();

    if (!name) {
      setAddError('Practice area name is required.');
      return;
    }
    if (!US_STATES.includes(newAreaState)) {
      setAddError('Select a state from the list.');
      return;
    }

    const isDuplicate = customAreas.some(
      (a) =>
        a.state.toLowerCase() === newAreaState.toLowerCase() &&
        a.name.toLowerCase() === name.toLowerCase()
    );
    if (isDuplicate) {
      setAddError(`"${name}" is already added for ${newAreaState}.`);
      return;
    }

    setAdding(true);
    const prev = customAreas;
    const next = [...customAreas, { state: newAreaState, name }];
    setCustomAreas(next);
    setNewAreaName('');
    setNewAreaState('');
    try {
      await saveProfile({ customPracticeAreas: next });
    } catch (err) {
      setCustomAreas(prev); // optimistic rollback on save failure
      setAddError(err.message || 'Could not save the new practice area.');
    } finally {
      setAdding(false);
    }
  };

  const removeCustomArea = async (idx) => {
    const next = customAreas.filter((_, i) => i !== idx);
    const prev = customAreas;
    setCustomAreas(next);
    try {
      await saveProfile({ customPracticeAreas: next });
    } catch (err) {
      setCustomAreas(prev); // optimistic rollback on save failure
      setAddError(err.message || 'Could not remove that practice area.');
    }
  };

  const fetchMediatorData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      };

      const statsRes = await fetch(`/api/mediators/my-stats?days=${timeRange}`, { headers });
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.data);
      }

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
      <div className="min-h-screen bg-gradient-to-br from-neu-100 to-neu-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-lg font-semibold text-neu-800">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const profileViewsData = stats?.dailyViews?.map(day => ({
    label: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: day.count
  })) || [];

  const casesByAreaData = stats?.casesByArea?.map((area, i) => ({
    label: area._id,
    value: area.count,
    color: CHART_PALETTE[i % CHART_PALETTE.length]
  })) || [];

  const primaryCtaKey = getPrimaryCta(profile, stats);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neu-100 to-neu-200 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-700 to-dark-neu-300 bg-clip-text text-transparent mb-2">
            Mediator Analytics Dashboard
          </h1>
          <p className="text-lg text-neu-600">
            Track your profile performance and case activity
          </p>

          {/* Time Range Selector */}
          <div className="flex gap-2 mt-4">
            {[7, 30, 90].map(days => (
              <button
                key={days}
                onClick={() => setTimeRange(days)}
                className={`px-4 py-2 rounded-neu-sm font-semibold text-sm transition-all ${
                  timeRange === days
                    ? 'bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-neu-sm'
                    : 'bg-neu-100 text-neu-700 shadow-neu-sm hover:shadow-neu'
                }`}
              >
                {days === 7 ? '7 Days' : days === 30 ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Welcome Guide — Mediator-tailored */}
        <div className="bg-neu-100 rounded-neu-lg p-6 mb-8 shadow-neu border-l-4 border-accent-yellow">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-neu-sm flex items-center justify-center flex-shrink-0 shadow-neu-inset-sm bg-neu-100">
              <FaInfoCircle className="text-blue-700 text-xl" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-neu-800 mb-2">Welcome to FairMediator for Mediators</h3>
              <p className="text-neu-700 mb-4">
                FairMediator is the verified marketplace and AI-powered case workspace for mediators.
                Get matched with conflict-screened cases in your jurisdiction, run intake through settlement
                in one workspace, and let analytics show you where to grow your practice.
              </p>
              <div className="flex flex-wrap gap-2">
                {WELCOME_CTAS.map(({ key, label, href, icon: Icon }) => {
                  const isPrimary = key === primaryCtaKey;
                  return (
                    <a
                      key={key}
                      href={href}
                      className={`px-4 py-2 rounded-neu-sm font-semibold text-sm shadow-neu-sm hover:shadow-neu transition-all inline-flex items-center gap-2 ${
                        isPrimary ? 'text-white' : 'bg-neu-100 text-blue-700'
                      }`}
                      style={
                        isPrimary
                          ? { background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.blueDeep})` }
                          : undefined
                      }
                    >
                      <Icon className="text-xs" />
                      {label}
                    </a>
                  );
                })}
                <a
                  href="/mediator/faq"
                  className="px-4 py-2 bg-neu-100 text-blue-700 rounded-neu-sm font-semibold text-sm shadow-neu-sm hover:shadow-neu transition-all"
                >
                  FAQs
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Completion Alert (golden) */}
        {profile && profile.dataQuality?.completeness < 80 && (
          <div className="bg-neu-100 rounded-neu-lg p-6 mb-8 flex items-start gap-4 shadow-neu border-l-4 border-accent-yellow">
            <div className="w-10 h-10 rounded-neu-sm flex items-center justify-center flex-shrink-0 shadow-neu-inset-sm bg-neu-100">
              <FaUser className="text-accent-yellow" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-neu-800 mb-1">Complete Your Profile</h3>
              <p className="text-sm text-neu-600 mb-3">
                Your profile is {profile.dataQuality.completeness}% complete.
                Complete profiles get 3x more views!
              </p>
              <a
                href="/mediators/my-profile/edit"
                className="inline-block px-4 py-2 bg-accent-yellow text-dark-neu-400 rounded-neu-sm font-semibold text-sm shadow-neu-sm hover:shadow-neu transition-all"
              >
                Complete Profile
              </a>
            </div>
          </div>
        )}

        {/* Key Metrics — brand colors only */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Profile Views"
            value={stats?.totalViews || 0}
            subtitle={`Last ${timeRange} days`}
            icon={FaEye}
            color={BRAND.blue}
          />
          <StatCard
            title="Average Rating"
            value={profile?.rating?.toFixed(1) || '5.0'}
            subtitle={`${profile?.totalMediations || 0} cases`}
            icon={FaStar}
            color={BRAND.golden}
          />
          <StatCard
            title="Active Cases"
            value={stats?.activeCases || 0}
            subtitle="In progress"
            icon={FaGavel}
            color={BRAND.blueDark}
          />
          <StatCard
            title="Success Rate"
            value={`${stats?.successRate || 0}%`}
            subtitle="Settlement rate"
            icon={FaCheckCircle}
            color={BRAND.blueDeep}
          />
        </div>

        {/* Profile Views Chart */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-neu-800 mb-4">
            Profile Views Over Time
          </h2>
          <SimpleLineChart
            data={profileViewsData}
            height={250}
            lineColor={BRAND.blue}
            fillColor={BRAND.blue}
          />
        </div>

        {/* Cases by Practice Area */}
        {casesByAreaData.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-neu-800 mb-4">
              Cases by Practice Area
            </h2>
            <SimpleBarChart
              data={casesByAreaData}
              height={280}
              horizontal={true}
              barColor={BRAND.blue}
            />
          </div>
        )}

        {/* My Practice Areas — full coverage list */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold text-neu-800 mb-1">
                My Practice Areas
              </h2>
              <p className="text-sm text-neu-600">
                Tap any area to toggle whether you mediate it. {selectedAreas.length} of {ALL_PRACTICE_AREAS.length} selected.
              </p>
            </div>
            <div className="text-xs text-neu-600 bg-neu-100 rounded-neu-sm px-3 py-2 shadow-neu-inset-sm flex items-center gap-2">
              <FaBriefcase style={{ color: BRAND.blue }} />
              Coverage applies across all 50 states unless scoped below
            </div>
          </div>

          <div className="bg-neu-100 rounded-neu-lg p-6 shadow-neu">
            <div
              className="overflow-y-auto pr-2 space-y-8"
              style={{ maxHeight: '560px' }}
            >
              {PRACTICE_AREA_CATEGORIES.map(({ category, areas }) => (
                <div key={category}>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-neu-600 mb-3">
                    {category}
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    {areas.map((area) => {
                      const active = selectedAreas.includes(area);
                      return (
                        <button
                          key={area}
                          type="button"
                          onClick={() => toggleArea(area)}
                          className={`px-4 py-2 rounded-neu-sm text-sm font-semibold transition-all ${
                            active
                              ? 'text-white shadow-neu-sm'
                              : 'text-neu-700 bg-neu-100 shadow-neu-sm hover:shadow-neu'
                          }`}
                          style={
                            active
                              ? { background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.blueDeep})` }
                              : undefined
                          }
                          aria-pressed={active}
                        >
                          {area}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {customAreas.length > 0 && (
              <div className="mt-6 pt-6 border-t border-neu-200">
                <h3 className="text-sm font-bold text-neu-700 mb-3 flex items-center gap-2">
                  <FaMapMarkerAlt style={{ color: BRAND.blueDark }} />
                  State-Specific Areas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {customAreas.map((entry, idx) => (
                    <span
                      key={`${entry.state}-${entry.name}-${idx}`}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-neu-sm text-sm font-semibold text-dark-neu-400 shadow-neu-sm"
                      style={{ background: BRAND.golden }}
                    >
                      <FaMapMarkerAlt className="text-xs" />
                      {entry.name}
                      <span className="text-xs font-normal opacity-80">· {entry.state}</span>
                      <button
                        type="button"
                        onClick={() => removeCustomArea(idx, entry)}
                        aria-label={`Remove ${entry.name} (${entry.state})`}
                        className="ml-1 -mr-1 p-1 rounded-full hover:bg-dark-neu-400/15 focus:outline-none focus:ring-2 focus:ring-dark-neu-400/40 transition"
                      >
                        <FaTimes className="text-xs" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(isCoverageDirty || saveError) && (
              <div className="mt-6 pt-6 border-t border-neu-200 flex flex-wrap items-center gap-3 justify-between">
                <div className="text-sm">
                  {isCoverageDirty && (
                    <span className="font-semibold text-neu-800">You have unsaved coverage changes.</span>
                  )}
                  {saveError && (
                    <span className="block mt-1 text-red-700">{saveError}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={discardCoverage}
                    disabled={savingCoverage || !isCoverageDirty}
                    className="px-4 py-2 rounded-neu-sm text-sm font-semibold text-neu-700 bg-neu-100 shadow-neu-sm hover:shadow-neu disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={saveCoverage}
                    disabled={savingCoverage || !isCoverageDirty}
                    className="px-4 py-2 rounded-neu-sm text-sm font-semibold text-white shadow-neu-sm hover:shadow-neu disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    style={{ background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.blueDeep})` }}
                  >
                    {savingCoverage ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add State-Scoped Practice Area CTA */}
        <div
          className="rounded-neu-lg p-6 mb-8 shadow-dark-neu-lg"
          style={{ background: `linear-gradient(135deg, ${BRAND.blueDark}, ${BRAND.graphite})` }}
        >
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                <FaPlus style={{ color: BRAND.golden }} />
                Add a State-Specific Practice Area
              </h3>
              <p className="text-sm text-neu-300">
                Mediation rules differ by jurisdiction. Add custom areas tied to the state where you're qualified —
                available for all 50 states.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_220px_auto] gap-3 mt-5">
            <input
              type="text"
              value={newAreaName}
              onChange={(e) => setNewAreaName(e.target.value)}
              placeholder="e.g. Agricultural Land Disputes"
              className="px-4 py-3 rounded-neu-sm bg-neu-100 text-neu-800 text-sm font-medium shadow-neu-inset-sm focus:outline-none focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': BRAND.golden }}
              disabled={adding}
            />
            <select
              value={newAreaState}
              onChange={(e) => setNewAreaState(e.target.value)}
              className="px-4 py-3 rounded-neu-sm bg-neu-100 text-neu-800 text-sm font-medium shadow-neu-inset-sm focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': BRAND.golden }}
              disabled={adding}
            >
              <option value="">Select state…</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddPracticeArea}
              disabled={adding}
              className="px-6 py-3 rounded-neu-sm font-bold text-sm shadow-neu-sm hover:shadow-neu transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: BRAND.golden, color: BRAND.graphite }}
            >
              {adding ? 'Adding…' : 'Add Practice Area'}
            </button>
          </div>

          {addError && (
            <p className="mt-3 text-sm font-semibold" style={{ color: BRAND.golden }}>
              {addError}
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <a
            href="/mediators/my-profile/edit"
            className="bg-neu-100 rounded-neu-lg p-6 shadow-neu hover:shadow-neu-lg transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-neu-sm flex items-center justify-center shadow-neu-sm group-hover:scale-105 transition-transform" style={{ background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.blueDeep})` }}>
                <FaUser className="text-white text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-neu-800">Edit Profile</h3>
                <p className="text-sm text-neu-600">Update your information</p>
              </div>
            </div>
          </a>

          <a
            href="/mediators/my-cases"
            className="bg-neu-100 rounded-neu-lg p-6 shadow-neu hover:shadow-neu-lg transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-neu-sm flex items-center justify-center shadow-neu-sm group-hover:scale-105 transition-transform" style={{ background: `linear-gradient(135deg, ${BRAND.graphite}, ${BRAND.blueDark})` }}>
                <FaGavel className="text-white text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-neu-800">My Cases</h3>
                <p className="text-sm text-neu-600">View case history</p>
              </div>
            </div>
          </a>

          <a
            href="/mediators/analytics"
            className="bg-neu-100 rounded-neu-lg p-6 shadow-neu hover:shadow-neu-lg transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-neu-sm flex items-center justify-center shadow-neu-sm group-hover:scale-105 transition-transform" style={{ background: `linear-gradient(135deg, ${BRAND.golden}, #E0B83A)` }}>
                <FaChartLine className="text-dark-neu-400 text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-neu-800">Analytics</h3>
                <p className="text-sm text-neu-600">Detailed insights</p>
              </div>
            </div>
          </a>
        </div>

        {/* Upgrade CTA — graffiti dark with golden accent */}
        {user?.subscriptionTier === 'free' && (
          <div className="rounded-neu-lg p-8 text-center bg-gradient-to-br from-dark-neu-300 to-dark-neu-500 shadow-dark-neu-lg">
            <h3 className="text-2xl font-bold text-white mb-2">
              Boost Your Visibility
            </h3>
            <p className="text-neu-300 mb-4">
              Premium mediators appear 5× higher in search results and get a featured badge
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
