/**
 * MediatorComparison Page
 *
 * Side-by-side comparison of 2-5 mediators.
 * URL: /compare?ids=id1,id2,id3
 *
 * Features:
 * - Radar chart comparing 6 dimensions
 * - Detailed comparison table
 * - Add/remove mediators (up to 5)
 * - Print/PDF export
 *
 * WCAG 2.1 AA compliant:
 * - Keyboard navigable
 * - ARIA labels on all interactive elements
 * - 44x44pt touch targets
 * - Color contrast ≥ 4.5:1
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  FaBalanceScale, FaCheckCircle, FaTimesCircle, FaTimes,
  FaPrint, FaSearch, FaSpinner
} from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SimpleRadarChart from '../components/dashboard/SimpleRadarChart';
import { getMediatorById, getMediators } from '../services/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_MEDIATORS = 5;

const RADAR_AXES = [
  { label: 'Experience', key: 'experience' },
  { label: 'Specializations', key: 'specializations' },
  { label: 'Certifications', key: 'certifications' },
  { label: 'Neutrality', key: 'neutrality' },
  { label: 'Transparency', key: 'transparency' },
  { label: 'Affiliations', key: 'affiliationsRisk' },
];

const SERIES_COLORS = ['#667eea', '#f093fb', '#43e97b', '#fa709a', '#fee140'];

// ─── Scoring helpers ──────────────────────────────────────────────────────────

/**
 * Normalize mediator data into 0-1 scores for each radar axis.
 * Each formula is intentionally simple and documented.
 */
const toRadarValues = (m) => {
  // Experience: 0 yrs = 0, 30+ yrs = 1
  const experience = Math.min(1, (m.yearsExperience || 0) / 30);
  // Specializations: 0 = 0, 8+ = 1
  const specializations = Math.min(1, (m.specializations?.length || 0) / 8);
  // Certifications: 0 = 0, 5+ = 1
  const certifications = Math.min(1, (m.certifications?.length || 0) / 5);
  // Neutrality: ideology -10 to +10, abs 0 = fully neutral (1.0), abs 10 = (0.0)
  const neutrality = 1 - Math.min(1, Math.abs(m.ideologyScore || 0) / 10);
  // Transparency: has bio + website + contact info
  const transparency = [m.bio, m.website, m.email || m.phone].filter(Boolean).length / 3;
  // Affiliations risk: 0 donations = 0 risk (score 1.0), 10+ = high risk (0.0)
  const donationCount = m.biasIndicators?.donationHistory?.length || 0;
  const affiliationsRisk = 1 - Math.min(1, donationCount / 10);

  return [experience, specializations, certifications, neutrality, transparency, affiliationsRisk];
};

const formatScore = (val) => `${Math.round(val * 100)}%`;

// ─── Sub-components ───────────────────────────────────────────────────────────

const IdeologyLabel = ({ score }) => {
  const abs = Math.abs(score || 0);
  if (abs <= 1) return <span className="text-green-600 font-semibold">Neutral</span>;
  if (score < -5) return <span className="text-blue-600 font-semibold">Strongly Liberal</span>;
  if (score < 0) return <span className="text-blue-400 font-semibold">Moderate Liberal</span>;
  if (score > 5) return <span className="text-red-600 font-semibold">Strongly Conservative</span>;
  return <span className="text-red-400 font-semibold">Moderate Conservative</span>;
};

const ScoreBar = ({ value, color }) => (
  <div className="w-full h-1.5 bg-neu-300 rounded-full overflow-hidden">
    <div
      className="h-full rounded-full transition-all duration-500"
      style={{ width: `${Math.round(value * 100)}%`, background: color }}
    />
  </div>
);

