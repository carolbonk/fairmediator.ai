/**
 * DashboardSkeleton - Loading skeleton for dashboard page
 * Displays placeholder UI while dashboard data loads
 * Features shimmer animation for better UX
 */

import './SkeletonShimmer.css';

const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="bg-neu-200 rounded-xl p-6 shadow-neu">
        <div className="h-8 skeleton-shimmer rounded w-64 mb-4"></div>
        <div className="h-5 skeleton-shimmer rounded w-96"></div>
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-neu-200 rounded-xl p-6 shadow-neu border-2 border-neu-300"
          >
            <div className="h-6 skeleton-shimmer rounded w-3/4 mb-3"></div>
            <div className="h-10 skeleton-shimmer rounded w-1/2"></div>
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="bg-neu-200 rounded-xl p-6 shadow-neu border-2 border-neu-300">
        <div className="h-6 skeleton-shimmer rounded w-48 mb-6"></div>
        <div className="h-64 skeleton-shimmer rounded"></div>
      </div>

      {/* Table skeleton */}
      <div className="bg-neu-200 rounded-xl p-6 shadow-neu border-2 border-neu-300">
        <div className="h-6 skeleton-shimmer rounded w-56 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-5 skeleton-shimmer rounded w-1/4"></div>
              <div className="h-5 skeleton-shimmer rounded w-1/4"></div>
              <div className="h-5 skeleton-shimmer rounded w-1/4"></div>
              <div className="h-5 skeleton-shimmer rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
