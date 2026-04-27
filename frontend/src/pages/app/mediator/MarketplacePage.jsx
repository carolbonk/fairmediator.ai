import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStore, FaMagic, FaCheck } from 'react-icons/fa';

const MODES = [
  { key: 'open_feed', label: 'Open feed', icon: FaStore, hint: 'All open gigs available to any mediator.' },
  { key: 'auto_match', label: 'Auto-match', icon: FaMagic, hint: 'Gigs where you were recommended.' }
];

function authHeaders() {
  const token = localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function GigCard({ gig, onAccept, accepting }) {
  return (
    <div className="bg-neu-200 shadow-neu rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-gray-900">{gig.title}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {gig.disputeType?.replace(/_/g, ' ')} ·
            {' '}{gig.parties?.length || 0} parties
            {gig.amountInDispute ? ` · $${gig.amountInDispute.toLocaleString()} in dispute` : ''}
          </p>
          {gig.summary && (
            <p className="text-sm text-gray-700 mt-3 line-clamp-3">{gig.summary}</p>
          )}
          {gig.budget?.min || gig.budget?.max ? (
            <p className="text-xs text-gray-500 mt-2">
              Budget: ${gig.budget.min || 0}–${gig.budget.max || '?'} {gig.budget.currency || 'USD'}
            </p>
          ) : null}
        </div>
        <button
          onClick={() => onAccept(gig._id)}
          disabled={accepting}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold disabled:opacity-50 inline-flex items-center gap-2"
        >
          <FaCheck /> {accepting ? 'Accepting…' : 'Accept'}
        </button>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const [mode, setMode] = useState('open_feed');
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accepting, setAccepting] = useState(null);
  const navigate = useNavigate();

  async function load(activeMode = mode) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/gigs?mode=${activeMode}`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setGigs(data.gigs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(mode); }, [mode]);

  async function accept(gigId) {
    setAccepting(gigId);
    setError(null);
    try {
      const res = await fetch(`/api/gigs/${gigId}/accept`, {
        method: 'POST',
        headers: authHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      navigate(`/app/mediator/crm/${data.case._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setAccepting(null);
    }
  }

  const activeMode = MODES.find(m => m.key === mode);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neu-100 via-neu-150 to-neu-200 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900">Marketplace</h1>
          <p className="text-sm text-gray-600">{activeMode.hint}</p>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {MODES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 transition-all ${
                mode === key
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-neu-200 text-gray-700 shadow-neu'
              }`}
            >
              <Icon /> {label}
            </button>
          ))}
        </div>

        {error && <div className="p-4 mb-4 bg-rose-50 text-rose-700 rounded-xl">{error}</div>}
        {loading && <div className="p-8 text-center text-gray-500">Loading gigs…</div>}

        {!loading && gigs.length === 0 && (
          <div className="bg-neu-200 shadow-neu rounded-2xl p-8 text-center">
            <p className="text-gray-700 font-semibold">
              {mode === 'auto_match' ? 'No matches yet' : 'No open gigs right now'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {mode === 'auto_match'
                ? 'When a case-poster\'s auto-matching recommends you, gigs will appear here.'
                : 'Check back soon — new posts arrive throughout the day.'}
            </p>
          </div>
        )}

        <div className="grid gap-3">
          {gigs.map(g => (
            <GigCard
              key={g._id}
              gig={g}
              accepting={accepting === g._id}
              onAccept={accept}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
