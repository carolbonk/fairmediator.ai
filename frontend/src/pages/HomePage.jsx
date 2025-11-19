import { useState } from 'react';
import ChatPanel from '../components/ChatPanel';
import MediatorList from '../components/MediatorList';
import Header from '../components/Header';
import StatisticsPanel from '../components/StatisticsPanel';

const HomePage = () => {
  const [parties, setParties] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [caseData, setCaseData] = useState({
    political: {
      liberal: 35,
      conservative: 25,
      neutral: 40
    },
    baseConflictRisk: 15,
    emotion: 'neutral'
  });

  const handleChatResponse = (response) => {
    if (response.mediators) {
      setHasSearched(true);
    }

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

  // Dynamic heights based on search state - Give more space to chat
  const chatHeight = hasSearched ? 'flex-[60]' : 'flex-[70]';
  const mediatorHeight = hasSearched ? 'flex-[40]' : 'flex-[30]';

  return (
    <div className="min-h-screen bg-gradient-to-br from-neu-100 via-neu-150 to-neu-200 overflow-x-hidden">
      <Header />

      {/* Neumorphism layout with generous spacing - 2 Column Design (60/40 split) */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-10 overflow-x-hidden">
        <div className="flex flex-col lg:grid lg:grid-cols-[60%_40%] gap-4 sm:gap-6 min-h-[calc(100vh-120px)] sm:min-h-[calc(100vh-140px)] lg:h-[calc(100vh-140px)] overflow-x-hidden">
          {/* Left Column - Chat on top, Mediators below */}
          <div className="flex flex-col gap-4 sm:gap-6 lg:h-full lg:min-h-0 overflow-x-hidden">
            {/* Chat Panel - Dynamic height based on search state */}
            <div className={`card-neu lg:${chatHeight} min-h-[300px] sm:min-h-[350px] lg:min-h-0 transition-all duration-500 ease-in-out flex flex-col overflow-hidden`}>
              <ChatPanel
                onResponse={handleChatResponse}
                parties={parties}
                setParties={setParties}
                onDocumentAnalysis={handleDocumentAnalysis}
              />
            </div>

            {/* Mediator Lists - Dynamic height based on search state */}
            <div className={`card-neu lg:${mediatorHeight} min-h-[250px] sm:min-h-[300px] lg:min-h-0 transition-all duration-500 ease-in-out flex flex-col overflow-hidden`}>
              <MediatorList
                parties={parties}
              />
            </div>
          </div>

          {/* Right Column - Statistics Panel (with integrated Bulk Conflict Checker) */}
          <div className="min-h-[400px] lg:h-full lg:min-h-0 overflow-y-auto">
            <StatisticsPanel
              caseData={caseData}
              onIdeologyChange={handleIdeologyChange}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
