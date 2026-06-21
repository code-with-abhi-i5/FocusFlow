/**
 * FocusFlow — Storage Utility
 * Wrapper around chrome.storage.local for time tracking data persistence.
 * 
 * Data Schema:
 * {
 *   timeData: {
 *     [date: YYYY-MM-DD]: {
 *       [domain]: {
 *         timeSpent: number (seconds),
 *         category: 'productive' | 'unproductive' | 'neutral',
 *         sessions: [{ start: timestamp, end: timestamp }],
 *         lastActive: timestamp
 *       }
 *     }
 *   },
 *   settings: { ... },
 *   focusMode: { ... },
 *   pendingSync: [ ... ]
 * }
 */

const STORAGE_KEYS = {
  TIME_DATA: 'timeData',
  SETTINGS: 'settings',
  FOCUS_MODE: 'focusMode',
  PENDING_SYNC: 'pendingSync',
  CATEGORIES: 'categories',
  GOALS: 'goals',
  STREAKS: 'streaks',
  LAST_SYNC: 'lastSync',
  USER: 'user',
  POMODORO: 'pomodoro',
  SITE_LIMITS: 'siteLimits',
  AUTO_BLOCKED: 'autoBlocked'
};

/**
 * Get today's date key in YYYY-MM-DD format
 */
export function getTodayKey() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Get a date key for a specific date
 */
export function getDateKey(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Get all time data from storage
 */
export async function getAllTimeData() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.TIME_DATA);
  return result[STORAGE_KEYS.TIME_DATA] || {};
}

/**
 * Get time data for a specific date
 * @param {string} dateKey — YYYY-MM-DD format
 * @returns {Object} — { [domain]: { timeSpent, category, sessions, lastActive } }
 */
export async function getTimeData(dateKey) {
  const allData = await getAllTimeData();
  return allData[dateKey] || {};
}

/**
 * Get today's time data
 */
export async function getTodayData() {
  return getTimeData(getTodayKey());
}

/**
 * Save time data for a specific date
 */
export async function saveTimeData(dateKey, data) {
  const allData = await getAllTimeData();
  allData[dateKey] = data;
  await chrome.storage.local.set({ [STORAGE_KEYS.TIME_DATA]: allData });
}

/**
 * Update time for a specific domain on a specific date
 * @param {string} domain
 * @param {number} additionalSeconds
 * @param {string} category
 */
export async function updateDomainTime(domain, additionalSeconds, category = 'neutral') {
  const dateKey = getTodayKey();
  const dayData = await getTimeData(dateKey);

  if (!dayData[domain]) {
    dayData[domain] = {
      timeSpent: 0,
      category: category,
      sessions: [],
      lastActive: Date.now()
    };
  }

  dayData[domain].timeSpent += additionalSeconds;
  dayData[domain].category = category;
  dayData[domain].lastActive = Date.now();

  await saveTimeData(dateKey, dayData);
  
  // Add to pending sync queue
  await addToPendingSync({
    domain,
    timeSpent: dayData[domain].timeSpent,
    category,
    date: dateKey,
    timestamp: Date.now()
  });

  return dayData[domain];
}

/**
 * Update the category of a domain retroactively for today and permanently
 */
export async function updateDomainCategory(domain, category) {
  // Update permanent custom categories
  const result = await chrome.storage.local.get(STORAGE_KEYS.CATEGORIES);
  const categories = result[STORAGE_KEYS.CATEGORIES] || { productive: [], unproductive: [], neutral: [] };
  
  // Remove from existing categories
  ['productive', 'unproductive', 'neutral'].forEach(cat => {
    categories[cat] = categories[cat].filter(d => d !== domain);
  });
  
  // Add to new category
  if (category !== 'neutral') {
    if (!categories[category]) categories[category] = [];
    categories[category].push(domain);
  }
  await chrome.storage.local.set({ [STORAGE_KEYS.CATEGORIES]: categories });

  // Retroactively update today's tracking data
  const dateKey = getTodayKey();
  const dayData = await getTimeData(dateKey);
  
  if (dayData[domain]) {
    dayData[domain].category = category;
    await saveTimeData(dateKey, dayData);
  }
}

/**
 * Start a new session for a domain
 */
export async function startSession(domain, category = 'neutral') {
  const dateKey = getTodayKey();
  const dayData = await getTimeData(dateKey);

  if (!dayData[domain]) {
    dayData[domain] = {
      timeSpent: 0,
      category: category,
      sessions: [],
      lastActive: Date.now()
    };
  }

  dayData[domain].sessions.push({
    start: Date.now(),
    end: null
  });

  await saveTimeData(dateKey, dayData);
}

/**
 * End the current session for a domain
 */
export async function endSession(domain) {
  const dateKey = getTodayKey();
  const dayData = await getTimeData(dateKey);

  if (dayData[domain] && dayData[domain].sessions.length > 0) {
    const lastSession = dayData[domain].sessions[dayData[domain].sessions.length - 1];
    if (lastSession && !lastSession.end) {
      lastSession.end = Date.now();
    }
  }

  await saveTimeData(dateKey, dayData);
}

/**
 * Get total time tracked today in seconds
 */
export async function getTodayTotalTime() {
  const dayData = await getTodayData();
  return Object.values(dayData).reduce((total, entry) => total + (entry.timeSpent || 0), 0);
}

/**
 * Get time for a specific domain today
 */
export async function getDomainTimeToday(domain) {
  const dayData = await getTodayData();
  return dayData[domain]?.timeSpent || 0;
}

