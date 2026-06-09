import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';

// Initialize the Google Generative AI client
// We allow running without an API key by returning null (useful for fallback or testing)
export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const getGeminiModel = (modelName: string = 'gemini-1.5-flash') => {
  if (!genAI) {
    console.warn('Gemini API key is not configured. AI features will fallback to mock responses.');
    return null;
  }
  return genAI.getGenerativeModel({ model: modelName });
};
