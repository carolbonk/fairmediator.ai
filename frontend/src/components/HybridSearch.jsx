import { useState } from 'react';
import { FaSearch, FaSpinner, FaTimes } from 'react-icons/fa';
import { hybridSearch } from '../services/api';
import MediatorCard from './MediatorCard';

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
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold shadow-neu hover:shadow-neu-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
            {results.map((result) => (
              <div key={result.mediatorId} className="relative">
                <MediatorCard
                  mediator={result.mediator}
                  onClick={() => {
                    console.log('Mediator clicked:', result.mediator.name);
                    // TODO: Open modal with mediator details
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
            ))}
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
    </div>
  );
};

export default HybridSearch;
