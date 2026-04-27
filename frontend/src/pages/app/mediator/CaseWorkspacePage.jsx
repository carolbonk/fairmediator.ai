import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaUsers, FaUserTie, FaStickyNote, FaFile, FaCommentDots, FaCalendar, FaFileInvoiceDollar, FaShieldAlt } from 'react-icons/fa';

const TABS = [
  { key: 'overview', label: 'Overview', icon: FaUsers },
  { key: 'attorneys', label: 'Attorneys', icon: FaUserTie },
  { key: 'schedule', label: 'Schedule', icon: FaCalendar },
  { key: 'notes', label: 'Notes', icon: FaStickyNote },
  { key: 'documents', label: 'Documents', icon: FaFile },
  { key: 'messages', label: 'Messages', icon: FaCommentDots },
  { key: 'billing', label: 'Billing', icon: FaFileInvoiceDollar }
];

function authHeaders() {
  const token = localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Section({ title, children }) {
  return (
    <div className="bg-neu-200 shadow-neu rounded-2xl p-5 mb-4">
      <h3 className="font-bold text-gray-900 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function PartiesAndAttorneys({ c }) {
  return (
    <>
      <Section title="Parties">
        {c.parties?.length ? (
          <ul className="space-y-2">
            {c.parties.map((p, i) => (
              <li key={i} className="flex justify-between text-sm">
                <span className="font-semibold">{p.name || '(unnamed)'}</span>
                <span className="text-gray-500">{p.role}{p.email ? ` · ${p.email}` : ''}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-gray-500">No parties yet.</p>}
      </Section>
      <Section title="Case summary">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-500">Type:</span> {c.disputeType?.replace(/_/g, ' ')}</div>
          <div><span className="text-gray-500">Status:</span> {c.status?.replace(/_/g, ' ')}</div>
          <div><span className="text-gray-500">Filed:</span> {fmtDate(c.dates?.filed || c.createdAt)}</div>
          <div><span className="text-gray-500">Amount:</span> {c.amountInDispute ? `$${c.amountInDispute.toLocaleString()}` : '—'}</div>
        </div>
        {c.description && <p className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">{c.description}</p>}
      </Section>
    </>
  );
}

function AttorneysTab({ c }) {
  return (
    <Section title="Attorneys of record">
      {c.attorneys?.length ? (
        <ul className="space-y-2">
          {c.attorneys.map((a, i) => (
            <li key={i} className="flex justify-between text-sm">
              <span className="font-semibold">{a.name || '(unnamed)'}</span>
              <span className="text-gray-500">{a.firm || ''} · representing {a.representing}</span>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-gray-500">No attorneys on this case.</p>}
    </Section>
  );
}

function ScheduleTab({ c }) {
  const rows = [
    ['Filed', c.dates?.filed],
    ['Mediation scheduled', c.dates?.mediationScheduled],
    ['Mediation completed', c.dates?.mediationCompleted],
    ['Settlement reached', c.dates?.settlementReached],
    ['Closed', c.dates?.closedAt]
  ];
  return (
    <Section title="Key dates">
      <ul className="space-y-2 text-sm">
        {rows.map(([label, d]) => (
          <li key={label} className="flex justify-between border-b last:border-0 border-gray-200 pb-2">
            <span className="text-gray-700">{label}</span>
            <span className="font-mono text-gray-500">{fmtDate(d)}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function NotesTab({ c }) {
  return (
    <Section title="Case notes">
      {c.notes?.length ? (
        <ul className="space-y-3">
          {c.notes.map((n, i) => (
            <li key={i} className="text-sm border-l-4 border-purple-300 pl-3">
              <p className="text-gray-700 whitespace-pre-wrap">{n.content}</p>
              <span className="text-xs text-gray-400">{fmtDate(n.createdAt)} · {n.visibility}</span>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-gray-500">No notes on this case yet.</p>}
    </Section>
  );
}

function DocumentsTab({ c }) {
  return (
    <Section title="Documents">
      {c.documents?.length ? (
        <ul className="space-y-2 text-sm">
          {c.documents.map((d, i) => (
            <li key={i} className="flex justify-between">
              <a href={d.url} target="_blank" rel="noreferrer" className="text-purple-700 underline">{d.name}</a>
              <span className="text-gray-500">{d.type} · {fmtDate(d.uploadedAt)}</span>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-gray-500">No documents uploaded.</p>}
    </Section>
  );
}

function MessagesTab({ caseId }) {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(`/api/conversations?caseId=${caseId}`, { headers: authHeaders() });
      const data = await res.json();
      setConversations(data.conversations || []);
      if (data.conversations?.[0]) setActiveId(data.conversations[0]._id);
      setLoading(false);
    }
    load();
  }, [caseId]);

  useEffect(() => {
    if (!activeId) return;
    fetch(`/api/conversations/${activeId}/messages`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setMessages(d.messages || []));
  }, [activeId]);

  async function send(e) {
    e.preventDefault();
    if (!draft.trim() || !activeId) return;
    const res = await fetch(`/api/conversations/${activeId}/messages`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ body: draft })
    });
    if (res.ok) {
      const d = await res.json();
      setMessages(prev => [...prev, d.message]);
      setDraft('');
    }
  }

  if (loading) return <div className="p-4 text-gray-500">Loading conversations…</div>;
  if (!conversations.length) {
    return (
      <Section title="Messages">
        <p className="text-sm text-gray-500">No conversations yet on this case.</p>
      </Section>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="md:col-span-1 bg-neu-200 shadow-neu rounded-2xl p-4">
        <h3 className="font-bold text-gray-900 mb-3">Threads</h3>
        <ul className="space-y-1">
          {conversations.map(c => (
            <li key={c._id}>
              <button
                onClick={() => setActiveId(c._id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  activeId === c._id ? 'bg-purple-100 text-purple-800' : 'hover:bg-gray-100'
                }`}
              >
                <div className="font-semibold">{c.title || `Thread ${c._id.slice(-4)}`}</div>
                <div className="text-xs text-gray-500 truncate">{c.lastMessagePreview || '—'}</div>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="md:col-span-2 bg-neu-200 shadow-neu rounded-2xl p-4 flex flex-col" style={{ minHeight: 400 }}>
        <div className="flex-1 overflow-y-auto space-y-2 mb-3">
          {messages.map(m => (
            <div key={m._id} className="text-sm bg-white rounded-lg p-3 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">{fmtDate(m.createdAt)}</div>
              <div className="whitespace-pre-wrap">{m.body}</div>
            </div>
          ))}
          {messages.length === 0 && <div className="text-gray-400 text-sm">No messages yet.</div>}
        </div>
        <form onSubmit={send} className="flex gap-2">
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 px-3 py-2 rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

function ConflictCheckButton({ caseId }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function run() {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/conflict-check`, {
        method: 'POST',
        headers: authHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  const verdictColor = {
    red: 'bg-rose-100 text-rose-800 border-rose-300',
    yellow: 'bg-amber-100 text-amber-800 border-amber-300',
    green: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  }[result?.verdict] || '';

  return (
    <div className="bg-neu-200 shadow-neu rounded-2xl p-5 mb-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <FaShieldAlt /> Conflict check
          </h3>
          <p className="text-sm text-gray-600">
            Runs affiliation + graph analysis across all parties on this case.
          </p>
        </div>
        <button
          onClick={run}
          disabled={running}
          className="px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold disabled:opacity-50"
        >
          {running ? 'Checking…' : 'Run conflict check'}
        </button>
      </div>
      {error && <div className="mt-3 text-sm text-rose-700">{error}</div>}
      {result && (
        <div className={`mt-4 p-4 rounded-xl border ${verdictColor}`}>
          <div className="font-bold uppercase">Verdict: {result.verdict}</div>
          <div className="text-sm mt-1">
            Graph: {result.graph.riskLevel} · {result.graph.pathCount} potential paths · max risk {result.graph.maxRiskScore}
          </div>
          {result.affiliation?.flag && (
            <div className="text-sm">Affiliation flag: {result.affiliation.flag}</div>
          )}
          <div className="text-xs text-gray-600 mt-1">Checked {new Date(result.checkedAt).toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}

function BillingTab({ c, caseId }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [billToName, setBillToName] = useState('');
  const [billToEmail, setBillToEmail] = useState('');
  const [items, setItems] = useState([{ description: '', quantity: 1, rate: 0 }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/invoices?caseId=${caseId}`, { headers: authHeaders() });
    const data = await res.json();
    setInvoices(data.invoices || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [caseId]);

  useEffect(() => {
    const firstParty = c?.parties?.[0];
    if (firstParty && !billToName) {
      setBillToName(firstParty.name || '');
      setBillToEmail(firstParty.email || '');
    }
  }, [c]);

  function updateItem(i, field, value) {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: value } : it));
  }
  function addItem() { setItems(prev => [...prev, { description: '', quantity: 1, rate: 0 }]); }
  function removeItem(i) { setItems(prev => prev.filter((_, idx) => idx !== i)); }

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const lineItems = items
        .filter(it => it.description.trim())
        .map(it => ({
          description: it.description.trim(),
          quantity: Number(it.quantity) || 1,
          rate: Number(it.rate) || 0,
          amount: (Number(it.quantity) || 1) * (Number(it.rate) || 0)
        }));
      if (!lineItems.length) throw new Error('Add at least one line item with a description.');

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          caseId,
          billTo: { name: billToName, email: billToEmail },
          lineItems
        })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `HTTP ${res.status}`);
      }
      setShowForm(false);
      setItems([{ description: '', quantity: 1, rate: 0 }]);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const total = items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.rate) || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">Invoices</h3>
        <button
          onClick={() => setShowForm(s => !s)}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm"
        >
          {showForm ? 'Cancel' : 'New invoice'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-neu-200 shadow-neu rounded-2xl p-5 mb-4 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <input
              required
              value={billToName}
              onChange={e => setBillToName(e.target.value)}
              placeholder="Bill to (name)"
              className="px-3 py-2 rounded-lg bg-white border border-gray-200"
            />
            <input
              type="email"
              value={billToEmail}
              onChange={e => setBillToEmail(e.target.value)}
              placeholder="Bill to (email, optional)"
              className="px-3 py-2 rounded-lg bg-white border border-gray-200"
            />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-600 mb-1 grid grid-cols-12 gap-2 px-2">
              <div className="col-span-6">Description</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-3 text-right">Rate</div>
              <div className="col-span-1"></div>
            </div>
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 mb-2">
                <input
                  value={it.description}
                  onChange={e => updateItem(i, 'description', e.target.value)}
                  placeholder="e.g. Mediation session 4/15"
                  className="col-span-6 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm"
                />
                <input
                  type="number" min="0" step="0.5"
                  value={it.quantity}
                  onChange={e => updateItem(i, 'quantity', e.target.value)}
                  className="col-span-2 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-right"
                />
                <input
                  type="number" min="0" step="0.01"
                  value={it.rate}
                  onChange={e => updateItem(i, 'rate', e.target.value)}
                  className="col-span-3 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-right"
                />
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  disabled={items.length === 1}
                  className="col-span-1 text-rose-600 disabled:opacity-30"
                >×</button>
              </div>
            ))}
            <button type="button" onClick={addItem} className="text-sm text-purple-700 font-semibold">
              + Add line
            </button>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="font-bold">Total: ${total.toFixed(2)}</span>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-semibold disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Create invoice'}
            </button>
          </div>
          {error && <div className="text-rose-700 text-sm">{error}</div>}
        </form>
      )}

      {loading ? (
        <div className="text-gray-500 p-4">Loading invoices…</div>
      ) : invoices.length === 0 ? (
        <Section title=""><p className="text-sm text-gray-500">No invoices yet for this case.</p></Section>
      ) : (
        <div className="grid gap-3">
          {invoices.map(inv => (
            <div key={inv._id} className="bg-neu-200 shadow-neu rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-xs font-mono text-gray-500">{inv.invoiceNumber}</div>
                <div className="font-bold">{inv.billTo.name}</div>
                <div className="text-sm text-gray-600">
                  ${inv.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} · {inv.status}
                </div>
              </div>
              <a
                href={`/api/invoices/${inv._id}/pdf`}
                target="_blank" rel="noreferrer"
                className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold"
              >
                View PDF
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CaseWorkspacePage() {
  const { caseId } = useParams();
  const [c, setCase] = useState(null);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/cases/${caseId}`, { headers: authHeaders() });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setCase(data.case);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [caseId]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading case…</div>;
  if (error) return <div className="p-4 m-8 bg-rose-50 text-rose-700 rounded-xl">{error}</div>;
  if (!c) return <div className="p-8 text-gray-500">Case not found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neu-100 via-neu-150 to-neu-200 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <Link to="/app/mediator/crm" className="inline-flex items-center gap-2 text-sm text-purple-700 mb-4">
          <FaArrowLeft /> Back to cases
        </Link>
        <div className="mb-6">
          <p className="text-xs font-mono text-gray-500">{c.caseNumber}</p>
          <h1 className="text-3xl font-extrabold text-gray-900">{c.title}</h1>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 transition-all ${
                tab === key
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-neu-200 text-gray-700 shadow-neu'
              }`}
            >
              <Icon /> {label}
            </button>
          ))}
        </div>

        {tab === 'overview' && <>
          <ConflictCheckButton caseId={caseId} />
          <PartiesAndAttorneys c={c} />
        </>}
        {tab === 'attorneys' && <AttorneysTab c={c} />}
        {tab === 'schedule' && <ScheduleTab c={c} />}
        {tab === 'notes' && <NotesTab c={c} />}
        {tab === 'documents' && <DocumentsTab c={c} />}
        {tab === 'messages' && <MessagesTab caseId={caseId} />}
        {tab === 'billing' && <BillingTab c={c} caseId={caseId} />}
      </div>
    </div>
  );
}
