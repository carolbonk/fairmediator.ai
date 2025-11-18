import React, { useState, useEffect } from 'react';
import MediatorCard from './MediatorCard';
import Tooltip from './Tooltip';
import { checkAffiliationsQuick } from '../services/api';

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

const MediatorList = ({ liberal, conservative, neutral, parties }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [affiliationFlags, setAffiliationFlags] = useState({});
  const [loading, setLoading] = useState(false);
  const [lowBudget, setLowBudget] = useState(false);
  const [selectedState, setSelectedState] = useState('all');
  const [showStateDropdown, setShowStateDropdown] = useState(false);

  // Check affiliations when parties change
  useEffect(() => {
    if (parties.length > 0) {
      checkAffiliations();
    }
  }, [parties, liberal, conservative, neutral]);

  const checkAffiliations = async () => {
    setLoading(true);
    try {
      const allMediators = [...liberal, ...conservative, ...neutral];
      if (allMediators.length === 0) return;
      
      const mediatorIds = allMediators.map(m => m._id);
      const results = await checkAffiliationsQuick(mediatorIds, parties);
      
      const flagMap = {};
      results.data.forEach(result => {
        flagMap[result.mediatorId] = result.flag;
      });
      
      setAffiliationFlags(flagMap);
    } catch (error) {
      console.error('Affiliation check error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const applyFilters = (mediators) => {
    let filtered = [...mediators];

    // Filter by state
    if (selectedState !== 'all') {
      filtered = filtered.filter(m => m.location?.state === selectedState);
    }

    // Filter by budget (assume mediators have a hourlyRate property)
    if (lowBudget) {
      filtered = filtered.filter(m => !m.hourlyRate || m.hourlyRate <= 300);
    }

    return filtered;
  };

  const renderList = (mediators, title, color) => {
    const filteredMediators = applyFilters(mediators);

    if (filteredMediators.length === 0) {
      return (
        <div className="text-center py-8 text-gray-400">
          <p>No {title.toLowerCase()} mediators found</p>
          {(selectedState !== 'all' || lowBudget) && (
            <p className="text-xs mt-2">Try adjusting your filters</p>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {filteredMediators.map(mediator => (
          <MediatorCard
            key={mediator._id}
            mediator={mediator}
            affiliationFlag={affiliationFlags[mediator._id]}
          />
        ))}
      </div>
    );
  };

  const allMediators = [...liberal, ...conservative, ...neutral];
  const filteredAllCount = applyFilters(allMediators).length;
  const filteredLiberalCount = applyFilters(liberal).length;
  const filteredNeutralCount = applyFilters(neutral).length;
  const filteredConservativeCount = applyFilters(conservative).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header with Filters - Neumorphism */}
      <div className="border-b border-neu-200 px-6 py-5 bg-neu-100">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-semibold text-neu-800">
            Mediator Suggestions
            <span className="ml-2 text-base font-medium text-neu-600">
              ({filteredAllCount})
            </span>
          </h2>
          <Tooltip text="AI-powered suggestions based on your case details, party affiliations, and mediator ideology. Results prioritize neutral options and flag potential conflicts of interest. This is an estimation." />
        </div>

        {/* Filters Row - All in one line */}
        <div className="flex items-center gap-3">
          {/* State Selector - Custom Neumorphism Dropdown */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-neu bg-neu-100">
            <label className="text-xs font-semibold text-neu-700 whitespace-nowrap flex items-center gap-1">
              State
              <Tooltip text="Filter mediators by location. Select a specific state to find mediators practicing in that jurisdiction." position="top" />
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowStateDropdown(!showStateDropdown)}
                className="flex items-center gap-2 bg-transparent text-xs font-medium text-neu-800 cursor-pointer focus:outline-none border-0 pr-1 pl-1"
              >
                <span>{selectedState === 'all' ? 'All' : selectedState}</span>
                <svg className={`w-3 h-3 text-neu-600 transition-transform ${showStateDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Custom Dropdown Menu */}
              {showStateDropdown && (
                <>
                  {/* Backdrop to close dropdown */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowStateDropdown(false)}
                  />

                  {/* Dropdown Menu */}
                  <div className="absolute top-full mt-2 left-0 w-48 max-h-64 overflow-y-auto bg-neu-100 rounded-xl shadow-neu-lg border border-neu-200 z-20 animate-fade-in">
                    <button
                      onClick={() => {
                        setSelectedState('all');
                        setShowStateDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-medium transition-all ${
                        selectedState === 'all'
                          ? 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-800 shadow-neu-inset'
                          : 'text-neu-700 hover:bg-neu-200'
                      }`}
                    >
                      All States
                    </button>
                    {US_STATES.map(state => (
                      <button
                        key={state}
                        onClick={() => {
                          setSelectedState(state);
                          setShowStateDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-medium transition-all ${
                          selectedState === state
                            ? 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-800 shadow-neu-inset'
                            : 'text-neu-700 hover:bg-neu-200'
                        }`}
                      >
                        {state}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Low Budget Toggle - Compact */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-neu bg-neu-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs font-semibold text-neu-700 whitespace-nowrap">Low Budget</span>
              <Tooltip text="Filters for mediators with hourly rates under $300. Budget-friendly options for cost-conscious clients." position="top" />
              <button
                type="button"
                onClick={() => setLowBudget(!lowBudget)}
                className={`relative w-10 h-5 rounded-full transition-all duration-300 ${
                  lowBudget
                    ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-neu'
                    : 'bg-neu-200 shadow-neu-inset'
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-all duration-300 ${
                    lowBudget
                      ? 'translate-x-5 bg-white shadow-neu-lg'
                      : 'translate-x-0 bg-gradient-to-br from-neu-100 to-neu-50 shadow-neu'
                  }`}
                />
              </button>
            </label>
          </div>

          {/* Ideology Tabs - Compact */}
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
              activeTab === 'all'
                ? 'shadow-neu-inset bg-neu-200 text-neu-800'
                : 'shadow-neu bg-neu-100 text-neu-600 hover:shadow-neu-lg'
            }`}
          >
            All <span className="ml-1 opacity-75">({filteredAllCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('liberal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
              activeTab === 'liberal'
                ? 'shadow-neu-inset bg-gradient-to-br from-blue-100 to-blue-200 text-blue-800'
                : 'shadow-neu bg-neu-100 text-neu-600 hover:shadow-neu-lg'
            }`}
          >
            Liberal <span className="ml-1 opacity-75">({filteredLiberalCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('neutral')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
              activeTab === 'neutral'
                ? 'shadow-neu-inset bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800'
                : 'shadow-neu bg-neu-100 text-neu-600 hover:shadow-neu-lg'
            }`}
          >
            Neutral <span className="ml-1 opacity-75">({filteredNeutralCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('conservative')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
              activeTab === 'conservative'
                ? 'shadow-neu-inset bg-gradient-to-br from-red-100 to-red-200 text-red-800'
                : 'shadow-neu bg-neu-100 text-neu-600 hover:shadow-neu-lg'
            }`}
          >
            Conservative <span className="ml-1 opacity-75">({filteredConservativeCount})</span>
          </button>
        </div>
      </div>

      {/* Mediator Lists - Neumorphism */}
      <div className="flex-1 px-6 py-6 flex flex-col">
        {loading && (
          <div className="text-center py-8 text-sm text-neu-600 font-medium">
            Checking affiliations...
          </div>
        )}
        
        {activeTab === 'all' && (
          <div className="space-y-8">
            {liberal.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2 uppercase tracking-wide">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-neu-sm"></div>
                  Liberal Leaning
                </h3>
                {renderList(liberal, 'Liberal', 'blue')}
              </div>
            )}
            
            {neutral.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2 uppercase tracking-wide">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 shadow-neu-sm"></div>
                  Neutral / Centrist
                </h3>
                {renderList(neutral, 'Neutral', 'gray')}
              </div>
            )}
            
            {conservative.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2 uppercase tracking-wide">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-neu-sm"></div>
                  Conservative Leaning
                </h3>
                {renderList(conservative, 'Conservative', 'red')}
              </div>
            )}
            
            {allMediators.length === 0 && (
              <div className="text-center py-20 text-neu-400">
                <p className="text-lg font-medium text-neu-600">No mediators found</p>
                <p className="text-sm mt-2 text-neu-500">Try describing your needs in the chat</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'liberal' && renderList(liberal, 'Liberal', 'blue')}
        {activeTab === 'neutral' && renderList(neutral, 'Neutral', 'gray')}
        {activeTab === 'conservative' && renderList(conservative, 'Conservative', 'red')}
      </div>
    </div>
  );
};

export default MediatorList;