/**
 * Get top domains for today sorted by time
 */
export async function getTopDomainsToday(count = 10) {
  const dayData = await getTodayData();
  return Object.entries(dayData)
    .map(([domain, data]) => ({ domain, ...data }))
    .sort((a, b) => b.timeSpent - a.timeSpent)
    .slice(0, count);
}

// ── Pending Sync Queue ───────────────────────────────────────────────

/**
 * Add an entry to the pending sync queue
 */
export async function addToPendingSync(entry) {
  const result = await chrome.storage.local.get(STORAGE_KEYS.PENDING_SYNC);
  const queue = result[STORAGE_KEYS.PENDING_SYNC] || [];
  
  // Deduplicate: update existing entry for same domain + date
  const existingIdx = queue.findIndex(e => e.domain === entry.domain && e.date === entry.date);
  if (existingIdx >= 0) {
    queue[existingIdx] = entry;
  } else {
    queue.push(entry);
  }

  await chrome.storage.local.set({ [STORAGE_KEYS.PENDING_SYNC]: queue });
}

/**
 * Get all pending sync entries
 */
export async function getPendingSync() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.PENDING_SYNC);
  return result[STORAGE_KEYS.PENDING_SYNC] || [];
}

/**
 * Clear the pending sync queue
 */
export async function clearPendingSync() {
  await chrome.storage.local.set({ [STORAGE_KEYS.PENDING_SYNC]: [] });
}

// ── Settings ─────────────────────────────────────────────────────────

/**
 * Get user settings
 */
export async function getSettings() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  return result[STORAGE_KEYS.SETTINGS] || {
    notificationsEnabled: true,
    notificationInterval: 30, // minutes
    theme: 'dark',
    idleTimeout: 60 // seconds
  };
}

/**
 * Save user settings
 */
export async function saveSettings(settings) {
  await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
}

// ── Focus Mode ───────────────────────────────────────────────────────

/**
 * Get focus mode state
 */
export async function getFocusMode() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.FOCUS_MODE);
  return result[STORAGE_KEYS.FOCUS_MODE] || {
    active: false,
    blockedDomains: [],
    endTime: null,
    duration: 0
  };
}

/**
 * Save focus mode state
 */
export async function saveFocusMode(focusModeData) {
  await chrome.storage.local.set({ [STORAGE_KEYS.FOCUS_MODE]: focusModeData });
}

// ── Goals ────────────────────────────────────────────────────────────

export async function getGoals() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.GOALS);
  return result[STORAGE_KEYS.GOALS] || {
    dailyProductiveHours: 4,
    socialMediaLimit: 120 // minutes
  };
}

export async function saveGoals(goals) {
  await chrome.storage.local.set({ [STORAGE_KEYS.GOALS]: goals });
}

// ── Streaks ──────────────────────────────────────────────────────────

export async function getStreaks() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.STREAKS);
  return result[STORAGE_KEYS.STREAKS] || {
    currentStreak: 0,
    bestStreak: 0,
    lastProductiveDate: null
  };
}

export async function saveStreaks(streaks) {
  await chrome.storage.local.set({ [STORAGE_KEYS.STREAKS]: streaks });
}

// ── User ─────────────────────────────────────────────────────────────

export async function getUser() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.USER);
  return result[STORAGE_KEYS.USER] || null;
}

export async function saveUser(user) {
  await chrome.storage.local.set({ [STORAGE_KEYS.USER]: user });
}

// ── Site Limits ──────────────────────────────────────────────────────

export async function getSiteLimits() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SITE_LIMITS);
  return result[STORAGE_KEYS.SITE_LIMITS] || {};
}

export async function saveSiteLimits(limits) {
  await chrome.storage.local.set({ [STORAGE_KEYS.SITE_LIMITS]: limits });
}

export async function getAutoBlockedDomains() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.AUTO_BLOCKED);
  return result[STORAGE_KEYS.AUTO_BLOCKED] || [];
}

export async function saveAutoBlockedDomains(domains) {
  await chrome.storage.local.set({ [STORAGE_KEYS.AUTO_BLOCKED]: domains });
}

// ── Pomodoro State ────────────────────────────────────────────────────

/**
 * Get Pomodoro timer state
 * @returns {Promise<{status:'idle'|'running'|'paused'|'break', timeLeft:number, sessionsCompleted:number, isBreak:boolean, endTimestamp:number|null}>}
 */
export async function getPomodoroState() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.POMODORO);
  return result[STORAGE_KEYS.POMODORO] || {
    status: 'idle',
    timeLeft: 25 * 60, // 25 minutes in seconds
    sessionsCompleted: 0,
    isBreak: false,
    endTimestamp: null // epoch ms when current interval ends
  };
}

/**
 * Save Pomodoro timer state
 */
export async function savePomodoroState(state) {
  await chrome.storage.local.set({ [STORAGE_KEYS.POMODORO]: state });
}

// ── Data Cleanup ─────────────────────────────────────────────────────

/**
 * Remove time data older than 90 days to keep storage manageable
 */
export async function cleanupOldData() {
  const allData = await getAllTimeData();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffKey = getDateKey(cutoff);

  let cleaned = false;
  for (const dateKey of Object.keys(allData)) {
    if (dateKey < cutoffKey) {
      delete allData[dateKey];
      cleaned = true;
    }
  }

  if (cleaned) {
    await chrome.storage.local.set({ [STORAGE_KEYS.TIME_DATA]: allData });
  }
}

export { STORAGE_KEYS };
