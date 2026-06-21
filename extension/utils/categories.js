/**
 * FocusFlow — Category Classification Engine
 * Manages productive/unproductive/neutral domain classification.
 */

// ── Default Category Lists ──────────────────────────────────────────

const DEFAULT_PRODUCTIVE = [
  'github.com',
  'gitlab.com',
  'stackoverflow.com',
  'leetcode.com',
  'openai.com',
  'chatgpt.com',
  'docs.google.com',
  'notion.so',
  'linear.app',
  'figma.com',
  'vercel.com',
  'netlify.com',
  'aws.amazon.com',
  'console.cloud.google.com',
  'azure.microsoft.com',
  'medium.com',
  'dev.to',
  'hashnode.dev',
  'codepen.io',
  'codesandbox.io',
  'replit.com',
  'kaggle.com',
  'coursera.org',
  'udemy.com',
  'edx.org',
  'khanacademy.org',
  'w3schools.com',
  'mdn.mozilla.org',
  'developer.mozilla.org',
  'npmjs.com',
  'pypi.org',
  'crates.io',
  'rust-lang.org',
  'typescriptlang.org',
  'react.dev',
  'vuejs.org',
  'angular.io',
  'nextjs.org',
  'tailwindcss.com',
  'jira.atlassian.com',
  'trello.com',
  'asana.com',
  'slack.com',
  'zoom.us',
  'meet.google.com',
  'calendar.google.com',
  'drive.google.com',
  'sheets.google.com',
  'mail.google.com',
  'outlook.office.com'
];

const DEFAULT_UNPRODUCTIVE = [
  'youtube.com',
  'instagram.com',
  'facebook.com',
  'netflix.com',
  'x.com',
  'twitter.com',
  'tiktok.com',
  'reddit.com',
  'twitch.tv',
  'discord.com',
  'pinterest.com',
  'snapchat.com',
  'tumblr.com',
  'buzzfeed.com',
  '9gag.com',
  'imgur.com',
  'disneyplus.com',
  'hulu.com',
  'primevideo.com',
  'hbomax.com',
  'crunchyroll.com',
  'spotify.com',
  'soundcloud.com',
  'twitch.tv',
  'omegle.com',
  'chatroulette.com'
];

/** @type {{ productive: string[], unproductive: string[], neutral: string[] }} */
let customCategories = {
  productive: [],
  unproductive: [],
  neutral: []
};

/**
 * Initialize categories from storage
 */
export async function initCategories() {
  const result = await chrome.storage.local.get('categories');
  if (result.categories) {
    customCategories = result.categories;
  }
}

/**
 * Classify a domain
 * @param {string} domain
 * @returns {'productive'|'unproductive'|'neutral'}
 */
export function classifyDomain(domain) {
  if (!domain) return 'neutral';

  const normalizedDomain = domain.toLowerCase();

  // Check custom categories first (user overrides)
  if (customCategories.productive.includes(normalizedDomain)) return 'productive';
  if (customCategories.unproductive.includes(normalizedDomain)) return 'unproductive';
  if (customCategories.neutral.includes(normalizedDomain)) return 'neutral';

  // Check default lists — also match subdomains
  if (matchesList(normalizedDomain, DEFAULT_PRODUCTIVE)) return 'productive';
  if (matchesList(normalizedDomain, DEFAULT_UNPRODUCTIVE)) return 'unproductive';

  return 'neutral';
}

/**
 * Check if a domain matches any entry in a list (including subdomain matching)
 */
function matchesList(domain, list) {
  return list.some(entry => {
    return domain === entry || domain.endsWith('.' + entry);
  });
}

/**
 * Add a domain to a category
 * @param {string} domain
 * @param {'productive'|'unproductive'|'neutral'} category
 */
export async function addDomainToCategory(domain, category) {
  const normalizedDomain = domain.toLowerCase();

  // Remove from all categories first
  removeDomainFromAllCategories(normalizedDomain);

  // Add to specified category
  if (!customCategories[category]) {
    customCategories[category] = [];
  }
  customCategories[category].push(normalizedDomain);

  await saveCategories();
}

/**
 * Remove a domain from all custom categories
 */
function removeDomainFromAllCategories(domain) {
  for (const cat of ['productive', 'unproductive', 'neutral']) {
    if (customCategories[cat]) {
      customCategories[cat] = customCategories[cat].filter(d => d !== domain);
    }
  }
}

/**
 * Remove a domain from custom categories (revert to default classification)
 */
export async function removeDomainFromCategory(domain) {
  removeDomainFromAllCategories(domain.toLowerCase());
  await saveCategories();
}

/**
 * Get all custom categories
 */
export function getCustomCategories() {
  return { ...customCategories };
}

/**
 * Get all domains in a specific category (defaults + custom)
 */
export function getDomainsInCategory(category) {
  const defaults = category === 'productive' ? DEFAULT_PRODUCTIVE
    : category === 'unproductive' ? DEFAULT_UNPRODUCTIVE
    : [];

  const custom = customCategories[category] || [];

  // Merge and deduplicate
  return [...new Set([...defaults, ...custom])];
}

/**
 * Save custom categories to storage
 */
async function saveCategories() {
  await chrome.storage.local.set({ categories: customCategories });
}

/**
 * Check if a domain is considered social media (for goal tracking)
 */
export function isSocialMedia(domain) {
  const socialDomains = [
    'youtube.com', 'instagram.com', 'facebook.com', 'x.com', 'twitter.com',
    'tiktok.com', 'reddit.com', 'snapchat.com', 'pinterest.com', 'tumblr.com',
    'discord.com', 'twitch.tv'
  ];
  return matchesList(domain, socialDomains);
}

/**
 * Get the color for a category
 */
export function getCategoryColor(category) {
  switch (category) {
    case 'productive': return '#10b981';
    case 'unproductive': return '#ef4444';
    case 'neutral': return '#6b7280';
    default: return '#6b7280';
  }
}

/**
 * Get the label for a category
 */
export function getCategoryLabel(category) {
  switch (category) {
    case 'productive': return 'Productive';
    case 'unproductive': return 'Unproductive';
    case 'neutral': return 'Neutral';
    default: return 'Unknown';
  }
}

export { DEFAULT_PRODUCTIVE, DEFAULT_UNPRODUCTIVE };
