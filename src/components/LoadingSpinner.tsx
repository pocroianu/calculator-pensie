import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 ${className}`}
      role="status"
      aria-label="Loading"
    >
      <Loader2
        className={`${sizeClasses[size]} animate-spin text-blue-600`}
        aria-hidden="true"
      />
      {message && (
        <span className="text-sm text-gray-600 dark:text-dark-text-secondary">{message}</span>
      )}
    </div>
  );
};

// Modal-specific loading fallback
export const ModalLoadingFallback: React.FC<{ message?: string }> = ({
  message = 'Loading...',
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-bg-secondary rounded-lg p-8 shadow-xl">
        <LoadingSpinner size="lg" message={message} />
      </div>
    </div>
  );
};

// Panel-specific loading fallback
export const PanelLoadingFallback: React.FC<{ message?: string }> = ({
  message = 'Loading...',
}) => {
  return (
    <div className="flex items-center justify-center p-8">
      <LoadingSpinner size="md" message={message} />
    </div>
  );
};

// Chart-specific loading fallback
export const ChartLoadingFallback: React.FC = () => {
  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
        <div className="h-5 w-32 bg-gray-200 dark:bg-dark-bg-tertiary rounded animate-pulse" />
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col items-center">
            <div className="h-4 w-40 bg-gray-200 dark:bg-dark-bg-tertiary rounded animate-pulse mb-4" />
            <div className="w-[200px] h-[200px] bg-gray-100 dark:bg-dark-bg rounded-full animate-pulse" />
          </div>
          <div className="flex flex-col items-center">
            <div className="h-4 w-40 bg-gray-200 dark:bg-dark-bg-tertiary rounded animate-pulse mb-4" />
            <div className="w-[200px] h-[200px] bg-gray-100 dark:bg-dark-bg rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
