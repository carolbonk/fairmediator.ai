import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaGavel, FaSearch } from 'react-icons/fa';

const STATUS_TABS = [
  { key: 'active', label: 'Active' },
  { key: 'all', label: 'All' },
  { key: 'settled', label: 'Settled' },
  { key: 'on_hold', label: 'On hold' }
];

function StatusPill({ status }) {
  const palette = {
    in_mediation: 'bg-emerald-100 text-emerald-700',
    mediator_selected: 'bg-indigo-100 text-indigo-700',
    on_hold: 'bg-amber-100 text-amber-700',
    settled: 'bg-blue-100 text-blue-700',
    failed: 'bg-rose-100 text-rose-700',
    cancelled: 'bg-gray-200 text-gray-700',
    submitted: 'bg-purple-100 text-purple-700',
    draft: 'bg-gray-100 text-gray-600'
  }[status] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${palette}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

export default function CrmCasesPage() {
  const [tab, setTab] = useState('active');
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('accessToken');
        const qs = tab === 'all' ? '' : `?status=${encodeURIComponent(tab)}`;
        const res = await fetch(`/api/cases${qs}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setCases(data.cases || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [tab]);

  const filtered = useMemo(() => {
    if (!search.trim()) return cases;
    const q = search.toLowerCase();
    return cases.filter(c =>
      c.title?.toLowerCase().includes(q) ||
      c.caseNumber?.toLowerCase().includes(q) ||
      c.parties?.some(p => p.name?.toLowerCase().includes(q))
    );
  }, [cases, search]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neu-100 via-neu-150 to-neu-200 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">My Cases</h1>
            <p className="text-sm text-gray-600">Cases assigned to you as the mediator.</p>
          </div>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, number, party…"
              className="pl-9 pr-3 py-2 rounded-xl bg-neu-200 shadow-neu-inset text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {STATUS_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t.key
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-neu-200 text-gray-700 shadow-neu'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading && <div className="p-8 text-center text-gray-500">Loading cases…</div>}
        {error && <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">{error}</div>}

        {!loading && !error && filtered.length === 0 && (
          <div className="p-8 text-center bg-neu-200 shadow-neu rounded-2xl">
            <FaGavel className="mx-auto text-4xl text-gray-400 mb-3" />
            <p className="text-gray-700 font-semibold">No cases yet</p>
            <p className="text-sm text-gray-500 mt-1">
              When attorneys or parties assign you a case, it appears here.
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid gap-3">
            {filtered.map(c => (
              <Link
                key={c._id}
                to={`/app/mediator/crm/${c._id}`}
                className="block p-5 bg-neu-200 shadow-neu rounded-2xl hover:shadow-neu-lg transition-all"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                      {c.caseNumber}
                    </div>
                    <h3 className="font-bold text-gray-900 truncate">{c.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {c.disputeType?.replace(/_/g, ' ')} ·
                      {' '}{c.parties?.length || 0} parties ·
                      {' '}{c.attorneys?.length || 0} attorneys
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusPill status={c.status} />
                    {c.amountInDispute > 0 && (
                      <span className="text-xs text-gray-500">
                        ${c.amountInDispute.toLocaleString()} in dispute
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
