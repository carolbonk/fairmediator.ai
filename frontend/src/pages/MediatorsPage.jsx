import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import { FaMapMarkedAlt, FaGraduationCap, FaBalanceScale, FaLandmark, FaGlobeAmericas, FaRobot, FaTools, FaMapPin, FaChartBar, FaSearch } from 'react-icons/fa';

const MediatorsPage = () => {
  const [selectedRegion, setSelectedRegion] = useState('all');

  const stateVariations = {
    northeast: {
      name: 'Northeast',
      states: ['NY', 'NJ', 'PA', 'MA', 'CT', 'RI', 'VT', 'NH', 'ME'],
      characteristics: {
        certification: 'Typically requires 40+ hours of mediation training plus ongoing CLE credits',
        courtIntegration: 'Strong court-connected ADR programs (NYC has dedicated mediation centers)',
        specialty: 'Commercial and employment disputes dominate; high concentration of JD-required mediators',
        averageCost: '$350-$500/hour for experienced mediators',
        uniqueRequirement: 'New York requires mediators to register with the Unified Court System'
      },
      example: {
        state: 'New York',
        detail: 'The New York State Unified Court System requires all mediators in court-connected programs to complete a minimum of 40 hours of training. Mediators handling commercial cases often have law degrees and 10+ years of practice experience.'
      }
    },
    southeast: {
      name: 'Southeast',
      states: ['FL', 'GA', 'NC', 'SC', 'VA', 'TN', 'AL', 'MS', 'LA', 'AR', 'KY', 'WV'],
      characteristics: {
        certification: 'Florida Supreme Court certification is considered the gold standard',
        courtIntegration: 'Florida pioneered mandatory mediation for certain case types in the 1980s',
        specialty: 'Personal injury, real estate, and family law mediation are heavily regulated',
        averageCost: '$250-$400/hour; Florida-certified mediators command premium rates',
        uniqueRequirement: 'Florida requires county-specific certification for family mediators'
      },
      example: {
        state: 'Florida',
        detail: 'Florida has the most comprehensive mediator certification system in the US. Circuit mediators need 40 training hours + mentorship. Family mediators need mental health background OR law degree + supervised practice.'
      }
    },
    midwest: {
      name: 'Midwest',
      states: ['IL', 'OH', 'MI', 'IN', 'WI', 'MN', 'IA', 'MO', 'KS', 'NE', 'SD', 'ND'],
      characteristics: {
        certification: 'Varies widely; Minnesota has robust standards, others rely on organizational credentials',
        courtIntegration: 'Chicago and Minneapolis have extensive ADR infrastructure',
        specialty: 'Agricultural disputes, labor relations, and commercial mediation',
        averageCost: '$200-$350/hour; lower than coastal states',
        uniqueRequirement: 'Minnesota requires mediators to maintain $1M liability insurance'
      },
      example: {
        state: 'Minnesota',
        detail: 'Minnesota Statute §114.37 mandates ethical standards for "neutrals" in environmental disputes. Mediators must disclose any conflicts within 10 days of appointment or face disqualification.'
      }
    },
    southwest: {
      name: 'Southwest',
      states: ['TX', 'OK', 'NM', 'AZ'],
      characteristics: {
        certification: 'Texas has no statewide certification; relies on private credentialing organizations',
        courtIntegration: 'Strong emphasis on court-annexed arbitration over mediation',
        specialty: 'Oil & gas, construction defects, and cross-border (Mexico) disputes',
        averageCost: '$250-$450/hour in major metro areas',
        uniqueRequirement: 'Texas allows retired judges to mediate without additional training'
      },
      example: {
        state: 'Texas',
        detail: 'Texas has NO mandatory mediator qualifications for private mediations. However, court-ordered mediations require 40 hours of training + 3 years of legal practice (if lawyer) or equivalent professional experience.'
      }
    },
    west: {
      name: 'West',
      states: ['CA', 'WA', 'OR', 'NV', 'ID', 'UT', 'CO', 'WY', 'MT', 'AK', 'HI'],
      characteristics: {
        certification: 'California has separate tracks for civil vs. family mediation',
        courtIntegration: 'Mandatory mediation for custody/visitation disputes in CA',
        specialty: 'Tech sector disputes, environmental law, and tribal sovereignty conflicts',
        averageCost: '$400-$600/hour in Bay Area/Seattle; $250-$350 elsewhere',
        uniqueRequirement: 'California family mediators must have 12 hours of domestic violence training'
      },
      example: {
        state: 'California',
        detail: 'California Family Code §3164 requires family law mediators to detect power imbalances and domestic violence indicators. Our AI includes this as a core feature for all mediations, not just family law.'
      }
    }
  };

  const howWeHandle = [
    {
      challenge: 'Different Certification Standards',
      icon: FaGraduationCap,
      problem: 'A mediator certified in Florida might not meet Minnesota\'s insurance requirements',
      solution: 'We tag mediators with all state certifications and display jurisdiction-specific credentials. Users see only mediators authorized for their state.',
      technical: 'Database schema includes certifications[] array with state, type, expiration date, and verification status'
    },
    {
      challenge: 'Varying Conflict-of-Interest Rules',
      icon: FaBalanceScale,
      problem: 'Texas allows former opposing counsel to mediate. New York has stricter rules about attorney-mediators.',
      solution: 'Our graph analyzer applies state-specific thresholds. A relationship that\'s a 🟡 YELLOW flag in Texas becomes 🔴 RED in New York.',
      technical: 'Risk calculator has state_jurisdiction parameter that adjusts RISK_THRESHOLDS dynamically'
    },
    {
      challenge: 'Court vs. Private Mediation',
      icon: FaLandmark,
      problem: 'Court-ordered mediations have mandatory reporting. Private mediations are confidential.',
      solution: 'We ask users to specify mediation type. Court-connected sessions include settlement agreement templates compliant with state civil procedure rules.',
      technical: 'mediationType: "court" || "private" determines disclosure requirements and document generation'
    },
    {
      challenge: 'Multi-State Disputes',
      icon: FaGlobeAmericas,
      problem: 'California plaintiff vs. Texas defendant—whose rules apply?',
      solution: 'We follow the Uniform Mediation Act (UMA) principles. Users select governing jurisdiction. Mediator must be credentialed in chosen state.',
      technical: 'governingJurisdiction field + credential validation against selectedState prevents unauthorized practice'
    }
  ];

  const regionalData = Object.entries(stateVariations);
  const filteredRegions = selectedRegion === 'all'
    ? regionalData
    : regionalData.filter(([key]) => key === selectedRegion);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neu-100 via-neu-150 to-neu-200 flex flex-col">
      <Header />

      {/* Hero Section - Silver Banner */}
      <section className="bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            How Mediators Differ Across America
          </h1>
          <p className="text-xl md:text-2xl font-medium mb-6 opacity-95">
            State-by-State Rules, Requirements, and What It Means for You
          </p>
          <p className="text-base md:text-lg opacity-90 max-w-3xl mx-auto leading-relaxed">
            Mediation isn't federally regulated like law or medicine. Every state makes its own rules—and they're wildly different.
            Here's how we navigate that complexity so you don't have to.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-grow max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* The Problem */}
        <section className="mb-16">
          <div className="bg-gray-50 rounded-3xl shadow-neumorphic p-8">
            <h2 className="text-3xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
              <FaMapMarkedAlt className="text-4xl text-gray-500" />
              The 50-State Mediation Patchwork
            </h2>
            <div className="text-gray-600 space-y-4">
              <p className="text-lg leading-relaxed">
                Unlike doctors (who must pass USMLE) or lawyers (who must pass the bar), there's <strong className="text-gray-800">no national mediator license</strong>.
                What qualifies someone to mediate in Florida might be illegal in Minnesota. What's considered a conflict in California might be fine in Texas.
              </p>
              <div className="bg-white rounded-xl p-6 my-6 shadow-inner">
                <h3 className="font-semibold text-gray-800 mb-3">Real Example: The "40-Hour Problem"</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Most states require 40 hours of mediation training to handle court-connected cases. But what counts as "training"?
                  Florida requires in-person mentorship. Texas accepts online courses. Minnesota demands annual continuing education.
                  Georgia has no requirement at all for private mediations. One mediator, four different standards.
                </p>
              </div>
              <p>
                This creates a <strong className="text-gray-800">verification nightmare</strong>. How do you know if your mediator
                is actually qualified under YOUR state's rules? That's where we come in.
              </p>
            </div>
          </div>
        </section>

        {/* Regional Filter */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Regional Breakdown
            </h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setSelectedRegion('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedRegion === 'all'
                    ? 'bg-gray-600 text-white shadow-neumorphic'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Regions
              </button>
              {Object.entries(stateVariations).map(([key, region]) => (
                <button
                  key={key}
                  onClick={() => setSelectedRegion(key)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    selectedRegion === key
                      ? 'bg-gray-600 text-white shadow-neumorphic'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {region.name}
                </button>
              ))}
            </div>
          </div>

          {/* Region Cards */}
          <div className="space-y-6">
            {filteredRegions.map(([key, region]) => (
              <div
                key={key}
                className="bg-gray-50 rounded-3xl shadow-neumorphic p-8 hover:shadow-neumorphic-hover transition-shadow duration-300"
              >
                <div className="mb-6">
                  <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                    {region.name}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {region.states.map(state => (
                      <span
                        key={state}
                        className="px-3 py-1 bg-white rounded-lg text-xs font-medium text-gray-600 shadow-sm"
                      >
                        {state}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Certification</h4>
                    <p className="text-sm text-gray-700">{region.characteristics.certification}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Court Integration</h4>
                    <p className="text-sm text-gray-700">{region.characteristics.courtIntegration}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Common Specialties</h4>
                    <p className="text-sm text-gray-700">{region.characteristics.specialty}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Average Cost</h4>
                    <p className="text-sm text-gray-700">{region.characteristics.averageCost}</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl p-4 border-l-4 border-gray-400">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    📌 Unique Requirement: {region.example.state}
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {region.example.detail}
                  </p>
                </div>

                <div className="mt-4 bg-yellow-50 rounded-lg p-3 border-l-2 border-yellow-400">
                  <p className="text-xs text-yellow-800">
                    <strong>Note:</strong> {region.characteristics.uniqueRequirement}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How We Handle Complexity */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-gray-800 mb-3">
              How We Handle This Complexity
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Most mediation platforms throw up their hands and say "check your state bar website."
              We built tech to actually solve this problem.
            </p>
          </div>

          <div className="space-y-6">
            {howWeHandle.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={index}
                  className="bg-gray-50 rounded-3xl shadow-neumorphic p-8 hover:shadow-neumorphic-hover transition-shadow duration-300"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <IconComponent className="text-4xl text-gray-500 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        Challenge: {item.challenge}
                      </h3>
                    </div>
                  </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-red-50 rounded-xl p-4 border-l-2 border-red-400">
                    <h4 className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">The Problem</h4>
                    <p className="text-sm text-red-900">{item.problem}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 border-l-2 border-green-400">
                    <h4 className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Our Solution</h4>
                    <p className="text-sm text-green-900">{item.solution}</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-inner">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Technical Implementation
                  </h4>
                  <p className="text-xs text-gray-700 font-mono bg-gray-50 p-2 rounded">
                    {item.technical}
                  </p>
                </div>
              </div>
            );
            })}
          </div>
        </section>

        {/* AI Consistency Across States */}
        <section className="mb-16">
          <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-3xl shadow-neumorphic p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
              <FaRobot className="text-4xl text-gray-500" />
              The One Thing That Stays Consistent: Our AI
            </h2>
            <div className="text-gray-600 space-y-4">
              <p className="text-base leading-relaxed">
                While state rules vary, our conflict detection, settlement predictions, and bias analysis work the same way
                nationwide. Here's why that matters:
              </p>

              <div className="grid md:grid-cols-3 gap-4 my-6">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm">Conflict Graph Analyzer</h4>
                  <p className="text-xs text-gray-600 mb-3">
                    Scans federal records (FEC, RECAP, DOJ) that are consistent across all states
                  </p>
                  <p className="text-xs italic text-gray-500">
                    Campaign donations in California are reported the same as Texas donations
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm">Settlement Predictor</h4>
                  <p className="text-xs text-gray-600 mb-3">
                    Trained on DOJ settlements that follow federal False Claims Act standards
                  </p>
                  <p className="text-xs italic text-gray-500">
                    Healthcare fraud penalties are federal, not state-specific
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm">Bias Detection</h4>
                  <p className="text-xs text-gray-600 mb-3">
                    Uses statistical win/loss analysis that's jurisdiction-agnostic
                  </p>
                  <p className="text-xs italic text-gray-500">
                    A 90% win rate is suspicious whether it's in NY or TX
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 border-l-4 border-blue-400">
                <p className="text-sm text-blue-900">
                  <strong className="font-semibold">Translation:</strong> You get the same level of conflict detection
                  whether you're in rural Montana or Manhattan. The AI doesn't care about state borders—bias is bias.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Coming Soon: State-Specific Features */}
        <section className="mb-12">
          <div className="bg-gray-50 rounded-3xl shadow-neumorphic p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
              <FaTools className="text-3xl text-gray-500" />
              Coming Soon: State-Specific AI Features
            </h2>
            <div className="text-gray-600 space-y-4">
              <p>
                We're expanding our AI to handle state-level variations better:
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border-l-2 border-gray-300">
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm flex items-center gap-2">
                    <FaMapPin className="text-gray-500" />
                    State Bar Scraping
                  </h4>
                  <p className="text-xs text-gray-600">
                    Auto-verify mediator certifications against state bar databases (CA, NY, FL, TX initially)
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border-l-2 border-gray-300">
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm flex items-center gap-2">
                    <FaBalanceScale className="text-gray-500" />
                    State-Specific Conflict Rules
                  </h4>
                  <p className="text-xs text-gray-600">
                    Adjust risk thresholds based on state ethical opinions (e.g., ABA Formal Opinion 17-462)
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border-l-2 border-gray-300">
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm flex items-center gap-2">
                    <FaChartBar className="text-gray-500" />
                    Local Settlement Data
                  </h4>
                  <p className="text-xs text-gray-600">
                    Scrape state court settlement data (where publicly available) for better predictions
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border-l-2 border-gray-300">
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm flex items-center gap-2">
                    <FaSearch className="text-gray-500" />
                    Jurisdiction-Specific Search
                  </h4>
                  <p className="text-xs text-gray-600">
                    Filter mediators by court-approved lists (e.g., NYC Supreme Court roster)
                  </p>
                </div>
              </div>

              <p className="text-sm italic text-gray-500 mt-4">
                Estimated release: Q2 2026. We're collecting state bar APIs and public records now.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 rounded-3xl shadow-neumorphic p-10 text-center text-white">
          <h2 className="text-2xl font-semibold mb-4">
            Want to Understand Our AI Safeguards?
          </h2>
          <p className="text-base mb-6 opacity-95 max-w-2xl mx-auto">
            Learn how our conflict detection, settlement prediction, and bias analysis systems actually work—
            with full transparency about data sources, algorithms, and limitations.
          </p>
          <Link
            to="/safeguards"
            className="inline-block bg-white text-gray-700 font-semibold px-8 py-3 rounded-xl hover:transform hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
          >
            Read Our AI Documentation →
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MediatorsPage;
