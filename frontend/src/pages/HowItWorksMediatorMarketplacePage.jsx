import { Link } from 'react-router-dom';
import {
  FaStore,
  FaSearchLocation,
  FaUserCheck,
  FaBalanceScale,
  FaStar,
  FaDollarSign,
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
    icon: FaSearchLocation,
    title: 'Jurisdiction-Scoped Discovery',
    body: 'Attorneys and parties browse mediators filtered by state, practice area, and credential. You only appear in searches you are eligible for.',
  },
  {
    icon: FaUserCheck,
    title: 'Verified-Only Listings',
    body: 'Every mediator on the marketplace has cleared identity, licensure, and ethics verification. That trust premium translates into higher conversion.',
  },
  {
    icon: FaBalanceScale,
    title: 'Conflict-Screened Bookings',
    body: 'Before a request reaches you, the platform automatically screens against the parties named in the dispute. You never have to triage a conflicted intake again.',
  },
  {
    icon: FaStar,
    title: 'Reputation-Driven Ranking',
    body: 'Profile views, completion rate, settlement rate, and verified reviews feed a transparent ranking score. Quality work is the cheapest form of marketing here.',
  },
  {
    icon: FaDollarSign,
    title: 'Direct Pricing & Payouts',
    body: 'Set your hourly or flat rates on your profile. Bookings transact directly through FairMediator with no opaque referral fees skimmed off the top.',
  },
  {
    icon: FaStore,
    title: 'Featured & Premium Slots',
    body: 'Premium mediators get top placement on relevant searches and a verified badge. Free profiles still appear; premium just compounds reach.',
  },
];

export default function HowItWorksMediatorMarketplacePage() {
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
              style={{ background: `linear-gradient(135deg, ${BRAND.golden}, #E0B83A)` }}
            >
              <FaStore className="text-dark-neu-400 text-xl" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-700 to-dark-neu-300 bg-clip-text text-transparent">
              How the Mediator's Marketplace Works
            </h1>
          </div>
          <p className="text-lg text-neu-600">
            A jurisdiction-scoped, conflict-screened marketplace where attorneys and parties find verified mediators — and where your profile is the product.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {FEATURES.map(({ icon: Icon, title, body }) => (
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

        <div className="bg-neu-100 rounded-neu-lg p-8 mb-8 shadow-neu">
          <h2 className="text-2xl font-bold text-neu-800 mb-4">How a booking actually flows</h2>
          <ol className="space-y-3 text-neu-700">
            <li><strong>1. Discovery</strong> — Attorney filters by jurisdiction + practice area. Top-ranked, verified mediators appear.</li>
            <li><strong>2. Compare</strong> — They open profiles, read reviews, and may queue 2–3 mediators in the comparison tool.</li>
            <li><strong>3. Conflict screen</strong> — Before a request lands in your inbox, the system checks named parties against your declared conflicts.</li>
            <li><strong>4. Request</strong> — A clean, qualified booking arrives with the case summary attached.</li>
            <li><strong>5. Accept</strong> — One click moves the case from the marketplace into your CRM workspace.</li>
          </ol>
        </div>

        <div
          className="rounded-neu-lg p-8 mb-8 shadow-dark-neu-lg"
          style={{ background: `linear-gradient(135deg, ${BRAND.blueDark}, ${BRAND.graphite})` }}
        >
          <h2 className="text-2xl font-bold text-white mb-3">Profile fundamentals that move bookings</h2>
          <ul className="text-neu-300 space-y-2">
            <li>• <strong className="text-white">Practice areas</strong> — selecting the full set you handle, including state-scoped niches, expands your match surface.</li>
            <li>• <strong className="text-white">Credentials & training</strong> — verified credentials lift your ranking score.</li>
            <li>• <strong className="text-white">Photo + bio</strong> — profiles with both convert at ~3× the rate of bare listings.</li>
            <li>• <strong className="text-white">Recent reviews</strong> — fresh, verified reviews compound visibility week over week.</li>
          </ul>
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
            to="/mediator/how-it-works/crm"
            className="px-5 py-3 rounded-neu-sm bg-neu-100 text-blue-700 font-bold text-sm shadow-neu-sm hover:shadow-neu transition-all inline-flex items-center gap-2"
          >
            See the CRM <FaArrowRight />
          </Link>
          <Link
            to="/mediator/faq"
            className="px-5 py-3 rounded-neu-sm bg-neu-100 text-blue-700 font-bold text-sm shadow-neu-sm hover:shadow-neu transition-all inline-flex items-center gap-2"
          >
            Marketplace FAQs <FaArrowRight />
          </Link>
        </div>
      </div>
    </div>
  );
}
