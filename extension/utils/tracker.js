/**
 * FocusFlow — Domain Tracker Utility
 * Handles domain extraction, normalization, and tracking state management.
 */

// ── Ignored URL Patterns ─────────────────────────────────────────────
const IGNORED_PREFIXES = [
  'chrome://',
  'chrome-extension://',
  'about:',
  'edge://',
  'brave://',
  'devtools://',
  'view-source:',
  'data:',
  'blob:',
  'file://',
  'chrome-search://',
  'chrome-untrusted://'
];

/**
 * Check if a URL should be ignored for tracking
 */
export function shouldIgnoreUrl(url) {
  if (!url) return true;
  return IGNORED_PREFIXES.some(prefix => url.startsWith(prefix));
}

/**
 * Extract the domain from a URL
 * @param {string} url
 * @returns {string|null} — normalized domain (e.g., "github.com")
 */
export function extractDomain(url) {
  if (!url || shouldIgnoreUrl(url)) return null;

  try {
    const urlObj = new URL(url);
    let hostname = urlObj.hostname;

    // Remove www. prefix for consistency
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }

    return hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Format seconds into human-readable time string
 * @param {number} seconds
 * @returns {string} — e.g., "2h 14m", "48m", "30s"
 */
export function formatTime(seconds) {
  if (seconds < 0) seconds = 0;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${secs}s`;
}

/**
 * Format seconds into a full time string
 * @param {number} seconds
 * @returns {string} — e.g., "2h 14m 30s"
 */
export function formatTimeFull(seconds) {
  if (seconds < 0) seconds = 0;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

/**
 * Get a favicon URL for a domain
 * Uses Google's favicon service
 */
export function getFaviconUrl(domain) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
}

// ── Tracking State ───────────────────────────────────────────────────

/** @type {{ domain: string|null, startTime: number|null, accumulated: number, isPaused: boolean }} */
let currentTracking = {
  domain: null,
  startTime: null,
  accumulated: 0,
  isPaused: false
};

/**
 * Start tracking a new domain
 */
export function startTracking(domain) {
  // If already tracking the same domain, don't restart
  if (currentTracking.domain === domain && !currentTracking.isPaused) {
    return currentTracking;
  }

  // If tracking a different domain, stop the current one first
  if (currentTracking.domain && currentTracking.domain !== domain) {
    stopTracking();
  }

  currentTracking = {
    domain,
    startTime: Date.now(),
    accumulated: 0,
    isPaused: false
  };

  return currentTracking;
}

/**
 * Stop tracking and return the elapsed seconds
 * @returns {{ domain: string|null, elapsed: number }}
 */
export function stopTracking() {
  if (!currentTracking.domain) {
    return { domain: null, elapsed: 0 };
  }

  const elapsed = getElapsedSeconds();
  const result = {
    domain: currentTracking.domain,
    elapsed
  };

  currentTracking = {
    domain: null,
    startTime: null,
    accumulated: 0,
    isPaused: false
  };

  return result;
}

/**
 * Pause tracking (e.g., when browser loses focus or user is idle)
 */
export function pauseTracking() {
  if (!currentTracking.domain || currentTracking.isPaused) return;

  // Accumulate time so far
  if (currentTracking.startTime) {
    currentTracking.accumulated += (Date.now() - currentTracking.startTime) / 1000;
    currentTracking.startTime = null;
  }
  currentTracking.isPaused = true;
}

/**
 * Resume tracking after pause
 */
export function resumeTracking() {
  if (!currentTracking.domain || !currentTracking.isPaused) return;

  currentTracking.startTime = Date.now();
  currentTracking.isPaused = false;
}

/**
 * Get the elapsed tracking seconds for the current domain
 */
export function getElapsedSeconds() {
  if (!currentTracking.domain) return 0;

  let total = currentTracking.accumulated;
  if (currentTracking.startTime && !currentTracking.isPaused) {
    total += (Date.now() - currentTracking.startTime) / 1000;
  }
  return Math.floor(total);
}

/**
 * Get the current tracking state
 */
export function getCurrentSession() {
  return {
    ...currentTracking,
    elapsed: getElapsedSeconds()
  };
}

/**
 * Check if currently tracking
 */
export function isTracking() {
  return currentTracking.domain !== null && !currentTracking.isPaused;
}

/**
 * Flush current elapsed time and reset accumulator
 * Used for periodic saves — returns seconds to add to storage
 */
export function flushElapsed() {
  const elapsed = getElapsedSeconds();

  // Reset accumulated but keep tracking
  if (currentTracking.domain && !currentTracking.isPaused) {
    currentTracking.accumulated = 0;
    currentTracking.startTime = Date.now();
  } else {
    currentTracking.accumulated = 0;
  }

  return elapsed;
}
