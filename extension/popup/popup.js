/**
 * FocusFlow — Popup Script
 * Renders the mini-dashboard: productivity score, top sites, pomodoro timer,
 * daily goal bar, and focus mode toggle.
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

function formatTimeHM(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function getFaviconUrl(domain) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
}

function padTwo(n) {
  return String(Math.floor(n)).padStart(2, '0');
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

// Goal Bar
const goalBarFill = document.getElementById('goalBarFill');
const goalText = document.getElementById('goalText');
const goalSection = document.getElementById('goalSection');

// Pomodoro
const pomoRing = document.getElementById('pomoRing');
const pomoTime = document.getElementById('pomoTime');
const pomoMode = document.getElementById('pomoMode');
const pomoSessions = document.getElementById('pomoSessions');
const pomoStart = document.getElementById('pomoStart');
const pomoPause = document.getElementById('pomoPause');
const pomoReset = document.getElementById('pomoReset');
const pomodoroSection = document.getElementById('pomodoroSection');

// AI Insights
const aiBtn = document.getElementById('aiBtn');
const aiCard = document.getElementById('aiCard');
const aiText = document.getElementById('aiText');

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

    // Daily goal bar
    await updateGoalBar(scoreData);

    // Pomodoro state
    const pomoState = await chrome.runtime.sendMessage({ type: 'GET_POMODORO_STATE' });
    updatePomodoroUI(pomoState);

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

  requestAnimationFrame(() => {
    setTimeout(() => {
      scoreRing.style.strokeDashoffset = offset;
    }, 100);
  });
}

// ── Daily Goal Bar ───────────────────────────────────────────────────

async function updateGoalBar(scoreData) {
  try {
    const goalsResult = await chrome.storage.local.get('goals');
    const goals = goalsResult.goals || { dailyProductiveHours: 4 };
    const targetSeconds = (goals.dailyProductiveHours || 4) * 3600;
    const productiveSeconds = scoreData?.productiveTime || 0;

    const pct = Math.min(100, (productiveSeconds / targetSeconds) * 100);
    const achieved = pct >= 100;

    goalBarFill.style.width = `${pct}%`;
    goalText.textContent = `${formatTimeHM(productiveSeconds)} / ${goals.dailyProductiveHours}h`;

    if (achieved) {
      goalSection.classList.add('achieved');
    } else {
      goalSection.classList.remove('achieved');
    }
  } catch (_) {}
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
        <span class="site-category-dot ${category}" data-domain="${site.domain}" data-category="${category}" title="Click to change category"></span>
      </div>
    `;
  }).join('');
}

// Global click handler for dynamic category dots
document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('site-category-dot')) {
    const domain = e.target.getAttribute('data-domain');
    const currentCategory = e.target.getAttribute('data-category');
    
    // Cycle: neutral -> productive -> unproductive -> neutral
    const cycle = {
      'neutral': 'productive',
      'productive': 'unproductive',
      'unproductive': 'neutral'
    };
    const nextCategory = cycle[currentCategory] || 'neutral';
    
    // Optimistic UI update
    e.target.setAttribute('data-category', nextCategory);
    e.target.className = `site-category-dot ${nextCategory}`;

    // Send to background
    await chrome.runtime.sendMessage({ 
      type: 'UPDATE_CATEGORY', 
      domain, 
      category: nextCategory 
    });
    
    // Refresh data to update score ring
    loadData();
  }
});

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

// ── Pomodoro Timer ───────────────────────────────────────────────────

const POMO_WORK = 25 * 60;
const POMO_CIRCUMFERENCE = 2 * Math.PI * 34; // r=34 → 213.63

function updatePomodoroUI(state) {
  if (!state) return;

  const { status, timeLeft, sessionsCompleted, isBreak, endTimestamp } = state;

  // Calculate real-time remaining
  let displaySeconds = timeLeft;
  if (status === 'running' && endTimestamp) {
    displaySeconds = Math.max(0, Math.round((endTimestamp - Date.now()) / 1000));
  }

  const totalDuration = isBreak
    ? (sessionsCompleted % 4 === 0 && sessionsCompleted > 0 ? 15 * 60 : 5 * 60)
    : POMO_WORK;

  const progress = displaySeconds / totalDuration;
  const offset = POMO_CIRCUMFERENCE * (1 - progress);

  // Update ring
  pomoRing.style.strokeDashoffset = offset;

  // Update time display
  const mins = Math.floor(displaySeconds / 60);
  const secs = displaySeconds % 60;
  pomoTime.textContent = `${padTwo(mins)}:${padTwo(secs)}`;

  // Update mode label
  pomoMode.textContent = isBreak
    ? (sessionsCompleted % 4 === 0 && sessionsCompleted > 0 ? 'Long Break' : 'Break')
    : 'Work';

  // Update sessions count
  pomoSessions.textContent = sessionsCompleted;

  // Update section classes
  pomodoroSection.classList.toggle('is-running', status === 'running');
  pomodoroSection.classList.toggle('is-break', isBreak);

  // Toggle start/pause buttons
  if (status === 'running') {
    pomoStart.style.display = 'none';
    pomoPause.style.display = 'flex';
  } else {
    pomoStart.style.display = 'flex';
    pomoPause.style.display = 'none';
  }
}

pomoStart.addEventListener('click', async () => {
  const state = await chrome.runtime.sendMessage({ type: 'START_POMODORO' });
  updatePomodoroUI(state);
});

pomoPause.addEventListener('click', async () => {
  const state = await chrome.runtime.sendMessage({ type: 'PAUSE_POMODORO' });
  updatePomodoroUI(state);
});

pomoReset.addEventListener('click', async () => {
  const state = await chrome.runtime.sendMessage({ type: 'RESET_POMODORO' });
  updatePomodoroUI(state);
});

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
    duration: 25
  });
  updateFocusMode(result);
});

// ── AI Insights ──────────────────────────────────────────────────────

aiBtn.addEventListener('click', async () => {
  aiBtn.classList.add('loading');
  aiCard.classList.remove('visible');
  
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_AI_INSIGHT' });
    
    aiBtn.classList.remove('loading');
    
    if (response?.error) {
      if (response.error === 'Please set your Gemini API key in Options.') {
        aiText.innerHTML = `Please add your Gemini API Key in the <a href="#" id="aiOpenOptions">Options</a> to enable insights.`;
        document.getElementById('aiOpenOptions')?.addEventListener('click', () => chrome.runtime.openOptionsPage());
      } else {
        aiText.textContent = response.error;
      }
    } else if (response?.insight) {
      aiText.innerHTML = response.insight.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    } else {
      aiText.textContent = "Could not generate insight. Please try again.";
    }
    
    aiCard.classList.add('visible');
  } catch (err) {
    aiBtn.classList.remove('loading');
    aiText.textContent = "Error communicating with AI service.";
    aiCard.classList.add('visible');
  }
});

// ── Auto-Refresh ─────────────────────────────────────────────────────

let refreshInterval;

function startAutoRefresh() {
  refreshInterval = setInterval(async () => {
    try {
      // Update current session
      const session = await chrome.runtime.sendMessage({ type: 'GET_CURRENT_SESSION' });
      updateCurrentSession(session);

      // Update total time
      const totalTime = await chrome.runtime.sendMessage({ type: 'GET_TODAY_TOTAL' });
      totalTimeEl.textContent = formatTime(totalTime);

      // Update focus timer if active
      const focusMode = await chrome.runtime.sendMessage({ type: 'GET_FOCUS_MODE' });
      if (focusMode?.active && focusMode.endTime) {
        updateFocusTimer(focusMode.endTime);
      }

      // Update pomodoro timer
      const pomoState = await chrome.runtime.sendMessage({ type: 'GET_POMODORO_STATE' });
      updatePomodoroUI(pomoState);

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

