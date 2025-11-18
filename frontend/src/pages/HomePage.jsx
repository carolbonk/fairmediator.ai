import { useState } from 'react';
import ChatPanel from '../components/ChatPanel';
import MediatorList from '../components/MediatorList';
import Header from '../components/Header';
import StatisticsPanel from '../components/StatisticsPanel';

const HomePage = () => {
  const [mediators, setMediators] = useState([]);
  const [filters, setFilters] = useState({
    ideology: 'all',
    affiliation: 'all'
  });
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
      setMediators(response.mediators);
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
    setFilters(prev => ({ ...prev, ideology }));
  };

  const filteredMediators = {
    liberal: mediators.filter(m => m.ideologyScore <= -1),
    conservative: mediators.filter(m => m.ideologyScore >= 1),
    neutral: mediators.filter(m => m.ideologyScore > -1 && m.ideologyScore < 1)
  };

  // Dynamic heights based on search state
  const chatHeight = hasSearched ? 'flex-[35]' : 'flex-[70]';
  const mediatorHeight = hasSearched ? 'flex-[65]' : 'flex-[30]';

  return (
    <div className="min-h-screen bg-gradient-to-br from-neu-100 via-neu-150 to-neu-200">
      <Header />

      {/* Neumorphism layout with generous spacing - 2 Column Design (60/40 split) */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-10">
        <div className="flex flex-col lg:grid lg:grid-cols-[60%_40%] gap-4 sm:gap-6 min-h-[calc(100vh-120px)] sm:min-h-[calc(100vh-140px)] lg:h-[calc(100vh-140px)]">
          {/* Left Column - Chat on top, Mediators below */}
          <div className="flex flex-col gap-4 sm:gap-6 lg:h-full lg:min-h-0">
            {/* Chat Panel - Dynamic height based on search state */}
            <div className={`card-neu lg:${chatHeight} min-h-[300px] sm:min-h-[350px] lg:min-h-0 transition-all duration-500 ease-in-out flex flex-col`}>
              <ChatPanel
                onResponse={handleChatResponse}
                parties={parties}
                setParties={setParties}
              />
            </div>

            {/* Mediator Lists - Dynamic height based on search state */}
            <div className={`card-neu lg:${mediatorHeight} min-h-[250px] sm:min-h-[300px] lg:min-h-0 transition-all duration-500 ease-in-out flex flex-col`}>
              <MediatorList
                liberal={filteredMediators.liberal}
                conservative={filteredMediators.conservative}
                neutral={filteredMediators.neutral}
                parties={parties}
              />
            </div>
          </div>

          {/* Right Column - Statistics & Filters */}
          <div className="min-h-[400px] lg:h-full lg:min-h-0 flex flex-col">
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
