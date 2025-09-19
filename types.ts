export enum RiskLevel {
  SAFE = 'SAFE',
  SUSPICIOUS = 'SUSPICIOUS',
  MALICIOUS = 'MALICIOUS',
  UNKNOWN = 'UNKNOWN'
}

export interface AnalysisDetails {
  domainAge: string;
  domainAnalysis: string;
  urlStructure: string;
  contentClues: string;
  threatIntelligence: string;
}

export interface AnalysisResult {
  url: string;
  riskLevel: RiskLevel;
  summary: string;
  score: number;
  details: AnalysisDetails;
  isCached?: boolean;
}

export enum AppErrorType {
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  title: string;
  message: string;
  type: AppErrorType;
}