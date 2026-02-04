import Header from '../components/Header';
import Footer from '../components/Footer';

const EthicsPage = () => {
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

  const limitations = [
    {
      title: 'We Are Not Lawyers',
      description: 'FairMediator.AI is a facilitator, not a judge or legal counsel. It cannot provide legal advice or issue binding verdicts.'
    },
    {
      title: 'No "Hallucinations"',
      description: 'We aggressively tune our models to avoid fabricating facts. If the AI seems unsure about a specific local law, it is instructed to pause and ask you for clarification rather than guess.'
    },
    {
      title: 'Human Review Available',
      description: 'While the mediation is automated, you always have the option to end mediation and receive a transcript summary to take to a human lawyer or mediator.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neu-100 via-neu-150 to-neu-200 flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-teal-500 to-teal-700 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            How We Protect Your Mediation
          </h1>
          <p className="text-xl md:text-2xl font-medium mb-6 opacity-95">
            Our Commitment to Fair Process
          </p>
          <p className="text-base md:text-lg opacity-90 max-w-3xl mx-auto leading-relaxed">
            In the rapidly evolving world of Artificial Intelligence, speed is often prioritized over safety. At FairMediator.AI, we take a different approach. We believe that dispute resolution requires more than just intelligence—it requires integrity.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Protection Section */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-gray-800 mb-3">
              We Don't "Wrap" AI. We Govern It.
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              We view ourselves as the "Fifth Party" in your dispute—the architects responsible for the environment in which you negotiate. We take that responsibility seriously.
            </p>
          </div>

          {/* SafeGate Card */}
          <div className="bg-gray-50 rounded-3xl shadow-neumorphic p-8 mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-3">
              <span className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                🛡️
              </span>
              The SafeGate Protocol: A True Fail-Safe
            </h3>
            <div className="text-gray-600 space-y-4">
              <p>
                Most AI agents operate "On the Loop"—they generate text instantly, relying on the user to catch errors or hallucinations. This speed creates risk.
              </p>
              <p>
                <strong className="text-gray-800 font-semibold">FairMediator.AI is built on SafeGate</strong>, a proprietary autonomous moderation layer that forces our system "In the Loop" whenever a risk is detected.
              </p>
              <p>
                <strong className="text-gray-800 font-semibold">Active Intercept:</strong> Every message is analyzed for threats, coercion, intimidation, and self-harm before it is relayed to the other party.
              </p>
              <p>
                <strong className="text-gray-800 font-semibold">The Brake Pedal:</strong> If SafeGate detects a violation, the mediation stops. The message is blocked, and the sender is required to rewrite it or end the session. We do not allow the AI to "guess" its way through safety risks.
              </p>
              <p>
                <strong className="text-gray-800 font-semibold">Coercion Detection:</strong> We don't just look for profanity. We scan for subtle power imbalances and intimidation tactics that silence meaningful negotiation.
              </p>
            </div>
          </div>

          {/* Human Mediator Card */}
          <div className="bg-gray-50 rounded-3xl shadow-neumorphic p-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-3">
              <span className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                👥
              </span>
              Where is the Human Mediator?
            </h3>
            <div className="text-gray-600 space-y-4">
              <p>
                In traditional mediation, you have a <strong className="text-gray-800 font-semibold">Third Party</strong> (the human mediator) and a <strong className="text-gray-800 font-semibold">Fourth Party</strong> (technology like WhatsApp, Zoom, Email, etc.). FairMediator.AI combines these into a single <strong className="text-gray-800 font-semibold">Virtual Facilitator</strong>.
              </p>
              <p>
                This AI provides the structure and impartiality of a human mediator, instantly and at scale. However, we (the developers) remain the <strong className="text-gray-800 font-semibold">Fifth Party</strong>.
              </p>
              <p>
                <strong className="text-gray-800 font-semibold">Our Role:</strong> We design the "SafeGate" architecture that governs the AI.
              </p>
              <p>
                <strong className="text-gray-800 font-semibold">The AI's Role:</strong> It acts as an impartial guide, following our strict safety protocols. It does not have its own agency; it operates within the ethical boundaries we have coded.
              </p>
            </div>
          </div>
        </section>

        {/* Standards Section */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-gray-800 mb-3">
              Our Ethical Standards
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              We align our engineering with the 2022 International Council for Online Dispute Resolution (ICODR) Standards. Here is how we translate those principles into code:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {standards.map((standard, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-2xl shadow-neumorphic p-6 hover:shadow-neumorphic-hover transition-shadow duration-200"
              >
                <h4 className="text-sm font-semibold text-teal-600 uppercase tracking-wide mb-2">
                  {standard.name}
                </h4>
                <p className="text-xs text-gray-600 mb-3">
                  {standard.description}
                </p>
                <p className="text-sm text-gray-800 leading-relaxed">
                  {standard.practice}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Limitations Section */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-gray-800 mb-3">
              Methodology & Limitations
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              To ensure Transparency, we disclose the following limitations of our system:
            </p>
          </div>

          <div className="space-y-4">
            {limitations.map((limitation, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-xl shadow-neumorphic p-6 border-l-4 border-teal-500"
              >
                <strong className="text-gray-800 font-semibold block mb-2">
                  {limitation.title}
                </strong>
                <p className="text-gray-600">{limitation.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Warning Alert */}
        <div className="bg-orange-50 border-l-4 border-orange-500 rounded-xl shadow-neumorphic p-6 mb-16">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            ⚠️ Important Disclaimer: Probabilistic, Not Deterministic
          </h3>
          <div className="text-gray-700 space-y-3">
            <p>
              <strong className="font-semibold">FairMediator.AI uses Large Language Models (LLMs) to facilitate communication.</strong> While we aggressively tune for accuracy, AI is probabilistic, meaning it generates responses based on patterns and data.
            </p>
            <p>
              <strong className="font-semibold">Verification Required:</strong> The AI may occasionally generate incorrect information ("hallucinations"). Users are responsible for verifying all settlement terms, dates, and local laws before agreeing to an outcome.
            </p>
            <p>
              <strong className="font-semibold">No Legal Advice:</strong> The Virtual Facilitator provides process guidance, not legal counsel. Suggestions made by the AI are for negotiation purposes only.
            </p>
            <p>
              <strong className="font-semibold">Limitation of Liability:</strong> By using this service, you acknowledge that FairMediator.AI provides the platform for negotiation (Process Integrity) but is not liable for the substantive terms of any agreement reached.
            </p>
          </div>
        </div>

        {/* Self-Certification Section */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-gray-800 mb-3">
              ODR Standards Self-Certification
            </h2>
          </div>

          <div className="bg-gray-50 rounded-3xl shadow-neumorphic p-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-3">
              <span className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                ✓
              </span>
              Statement of Self-Certification
            </h3>
            <div className="text-gray-600 space-y-4">
              <p className="italic">
                "We self-certify compliance with the Online Dispute Resolution (ODR) Standards and will accept inquiries and respond with transparency about how we comply with each of the ODR Standards."
              </p>
              <p className="font-semibold text-gray-800">— FairMediator.AI Team</p>
              <p>
                We are proud to stand with the global community of ODR practitioners in building a safer, fairer digital justice system.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Box */}
        <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-3xl shadow-neumorphic p-10 text-center text-white mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            Need to Report a Safety Concern?
          </h2>
          <p className="text-base mb-6 opacity-95">
            If you believe a mediation session violates these standards or poses a safety risk, please contact us immediately.
          </p>
          <a
            href="mailto:ethics-team@fairmediator.ai"
            className="inline-block bg-white text-teal-600 font-semibold px-8 py-3 rounded-xl hover:transform hover:-translate-y-1 transition-transform duration-200"
          >
            Contact Ethics Team
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EthicsPage;
