import { Link } from 'react-router-dom';
import {
  FaUserTie,
  FaSearch,
  FaHandshake,
  FaShieldAlt,
  FaChartLine,
  FaRobot,
  FaArrowRight,
} from 'react-icons/fa';

const BRAND = {
  blue: '#2563EB',
  blueDark: '#1E3A8A',
  blueDeep: '#1D4ED8',
  golden: '#F5D15C',
  graphite: '#252D3A',
};

const STEPS = [
  {
    icon: FaUserTie,
    title: '1. Build Your Verified Profile',
    body: 'Apply, get credentialed, and publish a profile that shows your jurisdictions, practice areas, rates, and availability. Verified mediators get 3× more visibility.',
  },
  {
    icon: FaSearch,
    title: '2. Get Matched with Cases',
    body: 'Attorneys and parties search for mediators using the same conflict-screened, jurisdiction-scoped engine that powers our marketplace. Strong matches surface to the top.',
  },
  {
    icon: FaShieldAlt,
    title: '3. Conflicts & Ethics Are Pre-Screened',
    body: 'Every booking runs through automated conflict-of-interest checks before it reaches you. You only see cases you can ethically take.',
  },
  {
    icon: FaRobot,
    title: '4. Run the Case in Your AI-Powered CRM',
    body: 'Intake forms, scheduling, document collection, settlement drafts, and party communications all live in one workspace — with AI assistance for summaries and prep.',
  },
  {
    icon: FaHandshake,
    title: '5. Resolve & Get Paid',
    body: 'Send invoices, collect signed agreements, and close the case from the same dashboard. Payment, e-signature, and final reporting are built in.',
  },
  {
    icon: FaChartLine,
    title: '6. Grow with Analytics',
    body: 'Your dashboard tracks profile views, success rate, cases by practice area, and which jurisdictions are sending you the most work — so you know where to invest.',
  },
];

export default function HowItWorksMediatorsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neu-100 to-neu-200 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <Link to="/mediator/dashboard" className="text-sm text-blue-700 hover:text-blue-900 font-semibold">
            ← Back to dashboard
          </Link>
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-700 to-dark-neu-300 bg-clip-text text-transparent mt-4 mb-3">
            How FairMediator Works for Mediators
          </h1>
          <p className="text-lg text-neu-600">
            From your first verified profile to a paid, signed settlement — here is the full lifecycle of a case on FairMediator.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {STEPS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-neu-100 rounded-neu-lg p-6 shadow-neu">
              <div
                className="w-12 h-12 rounded-neu-sm flex items-center justify-center shadow-neu-sm mb-4"
                style={{ background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.blueDeep})` }}
              >
                <Icon className="text-white text-xl" />
              </div>
              <h3 className="font-bold text-neu-800 mb-2">{title}</h3>
              <p className="text-sm text-neu-700 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <div
          className="rounded-neu-lg p-8 mb-8 shadow-dark-neu-lg"
          style={{ background: `linear-gradient(135deg, ${BRAND.blueDark}, ${BRAND.graphite})` }}
        >
          <h2 className="text-2xl font-bold text-white mb-3">Why mediators choose FairMediator</h2>
          <ul className="text-neu-300 space-y-2 mb-6">
            <li>• Pre-screened, conflict-checked referrals — no wasted intake calls.</li>
            <li>• A single workspace for case files, scheduling, billing, and AI-assisted prep.</li>
            <li>• Jurisdiction-scoped exposure — every state where you are credentialed.</li>
            <li>• Transparent pricing and direct payouts, not opaque referral fees.</li>
          </ul>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/mediator/how-it-works/crm"
              className="px-5 py-3 rounded-neu-sm bg-accent-yellow text-dark-neu-400 font-bold text-sm shadow-neu-sm hover:shadow-neu transition-all inline-flex items-center gap-2"
            >
              See the AI-Powered CRM <FaArrowRight />
            </Link>
            <Link
              to="/mediator/how-it-works/marketplace"
              className="px-5 py-3 rounded-neu-sm bg-neu-100 text-blue-700 font-bold text-sm shadow-neu-sm hover:shadow-neu transition-all inline-flex items-center gap-2"
            >
              See the Marketplace <FaArrowRight />
            </Link>
            <Link
              to="/mediator/faq"
              className="px-5 py-3 rounded-neu-sm bg-neu-100 text-blue-700 font-bold text-sm shadow-neu-sm hover:shadow-neu transition-all inline-flex items-center gap-2"
            >
              FAQs for Mediators <FaArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
