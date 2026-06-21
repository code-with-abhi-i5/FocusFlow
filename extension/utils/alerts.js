/**
 * FocusFlow — Productivity Alerts
 * Chrome notifications for productivity insights and limit warnings.
 */

import { getDomainTimeToday, getTodayData, getGoals, getSettings } from './storage.js';
import { classifyDomain, isSocialMedia } from './categories.js';
import { formatTime } from './tracker.js';

// Track which alerts have been shown to avoid spamming
let alertsShown = new Set();

/**
 * Reset daily alerts (call at midnight or on new day)
 */
export function resetDailyAlerts() {
  alertsShown.clear();
}

/**
 * Check all alert conditions and fire notifications as needed
 */
export async function checkAlerts() {
  const settings = await getSettings();
  if (!settings.notificationsEnabled) return;

  await checkSiteLimits();
  await checkSocialMediaLimit();
  await checkProductiveGoal();
}

/**
 * Check if any unproductive site has exceeded time thresholds
 */
async function checkSiteLimits() {
  const dayData = await getTodayData();
  const thresholds = [30, 45, 60, 90, 120]; // minutes

  for (const [domain, data] of Object.entries(dayData)) {
    const category = classifyDomain(domain);
    if (category !== 'unproductive') continue;

    const minutesSpent = Math.floor(data.timeSpent / 60);

    for (const threshold of thresholds) {
      const alertKey = `site_${domain}_${threshold}`;
      if (minutesSpent >= threshold && !alertsShown.has(alertKey)) {
        alertsShown.add(alertKey);
        showNotification(
          '⏰ Time Check',
          `You've spent ${formatTime(data.timeSpent)} on ${domain} today.`,
          'time_warning'
        );
        break; // Only show the highest unshown threshold
      }
    }
  }
}

/**
 * Check if total social media time exceeds the daily limit
 */
async function checkSocialMediaLimit() {
  const goals = await getGoals();
  const dayData = await getTodayData();

  let totalSocialMinutes = 0;
  for (const [domain, data] of Object.entries(dayData)) {
    if (isSocialMedia(domain)) {
      totalSocialMinutes += data.timeSpent / 60;
    }
  }

  const limitMinutes = goals.socialMediaLimit || 120;
  const percentUsed = (totalSocialMinutes / limitMinutes) * 100;

  // Alert at 75% and 100%
  if (percentUsed >= 100 && !alertsShown.has('social_100')) {
    alertsShown.add('social_100');
    showNotification(
      '🚫 Social Media Limit Reached',
      `You've used ${formatTime(totalSocialMinutes * 60)} of your ${formatTime(limitMinutes * 60)} social media limit. Consider activating Focus Mode!`,
      'limit_reached'
    );
  } else if (percentUsed >= 75 && !alertsShown.has('social_75')) {
    alertsShown.add('social_75');
    showNotification(
      '⚠️ Social Media Warning',
      `You've used 75% of your daily social media limit (${formatTime(totalSocialMinutes * 60)} / ${formatTime(limitMinutes * 60)}).`,
      'limit_warning'
    );
  }
}

/**
 * Check productive hours goal progress — encourage when doing well
 */
async function checkProductiveGoal() {
  const goals = await getGoals();
  const dayData = await getTodayData();

  let productiveSeconds = 0;
  for (const [domain, data] of Object.entries(dayData)) {
    if (classifyDomain(domain) === 'productive') {
      productiveSeconds += data.timeSpent;
    }
  }

  const targetSeconds = (goals.dailyProductiveHours || 4) * 3600;
  const percentDone = (productiveSeconds / targetSeconds) * 100;

  if (percentDone >= 100 && !alertsShown.has('productive_100')) {
    alertsShown.add('productive_100');
    showNotification(
      '🎉 Goal Achieved!',
      `You've hit your daily productive goal of ${goals.dailyProductiveHours}h! Great work!`,
      'goal_achieved'
    );
  } else if (percentDone >= 50 && !alertsShown.has('productive_50')) {
    alertsShown.add('productive_50');
    showNotification(
      '💪 Halfway There!',
      `You're 50% through your productive goal. Keep going!`,
      'goal_progress'
    );
  }
}

/**
 * Show a Chrome notification
 */
function showNotification(title, message, id) {
  chrome.notifications.create(`focusflow_${id}_${Date.now()}`, {
    type: 'basic',
    iconUrl: '../icons/icon128.png',
    title: title,
    message: message,
    priority: 1
  });
}
