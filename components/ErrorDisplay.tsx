import React from 'react';
import type { AppError } from '../types';
import { XCircleIcon } from './icons/XCircleIcon';

interface ErrorDisplayProps {
  error: AppError;
  onDismiss: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onDismiss }) => {
  return (
    <div className="mt-6 bg-status-malicious/10 border-2 border-status-malicious/50 rounded-lg p-4 animate-fade-in" role="alert">
      <div className="flex">
        <div className="flex-shrink-0">
          <XCircleIcon className="h-6 w-6 text-red-400" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-lg font-semibold text-red-300">{error.title}</h3>
          <div className="mt-2 text-sm text-red-400">
            <p>{error.message}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 text-right">
          <button
            onClick={onDismiss}
            className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-secondary focus:ring-red-500 transition-colors"
          >
            Try Again
          </button>
      </div>
    </div>
  );
};
