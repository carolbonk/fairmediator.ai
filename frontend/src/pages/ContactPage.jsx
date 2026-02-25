import { useState } from 'react';
import { FaEnvelope, FaCommentDots, FaShieldAlt, FaCheck } from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO/SEO';

const TOPICS = [
  { value: 'question', label: 'I have a question', icon: FaCommentDots },
  { value: 'mediator', label: 'Mediator listing issue', icon: FaShieldAlt },
  { value: 'account', label: 'Account or billing', icon: FaEnvelope },
  { value: 'other', label: 'Something else', icon: FaCommentDots },
];

const EMPTY = { name: '', email: '', topic: '', message: '' };

const ContactPage = () => {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleTopicSelect = (value) => {
    setForm((prev) => ({ ...prev, topic: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ 'form-name': 'contact', ...form }).toString(),
      });
      if (res.ok) {
        setStatus('success');
        setForm(EMPTY);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neu-100 via-neu-150 to-neu-200 flex flex-col">
      <SEO
        title="Contact"
        description="Have a question or need clarification? Reach out to the FairMediator team — we're here to help."
        keywords={['contact FairMediator', 'mediation support', 'fair mediator help']}
      />
      <Header />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-5">
            We value every<br className="hidden sm:block" />
            <span className="text-gray-300"> conversation.</span>
          </h1>
          <p className="text-base sm:text-lg text-white/80 leading-relaxed">
            Transparency extends beyond our platform. If any aspect is unclear, please contact us.
            We do not rely on templated responses for substantive questions—your inquiry will be
            reviewed and addressed by a member of our team in a timely, professional manner.
          </p>
        </div>
      </section>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex-grow max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">

        {status === 'success' ? (
          /* ── Thank-you state ────────────────────────────────────────── */
          <div className="bg-neu-200 rounded-2xl shadow-neu p-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg mb-5">
              <FaCheck className="text-2xl text-white" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold text-neu-800 mb-3">Message received</h2>
            <p className="text-neu-600 max-w-sm mx-auto leading-relaxed">
              We&apos;ll read it carefully and get back to you within <strong>1–5 business days</strong>.
              No automated replies.
            </p>
            <button
              onClick={() => setStatus('idle')}
              className="mt-8 px-6 py-3 bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white text-sm font-semibold rounded-xl shadow-neu transition-all duration-200"
            >
              Send another message
            </button>
          </div>
        ) : (
          <div className="space-y-8">

            {/* Topic selector */}
            <div className="bg-neu-200 rounded-2xl shadow-neu p-6 sm:p-8">
              <h2 className="text-base font-bold text-neu-800 mb-4">What&apos;s this about?</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {TOPICS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleTopicSelect(value)}
                    className={`flex flex-col items-center gap-2 px-3 py-4 rounded-xl border text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                      form.topic === value
                        ? 'bg-gradient-to-br from-slate-100 to-slate-200 border-slate-300 text-slate-800 shadow-neu-inset'
                        : 'bg-neu-100 border-neu-300 text-neu-600 shadow-neu hover:shadow-neu-lg hover:-translate-y-0.5'
                    }`}
                  >
                    <Icon className={`text-lg ${form.topic === value ? 'text-slate-700' : 'text-neu-500'}`} aria-hidden="true" />
                    <span className="text-center leading-tight">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Contact form */}
            <form
              name="contact"
              data-netlify="true"
              onSubmit={handleSubmit}
              className="bg-neu-200 rounded-2xl shadow-neu p-6 sm:p-8 space-y-5"
            >
              {/* Netlify hidden field */}
              <input type="hidden" name="form-name" value="contact" />
              {form.topic && <input type="hidden" name="topic" value={form.topic} />}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-neu-700 mb-1.5">
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    className="w-full px-4 py-3 bg-neu-100 border border-neu-300 rounded-xl text-neu-800 placeholder-neu-500 shadow-neu-inset text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-neu-700 mb-1.5">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 bg-neu-100 border border-neu-300 rounded-xl text-neu-800 placeholder-neu-500 shadow-neu-inset text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-neu-700 mb-1.5">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                  placeholder="What would you like to clarify or discuss?"
                  className="w-full px-4 py-3 bg-neu-100 border border-neu-300 rounded-xl text-neu-800 placeholder-neu-500 shadow-neu-inset text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all resize-none"
                />
              </div>

              {status === 'error' && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                  Something went wrong. Please try again or email us directly.
                </p>
              )}

              <div className="flex items-center justify-between gap-4 pt-1">
                <p className="text-xs text-neu-500">
                  We reply within 1–5 business days.
                </p>
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="px-6 py-3 bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white text-sm font-semibold rounded-xl shadow-neu transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  {status === 'submitting' ? 'Sending…' : 'Send message'}
                </button>
              </div>
            </form>

          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;
