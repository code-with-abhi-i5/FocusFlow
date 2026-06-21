/**
 * FocusFlow — Productivity Alerts
 * Chrome notifications for productivity insights, limit warnings, streak
 * milestones, and motivational reminders.
 */

import { getDomainTimeToday, getTodayData, getGoals, getSettings, getStreaks, getSiteLimits, getAutoBlockedDomains, saveAutoBlockedDomains, getFocusMode } from './storage.js';
import { updateBlockRules } from './blocker.js';
import { classifyDomain, isSocialMedia } from './categories.js';
import { formatTime } from './tracker.js';

// Track which alerts have been shown to avoid spamming
let alertsShown = new Set();

// Motivational quotes (Hindi + English mix)
const MOTIVATIONAL_QUOTES = [
  'Ek kadam aur — tu kar sakta hai! 💪',
  'Focus karo, results zaroor milenge. 🎯',
  'Hard work kabhi bekar nahi jaata. 🔥',
  'Aaj ki mehnat kal ka result hai. ✨',
  'Small steps every day = big results. 🚀',
  'Stay focused, stay hungry. 🍅',
  'Distraction temporary hai, regret permanent. ⚡',
  'Tu capable hai — prove it to yourself. 💎',
  'One more hour of work = one step closer to your goal.',
  'Champions bhi kaam karte hain jab mann nahi karta.',
  'Deep work is your superpower. 🧠',
  'The best time to focus is RIGHT NOW. ⏰',
  'Jo aaj karta hai, wahi kal enjoy karta hai. 🌟',
  'Progress over perfection. Keep moving! 🏃',
  'Your future self will thank you. 🙌',
  'Sab kuch milta hai — sirf karna padta hai. 💯',
  'Turn off distractions, turn on your potential. 🔕',
  'Excellence is a habit. Build it today.',
  'Kaam karo aaj, kal khud bolega. ✅',
  'Every expert was once a beginner. Keep going! 🌱'
];

/**
 * Reset daily alerts (call at midnight or on new day)
 */
export function resetDailyAlerts() {
  alertsShown.clear();
}

/**
 * Check all alert conditions and fire notifications as needed
 * @param {object} [streaks] — optional pre-fetched streaks data
 */
export async function checkAlerts(streaks) {
  const settings = await getSettings();
  if (!settings.notificationsEnabled) return;

  await checkSiteLimits();
  await checkSocialMediaLimit();
  await checkProductiveGoal();
  await checkStreakNotifications(streaks);
  await checkMotivationalReminder();
}

/**
 * Check if any unproductive site has exceeded time thresholds
 */
async function checkSiteLimits() {
  const dayData = await getTodayData();
  const limits = await getSiteLimits();
  const autoBlocked = await getAutoBlockedDomains();
  let updatedAutoBlocked = false;

  for (const [domain, limitMins] of Object.entries(limits)) {
    const data = dayData[domain];
    if (!data) continue;

    const minutesSpent = Math.floor(data.timeSpent / 60);
    if (minutesSpent >= limitMins && !autoBlocked.includes(domain)) {
      autoBlocked.push(domain);
      updatedAutoBlocked = true;

      showNotification(
        '🛑 Site Limit Exceeded',
        `You've reached your ${limitMins}m limit for ${domain}. It has been blocked for the rest of the day.`,
        `limit_block_${domain}`
      );
    } else if (minutesSpent >= limitMins * 0.8 && !alertsShown.has(`limit_warn_${domain}`)) {
      // 80% warning
      alertsShown.add(`limit_warn_${domain}`);
      showNotification(
        '⚠️ Limit Approaching',
        `You have used 80% of your daily limit for ${domain}.`,
        `limit_warn_${domain}`
      );
    }
  }

  if (updatedAutoBlocked) {
    await saveAutoBlockedDomains(autoBlocked);
    // Apply rules
    const focusMode = await getFocusMode();
    const combined = new Set([...(focusMode.active ? focusMode.blockedDomains : []), ...autoBlocked]);
    await updateBlockRules(Array.from(combined));
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
      `You've hit your daily productive goal of ${goals.dailyProductiveHours}h! Incredible work today!`,
      'goal_achieved'
    );
  } else if (percentDone >= 75 && !alertsShown.has('productive_75')) {
    alertsShown.add('productive_75');
    showNotification(
      '💪 Almost There!',
      `You're 75% through your productive goal. Keep pushing!`,
      'goal_75'
    );
  } else if (percentDone >= 50 && !alertsShown.has('productive_50')) {
    alertsShown.add('productive_50');
    showNotification(
      '🔥 Halfway There!',
      `You're 50% through your productive goal. Great momentum!`,
      'goal_progress'
    );
  }
}

/**
 * Check streak milestones and send motivational notifications
 * @param {object} [streaks]
 */
async function checkStreakNotifications(streaks) {
  if (!streaks) {
    streaks = await getStreaks();
  }
  const streak = streaks?.currentStreak || 0;
  if (streak === 0) return;

  const milestones = [3, 5, 7, 14, 21, 30, 60, 100];
  for (const milestone of milestones) {
    const key = `streak_${milestone}`;
    if (streak === milestone && !alertsShown.has(key)) {
      alertsShown.add(key);
      const messages = {
        3: '3-day streak! Acha shuruat hai! 🔥',
        5: '5-day streak! Tu serious hai productivity ke baare mein! 💪',
        7: 'Ek hafta complete! Tu unstoppable hai! 🚀',
        14: '2 weeks streak! Habit ban gayi! 🏆',
        21: '21 days! Science says this is now a habit! 🧠',
        30: 'Ek mahina! Legendary! 👑',
        60: '60-day streak! You are an absolute machine! 🤖',
        100: '100-day streak! INCREDIBLE! 🌟 Hall of fame!'
      };
      showNotification(
        `🔥 ${milestone}-Day Streak!`,
        messages[milestone] || `${milestone}-day productivity streak! Keep it up!`,
        `streak_milestone_${milestone}`
      );
      break;
    }
  }
}

/**
 * Send a random motivational reminder every ~3 hours if user has been idle
 * or spending time on unproductive sites
 */
async function checkMotivationalReminder() {
  const dayData = await getTodayData();

  let unproductiveSeconds = 0;
  for (const [domain, data] of Object.entries(dayData)) {
    if (classifyDomain(domain) === 'unproductive') {
      unproductiveSeconds += data.timeSpent;
    }
  }

  // Fire a motivational quote if unproductive time > 1.5 hours
  const thresholds = [90, 150, 210]; // minutes of unproductive time
  for (const threshold of thresholds) {
    const key = `motivational_${threshold}`;
    if (unproductiveSeconds / 60 >= threshold && !alertsShown.has(key)) {
      alertsShown.add(key);
      const quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
      showNotification(
        '💡 FocusFlow Reminder',
        quote,
        `motivational_${threshold}`
      );
      break;
    }
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

