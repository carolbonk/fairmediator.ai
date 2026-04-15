import { useState, useEffect } from 'react';
import Tooltip from './Tooltip';
import MediatorCard from './MediatorCard';
import { checkAffiliationsQuick, trackMediatorSelection } from '../services/api';
import { MOCK_MEDIATORS, categorizeMediatorsByIdeology, US_STATES } from '../data/mockMediators';
import { FaStar, FaStarHalfAlt, FaMapMarkerAlt, FaBriefcase, FaDollarSign } from 'react-icons/fa';

// Star Rating Component (used in detail modal)
const StarRating = ({ rating, totalMediations }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-bold text-neu-800">{rating.toFixed(1)}</span>
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <FaStar key={`full-${i}`} className="text-[#3B82F6] text-xs" />
        ))}
        {hasHalfStar && <FaStarHalfAlt className="text-[#3B82F6] text-xs" />}
        {[...Array(emptyStars)].map((_, i) => (
          <FaStar key={`empty-${i}`} className="text-gray-400 text-xs" />
        ))}
      </div>
      <span className="text-xs text-neu-500">({totalMediations})</span>
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
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(null);
  const ITEMS_PER_PAGE = 4;

  const AVAILABILITY_SLOTS = [
    { day: 22, label: 'Monday, Jan 22 - 2:00 PM', time: '2:00 PM' },
    { day: 23, label: 'Tuesday, Jan 23 - 10:00 AM', time: '10:00 AM' },
    { day: 24, label: 'Wednesday, Jan 24 - 3:30 PM', time: '3:30 PM' },
    { day: 25, label: 'Thursday, Jan 25 - 1:00 PM', time: '1:00 PM' },
    { day: 26, label: 'Friday, Jan 26 - 11:00 AM', time: '11:00 AM' },
  ];

  const AVAILABLE_DAYS = new Set(AVAILABILITY_SLOTS.map(s => s.day));

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
        <div className="text-center py-4 text-gray-400">
          <p className="text-xs">No {title.toLowerCase()} mediators found</p>
          {(selectedState !== 'all' || lowBudget) && (
            <p className="text-xs mt-1">Try adjusting filters</p>
          )}
        </div>
      );
    }

    return (
      <>
        <div className="space-y-1.5">
          {paginatedMediators.map(mediator => (
            <MediatorCard
              key={mediator._id}
              mediator={mediator}
              affiliationFlag={affiliationFlags[mediator._id]}
              onClick={() => {
                trackSelection(mediator, 'clicked');
                setSelectedMediator(mediator);
                setShowMediatorDetail(true);
              }}
              variant="compact"
            />
          ))}
        </div>

        {/* Pagination Controls - Compact */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 mt-2 pt-2 border-t border-neu-200">
            <button
              onClick={() => {
                setModalPage(Math.max(1, currentPage - 1));
                setShowModal(true);
              }}
              className="px-2.5 py-1.5 rounded-md text-xs font-medium shadow-neu bg-neu-100 text-neu-700 hover:shadow-neu-lg transition-all min-h-[36px] min-w-[36px]"
              aria-label="Previous page"
            >
              ←
            </button>

            <div className="flex items-center gap-1">
              {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setModalPage(i + 1);
                    setShowModal(true);
                  }}
                  className={`min-w-[36px] min-h-[36px] rounded-md text-xs font-medium transition-all ${
                    currentPage === i + 1
                      ? 'shadow-neu-inset bg-neu-200 text-neu-800'
                      : 'shadow-neu bg-neu-100 text-neu-600 hover:shadow-neu-lg'
                  }`}
                  aria-label={`Page ${i + 1}`}
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
              className="px-2.5 py-1.5 rounded-md text-xs font-medium shadow-neu bg-neu-100 text-neu-700 hover:shadow-neu-lg transition-all min-h-[36px] min-w-[36px]"
              aria-label="Next page"
            >
              →
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
    <div className="flex flex-col">
      {/* Header with Filters - Ultra Compact */}
      <div className="border-b border-neu-200 px-4 py-2 bg-neu-100">
        <h3 className="text-sm font-bold text-[#1E3A8A] mb-2">Review & Select your Mediator</h3>
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-sm font-semibold text-neu-800">
            Mediators
            <span className="ml-1 text-xs font-medium text-neu-600">
              ({totalCount})
            </span>
          </h2>
          <Tooltip text="AI-powered suggestions" />
        </div>

        {/* Filters Row - Compact */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* State Selector - Compact */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg shadow-neu bg-neu-100">
            <label className="text-xs font-semibold text-neu-700 whitespace-nowrap flex items-center gap-1">
              State
              <Tooltip text="Filter by state" position="top" />
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
                          ? 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-800 shadow-neu-inset'
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
                            ? 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-800 shadow-neu-inset'
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

          {/* Low Budget Toggle - Ultra Compact */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg shadow-neu bg-neu-100">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <span className="text-xs font-semibold text-neu-700 whitespace-nowrap">Budget</span>
              <Tooltip text="Under $300/hr" position="top" />
              <button
                type="button"
                onClick={() => setLowBudget(!lowBudget)}
                className={`relative w-8 h-4 rounded-full transition-all duration-300 ${
                  lowBudget
                    ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-neu'
                    : 'bg-neu-200 shadow-neu-inset'
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full transition-all duration-300 ${
                    lowBudget
                      ? 'translate-x-4 bg-white shadow-neu-lg'
                      : 'translate-x-0 bg-gradient-to-br from-neu-100 to-neu-50 shadow-neu'
                  }`}
                />
              </button>
            </label>
          </div>

          {/* Ideology Filter Label */}
          <div className="flex items-center gap-1 text-xs font-semibold text-neu-700">
            <span>Ideology:</span>
            <Tooltip text="Categories are algorithmic estimates based on keyword analysis, not verified political affiliations. Some mediators may request opt-out." position="top" />
          </div>

          {/* Ideology Tabs */}
          <button
            onClick={() => setActiveTab('liberal')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap min-h-[36px] ${
              activeTab === 'liberal'
                ? 'shadow-neu-inset bg-gradient-to-br from-slate-100 to-slate-200 text-slate-800'
                : 'shadow-neu bg-neu-100 text-neu-600 hover:shadow-neu-lg'
            }`}
          >
            Liberal <span className="opacity-75">({filteredLiberalCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('moderated')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap min-h-[36px] ${
              activeTab === 'moderated'
                ? 'shadow-neu-inset bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800'
                : 'shadow-neu bg-neu-100 text-neu-600 hover:shadow-neu-lg'
            }`}
          >
            Moderate <span className="opacity-75">({filteredModeratedCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('conservative')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap min-h-[36px] ${
              activeTab === 'conservative'
                ? 'shadow-neu-inset bg-gradient-to-br from-red-100 to-red-200 text-red-800'
                : 'shadow-neu bg-neu-100 text-neu-600 hover:shadow-neu-lg'
            }`}
          >
            Conservative <span className="opacity-75">({filteredConservativeCount})</span>
          </button>
        </div>
      </div>

      {/* Mediator Lists - Compact */}
      <div className="px-4 py-3">
        {loading && (
          <div className="text-center py-4 text-xs text-neu-600 font-medium">
            Checking affiliations...
          </div>
        )}

        <div>
          {activeTab === 'liberal' && <div>{renderList(liberal, 'Liberal')}</div>}
          {activeTab === 'moderated' && <div>{renderList(moderated, 'Moderated')}</div>}
          {activeTab === 'conservative' && <div>{renderList(conservative, 'Conservative')}</div>}
        </div>
      </div>

      {/* Fullscreen Modal - Responsive width, blurred background */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4 sm:p-6"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-[92%] sm:w-[80%] lg:w-[75%] max-h-[85vh] bg-dark-neu-300 rounded-2xl shadow-dark-neu-lg overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="border-b border-dark-neu-500 px-4 sm:px-8 py-4 sm:py-5 bg-dark-neu-300 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-semibold text-white">
                  {activeTab === 'liberal' ? 'Liberal' : activeTab === 'moderated' ? 'Moderated' : 'Conservative'} Mediators
                  <span className="ml-2 text-base font-medium text-white/60">
                    ({activeTab === 'liberal' ? filteredLiberalCount : activeTab === 'moderated' ? filteredModeratedCount : filteredConservativeCount})
                  </span>
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setCurrentPage(modalPage);
                }}
                className="w-9 h-9 rounded-full bg-dark-neu-400 hover:bg-dark-neu-500 border border-dark-neu-500 transition-all flex items-center justify-center text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
              {(() => {
                const currentMediators = activeTab === 'liberal' ? liberal : activeTab === 'moderated' ? moderated : conservative;
                const filteredMediators = applyFilters(currentMediators);
                const startIndex = (modalPage - 1) * ITEMS_PER_PAGE;
                const endIndex = startIndex + ITEMS_PER_PAGE;
                const paginatedMediators = filteredMediators.slice(startIndex, endIndex);

                return (
                  <div className="grid grid-cols-1 gap-4">
                    {paginatedMediators.map(mediator => (
                      <MediatorCard
                        key={mediator._id}
                        mediator={mediator}
                        affiliationFlag={affiliationFlags[mediator._id]}
                        onClick={() => {
                          trackSelection(mediator, 'clicked');
                          setSelectedMediator(mediator);
                          setShowMediatorDetail(true);
                        }}
                        variant="expanded"
                      />
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer with Pagination - Fixed at Bottom */}
            <div className="border-t border-dark-neu-500 px-4 sm:px-8 py-3 bg-dark-neu-300 flex-shrink-0">
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
                      className="px-4 py-2 rounded-xl text-sm font-medium bg-dark-neu-400 text-white border border-dark-neu-500 hover:bg-dark-neu-500 transition-all"
                    >
                      Close
                    </button>

                    {totalPages > 1 && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setModalPage(prev => Math.max(1, prev - 1))}
                          disabled={modalPage === 1}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium bg-dark-neu-400 text-white border border-dark-neu-500 hover:bg-dark-neu-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>

                        <div className="flex items-center gap-1">
                          {[...Array(totalPages)].map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setModalPage(i + 1)}
                              className={`w-8 h-8 rounded-xl text-xs font-medium transition-all border ${
                                modalPage === i + 1
                                  ? 'bg-blue-600 text-white border-blue-500'
                                  : 'bg-dark-neu-400 text-white/70 border-dark-neu-500 hover:bg-dark-neu-500'
                              }`}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => setModalPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={modalPage === totalPages}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium bg-dark-neu-400 text-white border border-dark-neu-500 hover:bg-dark-neu-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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
        <div
          className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[60] animate-fade-in p-4 sm:p-6"
          onClick={() => {
            setShowMediatorDetail(false);
            setSelectedMediator(null);
          }}
        >
          <div
            className="w-[92%] sm:w-[90%] max-w-4xl max-h-[85vh] bg-dark-neu-300 rounded-2xl shadow-dark-neu-lg overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="border-b border-dark-neu-500 px-4 sm:px-8 py-4 sm:py-5 bg-dark-neu-300 flex-shrink-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">{selectedMediator.name}</h2>
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
                  className="w-9 h-9 rounded-full bg-dark-neu-400 hover:bg-dark-neu-500 border border-dark-neu-500 transition-all flex items-center justify-center text-white flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Left Column - Details */}
                <div className="space-y-4">
                  {/* Basic Info */}
                  <div className="bg-dark-neu-400 rounded-xl p-4 border border-dark-neu-500">
                    <h3 className="text-sm font-semibold text-white mb-3">Mediator Information</h3>
                    <div className="space-y-2">
                      {selectedMediator.location && (
                        <div className="flex items-center gap-3">
                          <FaMapMarkerAlt className="text-white/60 text-base flex-shrink-0" />
                          <span className="text-white/80 text-sm">{selectedMediator.location.city}, {selectedMediator.location.state}</span>
                        </div>
                      )}
                      {selectedMediator.yearsExperience && (
                        <div className="flex items-center gap-3">
                          <FaBriefcase className="text-white/60 text-base flex-shrink-0" />
                          <span className="text-white/80 text-sm">{selectedMediator.yearsExperience} years of experience</span>
                        </div>
                      )}
                      {selectedMediator.hourlyRate && (
                        <div className="flex items-center gap-3">
                          <FaDollarSign className="text-white/60 text-base flex-shrink-0" />
                          <span className="text-white font-semibold text-sm">${selectedMediator.hourlyRate}/hour</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Practice Areas */}
                  {selectedMediator.practiceAreas && selectedMediator.practiceAreas.length > 0 && (
                    <div className="bg-dark-neu-400 rounded-xl p-4 border border-dark-neu-500">
                      <h3 className="text-sm font-semibold text-white mb-3">Practice Areas</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedMediator.practiceAreas.map((area, i) => (
                          <span key={i} className="px-3 py-1.5 text-xs bg-dark-neu-500 text-white/80 rounded-lg border border-dark-neu-400 font-medium">
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {selectedMediator.certifications && selectedMediator.certifications.length > 0 && (
                    <div className="bg-dark-neu-400 rounded-xl p-4 border border-dark-neu-500">
                      <h3 className="text-sm font-semibold text-white mb-3">Certifications</h3>
                      <ul className="space-y-2">
                        {selectedMediator.certifications.map((cert, i) => (
                          <li key={i} className="flex items-center gap-2 text-white/80 text-sm">
                            <span className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></span>
                            {cert}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Bio */}
                  {selectedMediator.bio && (
                    <div className="bg-dark-neu-400 rounded-xl p-4 border border-dark-neu-500">
                      <h3 className="text-sm font-semibold text-white mb-2">About</h3>
                      <p className="text-white/70 leading-relaxed text-sm">{selectedMediator.bio}</p>
                    </div>
                  )}

                  {/* Affiliation Warning */}
                  {affiliationFlags[selectedMediator._id] && (
                    <div className="bg-yellow-900/40 border border-yellow-500/50 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0">⚠️</span>
                        <div>
                          <h3 className="text-sm font-semibold text-yellow-300 mb-1">Potential Conflict of Interest</h3>
                          <p className="text-yellow-200/80 text-xs">This mediator may have affiliations with parties in your case. Please review carefully before proceeding.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Availability & Booking */}
                <div className="space-y-4">
                  {/* Free Video Call */}
                  <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl p-4 text-white border border-slate-600/30">
                    <h3 className="text-base font-bold mb-2">Free 15-Minute Video Consultation</h3>
                    <p className="mb-4 text-gray-300 text-sm">Schedule a complimentary video call to discuss your case before committing to paid services.</p>
                    <button
                      onClick={() => setShowCalendar(true)}
                      className="w-full bg-white text-slate-700 font-bold py-2 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 text-sm"
                    >
                      Schedule Free Consultation
                    </button>
                  </div>

                  {/* Availability Calendar */}
                  <div className="bg-dark-neu-400 rounded-xl p-4 border border-dark-neu-500">
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Upcoming Availability
                    </h3>
                    <div className="space-y-2">
                      {AVAILABILITY_SLOTS.map((slot, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedSlot(selectedSlot === i ? null : i)}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-all text-xs font-medium border ${
                            selectedSlot === i
                              ? 'bg-white/20 border-white/40 text-white shadow-inner'
                              : 'bg-dark-neu-500 border-dark-neu-400 text-white/80 hover:bg-dark-neu-400'
                          }`}
                        >
                          <span className="flex items-center justify-between">
                            {slot.label}
                            {selectedSlot === i && (
                              <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="bg-dark-neu-400 rounded-xl p-4 border border-dark-neu-500">
                    <h3 className="text-sm font-semibold text-white mb-3">Contact Information</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-white/70">
                        <svg className="w-4 h-4 text-white/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs">{selectedMediator.name.toLowerCase().replace(' ', '.')}@fairmediator.ai</span>
                      </div>
                      <div className="flex items-center gap-3 text-white/70">
                        <svg className="w-4 h-4 text-white/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="text-xs">(555) {Math.floor(Math.random() * 900 + 100)}-{Math.floor(Math.random() * 9000 + 1000)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Response Time */}
                  <div className="bg-green-900/30 border border-green-500/40 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse flex-shrink-0"></div>
                      <span className="text-green-300 font-semibold text-sm">Usually responds within 48 hours</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer - Fixed at Bottom */}
            <div className="border-t border-dark-neu-500 px-4 sm:px-8 py-4 bg-dark-neu-300 flex items-center justify-between flex-shrink-0">
              <button
                onClick={() => {
                  setShowMediatorDetail(false);
                  setSelectedMediator(null);
                  setSelectedSlot(null);
                }}
                className="px-5 py-2 rounded-xl text-sm font-medium bg-dark-neu-400 text-white hover:bg-dark-neu-500 border border-dark-neu-500 transition-all"
              >
                Close
              </button>
              <button
                onClick={() => trackSelection(selectedMediator, 'hired')}
                className="px-6 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:from-slate-700 hover:to-slate-800 transition-all shadow-lg"
              >
                Book Paid Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Modal */}
      {showCalendar && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[110]"
            onClick={() => { setShowCalendar(false); setCalendarSelectedDate(null); }}
          />
          <div className="fixed inset-0 z-[111] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div
              className="relative w-full max-w-sm bg-dark-neu-300 rounded-t-2xl sm:rounded-2xl shadow-dark-neu-lg border border-dark-neu-500 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-dark-neu-500">
                <h3 className="text-white font-bold text-base">Select a Date</h3>
                <button
                  onClick={() => { setShowCalendar(false); setCalendarSelectedDate(null); }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-dark-neu-400 text-white/60 hover:text-white border border-dark-neu-500 transition-all"
                  aria-label="Close calendar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="px-6 py-4">
                <div className="flex items-center justify-center mb-4">
                  <span className="text-white font-semibold text-sm">January 2026</span>
                </div>

                {/* Day labels */}
                <div className="grid grid-cols-7 mb-2">
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                    <div key={d} className="text-center text-white/60 text-xs font-medium py-1">{d}</div>
                  ))}
                </div>

                {/* Date grid — January 2026 starts on Thursday (day index 4) */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells for offset: Jan 1 2026 = Thursday */}
                  {[...Array(4)].map((_, i) => <div key={`empty-${i}`} />)}
                  {[...Array(31)].map((_, i) => {
                    const day = i + 1;
                    const isAvailable = AVAILABLE_DAYS.has(day);
                    const isSelected = calendarSelectedDate === day;
                    const isPast = day < 22;
                    return (
                      <button
                        key={day}
                        disabled={!isAvailable}
                        onClick={() => setCalendarSelectedDate(day)}
                        className={`aspect-square rounded-lg text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-white text-dark-neu-300 font-bold shadow-lg'
                            : isAvailable
                            ? 'bg-dark-neu-400 text-white border border-white/30 hover:bg-white/20'
                            : isPast
                            ? 'text-white/20 cursor-default'
                            : 'text-white/20 cursor-default'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected slot confirmation */}
              {calendarSelectedDate && (() => {
                const slot = AVAILABILITY_SLOTS.find(s => s.day === calendarSelectedDate);
                return slot ? (
                  <div className="mx-6 mb-4 p-3 bg-dark-neu-400 rounded-xl border border-white/20">
                    <p className="text-white/60 text-xs mb-1">Available time</p>
                    <p className="text-white font-semibold text-sm">{slot.label}</p>
                  </div>
                ) : null;
              })()}

              {/* Footer */}
              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={() => { setShowCalendar(false); setCalendarSelectedDate(null); }}
                  className="flex-1 py-2 rounded-xl text-sm font-medium bg-dark-neu-400 text-white border border-dark-neu-500 hover:bg-dark-neu-500 transition-all"
                >
                  Cancel
                </button>
                <button
                  disabled={!calendarSelectedDate}
                  onClick={() => {
                    if (calendarSelectedDate) {
                      const slot = AVAILABILITY_SLOTS.find(s => s.day === calendarSelectedDate);
                      if (slot) setSelectedSlot(AVAILABILITY_SLOTS.indexOf(slot));
                      trackSelection(selectedMediator, 'scheduled_call');
                      setShowCalendar(false);
                      setCalendarSelectedDate(null);
                    }
                  }}
                  className="flex-1 py-2 rounded-xl text-sm font-bold bg-white text-slate-700 hover:bg-slate-100 transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Confirm Booking
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MediatorList;
