import type { Insight } from '../types';

/**
 * Generate personalized rule-based insights from current productivity data.
 * Ready for swapping in OpenAI/Gemini APIs in the future.
 */
export function generateInsights(
  score: number,
  totalMinutes: number,
  productiveMinutes: number,
  unproductiveMinutes: number,
  topDomains: { domain: string; timeSpent: number; category: any }[]
): Insight[] {
  const insights: Insight[] = [];

  // Insight 1: General assessment based on productivity score
  if (totalMinutes > 0) {
    if (score >= 75) {
      insights.push({
        id: 'score-high',
        type: 'success',
        title: 'Deep Work Masterclass 🎯',
        description: `Your productivity score is outstanding at ${score}%. You are maintaining a highly concentrated flow state. Keep it up!`,
        timestamp: new Date()
      });
    } else if (score >= 50) {
      insights.push({
        id: 'score-medium',
        type: 'info',
        title: 'Steady Focus 📈',
        description: `You are in a balanced state with a ${score}% score. A few minor distractions were logged, but you remain mostly on task.`,
        timestamp: new Date()
      });
    } else {
      insights.push({
        id: 'score-low',
        type: 'warning',
        title: 'Distraction Alert ⚠️',
        description: `Your productivity score dropped to ${score}%. Social media or entertainment is pulling you out of focus. Consider toggling Focus Mode.`,
        timestamp: new Date()
      });
    }
  } else {
    insights.push({
      id: 'no-time',
      type: 'info',
      title: 'Awaiting Focus Flow 🌱',
      description: 'No active browsing session duration has been recorded today. Activate the extension and start working to get AI insights.',
      timestamp: new Date()
    });
    return insights;
  }

  // Insight 2: Check for specific high unproductive sites
  const topDistraction = topDomains.find(d => d.category === 'unproductive');
  if (topDistraction && topDistraction.timeSpent > 15) {
    const mins = Math.round(topDistraction.timeSpent);
    insights.push({
      id: 'distraction-leak',
      type: 'warning',
      title: `Distraction Leak: ${topDistraction.domain} 🛑`,
      description: `You spent ${mins} minutes on ${topDistraction.domain} today. Limiting this could reclaim significant productive hours.`,
      timestamp: new Date()
    });
  }

  // Insight 3: High productive volume praise
  if (productiveMinutes > 180) {
    const hours = (productiveMinutes / 60).toFixed(1);
    insights.push({
      id: 'high-productivity-volume',
      type: 'success',
      title: 'Incredible Output Volume! 🔥',
      description: `You logged ${hours} hours of active productive work. You've made massive progress today. Remember to take a screen break!`,
      timestamp: new Date()
    });
  }

  // Insight 4: General optimization advice
  if (unproductiveMinutes > 45 && score < 65) {
    insights.push({
      id: 'focus-mode-advice',
      type: 'info',
      title: 'Actionable Advice: Use Pomodoro ⏱️',
      description: 'Distractions are building up. We recommend starting a 25-minute Focus Session to block all social apps and lock in your concentration.',
      timestamp: new Date()
    });
  }

  return insights;
}
