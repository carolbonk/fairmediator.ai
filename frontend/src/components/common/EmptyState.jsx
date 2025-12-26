/**
 * Reusable Empty State Component
 * DRY utility for consistent "no data" messaging
 */

import React from 'react';

const EmptyState = ({
  icon = null,
  title = 'No Data Available',
  description = 'There is no data to display at this time.',
  action = null,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      {icon && (
        <div className="mb-4 text-gray-400">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-700 mb-2">
        {title}
      </h3>
      <p className="text-gray-500 mb-4 max-w-md">
        {description}
      </p>
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
