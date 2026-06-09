import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';

export const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const getGeminiModel = (modelName: string = 'gemini-3.5-flash') => {
  if (!genAI) {
    console.warn('Gemini API key is not configured. AI features will fallback to mock responses.');
    return null;
  }
  return {
    generateContent: (contents: string) => genAI.models.generateContent({ model: modelName, contents }),
  };
};
