import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronDown, FaQuestionCircle, FaStore, FaRobot } from 'react-icons/fa';

const BRAND = {
  blue: '#2563EB',
  blueDark: '#1E3A8A',
  blueDeep: '#1D4ED8',
  golden: '#F5D15C',
  graphite: '#252D3A',
};

const MARKETPLACE_FAQS = [
  {
    q: 'How do I get on the FairMediator Marketplace?',
    a: 'Apply through the mediator application, complete identity and credential verification, and publish your profile. Once verified, you appear in jurisdiction-scoped search results that match your declared practice areas.',
  },
  {
    q: 'How does the platform decide my ranking on the Marketplace?',
    a: 'Ranking blends profile completeness, verified credentials, settlement rate, recent activity, and rating from completed cases. Premium tier mediators receive a placement boost on relevant queries, but quality signals always carry weight.',
  },
  {
    q: 'How are conflicts of interest screened before a booking reaches me?',
    a: 'Every request runs through automated screening against the parties, counsel, and entities named in the dispute compared with the conflicts you have declared on your profile. Conflicted requests never enter your inbox.',
  },
  {
    q: 'Do I have to accept every booking that comes in?',
    a: 'No. You can decline any request, and declines do not negatively affect your ranking. They simply route to the next best-matched mediator in the requester\'s jurisdiction.',
  },
  {
    q: 'How do payouts work? Does FairMediator take a cut on top of my fees?',
    a: 'You set your own hourly or flat rates. Clients pay through the platform and you receive direct deposit payouts on a predictable cadence. The platform fee is transparent and disclosed at sign-up — there are no hidden referral cuts.',
  },
  {
    q: 'What happens if I want to scope a practice area to only one state?',
    a: 'On your dashboard you can add state-scoped practice areas separately from your nationwide practice areas. Those niches only appear in marketplace searches filtered to that jurisdiction.',
  },
  {
    q: 'Can I list in multiple states?',
    a: 'Yes. Add every state where you are credentialed and the marketplace will show your profile to attorneys and parties searching in those jurisdictions.',
  },
];

const CRM_FAQS = [
  {
    q: 'What does the AI in the AI-Powered CRM actually do?',
    a: 'It generates pre-session case briefs from intake forms and exhibits, summarizes long email threads, drafts first-pass settlement language from your notes, and surfaces follow-up reminders. You stay the author and decision-maker — the AI accelerates the busywork.',
  },
  {
    q: 'Is anything I write in the CRM used to train AI models?',
    a: 'No. Case content and party communications are not used for model training. AI features run on session-scoped context that is isolated to your case workspace.',
  },
  {
    q: 'How does the CRM keep caucus notes confidential between parties?',
    a: 'Notes are tagged per side at the moment of capture. The CRM enforces side-segregation: a note tagged Claimant is never surfaced in a Respondent-side view, summary, or AI prompt. Audit logs preserve chain-of-custody.',
  },
  {
    q: 'Can I import an existing case from another tool?',
    a: 'Yes — you can upload exhibits, intake forms, and prior correspondence into a new case workspace. The AI brief will incorporate them into the first-session summary.',
  },
  {
    q: 'How is scheduling handled in the CRM?',
    a: 'The CRM reconciles availability across parties (and counsel where applicable), is time-zone aware, and re-runs conflict screening against any newly added participant before the session is confirmed.',
  },
  {
    q: 'Can I send invoices and collect payment from the CRM?',
    a: 'Yes. Time entries roll directly from session notes into invoices. You can issue retainers, hourly bills, or flat fees, and payouts deposit to your linked account.',
  },
  {
    q: 'Does the CRM produce final settlement documents?',
    a: 'It produces editable first-pass drafts based on the terms reached in your notes. You review, revise, and route for e-signature inside the same workspace.',
  },
  {
    q: 'What about ethics rules — does the CRM help me stay compliant?',
    a: 'It enforces side-segregation, logs every disclosure, and reminds you when an action (e.g., joint communication, ex parte contact) requires a documented step. The audit trail is exportable if you ever need it.',
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-neu-100 rounded-neu-lg shadow-neu mb-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
        aria-expanded={open}
      >
        <span className="font-semibold text-neu-800">{q}</span>
        <FaChevronDown
          className={`text-neu-600 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-neu-700 leading-relaxed border-t border-neu-200 pt-4">
          {a}
        </div>
      )}
    </div>
  );
}

export default function FaqMediatorsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neu-100 to-neu-200 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <Link to="/mediator/dashboard" className="text-sm text-blue-700 hover:text-blue-900 font-semibold">
            ← Back to dashboard
          </Link>
          <div className="flex items-center gap-3 mt-4 mb-3">
            <div
              className="w-12 h-12 rounded-neu-sm flex items-center justify-center shadow-neu-sm"
              style={{ background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.blueDeep})` }}
            >
              <FaQuestionCircle className="text-white text-xl" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-700 to-dark-neu-300 bg-clip-text text-transparent">
              Mediator FAQs
            </h1>
          </div>
          <p className="text-lg text-neu-600">
            Answers to the questions mediators ask most often about the Marketplace and the AI-Powered CRM.
          </p>
        </div>

        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <FaStore style={{ color: BRAND.golden }} className="text-xl" />
            <h2 className="text-2xl font-bold text-neu-800">Mediators Marketplace</h2>
          </div>
          {MARKETPLACE_FAQS.map((item) => (
            <FaqItem key={item.q} {...item} />
          ))}
        </section>

        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <FaRobot style={{ color: BRAND.blue }} className="text-xl" />
            <h2 className="text-2xl font-bold text-neu-800">AI-Powered CRM</h2>
          </div>
          {CRM_FAQS.map((item) => (
            <FaqItem key={item.q} {...item} />
          ))}
        </section>

        <div
          className="rounded-neu-lg p-6 shadow-dark-neu-lg text-center"
          style={{ background: `linear-gradient(135deg, ${BRAND.blueDark}, ${BRAND.graphite})` }}
        >
          <h3 className="text-xl font-bold text-white mb-2">Still have a question?</h3>
          <p className="text-neu-300 mb-4 text-sm">Reach out and we will route it to the right team.</p>
          <Link
            to="/contact"
            className="inline-block px-6 py-3 rounded-neu-sm bg-accent-yellow text-dark-neu-400 font-bold text-sm shadow-neu-sm hover:shadow-neu transition-all"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
