import { useState, useEffect } from 'react';
import { FaSearch, FaSpinner, FaTimes, FaTimesCircle } from 'react-icons/fa';
import { hybridSearch, batchCheckConflicts } from '../services/api';
import MediatorCard from './MediatorCard';
import ConflictGraph from './ConflictGraph';
import MediatorDetailModal from './MediatorDetailModal';
import logger from '../utils/logger';

/**
 * Hybrid Search Component
 * Uses backend hybrid search (vector + keyword) instead of mock data
 */
const HybridSearch = ({ parties = [] }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchMetadata, setSearchMetadata] = useState(null);
  const [conflictData, setConflictData] = useState({});
  const [conflictLoading, setConflictLoading] = useState(false);
  const [selectedMediatorConflict, setSelectedMediatorConflict] = useState(null);
  const [selectedMediatorDetail, setSelectedMediatorDetail] = useState(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await hybridSearch(query, {
        topK: 20,
        useQueryExpansion: true,
        filters: {}
      });

      setResults(response.results);
      setSearchMetadata(response.metadata);
    } catch (err) {
      console.error('Hybrid search error:', err);
      setError(err.response?.data?.error || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Check conflicts when results and parties are available
  useEffect(() => {
    const checkConflictsForResults = async () => {
      if (!results || results.length === 0 || !parties || parties.length === 0) {
        return;
      }

      setConflictLoading(true);
      try {
        const mediatorIds = results.map(r => r.mediatorId);
        const conflictResults = await batchCheckConflicts(mediatorIds, parties);
        setConflictData(conflictResults);
      } catch (err) {
        console.error('Conflict check error:', err);
        // Don't show error to user - conflicts are optional enhancement
      } finally {
        setConflictLoading(false);
      }
    };

    checkConflictsForResults();
  }, [results, parties]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults(null);
    setSearchMetadata(null);
    setError(null);
    setConflictData({});
    setSelectedMediatorConflict(null);
  };

  const handleConflictClick = (mediatorId) => {
    const conflict = conflictData[mediatorId];
    if (conflict) {
      setSelectedMediatorConflict({ mediatorId, ...conflict });
    }
  };

  const closeConflictModal = () => {
    setSelectedMediatorConflict(null);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="bg-neu-200 rounded-xl p-4 shadow-neu">
        <label className="block text-sm font-semibold text-neu-800 mb-2">
          Search Mediators (Hybrid: Semantic + Keyword)
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="e.g., 'divorce mediator in California' or 'employment dispute'"
              className="w-full px-4 py-3 pr-10 bg-neu-100 border border-neu-300 rounded-lg text-neu-800 placeholder-neu-500 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-neu-inset"
              disabled={loading}
            />
            {query && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neu-500 hover:text-neu-700"
              >
                <FaTimes />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-800 text-white rounded-lg font-semibold shadow-neu hover:shadow-neu-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <FaSearch />
                <span>Search</span>
              </>
            )}
          </button>
        </div>

        {/* Query Expansion Info */}
        {searchMetadata?.queryExpansion && (
          <div className="mt-3 p-3 bg-neu-100 rounded-lg text-xs">
            <p className="font-semibold text-neu-700">Query expanded with {searchMetadata.queryExpansion.expansionCount} legal synonyms:</p>
            <p className="text-neu-600 mt-1">
              {searchMetadata.queryExpansion.expandedTerms.slice(0, 5).join(', ')}
              {searchMetadata.queryExpansion.expandedTerms.length > 5 && '...'}
            </p>
          </div>
        )}

        {/* Search Metadata */}
        {searchMetadata && !error && (
          <div className="mt-3 flex items-center justify-between text-xs text-neu-600">
            <div>
              <span className="font-semibold">{searchMetadata.totalResults}</span> mediators found in{' '}
              <span className="font-semibold">{searchMetadata.elapsedMs}ms</span>
            </div>
            <div className="flex gap-4">
              <span>Vector: {searchMetadata.vectorResults}</span>
              <span>Keyword: {searchMetadata.keywordResults}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-3 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Search Results */}
      {results && results.length > 0 && (
        <div className="bg-neu-200 rounded-xl p-4 shadow-neu">
          <h3 className="text-sm font-semibold text-neu-800 mb-3">
            Search Results (Hybrid Scoring)
          </h3>
          <div className="space-y-2">
            {results.map((result) => {
              const conflict = conflictData[result.mediatorId];
              const conflictRisk = conflict ? {
                riskLevel: conflict.riskLevel,
                riskScore: conflict.riskScore
              } : null;

              return (
                <div key={result.mediatorId} className="relative">
                  <MediatorCard
                    mediator={result.mediator}
                    conflictRisk={conflictRisk}
                    onConflictClick={() => handleConflictClick(result.mediatorId)}
                    onClick={() => {
                      logger.debug('Mediator clicked:', result.mediator.name);
                      setSelectedMediatorDetail({
                        mediator: result.mediator,
                        conflictRisk: conflictRisk
                      });
                    }}
                    variant="compact"
                  />
                  {/* Show hybrid score badge */}
                  <div className="absolute top-2 right-2 px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded">
                    {(result.hybridScore * 100).toFixed(0)}% match
                  </div>
                  {/* Score breakdown (expandable) */}
                  <div className="mt-1 text-xs text-neu-600 px-2">
                    Vector: {(result.vectorScore * 100).toFixed(0)}% | Keyword: {(result.keywordScore * 100).toFixed(0)}%
                    {result.foundIn.vector && result.foundIn.keyword && ' | Found in both'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No Results */}
      {results && results.length === 0 && (
        <div className="bg-neu-200 rounded-xl p-8 shadow-neu text-center">
          <p className="text-neu-600">No mediators found for "{query}"</p>
          <p className="text-xs text-neu-500 mt-2">Try adjusting your search terms or using different keywords</p>
        </div>
      )}

      {/* Conflict Details Modal */}
      {selectedMediatorConflict && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neu-200 rounded-xl shadow-neu-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-neu-200 p-4 border-b border-neu-300 flex items-center justify-between shadow-neu-inset z-10">
              <h2 className="text-lg font-bold text-neu-800">
                Conflict Analysis Details
              </h2>
              <button
                onClick={closeConflictModal}
                className="p-2 rounded-lg bg-neu-200 text-neu-700 shadow-neu hover:shadow-neu-lg active:shadow-neu-inset transition-all duration-200"
                aria-label="Close conflict details"
              >
                <FaTimesCircle className="text-xl" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4">
              <ConflictGraph
                paths={selectedMediatorConflict.paths}
                riskLevel={selectedMediatorConflict.riskLevel}
                riskScore={selectedMediatorConflict.riskScore}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mediator Detail Modal */}
      {selectedMediatorDetail && (
        <MediatorDetailModal
          mediator={selectedMediatorDetail.mediator}
          conflictRisk={selectedMediatorDetail.conflictRisk}
          onClose={() => setSelectedMediatorDetail(null)}
          onConflictClick={() => {
            const mediatorId = selectedMediatorDetail.mediator._id || selectedMediatorDetail.mediator.id;
            handleConflictClick(mediatorId);
            setSelectedMediatorDetail(null);
          }}
        />
      )}
    </div>
  );
};

export default HybridSearch;
