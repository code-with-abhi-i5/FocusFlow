/**
 * FocusFlow — AI Insights (Gemini)
 * Generates productivity tips based on tracking data using Gemini Flash.
 */

import { getTodayData, getTopDomainsToday, getSettings } from './storage.js';
import { formatTime } from './tracker.js';

// Cache to avoid hitting API too often (cache for 1 hour)
let cachedInsight = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 60 * 60 * 1000;

/**
 * Generate a short AI productivity insight using the Gemini API.
 * Uses the user's API key from settings.
 */
export async function generateInsight() {
  try {
    // Return cached insight if valid
    if (cachedInsight && Date.now() - lastFetchTime < CACHE_DURATION_MS) {
      return { insight: cachedInsight };
    }

    const settings = await getSettings();
    if (!settings.geminiApiKey) {
      return { error: 'Please set your Gemini API key in Options.' };
    }

    // Gather context data for the prompt
    const topDomains = await getTopDomainsToday(5);
    const dayData = await getTodayData();
    
    // Check if we have enough data
    if (!topDomains || topDomains.length === 0) {
      return { insight: "Start working to get personalized AI insights! 🌱" };
    }

    // Format data for the prompt
    let dataContext = "Today's usage:\n";
    topDomains.forEach(d => {
      const category = dayData[d.domain]?.category || 'neutral';
      dataContext += `- ${d.domain} (${category}): ${formatTime(d.timeSpent)}\n`;
    });

    const prompt = `
You are a top-tier productivity coach named FocusFlow AI.
Analyze the user's web usage data and give ONE short, punchy, actionable tip (max 30 words).
Use a friendly, motivating tone with emojis. Don't be generic. If they spent a lot of time on unproductive sites, gently encourage Focus Mode. If they were productive, praise them.
If they just started, encourage them to keep going.

Data:
${dataContext}
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${settings.geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 60,
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API Error:', errText);
      try {
        const errJson = JSON.parse(errText);
        return { error: `API Error: ${errJson.error?.message || errText}` };
      } catch (e) {
        return { error: `API Error: ${errText}` };
      }
    }

    const data = await response.json();
    const insightText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (insightText) {
      cachedInsight = insightText.trim();
      lastFetchTime = Date.now();
      return { insight: cachedInsight };
    } else {
      console.error('FocusFlow AI Raw Response:', data);
      return { error: `Format Error. Raw response: ${JSON.stringify(data)}` };
    }

  } catch (err) {
    console.error('FocusFlow AI Error:', err);
    return { error: `Failed to connect to AI: ${err.message || err}` };
  }
}
