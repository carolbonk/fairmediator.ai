import { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaFilePdf, FaTimes, FaTrash } from 'react-icons/fa';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import BackLink from '../../../components/common/BackLink';
import SEO from '../../../components/SEO/SEO';

const STATUS_TABS = ['all', 'draft', 'sent', 'paid', 'void'];

const STATUS_STYLE = {
  draft:  { bg: 'bg-neu-200', text: 'text-neu-600' },
  sent:   { bg: 'bg-neu-200', text: 'text-neu-700' },
  paid:   { bg: 'bg-green-100', text: 'text-green-700' },
  void:   { bg: 'bg-red-100', text: 'text-red-500' },
};

function fmtMoney(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function StatusPill({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.draft;
  return (
    <span className={`inline-block text-xs font-bold uppercase px-2.5 py-1 rounded-neu-sm ${s.bg} ${s.text}`}>
      {status}
    </span>
  );
}

/* ── Empty line item for the create form ── */
const BLANK_LINE = () => ({ description: '', quantity: 1, rate: '' });

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* create form */
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    caseId: '',
    billToName: '',
    billToEmail: '',
    billToAddress: '',
    taxRate: '',
    dueAt: '',
    notes: '',
    lineItems: [BLANK_LINE()],
  });

  const token = localStorage.getItem('accessToken');

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = activeTab !== 'all' ? `?status=${activeTab}` : '';
      const res = await fetch(`/api/invoices${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setInvoices(data.invoices || []);
    } catch (err) {
      setError(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [activeTab, token]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  /* ── Create form helpers ── */
  const setLineItem = (idx, field, value) => {
    setForm(prev => {
      const items = prev.lineItems.map((li, i) =>
        i === idx ? { ...li, [field]: value } : li
      );
      return { ...prev, lineItems: items };
    });
  };

  const addLineItem = () =>
    setForm(prev => ({ ...prev, lineItems: [...prev.lineItems, BLANK_LINE()] }));

  const removeLineItem = (idx) =>
    setForm(prev => ({ ...prev, lineItems: prev.lineItems.filter((_, i) => i !== idx) }));

  const lineTotal = (li) => {
    const qty = parseFloat(li.quantity) || 0;
    const rate = parseFloat(li.rate) || 0;
    return qty * rate;
  };

  const subtotal = form.lineItems.reduce((s, li) => s + lineTotal(li), 0);
  const taxRateNum = parseFloat(form.taxRate) || 0;
  const tax = subtotal * (taxRateNum / 100);
  const total = subtotal + tax;

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.caseId.trim()) { setFormError('Case ID is required'); return; }
    if (!form.billToName.trim()) { setFormError('Bill-to name is required'); return; }
    if (form.lineItems.some(li => !li.description.trim() || !li.rate)) {
      setFormError('All line items need a description and rate'); return;
    }

    setSubmitting(true);
    try {
      const body = {
        caseId: form.caseId.trim(),
        billTo: {
          name: form.billToName.trim(),
          ...(form.billToEmail && { email: form.billToEmail.trim() }),
          ...(form.billToAddress && { address: form.billToAddress.trim() }),
        },
        lineItems: form.lineItems.map(li => ({
          description: li.description.trim(),
          quantity: parseFloat(li.quantity) || 1,
          rate: parseFloat(li.rate) || 0,
          amount: lineTotal(li),
        })),
        ...(taxRateNum > 0 && { taxRate: taxRateNum / 100 }),
        ...(form.dueAt && { dueAt: form.dueAt }),
        ...(form.notes.trim() && { notes: form.notes.trim() }),
      };

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      setShowForm(false);
      setForm({
        caseId: '', billToName: '', billToEmail: '', billToAddress: '',
        taxRate: '', dueAt: '', notes: '', lineItems: [BLANK_LINE()],
      });
      fetchInvoices();
    } catch (err) {
      setFormError(err.message || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neu-100 to-neu-200 flex flex-col overflow-x-hidden">
      <SEO
        title="Invoices"
        description="Manage your mediation invoices — draft, send, and track payments."
      />
      <Header />
      <BackLink to="/mediators-crm/cases" />

      <main className="flex-grow max-w-5xl mx-auto w-full px-6 sm:px-8 lg:px-10 py-12 sm:py-16">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-12">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-neu-600 to-neu-900 bg-clip-text text-transparent mb-2 tracking-tight">
              Invoices
            </h1>
            <p className="text-neu-600">Track billable work and payments per case.</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setFormError(''); }}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-6 py-3 rounded-neu-sm font-bold text-sm text-white shadow-neu-sm hover:shadow-neu transition-all"
            style={{ background: 'linear-gradient(135deg, #4B5563, #1F2937)' }}
          >
            <FaPlus className="text-xs" />
            New Invoice
          </button>
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 flex-wrap mb-8">
          {STATUS_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-neu-sm font-semibold text-sm capitalize transition-all ${
                activeTab === tab
                  ? 'text-white shadow-neu-sm'
                  : 'bg-neu-100 text-neu-600 shadow-neu-sm hover:shadow-neu'
              }`}
              style={activeTab === tab
                ? { background: 'linear-gradient(135deg, #4B5563, #1F2937)' }
                : undefined}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Invoice list */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-neu-sm p-4 text-red-700 text-sm mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-10 h-10 border-4 border-neu-700 border-t-transparent rounded-full" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="bg-neu-100 rounded-neu-lg shadow-neu p-12 text-center">
            <p className="text-neu-500 font-semibold mb-2">No invoices yet</p>
            <p className="text-sm text-neu-400">
              Click <strong>New Invoice</strong> to create your first one.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map(inv => (
              <div
                key={inv._id}
                className="bg-neu-100 rounded-neu-lg shadow-neu p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:shadow-neu-lg transition-all"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-xs text-neu-500">{inv.invoiceNumber}</span>
                    <StatusPill status={inv.status} />
                  </div>
                  <p className="font-bold text-neu-800 truncate">{inv.billTo?.name}</p>
                  <p className="text-xs text-neu-500 mt-0.5">
                    Issued {fmtDate(inv.issuedAt)}
                    {inv.dueAt && <> · Due {fmtDate(inv.dueAt)}</>}
                  </p>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="text-xl font-extrabold text-neu-800">
                    {fmtMoney(inv.total)}
                  </span>
                  <a
                    href={`/api/invoices/${inv._id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-neu-sm bg-neu-100 shadow-neu-sm hover:shadow-neu transition-all text-neu-600 hover:text-neu-900"
                    title="Download PDF"
                  >
                    <FaFilePdf className="text-base" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Create Invoice Modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-neu-100 rounded-neu-lg shadow-neu-xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-8 border-b border-neu-200">
              <h2 className="text-xl font-bold text-neu-800">New Invoice</h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 rounded-neu-sm bg-neu-100 shadow-neu-sm hover:shadow-neu transition-all text-neu-500"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-8 space-y-6">
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-neu-sm p-3 text-red-700 text-sm">
                  {formError}
                </div>
              )}

              {/* Case ID */}
              <div>
                <label className="block text-sm font-semibold text-neu-700 mb-1.5">
                  Case ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.caseId}
                  onChange={e => setForm(p => ({ ...p, caseId: e.target.value }))}
                  placeholder="MongoDB ObjectId of the case"
                  className="w-full bg-neu-200 rounded-neu-sm px-4 py-2.5 text-sm shadow-neu-inset-sm outline-none focus:ring-2 focus:ring-neu-400 font-mono text-neu-800"
                  required
                />
              </div>

              {/* Bill To */}
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-neu-700 mb-1">Bill To</legend>
                <input
                  type="text"
                  value={form.billToName}
                  onChange={e => setForm(p => ({ ...p, billToName: e.target.value }))}
                  placeholder="Name *"
                  className="w-full bg-neu-200 rounded-neu-sm px-4 py-2.5 text-sm shadow-neu-inset-sm outline-none focus:ring-2 focus:ring-neu-400 text-neu-800"
                  required
                />
                <input
                  type="email"
                  value={form.billToEmail}
                  onChange={e => setForm(p => ({ ...p, billToEmail: e.target.value }))}
                  placeholder="Email (optional)"
                  className="w-full bg-neu-200 rounded-neu-sm px-4 py-2.5 text-sm shadow-neu-inset-sm outline-none focus:ring-2 focus:ring-neu-400 text-neu-800"
                />
                <input
                  type="text"
                  value={form.billToAddress}
                  onChange={e => setForm(p => ({ ...p, billToAddress: e.target.value }))}
                  placeholder="Address (optional)"
                  className="w-full bg-neu-200 rounded-neu-sm px-4 py-2.5 text-sm shadow-neu-inset-sm outline-none focus:ring-2 focus:ring-neu-400 text-neu-800"
                />
              </fieldset>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-neu-700">Line Items</span>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="text-xs font-bold text-neu-700 hover:underline flex items-center gap-1"
                  >
                    <FaPlus className="text-[10px]" /> Add row
                  </button>
                </div>
                <div className="space-y-2">
                  {form.lineItems.map((li, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_64px_80px_32px] gap-2 items-center">
                      <input
                        type="text"
                        value={li.description}
                        onChange={e => setLineItem(idx, 'description', e.target.value)}
                        placeholder="Description"
                        className="bg-neu-200 rounded-neu-sm px-3 py-2 text-sm shadow-neu-inset-sm outline-none focus:ring-2 focus:ring-neu-400 text-neu-800"
                        required
                      />
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={li.quantity}
                        onChange={e => setLineItem(idx, 'quantity', e.target.value)}
                        className="bg-neu-200 rounded-neu-sm px-2 py-2 text-sm shadow-neu-inset-sm outline-none focus:ring-2 focus:ring-neu-400 text-neu-800 text-center"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={li.rate}
                        onChange={e => setLineItem(idx, 'rate', e.target.value)}
                        placeholder="Rate $"
                        className="bg-neu-200 rounded-neu-sm px-2 py-2 text-sm shadow-neu-inset-sm outline-none focus:ring-2 focus:ring-neu-400 text-neu-800 text-right"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeLineItem(idx)}
                        disabled={form.lineItems.length === 1}
                        className="text-neu-400 hover:text-red-500 disabled:opacity-30 transition-colors flex items-center justify-center"
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Totals preview */}
                <div className="mt-3 text-right text-xs text-neu-500 space-y-0.5">
                  <p>Subtotal: <strong className="text-neu-700">{fmtMoney(subtotal)}</strong></p>
                  {taxRateNum > 0 && <p>Tax ({taxRateNum}%): <strong className="text-neu-700">{fmtMoney(tax)}</strong></p>}
                  <p className="text-sm font-bold text-neu-800">Total: {fmtMoney(total)}</p>
                </div>
              </div>

              {/* Tax + Due date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neu-700 mb-1.5">Tax Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={form.taxRate}
                    onChange={e => setForm(p => ({ ...p, taxRate: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-neu-200 rounded-neu-sm px-4 py-2.5 text-sm shadow-neu-inset-sm outline-none focus:ring-2 focus:ring-neu-400 text-neu-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neu-700 mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={form.dueAt}
                    onChange={e => setForm(p => ({ ...p, dueAt: e.target.value }))}
                    className="w-full bg-neu-200 rounded-neu-sm px-4 py-2.5 text-sm shadow-neu-inset-sm outline-none focus:ring-2 focus:ring-neu-400 text-neu-800"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-neu-700 mb-1.5">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Payment terms, references, or any notes for the client…"
                  rows={3}
                  maxLength={2000}
                  className="w-full bg-neu-200 rounded-neu-sm px-4 py-2.5 text-sm shadow-neu-inset-sm outline-none focus:ring-2 focus:ring-neu-400 text-neu-800 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-neu-sm font-semibold text-sm bg-neu-100 text-neu-600 shadow-neu-sm hover:shadow-neu transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-neu-sm font-bold text-sm text-white shadow-neu-sm hover:shadow-neu transition-all disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #4B5563, #1F2937)' }}
                >
                  {submitting ? 'Creating…' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
