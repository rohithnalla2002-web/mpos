import { GoogleGenAI } from "@google/genai";
import { MenuItem } from "../types";

// Helper to safely get API key
const getApiKey = () => process.env.API_KEY || '';

export const getRecommendation = async (cartItems: MenuItem[], fullMenu: MenuItem[]): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "Our chef suggests pairing this with a refreshing drink!";

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const cartNames = cartItems.map(i => i.name).join(', ');
    const menuContext = fullMenu.map(i => `${i.name} (${i.category})`).join(', ');

    const prompt = `
      You are a world-class waiter at a fine dining restaurant.
      The customer has the following items in their cart: ${cartNames}.
      
      Based on the full menu available: ${menuContext}.
      
      Recommend ONE single item from the menu that perfectly complements their current order.
      Explain why in one short, appetizing sentence (max 20 words).
      Do not use markdown. Just plain text.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error: any) {
    // Silently fail if API key is invalid or service is unavailable
    if (error?.error?.code === 400 || error?.error?.status === 'INVALID_ARGUMENT') {
      // Invalid API key - return fallback message
      return "Try our signature desserts to finish your meal!";
    }
    // Only log unexpected errors
    if (error?.error?.code !== 400) {
      console.error("AI Recommendation failed:", error);
    }
    return "Try our signature desserts to finish your meal!";
  }
};