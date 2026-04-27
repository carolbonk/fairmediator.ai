import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaInbox } from 'react-icons/fa';

const POLL_INTERVAL_MS = 15000;

function fmtRelative(d) {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(d).toLocaleDateString();
}

export default function InboxPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [polledAt, setPolledAt] = useState(null);
  const timer = useRef(null);

  async function poll() {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/inbox', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setConversations(data.conversations || []);
      setPolledAt(data.polledAt);
    } catch (err) {
      console.error('Inbox poll failed:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    poll();
    timer.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(timer.current);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neu-100 via-neu-150 to-neu-200 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
              <FaInbox /> Inbox
            </h1>
            <p className="text-sm text-gray-600">
              {polledAt && `Last refreshed ${fmtRelative(polledAt)} · auto-refresh every 15s`}
            </p>
          </div>
          <button
            onClick={poll}
            className="px-4 py-2 bg-neu-200 shadow-neu rounded-lg text-sm font-semibold text-gray-700"
          >
            Refresh
          </button>
        </div>

        {loading && <div className="p-8 text-gray-500 text-center">Loading…</div>}

        {!loading && conversations.length === 0 && (
          <div className="bg-neu-200 shadow-neu rounded-2xl p-8 text-center">
            <p className="text-gray-700 font-semibold">No messages yet</p>
            <p className="text-sm text-gray-500 mt-1">New conversations across your cases will appear here.</p>
          </div>
        )}

        <div className="grid gap-3">
          {conversations.map(c => (
            <Link
              key={c._id}
              to={`/app/mediator/crm/${c.caseId?._id || c.caseId}`}
              className="block p-5 bg-neu-200 shadow-neu rounded-2xl hover:shadow-neu-lg transition-all"
            >
              <div className="flex justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-mono text-gray-500">
                    {c.caseId?.caseNumber || ''} {c.caseId?.title ? `· ${c.caseId.title}` : ''}
                  </p>
                  <h3 className="font-bold text-gray-900 truncate">{c.title || 'Conversation'}</h3>
                  <p className="text-sm text-gray-600 mt-1 truncate">
                    {c.lastMessagePreview || '(no messages yet)'}
                  </p>
                </div>
                <div className="text-xs text-gray-500 whitespace-nowrap">{fmtRelative(c.lastMessageAt)}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
