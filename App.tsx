import React, { useState, useEffect } from 'react';
import { URLInputForm } from './components/URLInputForm';
import { AnalysisResultDisplay } from './components/AnalysisResultDisplay';
import { ErrorDisplay } from './components/ErrorDisplay';
import { analyzeUrl, PhishGuardError } from './services/geminiService';
import type { AnalysisResult, AppError } from './types';
import { AppErrorType } from './types';

function App() {
  const [url, setUrl] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<AppError | null>(null);

  const handleUrlAnalysis = async (urlToAnalyze: string) => {
    // Basic validation to prevent API calls for empty strings.
    if (!urlToAnalyze.trim()) {
        return;
    }
    setIsLoading(true);
    setAnalysisResult(null);
    setError(null);

    try {
      const result = await analyzeUrl(urlToAnalyze);
      setAnalysisResult(result);
    } catch (e) {
      if (e instanceof PhishGuardError) {
          setError({
              title: e.type === AppErrorType.NETWORK_ERROR ? "Network Error" : "Analysis Failed",
              message: e.message,
              type: e.type,
          });
      } else {
          setError({
              title: "An Unexpected Error Occurred",
              message: "Something went wrong that we didn't anticipate. Please refresh and try again.",
              type: AppErrorType.UNKNOWN,
          });
      }
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const urlFromQuery = queryParams.get('url');
    if (urlFromQuery) {
      const decodedUrl = decodeURIComponent(urlFromQuery);
      setUrl(decodedUrl);
      handleUrlAnalysis(decodedUrl);
    }
  }, []); // Empty dependency array ensures this runs only once on mount.


  const handleDismissError = () => {
    setError(null);
    setAnalysisResult(null);
    setUrl('');
  }

  const handleFormSubmit = (newUrl: string) => {
    setUrl(newUrl);
    handleUrlAnalysis(newUrl);
  };

  return (
    <div className="bg-[#0b0f19] min-h-screen text-gray-200 font-sans p-4 sm:p-8 flex flex-col items-center">
      <header className="w-full max-w-4xl text-center mb-8 sm:mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">Phishing Guard AI</h1>
        <p className="mt-3 text-lg text-gray-400">
          Analyze URLs for phishing threats with the power of Google Gemini.
        </p>
      </header>

      <main className="w-full max-w-2xl">
        <URLInputForm 
          url={url}
          setUrl={setUrl}
          onSubmit={handleFormSubmit} 
          isLoading={isLoading} 
        />
        {isLoading && (
          <div className="mt-8 flex justify-center items-center text-gray-400 animate-fade-in">
             <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p>Analyzing... this may take a moment.</p>
          </div>
        )}
        {error && <ErrorDisplay error={error} onDismiss={handleDismissError} />}
        {analysisResult && !isLoading && !error && <AnalysisResultDisplay result={analysisResult} />}
      </main>

      <footer className="w-full max-w-4xl text-center mt-auto pt-8">
        <p className="text-sm text-gray-500">Powered by Google Gemini</p>
      </footer>
    </div>
  );
}

export default App;