/**
 * ConflictGraph Visualization Component
 * Displays relationship paths between entities (mediators, parties, organizations)
 * with color-coded risk indicators
 *
 * WCAG Compliance:
 * - Color contrast ≥ 4.5:1
 * - Keyboard navigable
 * - Screen reader friendly with ARIA labels
 * - Touch targets ≥ 44x44pt
 */

import React, { useState } from 'react';
import { FaUser, FaBuilding, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import ConflictBadge from './ConflictBadge';

const ConflictGraph = ({
  paths = [],
  riskLevel = 'GREEN',
  riskScore = 0,
  onNodeClick = null,
  className = ''
}) => {
  const [selectedPath, setSelectedPath] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  // If no paths provided, show empty state
  if (!paths || paths.length === 0) {
    return (
      <div className={`bg-neu-200 rounded-xl p-6 shadow-neu ${className}`}>
        <div className="text-center py-8">
          <FaInfoCircle className="text-4xl text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No conflict paths found</p>
          <p className="text-sm text-gray-500 mt-1">
            This indicates no detectable relationships between parties
          </p>
        </div>
      </div>
    );
  }

  // Get entity type icon
  const getEntityIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'person':
      case 'mediator':
      case 'attorney':
        return FaUser;
      case 'organization':
      case 'firm':
      case 'company':
        return FaBuilding;
      default:
        return FaUser;
    }
  };

  // Get risk color for relationship
  const getRelationshipColor = (weight) => {
    if (weight >= 10) return 'border-red-500 bg-red-50';
    if (weight >= 7) return 'border-yellow-500 bg-yellow-50';
    return 'border-green-500 bg-green-50';
  };

  // Get relationship label color
  const getRelationshipLabelColor = (weight) => {
    if (weight >= 10) return 'text-red-700 bg-red-100';
    if (weight >= 7) return 'text-yellow-700 bg-yellow-100';
    return 'text-green-700 bg-green-100';
  };

  // Render a single path
  const renderPath = (path, pathIndex) => {
    const isSelected = selectedPath === pathIndex;

    return (
      <div
        key={pathIndex}
        className={`
          bg-neu-200 rounded-xl p-6 shadow-neu
          transition-all duration-200
          ${isSelected ? 'ring-2 ring-blue-500 shadow-neu-lg' : 'hover:shadow-neu-lg'}
          ${className}
        `}
        role="article"
        aria-label={`Conflict path ${pathIndex + 1} with total weight ${path.totalWeight}`}
      >
        {/* Path Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FaExclamationTriangle
              className={`text-xl ${
                path.totalWeight >= 15 ? 'text-red-500' :
                path.totalWeight >= 8 ? 'text-yellow-500' :
                'text-green-500'
              }`}
              aria-hidden="true"
            />
            <div>
              <h3 className="text-sm font-semibold text-neu-800">
                Path {pathIndex + 1}
              </h3>
              <p className="text-xs text-neu-600">
                {path.nodes?.length || 0} connections • Weight: {path.totalWeight}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedPath(isSelected ? null : pathIndex)}
            className="px-3 py-1.5 text-xs font-medium bg-neu-200 text-neu-700 rounded-lg shadow-neu hover:shadow-neu-lg active:shadow-neu-inset transition-all duration-200 min-h-[36px]"
            aria-label={isSelected ? 'Collapse path details' : 'Expand path details'}
          >
            {isSelected ? 'Collapse' : 'Expand'}
          </button>
        </div>

        {/* Path Visualization */}
        <div className="relative">
          {/* Nodes */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {path.nodes?.map((node, nodeIndex) => {
              const Icon = getEntityIcon(node.type);
              const isHovered = hoveredNode === `${pathIndex}-${nodeIndex}`;

              return (
                <React.Fragment key={nodeIndex}>
                  {/* Node */}
                  <button
                    onClick={() => onNodeClick && onNodeClick(node)}
                    onMouseEnter={() => setHoveredNode(`${pathIndex}-${nodeIndex}`)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onFocus={() => setHoveredNode(`${pathIndex}-${nodeIndex}`)}
                    onBlur={() => setHoveredNode(null)}
                    className={`
                      flex flex-col items-center gap-2 p-3 rounded-xl
                      bg-neu-200 shadow-neu
                      hover:shadow-neu-lg active:shadow-neu-inset
                      transition-all duration-200
                      min-w-[80px] min-h-[44px]
                      ${isHovered ? 'scale-105' : ''}
                    `}
                    aria-label={`${node.name}, ${node.type}`}
                  >
                    <Icon
                      className={`text-2xl ${
                        nodeIndex === 0 || nodeIndex === path.nodes.length - 1
                          ? 'text-blue-500'
                          : 'text-gray-500'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="text-xs font-medium text-neu-800 text-center leading-tight">
                      {node.name}
                    </span>
                    {node.type && (
                      <span className="text-xs text-neu-600 capitalize">
                        {node.type}
                      </span>
                    )}
                  </button>

                  {/* Relationship Edge (connection line) */}
                  {nodeIndex < path.nodes.length - 1 && path.relationships?.[nodeIndex] && (
                    <div className="flex flex-col items-center gap-1 mx-2 flex-shrink-0">
                      <div
                        className={`
                          h-1 w-12 rounded-full border-2
                          ${getRelationshipColor(path.relationships[nodeIndex].weight)}
                        `}
                        aria-hidden="true"
                      />
                      <div
                        className={`
                          px-2 py-1 rounded text-xs font-medium whitespace-nowrap
                          ${getRelationshipLabelColor(path.relationships[nodeIndex].weight)}
                        `}
                      >
                        {path.relationships[nodeIndex].type?.replace(/_/g, ' ')}
                      </div>
                      <span className="text-xs text-neu-600 font-mono">
                        {path.relationships[nodeIndex].weight}pt
                      </span>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Expanded Details */}
        {isSelected && path.relationships && (
          <div className="mt-4 pt-4 border-t border-neu-300">
            <h4 className="text-xs font-semibold text-neu-700 uppercase tracking-wide mb-3">
              Relationship Details
            </h4>
            <div className="space-y-2">
              {path.relationships.map((rel, relIndex) => (
                <div
                  key={relIndex}
                  className="bg-white rounded-lg p-3 shadow-neu-inset"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neu-800">
                        {rel.type?.replace(/_/g, ' ')}
                      </p>
                      {rel.context && (
                        <p className="text-xs text-neu-600 mt-1">
                          {rel.context}
                        </p>
                      )}
                      {rel.date && (
                        <p className="text-xs text-neu-500 mt-1">
                          Date: {new Date(rel.date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <span
                      className={`
                        px-2 py-1 rounded text-xs font-bold whitespace-nowrap
                        ${getRelationshipLabelColor(rel.weight)}
                      `}
                    >
                      {rel.weight}pt
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Summary Header */}
      <div className="bg-neu-200 rounded-xl p-4 shadow-neu">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-neu-800 mb-1">
              Conflict Analysis Results
            </h2>
            <p className="text-sm text-neu-600">
              Found {paths.length} relationship path{paths.length !== 1 ? 's' : ''}
            </p>
          </div>

          <ConflictBadge
            riskLevel={riskLevel}
            riskScore={riskScore}
            size="md"
            variant="pill"
            showScore={true}
          />
        </div>
      </div>

      {/* Path List */}
      <div className="space-y-4">
        {paths.map((path, index) => renderPath(path, index))}
      </div>

      {/* Legend */}
      <div className="bg-neu-200 rounded-xl p-4 shadow-neu">
        <h3 className="text-xs font-semibold text-neu-700 uppercase tracking-wide mb-3">
          Relationship Weight Legend
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-red-500 rounded-full" aria-hidden="true" />
            <span className="text-neu-700">High Risk (10+ points)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-yellow-500 rounded-full" aria-hidden="true" />
            <span className="text-neu-700">Medium Risk (7-9 points)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-green-500 rounded-full" aria-hidden="true" />
            <span className="text-neu-700">Low Risk (&lt;7 points)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConflictGraph;
export { ConflictGraph };