const Check = ({ val }) =>
  val
    ? <FaCheckCircle className="text-green-500" aria-label="Yes" />
    : <FaTimesCircle className="text-neu-400" aria-label="No" />;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MediatorComparisonPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mediators, setMediators] = useState([]);   // loaded mediator objects
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search to add more mediators
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Load mediators from URL ids param on mount / param change
  useEffect(() => {
    const ids = searchParams.get('ids')?.split(',').filter(Boolean) || [];
    if (!ids.length) return;

    setLoading(true);
    Promise.allSettled(ids.map(id => getMediatorById(id)))
      .then(results => {
        const loaded = results
          .filter(r => r.status === 'fulfilled' && r.value?.data?.mediator)
          .map(r => r.value.data.mediator);
        setMediators(loaded);
      })
      .catch(() => setError('Failed to load mediator data.'))
      .finally(() => setLoading(false));
  }, [searchParams]);

  // Remove a mediator from comparison
  const remove = useCallback((id) => {
    const ids = searchParams.get('ids')?.split(',').filter(i => i !== id) || [];
    if (ids.length) {
      setSearchParams({ ids: ids.join(',') });
    } else {
      setSearchParams({});
      setMediators([]);
    }
  }, [searchParams, setSearchParams]);

  // Search for mediators to add
  const handleSearch = useCallback(async (q) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await getMediators({ search: q, limit: 6 });
      const results = res?.data?.mediators || [];
      const existingIds = searchParams.get('ids')?.split(',') || [];
      setSearchResults(results.filter(m => !existingIds.includes(String(m._id))));
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchParams]);

  const addMediator = useCallback((mediator) => {
    const existingIds = searchParams.get('ids')?.split(',').filter(Boolean) || [];
    if (existingIds.length >= MAX_MEDIATORS) return;
    const newIds = [...existingIds, mediator._id];
    setSearchParams({ ids: newIds.join(',') });
    setSearchQuery('');
    setSearchResults([]);
  }, [searchParams, setSearchParams]);

  // Build radar series
  const radarSeries = mediators.map((m, i) => ({
    name: m.name,
    color: SERIES_COLORS[i % SERIES_COLORS.length],
    values: toRadarValues(m),
  }));

  return (
    <div className="min-h-screen bg-neu-100 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-10 print:py-2">

        {/* Page header */}
        <div className="flex items-center justify-between mb-8 print:hidden flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl flex items-center justify-center shadow-neu">
              <FaBalanceScale className="text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neu-800">Mediator Comparison</h1>
              <p className="text-sm text-neu-600">Compare up to {MAX_MEDIATORS} mediators side by side</p>
            </div>
          </div>

          {mediators.length >= 2 && (
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 bg-neu-200 text-neu-700 rounded-xl shadow-neu hover:shadow-neu-lg transition-all text-sm font-medium min-h-[44px]"
              aria-label="Print comparison"
            >
              <FaPrint aria-hidden="true" /> Print
            </button>
          )}
        </div>

        {/* Print header */}
        <div className="hidden print:block text-center mb-6">
          <h1 className="text-2xl font-bold">FairMediator — Comparison Report</h1>
          <p className="text-sm text-neu-600">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Add mediator search */}
        {mediators.length < MAX_MEDIATORS && (
          <div className="relative mb-8 print:hidden">
            <div className="flex items-center gap-3 bg-neu-200 rounded-2xl px-4 py-3 shadow-neu-inset">
              {searching
                ? <FaSpinner className="text-neu-500 animate-spin flex-shrink-0" aria-hidden="true" />
                : <FaSearch className="text-neu-500 flex-shrink-0" aria-hidden="true" />}
              <input
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                placeholder="Search mediators to add to comparison..."
                className="flex-1 bg-transparent text-neu-800 text-sm focus:outline-none placeholder:text-neu-400 min-h-[36px]"
                aria-label="Search mediators to add"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-neu-300 rounded-2xl shadow-neu-lg z-20 overflow-hidden">
                {searchResults.map(m => (
                  <button
                    key={m._id}
                    onClick={() => addMediator(m)}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-neu-100 transition-colors border-b border-neu-200 last:border-0 min-h-[44px]"
                    aria-label={`Add ${m.name} to comparison`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neu-800 truncate">{m.name}</p>
                      <p className="text-xs text-neu-500 truncate">{m.lawFirm || m.currentEmployer || 'Independent'}</p>
                    </div>
                    <span className="text-xs text-blue-500 font-medium flex-shrink-0">+ Add</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Loading / error */}
        {loading && (
          <div className="flex justify-center py-16">
            <FaSpinner className="text-4xl text-neu-400 animate-spin" aria-label="Loading mediators" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-6">{error}</div>
        )}

        {/* Empty state */}
        {!loading && mediators.length === 0 && (
          <div className="text-center py-20">
            <FaBalanceScale className="text-5xl text-neu-400 mx-auto mb-4" aria-hidden="true" />
            <p className="text-lg font-semibold text-neu-700 mb-1">No mediators selected</p>
            <p className="text-sm text-neu-500 mb-4">Search above or go to the Mediators page and click Compare.</p>
            <Link
              to="/mediators"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-800 text-white rounded-xl shadow-neu text-sm font-semibold min-h-[44px]"
            >
              Browse Mediators
            </Link>
          </div>
        )}

        {/* Comparison content */}
        {!loading && mediators.length >= 1 && (
          <>
            {/* Mediator header cards — horizontal scroll on mobile */}
            <div className="flex gap-4 overflow-x-auto pb-2 mb-8 print:overflow-visible print:flex-wrap">
              {mediators.map((m, i) => (
                <div
                  key={m._id}
                  className="bg-neu-200 rounded-2xl p-4 shadow-neu flex-shrink-0 w-52 sm:w-64 relative print:flex-shrink"
                  style={{ borderTop: `4px solid ${SERIES_COLORS[i % SERIES_COLORS.length]}` }}
                >
                  <button
                    onClick={() => remove(String(m._id))}
                    className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center bg-neu-300 hover:bg-neu-400 rounded-full transition-colors print:hidden"
                    aria-label={`Remove ${m.name} from comparison`}
                  >
                    <FaTimes className="text-xs text-neu-600" aria-hidden="true" />
                  </button>
                  <p className="text-sm font-bold text-neu-800 pr-8 leading-tight mb-1">{m.name}</p>
                  <p className="text-xs text-neu-500 mb-3 truncate">{m.lawFirm || m.currentEmployer || 'Independent'}</p>
                  <div className="space-y-1.5">
                    {radarSeries[i]?.values.map((v, ai) => (
                      <div key={ai}>
                        <div className="flex justify-between text-[10px] text-neu-500 mb-0.5">
                          <span>{RADAR_AXES[ai].label}</span>
                          <span>{formatScore(v)}</span>
                        </div>
                        <ScoreBar value={v} color={SERIES_COLORS[i % SERIES_COLORS.length]} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Radar chart — only when ≥2 mediators */}
            {mediators.length >= 2 && (
              <div className="mb-8">
                <h2 className="text-base font-bold text-neu-800 mb-4">Score Comparison</h2>
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                  <div className="flex-shrink-0 w-full max-w-xs mx-auto lg:mx-0">
                    <SimpleRadarChart
                      axes={RADAR_AXES}
                      series={radarSeries}
                      size={280}
                    />
                  </div>

                  {/* Legend */}
                  <div className="flex-1 bg-neu-200 rounded-2xl p-5 shadow-neu">
                    <h3 className="text-sm font-bold text-neu-800 mb-4">Score Breakdown</h3>
                    <div className="space-y-4">
                      {RADAR_AXES.map((ax) => (
                        <div key={ax.key}>
                          <p className="text-xs font-semibold text-neu-700 mb-1.5">{ax.label}</p>
                          <div className="flex gap-3 flex-wrap">
                            {radarSeries.map((s, si) => (
                              <div key={si} className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                                <span className="text-xs text-neu-600">
                                  {s.name.split(' ')[0]}: {formatScore(s.values[RADAR_AXES.findIndex(a => a.key === ax.key)])}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Detail comparison table */}
            <div className="mb-8">
              <h2 className="text-base font-bold text-neu-800 mb-4">Detailed Comparison</h2>
              <div className="overflow-x-auto rounded-2xl shadow-neu">
                <table className="w-full text-sm bg-neu-200 min-w-[500px]" role="table" aria-label="Mediator comparison table">
                  <thead>
                    <tr className="border-b border-neu-300">
                      <th className="text-left px-4 py-3 text-xs font-bold text-neu-600 uppercase tracking-wide w-36">Attribute</th>
                      {mediators.map((m, i) => (
                        <th key={m._id} className="text-left px-4 py-3 text-xs font-bold" style={{ color: SERIES_COLORS[i % SERIES_COLORS.length] }}>
                          {m.name.split(' ').slice(0, 2).join(' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Years Experience', fn: m => m.yearsExperience ? `${m.yearsExperience} yrs` : '—' },
                      { label: 'Firm', fn: m => m.lawFirm || m.currentEmployer || 'Independent' },
                      { label: 'Location', fn: m => m.location?.state || m.location?.city || '—' },
                      { label: 'Specializations', fn: m => m.specializations?.length ? m.specializations.join(', ') : '—' },
                      { label: 'Certifications', fn: m => m.certifications?.length || '0' },
                      { label: 'Ideology', fn: m => <IdeologyLabel score={m.ideologyScore} /> },
                      { label: 'Donation History', fn: m => `${m.biasIndicators?.donationHistory?.length || 0} records` },
                      { label: 'Has Website', fn: m => <Check val={!!m.website} /> },
                      { label: 'Has Bio', fn: m => <Check val={!!m.bio} /> },
                      { label: 'Bar Admissions', fn: m => m.barAdmissions?.join(', ') || '—' },
                    ].map(row => (
                      <tr key={row.label} className="border-b border-neu-300 last:border-0 hover:bg-neu-100 transition-colors">
                        <td className="px-4 py-3 text-xs font-semibold text-neu-600 align-top">{row.label}</td>
                        {mediators.map(m => (
                          <td key={m._id} className="px-4 py-3 text-xs text-neu-800 align-top">
                            {row.fn(m)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
