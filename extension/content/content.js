/**
 * FocusFlow — Content Script
 * Lightweight script injected into all pages to detect visibility changes
 * for accurate focus tracking.
 */

// ── Page Visibility Tracking ─────────────────────────────────────────

function safeSendMessage(message) {
  // If extension was reloaded, chrome.runtime.id becomes undefined
  if (!chrome?.runtime?.id) return;
  
  try {
    chrome.runtime.sendMessage(message).catch(() => {});
  } catch (err) {
    // Ignore any other connection errors
  }
}

document.addEventListener('visibilitychange', () => {
  safeSendMessage({
    type: 'VISIBILITY_CHANGE',
    hidden: document.hidden,
    url: window.location.href
  });
});

// Send initial visibility state
safeSendMessage({
  type: 'VISIBILITY_CHANGE',
  hidden: document.hidden,
  url: window.location.href
});
