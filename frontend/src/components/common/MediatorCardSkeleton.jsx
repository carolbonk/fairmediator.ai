/**
 * MediatorCardSkeleton - Loading skeleton for mediator cards
 * Provides visual feedback while mediator data is loading
 * Features shimmer animation for better UX
 */

import './SkeletonShimmer.css';

const MediatorCardSkeleton = ({ count = 3 }) => {
  return (
    <>
      {[...Array(count)].map((_, index) => (
        <div
          key={index}
          className="bg-neu-200 rounded-xl p-4 shadow-neu border-2 border-neu-300"
        >
          {/* Header with avatar and name */}
          <div className="flex items-center gap-3 mb-3">
            {/* Avatar skeleton */}
            <div className="w-12 h-12 skeleton-shimmer rounded-full flex-shrink-0"></div>

            <div className="flex-1 min-w-0">
              {/* Name skeleton */}
              <div className="h-5 skeleton-shimmer rounded w-3/4 mb-2"></div>
              {/* Location skeleton */}
              <div className="h-4 skeleton-shimmer rounded w-1/2"></div>
            </div>
          </div>

          {/* Specialization skeleton */}
          <div className="mb-3">
            <div className="h-4 skeleton-shimmer rounded w-full mb-2"></div>
            <div className="h-4 skeleton-shimmer rounded w-5/6"></div>
          </div>

          {/* Stats skeleton (rating, experience, rate) */}
          <div className="flex items-center gap-3 mb-3">
            <div className="h-4 skeleton-shimmer rounded w-20"></div>
            <div className="h-4 skeleton-shimmer rounded w-24"></div>
            <div className="h-4 skeleton-shimmer rounded w-20"></div>
          </div>

          {/* Badges skeleton */}
          <div className="flex items-center gap-2">
            <div className="h-8 skeleton-shimmer rounded-full w-24"></div>
            <div className="h-8 skeleton-shimmer rounded-full w-20"></div>
          </div>
        </div>
      ))}
    </>
  );
};

export default MediatorCardSkeleton;
