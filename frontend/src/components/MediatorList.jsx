import React, { useState, useEffect } from 'react';
import MediatorCard from './MediatorCard';
import { checkAffiliationsQuick } from '../services/api';

const MediatorList = ({ liberal, conservative, neutral, parties }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [affiliationFlags, setAffiliationFlags] = useState({});
  const [loading, setLoading] = useState(false);

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

  const renderList = (mediators, title, color) => {
    if (mediators.length === 0) {
      return (
        <div className="text-center py-8 text-gray-400">
          <p>No {title.toLowerCase()} mediators found</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {mediators.map(mediator => (
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

  return (
    <div className="flex flex-col h-full">
      {/* Header with Tabs - Neumorphism */}
      <div className="border-b border-neu-200 px-6 py-5 bg-neu-100">
        <h2 className="text-xl font-semibold text-neu-800 mb-4">
          Mediator Results
          <span className="ml-2 text-base font-medium text-neu-600">
            ({allMediators.length})
          </span>
        </h2>
        
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === 'all'
                ? 'shadow-neu-inset bg-neu-200 text-neu-800'
                : 'shadow-neu bg-neu-100 text-neu-600 hover:shadow-neu-lg'
            }`}
          >
            All <span className="ml-1 opacity-75">({allMediators.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('liberal')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === 'liberal'
                ? 'shadow-neu-inset bg-gradient-to-br from-blue-100 to-blue-200 text-blue-800'
                : 'shadow-neu bg-neu-100 text-neu-600 hover:shadow-neu-lg'
            }`}
          >
            Liberal <span className="ml-1 opacity-75">({liberal.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('neutral')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === 'neutral'
                ? 'shadow-neu-inset bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800'
                : 'shadow-neu bg-neu-100 text-neu-600 hover:shadow-neu-lg'
            }`}
          >
            Neutral <span className="ml-1 opacity-75">({neutral.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('conservative')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === 'conservative'
                ? 'shadow-neu-inset bg-gradient-to-br from-red-100 to-red-200 text-red-800'
                : 'shadow-neu bg-neu-100 text-neu-600 hover:shadow-neu-lg'
            }`}
          >
            Conservative <span className="ml-1 opacity-75">({conservative.length})</span>
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
