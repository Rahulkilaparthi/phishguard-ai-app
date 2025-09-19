import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult } from '../types';
import { RiskLevel, AppErrorType } from '../types';

export class PhishGuardError extends Error {
    constructor(message: string, public type: AppErrorType, public originalError?: unknown) {
        super(message);
        this.name = 'PhishGuardError';
    }
}

// --- IMPORTANT SECURITY NOTE ---
// The API key is included here for demonstration purposes only.
// Exposing an API key in client-side code is a significant security risk.
// Anyone can view your app's source code, find your key, and use it, potentially incurring costs.
//
// For a production application, you MUST:
// 1.  Create a backend proxy or a serverless function.
// 2.  Store the API key as an environment variable on that server.
// 3.  Have your frontend app call your backend, which then securely calls the Google Gemini API.
// This ensures the key is never exposed to the public.
//
// The key below is lightly obfuscated using Base64 to prevent it from being immediately searchable in plaintext.
// This is NOT a substitute for proper backend security.
const getApiKey = (): string => {
  const encodedKey = 'QUl6YVN5QXJtN0tuS2syMHBoSW5tbU56WHBIRYdZY2xwNjFRcklZ';
  try {
    return atob(encodedKey);
  } catch (e) {
    console.error('Failed to decode API key. The key may be malformed.', e);
    // Return a clearly invalid key to ensure API calls fail predictably if decoding fails.
    return 'INVALID_API_KEY_DECODING_FAILED';
  }
};


const ai = new GoogleGenAI({ apiKey: getApiKey() });

export const analyzeUrl = async (url: string): Promise<AnalysisResult> => {
  const cacheKey = `phishguard:${url}`;

  try {
    const prompt = `
      Analyze the following URL for potential phishing threats: ${url}

      Act as a world-class cybersecurity analyst. Evaluate the URL based on the following criteria:
      1.  **Domain Analysis:**
          - **CRITICAL:** Determine the domain's registration date/age. If the domain is less than 6 months old, flag it as a significant risk factor. State the approximate age or registration date if found.
          - Check TLD reputation (.zip, .mov are suspicious), subdomain complexity, and character impersonation (homoglyphs).
      2.  **URL Structure:** Look for excessive length, use of IP addresses, unnecessary redirection, keyword stuffing ('login', 'secure', 'account'), and brand impersonation.
      3.  **Content Clues (Hypothetical):** Infer potential content. Does it suggest urgency, credential harvesting, or fake offers?
      4.  **Threat Intelligence Context:** Cross-reference with known phishing patterns, even if you don't have a live database.

      Based on your analysis, provide a risk level (SAFE, SUSPICIOUS, MALICIOUS), a confidence score (0-100), a concise summary, and a detailed breakdown.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: {
              type: Type.STRING,
              enum: [RiskLevel.SAFE, RiskLevel.SUSPICIOUS, RiskLevel.MALICIOUS, RiskLevel.UNKNOWN],
              description: 'The overall risk assessment level.'
            },
            summary: {
              type: Type.STRING,
              description: 'A concise, one-sentence summary of the findings.'
            },
            score: {
              type: Type.INTEGER,
              description: 'A risk score from 0 (safe) to 100 (highly malicious).'
            },
            details: {
              type: Type.OBJECT,
              properties: {
                domainAge: {
                  type: Type.STRING,
                  description: "Analysis of the domain's registration age. Note if it is suspiciously new (e.g., less than 6 months old)."
                },
                domainAnalysis: {
                  type: Type.STRING,
                  description: 'Detailed analysis of the domain name, TLD, and subdomains (excluding age).'
                },
                urlStructure: {
                  type: Type.STRING,
                  description: 'Analysis of the URL path, query parameters, and overall structure.'
                },
                contentClues: {
                  type: Type.STRING,
                  description: 'Inference about potential content based on the URL.'
                },
                threatIntelligence: {
                  type: Type.STRING,
                  description: 'Comparison against known threat patterns and intelligence.'
                }
              },
              required: ['domainAge', 'domainAnalysis', 'urlStructure', 'contentClues', 'threatIntelligence']
            }
          },
          required: ['riskLevel', 'summary', 'score', 'details']
        },
      },
    });

    const jsonText = response.text.trim();
    const parsedResult = JSON.parse(jsonText);

    // Cache the successful result
    try {
      localStorage.setItem(cacheKey, JSON.stringify(parsedResult));
    } catch (cacheError) {
      console.error("Failed to cache analysis result:", cacheError);
      // Non-critical error, so we don't block the user
    }
    
    return {
      ...parsedResult,
      url: url // Add the original URL to the result
    };

  } catch (error: unknown) {
    console.error("Error analyzing URL with Gemini:", error);

    // If offline, first try to serve a cached result before throwing an error.
    if (!navigator.onLine) {
        try {
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
                console.log("Serving from cache for URL:", url);
                const cachedResult = JSON.parse(cachedData);
                return {
                    ...cachedResult,
                    url: url,
                    isCached: true
                };
            }
        } catch (cacheError) {
             console.error("Failed to retrieve or parse from cache:", cacheError);
             // Fall through to the main offline error if cache retrieval fails
        }
        
        // If no cached data is available, throw the network error.
        throw new PhishGuardError(
            "You appear to be offline. Please check your internet connection and try again.",
            AppErrorType.NETWORK_ERROR,
            error
        );
    }
    
    if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('api key not valid') || errorMessage.includes('invalid_api_key')) {
             throw new PhishGuardError(
                "The configured API key is invalid. Please check the key and try again.",
                AppErrorType.API_ERROR,
                error
            );
        }
        if (errorMessage.includes('quota')) {
             throw new PhishGuardError(
                "The API quota has been exceeded. Please try again later.",
                AppErrorType.API_ERROR,
                error
            );
        }
    }
    
    throw new PhishGuardError(
        "An unexpected error occurred while communicating with the analysis service. Please try again.",
        AppErrorType.UNKNOWN,
        error
    );
  }
};