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

      {/* Drawer panel - Neomorphism Style */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="fixed right-0 top-0 bottom-0 w-[500px] max-w-[90vw] bg-neu-100 shadow-neu-xl z-50 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-neu-100 border-b border-neu-200 flex justify-between items-start">
          <div>
            <h2
              id="drawer-title"
              className="text-lg font-semibold text-neu-800"
            >
              {title}
            </h2>
            {citationLabel && (
              <span className="inline-block mt-2 px-3 py-1.5 bg-neu-200 text-neu-700 text-xs rounded-full font-semibold shadow-neu-inset-sm">
                {citationLabel}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-neu-100 text-neu-500 hover:text-neu-700 hover:shadow-neu-sm transition-all text-xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 py-5 bg-neu-100">
          <p className="text-neu-700 leading-relaxed text-[15px]">
            {summary}
          </p>

          {/* Optional: Display screening criteria */}
          {screeningCriteria && (
            <div className="mt-6 p-4 bg-neu-100 rounded-neu shadow-neu-inset">
              <h3 className="text-sm font-semibold text-neu-800 mb-3">
                Key Requirements
              </h3>
              <ul className="space-y-2.5 text-sm text-neu-700">
                {screeningCriteria.minTrainingHours && (
                  <li className="flex items-start gap-2">
                    <span className="text-liberal mt-0.5 font-bold">•</span>
                    <span>Minimum training: <strong className="text-neu-800">{screeningCriteria.minTrainingHours} hours</strong></span>
                  </li>
                )}
                {screeningCriteria.requiresCourtRoster && (
                  <li className="flex items-start gap-2">
                    <span className="text-liberal mt-0.5 font-bold">•</span>
                    <span>Court roster membership required</span>
                  </li>
                )}
                {screeningCriteria.continuingEdHoursPerYear && (
                  <li className="flex items-start gap-2">
                    <span className="text-liberal mt-0.5 font-bold">•</span>
                    <span>Continuing education: <strong className="text-neu-800">{screeningCriteria.continuingEdHoursPerYear} hours/year</strong></span>
                  </li>
                )}
                {screeningCriteria.backgroundCheckRequired && (
                  <li className="flex items-start gap-2">
                    <span className="text-liberal mt-0.5 font-bold">•</span>
                    <span>Background check required</span>
                  </li>
                )}
                {screeningCriteria.stateCertificationRequired && (
                  <li className="flex items-start gap-2">
                    <span className="text-liberal mt-0.5 font-bold">•</span>
                    <span>State certification required</span>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* CTA button - Neomorphism style */}
          <a
            href={fullDocumentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-6 px-5 py-3 bg-gradient-to-br from-liberal-light to-liberal text-white rounded-neu text-sm font-medium transition-all shadow-neu hover:shadow-neu-lg"
          >
            {fullDocumentLabel} →
          </a>
        </div>
      </div>
    </>
  );
};

export default StateMediationInfo;
