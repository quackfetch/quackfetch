/**
 * LRU Cache implementation with TTL support for search results
 */

const { LRUCache } = require('lru-cache');

/**
 * Creates a new cache instance with configurable size and TTL
 * @param {Object} options - Cache options
 * @param {number} options.maxSize - Maximum number of entries (default: 100)
 * @param {number} options.ttl - Time to live in milliseconds (default: 300000 = 5 minutes)
 * @returns {Object} - Cache instance with get, set, has, clear methods
 */
function createCache(options = {}) {
  const {
    maxSize = 100,
    ttl = 300000 // 5 minutes default
  } = options;

  const cache = new LRUCache({
    max: maxSize,
    ttl: ttl,
    updateAgeOnGet: false,
    updateAgeOnHas: false
  });

  return {
    /**
     * Get a value from cache
     * @param {string} key - Cache key
     * @returns {*} - Cached value or undefined
     */
    get(key) {
      return cache.get(key);
    },

    /**
     * Set a value in cache
     * @param {string} key - Cache key
     * @param {*} value - Value to cache
     */
    set(key, value) {
      cache.set(key, value);
    },

    /**
     * Check if a key exists in cache
     * @param {string} key - Cache key
     * @returns {boolean} - True if key exists
     */
    has(key) {
      return cache.has(key);
    },

    /**
     * Clear all entries from cache
     */
    clear() {
      cache.clear();
    },

    /**
     * Get cache statistics
     * @returns {Object} - Cache stats
     */
    getStats() {
      return {
        size: cache.size,
        calculatedSize: cache.calculatedSize,
        maxSize: maxSize,
        ttl: ttl
      };
    }
  };
}

module.exports = {
  createCache
};

