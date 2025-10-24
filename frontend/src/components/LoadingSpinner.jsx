import React from 'react';

const LoadingSpinner = ({ fullScreen = true, size = 'large' }) => {
  const sizeClasses = {
    small: 'h-8 w-8 border-2',
    medium: 'h-12 w-12 border-3',
    large: 'h-16 w-16 border-4',
  };

  const spinner = (
    <div
      className={`${sizeClasses[size]} border-primary-600 border-t-transparent rounded-full animate-spin`}
    />
  );

  if (!fullScreen) {
    return <div className="flex justify-center items-center p-4">{spinner}</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        {spinner}
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;

