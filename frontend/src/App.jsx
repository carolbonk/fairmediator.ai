import React, { useState } from 'react';
import ChatPanel from './components/ChatPanel';
import MediatorList from './components/MediatorList';
import Header from './components/Header';
import StatisticsPanel from './components/StatisticsPanel';

function App() {
  const [mediators, setMediators] = useState([]);
  const [filters, setFilters] = useState({
    ideology: 'all',
    affiliation: 'all'
  });
  const [parties, setParties] = useState([]);

  const handleChatResponse = (response) => {
    if (response.mediators) {
      setMediators(response.mediators);
    }
  };

  const filteredMediators = {
    liberal: mediators.filter(m => m.ideologyScore <= -1),
    conservative: mediators.filter(m => m.ideologyScore >= 1),
    neutral: mediators.filter(m => m.ideologyScore > -1 && m.ideologyScore < 1)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neu-100 via-neu-150 to-neu-200">
      <Header />
      
      {/* Neumorphism layout with generous spacing */}
      <main className="max-w-[1600px] mx-auto px-6 lg:px-8 py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6 h-[calc(100vh-140px)]">
          {/* Left Panel - Chat Interface with neumorphism */}
          <div className="card-neu overflow-hidden">
            <ChatPanel 
              onResponse={handleChatResponse}
              parties={parties}
              setParties={setParties}
            />
          </div>

          {/* Middle Panel - Mediator Lists with neumorphism */}
          <div className="card-neu overflow-hidden">
            <MediatorList
              liberal={filteredMediators.liberal}
              conservative={filteredMediators.conservative}
              neutral={filteredMediators.neutral}
              parties={parties}
            />
          </div>

          {/* Right Panel - Statistics & Filters */}
          <div className="h-full">
            <StatisticsPanel />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
