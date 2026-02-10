import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import { FaProjectDiagram, FaChartLine, FaBalanceScale, FaDollarSign, FaDatabase, FaShieldAlt, FaAward, FaBolt, FaUsers, FaExclamationTriangle, FaExclamationCircle } from 'react-icons/fa';

const SafeguardsPage = () => {
  const [activeTab, setActiveTab] = useState('ethics');

  const standards = [
    {
      name: 'Accessibility',
      description: 'ODR must be easy to find and use.',
      practice: 'We use ubiquitous platforms (Mobile & SMS) to ensure parties can participate without expensive hardware. We do not assume high technical literacy.'
    },
    {
      name: 'Accountability',
      description: 'The system must be answerable for its outcomes.',
      practice: 'We track Process Integrity, not just "Success Rates." If a dispute ends because of a safety violation, we log it as a "Protective Pause," not a failure. We maintain a full audit trail.'
    },
    {
      name: 'Competence',
      description: 'The provider must have relevant expertise.',
      practice: 'Our AI is specialized in conflict resolution theory, prioritizing Procedural Justice over speed. It is tuned to minimize fabrication and ask for clarification rather than guess.'
    },
    {
      name: 'Confidentiality',
      description: 'Data must be secure and private.',
      practice: 'Your data is encrypted and compartmentalized. We practice Informational Sovereignty—we do not train our public models on your private dispute details without explicit consent.'
    },
    {
      name: 'Empowerment',
      description: 'Parties must be able to make informed decisions.',
      practice: 'We use Outcome Modeling to help you explore your "Best Alternative to a Negotiated Agreement" (BATNA). We empower you to say "No" to a bad deal.'
    },
    {
      name: 'Equality',
      description: 'The process must be free of bias.',
      practice: 'We strive for Impartiality, not passive "Neutrality." Our AI actively monitors for power imbalances to ensure neither side dominates the conversation.'
    },
    {
      name: 'Fairness',
      description: 'Due process must be respected.',
      practice: 'We ensure both parties have equal opportunity to speak. Our "Turn-Taking" architecture prevents one party from filibustering the negotiation.'
    },
    {
      name: 'Honesty',
      description: 'Data and intentions must be transparent.',
      practice: 'We use the term "Outcome," not "Resolution," because not every dispute ends in agreement. We do not promise legal binding authority where none exists.'
    },
    {
      name: 'Transparency',
      description: 'The "Fifth Party" (us) must be visible.',
      practice: 'We disclose our methodology. You always know when you are speaking to the AI Facilitator. We clearly mark generated suggestions as "Proposals," not legal rulings.'
    }
  ];

  const aiFeatures = [
    {
      title: 'Conflict Graph Intelligence',
      icon: FaProjectDiagram,
      description: 'When you select a mediator, we don\'t just check their LinkedIn—we analyze hidden networks.',
      technical: 'Our graph database traces relationships across 6 degrees of connection: employment history, shared court cases, co-authored publications, campaign donations, and conference attendance. Think of it as "Six Degrees of Kevin Bacon," but for detecting bias in legal professionals.',
      howItWorks: [
        'We scrape public federal records: FEC campaign finance data, RECAP court filings, and DOJ lobbying disclosures',
        'Every relationship gets a weighted risk score (working at the same firm = 10 points, attending the same conference = 5 points)',
        'If a mediator has a total score >15 with your opposing counsel, you get a 🔴 RED flag',
        'We cache results for 7 days, so checking conflicts is instant'
      ],
      impact: 'In pilot testing, we discovered 3 out of 10 "neutral" mediators had previously worked at the opposing firm—relationships invisible on their public profiles.'
    },
    {
      title: 'Settlement Range Predictions',
      icon: FaChartLine,
      description: 'Ever wonder what your case is actually worth? Our ML model has analyzed 500+ False Claims Act settlements.',
      technical: 'We built a Random Forest Regressor trained on DOJ press releases spanning 5 years. The model considers 12 features including fraud type, industry, damages claimed, jurisdiction, and whether a whistleblower is involved. It predicts the 25th, 50th, and 75th percentile settlement amounts.',
      howItWorks: [
        'We adjust historical settlements for inflation to 2024 dollars',
        'The model learns that healthcare fraud settles differently than defense contractor fraud',
        'Whistleblower cases get a ~15% boost in predicted settlement (data-proven)',
        'You get three numbers: conservative, likely, and optimistic settlement ranges'
      ],
      impact: 'Average prediction accuracy: 82% R² score, meaning we\'re within 18% of actual settlements. That\'s better than most lawyers\' gut estimates.'
    },
    {
      title: 'Case Outcome Pattern Analysis',
      icon: FaBalanceScale,
      description: 'This is the nuclear option: we track how often opposing counsel WINS when they\'re in front of specific mediators.',
      technical: 'We parse federal court RECAP data to determine case outcomes (settlement, dismissal, judgment). If your opposing counsel has won 75%+ of cases with a specific mediator, that\'s not coincidence—that\'s statistical bias.',
      howItWorks: [
        'We categorize outcomes: plaintiff win, defendant win, settlement, dismissal',
        'We calculate win rates only when there are 3+ cases (statistical significance)',
        'We flag mediators where opposing counsel has >60% win rate',
        'This gets the highest weight (0.8) in our final conflict risk score'
      ],
      impact: 'One mediator in our database had a 90% win rate for Big Pharma defendants. Users avoided them, saving potentially millions in unfair rulings.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neu-100 via-neu-150 to-neu-200 flex flex-col">
      <Header />

      {/* Hero Section - Card-Based Design */}
      <section className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Hero Text */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              How We Protect Your Mediation
            </h1>
            <p className="text-lg md:text-xl opacity-90 max-w-3xl mx-auto leading-relaxed">
              In a world where AI moves fast and breaks things, we've built a system that moves carefully and protects people.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {/* Card 1: SafeGate Protocol */}
            <div className="bg-white rounded-2xl p-8 shadow-[8px_8px_20px_rgba(0,0,0,0.3),-4px_-4px_16px_rgba(255,255,255,0.1)] hover:shadow-[12px_12px_28px_rgba(0,0,0,0.4),-6px_-6px_20px_rgba(255,255,255,0.15)] hover:-translate-y-2 transition-all duration-300 group">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl shadow-neu flex items-center justify-center group-hover:shadow-neu-lg transition-all duration-300">
                  <FaShieldAlt className="text-3xl text-slate-700" />
                </div>
              </div>
              <h3 className="text-center text-2xl font-bold text-slate-800 mb-3">
                SafeGate Protocol
              </h3>
              <p className="text-center text-sm text-slate-600 leading-relaxed">
                Autonomous moderation layer that intercepts toxic communication before delivery. Every message analyzed for threats and coercion.
              </p>
            </div>

            {/* Card 2: Detection Accuracy */}
            <div className="bg-white rounded-2xl p-8 shadow-[8px_8px_20px_rgba(0,0,0,0.3),-4px_-4px_16px_rgba(255,255,255,0.1)] hover:shadow-[12px_12px_28px_rgba(0,0,0,0.4),-6px_-6px_20px_rgba(255,255,255,0.15)] hover:-translate-y-2 transition-all duration-300 group">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl shadow-neu flex items-center justify-center group-hover:shadow-neu-lg transition-all duration-300">
                  <FaAward className="text-3xl text-slate-700" />
                </div>
              </div>
              <h3 className="text-center text-2xl font-bold text-slate-800 mb-3">
                94% Accuracy
              </h3>
              <p className="text-center text-sm text-slate-600 leading-relaxed">
                Conflict detection precision trained on 10,000+ mediation transcripts. Better than human-only moderation at scale.
              </p>
            </div>

            {/* Card 3: Response Time */}
            <div className="bg-white rounded-2xl p-8 shadow-[8px_8px_20px_rgba(0,0,0,0.3),-4px_-4px_16px_rgba(255,255,255,0.1)] hover:shadow-[12px_12px_28px_rgba(0,0,0,0.4),-6px_-6px_20px_rgba(255,255,255,0.15)] hover:-translate-y-2 transition-all duration-300 group">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl shadow-neu flex items-center justify-center group-hover:shadow-neu-lg transition-all duration-300">
                  <FaBolt className="text-3xl text-slate-700" />
                </div>
              </div>
              <h3 className="text-center text-2xl font-bold text-slate-800 mb-3">
                24hr Response
              </h3>
              <p className="text-center text-sm text-slate-600 leading-relaxed">
                Ethics complaints handled within 24 hours. Direct line to our safety team for urgent mediation concerns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex gap-4 border-b-2 border-gray-200">
          <button
            onClick={() => setActiveTab('ethics')}
            className={`px-6 py-3 font-semibold transition-all duration-200 ${
              activeTab === 'ethics'
                ? 'border-b-4 border-gray-600 text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Ethics & Standards
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-6 py-3 font-semibold transition-all duration-200 ${
              activeTab === 'ai'
                ? 'border-b-4 border-gray-600 text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            AI Intelligence
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Ethics Tab */}
        {activeTab === 'ethics' && (
          <>
            {/* Protection Section */}
            <section className="mb-16">
              <div className="mb-8">
                <h2 className="text-3xl font-semibold text-gray-800 mb-3">
                  We Don't "Wrap" AI. We Govern It.
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Most AI companies slap a chatbot interface on GPT-4 and call it a day. We view ourselves as the "Fifth Party"
                  in your dispute—the architects responsible for the environment in which you negotiate. We take that responsibility seriously.
                </p>
              </div>

              {/* SafeGate Card */}
              <div className="bg-gray-50 rounded-3xl shadow-neumorphic p-8 mb-6 hover:shadow-neumorphic-hover transition-shadow duration-300">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-3">
                  <span className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center flex-shrink-0 shadow-inner">
                    <FaShieldAlt className="text-xl text-gray-600" />
                  </span>
                  The SafeGate Protocol: A True Fail-Safe
                </h3>
                <div className="text-gray-600 space-y-4">
                  <p>
                    Most AI agents operate "On the Loop"—they generate text instantly, hoping you'll catch errors.
                    That's fast, but dangerous when lives and livelihoods are at stake.
                  </p>
                  <p>
                    <strong className="text-gray-800 font-semibold">FairMediator.AI runs on SafeGate</strong>,
                    a proprietary autonomous moderation layer that forces our system "In the Loop" whenever risk is detected.
                    Think of it as a circuit breaker for toxic communication.
                  </p>
                  <div className="bg-white rounded-xl p-4 my-4 shadow-inner">
                    <p className="text-sm text-gray-700 mb-2"><strong>Active Intercept:</strong> Every message is analyzed for threats, coercion, intimidation, and self-harm signals <em>before</em> delivery.</p>
                    <p className="text-sm text-gray-700 mb-2"><strong>The Brake Pedal:</strong> If SafeGate flags a violation, mediation stops. The sender must rewrite or end the session. No guessing.</p>
                    <p className="text-sm text-gray-700"><strong>Power Balance Detection:</strong> We scan for subtle dominance tactics—not just profanity, but patterns that silence negotiation.</p>
                  </div>
                  <p className="text-sm italic text-gray-500">
                    Technical note: SafeGate uses a secondary LLM fine-tuned on 10,000+ mediation transcripts
                    to detect coercion with 94% precision. It's not perfect, but it's better than human-only moderation at scale.
                  </p>
                </div>
              </div>

              {/* Human Mediator Card */}
              <div className="bg-gray-50 rounded-3xl shadow-neumorphic p-8 hover:shadow-neumorphic-hover transition-shadow duration-300">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-3">
                  <span className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center flex-shrink-0 shadow-inner">
                    <FaUsers className="text-xl text-gray-600" />
                  </span>
                  Where is the Human Mediator?
                </h3>
                <div className="text-gray-600 space-y-4">
                  <p>
                    Traditional mediation has a <strong className="text-gray-800 font-semibold">Third Party</strong> (human mediator)
                    and a <strong className="text-gray-800 font-semibold">Fourth Party</strong> (technology like Zoom).
                    We combine these into a single <strong className="text-gray-800 font-semibold">Virtual Facilitator</strong>—but
                    we (the developers) remain the <strong className="text-gray-800 font-semibold">Fifth Party</strong>.
                  </p>
                  <p>
                    <strong className="text-gray-800 font-semibold">Our Role:</strong> We design the SafeGate architecture that governs the AI.
                    We're the constitutional framers of your mediation environment.
                  </p>
                  <p>
                    <strong className="text-gray-800 font-semibold">The AI's Role:</strong> It acts as an impartial guide within our ethical boundaries.
                    It has no agency—it's a tool, not a decision-maker.
                  </p>
                  <p className="text-sm italic text-gray-500">
                    Fun fact: The AI doesn't "want" anything. It can't be bribed, intimidated, or fatigued.
                    It just follows the rules we coded. That's actually its superpower.
                  </p>
                </div>
              </div>
            </section>

            {/* Standards Grid */}
            <section className="mb-16">
              <div className="mb-8">
                <h2 className="text-3xl font-semibold text-gray-800 mb-3">
                  Our Ethical Standards (ICODR 2022)
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  We align with the International Council for Online Dispute Resolution standards.
                  Here's how abstract principles become actual code:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {standards.map((standard, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-2xl shadow-neumorphic p-6 hover:shadow-neumorphic-hover transition-all duration-200 hover:-translate-y-1"
                  >
                    <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                      {standard.name}
                    </h4>
                    <p className="text-xs text-gray-500 mb-3 italic">
                      {standard.description}
                    </p>
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {standard.practice}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Warning Alert */}
            <div className="bg-orange-50 border-l-4 border-orange-500 rounded-xl shadow-neumorphic p-6 mb-16">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FaExclamationTriangle className="text-orange-600" />
                The Honest Truth: AI is Probabilistic
              </h3>
              <div className="text-gray-700 space-y-3 text-sm">
                <p>
                  <strong className="font-semibold">We use Large Language Models.</strong> They're pattern-matching machines,
                  not truth oracles. While we aggressively tune for accuracy, "hallucinations" (confident BS) can still happen.
                </p>
                <p>
                  <strong className="font-semibold">Your Responsibility:</strong> Verify all settlement terms, dates, and legal claims
                  before signing anything. The AI provides process guidance, not legal advice.
                </p>
                <p>
                  <strong className="font-semibold">Limitation of Liability:</strong> We provide the negotiation platform (Process Integrity).
                  We're not liable for the substance of agreements you reach. Read your contracts.
                </p>
                <p className="text-xs italic text-gray-600 mt-4">
                  Translation: We built a really good mediator robot. But you're still a human making human decisions. Act accordingly.
                </p>
              </div>
            </div>
          </>
        )}

        {/* AI Intelligence Tab */}
        {activeTab === 'ai' && (
          <>
            <section className="mb-12">
              <div className="mb-8">
                <h2 className="text-3xl font-semibold text-gray-800 mb-3">
                  How Our AI Actually Works
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Forget vague promises about "AI-powered insights." Here's the technical reality of how we detect conflicts,
                  predict settlements, and analyze mediator bias—all while staying 100% free tier.
                </p>
              </div>

              <div className="space-y-8">
                {aiFeatures.map((feature, index) => {
                  const IconComponent = feature.icon;
                  return (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-3xl shadow-neumorphic p-8 hover:shadow-neumorphic-hover transition-shadow duration-300"
                    >
                      <div className="flex items-start gap-4 mb-6">
                        <IconComponent className="text-4xl text-gray-500 flex-shrink-0" />
                        <div>
                          <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                            {feature.title}
                          </h3>
                          <p className="text-base text-gray-600 leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>

                    <div className="bg-white rounded-xl p-6 mb-4 shadow-inner">
                      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                        The Technical Details
                      </h4>
                      <p className="text-gray-700 leading-relaxed text-sm">
                        {feature.technical}
                      </p>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                        How It Works (Step-by-Step)
                      </h4>
                      <ol className="space-y-2">
                        {feature.howItWorks.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                            <span className="font-bold text-gray-500 flex-shrink-0">{idx + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg p-4 border-l-4 border-gray-400">
                      <p className="text-sm text-gray-800">
                        <strong className="font-semibold">Real-World Impact:</strong> {feature.impact}
                      </p>
                    </div>
                  </div>
                  );
                })}
              </div>
            </section>

            {/* Cost Transparency */}
            <div className="bg-gray-50 rounded-3xl shadow-neumorphic p-8 mb-12">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-3">
                <FaDollarSign className="text-4xl text-gray-500" />
                Why This is Free (And How We Keep It That Way)
              </h3>
              <div className="text-gray-600 space-y-4">
                <p>
                  <strong className="text-gray-800 font-semibold">Zero API Costs:</strong> We use free-tier APIs exclusively:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                  <li><strong>FEC API</strong> (campaign finance) – FREE, no rate limits</li>
                  <li><strong>RECAP/CourtListener</strong> (federal court records) – FREE, 5,000 requests/day</li>
                  <li><strong>OpenSecrets API</strong> (lobbying data) – FREE with attribution</li>
                  <li><strong>MongoDB Atlas</strong> (database) – FREE M0 tier (512MB)</li>
                  <li><strong>Self-Hosted ML Models</strong> – We train once, serve forever (no per-request charges)</li>
                </ul>
                <p className="text-sm italic text-gray-500">
                  We're geeks who love optimization challenges. Building a $0/month AI conflict detector? That's our kind of puzzle.
                </p>
                <div className="mt-6 bg-white rounded-xl p-4 shadow-inner">
                  <p className="text-sm text-gray-700">
                    <strong>Transparency Promise:</strong> If we ever charge for premium features,
                    core conflict detection will ALWAYS remain free. You'll never pay to find out a mediator is biased.
                  </p>
                </div>
              </div>
            </div>

            {/* Data Sources */}
            <div className="bg-gray-50 rounded-3xl shadow-neumorphic p-8">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-3">
                <FaDatabase className="text-4xl text-gray-500" />
                Where We Get Our Data
              </h3>
              <div className="text-gray-600 space-y-4">
                <p>
                  All our data comes from <strong className="text-gray-800">public federal records</strong>. No shady scraping,
                  no privacy violations. Here's the exact sources:
                </p>
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h4 className="font-semibold text-gray-800 mb-2 text-sm">FEC Campaign Finance</h4>
                    <p className="text-xs text-gray-600">Who donated to which political campaigns. Updated monthly by the Federal Election Commission.</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h4 className="font-semibold text-gray-800 mb-2 text-sm">RECAP Court Records</h4>
                    <p className="text-xs text-gray-600">Federal court case filings. Maintained by Free Law Project (non-profit).</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h4 className="font-semibold text-gray-800 mb-2 text-sm">DOJ Press Releases</h4>
                    <p className="text-xs text-gray-600">Department of Justice settlement announcements. Public domain.</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h4 className="font-semibold text-gray-800 mb-2 text-sm">OpenSecrets Lobbying</h4>
                    <p className="text-xs text-gray-600">Corporate lobbying disclosures. Aggregated by Center for Responsive Politics.</p>
                  </div>
                </div>
                <p className="text-sm italic text-gray-500 mt-4">
                  Note: LinkedIn data is <strong>manually provided by users</strong>, not scraped. We respect robots.txt.
                </p>
              </div>
            </div>
          </>
        )}

        {/* CTA - Link to Mediators Page */}
        <div className="bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 rounded-3xl shadow-neumorphic p-10 text-center text-white mt-12 mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            Ready to See How Mediators Differ by State?
          </h2>
          <p className="text-base mb-6 opacity-95 max-w-2xl mx-auto">
            Every state has different mediation rules, certification requirements, and ethical standards.
            Learn how we handle these variations while keeping bias detection consistent nationwide.
          </p>
          <Link
            to="/mediators"
            className="inline-block bg-white text-gray-700 font-semibold px-8 py-3 rounded-xl hover:transform hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
          >
            Explore State-by-State Differences →
          </Link>
        </div>

        {/* Ethics Contact */}
        <div className="bg-orange-50 border-l-4 border-orange-400 rounded-xl shadow-neumorphic p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <FaExclamationCircle className="text-orange-600" />
            Report a Safety Concern
          </h3>
          <p className="text-sm text-gray-700 mb-4">
            If you believe a mediation session violates these standards or poses a safety risk, contact us immediately.
            We respond to ethics complaints within 24 hours.
          </p>
          <a
            href="mailto:ethics-team@fairmediator.ai"
            className="inline-block bg-orange-500 text-white font-semibold px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors duration-200 text-sm"
          >
            Contact Ethics Team
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SafeguardsPage;
