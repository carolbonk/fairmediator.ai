import { Link } from 'react-router-dom';
import {
  FaRobot,
  FaInbox,
  FaFileSignature,
  FaCalendarCheck,
  FaFileInvoiceDollar,
  FaBrain,
  FaLock,
  FaArrowRight,
} from 'react-icons/fa';

const BRAND = {
  blue: '#2563EB',
  blueDark: '#1E3A8A',
  blueDeep: '#1D4ED8',
  golden: '#F5D15C',
  graphite: '#252D3A',
};

const FEATURES = [
  {
    icon: FaInbox,
    title: 'Unified Case Inbox',
    body: 'Every party message, attorney response, document upload, and system notification for a case lives in one threaded view. No more chasing emails across clients.',
  },
  {
    icon: FaBrain,
    title: 'AI Case Summaries',
    body: 'The AI digests intake forms, exhibits, and prior correspondence into a one-page brief before each session — so prep takes minutes, not hours.',
  },
  {
    icon: FaCalendarCheck,
    title: 'Scheduling & Conflict Detection',
    body: 'Sessions are booked with real availability, time-zone aware, and automatically checked against the FairMediator conflict registry before they hit your calendar.',
  },
  {
    icon: FaFileSignature,
    title: 'Settlement Draft Assistant',
    body: 'Generate first-pass settlement language from your notes. The AI proposes terms, but you stay the author — every clause is editable and tracked.',
  },
  {
    icon: FaFileInvoiceDollar,
    title: 'Invoicing & Payouts',
    body: 'Hourly logs, retainer tracking, and direct deposit payouts are built in. Send a billable hour from a session note in two clicks.',
  },
  {
    icon: FaLock,
    title: 'Confidentiality by Default',
    body: 'Caucus notes are isolated per party. Privileged communications never cross sides. Audit logs let you prove chain-of-custody if a dispute arises.',
  },
];

export default function HowItWorksMediatorCrmPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neu-100 to-neu-200 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <Link to="/mediator/dashboard" className="text-sm text-blue-700 hover:text-blue-900 font-semibold">
            ← Back to dashboard
          </Link>
          <div className="flex items-center gap-3 mt-4 mb-3">
            <div
              className="w-12 h-12 rounded-neu-sm flex items-center justify-center shadow-neu-sm"
              style={{ background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.blueDeep})` }}
            >
              <FaRobot className="text-white text-xl" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-700 to-dark-neu-300 bg-clip-text text-transparent">
              How the Mediator's AI-Powered CRM Works
            </h1>
          </div>
          <p className="text-lg text-neu-600">
            A purpose-built workspace that handles intake, scheduling, communication, drafting, and billing — with AI doing the busy work so you can focus on the people.
          </p>
        </div>

        <div
          className="rounded-neu-lg p-6 mb-10 shadow-neu border-l-4"
          style={{ borderColor: BRAND.golden, background: 'white' }}
        >
          <p className="text-neu-700">
            <strong>The short version:</strong> the CRM ingests every artifact tied to a case (forms, exhibits, emails, calendar events), structures it into a case workspace, and then exposes AI assistants for summarization, drafting, and follow-up — all without ever surfacing privileged data across parties.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-neu-100 rounded-neu-lg p-6 shadow-neu">
              <div
                className="w-12 h-12 rounded-neu-sm flex items-center justify-center shadow-neu-sm mb-4"
                style={{ background: `linear-gradient(135deg, ${BRAND.graphite}, ${BRAND.blueDark})` }}
              >
                <Icon className="text-white text-xl" />
              </div>
              <h3 className="font-bold text-neu-800 mb-2">{title}</h3>
              <p className="text-sm text-neu-700 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <div className="bg-neu-100 rounded-neu-lg p-8 mb-8 shadow-neu">
          <h2 className="text-2xl font-bold text-neu-800 mb-4">A typical case in the CRM</h2>
          <ol className="space-y-4 text-neu-700">
            <li><strong>1. Booking lands</strong> — A conflict-checked match arrives in your inbox with the parties, claims, and jurisdiction.</li>
            <li><strong>2. AI brief</strong> — The CRM auto-generates a 1-page summary of the dispute and key exhibits.</li>
            <li><strong>3. Session scheduled</strong> — Availability is reconciled across parties; you confirm with a single click.</li>
            <li><strong>4. Caucus notes</strong> — Notes are tagged per side; the AI keeps confidential material walled off.</li>
            <li><strong>5. Draft settlement</strong> — You ask the assistant for a draft based on the day's notes; you edit and send.</li>
            <li><strong>6. Invoice & close</strong> — Time entries roll into an invoice; payout hits your account; case archives.</li>
          </ol>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/mediator/how-it-works"
            className="px-5 py-3 rounded-neu-sm font-bold text-sm text-white shadow-neu-sm hover:shadow-neu transition-all inline-flex items-center gap-2"
            style={{ background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.blueDeep})` }}
          >
            Back to How It Works <FaArrowRight />
          </Link>
          <Link
            to="/mediator/how-it-works/marketplace"
            className="px-5 py-3 rounded-neu-sm bg-neu-100 text-blue-700 font-bold text-sm shadow-neu-sm hover:shadow-neu transition-all inline-flex items-center gap-2"
          >
            Marketplace next <FaArrowRight />
          </Link>
          <Link
            to="/mediator/faq"
            className="px-5 py-3 rounded-neu-sm bg-neu-100 text-blue-700 font-bold text-sm shadow-neu-sm hover:shadow-neu transition-all inline-flex items-center gap-2"
          >
            CRM FAQs <FaArrowRight />
          </Link>
        </div>
      </div>
    </div>
  );
}
