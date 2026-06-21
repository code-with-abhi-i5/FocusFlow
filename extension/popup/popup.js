/**
 * FocusFlow — Popup Script
 * Renders the mini-dashboard: productivity score, top sites, focus mode toggle.
 */

// ── Helpers ──────────────────────────────────────────────────────────

function formatTime(seconds) {
  if (seconds < 0) seconds = 0;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${secs}s`;
}

function getFaviconUrl(domain) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
}

// ── DOM References ───────────────────────────────────────────────────

const scoreRing = document.getElementById('scoreRing');
const scoreNumber = document.getElementById('scoreNumber');
const totalTimeEl = document.getElementById('totalTime');
const streakEl = document.getElementById('streakCount');
const sitesListEl = document.getElementById('sitesList');
const emptyStateEl = document.getElementById('emptyState');
const currentSessionEl = document.getElementById('currentSession');
const sessionFaviconEl = document.getElementById('sessionFavicon');
const sessionDomainEl = document.getElementById('sessionDomain');
const sessionTimeEl = document.getElementById('sessionTime');
const focusToggleEl = document.getElementById('focusToggle');
const focusLabelEl = document.getElementById('focusLabel');
const focusTimerEl = document.getElementById('focusTimer');
const focusTimeRemainingEl = document.getElementById('focusTimeRemaining');
const themeToggleEl = document.getElementById('themeToggle');
const openDashboardEl = document.getElementById('openDashboard');
const openOptionsEl = document.getElementById('openOptions');

// ── Theme ────────────────────────────────────────────────────────────

async function initTheme() {
  const result = await chrome.storage.local.get('settings');
  const theme = result.settings?.theme || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
}

themeToggleEl.addEventListener('click', async () => {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);

  const result = await chrome.storage.local.get('settings');
  const settings = result.settings || {};
  settings.theme = next;
  await chrome.storage.local.set({ settings });
});

// ── Dashboard Link ───────────────────────────────────────────────────

openDashboardEl.addEventListener('click', () => {
  // Open the dashboard (when served locally or deployed)
  chrome.tabs.create({ url: 'https://focus-flow-two-orpin.vercel.app/' });
});

openOptionsEl.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// ── Load Data ────────────────────────────────────────────────────────

async function loadData() {
  try {
    // Get productivity score
    const scoreData = await chrome.runtime.sendMessage({ type: 'GET_PRODUCTIVITY_SCORE' });
    updateScore(scoreData);

    // Get top domains
    const topDomains = await chrome.runtime.sendMessage({ type: 'GET_TOP_DOMAINS', count: 5 });
    updateSitesList(topDomains, scoreData.totalTime);

    // Get current session
    const session = await chrome.runtime.sendMessage({ type: 'GET_CURRENT_SESSION' });
    updateCurrentSession(session);

    // Get total time
    const totalTime = await chrome.runtime.sendMessage({ type: 'GET_TODAY_TOTAL' });
    totalTimeEl.textContent = formatTime(totalTime);

    // Get streaks
    const result = await chrome.storage.local.get('streaks');
    const streaks = result.streaks || { currentStreak: 0 };
    streakEl.textContent = streaks.currentStreak;

    // Get focus mode
    const focusMode = await chrome.runtime.sendMessage({ type: 'GET_FOCUS_MODE' });
    updateFocusMode(focusMode);
  } catch (e) {
    console.warn('FocusFlow: Failed to load data', e);
  }
}

// ── Update Score Ring ────────────────────────────────────────────────

function updateScore(data) {
  const score = data?.score || 0;
  const circumference = 2 * Math.PI * 52; // r=52
  const offset = circumference - (score / 100) * circumference;

  scoreNumber.textContent = score;
  scoreRing.style.strokeDasharray = circumference;

  // Animate after a brief delay
  requestAnimationFrame(() => {
    setTimeout(() => {
      scoreRing.style.strokeDashoffset = offset;
    }, 100);
  });
}

// ── Update Sites List ────────────────────────────────────────────────

function updateSitesList(sites, totalTime) {
  if (!sites || sites.length === 0) {
    emptyStateEl.style.display = 'flex';
    return;
  }

  emptyStateEl.style.display = 'none';
  const maxTime = sites[0]?.timeSpent || 1;

  sitesListEl.innerHTML = sites.map(site => {
    const barWidth = Math.max(5, (site.timeSpent / maxTime) * 100);
    const category = site.category || 'neutral';

    return `
      <div class="site-item">
        <img class="site-favicon" src="${getFaviconUrl(site.domain)}" alt="" width="20" height="20" loading="lazy">
        <div class="site-info">
          <div class="site-domain">${site.domain}</div>
          <div class="site-bar">
            <div class="site-bar-fill ${category}" style="width: ${barWidth}%"></div>
          </div>
        </div>
        <span class="site-time">${formatTime(site.timeSpent)}</span>
        <span class="site-category-dot ${category}"></span>
      </div>
    `;
  }).join('');
}

// ── Update Current Session ───────────────────────────────────────────

function updateCurrentSession(session) {
  if (session?.domain && !session.isPaused) {
    currentSessionEl.style.display = 'flex';
    sessionFaviconEl.src = getFaviconUrl(session.domain);
    sessionDomainEl.textContent = session.domain;
    sessionTimeEl.textContent = formatTime(session.elapsed);
  } else {
    currentSessionEl.style.display = 'none';
  }
}

// ── Focus Mode ───────────────────────────────────────────────────────

function updateFocusMode(focusMode) {
  if (focusMode?.active) {
    focusToggleEl.classList.add('active');
    focusLabelEl.textContent = 'End Focus Mode';

    if (focusMode.endTime) {
      focusTimerEl.style.display = 'block';
      updateFocusTimer(focusMode.endTime);
    }
  } else {
    focusToggleEl.classList.remove('active');
    focusLabelEl.textContent = 'Start Focus Mode';
    focusTimerEl.style.display = 'none';
  }
}

function updateFocusTimer(endTime) {
  const remaining = Math.max(0, endTime - Date.now());
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  focusTimeRemainingEl.textContent = `${minutes}m ${seconds}s`;
}

focusToggleEl.addEventListener('click', async () => {
  const defaultBlockDomains = ['youtube.com', 'instagram.com', 'facebook.com', 'x.com', 'reddit.com', 'tiktok.com'];
  const result = await chrome.runtime.sendMessage({
    type: 'TOGGLE_FOCUS_MODE',
    domains: defaultBlockDomains,
    duration: 25 // 25 minute Pomodoro
  });
  updateFocusMode(result);
});

// ── Auto-Refresh ─────────────────────────────────────────────────────

let refreshInterval;

function startAutoRefresh() {
  refreshInterval = setInterval(async () => {
    try {
      const session = await chrome.runtime.sendMessage({ type: 'GET_CURRENT_SESSION' });
      updateCurrentSession(session);

      const totalTime = await chrome.runtime.sendMessage({ type: 'GET_TODAY_TOTAL' });
      totalTimeEl.textContent = formatTime(totalTime);

      // Update focus timer if active
      const focusMode = await chrome.runtime.sendMessage({ type: 'GET_FOCUS_MODE' });
      if (focusMode?.active && focusMode.endTime) {
        updateFocusTimer(focusMode.endTime);
      }
    } catch {
      // Service worker might be restarting
    }
  }, 1000);
}

// ── Initialize ───────────────────────────────────────────────────────

initTheme();
loadData();
startAutoRefresh();

// Cleanup on popup close
window.addEventListener('unload', () => {
  if (refreshInterval) clearInterval(refreshInterval);
});
