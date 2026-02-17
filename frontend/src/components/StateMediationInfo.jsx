import React, { useState, useEffect } from 'react';
import { FaBalanceScale } from 'react-icons/fa';

const StateMediationInfo = ({
  stateName,
  stateCode,
  mediationStatute,
  mediatorStandards,
  screeningCriteria = null,
  variant = 'primary',
  onDrawerOpen = null,
  className = '',
}) => {
  const [activeDrawer, setActiveDrawer] = useState(null);

  const handleOpenDrawer = (type) => {
    setActiveDrawer(type);
    if (onDrawerOpen) {
      onDrawerOpen(type);
    }
  };

  const handleCloseDrawer = () => {
    setActiveDrawer(null);
  };

  const getCopyText = () => {
    switch (variant) {
      case 'alternative-a':
        return `Mediation in ${stateName} is governed by state law and mediator qualifications.`;
      case 'alternative-b':
        return `${stateName} sets the rules for mediation and mediator qualifications—here's what applies to your case.`;
      case 'alternative-c':
        return `${stateName} law establishes mediation procedures and mediator requirements.`;
      default:
        return `In ${stateName}, courts define how mediation works and who can serve as a mediator.`;
    }
  };

  return (
    <>
      {/* Main Info Chip - Neomorphism Style */}
      <div
        className={`flex items-center gap-3 px-5 py-3 bg-neu-100 rounded-neu shadow-neu-inset text-sm text-neu-600 ${className}`}
        role="region"
        aria-label={`State mediation information for ${stateName}`}
      >
        {/* Icon */}
        <FaBalanceScale className="text-neu-500 flex-shrink-0" aria-hidden="true" />

        {/* Copy text */}
        <span className="flex-1 font-medium">{getCopyText()}</span>

        {/* CTA links */}
        <button
          onClick={() => handleOpenDrawer('mediation-law')}
          aria-label={`View ${stateName} mediation law`}
          className="text-liberal hover:text-liberal-dark underline font-medium transition-colors whitespace-nowrap"
        >
          View mediation law
        </button>

        <span className="text-neu-300" aria-hidden="true">
          ·
        </span>

        <button
          onClick={() => handleOpenDrawer('mediator-standards')}
          aria-label={`See ${stateName} mediator standards`}
          className="text-liberal hover:text-liberal-dark underline font-medium transition-colors whitespace-nowrap"
        >
          See mediator standards
        </button>
      </div>

      {/* Drawer: Mediation Law */}
      {activeDrawer === 'mediation-law' && (
        <Drawer
          title={`${stateName} Mediation Law`}
          citationLabel={mediationStatute.citationLabel}
          summary={mediationStatute.summary}
          fullDocumentUrl={mediationStatute.url}
          fullDocumentLabel="Read full statute"
          onClose={handleCloseDrawer}
        />
      )}

      {/* Drawer: Mediator Standards */}
      {activeDrawer === 'mediator-standards' && (
        <Drawer
          title={`${stateName} Mediator Qualification Standards`}
          citationLabel={mediatorStandards.citationLabel}
          summary={mediatorStandards.summary}
          fullDocumentUrl={mediatorStandards.url}
          fullDocumentLabel="View full requirements"
          onClose={handleCloseDrawer}
          screeningCriteria={screeningCriteria}
        />
      )}
    </>
  );
};

// Drawer component
const Drawer = ({
  title,
  citationLabel = null,
  summary,
  fullDocumentUrl,
  fullDocumentLabel,
  onClose,
  screeningCriteria = null,
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 z-40 animate-fade-in"
        aria-hidden="true"
      />

      {/* Drawer panel - Dark Blue Style */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[600px] max-w-[95vw] bg-dark-neu-300 shadow-2xl z-50 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 sm:px-8 py-4 sm:py-6 bg-dark-neu-300 border-b border-dark-neu-500 flex justify-between items-start">
          <div>
            <h2
              id="drawer-title"
              className="text-2xl font-semibold text-white"
            >
              {title}
            </h2>
            {citationLabel && (
              <span className="inline-block mt-3 px-4 py-2 bg-dark-neu-400 text-white text-sm rounded-full font-semibold border border-dark-neu-500">
                {citationLabel}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-dark-neu-400 text-white hover:bg-dark-neu-500 transition-all text-2xl border border-dark-neu-500"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-4 sm:px-8 py-4 sm:py-6 bg-dark-neu-300">
          <p className="text-white leading-relaxed text-base">
            {summary}
          </p>

          {/* Optional: Display screening criteria */}
          {screeningCriteria && (
            <div className="mt-8 p-6 bg-dark-neu-400/50 rounded-xl border border-dark-neu-500">
              <h3 className="text-lg font-semibold text-white mb-4">
                Key Requirements
              </h3>
              <ul className="space-y-3 text-base text-neu-200">
                {screeningCriteria.minTrainingHours && (
                  <li className="flex items-start gap-2">
                    <span className="text-white mt-0.5 font-bold">•</span>
                    <span>Minimum training: <strong className="text-white">{screeningCriteria.minTrainingHours} hours</strong></span>
                  </li>
                )}
                {screeningCriteria.requiresCourtRoster && (
                  <li className="flex items-start gap-2">
                    <span className="text-white mt-0.5 font-bold">•</span>
                    <span>Court roster membership required</span>
                  </li>
                )}
                {screeningCriteria.continuingEdHoursPerYear && (
                  <li className="flex items-start gap-2">
                    <span className="text-white mt-0.5 font-bold">•</span>
                    <span>Continuing education: <strong className="text-white">{screeningCriteria.continuingEdHoursPerYear} hours/year</strong></span>
                  </li>
                )}
                {screeningCriteria.backgroundCheckRequired && (
                  <li className="flex items-start gap-2">
                    <span className="text-white mt-0.5 font-bold">•</span>
                    <span>Background check required</span>
                  </li>
                )}
                {screeningCriteria.stateCertificationRequired && (
                  <li className="flex items-start gap-2">
                    <span className="text-white mt-0.5 font-bold">•</span>
                    <span>State certification required</span>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* CTA button - White button */}
          <a
            href={fullDocumentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-8 px-6 py-4 bg-white text-dark-neu-300 rounded-2xl text-base font-semibold transition-all shadow-lg hover:bg-slate-100"
          >
            {fullDocumentLabel} →
          </a>
        </div>
      </div>
    </>
  );
};

export default StateMediationInfo;
