/**
 * FocusFlow — Service Worker (Background Script)
 * Core tracking engine using Manifest V3 event-driven architecture.
 * 
 * Uses chrome.alarms for periodic saves (service workers are ephemeral).
 * Tracks active tab, handles idle/focus states, syncs to Firestore.
 */

import { extractDomain, shouldIgnoreUrl, startTracking, stopTracking, pauseTracking, resumeTracking, flushElapsed, getCurrentSession } from '../utils/tracker.js';
import { updateDomainTime, startSession, endSession, getTodayData, getTodayTotalTime, getTopDomainsToday, cleanupOldData, getSettings, getFocusMode, saveFocusMode, getStreaks, saveStreaks, getTodayKey } from '../utils/storage.js';
import { classifyDomain, initCategories } from '../utils/categories.js';
import { initIdleDetection, isUserActive } from '../utils/idle.js';
import { checkAlerts, resetDailyAlerts } from '../utils/alerts.js';
import { syncToFirestore } from '../utils/sync.js';
import { updateBlockRules, clearBlockRules } from '../utils/blocker.js';

// ── Constants ────────────────────────────────────────────────────────
const ALARM_HEARTBEAT = 'focusflow_heartbeat';
const ALARM_SYNC = 'focusflow_sync';
const ALARM_DAILY_RESET = 'focusflow_daily_reset';
const ALARM_FOCUS_END = 'focusflow_focus_end';
const ALARM_ALERTS = 'focusflow_alerts';
const HEARTBEAT_SECONDS = 10; // flush tracking data every 10s
const SYNC_MINUTES = 0.5; // sync to Firestore every 30 seconds

// ── State (will be lost on service worker restart — rebuilt from events) ──
let currentDomain = null;
let windowFocused = true;
let lastDateKey = getTodayKey();

// ── Initialization ───────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('FocusFlow: Extension installed/updated', details.reason);
  await initialize();
});

chrome.runtime.onStartup.addListener(async () => {
  console.log('FocusFlow: Browser started');
  await initialize();
});

async function initialize() {
  await initCategories();

  // Set up alarms (persistent across service worker restarts)
  await chrome.alarms.clearAll();

  // Heartbeat — periodic tracking flush
  chrome.alarms.create(ALARM_HEARTBEAT, { periodInMinutes: HEARTBEAT_SECONDS / 60 });

  // Firestore sync
  chrome.alarms.create(ALARM_SYNC, { periodInMinutes: SYNC_MINUTES });

  // Alert checks every 5 minutes
  chrome.alarms.create(ALARM_ALERTS, { periodInMinutes: 5 });

  // Daily reset at midnight — approximate with hourly check
  chrome.alarms.create(ALARM_DAILY_RESET, { periodInMinutes: 60 });

  // Init idle detection
  const settings = await getSettings();
  initIdleDetection({
    interval: settings.idleTimeout || 60,
    onStateChange: handleIdleStateChange
  });

  // Check focus mode state
  await checkFocusMode();

  // Clean up old data
  await cleanupOldData();

  // Start tracking the current active tab
  await trackActiveTab();

  // Force a guaranteed 30s sync interval while service worker is awake
  // (chrome.alarms limits to 1 minute minimum in production)
  setInterval(() => {
    handleSync().catch(() => {});
  }, 30 * 1000);
}

// ── Tab Events ───────────────────────────────────────────────────────

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    await handleTabChange(tab.url);
  } catch (e) {
    // Tab might have been closed
    console.warn('FocusFlow: Tab not found', e);
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.active) {
    await handleTabChange(changeInfo.url);
  }
});

// ── Window Events ────────────────────────────────────────────────────

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // All windows lost focus (browser minimized or another app focused)
    windowFocused = false;
    await flushAndSave();
    pauseTracking();
  } else {
    windowFocused = true;
    if (isUserActive()) {
      resumeTracking();
    }
    // Re-check the active tab
    await trackActiveTab();
  }
});

// ── Alarm Handler ────────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener(async (alarm) => {
  switch (alarm.name) {
    case ALARM_HEARTBEAT:
      await handleHeartbeat();
      break;
    case ALARM_SYNC:
      await handleSync();
      break;
    case ALARM_DAILY_RESET:
      await handleDailyReset();
      break;
    case ALARM_FOCUS_END:
      await handleFocusEnd();
      break;
    case ALARM_ALERTS:
      await checkAlerts();
      break;
  }
});

