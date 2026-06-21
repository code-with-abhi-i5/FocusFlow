/**
 * FocusFlow — Idle Detection Utility
 * Monitors user activity state via chrome.idle API.
 */

const DEFAULT_IDLE_INTERVAL = 60; // seconds

let idleState = 'active'; // 'active' | 'idle' | 'locked'
let onStateChangeCallback = null;

/**
 * Initialize idle detection
 * @param {Object} options
 * @param {number} options.interval — idle detection threshold in seconds (default 60)
 * @param {function} options.onStateChange — callback when idle state changes
 */
export function initIdleDetection({ interval = DEFAULT_IDLE_INTERVAL, onStateChange } = {}) {
  onStateChangeCallback = onStateChange;

  // Set the idle detection interval
  chrome.idle.setDetectionInterval(interval);

  // Listen for state changes
  chrome.idle.onStateChanged.addListener(handleStateChange);

  // Query current state immediately
  chrome.idle.queryState(interval, (state) => {
    handleStateChange(state);
  });
}

/**
 * Handle idle state change
 * @param {'active'|'idle'|'locked'} newState
 */
function handleStateChange(newState) {
  const previousState = idleState;
  idleState = newState;

  if (previousState !== newState && onStateChangeCallback) {
    onStateChangeCallback(newState, previousState);
  }
}

/**
 * Get the current idle state
 * @returns {'active'|'idle'|'locked'}
 */
export function getIdleState() {
  return idleState;
}

/**
 * Check if user is currently active
 */
export function isUserActive() {
  return idleState === 'active';
}

/**
 * Check if user is idle (but not locked)
 */
export function isUserIdle() {
  return idleState === 'idle';
}

/**
 * Check if user's computer is locked
 */
export function isUserLocked() {
  return idleState === 'locked';
}

/**
 * Check if tracking should be paused based on idle state
 */
export function shouldPauseTracking() {
  return idleState !== 'active';
}

/**
 * Cleanup idle detection listeners
 */
export function cleanupIdleDetection() {
  chrome.idle.onStateChanged.removeListener(handleStateChange);
  onStateChangeCallback = null;
}
