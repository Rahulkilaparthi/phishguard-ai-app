import React, { useEffect, useState } from 'react';
import type { AnalysisResult } from '../types';
import { RiskLevel } from '../types';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { ShieldExclamationIcon } from './icons/ShieldExclamationIcon';
import { ShieldXIcon } from './icons/ShieldXIcon';

interface AnalysisResultDisplayProps {
  result: AnalysisResult;
}

const riskLevelConfig = {
  [RiskLevel.SAFE]: {
    label: 'Safe',
    icon: ShieldCheckIcon,
    colorClasses: 'text-green-400',
    bgClasses: 'bg-green-500/10 border-green-500/50',
  },
  [RiskLevel.SUSPICIOUS]: {
    label: 'Suspicious',
    icon: ShieldExclamationIcon,
    colorClasses: 'text-yellow-400',
    bgClasses: 'bg-yellow-500/10 border-yellow-500/50',
  },
  [RiskLevel.MALICIOUS]: {
    label: 'Malicious',
    icon: ShieldXIcon,
    colorClasses: 'text-red-400',
    bgClasses: 'bg-red-500/10 border-red-500/50',
  },
  [RiskLevel.UNKNOWN]: {
    label: 'Unknown',
    icon: ShieldExclamationIcon,
    colorClasses: 'text-gray-400',
    bgClasses: 'bg-gray-500/10 border-gray-500/50',
  }
};

const DetailCard: React.FC<{ title: string; content: string }> = ({ title, content }) => (
  <div className="bg-[#1c2135] p-4 rounded-lg border border-blue-500/10">
    <h4 className="font-semibold text-blue-300 text-md mb-2">{title}</h4>
    <p className="text-sm text-gray-300">{content}</p>
  </div>
);

export const AnalysisResultDisplay: React.FC<AnalysisResultDisplayProps> = ({ result }) => {
  const config = riskLevelConfig[result.riskLevel] || riskLevelConfig[RiskLevel.UNKNOWN];
  const IconComponent = config.icon;
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  const REDIRECT_DELAY_MS = 1500;
  const REDIRECT_DELAY_S = REDIRECT_DELAY_MS / 1000;
  const [countdown, setCountdown] = useState(REDIRECT_DELAY_S);


  useEffect(() => {
    // Only redirect if the URL is safe AND the result is not from the cache (i.e., we are online).
    if (result.riskLevel === RiskLevel.SAFE && !result.isCached) {
      setIsRedirecting(true);
      setCountdown(REDIRECT_DELAY_S);

      const redirectTimer = setTimeout(() => {
        window.location.href = result.url;
      }, REDIRECT_DELAY_MS);

      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          const newTime = prev - 0.1;
          if (newTime <= 0) {
            clearInterval(countdownInterval);
            return 0;
          }
          return newTime;
        });
      }, 100);

      // Cleanup function to clear timers if the component unmounts
      return () => {
        clearTimeout(redirectTimer);
        clearInterval(countdownInterval);
      };
    }
  }, [result]);

  if (isRedirecting) {
    const progressPercentage = ((REDIRECT_DELAY_S - countdown) / REDIRECT_DELAY_S) * 100;

    return (
       <div className={`mt-8 p-6 bg-[#121828] rounded-xl border ${config.bgClasses} shadow-lg animate-fade-in`}>
          <div className="flex flex-col items-center text-center gap-4">
            <IconComponent className={`h-12 w-12 ${config.colorClasses}`} />
            <div className="w-full">
              <h2 className={`text-2xl font-bold ${config.colorClasses}`}>URL is Safe</h2>
              <p className="text-gray-300 mt-2">
                Redirecting you in {countdown.toFixed(1)}s...
              </p>
               <div className="w-full bg-gray-700/50 rounded-full h-2.5 mt-4 overflow-hidden">
                <div 
                  className="bg-green-500 h-2.5 rounded-full" 
                  style={{ width: `${progressPercentage}%`, transition: 'width 0.1s linear' }}
                ></div>
              </div>
              <p className="text-sm text-gray-400 break-all mt-4" title={result.url}>{result.url}</p>
            </div>
          </div>
        </div>
    );
  }

  return (
    <div className={`mt-8 p-6 bg-[#121828] rounded-xl border ${config.bgClasses} shadow-lg animate-fade-in`}>
      {result.isCached && (
        <div className="mb-4 p-3 text-sm text-yellow-200 bg-yellow-600/30 rounded-lg flex items-center gap-3" role="status">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>You are offline. This is a cached result and may be outdated.</span>
        </div>
      )}
      <header className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-gray-700 pb-4 mb-6">
        <IconComponent className={`h-12 w-12 ${config.colorClasses}`} />
        <div className="flex-grow">
          <h2 className={`text-2xl font-bold ${config.colorClasses}`}>{config.label}</h2>
          <p className="text-sm text-gray-400 break-all" title={result.url}>{result.url}</p>
        </div>
        <div className={`text-3xl font-bold ${config.colorClasses}`}>
          {result.score}
          <span className="text-lg font-medium text-gray-500">/100</span>
        </div>
      </header>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Summary</h3>
          <p className="text-gray-300 bg-[#1c2135] p-4 rounded-lg">{result.summary}</p>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Detailed Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailCard title="Domain Age" content={result.details.domainAge} />
            <DetailCard title="Domain Analysis" content={result.details.domainAnalysis} />
            <DetailCard title="URL Structure" content={result.details.urlStructure} />
            <DetailCard title="Content Clues" content={result.details.contentClues} />
            <DetailCard title="Threat Intelligence" content={result.details.threatIntelligence} />
          </div>
        </div>
      </div>
    </div>
  );
};