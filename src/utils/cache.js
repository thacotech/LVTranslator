/**
 * Translation Cache with LRU (Least Recently Used) eviction
 * Caches translation results to avoid duplicate API calls
 */

class TranslationCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Generate cache key from translation parameters
   * @param {string} text - Text to translate
   * @param {string} sourceLang - Source language
   * @param {string} targetLang - Target language
   * @returns {string} - Cache key
   */
  generateKey(text, sourceLang, targetLang) {
    const hash = this.hashString(text);
    return `${sourceLang}-${targetLang}-${hash}`;
  }

  /**
   * Get cached translation
   * @param {string} text - Text to translate
   * @param {string} sourceLang - Source language
   * @param {string} targetLang - Target language
   * @returns {string|null} - Cached translation or null
   */
  get(text, sourceLang, targetLang) {
    const key = this.generateKey(text, sourceLang, targetLang);
    return this.getByKey(key);
  }

  /**
   * Get cached value by key
   * @param {string} key - Cache key
   * @returns {any|null} - Cached value or null
   */
  getByKey(key) {
    if (this.cache.has(key)) {
      // Move to end (most recently used)
      const entry = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, entry);
      
      // Update statistics
      entry.hits++;
      entry.lastAccessed = Date.now();
      this.hits++;
      
      return entry.value;
    }
    
    this.misses++;
    return null;
  }

  /**
   * Set cached translation
   * @param {string} text - Original text
   * @param {string} sourceLang - Source language
   * @param {string} targetLang - Target language
   * @param {string} translation - Translation result
   */
  set(text, sourceLang, targetLang, translation) {
    const key = this.generateKey(text, sourceLang, targetLang);
    this.setByKey(key, translation);
  }

  /**
   * Set cached value by key
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   */
  setByKey(key, value) {
    // If key exists, remove it first (will be added to end)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    // If at capacity, remove least recently used (first item)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    // Add new entry
    const entry = {
      value,
      hits: 0,
      created: Date.now(),
      lastAccessed: Date.now()
    };

    this.cache.set(key, entry);
  }

  /**
   * Check if translation is cached
   * @param {string} text - Text to check
   * @param {string} sourceLang - Source language
   * @param {string} targetLang - Target language
   * @returns {boolean} - Whether translation is cached
   */
  has(text, sourceLang, targetLang) {
    const key = this.generateKey(text, sourceLang, targetLang);
    return this.cache.has(key);
  }

  /**
   * Clear all cached entries
   */
  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total * 100).toFixed(2) : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: `${hitRate}%`,
      utilization: `${(this.cache.size / this.maxSize * 100).toFixed(2)}%`
    };
  }

  /**
   * Get all cache entries (for debugging)
   * @returns {Array} - Array of cache entries
   */
  getEntries() {
    return Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      value: entry.value,
      hits: entry.hits,
      age: Date.now() - entry.created,
      lastAccessed: entry.lastAccessed
    }));
  }

  /**
   * Hash string for cache key
   * Simple hash function for generating cache keys
   * @param {string} str - String to hash
   * @returns {string} - Hash
   */
  hashString(str) {
    let hash = 0;
    
    if (str.length === 0) {
      return '0';
    }

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    // Convert to base36 for shorter keys
    return Math.abs(hash).toString(36);
  }

  /**
   * Remove entries older than specified age
   * @param {number} maxAge - Maximum age in milliseconds
   * @returns {number} - Number of entries removed
   */
  removeOlderThan(maxAge) {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.created > maxAge) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Remove least frequently used entries
   * @param {number} count - Number of entries to remove
   * @returns {number} - Number of entries actually removed
   */
  removeLeastUsed(count) {
    // Get entries sorted by hits (ascending)
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.hits - b.hits);

    const toRemove = Math.min(count, entries.length);
    
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }

    return toRemove;
  }

  /**
   * Export cache to JSON
   * @returns {string} - JSON representation of cache
   */
  export() {
    const data = {
      entries: Array.from(this.cache.entries()),
      stats: {
        hits: this.hits,
        misses: this.misses,
        maxSize: this.maxSize
      },
      timestamp: Date.now()
    };

    return JSON.stringify(data);
  }

  /**
   * Import cache from JSON
   * @param {string} json - JSON string to import
   */
  import(json) {
    try {
      const data = JSON.parse(json);
      
      this.cache.clear();
      this.hits = data.stats.hits || 0;
      this.misses = data.stats.misses || 0;

      for (const [key, entry] of data.entries) {
        this.cache.set(key, entry);
      }

      return true;
    } catch (error) {
      console.error('Failed to import cache:', error);
      return false;
    }
  }

  /**
   * Get cache size in bytes (approximate)
   * @returns {number} - Approximate size in bytes
   */
  getSize() {
    const json = this.export();
    return new Blob([json]).size;
  }
}

// Create singleton instance
const cacheInstance = new TranslationCache();

// Export singleton
export default cacheInstance;

// Also export class for custom instances
export { TranslationCache };

// Make available globally for backward compatibility
if (typeof window !== 'undefined') {
  window.TranslationCache = cacheInstance;
}

