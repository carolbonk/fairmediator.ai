import React, { useState } from 'react';
import { FaStar, FaMapMarkerAlt, FaBriefcase, FaExclamationTriangle, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';

const MediatorCard = ({ mediator, affiliationFlag }) => {
  const [showPerformance, setShowPerformance] = useState(false);

  // Dummy performance data (for demonstration)
  const performanceData = {
    settlementRate: Math.floor(75 + Math.random() * 20), // 75-95%
    avgResolutionWeeks: Math.floor(2 + Math.random() * 4), // 2-6 weeks
    casesHandled: Math.floor(50 + Math.random() * 150), // 50-200
    satisfactionScore: (4.2 + Math.random() * 0.7).toFixed(1), // 4.2-4.9
    reviews: [
      { rating: 5, text: "Excellent mediator, very fair and professional", author: "Anonymous Client" },
      { rating: 4, text: "Great communication throughout the process", author: "Anonymous Attorney" },
      { rating: 5, text: "Helped us reach a fair settlement quickly", author: "Anonymous Client" }
    ]
  };

  const getIdeologyColor = (score) => {
    if (score <= -1) return 'bg-gradient-to-br from-blue-400 to-blue-600 text-white';
    if (score >= 1) return 'bg-gradient-to-br from-red-400 to-red-600 text-white';
    return 'bg-gradient-to-br from-gray-400 to-gray-600 text-white';
  };

  const getIdeologyLabel = (score) => {
    if (score <= -1.5) return 'Strong Liberal';
    if (score <= -0.5) return 'Lean Liberal';
    if (score >= 1.5) return 'Strong Conservative';
    if (score >= 0.5) return 'Lean Conservative';
    return 'Neutral/Centrist';
  };

  const getFlagIcon = () => {
    switch (affiliationFlag) {
      case 'red':
        return <FaExclamationTriangle className="text-red-500" title="Potential conflict detected" />;
      case 'yellow':
        return <FaExclamationTriangle className="text-yellow-500" title="Possible affiliation" />;
      case 'green':
        return <FaCheckCircle className="text-green-500" title="No conflicts detected" />;
      default:
        return null;
    }
  };

  return (
    <div className="card-neu p-5 hover:shadow-neu-lg transition-all duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-2">
            <h3 className="font-semibold text-neu-800 text-[17px]">
              {mediator.name}
            </h3>
            {getFlagIcon()}
            <button
              onClick={() => setShowPerformance(!showPerformance)}
              className="text-neu-500 hover:text-neu-700 transition-colors ml-1"
              title="View performance data"
            >
              <FaInfoCircle className="text-sm" />
            </button>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-neu-600 mb-3">
            {mediator.location && (
              <span className="flex items-center gap-1.5">
                <FaMapMarkerAlt className="text-xs text-neu-400" />
                <span className="font-medium">{mediator.location.city}, {mediator.location.state}</span>
              </span>
            )}
            
            {mediator.yearsExperience && (
              <span className="flex items-center gap-1.5">
                <FaBriefcase className="text-xs text-neu-400" />
                <span className="font-medium">{mediator.yearsExperience} years</span>
              </span>
            )}
            
            {mediator.rating > 0 && (
              <span className="flex items-center gap-1.5">
                <FaStar className="text-yellow-500 text-xs" />
                <span className="font-medium">{mediator.rating.toFixed(1)}</span>
              </span>
            )}
          </div>
          
          {mediator.currentFirm && (
            <p className="text-sm text-neu-500 font-medium mb-3">
              {mediator.currentFirm}
            </p>
          )}
          
          {mediator.practiceAreas && mediator.practiceAreas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {mediator.practiceAreas.slice(0, 3).map((area, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 text-xs font-medium bg-neu-200 text-neu-700 rounded-full shadow-neu-inset"
                >
                  {area}
                </span>
              ))}
              {mediator.practiceAreas.length > 3 && (
                <span className="px-2.5 py-1 text-xs text-neu-500 font-medium">
                  +{mediator.practiceAreas.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex-shrink-0">
          <span
            className={`inline-block px-3 py-1.5 text-xs font-semibold rounded-full shadow-neu-sm ${getIdeologyColor(
              mediator.ideologyScore || 0
            )}`}
          >
            {getIdeologyLabel(mediator.ideologyScore || 0)}
          </span>
        </div>
      </div>
      
      {affiliationFlag === 'red' && (
        <div className="mt-4 p-3 bg-red-50 rounded-xl shadow-neu-inset text-xs text-red-700 font-medium">
          ⚠️ Potential conflict of interest detected. Review affiliations before proceeding.
        </div>
      )}
      
      {affiliationFlag === 'yellow' && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-xl shadow-neu-inset text-xs text-yellow-700 font-medium">
          ⚠️ Possible affiliation detected. Further review recommended.
        </div>
      )}

      {/* Performance Data Popover */}
      {showPerformance && (
        <div className="mt-4 p-4 bg-neu-50 rounded-xl shadow-neu-inset border border-neu-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-neu-700">Performance Data</h4>
            <span className="text-xs text-neu-500 italic">Dummy data for demo</span>
          </div>

          {/* Performance Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-2.5 bg-white rounded-lg shadow-neu-inset">
              <div className="text-xs text-neu-600 font-medium mb-0.5">Settlement Rate</div>
              <div className="text-lg font-bold text-green-600">{performanceData.settlementRate}%</div>
            </div>
            <div className="p-2.5 bg-white rounded-lg shadow-neu-inset">
              <div className="text-xs text-neu-600 font-medium mb-0.5">Avg. Resolution</div>
              <div className="text-lg font-bold text-blue-600">{performanceData.avgResolutionWeeks} weeks</div>
            </div>
            <div className="p-2.5 bg-white rounded-lg shadow-neu-inset">
              <div className="text-xs text-neu-600 font-medium mb-0.5">Cases Handled</div>
              <div className="text-lg font-bold text-purple-600">{performanceData.casesHandled}</div>
            </div>
            <div className="p-2.5 bg-white rounded-lg shadow-neu-inset">
              <div className="text-xs text-neu-600 font-medium mb-0.5">Satisfaction</div>
              <div className="text-lg font-bold text-yellow-600 flex items-center gap-1">
                <FaStar className="text-sm" />
                {performanceData.satisfactionScore}
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="border-t border-neu-200 pt-3">
            <h5 className="text-xs font-semibold text-neu-700 mb-2">Recent Reviews</h5>
            <div className="space-y-2">
              {performanceData.reviews.map((review, idx) => (
                <div key={idx} className="p-2.5 bg-white rounded-lg shadow-neu-inset">
                  <div className="flex items-center gap-1.5 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        className={`text-xs ${
                          i < review.rating ? 'text-yellow-500' : 'text-neu-300'
                        }`}
                      />
                    ))}
                    <span className="text-xs text-neu-500 ml-1">- {review.author}</span>
                  </div>
                  <p className="text-xs text-neu-700 italic">"{review.text}"</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-neu-500 text-center mt-3 italic">
            Note: This is sample data for demonstration purposes
          </p>
        </div>
      )}
    </div>
  );
};

export default MediatorCard;