// ── Message Handler (from popup, content, options) ───────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse);
  return true; // Keep channel open for async response
});

async function handleMessage(message, sender) {
  switch (message.type) {
    case 'GET_TODAY_DATA':
      return await getTodayData();

    case 'GET_TODAY_TOTAL':
      return await getTodayTotalTime();

    case 'GET_TOP_DOMAINS':
      return await getTopDomainsToday(message.count || 10);

    case 'GET_CURRENT_SESSION':
      return getCurrentSession();

    case 'GET_PRODUCTIVITY_SCORE':
      return await calculateProductivityScore();

    case 'TOGGLE_FOCUS_MODE':
      return await toggleFocusMode(message.domains, message.duration);

    case 'GET_FOCUS_MODE':
      return await getFocusMode();

    case 'VISIBILITY_CHANGE':
      // From content script
      if (message.hidden) {
        pauseTracking();
      } else if (windowFocused && isUserActive()) {
        resumeTracking();
      }
      return { ok: true };

    case 'FORCE_SYNC':
      await handleSync();
      return { ok: true };

    default:
      return { error: 'Unknown message type' };
  }
}

// ── Core Logic ───────────────────────────────────────────────────────

/**
 * Track the currently active tab
 */
async function trackActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      await handleTabChange(tab.url);
    }
  } catch (e) {
    console.warn('FocusFlow: Could not query active tab', e);
  }
}

/**
 * Handle a tab change — stop old tracking, start new
 */
async function handleTabChange(url) {
  const domain = extractDomain(url);

  if (domain === currentDomain) return; // Same domain, no change

  // Flush and save the previous domain's time
  await flushAndSave();

  if (domain && !shouldIgnoreUrl(url)) {
    currentDomain = domain;
    const category = classifyDomain(domain);
    startTracking(domain);
    await startSession(domain, category);
  } else {
    currentDomain = null;
    stopTracking();
  }
}

/**
 * Flush current tracking data and save to storage
 */
async function flushAndSave() {
  const session = getCurrentSession();
  if (session.domain && session.elapsed > 0) {
    const elapsed = flushElapsed();
    if (elapsed > 0) {
      const category = classifyDomain(session.domain);
      await updateDomainTime(session.domain, elapsed, category);
    }
  }
}

/**
 * Heartbeat — periodic flush of tracking data
 */
async function handleHeartbeat() {
  if (!windowFocused || !isUserActive()) return;

  const session = getCurrentSession();
  if (session.domain && session.elapsed > 0) {
    const elapsed = flushElapsed();
    if (elapsed > 0) {
      const category = classifyDomain(session.domain);
      await updateDomainTime(session.domain, elapsed, category);
      await syncToFirestore().catch(() => {});
    }
  }
}

/**
 * Sync data to Firestore
 */
async function handleSync() {
  try {
    await flushAndSave();
    await syncToFirestore();
  } catch (e) {
    console.warn('FocusFlow: Sync failed', e);
  }
}

/**
 * Handle daily reset — check for new day, update streaks
 */
async function handleDailyReset() {
  const today = getTodayKey();
  if (today !== lastDateKey) {
    lastDateKey = today;
    resetDailyAlerts();
    await updateStreaks();
    await cleanupOldData();
    console.log('FocusFlow: New day detected, data reset');
  }
}

/**
 * Handle idle state changes
 */
function handleIdleStateChange(newState, previousState) {
  console.log(`FocusFlow: Idle state: ${previousState} → ${newState}`);

  if (newState === 'active') {
    if (windowFocused) {
      resumeTracking();
    }
  } else {
    // idle or locked
    flushAndSave();
    pauseTracking();
  }
}

// ── Productivity Score ───────────────────────────────────────────────

/**
 * Calculate productivity score (0-100) for today
 */
