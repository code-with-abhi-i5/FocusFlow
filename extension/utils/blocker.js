/**
 * FocusFlow — Website Blocker (Focus Mode)
 * Uses chrome.declarativeNetRequest to redirect blocked domains to a custom block page.
 *
 * Fix: IDs start at 10000 to avoid collisions with any static rulesets.
 * Fix: remove + add happen in a SINGLE atomic updateDynamicRules call to prevent
 *      "Rule with id X does not have a unique ID" errors.
 */

const RULE_ID_BASE = 10000; // High base to avoid collisions with static rules

/**
 * Update declarativeNetRequest rules to block specified domains.
 * Atomically removes existing rules and adds new ones in one call.
 * @param {string[]} domains — list of domains to block
 */
export async function updateBlockRules(domains) {
  if (!domains || domains.length === 0) {
    await clearBlockRules();
    return;
  }

  // Get existing dynamic rule IDs so we can remove them atomically
  let existingRuleIds = [];
  try {
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    existingRuleIds = existing.map(r => r.id);
  } catch (_) {}

  // Build new rules with high, unique IDs
  const rules = domains.map((domain, index) => ({
    id: RULE_ID_BASE + index,
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
    // Single atomic call: remove old + add new simultaneously
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingRuleIds,
      addRules: rules
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
