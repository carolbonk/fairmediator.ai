import { useState } from 'react';
import PropTypes from 'prop-types';
import { FaTimes, FaEnvelope, FaPhone, FaMapMarkerAlt, FaExternalLinkAlt, FaGavel, FaBriefcase, FaFilePdf, FaSpinner, FaBalanceScale } from 'react-icons/fa';
import ConflictBadge from './ConflictBadge';
import LobbyingBadge from './LobbyingBadge';
import { downloadConflictReport } from '../services/api';

const MediatorDetailModal = ({ mediator, conflictRisk, onClose, onConflictClick }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  const handleDownloadReport = async () => {
    if (!mediator?._id) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      const blob = await downloadConflictReport(mediator._id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FairMediator-Report-${mediator.name?.replace(/\s+/g, '-') || 'mediator'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (!mediator) return null;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'experience', label: 'Experience' },
    { id: 'contact', label: 'Contact' }
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-[100]"
        onClick={onClose}
      />

      {/* Modal - Centered, scrollable */}
      <div className="fixed inset-0 z-[101] overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="relative w-full max-w-3xl bg-neu-100 rounded-2xl shadow-neu-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-dark-neu-300 rounded-t-2xl border-b border-dark-neu-500">
              <h2 className="text-2xl font-bold text-white">Mediator Profile</h2>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-10 h-10 bg-dark-neu-400 text-white rounded-xl shadow-dark-neu hover:shadow-dark-neu-inset transition-all border border-dark-neu-500"
                aria-label="Close modal"
              >
                <FaTimes />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Mediator Header */}
              <div className="mb-6 p-6 bg-neu-200 rounded-xl shadow-neu">
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {/* Profile Image Placeholder */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-neu flex items-center justify-center">
                      <span className="text-3xl font-bold text-white">
                        {mediator.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </span>
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-neu-800 mb-2">{mediator.name}</h3>

                    {mediator.title && (
                      <p className="text-neu-600 mb-2">{mediator.title}</p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-3">
                      {conflictRisk && (
                        <ConflictBadge
                          risk={conflictRisk}
                          onClick={onConflictClick}
                        />
                      )}

                      {mediator.lobbying && mediator.lobbying.totalFilings > 0 && (
                        <LobbyingBadge
                          totalFilings={mediator.lobbying.totalFilings}
                          totalAmount={mediator.lobbying.totalAmount}
                          onViewHistory={() => {/* Open lobbying history */}}
                        />
                      )}
                    </div>

                    {mediator.location_city && mediator.location_state && (
                      <div className="flex items-center gap-2 text-neu-600 mb-2">
                        <FaMapMarkerAlt className="text-blue-600" />
                        <span>{mediator.location_city}, {mediator.location_state}</span>
                      </div>
                    )}

                    {mediator.specializations && mediator.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {mediator.specializations.slice(0, 5).map((spec, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-neu-100 text-neu-700 text-sm rounded-lg shadow-neu-inset"
                          >
                            {spec}
                          </span>
                        ))}
                        {mediator.specializations.length > 5 && (
                          <span className="px-3 py-1 bg-neu-100 text-neu-600 text-sm rounded-lg shadow-neu-inset">
                            +{mediator.specializations.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-neu-200 shadow-neu-inset text-blue-600'
                        : 'bg-neu-200 shadow-neu text-neu-700 hover:shadow-neu-lg'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="bg-neu-200 rounded-xl shadow-neu p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-bold text-neu-800 mb-2 flex items-center gap-2">
                        <FaGavel className="text-blue-600" />
                        About
                      </h4>
                      {mediator.bio || mediator.description ? (
                        <p className="text-neu-600 leading-relaxed">
                          {mediator.bio || mediator.description}
                        </p>
                      ) : (
                        <p className="text-neu-500 italic">No bio available</p>
                      )}
                    </div>

                    {mediator.specializations && mediator.specializations.length > 0 && (
                      <div>
                        <h4 className="text-lg font-bold text-neu-800 mb-2">Areas of Practice</h4>
                        <div className="flex flex-wrap gap-2">
                          {mediator.specializations.map((spec, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-2 bg-neu-100 text-neu-700 rounded-lg shadow-neu-inset"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {mediator.certifications && mediator.certifications.length > 0 && (
                      <div>
                        <h4 className="text-lg font-bold text-neu-800 mb-2">Certifications</h4>
                        <ul className="space-y-2">
                          {mediator.certifications.map((cert, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-neu-600">
                              <span className="mt-1.5 w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0"></span>
                              <span>{cert}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'experience' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-neu-800 mb-2 flex items-center gap-2">
                      <FaBriefcase className="text-blue-600" />
                      Professional Experience
                    </h4>

                    {mediator.yearsExperience && (
                      <div className="p-4 bg-neu-100 rounded-xl shadow-neu-inset">
                        <div className="text-sm text-neu-600 mb-1">Years of Experience</div>
                        <div className="text-2xl font-bold text-neu-800">{mediator.yearsExperience}+</div>
                      </div>
                    )}

                    {mediator.caseTypes && mediator.caseTypes.length > 0 && (
                      <div>
                        <h5 className="font-semibold text-neu-800 mb-2">Case Types Handled</h5>
                        <div className="space-y-2">
                          {mediator.caseTypes.map((caseType, idx) => (
                            <div key={idx} className="p-3 bg-neu-100 rounded-lg shadow-neu-inset">
                              <div className="font-medium text-neu-700">{caseType.type}</div>
                              {caseType.count && (
                                <div className="text-sm text-neu-600">{caseType.count} cases</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!mediator.yearsExperience && (!mediator.caseTypes || mediator.caseTypes.length === 0) && (
                      <p className="text-neu-500 italic">Experience information not available</p>
                    )}
                  </div>
                )}

                {activeTab === 'contact' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-neu-800 mb-2">Contact Information</h4>

                    {mediator.email && (
                      <a
                        href={`mailto:${mediator.email}`}
                        className="flex items-center gap-3 p-4 bg-neu-100 rounded-xl shadow-neu-inset hover:shadow-neu transition-all"
                      >
                        <FaEnvelope className="text-blue-600 text-xl" />
                        <div>
                          <div className="text-sm text-neu-600">Email</div>
                          <div className="font-medium text-neu-800">{mediator.email}</div>
                        </div>
                      </a>
                    )}

                    {mediator.phone && (
                      <a
                        href={`tel:${mediator.phone}`}
                        className="flex items-center gap-3 p-4 bg-neu-100 rounded-xl shadow-neu-inset hover:shadow-neu transition-all"
                      >
                        <FaPhone className="text-blue-600 text-xl" />
                        <div>
                          <div className="text-sm text-neu-600">Phone</div>
                          <div className="font-medium text-neu-800">{mediator.phone}</div>
                        </div>
                      </a>
                    )}

                    {mediator.website && (
                      <a
                        href={mediator.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-neu-100 rounded-xl shadow-neu-inset hover:shadow-neu transition-all"
                      >
                        <FaExternalLinkAlt className="text-blue-600 text-xl" />
                        <div>
                          <div className="text-sm text-neu-600">Website</div>
                          <div className="font-medium text-neu-800">{mediator.website}</div>
                        </div>
                      </a>
                    )}

                    {!mediator.email && !mediator.phone && !mediator.website && (
                      <p className="text-neu-500 italic">Contact information not available</p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  className="flex-1 px-6 py-3 bg-dark-neu-400 text-white font-semibold rounded-xl shadow-dark-neu hover:shadow-dark-neu-lg transition-all border border-dark-neu-500 min-h-[44px]"
                  onClick={() => {
                    // TODO: Implement scheduling
                    alert('Schedule mediation feature coming soon!');
                  }}
                >
                  Schedule Mediation
                </button>

                <a
                  href={`/compare?ids=${mediator?._id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-dark-neu-400 text-white font-semibold rounded-xl shadow-dark-neu hover:shadow-dark-neu-lg transition-all border border-dark-neu-500 min-h-[44px] text-center"
                  aria-label={`Compare ${mediator?.name} with others`}
                >
                  <FaBalanceScale aria-hidden="true" /> Compare
                </a>

                <button
                  onClick={handleDownloadReport}
                  disabled={downloading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-dark-neu-400 text-white font-semibold rounded-xl shadow-dark-neu hover:shadow-dark-neu-lg active:shadow-dark-neu-inset transition-all border border-dark-neu-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                  aria-label="Download PDF conflict report"
                >
                  {downloading ? (
                    <><FaSpinner className="animate-spin" aria-hidden="true" /> Generating...</>
                  ) : (
                    <><FaFilePdf aria-hidden="true" /> Download Report</>
                  )}
                </button>

                <button
                  className="flex-1 px-6 py-3 bg-neu-200 text-neu-800 font-semibold rounded-xl shadow-neu hover:shadow-neu-lg transition-all min-h-[44px]"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>

              {/* Download error */}
              {downloadError && (
                <p className="mt-2 text-xs text-red-400 text-center" role="alert">{downloadError}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

MediatorDetailModal.propTypes = {
  mediator: PropTypes.object,
  conflictRisk: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onConflictClick: PropTypes.func
};

export default MediatorDetailModal;
