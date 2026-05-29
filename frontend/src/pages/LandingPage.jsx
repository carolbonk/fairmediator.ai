import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO/SEO';

// Monochrome tones: CRM (primary) reads darker, Marketplace (secondary) lighter.
const TONE = {
  primary: '#374151',   // neu-700 — CRM (primary) accent
  secondary: '#6B7280', // neu-500 — Marketplace (secondary) accent
};

const TRUST_SIGNALS = [
  { label: 'Security Score', value: '90/100', sub: 'Platform audit' },
  { label: 'States Covered', value: '50/50', sub: 'All US states' },
  { label: 'Verified Mediators', value: '1,200+', sub: 'Manually reviewed' },
  { label: 'Conflict Checks', value: 'AI-powered', sub: 'Real-time detection' },
];

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const crmDestination =
    user?.accountType === 'mediator' ? '/mediators-crm/cases' : '/login';

  return (
    <div className="min-h-screen bg-gradient-to-br from-neu-100 via-neu-150 to-neu-200 flex flex-col overflow-x-hidden">
      <SEO
        title="FairMediator — Mediator Marketplace & CRM"
        description="The first AI-powered mediator marketplace present in all 50 states. Find vetted, unbiased mediators or manage your mediation practice with our purpose-built CRM."
        keywords={[
          'mediator marketplace',
          'mediator CRM',
          'conflict resolution',
          'dispute resolution',
          'mediation platform',
          'all 50 states',
        ]}
      />
      <Header />

      <main className="flex-grow max-w-6xl mx-auto w-full px-6 sm:px-8 lg:px-10 py-20 sm:py-28">
        {/* Hero headline */}
        <div className="text-center mb-20 sm:mb-24">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-neu-600 to-neu-900 bg-clip-text text-transparent mb-6 leading-[1.1] tracking-tight">
            The best mediator's HUB
            <br />
            with AI that works for you
          </h1>
          <p className="text-lg sm:text-xl text-neu-600 max-w-2xl mx-auto leading-relaxed">
            AI-powered mediator practice management and mediator's marketplace
            with built-in digital marketing. Built for the people who make
            resolution possible.
          </p>
        </div>

        {/* Two-card layout — CRM primary (left, 60%), Marketplace secondary (right, 40%) */}
        <div className="flex flex-col lg:flex-row gap-8 mb-20 sm:mb-24">
          {/* ── Card 1: CRM (primary, 60%) ── */}
          <div className="lg:w-[60%] bg-neu-200 rounded-neu-lg shadow-neu-lg p-10 sm:p-12 flex flex-col border-t-4"
            style={{ borderColor: TONE.primary }}>

            {/* Badge */}
            <span className="self-start text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-neu-sm shadow-neu-inset-sm bg-neu-200 mb-7"
              style={{ color: TONE.primary }}>
              CRM for Mediators
            </span>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-neu-800 mb-5 leading-snug tracking-tight">
              Your case pipeline, client inbox &amp; billing.
            </h2>
            <p className="text-neu-600 mb-10 leading-relaxed">
              Built for mediators, not adapted from a law firm tool. Intake to settlement
              in one workspace — with earnings tracking, invoicing, and built-in digital
              marketing included.
            </p>

            {/* Feature list */}
            <ul className="space-y-4 mb-12">
              {[
                'Case pipeline with status tracking',
                'Client inbox & messaging',
                'Invoicing & earnings calculator',
                'Marketplace gig feed',
              ].map((feat) => (
                <li key={feat} className="flex items-center gap-3 text-sm text-neu-700">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 shadow-neu-inset-sm bg-neu-200 text-xs font-bold"
                    style={{ color: TONE.primary }}>
                    ✓
                  </span>
                  {feat}
                </li>
              ))}
            </ul>

            <div className="mt-auto">
              <button
                onClick={() => navigate(crmDestination)}
                className="w-full px-6 py-4 rounded-neu-sm font-bold text-sm bg-gradient-to-r from-neu-600 to-neu-800 text-white shadow-neu hover:shadow-neu-lg transition-all"
              >
                Enter CRM
              </button>
              {!user && (
                <p className="text-xs text-neu-500 text-center mt-3">
                  Mediator account required
                </p>
              )}
            </div>
          </div>

          {/* ── Card 2: Marketplace (secondary, 40%) ── */}
          <div className="lg:w-[40%] bg-neu-200 rounded-neu-lg shadow-neu p-10 sm:p-12 flex flex-col border-t-4"
            style={{ borderColor: TONE.secondary }}>

            {/* Badge */}
            <span className="self-start text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-neu-sm shadow-neu-inset-sm bg-neu-200 mb-7"
              style={{ color: TONE.secondary }}>
              Mediators Marketplace
            </span>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-neu-800 mb-5 leading-snug tracking-tight">
              The first mediator marketplace present in all 50 states.
            </h2>
            <p className="text-neu-600 mb-10 leading-relaxed">
              Find conflict-screened, ideology-rated mediators for any dispute — family,
              business, civil. Transparent AI matching so parties trust the process from
              day one.
            </p>

            {/* Who are you CTA pair */}
            <div className="flex flex-col gap-4 mb-8">
              <Link
                to="/mediators-marketplace/apply"
                className="text-center px-6 py-4 rounded-neu-sm font-bold text-sm bg-gradient-to-r from-neu-600 to-neu-800 text-white shadow-neu hover:shadow-neu-lg transition-all"
              >
                I'm a Mediator
              </Link>
              <Link
                to="/mediators-marketplace"
                className="text-center px-6 py-4 rounded-neu-sm font-bold text-sm bg-neu-200 text-neu-700 shadow-neu hover:shadow-neu-lg transition-all"
              >
                I'm a Lawyer / Party
              </Link>
            </div>

            {/* Shortcut — Marketplace card only */}
            <div className="mt-auto pt-6 border-t border-neu-300">
              <Link
                to="/mediators-marketplace"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-neu-600 hover:text-neu-900 transition-colors"
              >
                Search mediators directly
                <span className="text-base leading-none">→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Trust signals ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {TRUST_SIGNALS.map(({ label, value, sub }) => (
            <div
              key={label}
              className="bg-neu-200 rounded-neu-lg shadow-neu p-7 text-center"
            >
              <p className="text-2xl font-extrabold bg-gradient-to-r from-neu-600 to-neu-900 bg-clip-text text-transparent">
                {value}
              </p>
              <p className="text-sm font-semibold text-neu-800 mt-2">{label}</p>
              <p className="text-xs text-neu-500 mt-1">{sub}</p>
            </div>
          ))}
        </div>

        {/* Testimonial */}
        <div className="mt-16 sm:mt-20 bg-neu-200 rounded-neu-lg shadow-neu p-8 sm:p-10 border-l-4 border-neu-400">
          <p className="text-neu-700 italic text-base leading-relaxed">
            "FairMediator's conflict detection caught a potential bias issue before we even
            started — that's the kind of transparency that makes clients trust the process."
          </p>
          <p className="text-xs font-semibold text-neu-500 mt-4">
            — Senior Partner, Morrison &amp; Webb LLP
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
