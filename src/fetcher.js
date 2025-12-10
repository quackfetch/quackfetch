/**
 * HTTP fetcher with rate limiting, retry logic, and robots.txt checking
 */

const { fetchRobotsTxt, checkRobotsTxt } = require('./utils');

// Per-host rate limit tracking
const rateLimitMap = new Map();

/**
 * Sleeps for a specified number of milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Gets the rate limit tracker for a specific host
 * @param {string} host - Hostname
 * @param {number} rateLimitMs - Minimum milliseconds between requests
 * @returns {Object} - Rate limit tracker
 */
function getRateLimitTracker(host, rateLimitMs) {
  if (!rateLimitMap.has(host)) {
    rateLimitMap.set(host, {
      lastRequest: 0,
      rateLimitMs: rateLimitMs
    });
  }
  return rateLimitMap.get(host);
}

/**
 * Enforces rate limiting for a given host
 * @param {string} host - Hostname
 * @param {number} rateLimitMs - Minimum milliseconds between requests
 * @returns {Promise<void>}
 */
async function enforceRateLimit(host, rateLimitMs) {
  const tracker = getRateLimitTracker(host, rateLimitMs);
  const now = Date.now();
  const timeSinceLastRequest = now - tracker.lastRequest;

  if (timeSinceLastRequest < rateLimitMs) {
    const waitTime = rateLimitMs - timeSinceLastRequest;
    await sleep(waitTime);
  }

  tracker.lastRequest = Date.now();
}

/**
 * Fetches HTML content from a URL with retry logic
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {string} options.userAgent - User agent string
 * @param {number} options.timeout - Request timeout in milliseconds (default: 10000)
 * @param {number} options.retries - Number of retry attempts (default: 2)
 * @param {number} options.retryDelay - Initial retry delay in milliseconds (default: 1000)
 * @param {boolean} options.checkRobots - Whether to check robots.txt (default: true)
 * @returns {Promise<string>} - HTML content
 * @throws {Error} - If fetch fails after retries
 */
async function fetchHtml(url, options = {}) {
  const {
    userAgent = 'quackfetch/0.1 (+https://github.com/your-repo/quackfetch)',
    timeout = 10000,
    retries = 2,
    retryDelay = 1000,
    checkRobots = true
  } = options;

  const urlObj = new URL(url);
  const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;
  const path = urlObj.pathname + urlObj.search;

  // Check robots.txt if enabled
  if (checkRobots) {
    const robotsTxt = await fetchRobotsTxt(baseUrl, userAgent);
    if (robotsTxt && !checkRobotsTxt(robotsTxt, userAgent, path)) {
      throw new Error(`Access to ${path} is disallowed by robots.txt`);
    }
  }

  let lastError;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      return html;

    } catch (error) {
      lastError = error;
      
      // Don't retry on abort (timeout) or robots.txt errors
      if (error.name === 'AbortError' || error.message.includes('robots.txt')) {
        throw error;
      }

      // Exponential backoff for retries
      if (attempt < retries) {
        const delay = retryDelay * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw new Error(`Failed to fetch ${url} after ${retries + 1} attempts: ${lastError.message}`);
}

/**
 * Searches DuckDuckGo HTML search page
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @param {string} options.userAgent - User agent string
 * @param {number} options.rateLimitMs - Rate limit in milliseconds (default: 1000)
 * @param {number} options.timeout - Request timeout in milliseconds
 * @param {boolean} options.checkRobots - Whether to check robots.txt
 * @returns {Promise<string>} - HTML content of search results
 */
async function searchDuckDuckGoHtml(query, options = {}) {
  const {
    userAgent = 'quackfetch/0.1 (+https://github.com/your-repo/quackfetch)',
    rateLimitMs = 1000, // 1 request per second default
    timeout = 10000,
    checkRobots = true
  } = options;

  // Encode query for URL
  const encodedQuery = encodeURIComponent(query);
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;

  // Enforce rate limiting
  await enforceRateLimit('html.duckduckgo.com', rateLimitMs);

  // Fetch HTML
  const html = await fetchHtml(searchUrl, {
    userAgent,
    timeout,
    checkRobots
  });

  return html;
}

module.exports = {
  fetchHtml,
  searchDuckDuckGoHtml,
  enforceRateLimit
};

