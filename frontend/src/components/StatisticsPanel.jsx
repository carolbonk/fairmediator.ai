import { useState, useEffect } from 'react';
import Tooltip from './Tooltip';
import BulkConflictChecker from './BulkConflictChecker';

const StatisticsPanel = ({ caseData, onIdeologyChange }) => {
  const [selectedIdeology, setSelectedIdeology] = useState('neutral');
  const [aiMediatorsEnabled, setAiMediatorsEnabled] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistForm, setWaitlistForm] = useState({
    name: '',
    email: '',
    deadline: ''
  });
  const [bulkConflictResults, setBulkConflictResults] = useState(null);

  // Sample data - in production this should come from chat analysis
  const politicalDistribution = {
    liberal: caseData?.political?.liberal || 35,
    conservative: caseData?.political?.conservative || 25,
    neutral: caseData?.political?.neutral || 40
  };

  // Calculate conflict risk based on ideology mismatch with political balance AND bulk conflicts
  const calculateConflictRisk = (ideology) => {
    const baseRisk = caseData?.baseConflictRisk || 15;

    // Add penalty from bulk conflict checker results
    let bulkConflictPenalty = 0;
    if (bulkConflictResults) {
      const { summary } = bulkConflictResults;
      if (summary) {
        // High severity conflicts add significant risk
        bulkConflictPenalty += (summary.highSeverity || 0) * 10;
        // Medium severity conflicts add moderate risk
        bulkConflictPenalty += (summary.mediumSeverity || 0) * 5;
        // Cap bulk conflict penalty at 30
        bulkConflictPenalty = Math.min(bulkConflictPenalty, 30);
      }
    }

    // Calculate mismatch penalty
    const balance = politicalDistribution;
    let mismatchPenalty = 0;

    if (ideology === 'liberal' && balance.conservative > 40) {
      mismatchPenalty = 20;
    } else if (ideology === 'conservative' && balance.liberal > 40) {
      mismatchPenalty = 20;
    } else if (ideology === 'liberal' && balance.conservative > 25) {
      mismatchPenalty = 10;
    } else if (ideology === 'conservative' && balance.liberal > 25) {
      mismatchPenalty = 10;
    } else if (ideology === 'neutral') {
      mismatchPenalty = -5; // Neutral mediators reduce risk
    }

    return Math.min(Math.max(baseRisk + mismatchPenalty + bulkConflictPenalty, 0), 100);
  };

  const conflictRisk = calculateConflictRisk(selectedIdeology);

  // Notify parent component when ideology changes
  useEffect(() => {
    if (onIdeologyChange) {
      onIdeologyChange(selectedIdeology);
    }
  }, [selectedIdeology, onIdeologyChange]);

  const handleAiToggle = () => {
    if (!aiMediatorsEnabled) {
      setShowWaitlist(true);
    } else {
      setAiMediatorsEnabled(false);
    }
  };

  const handleWaitlistSubmit = (e) => {
    e.preventDefault();
    // TODO: Submit to API
    console.log('Waitlist submission:', waitlistForm);
    setShowWaitlist(false);
    setAiMediatorsEnabled(true);
    setWaitlistForm({ name: '', email: '', deadline: '' });
  };

  return (
    <div className="h-full flex flex-col gap-4 lg:gap-6">
      {/* AI/Human Toggle - Compact */}
      <div className="card-neu p-4 sm:p-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-neu-600 font-medium text-sm">Human</div>
          </div>
          
          <button
            onClick={handleAiToggle}
            className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
              aiMediatorsEnabled 
                ? 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-neu' 
                : 'bg-neu-200 shadow-neu-inset'
            }`}
          >
            <div
              className={`absolute top-1 left-1 w-6 h-6 rounded-full transition-all duration-300 ${
                aiMediatorsEnabled 
                  ? 'translate-x-6 bg-white shadow-neu-lg' 
                  : 'translate-x-0 bg-gradient-to-br from-neu-100 to-neu-50 shadow-neu'
              }`}
            >
              <div className="w-full h-full flex items-center justify-center">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  aiMediatorsEnabled ? 'bg-blue-500' : 'bg-red-500'
                }`}></div>
              </div>
            </div>
          </button>

          <div className={`text-sm font-medium transition-colors ${
            aiMediatorsEnabled ? 'text-blue-600' : 'text-neu-400'
          }`}>
            AI
          </div>
        </div>
      </div>

      {/* Political Mindset Statistics - Compact */}
      <div className="card-neu p-4 sm:p-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-neu-800 flex items-center gap-2">
            Political Balance
            <Tooltip text="Analyzes the political leanings of both sides in your case based on your chat description. This estimation helps match you with mediators whose ideology aligns with achieving a balanced resolution." />
          </h3>
        </div>

        {/* Circular Chart - Animated Self-Drawing SVG */}
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-6">
          {/* Outer ring - convex */}
          <div className="absolute inset-0 rounded-full shadow-neu bg-neu-100"></div>
          
          {/* Political distribution pie chart with self-drawing animation */}
          <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 200 200">
            {/* Liberal segment (blue) - animates first */}
            <circle
              cx="100"
              cy="100"
              r="70"
              fill="none"
              stroke="url(#liberalGradient)"
              strokeWidth="28"
              strokeDasharray="440"
              strokeDashoffset="440"
              className="transition-all duration-500"
              style={{
                strokeDashoffset: `${440 - (politicalDistribution.liberal * 4.4)}`,
                animation: 'drawCircle 1.5s ease-out forwards'
              }}
            />
            {/* Conservative segment (red) - animates second */}
            <circle
              cx="100"
              cy="100"
              r="70"
              fill="none"
              stroke="url(#conservativeGradient)"
              strokeWidth="28"
              strokeDasharray="440"
              strokeDashoffset="440"
              className="transition-all duration-500"
              style={{
                strokeDashoffset: `${440 - (politicalDistribution.conservative * 4.4)}`,
                transform: `rotate(${politicalDistribution.liberal * 3.6}deg)`,
                transformOrigin: 'center',
                animation: 'drawCircle 1.5s ease-out 0.3s forwards'
              }}
            />
            {/* Neutral segment (gray) - animates third */}
            <circle
              cx="100"
              cy="100"
              r="70"
              fill="none"
              stroke="url(#neutralGradient)"
              strokeWidth="28"
              strokeDasharray="440"
              strokeDashoffset="440"
              className="transition-all duration-500"
              style={{
                strokeDashoffset: `${440 - (politicalDistribution.neutral * 4.4)}`,
                transform: `rotate(${(politicalDistribution.liberal + politicalDistribution.conservative) * 3.6}deg)`,
                transformOrigin: 'center',
                animation: 'drawCircle 1.5s ease-out 0.6s forwards'
              }}
            />

            <defs>
              <linearGradient id="liberalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="100%" stopColor="#2563EB" />
              </linearGradient>
              <linearGradient id="conservativeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F87171" />
                <stop offset="100%" stopColor="#DC2626" />
              </linearGradient>
              <linearGradient id="neutralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#9CA3AF" />
                <stop offset="100%" stopColor="#6B7280" />
              </linearGradient>
              
              {/* Neumorphic filter effect */}
              <filter id="neuFilter" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"/>
                <feOffset in="blur" dx="2" dy="2" result="offsetBlur"/>
                <feMerge>
                  <feMergeNode in="offsetBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
          </svg>

          {/* Center circle - concave with scale animation */}
          <div 
            className="absolute inset-[30%] rounded-full shadow-neu-inset bg-neu-100 flex items-center justify-center"
            style={{
              animation: 'scaleIn 0.5s ease-out 0.9s both'
            }}
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-neu flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 9a1 1 0 112 0v4a1 1 0 11-2 0V9zm1-5a1 1 0 100 2 1 1 0 000-2z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Legend - Compact */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded shadow-neu-sm bg-gradient-to-br from-blue-400 to-blue-600"></div>
              <span className="text-sm text-neu-600">Liberal</span>
            </div>
            <span className="text-sm font-semibold text-neu-800">{politicalDistribution.liberal}%</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded shadow-neu-sm bg-gradient-to-br from-gray-400 to-gray-600"></div>
              <span className="text-sm text-neu-600">Neutral</span>
            </div>
            <span className="text-sm font-semibold text-neu-800">{politicalDistribution.neutral}%</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded shadow-neu-sm bg-gradient-to-br from-red-400 to-red-600"></div>
              <span className="text-sm text-neu-600">Conservative</span>
            </div>
            <span className="text-sm font-semibold text-neu-800">{politicalDistribution.conservative}%</span>
          </div>
        </div>
      </div>

      {/* Affiliation Conflict Risk with Ideology Filter - Animated SVG */}
      <div className="card-neu p-4 sm:p-6 flex-shrink-0">
        <h3 className="text-lg font-semibold text-neu-800 mb-3 flex items-center gap-2">
          Conflict Risk
          <Tooltip text="Estimates potential conflicts based on party affiliations and mediator ideology. The risk changes when you select different mediator ideologies below. Lower scores indicate better compatibility. This is an estimation." />
        </h3>

        {/* Ideology Filter integrated into Conflict Risk */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-neu-700 mb-3 flex items-center gap-1.5">
            Filter by Mediator Ideology
            <Tooltip text="Select a mediator ideology to see how it affects conflict risk. Neutral mediators typically reduce risk, while ideologically mismatched mediators may increase it." position="right" />
          </label>
          <div className="grid grid-cols-3 gap-2">
            {/* Liberal */}
            <button
              onClick={() => setSelectedIdeology('liberal')}
              className={`py-3 px-3 rounded-xl text-xs font-medium transition-all duration-300 ${
                selectedIdeology === 'liberal'
                  ? 'shadow-neu-inset bg-gradient-to-br from-blue-100 to-blue-200 text-blue-800'
                  : 'shadow-neu bg-neu-100 text-neu-600 hover:shadow-neu-lg'
              }`}
            >
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  selectedIdeology === 'liberal'
                    ? 'shadow-neu-inset bg-blue-200'
                    : 'shadow-neu bg-gradient-to-br from-blue-300 to-blue-500'
                }`}>
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                </div>
                <span className="text-xs">Liberal</span>
              </div>
            </button>

            {/* Neutral */}
            <button
              onClick={() => setSelectedIdeology('neutral')}
              className={`py-3 px-3 rounded-xl text-xs font-medium transition-all duration-300 ${
                selectedIdeology === 'neutral'
                  ? 'shadow-neu-inset bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800'
                  : 'shadow-neu bg-neu-100 text-neu-600 hover:shadow-neu-lg'
              }`}
            >
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  selectedIdeology === 'neutral'
                    ? 'shadow-neu-inset bg-gray-200'
                    : 'shadow-neu bg-gradient-to-br from-gray-300 to-gray-500'
                }`}>
                  <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                </div>
                <span className="text-xs">Neutral</span>
              </div>
            </button>

            {/* Conservative */}
            <button
              onClick={() => setSelectedIdeology('conservative')}
              className={`py-3 px-3 rounded-xl text-xs font-medium transition-all duration-300 ${
                selectedIdeology === 'conservative'
                  ? 'shadow-neu-inset bg-gradient-to-br from-red-100 to-red-200 text-red-800'
                  : 'shadow-neu bg-neu-100 text-neu-600 hover:shadow-neu-lg'
              }`}
            >
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  selectedIdeology === 'conservative'
                    ? 'shadow-neu-inset bg-red-200'
                    : 'shadow-neu bg-gradient-to-br from-red-300 to-red-500'
                }`}>
                  <div className="w-2 h-2 rounded-full bg-red-600"></div>
                </div>
                <span className="text-xs">Conservative</span>
              </div>
            </button>
          </div>
        </div>

        {/* Risk Meter */}
        <div className="relative h-20 flex items-center justify-center mb-4">
          {/* Gauge background - concave */}
          <div className="absolute inset-0 rounded-xl shadow-neu-inset bg-neu-100"></div>
          
          {/* Animated SVG Risk meter */}
          <div className="relative z-10 w-full px-4">
            {/* Background track */}
            <svg className="w-full h-6" viewBox="0 0 300 24" preserveAspectRatio="none">
              <defs>
                <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#4ADE80" />
                  <stop offset="50%" stopColor="#FACC15" />
                  <stop offset="100%" stopColor="#EF4444" />
                </linearGradient>
                
                {/* Neumorphic inner shadow for track */}
                <filter id="innerShadow">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                  <feOffset dx="0" dy="2" result="offsetblur"/>
                  <feFlood floodColor="#A3B1C6" floodOpacity="0.5"/>
                  <feComposite in2="offsetblur" operator="in"/>
                  <feMerge>
                    <feMergeNode/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Track background with inner shadow */}
              <rect 
                x="0" 
                y="0" 
                width="300" 
                height="24" 
                rx="12" 
                fill="#E4E7EB"
                filter="url(#innerShadow)"
              />
              
              {/* Animated gradient fill with self-drawing effect */}
              <rect 
                x="0" 
                y="0" 
                width="300" 
                height="24" 
                rx="12" 
                fill="url(#riskGradient)"
                style={{
                  clipPath: `inset(0 ${100 - conflictRisk}% 0 0)`,
                  animation: 'fillRisk 2s ease-out forwards'
                }}
              />
            </svg>
            
            {/* Animated indicator with pulse */}
            <div 
              className="absolute top-0 w-2 h-6 transition-all duration-700"
              style={{ 
                left: `calc(${conflictRisk}% - 0.25rem)`,
                animation: 'slideIndicator 2s ease-out forwards, pulse 2s ease-in-out 2s infinite'
              }}
            >
              <svg width="8" height="24" viewBox="0 0 8 24">
                <defs>
                  <filter id="indicatorGlow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <rect 
                  x="0" 
                  y="0" 
                  width="8" 
                  height="24" 
                  rx="4" 
                  fill="white"
                  filter="url(#indicatorGlow)"
                  style={{
                    filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))'
                  }}
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-neu-600">Low</span>
          <div className="flex items-center gap-1.5">
            <span
              className="text-2xl font-bold text-neu-800"
              style={{
                animation: 'countUp 2s ease-out forwards'
              }}
            >
              {conflictRisk}%
            </span>
          </div>
          <span className="text-neu-600">High</span>
        </div>

        {/* Bulk Conflict Status Summary */}
        {bulkConflictResults && (
          <div className="mt-4 pt-4 border-t border-neu-200">
            <div className="text-xs font-semibold text-neu-700 mb-2">Bulk Conflict Check Results</div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-neu-50 rounded-lg shadow-neu-inset">
                <div className="text-xs text-neu-600">Parties</div>
                <div className="text-lg font-bold text-neu-800">{bulkConflictResults.totalParties}</div>
              </div>
              <div className="text-center p-2 bg-red-50 rounded-lg shadow-neu-inset">
                <div className="text-xs text-red-600">Conflicts</div>
                <div className="text-lg font-bold text-red-700">{bulkConflictResults.totalConflicts}</div>
              </div>
              <div className="text-center p-2 bg-yellow-50 rounded-lg shadow-neu-inset">
                <div className="text-xs text-yellow-600">High Risk</div>
                <div className="text-lg font-bold text-yellow-700">{bulkConflictResults.summary?.highSeverity || 0}</div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Conflict Checker - Integrated */}
        <div className="mt-4 pt-4 border-t border-neu-200">
          <BulkConflictChecker onResultsUpdate={setBulkConflictResults} compact />
        </div>
      </div>

      {/* Waitlist Modal */}
      {showWaitlist && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <div className="card-neu max-w-md w-full mx-4 p-8 animate-neu-float">
            <h2 className="text-2xl font-bold text-neu-800 mb-2">Join the Waitlist</h2>
            <p className="text-neu-600 mb-6">Be the first to access AI-powered mediator matching</p>
            
            <form onSubmit={handleWaitlistSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neu-700 mb-2">Name</label>
                <input
                  type="text"
                  required
                  value={waitlistForm.name}
                  onChange={(e) => setWaitlistForm({...waitlistForm, name: e.target.value})}
                  className="input-neu"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neu-700 mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={waitlistForm.email}
                  onChange={(e) => setWaitlistForm({...waitlistForm, email: e.target.value})}
                  className="input-neu"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neu-700 mb-2">Deadline</label>
                <textarea
                  required
                  value={waitlistForm.deadline}
                  onChange={(e) => setWaitlistForm({...waitlistForm, deadline: e.target.value})}
                  className="input-neu min-h-[100px] resize-none"
                  placeholder="When do you need a mediator? Any specific requirements?"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowWaitlist(false)}
                  className="btn-neu flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-neu-primary flex-1"
                >
                  Join Waitlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatisticsPanel;
