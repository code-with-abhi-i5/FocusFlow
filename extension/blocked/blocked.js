/**
 * FocusFlow — Blocked Page Script
 * Countdown timer and motivational quotes for the Focus Mode block page.
 */

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "It's not that I'm so smart, it's just that I stay with problems longer.", author: "Albert Einstein" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Deep work is the ability to focus without distraction on a cognitively demanding task.", author: "Cal Newport" },
  { text: "Starve your distractions, feed your focus.", author: "Daniel Goleman" },
  { text: "Concentrate all your thoughts upon the work in hand.", author: "Alexander Graham Bell" },
  { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
  { text: "Productivity is never an accident. It is the result of a commitment to excellence.", author: "Paul J. Meyer" },
  { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" }
];

// ── Timer ────────────────────────────────────────────────────────────

const timerDisplay = document.getElementById('timerDisplay');
const statProductive = document.getElementById('statProductive');
const statScore = document.getElementById('statScore');
const statsRow = document.getElementById('statsRow');
const bypassBtn = document.getElementById('bypassBtn');
const bypassCountSpan = document.getElementById('bypassCount');

// Bypass State
let bypassesUsed = 0;
const MAX_BYPASSES = 3;

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// Get today's YYYY-MM-DD
function getTodayKey() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

async function updateStats() {
  try {
    const today = getTodayKey();
    const result = await chrome.storage.local.get(['timeData', 'bypassState']);
    const dayData = result.timeData?.[today] || {};
    
    // Setup Bypass State
    const bypassState = result.bypassState || { date: today, used: 0 };
    if (bypassState.date !== today) {
      bypassState.date = today;
      bypassState.used = 0;
    }
    bypassesUsed = bypassState.used;
    updateBypassUI();
    
    let prodSec = 0;
    let unprodSec = 0;
    
    for (const [domain, data] of Object.entries(dayData)) {
      if (data.category === 'productive') prodSec += data.timeSpent;
      if (data.category === 'unproductive') unprodSec += data.timeSpent;
    }
    
    const totalSec = prodSec + unprodSec;
    const score = totalSec > 0 ? Math.round((prodSec / totalSec) * 100) : 0;
    
    statProductive.textContent = formatTime(prodSec);
    statScore.textContent = `${score}%`;
    statsRow.style.display = 'flex';
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

function updateBypassUI() {
  const remaining = MAX_BYPASSES - bypassesUsed;
  bypassCountSpan.textContent = remaining;
  if (remaining <= 0) {
    bypassBtn.disabled = true;
    bypassBtn.innerHTML = `No bypasses left today`;
  }
}

bypassBtn.addEventListener('click', async () => {
  if (bypassesUsed >= MAX_BYPASSES) return;
  
  bypassesUsed++;
  const bypassState = { date: getTodayKey(), used: bypassesUsed };
  await chrome.storage.local.set({ bypassState });
  
  // Extract domain from URL query params (if passed, e.g., ?domain=youtube.com)
  const urlParams = new URLSearchParams(window.location.search);
  const domain = urlParams.get('domain');
  
  await chrome.runtime.sendMessage({ 
    type: 'TEMP_UNBLOCK', 
    domain: domain,
    duration: 5 
  });
  
  // Go back to the unblocked page
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = `https://${domain || 'google.com'}`;
  }
});

async function updateTimer() {
  try {
    const result = await chrome.storage.local.get('focusMode');
    const focusMode = result.focusMode;

    if (!focusMode?.active || !focusMode.endTime) {
      timerDisplay.textContent = '00:00';
      return;
    }

    const remaining = Math.max(0, focusMode.endTime - Date.now());

    if (remaining <= 0) {
      timerDisplay.textContent = '00:00';
      // Focus session ended — redirect to a neutral page
      setTimeout(() => {
        window.location.href = 'https://www.google.com';
      }, 1000);
      return;
    }

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  } catch {
    timerDisplay.textContent = '--:--';
  }
}

// ── Quotes ───────────────────────────────────────────────────────────

function showRandomQuote() {
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  document.getElementById('quoteText').textContent = `"${quote.text}"`;
  document.getElementById('quoteAuthor').textContent = `— ${quote.author}`;
}

// ── Go Back ──────────────────────────────────────────────────────────

document.getElementById('goBackBtn').addEventListener('click', () => {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = 'https://www.google.com';
  }
});

// ── Initialize ───────────────────────────────────────────────────────

showRandomQuote();
updateStats();
updateTimer();
setInterval(updateTimer, 1000);

// Rotate quotes every 15 seconds
setInterval(showRandomQuote, 15000);
