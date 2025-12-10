/**
 * Utility functions for URL normalization, robots.txt checking, and other helpers
 */

/**
 * Normalizes a URL by removing tracking parameters and cleaning it up
 * @param {string} url - The URL to normalize
 * @returns {string} - Normalized URL
 */
function normalizeUrl(url) {
  if (!url || typeof url !== 'string') {
    return '';
  }

  try {
    const urlObj = new URL(url);
    
    // Remove common tracking parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'ref', 'source', 'fbclid', 'gclid', 'msclkid', 'twclid',
      'igshid', '_ga', '_gid', 'mc_cid', 'mc_eid'
    ];
    
    trackingParams.forEach(param => {
      urlObj.searchParams.delete(param);
    });

    // Return normalized URL without trailing slash (except for root)
    let normalized = urlObj.toString();
    if (normalized.endsWith('/') && urlObj.pathname !== '/') {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  } catch (error) {
    // If URL parsing fails, return original
    return url;
  }
}

/**
 * Checks if a robots.txt file allows access to a given path
 * This is a simplified check - in production, you'd want a more robust parser
 * @param {string} robotsTxt - Content of robots.txt file
 * @param {string} userAgent - User agent string
 * @param {string} path - Path to check (e.g., '/search')
 * @returns {boolean} - True if access is allowed, false otherwise
 */
function checkRobotsTxt(robotsTxt, userAgent, path) {
  if (!robotsTxt || typeof robotsTxt !== 'string') {
    // If no robots.txt, assume access is allowed
    return true;
  }

  const lines = robotsTxt.split('\n').map(line => line.trim());
  let currentUserAgent = null;
  let disallowRules = [];
  let allowRules = [];

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    if (lowerLine.startsWith('user-agent:')) {
      const agent = line.substring(11).trim();
      if (agent === '*' || userAgent.includes(agent)) {
        currentUserAgent = agent;
        disallowRules = [];
        allowRules = [];
      } else {
        currentUserAgent = null;
      }
    } else if (currentUserAgent !== null) {
      if (lowerLine.startsWith('disallow:')) {
        const rule = line.substring(9).trim();
        if (rule) {
          disallowRules.push(rule);
        } else {
          // Empty disallow means allow all
          disallowRules = [];
        }
      } else if (lowerLine.startsWith('allow:')) {
        const rule = line.substring(6).trim();
        if (rule) {
          allowRules.push(rule);
        }
      }
    }
  }

  // Check if path matches any disallow rule
  for (const rule of disallowRules) {
    if (pathMatchesRule(path, rule)) {
      // Check if there's an allow rule that overrides
      const hasAllowOverride = allowRules.some(allowRule => pathMatchesRule(path, allowRule));
      if (!hasAllowOverride) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Checks if a path matches a robots.txt rule pattern
 * @param {string} path - Path to check
 * @param {string} rule - Rule pattern (e.g., '/search' or '/search*')
 * @returns {boolean} - True if path matches rule
 */
function pathMatchesRule(path, rule) {
  if (!rule || !path) {
    return false;
  }

  // Exact match
  if (path === rule) {
    return true;
  }

  // Wildcard match
  if (rule.endsWith('*')) {
    const prefix = rule.slice(0, -1);
    return path.startsWith(prefix);
  }

  // Prefix match (common in robots.txt)
  if (path.startsWith(rule)) {
    return true;
  }

  return false;
}

/**
 * Fetches robots.txt for a given domain
 * @param {string} baseUrl - Base URL (e.g., 'https://duckduckgo.com')
 * @param {string} userAgent - User agent string
 * @returns {Promise<string|null>} - robots.txt content or null if not found/error
 */
async function fetchRobotsTxt(baseUrl, userAgent) {
  try {
    const robotsUrl = new URL('/robots.txt', baseUrl).toString();
    const response = await fetch(robotsUrl, {
      headers: {
        'User-Agent': userAgent
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    if (response.ok) {
      return await response.text();
    }
    return null;
  } catch (error) {
    // Silently fail - if robots.txt can't be fetched, assume access is allowed
    return null;
  }
}

module.exports = {
  normalizeUrl,
  checkRobotsTxt,
  fetchRobotsTxt,
  pathMatchesRule
};

