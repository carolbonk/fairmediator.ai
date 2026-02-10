import { useState } from 'react';
import { FaComments, FaFileAlt } from 'react-icons/fa';
import ChatPanel from '../components/ChatPanel';
import MediatorList from '../components/MediatorList';
import CaseIntakeForm from '../components/CaseIntakeForm';
import Header from '../components/Header';
import StatisticsPanel from '../components/StatisticsPanel';
import Footer from '../components/Footer';
import WelcomePopup from '../components/WelcomePopup';
import Onboarding from '../components/Onboarding';
import StateMediationInfo from '../components/StateMediationInfo';
import { getStateMediationData } from '../data/stateMediationData';

const HomePage = () => {
  const [parties, setParties] = useState([]);
  const [startOnboarding, setStartOnboarding] = useState(false);
  const [userStateCode, setUserStateCode] = useState('FL'); // Default to Florida, could come from user profile
  const [inputMode, setInputMode] = useState('chat'); // 'chat' or 'form'
  const [caseData, setCaseData] = useState({
    political: {
      liberal: 35,
      conservative: 25,
      neutral: 40
    },
    baseConflictRisk: 15,
    emotion: 'neutral'
  });

  // Get state mediation data based on user's state
  const stateMediationInfo = getStateMediationData(userStateCode);

  const handleChatResponse = (response) => {
    // Update case data from chat analysis
    if (response.caseAnalysis) {
      setCaseData(prev => ({
        ...prev,
        ...response.caseAnalysis
      }));
    }
  };

  const handleIdeologyChange = (ideology) => {
    // Can be used for future features
    console.log('Ideology changed:', ideology);
  };

  const handleDocumentAnalysis = (analysis) => {
    // Update case data based on document analysis
    if (analysis) {
      setCaseData(prev => ({
        ...prev,
        caseType: analysis.caseType,
        jurisdiction: analysis.jurisdiction,
        opposingParties: analysis.opposingParties,
        sentiment: analysis.sentiment
      }));

      // Update parties list if opposing parties found
      if (analysis.opposingParties && analysis.opposingParties.length > 0) {
        setParties(analysis.opposingParties);
      }
    }
  };

  const handleCaseIntakeSubmit = (intakeData) => {
    // Update parties from intake form
    setParties(intakeData.parties);

    // Update case data
    setCaseData(prev => ({
      ...prev,
      caseType: intakeData.caseType,
      jurisdiction: intakeData.jurisdiction,
      description: intakeData.description,
      disputeValue: intakeData.disputeValue,
      prediction: intakeData.prediction
    }));
  };

  const handleSearchMediatorsFromForm = (searchData) => {
    // Update parties and case data, then scroll to mediator list
    handleCaseIntakeSubmit(searchData);

    // Scroll to mediator list
    setTimeout(() => {
      const mediatorSection = document.getElementById('mediator-list-section');
      if (mediatorSection) {
        mediatorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neu-100 via-neu-150 to-neu-200 flex flex-col">
      <WelcomePopup onClose={() => setStartOnboarding(true)} />
      <Onboarding shouldStart={startOnboarding} onComplete={() => setStartOnboarding(false)} />
      <Header />

      {/* Responsive layout - content flows naturally with page scroll */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 flex-grow">
        <div className="flex flex-col lg:grid lg:grid-cols-[3fr_2fr] gap-4 sm:gap-6">
          {/* Left Column - Chat and Mediators stack */}
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* State Mediation Info Chip - At Top (Hidden on Mobile) */}
            <div className="hidden md:block">
              <StateMediationInfo
                stateName={stateMediationInfo.stateName}
                stateCode={stateMediationInfo.stateCode}
                mediationStatute={stateMediationInfo.mediationStatute}
                mediatorStandards={stateMediationInfo.mediatorStandards}
                screeningCriteria={stateMediationInfo.screeningCriteria}
                variant="primary"
                onDrawerOpen={(type) => {
                  console.log(`User opened ${type} drawer for ${stateMediationInfo.stateName}`);
                  // TODO: Add analytics tracking here
                }}
              />
            </div>

            {/* Describe Your Legal Dispute Section */}
            <div>
              <h2 className="text-2xl font-bold text-neu-800 mb-4">Describe your legal dispute</h2>

              {/* Input Mode Toggle */}
              <div className="bg-neu-200 rounded-2xl p-4 shadow-[8px_8px_16px_rgba(163,177,198,0.6),-8px_-8px_16px_rgba(255,255,255,0.5)]">
                <div className="text-center mb-3">
                  <p className="text-neu-600 text-xs">
                    Choose how you'd like to describe your case.{' '}
                    <span className="font-medium">Chat</span> for conversational analysis or{' '}
                    <span className="font-medium">Form</span> for structured input.
                  </p>
                </div>
                <div className="inline-flex gap-2 w-full">
                  <button
                    onClick={() => setInputMode('chat')}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-medium text-xs transition-all duration-200 flex-1 ${
                      inputMode === 'chat'
                        ? 'bg-gradient-to-r from-slate-600 to-slate-800 text-white shadow-neu'
                        : 'bg-neu-200 text-neu-700 shadow-neu hover:shadow-neu-lg'
                    }`}
                  >
                    <FaComments className="text-sm" />
                    <span>Chat Mode</span>
                  </button>
                  <button
                    onClick={() => setInputMode('form')}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-medium text-xs transition-all duration-200 flex-1 ${
                      inputMode === 'form'
                        ? 'bg-gradient-to-r from-slate-600 to-slate-800 text-white shadow-neu'
                        : 'bg-neu-200 text-neu-700 shadow-neu hover:shadow-neu-lg'
                    }`}
                  >
                    <FaFileAlt className="text-sm" />
                    <span>Form Mode</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Chat Panel or Case Intake Form */}
            {inputMode === 'chat' ? (
              <div className="card-neu">
                <h3 className="text-xl font-semibold text-neu-800 mb-1 px-3 pt-3 text-center">AI Chat Assistant</h3>
                <ChatPanel
                  onResponse={handleChatResponse}
                  parties={parties}
                  setParties={setParties}
                  onDocumentAnalysis={handleDocumentAnalysis}
                />
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-semibold text-neu-800 mb-1 text-center">Case Intake Form</h3>
                <CaseIntakeForm
                  onSubmit={handleCaseIntakeSubmit}
                  onSearchMediators={handleSearchMediatorsFromForm}
                />
              </div>
            )}

            {/* Mediator Lists */}
            <div id="mediator-list-section" className="card-neu">
              <MediatorList
                parties={parties}
              />
            </div>
          </div>

          {/* Right Column - Statistics Panel */}
          <div className="lg:sticky lg:top-4 lg:self-start">
            <StatisticsPanel
              caseData={caseData}
              onIdeologyChange={handleIdeologyChange}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