async function calculateProductivityScore() {
  const dayData = await getTodayData();
  let productiveTime = 0;
  let unproductiveTime = 0;
  let totalTime = 0;

  for (const [domain, data] of Object.entries(dayData)) {
    const category = classifyDomain(domain);
    totalTime += data.timeSpent;
    if (category === 'productive') productiveTime += data.timeSpent;
    if (category === 'unproductive') unproductiveTime += data.timeSpent;
  }

  if (totalTime === 0) return { score: 0, productiveTime, unproductiveTime, totalTime };

  // Score: productive ratio weighted higher, penalized for unproductive
  const productiveRatio = productiveTime / totalTime;
  const unproductiveRatio = unproductiveTime / totalTime;
  const score = Math.round(Math.max(0, Math.min(100, (productiveRatio * 100) - (unproductiveRatio * 30))));

  return { score, productiveTime, unproductiveTime, totalTime };
}

// ── Focus Mode ───────────────────────────────────────────────────────

/**
 * Toggle focus mode on/off
 */
async function toggleFocusMode(domains = [], duration = 25) {
  const focusMode = await getFocusMode();

  if (focusMode.active) {
    // Turn off
    await clearBlockRules();
    await saveFocusMode({ active: false, blockedDomains: [], endTime: null, duration: 0 });
    chrome.alarms.clear(ALARM_FOCUS_END);
    return { active: false };
  } else {
    // Turn on
    const endTime = Date.now() + (duration * 60 * 1000);
    await updateBlockRules(domains);
    await saveFocusMode({ active: true, blockedDomains: domains, endTime, duration });
    chrome.alarms.create(ALARM_FOCUS_END, { when: endTime });
    return { active: true, endTime };
  }
}

/**
 * Handle focus mode timer end
 */
async function handleFocusEnd() {
  await clearBlockRules();
  await saveFocusMode({ active: false, blockedDomains: [], endTime: null, duration: 0 });

  chrome.notifications.create('focusflow_focus_end', {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: '🎯 Focus Session Complete!',
    message: 'Great work! Your focus session has ended.',
    priority: 2
  });
}

/**
 * Check focus mode on startup (may have ended while browser was closed)
 */
async function checkFocusMode() {
  const focusMode = await getFocusMode();
  if (focusMode.active) {
    if (focusMode.endTime && Date.now() >= focusMode.endTime) {
      await handleFocusEnd();
    } else {
      await updateBlockRules(focusMode.blockedDomains);
      if (focusMode.endTime) {
        chrome.alarms.create(ALARM_FOCUS_END, { when: focusMode.endTime });
      }
    }
  }
}

// ── Streaks ──────────────────────────────────────────────────────────

/**
 * Update streak data based on yesterday's productivity
 */
async function updateStreaks() {
  const streaks = await getStreaks();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().split('T')[0];

  // Check if yesterday was a productive day
  const { score } = await calculateProductivityScoreForDate(yesterdayKey);
  const wasProductive = score >= 50;

  if (wasProductive) {
    streaks.currentStreak = (streaks.currentStreak || 0) + 1;
    streaks.bestStreak = Math.max(streaks.bestStreak || 0, streaks.currentStreak);
    streaks.lastProductiveDate = yesterdayKey;
  } else {
    streaks.currentStreak = 0;
  }

  await saveStreaks(streaks);
}

/**
 * Calculate productivity score for a specific date
 */
async function calculateProductivityScoreForDate(dateKey) {
  const { getTimeData } = await import('../utils/storage.js');
  const dayData = await getTimeData(dateKey);
  let productiveTime = 0;
  let unproductiveTime = 0;
  let totalTime = 0;

  for (const [domain, data] of Object.entries(dayData)) {
    const category = classifyDomain(domain);
    totalTime += data.timeSpent;
    if (category === 'productive') productiveTime += data.timeSpent;
    if (category === 'unproductive') unproductiveTime += data.timeSpent;
  }

  if (totalTime === 0) return { score: 0 };

  const productiveRatio = productiveTime / totalTime;
  const unproductiveRatio = unproductiveTime / totalTime;
  const score = Math.round(Math.max(0, Math.min(100, (productiveRatio * 100) - (unproductiveRatio * 30))));

  return { score, productiveTime, unproductiveTime, totalTime };
}

// Initialize on script load (handles service worker wakeup)
initialize().catch(console.error);
