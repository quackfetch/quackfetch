/**
 * quackfetch - A modular Node.js library for searching DuckDuckGo
 * Main API entry point
 */

const { searchDuckDuckGoHtml } = require('./fetcher');
const { parseSearchHtml } = require('./parser');
const { createCache } = require('./cache');

// Default cache instance
let defaultCache = null;

/**
 * Generates a cache key from query and options
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {string} - Cache key
 */
function generateCacheKey(query, options) {
  const relevantOptions = {
    max: options.max || 10,
    useInstantApi: options.useInstantApi || false
  };
  return `search:${query}:${JSON.stringify(relevantOptions)}`;
}

/**
 * Main search function
 * @param {string} query - Search query string
 * @param {Object} options - Search options
 * @param {number} options.max - Maximum number of results (default: 10)
 * @param {number} options.cacheTTL - Cache TTL in milliseconds (default: 300000 = 5 minutes)
 * @param {number} options.cacheSize - Maximum cache size (default: 100)
 * @param {string} options.userAgent - User agent string
 * @param {number} options.rateLimit - Rate limit in milliseconds (default: 1000)
 * @param {boolean} options.useInstantApi - Use Instant Answer API (not implemented yet, default: false)
 * @param {boolean} options.useCache - Enable caching (default: true)
 * @returns {Promise<Array<Object>>} - Array of search result objects
 */
async function search(query, options = {}) {
  // Validate input
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    throw new Error('Query must be a non-empty string');
  }

  const {
    max = 10,
    cacheTTL = 300000,
    cacheSize = 100,
    userAgent = 'quackfetch/0.1 (+https://github.com/your-repo/quackfetch)',
    rateLimit = 1000,
    useInstantApi = false,
    useCache = true
  } = options;

  // Initialize cache if not already done
  if (useCache && !defaultCache) {
    defaultCache = createCache({
      maxSize: cacheSize,
      ttl: cacheTTL
    });
  }

  // Generate cache key
  const cacheKey = generateCacheKey(query, options);

  // Check cache
  if (useCache && defaultCache.has(cacheKey)) {
    const cachedResults = defaultCache.get(cacheKey);
    return cachedResults.map(result => ({
      ...result,
      cached: true
    }));
  }

  try {
    // Fetch HTML from DuckDuckGo
    const html = await searchDuckDuckGoHtml(query, {
      userAgent,
      rateLimitMs: rateLimit,
      checkRobots: true
    });

    // Parse HTML into structured results
    const results = parseSearchHtml(html, {
      maxResults: max
    });

    // Cache results
    if (useCache && results.length > 0) {
      defaultCache.set(cacheKey, results);
    }

    return results;

  } catch (error) {
    // Re-throw with more context
    throw new Error(`Search failed for query "${query}": ${error.message}`);
  }
}

/**
 * Clears the default cache
 */
function clearCache() {
  if (defaultCache) {
    defaultCache.clear();
  }
}

/**
 * Gets cache statistics
 * @returns {Object|null} - Cache stats or null if cache not initialized
 */
function getCacheStats() {
  if (defaultCache) {
    return defaultCache.getStats();
  }
  return null;
}

module.exports = {
  search,
  clearCache,
  getCacheStats
};

