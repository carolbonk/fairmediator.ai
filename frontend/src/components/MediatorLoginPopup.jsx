import { useNavigate } from 'react-router-dom';
import { FaBriefcase, FaStore } from 'react-icons/fa';
import { trackEvent } from '../utils/analytics';

const Card = ({ icon, title, blurb, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex-1 bg-gray-50 rounded-2xl shadow-neumorphic hover:shadow-neumorphic-hover transition-all duration-200 p-6 text-left group"
  >
    <div className="w-11 h-11 rounded-xl bg-gray-100 shadow-neumorphic-inset flex items-center justify-center mb-4 text-slate-700">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-gray-800 mb-1.5 group-hover:text-slate-900">
      {title}
    </h3>
    <p className="text-sm text-gray-500 leading-relaxed">{blurb}</p>
  </button>
);

const MediatorLoginPopup = ({ open, onClose }) => {
  const navigate = useNavigate();

  if (!open) return null;

  const go = (destination, label) => {
    trackEvent('mediator_portal_choice', { destination: label });
    onClose?.();
    navigate(destination);
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-md z-[8999]"
        onClick={onClose}
      />
      <div className="fixed inset-0 flex items-center justify-center z-[9000] p-4">
        <div
          className="bg-gray-50 rounded-3xl shadow-neumorphic w-full max-w-2xl p-8 sm:p-10"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mediator-portal-title"
        >
          <div className="text-center mb-7">
            <h2
              id="mediator-portal-title"
              className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2"
            >
              Welcome back
            </h2>
            <p className="text-sm text-gray-500">
              Where would you like to go?
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Card
              icon={<FaBriefcase className="text-lg" />}
              title="Access CRM"
              blurb="Manage your practice — cases, contacts, and AI-assisted intake."
              onClick={() => go('/app/mediator/crm', 'crm')}
            />
            <Card
              icon={<FaStore className="text-lg" />}
              title="Access Marketplace"
              blurb="Manage your public profile and the listings that drive new referrals."
              onClick={() => go('/app/mediator/marketplace', 'marketplace')}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default MediatorLoginPopup;
