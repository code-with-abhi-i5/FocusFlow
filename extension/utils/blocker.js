/**
 * FocusFlow — Website Blocker (Focus Mode)
 * Uses chrome.declarativeNetRequest to redirect blocked domains to a custom block page.
 */

const RULESET_ID = 'focus_mode_rules';

/**
 * Update declarativeNetRequest rules to block specified domains
 * @param {string[]} domains — list of domains to block
 */
export async function updateBlockRules(domains) {
  if (!domains || domains.length === 0) return;

  // Remove existing dynamic rules first
  await clearBlockRules();

  // Create redirect rules for each domain
  const rules = domains.map((domain, index) => ({
    id: index + 1,
    priority: 1,
    action: {
      type: 'redirect',
      redirect: {
        extensionPath: '/blocked/blocked.html'
      }
    },
    condition: {
      urlFilter: `||${domain}`,
      resourceTypes: ['main_frame']
    }
  }));

  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: rules,
      removeRuleIds: [] // Already cleared above
    });
    console.log(`FocusFlow: Blocked ${domains.length} domains`);
  } catch (error) {
    console.error('FocusFlow: Failed to update block rules', error);
  }
}

/**
 * Clear all dynamic blocking rules
 */
export async function clearBlockRules() {
  try {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const ruleIds = existingRules.map(rule => rule.id);

    if (ruleIds.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: ruleIds,
        addRules: []
      });
    }
    console.log('FocusFlow: Cleared all block rules');
  } catch (error) {
    console.error('FocusFlow: Failed to clear block rules', error);
  }
}

/**
 * Check if a domain is currently blocked
 * @param {string} domain
 * @returns {Promise<boolean>}
 */
export async function isDomainBlocked(domain) {
  try {
    const rules = await chrome.declarativeNetRequest.getDynamicRules();
    return rules.some(rule => {
      const filter = rule.condition?.urlFilter || '';
      return filter.includes(domain);
    });
  } catch {
    return false;
  }
}

/**
 * Get the list of currently blocked domains
 * @returns {Promise<string[]>}
 */
export async function getBlockedDomains() {
  try {
    const rules = await chrome.declarativeNetRequest.getDynamicRules();
    return rules.map(rule => {
      const filter = rule.condition?.urlFilter || '';
      return filter.replace('||', '');
    }).filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Default domains to suggest for blocking
 */
export const DEFAULT_BLOCK_SUGGESTIONS = [
  'youtube.com',
  'instagram.com',
  'facebook.com',
  'x.com',
  'twitter.com',
  'tiktok.com',
  'reddit.com',
  'netflix.com',
  'twitch.tv',
  'discord.com'
];
