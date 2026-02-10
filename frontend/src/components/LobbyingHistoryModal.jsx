/**
 * LobbyingHistoryModal Component
 * Displays detailed lobbying disclosure history for a mediator
 *
 * Features:
 * - List of Senate LDA filings (registrant, client, amount, issue areas)
 * - Industry breakdown pie chart (14 categories)
 * - Quarterly trend charts (lobbying amounts over time)
 * - Responsive design
 * - WCAG 2.1 Level AA compliant
 *
 * Data Sources:
 * - Senate LDA (Lobbying Disclosure Act) API
 * - FEC (Federal Election Commission) - cross-reference
 */

import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FaTimes, FaLandmark, FaDollarSign, FaCalendar, FaBuilding, FaFileAlt } from 'react-icons/fa';

const LobbyingHistoryModal = ({
  isOpen,
  onClose,
  mediatorName,
  lobbyingData = null // { filings: [], industries: {}, quarterlyTrends: [], totalAmount: number }
}) => {
  if (!lobbyingData) {
    return null;
  }

  const { filings = [], industries = {}, quarterlyTrends = [], totalAmount = 0 } = lobbyingData;

  // Format currency
  const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toFixed(2)}`;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Industry colors (14 categories)
  const industryColors = {
    'Healthcare': '#3B82F6',
    'Technology': '#8B5CF6',
    'Finance': '#10B981',
    'Energy': '#F59E0B',
    'Defense': '#EF4444',
    'Agriculture': '#84CC16',
    'Transportation': '#06B6D4',
    'Education': '#EC4899',
    'Real Estate': '#F97316',
    'Retail': '#14B8A6',
    'Manufacturing': '#6366F1',
    'Telecommunications': '#A855F7',
    'Pharmaceuticals': '#0EA5E9',
    'Other': '#9CA3AF'
  };

  // Calculate pie chart segments
  const totalIndustryAmount = Object.values(industries).reduce((sum, amount) => sum + amount, 0);
  let currentAngle = 0;
  const pieSegments = Object.entries(industries).map(([industry, amount]) => {
    const percentage = (amount / totalIndustryAmount) * 100;
    const angle = (amount / totalIndustryAmount) * 360;
    const segment = {
      industry,
      amount,
      percentage,
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
      color: industryColors[industry] || industryColors['Other']
    };
    currentAngle += angle;
    return segment;
  });

  // Simplified pie chart path calculation
  const getPieSlicePath = (startAngle, endAngle, radius = 80) => {
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;

    const x1 = 100 + radius * Math.cos(startRad);
    const y1 = 100 + radius * Math.sin(startRad);
    const x2 = 100 + radius * Math.cos(endRad);
    const y2 = 100 + radius * Math.sin(endRad);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return `M 100 100 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  // Calculate quarterly trend max for scaling
  const maxQuarterlyAmount = Math.max(...quarterlyTrends.map(q => q.amount), 1);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-dark-neu-300 p-8 sm:p-10 text-left align-middle shadow-2xl transition-all">
                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-dark-neu-400 rounded-xl border border-dark-neu-500">
                      <FaLandmark className="text-2xl text-white" />
                    </div>
                    <div>
                      <Dialog.Title
                        as="h3"
                        className="text-2xl font-bold text-white"
                      >
                        Lobbying Disclosure History
                      </Dialog.Title>
                      <p className="text-base text-neu-200 mt-1">{mediatorName}</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-dark-neu-400 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                    aria-label="Close modal"
                  >
                    <FaTimes className="text-xl text-white" />
                  </button>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-dark-neu-400/50 rounded-xl p-5 border border-dark-neu-500">
                    <div className="flex items-center gap-2 mb-2">
                      <FaFileAlt className="text-white" />
                      <span className="text-base text-neu-200">Total Filings</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{filings.length}</p>
                  </div>
                  <div className="bg-dark-neu-400/50 rounded-xl p-5 border border-dark-neu-500">
                    <div className="flex items-center gap-2 mb-2">
                      <FaDollarSign className="text-white" />
                      <span className="text-base text-neu-200">Total Amount</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{formatCurrency(totalAmount)}</p>
                  </div>
                  <div className="bg-dark-neu-400/50 rounded-xl p-5 border border-dark-neu-500">
                    <div className="flex items-center gap-2 mb-2">
                      <FaBuilding className="text-white" />
                      <span className="text-base text-neu-200">Industries</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{Object.keys(industries).length}</p>
                  </div>
                </div>

                {/* Industry Breakdown Pie Chart */}
                {pieSegments.length > 0 && (
                  <div className="bg-dark-neu-400/50 rounded-xl p-6 border border-dark-neu-500 mb-8">
                    <h4 className="text-xl font-bold text-white mb-6">Industry Breakdown</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Pie Chart */}
                      <div className="flex items-center justify-center">
                        <svg width="200" height="200" viewBox="0 0 200 200">
                          {pieSegments.map((segment, index) => (
                            <g key={index}>
                              <path
                                d={getPieSlicePath(segment.startAngle, segment.endAngle)}
                                fill={segment.color}
                                stroke="#475569"
                                strokeWidth="2"
                              />
                            </g>
                          ))}
                          {/* Center circle for donut effect */}
                          <circle cx="100" cy="100" r="40" fill="#1e293b" />
                          <text
                            x="100"
                            y="95"
                            textAnchor="middle"
                            className="text-xs font-semibold fill-slate-300"
                          >
                            Total
                          </text>
                          <text
                            x="100"
                            y="110"
                            textAnchor="middle"
                            className="text-sm font-bold fill-white"
                          >
                            {formatCurrency(totalIndustryAmount)}
                          </text>
                        </svg>
                      </div>

                      {/* Legend */}
                      <div className="space-y-2">
                        {pieSegments.map((segment, index) => (
                          <div key={index} className="flex items-center justify-between gap-3 text-sm">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div
                                className="w-3 h-3 rounded-sm flex-shrink-0"
                                style={{ backgroundColor: segment.color }}
                              />
                              <span className="text-white truncate">{segment.industry}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-neu-200 font-mono text-xs">
                                {segment.percentage.toFixed(1)}%
                              </span>
                              <span className="text-white font-semibold">
                                {formatCurrency(segment.amount)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quarterly Trends Chart */}
                {quarterlyTrends.length > 0 && (
                  <div className="bg-dark-neu-400/50 rounded-xl p-6 border border-dark-neu-500 mb-8">
                    <h4 className="text-xl font-bold text-white mb-6">Quarterly Lobbying Trends</h4>
                    <div className="h-48 flex items-end justify-between gap-1 px-4">
                      {quarterlyTrends.map((quarter, index) => {
                        const height = (quarter.amount / maxQuarterlyAmount) * 100;
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full flex items-end justify-center" style={{ height: '160px' }}>
                              <div
                                className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all hover:from-blue-600 hover:to-blue-500 group relative"
                                style={{ height: `${height}%`, minHeight: height > 0 ? '4px' : '0' }}
                              >
                                {/* Tooltip on hover */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                  <div className="bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                    {formatCurrency(quarter.amount)}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <span className="text-xs text-white font-medium">
                              {quarter.quarter}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Filings List */}
                <div className="bg-dark-neu-400/50 rounded-xl p-6 border border-dark-neu-500">
                  <h4 className="text-xl font-bold text-white mb-6">
                    Lobbying Filings ({filings.length})
                  </h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filings.length === 0 ? (
                      <p className="text-base text-neu-200 text-center py-8">
                        No lobbying filings found
                      </p>
                    ) : (
                      filings.map((filing, index) => (
                        <div
                          key={index}
                          className="bg-dark-neu-500/50 rounded-lg p-4 border border-dark-neu-600"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <FaBuilding className="text-dark-neu-100 text-xs" />
                                <span className="text-xs text-neu-200 font-semibold">
                                  Registrant
                                </span>
                              </div>
                              <p className="text-sm text-white font-medium">
                                {filing.registrant || 'Unknown'}
                              </p>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <FaCalendar className="text-dark-neu-100 text-xs" />
                                <span className="text-xs text-neu-200 font-semibold">
                                  Filing Date
                                </span>
                              </div>
                              <p className="text-sm text-white font-medium">
                                {formatDate(filing.filingDate)}
                              </p>
                            </div>
                          </div>
                          {filing.client && (
                            <div className="mb-2">
                              <span className="text-xs text-neu-200 font-semibold">Client: </span>
                              <span className="text-sm text-white">{filing.client}</span>
                            </div>
                          )}
                          {filing.amount && (
                            <div className="mb-2">
                              <span className="text-xs text-neu-200 font-semibold">Amount: </span>
                              <span className="text-sm text-green-400 font-bold">
                                {formatCurrency(filing.amount)}
                              </span>
                            </div>
                          )}
                          {filing.issueAreas && filing.issueAreas.length > 0 && (
                            <div>
                              <span className="text-xs text-neu-200 font-semibold block mb-1">
                                Issue Areas:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {filing.issueAreas.map((area, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-1 text-xs bg-dark-neu-400 text-white rounded-md border border-dark-neu-500"
                                  >
                                    {area}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-4 border-t border-dark-neu-500">
                  <p className="text-sm text-neu-200 text-center">
                    Data source: Senate Lobbying Disclosure Act Database (LDA)
                  </p>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default LobbyingHistoryModal;
