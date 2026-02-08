import React, { memo } from 'react';
import { FaStar, FaStarHalfAlt, FaMapMarkerAlt, FaBriefcase, FaDollarSign } from 'react-icons/fa';
import ConflictBadge from './ConflictBadge';
import LobbyingBadge from './LobbyingBadge';

// Star Rating Component - Memoized for performance
const StarRating = memo(({ rating, totalMediations }) => {
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
          <FaStar key={`empty-${i}`} className="text-gray-300 text-xs" />
        ))}
      </div>
      <span className="text-xs text-neu-500">({totalMediations})</span>
    </div>
  );
});

const MediatorCard = memo(({
  mediator,
  affiliationFlag, // Legacy prop - kept for backwards compatibility
  conflictRisk = null, // New: { riskLevel: 'GREEN'|'YELLOW'|'RED', riskScore: number }
  onConflictClick = null, // Callback when conflict badge is clicked
  lobbyingData = null, // New: { count: number, totalAmount: number, industries: string[], latestYear: number }
  onLobbyingClick = null, // Callback when lobbying badge is clicked
  onClick,
  variant = 'compact' // 'compact' or 'expanded'
}) => {
  const getIdeologyLabel = (score) => {
    if (score <= -1) return 'Liberal';
    if (score >= 1) return 'Conservative';
    return 'Moderated';
  };

  const getIdeologyColor = (score) => {
    if (score <= -1) return 'bg-blue-100 text-blue-700';
    if (score >= 1) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  // Compact card for list view
  if (variant === 'compact') {
    return (
      <div
        onClick={onClick}
        className="bg-neu-200 rounded-lg p-2 shadow-neu hover:shadow-neu-lg transition-all duration-200 border border-neu-300 w-full cursor-pointer"
      >
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="flex-1 min-w-0">
            {/* Name and Rating on same line */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="text-sm font-semibold text-neu-800 truncate flex-shrink-0">
                {mediator.name}
              </h4>
              <div className="flex-shrink-0">
                <StarRating rating={mediator.rating} totalMediations={mediator.totalMediations} />
              </div>
            </div>

            {/* Location, Experience, Price in compact row */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-neu-600 mb-1">
              {mediator.location && (
                <span className="flex items-center gap-1 flex-shrink-0">
                  <FaMapMarkerAlt className="text-neu-400 text-xs" />
                  {mediator.location.city}, {mediator.location.state}
                </span>
              )}
              {mediator.yearsExperience && (
                <span className="flex items-center gap-1 flex-shrink-0">
                  <FaBriefcase className="text-neu-400 text-xs" />
                  {mediator.yearsExperience}y
                </span>
              )}
              {mediator.hourlyRate && (
                <span className="flex items-center gap-1 flex-shrink-0">
                  <FaDollarSign className="text-neu-400 text-xs" />
                  ${mediator.hourlyRate}/hr
                </span>
              )}
            </div>

            {/* Practice Areas - compact */}
            {mediator.practiceAreas && mediator.practiceAreas.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {mediator.practiceAreas.slice(0, 3).map((area, i) => (
                  <span key={i} className="px-2 py-1 text-xs bg-neu-300 text-neu-700 rounded-md flex-shrink-0">
                    {area}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Ideology Badge - compact */}
          {mediator.ideologyScore !== undefined && (
            <div className={`px-2.5 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap flex-shrink-0 ${getIdeologyColor(mediator.ideologyScore)}`}>
              {getIdeologyLabel(mediator.ideologyScore)}
            </div>
          )}
        </div>

        {/* Conflict Risk Badge & Lobbying Badge */}
        {(conflictRisk || affiliationFlag || lobbyingData) && (
          <div className="mt-2 pt-2 border-t border-neu-300 space-y-2">
            {(conflictRisk || affiliationFlag) && (
              <div>
                {conflictRisk ? (
                  <ConflictBadge
                    riskLevel={conflictRisk.riskLevel}
                    riskScore={conflictRisk.riskScore}
                    size="sm"
                    variant="square"
                    onClick={onConflictClick}
                    showScore={false}
                  />
                ) : (
                  // Legacy affiliation flag fallback
                  <div className="flex items-center gap-1.5 text-xs flex-wrap">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md font-semibold flex-shrink-0">
                      ⚠️ Conflict
                    </span>
                    <span className="text-neu-600 flex-shrink-0">Check affiliations</span>
                  </div>
                )}
              </div>
            )}

            {lobbyingData && (
              <div>
                <LobbyingBadge
                  lobbyingData={lobbyingData}
                  size="sm"
                  variant="square"
                  onClick={onLobbyingClick}
                  showDetails={true}
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Expanded card for modal view
  return (
    <div
      onClick={onClick}
      className="bg-neu-200 rounded-xl p-5 shadow-neu hover:shadow-neu-lg transition-all duration-200 border border-neu-300 cursor-pointer"
    >
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
          <div className={`px-4 py-2 text-sm font-semibold rounded-xl whitespace-nowrap shadow-neu ${getIdeologyColor(mediator.ideologyScore)}`}>
            {getIdeologyLabel(mediator.ideologyScore)}
          </div>
        )}
      </div>

      {/* Conflict Risk Badge & Lobbying Badge */}
      {(conflictRisk || affiliationFlag || lobbyingData) && (
        <div className="mt-3 pt-3 border-t border-neu-300 space-y-3">
          {(conflictRisk || affiliationFlag) && (
            <div>
              {conflictRisk ? (
                <div className="flex items-center gap-3">
                  <ConflictBadge
                    riskLevel={conflictRisk.riskLevel}
                    riskScore={conflictRisk.riskScore}
                    size="md"
                    variant="pill"
                    onClick={onConflictClick}
                    showScore={true}
                  />
                  {onConflictClick && (
                    <span className="text-xs text-neu-600">
                      Click to view details
                    </span>
                  )}
                </div>
              ) : (
                // Legacy affiliation flag fallback
                <div className="flex items-center gap-2 text-sm">
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg font-semibold shadow-neu-sm">
                    ⚠️ Potential Conflict
                  </span>
                  <span className="text-neu-600">Review affiliations carefully</span>
                </div>
              )}
            </div>
          )}

          {lobbyingData && (
            <div className="flex items-center gap-3">
              <LobbyingBadge
                lobbyingData={lobbyingData}
                size="md"
                variant="pill"
                onClick={onLobbyingClick}
                showDetails={true}
              />
              {onLobbyingClick && (
                <span className="text-xs text-neu-600">
                  Click to view lobbying history
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default MediatorCard;
