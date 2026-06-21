/**
 * FocusFlow — Options Page Script
 * Settings, category management, and focus mode blocklist.
 */

let customCategories = { productive: [], unproductive: [], neutral: [] };
let blocklistDomains = [];

// ── Load Settings ────────────────────────────────────────────────────

async function loadSettings() {
  const result = await chrome.storage.local.get(['settings', 'goals', 'categories', 'focusMode']);

  const settings = result.settings || {};
  document.getElementById('syncKeyInput').value = settings.syncKey || '';
  document.getElementById('notificationsEnabled').checked = settings.notificationsEnabled !== false;
  document.getElementById('idleTimeout').value = settings.idleTimeout || 60;
  document.getElementById('themeSelect').value = settings.theme || 'dark';

  // Goals
  const goals = result.goals || {};
  document.getElementById('dailyProductiveHours').value = goals.dailyProductiveHours || 4;
  document.getElementById('socialMediaLimit').value = goals.socialMediaLimit || 120;

  // Categories
  customCategories = result.categories || { productive: [], unproductive: [], neutral: [] };
  renderCategoryTags('productive');
  renderCategoryTags('unproductive');

  // Blocklist
  const focusMode = result.focusMode || {};
  blocklistDomains = focusMode.blockedDomains || ['youtube.com', 'instagram.com', 'facebook.com', 'x.com', 'reddit.com'];
  renderBlocklistTags();
}

// ── Render Tags ──────────────────────────────────────────────────────

function renderCategoryTags(category) {
  const container = document.getElementById(`${category}Tags`);
  const domains = customCategories[category] || [];

  container.innerHTML = domains.map(domain => `
    <span class="domain-tag">
      ${domain}
      <button class="remove-btn" onclick="removeDomain('${category}', '${domain}')">&times;</button>
    </span>
  `).join('');

  if (domains.length === 0) {
    container.innerHTML = '<span style="font-size:12px;color:var(--text-muted);">No custom domains added</span>';
  }
}

function renderBlocklistTags() {
  const container = document.getElementById('blocklistTags');

  container.innerHTML = blocklistDomains.map(domain => `
    <span class="domain-tag">
      ${domain}
      <button class="remove-btn" onclick="removeBlockDomain('${domain}')">&times;</button>
    </span>
  `).join('');

  if (blocklistDomains.length === 0) {
    container.innerHTML = '<span style="font-size:12px;color:var(--text-muted);">No domains in blocklist</span>';
  }
}

// ── Add/Remove Domains ───────────────────────────────────────────────

function addDomain(category) {
  const input = document.getElementById(`add${capitalize(category)}Domain`);
  const domain = input.value.trim().toLowerCase();

  if (!domain || !domain.includes('.')) return;

  if (!customCategories[category]) customCategories[category] = [];

  // Remove from other categories
  for (const cat of ['productive', 'unproductive', 'neutral']) {
    customCategories[cat] = (customCategories[cat] || []).filter(d => d !== domain);
  }

  if (!customCategories[category].includes(domain)) {
    customCategories[category].push(domain);
  }

  input.value = '';
  renderCategoryTags('productive');
  renderCategoryTags('unproductive');
}

function removeDomain(category, domain) {
  customCategories[category] = (customCategories[category] || []).filter(d => d !== domain);
  renderCategoryTags(category);
}

function addBlockDomain() {
  const input = document.getElementById('addBlockDomain');
  const domain = input.value.trim().toLowerCase();

  if (!domain || !domain.includes('.')) return;

  if (!blocklistDomains.includes(domain)) {
    blocklistDomains.push(domain);
  }

  input.value = '';
  renderBlocklistTags();
}

function removeBlockDomain(domain) {
  blocklistDomains = blocklistDomains.filter(d => d !== domain);
  renderBlocklistTags();
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── Save All ─────────────────────────────────────────────────────────

async function saveAll() {
  const settings = {
    syncKey: document.getElementById('syncKeyInput').value.trim(),
    notificationsEnabled: document.getElementById('notificationsEnabled').checked,
    idleTimeout: parseInt(document.getElementById('idleTimeout').value) || 60,
    theme: document.getElementById('themeSelect').value
  };

  const goals = {
    dailyProductiveHours: parseFloat(document.getElementById('dailyProductiveHours').value) || 4,
    socialMediaLimit: parseInt(document.getElementById('socialMediaLimit').value) || 120
  };

  await chrome.storage.local.set({
    settings,
    goals,
    categories: customCategories
  });

  // Force sync immediately so the dashboard updates
  chrome.runtime.sendMessage({ type: 'FORCE_SYNC' }).catch(err => {
    console.warn('Could not force sync', err);
  });

  // Update focus mode blocklist
  const result = await chrome.storage.local.get('focusMode');
  const focusMode = result.focusMode || {};
  focusMode.blockedDomains = blocklistDomains;
  await chrome.storage.local.set({ focusMode });

  // Show success message
  const statusMsg = document.getElementById('statusMsg');
  statusMsg.classList.add('visible');
  setTimeout(() => statusMsg.classList.remove('visible'), 2000);
}

// ── Handle Enter key in inputs ───────────────────────────────────────

document.getElementById('addProductiveDomain').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addDomain('productive');
});

document.getElementById('addUnproductiveDomain').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addDomain('unproductive');
});

document.getElementById('addBlockDomain').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addBlockDomain();
});

// ── Initialize ───────────────────────────────────────────────────────

document.getElementById('saveBtn').addEventListener('click', saveAll);
document.getElementById('addProductiveBtn').addEventListener('click', () => addDomain('productive'));
document.getElementById('addUnproductiveBtn').addEventListener('click', () => addDomain('unproductive'));
document.getElementById('addBlockBtn').addEventListener('click', addBlockDomain);

loadSettings();
