import React, { useState, useEffect } from 'react';
import Tooltip from './Tooltip';
import { checkAffiliationsQuick, trackMediatorSelection } from '../services/api';
import { MOCK_MEDIATORS, categorizeMediatorsByIdeology } from '../data/mockMediators';
import { FaStar, FaStarHalfAlt, FaMapMarkerAlt, FaBriefcase, FaDollarSign } from 'react-icons/fa';

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

// Star Rating Component (Uber/Google-style with logo colors)
const StarRating = ({ rating, totalMediations }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-bold text-neu-800">{rating.toFixed(1)}</span>
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <FaStar key={`full-${i}`} className="text-[#3B82F6] text-[10px]" />
        ))}
        {hasHalfStar && <FaStarHalfAlt className="text-[#3B82F6] text-[10px]" />}
        {[...Array(emptyStars)].map((_, i) => (
          <FaStar key={`empty-${i}`} className="text-gray-300 text-[10px]" />
        ))}
      </div>
      <span className="text-[10px] text-neu-500">({totalMediations})</span>
    </div>
  );
};

const MediatorList = ({ parties }) => {
  const [activeTab, setActiveTab] = useState('moderated');
  const [affiliationFlags, setAffiliationFlags] = useState({});
  const [loading, setLoading] = useState(false);
  const [lowBudget, setLowBudget] = useState(false);
  const [selectedState, setSelectedState] = useState('all');
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [modalPage, setModalPage] = useState(1);
  const [selectedMediator, setSelectedMediator] = useState(null);
  const [showMediatorDetail, setShowMediatorDetail] = useState(false);
  const ITEMS_PER_PAGE = 3;

  // Get mediators from mock data
  const allMockMediators = MOCK_MEDIATORS;
  const categorized = categorizeMediatorsByIdeology(allMockMediators);
  const liberal = categorized.liberal;
  const conservative = categorized.conservative;
  const moderated = categorized.moderated;

  // Check affiliations when parties change
  useEffect(() => {
    if (parties.length > 0) {
      checkAffiliations();
    }
  }, [parties, liberal, conservative, moderated]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedState, lowBudget]);

  const checkAffiliations = async () => {
    setLoading(true);
    try {
      const allMediators = [...liberal, ...conservative, ...moderated];
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
      // Sort by hourly rate (lowest first) when low budget is enabled
      filtered.sort((a, b) => {
        const rateA = a.hourlyRate || 0;
        const rateB = b.hourlyRate || 0;
        return rateA - rateB;
      });
    }

    return filtered;
  };

  // Track mediator selection for AI learning
  const trackSelection = async (mediator, action) => {
    try {
      await trackMediatorSelection({
        mediatorId: mediator._id,
        action,
        ideologyDetected: activeTab,
        partiesInvolved: parties
      });
    } catch (error) {
      console.error('Tracking error:', error);
      // Fail silently - don't disrupt user experience
    }
  };

  const renderList = (mediators, title) => {
    const filteredMediators = applyFilters(mediators);

    // Pagination
    const totalPages = Math.ceil(filteredMediators.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedMediators = filteredMediators.slice(startIndex, endIndex);

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
      <>
        <div className="space-y-2 flex-1 overflow-x-hidden">
          {paginatedMediators.map(mediator => (
            <div
              key={mediator._id}
              onClick={() => {
                trackSelection(mediator, 'clicked');
                setSelectedMediator(mediator);
                setShowMediatorDetail(true);
              }}
              className="bg-neu-200 rounded-lg p-3 shadow-neu hover:shadow-neu-lg transition-all duration-200 border border-neu-300 w-full cursor-pointer">
              <div className="flex items-center justify-between gap-2 w-full">
                <div className="flex-1 min-w-0 overflow-hidden">
                  {/* Name and Rating on same line */}
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="text-sm font-semibold text-neu-800 truncate flex-shrink-0">{mediator.name}</h4>
                    <div className="flex-shrink-0">
                      <StarRating rating={mediator.rating} totalMediations={mediator.totalMediations} />
                    </div>
                  </div>

                  {/* Location, Experience, Price in compact row */}
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-neu-600 mb-1">
                    {mediator.location && (
                      <span className="flex items-center gap-1 flex-shrink-0">
                        <FaMapMarkerAlt className="text-neu-400 text-[9px]" />
                        {mediator.location.city}, {mediator.location.state}
                      </span>
                    )}
                    {mediator.yearsExperience && (
                      <span className="flex items-center gap-1 flex-shrink-0">
                        <FaBriefcase className="text-neu-400 text-[9px]" />
                        {mediator.yearsExperience}y
                      </span>
                    )}
                    {mediator.hourlyRate && (
                      <span className="flex items-center gap-1 flex-shrink-0">
                        <FaDollarSign className="text-neu-400 text-[9px]" />
                        ${mediator.hourlyRate}/hr
                      </span>
                    )}
                  </div>

                  {/* Practice Areas - compact */}
                  {mediator.practiceAreas && mediator.practiceAreas.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {mediator.practiceAreas.slice(0, 3).map((area, i) => (
                        <span key={i} className="px-1.5 py-0.5 text-[9px] bg-neu-300 text-neu-700 rounded-md flex-shrink-0">
                          {area}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ideology Badge - compact */}
                {mediator.ideologyScore !== undefined && (
                  <div className={`px-2 py-1 text-[9px] font-semibold rounded-md whitespace-nowrap flex-shrink-0 ${
                    mediator.ideologyScore <= -1 ? 'bg-blue-100 text-blue-700' :
                    mediator.ideologyScore >= 1 ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {mediator.ideologyScore <= -1 ? 'Liberal' :
                     mediator.ideologyScore >= 1 ? 'Conservative' :
                     'Moderated'}
                  </div>
                )}
              </div>

              {/* Affiliation Flag */}
              {affiliationFlags[mediator._id] && (
                <div className="mt-2 pt-2 border-t border-neu-300">
                  <div className="flex items-center gap-1.5 text-[9px] flex-wrap">
                    <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded-md font-semibold flex-shrink-0">
                      ⚠️ Conflict
                    </span>
                    <span className="text-neu-600 flex-shrink-0">Check affiliations</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination Controls - Opens Modal */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-neu-200">
            <button
              onClick={() => {
                setModalPage(Math.max(1, currentPage - 1));
                setShowModal(true);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium shadow-neu bg-neu-100 text-neu-700 hover:shadow-neu-lg transition-all"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setModalPage(i + 1);
                    setShowModal(true);
                  }}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                    currentPage === i + 1
                      ? 'shadow-neu-inset bg-neu-200 text-neu-800'
                      : 'shadow-neu bg-neu-100 text-neu-600 hover:shadow-neu-lg'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setModalPage(Math.min(totalPages, currentPage + 1));
                setShowModal(true);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium shadow-neu bg-neu-100 text-neu-700 hover:shadow-neu-lg transition-all"
            >
              Next
            </button>
          </div>
        )}
      </>
    );
  };

  const filteredLiberalCount = applyFilters(liberal).length;
  const filteredModeratedCount = applyFilters(moderated).length;
  const filteredConservativeCount = applyFilters(conservative).length;
  const totalCount = filteredLiberalCount + filteredModeratedCount + filteredConservativeCount;

  return (
    <div className="flex flex-col h-full">
      {/* Header with Filters - Neumorphism */}
      <div className="border-b border-neu-200 px-6 py-5 bg-neu-100">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-semibold text-neu-800">
            Mediator Suggestions
            <span className="ml-2 text-base font-medium text-neu-600">
              ({totalCount})
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

          {/* Ideology Tabs - Compact (No All option) */}
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
            onClick={() => setActiveTab('moderated')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
              activeTab === 'moderated'
                ? 'shadow-neu-inset bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800'
                : 'shadow-neu bg-neu-100 text-neu-600 hover:shadow-neu-lg'
            }`}
          >
            Moderated <span className="ml-1 opacity-75">({filteredModeratedCount})</span>
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
      <div className="flex-1 px-6 py-6 flex flex-col overflow-hidden">
        {loading && (
          <div className="text-center py-8 text-sm text-neu-600 font-medium">
            Checking affiliations...
          </div>
        )}

        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
          {activeTab === 'liberal' && <div className="flex-1 flex flex-col overflow-x-hidden">{renderList(liberal, 'Liberal')}</div>}
          {activeTab === 'moderated' && <div className="flex-1 flex flex-col overflow-x-hidden">{renderList(moderated, 'Moderated')}</div>}
          {activeTab === 'conservative' && <div className="flex-1 flex flex-col overflow-x-hidden">{renderList(conservative, 'Conservative')}</div>}
        </div>
      </div>

      {/* Fullscreen Modal - 75% width, blurred background */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="w-[75%] max-h-[85vh] bg-neu-100 rounded-2xl shadow-neu-lg overflow-hidden">
            {/* Modal Header */}
            <div className="border-b border-neu-200 px-8 py-6 bg-neu-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-semibold text-neu-800">
                  {activeTab === 'liberal' ? 'Liberal' : activeTab === 'moderated' ? 'Moderated' : 'Conservative'} Mediators
                  <span className="ml-3 text-lg font-medium text-neu-600">
                    ({activeTab === 'liberal' ? filteredLiberalCount : activeTab === 'moderated' ? filteredModeratedCount : filteredConservativeCount})
                  </span>
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setCurrentPage(modalPage);
                }}
                className="w-10 h-10 rounded-full shadow-neu bg-neu-100 hover:shadow-neu-lg transition-all flex items-center justify-center text-neu-600 hover:text-neu-800"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-8 py-6 overflow-y-auto max-h-[calc(85vh-200px)]">
              {(() => {
                const currentMediators = activeTab === 'liberal' ? liberal : activeTab === 'moderated' ? moderated : conservative;
                const filteredMediators = applyFilters(currentMediators);
                const startIndex = (modalPage - 1) * ITEMS_PER_PAGE;
                const endIndex = startIndex + ITEMS_PER_PAGE;
                const paginatedMediators = filteredMediators.slice(startIndex, endIndex);

                return (
                  <div className="grid grid-cols-1 gap-4">
                    {paginatedMediators.map(mediator => (
                      <div
                        key={mediator._id}
                        onClick={() => {
                          trackSelection(mediator, 'clicked');
                          setSelectedMediator(mediator);
                          setShowMediatorDetail(true);
                        }}
                        className="bg-neu-200 rounded-xl p-5 shadow-neu hover:shadow-neu-lg transition-all duration-200 border border-neu-300 cursor-pointer">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            {/* Name and Rating */}
                            <div className="flex items-center gap-3 mb-3">
                              <h4 className="text-lg font-semibold text-neu-800">{mediator.name}</h4>
                              <StarRating rating={mediator.rating} totalMediations={mediator.totalMediations} />
                            </div>

                            {/* Location, Experience, Price */}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-neu-600 mb-3">
                              {mediator.location && (
                                <span className="flex items-center gap-1.5">
                                  <FaMapMarkerAlt className="text-neu-400" />
                                  {mediator.location.city}, {mediator.location.state}
                                </span>
                              )}
                              {mediator.yearsExperience && (
                                <span className="flex items-center gap-1.5">
                                  <FaBriefcase className="text-neu-400" />
                                  {mediator.yearsExperience} years experience
                                </span>
                              )}
                              {mediator.hourlyRate && (
                                <span className="flex items-center gap-1.5">
                                  <FaDollarSign className="text-neu-400" />
                                  ${mediator.hourlyRate}/hr
                                </span>
                              )}
                            </div>

                            {/* Practice Areas */}
                            {mediator.practiceAreas && mediator.practiceAreas.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {mediator.practiceAreas.map((area, i) => (
                                  <span key={i} className="px-3 py-1 text-xs bg-neu-300 text-neu-700 rounded-lg shadow-neu-sm">
                                    {area}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Bio if available */}
                            {mediator.bio && (
                              <p className="mt-3 text-sm text-neu-600 leading-relaxed">{mediator.bio}</p>
                            )}
                          </div>

                          {/* Ideology Badge */}
                          {mediator.ideologyScore !== undefined && (
                            <div className={`px-4 py-2 text-sm font-semibold rounded-xl whitespace-nowrap shadow-neu ${
                              mediator.ideologyScore <= -1 ? 'bg-blue-100 text-blue-700' :
                              mediator.ideologyScore >= 1 ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {mediator.ideologyScore <= -1 ? 'Liberal' :
                               mediator.ideologyScore >= 1 ? 'Conservative' :
                               'Moderated'}
                            </div>
                          )}
                        </div>

                        {/* Affiliation Flag */}
                        {affiliationFlags[mediator._id] && (
                          <div className="mt-3 pt-3 border-t border-neu-300">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg font-semibold shadow-neu-sm">
                                ⚠️ Potential Conflict
                              </span>
                              <span className="text-neu-600">Review affiliations carefully</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer with Pagination */}
            <div className="border-t border-neu-200 px-8 py-5 bg-neu-100">
              {(() => {
                const currentMediators = activeTab === 'liberal' ? liberal : activeTab === 'moderated' ? moderated : conservative;
                const filteredMediators = applyFilters(currentMediators);
                const totalPages = Math.ceil(filteredMediators.length / ITEMS_PER_PAGE);

                return (
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setCurrentPage(modalPage);
                      }}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium shadow-neu bg-neu-100 text-neu-700 hover:shadow-neu-lg transition-all"
                    >
                      Close
                    </button>

                    {totalPages > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setModalPage(prev => Math.max(1, prev - 1))}
                          disabled={modalPage === 1}
                          className="px-4 py-2.5 rounded-xl text-sm font-medium shadow-neu bg-neu-100 text-neu-700 hover:shadow-neu-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>

                        <div className="flex items-center gap-2">
                          {[...Array(totalPages)].map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setModalPage(i + 1)}
                              className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                                modalPage === i + 1
                                  ? 'shadow-neu-inset bg-neu-200 text-neu-800'
                                  : 'shadow-neu bg-neu-100 text-neu-600 hover:shadow-neu-lg'
                              }`}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => setModalPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={modalPage === totalPages}
                          className="px-4 py-2.5 rounded-xl text-sm font-medium shadow-neu bg-neu-100 text-neu-700 hover:shadow-neu-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Mediator Detail Popup - Availability & Video Call Info */}
      {showMediatorDetail && selectedMediator && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[60] animate-fade-in">
          <div className="w-[90%] max-w-4xl max-h-[90vh] bg-neu-100 rounded-2xl shadow-neu-lg overflow-hidden">
            {/* Header */}
            <div className="border-b border-neu-200 px-8 py-6 bg-gradient-to-r from-neu-100 to-neu-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-neu-800 mb-2">{selectedMediator.name}</h2>
                  <div className="flex items-center gap-4">
                    <StarRating rating={selectedMediator.rating} totalMediations={selectedMediator.totalMediations} />
                    {selectedMediator.ideologyScore !== undefined && (
                      <div className={`px-3 py-1 text-sm font-semibold rounded-lg shadow-neu ${
                        selectedMediator.ideologyScore <= -1 ? 'bg-blue-100 text-blue-700' :
                        selectedMediator.ideologyScore >= 1 ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {selectedMediator.ideologyScore <= -1 ? 'Liberal' :
                         selectedMediator.ideologyScore >= 1 ? 'Conservative' :
                         'Moderated'}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowMediatorDetail(false);
                    setSelectedMediator(null);
                  }}
                  className="w-12 h-12 rounded-full shadow-neu bg-neu-100 hover:shadow-neu-lg transition-all flex items-center justify-center text-neu-600 hover:text-neu-800"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-8 py-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Details */}
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="bg-neu-200 rounded-xl p-5 shadow-neu">
                    <h3 className="text-lg font-semibold text-neu-800 mb-4">Mediator Information</h3>
                    <div className="space-y-3">
                      {selectedMediator.location && (
                        <div className="flex items-center gap-3">
                          <FaMapMarkerAlt className="text-neu-400 text-lg" />
                          <span className="text-neu-700">{selectedMediator.location.city}, {selectedMediator.location.state}</span>
                        </div>
                      )}
                      {selectedMediator.yearsExperience && (
                        <div className="flex items-center gap-3">
                          <FaBriefcase className="text-neu-400 text-lg" />
                          <span className="text-neu-700">{selectedMediator.yearsExperience} years of experience</span>
                        </div>
                      )}
                      {selectedMediator.hourlyRate && (
                        <div className="flex items-center gap-3">
                          <FaDollarSign className="text-neu-400 text-lg" />
                          <span className="text-neu-700 font-semibold">${selectedMediator.hourlyRate}/hour</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Practice Areas */}
                  {selectedMediator.practiceAreas && selectedMediator.practiceAreas.length > 0 && (
                    <div className="bg-neu-200 rounded-xl p-5 shadow-neu">
                      <h3 className="text-lg font-semibold text-neu-800 mb-4">Practice Areas</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedMediator.practiceAreas.map((area, i) => (
                          <span key={i} className="px-4 py-2 text-sm bg-gradient-to-br from-blue-100 to-blue-200 text-blue-800 rounded-lg shadow-neu-sm font-medium">
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {selectedMediator.certifications && selectedMediator.certifications.length > 0 && (
                    <div className="bg-neu-200 rounded-xl p-5 shadow-neu">
                      <h3 className="text-lg font-semibold text-neu-800 mb-4">Certifications</h3>
                      <ul className="space-y-2">
                        {selectedMediator.certifications.map((cert, i) => (
                          <li key={i} className="flex items-center gap-2 text-neu-700">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            {cert}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Bio */}
                  {selectedMediator.bio && (
                    <div className="bg-neu-200 rounded-xl p-5 shadow-neu">
                      <h3 className="text-lg font-semibold text-neu-800 mb-3">About</h3>
                      <p className="text-neu-700 leading-relaxed">{selectedMediator.bio}</p>
                    </div>
                  )}

                  {/* Affiliation Warning */}
                  {affiliationFlags[selectedMediator._id] && (
                    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-5 shadow-neu">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Potential Conflict of Interest</h3>
                          <p className="text-yellow-700">This mediator may have affiliations with parties in your case. Please review carefully before proceeding.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Availability & Booking */}
                <div className="space-y-6">
                  {/* Free Video Call */}
                  <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl p-6 shadow-neu-lg text-white">
                    <h3 className="text-xl font-bold mb-3">Free 15-Minute Video Consultation</h3>
                    <p className="mb-5 text-blue-50">Schedule a complimentary video call to discuss your case before committing to paid services.</p>
                    <button
                      onClick={() => trackSelection(selectedMediator, 'scheduled_call')}
                      className="w-full bg-white text-blue-600 font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                    >
                      Schedule Free Consultation
                    </button>
                  </div>

                  {/* Availability Calendar */}
                  <div className="bg-neu-200 rounded-xl p-5 shadow-neu">
                    <h3 className="text-lg font-semibold text-neu-800 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Upcoming Availability
                    </h3>
                    <div className="space-y-3">
                      {/* Mock availability slots */}
                      {['Monday, Jan 22 - 2:00 PM', 'Tuesday, Jan 23 - 10:00 AM', 'Wednesday, Jan 24 - 3:30 PM', 'Thursday, Jan 25 - 1:00 PM', 'Friday, Jan 26 - 11:00 AM'].map((slot, i) => (
                        <button
                          key={i}
                          className="w-full text-left px-4 py-3 bg-neu-100 rounded-lg shadow-neu hover:shadow-neu-lg transition-all text-neu-700 font-medium"
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="bg-neu-200 rounded-xl p-5 shadow-neu">
                    <h3 className="text-lg font-semibold text-neu-800 mb-4">Contact Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-neu-700">
                        <svg className="w-5 h-5 text-neu-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>{selectedMediator.name.toLowerCase().replace(' ', '.')}@fairmediator.com</span>
                      </div>
                      <div className="flex items-center gap-3 text-neu-700">
                        <svg className="w-5 h-5 text-neu-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>(555) {Math.floor(Math.random() * 900 + 100)}-{Math.floor(Math.random() * 9000 + 1000)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Response Time */}
                  <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 shadow-neu">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-800 font-semibold">Usually responds within 24 hours</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-neu-200 px-8 py-5 bg-neu-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowMediatorDetail(false);
                  setSelectedMediator(null);
                }}
                className="px-6 py-2.5 rounded-xl text-sm font-medium shadow-neu bg-neu-100 text-neu-700 hover:shadow-neu-lg transition-all"
              >
                Close
              </button>
              <button
                onClick={() => trackSelection(selectedMediator, 'hired')}
                className="px-8 py-2.5 rounded-xl text-sm font-bold shadow-neu-lg bg-gradient-to-br from-blue-400 to-blue-600 text-white hover:shadow-neu-lg hover:scale-105 transition-all"
              >
                Book Paid Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediatorList;
