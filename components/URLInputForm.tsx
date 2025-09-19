import React, { useState } from 'react';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface URLInputFormProps {
  url: string;
  setUrl: (url: string) => void;
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export const URLInputForm: React.FC<URLInputFormProps> = ({ url, setUrl, onSubmit, isLoading }) => {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    let processedUrl = url.trim();

    if (!processedUrl) {
      setError("Please enter a URL.");
      return;
    }

    // Automatically prepend https:// if no protocol is present
    if (!/^https?:\/\//i.test(processedUrl)) {
      processedUrl = `https://${processedUrl}`;
      setUrl(processedUrl); // Update the input field to show the corrected URL
    }

    try {
      // Final validation for URL format after potential correction
      new URL(processedUrl);
    } catch (_) {
      setError("Please enter a valid URL (e.g., example.com).");
      return;
    }
    
    onSubmit(processedUrl);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="example.com"
          disabled={isLoading}
          className="w-full px-4 py-3 bg-[#1c2135] border-2 border-blue-500/20 rounded-lg text-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-colors duration-200 placeholder-gray-500 disabled:opacity-50"
          aria-label="URL to analyze"
        />
      </div>
      {error && <p className="text-red-400 text-sm animate-fade-in">{error}</p>}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center items-center px-4 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0b0f19] focus:ring-blue-500 transition-colors duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <SpinnerIcon className="mr-2 h-5 w-5" />
            Analyzing...
          </>
        ) : (
          'Analyze URL'
        )}
      </button>
    </form>
  );
};