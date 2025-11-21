/**
 * Storage Manager Utility
 * Manages localStorage with compression, cleanup, and monitoring
 */

class StorageManager {
  constructor() {
    this.storage = window.localStorage;
    this.compressionEnabled = true;
    this.maxItems = 50;
    this.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    this.warningThreshold = 0.8; // 80% of quota
  }

  /**
   * Get item from storage
   * @param {string} key - Storage key
   * @param {boolean} decompress - Whether to decompress data
   * @returns {any} - Stored value or null
   */
  get(key, decompress = true) {
    try {
      const raw = this.storage.getItem(key);
      if (!raw) {
        return null;
      }

      const data = JSON.parse(raw);

      // Check if data has compression metadata
      if (data._compressed && decompress && this.compressionEnabled) {
        return this.decompressData(data.value);
      }

      return data._compressed ? data.value : data;
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  }

  /**
   * Set item in storage
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @param {boolean} compress - Whether to compress data
   * @returns {boolean} - Whether storage was successful
   */
  set(key, value, compress = true) {
    try {
      let dataToStore = value;

      // Compress if enabled and beneficial
      if (compress && this.compressionEnabled && this.shouldCompress(value)) {
        const compressed = this.compressData(value);
        dataToStore = {
          _compressed: true,
          value: compressed,
          _timestamp: Date.now()
        };
      } else {
        dataToStore = {
          _compressed: false,
          value: value,
          _timestamp: Date.now()
        };
      }

      this.storage.setItem(key, JSON.stringify(dataToStore));
      
      // Check quota after storing
      this.checkQuota();
      
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded');
        // Try to free up space and retry
        this.cleanup();
        try {
          this.storage.setItem(key, JSON.stringify(value));
          return true;
        } catch (retryError) {
          console.error('Failed to store even after cleanup:', retryError);
          return false;
        }
      }
      console.error(`Error setting item ${key}:`, error);
      return false;
    }
  }

  /**
   * Remove item from storage
   * @param {string} key - Storage key
   */
  remove(key) {
    try {
      this.storage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
    }
  }

  /**
   * Clear all storage
   */
  clear() {
    try {
      this.storage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  /**
   * Check if key exists
   * @param {string} key - Storage key
   * @returns {boolean} - Whether key exists
   */
  has(key) {
    return this.storage.getItem(key) !== null;
  }

  /**
   * Get all keys
   * @returns {Array<string>} - Array of all keys
   */
  keys() {
    const keys = [];
    for (let i = 0; i < this.storage.length; i++) {
      keys.push(this.storage.key(i));
    }
    return keys;
  }

  /**
   * Compress data using LZ-String (if available) or simple compression
   * @param {any} data - Data to compress
   * @returns {string} - Compressed data
   */
  compressData(data) {
    const json = typeof data === 'string' ? data : JSON.stringify(data);
    
    // Use LZ-String if available
    if (typeof window.LZString !== 'undefined') {
      return window.LZString.compressToUTF16(json);
    }

    // Fallback: simple run-length encoding for repetitive data
    return this.simpleCompress(json);
  }

  /**
   * Decompress data
   * @param {string} compressed - Compressed data
   * @returns {any} - Decompressed data
   */
  decompressData(compressed) {
    try {
      // Try LZ-String first
      if (typeof window.LZString !== 'undefined') {
        const decompressed = window.LZString.decompressFromUTF16(compressed);
        return JSON.parse(decompressed);
      }

      // Fallback: simple decompression
      const json = this.simpleDecompress(compressed);
      return JSON.parse(json);
    } catch (error) {
      console.error('Decompression error:', error);
      return null;
    }
  }

  /**
   * Simple compression fallback
   * @private
   */
  simpleCompress(str) {
    // Very basic run-length encoding
    return str.replace(/(.)\1+/g, (match, char) => {
      return match.length > 3 ? `${char}#${match.length}#` : match;
    });
  }

  /**
   * Simple decompression fallback
   * @private
   */
  simpleDecompress(str) {
    return str.replace(/(.)\#(\d+)\#/g, (match, char, count) => {
      return char.repeat(parseInt(count));
    });
  }

  /**
   * Check if data should be compressed
   * @param {any} data - Data to check
   * @returns {boolean} - Whether data should be compressed
   */
  shouldCompress(data) {
    const json = typeof data === 'string' ? data : JSON.stringify(data);
    // Only compress if data is larger than 1KB
    return json.length > 1024;
  }

  /**
   * Get storage usage statistics
   * @returns {Object} - Storage usage stats
   */
  getUsage() {
    let totalSize = 0;
    const items = {};

    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      const value = this.storage.getItem(key);
      const size = new Blob([value]).size;
      
      totalSize += size;
      items[key] = size;
    }

    // Estimate quota (5MB is typical for localStorage)
    const quota = 5 * 1024 * 1024;
    const usage = totalSize / quota;

    return {
      used: totalSize,
      quota: quota,
      usage: usage,
      usagePercent: (usage * 100).toFixed(2) + '%',
      items: this.storage.length,
      itemSizes: items,
      warning: usage > this.warningThreshold
    };
  }

  /**
   * Check quota and warn if approaching limit
   */
  checkQuota() {
    const usage = this.getUsage();
    
    if (usage.warning) {
      console.warn(`localStorage usage at ${usage.usagePercent}. Consider cleaning up old data.`);
      return false;
    }
    
    return true;
  }

  /**
   * Clean up old and unnecessary data
   * @param {Object} options - Cleanup options
   * @returns {Object} - Cleanup results
   */
  cleanup(options = {}) {
    const {
      maxAge = this.maxAge,
      maxItems = this.maxItems,
      pattern = null
    } = options;

    const now = Date.now();
    let removed = 0;
    let freedSpace = 0;

    // Get all items with timestamps
    const items = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      
      // Skip system keys
      if (key.startsWith('_')) {
        continue;
      }

      // Filter by pattern if provided
      if (pattern && !key.match(pattern)) {
        continue;
      }

      try {
        const raw = this.storage.getItem(key);
        const data = JSON.parse(raw);
        const timestamp = data._timestamp || 0;
        const size = new Blob([raw]).size;

        items.push({ key, timestamp, size });
      } catch (error) {
        // Invalid data, mark for removal
        items.push({ key, timestamp: 0, size: 0 });
      }
    }

    // Sort by timestamp (oldest first)
    items.sort((a, b) => a.timestamp - b.timestamp);

    // Remove items older than maxAge
    for (const item of items) {
      if (item.timestamp && now - item.timestamp > maxAge) {
        freedSpace += item.size;
        this.storage.removeItem(item.key);
        removed++;
      }
    }

    // If still over maxItems, remove oldest items
    const remaining = items.filter(item => this.storage.getItem(item.key) !== null);
    if (remaining.length > maxItems) {
      const toRemove = remaining.slice(0, remaining.length - maxItems);
      for (const item of toRemove) {
        freedSpace += item.size;
        this.storage.removeItem(item.key);
        removed++;
      }
    }

    return {
      removed,
      freedSpace,
      remainingItems: this.storage.length
    };
  }

  /**
   * Export all storage data
   * @returns {Object} - All storage data
   */
  export() {
    const data = {};
    
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      data[key] = this.get(key);
    }

    return data;
  }

  /**
   * Import storage data
   * @param {Object} data - Data to import
   * @param {boolean} merge - Whether to merge with existing data
   */
  import(data, merge = false) {
    if (!merge) {
      this.clear();
    }

    for (const [key, value] of Object.entries(data)) {
      this.set(key, value);
    }
  }

  /**
   * Get specific storage statistics
   * @returns {Object} - Detailed statistics
   */
  getStats() {
    const usage = this.getUsage();
    const keys = this.keys();
    
    // Categorize keys
    const categories = {
      history: keys.filter(k => k.startsWith('history')).length,
      settings: keys.filter(k => k.startsWith('settings')).length,
      cache: keys.filter(k => k.startsWith('cache')).length,
      other: 0
    };
    categories.other = keys.length - categories.history - categories.settings - categories.cache;

    return {
      ...usage,
      categories,
      compressionEnabled: this.compressionEnabled,
      maxItems: this.maxItems,
      maxAge: this.maxAge
    };
  }

  /**
   * Enable/disable compression
   * @param {boolean} enabled - Whether to enable compression
   */
  setCompression(enabled) {
    this.compressionEnabled = enabled;
  }

  /**
   * Set maximum items limit
   * @param {number} max - Maximum number of items
   */
  setMaxItems(max) {
    this.maxItems = max;
  }

  /**
   * Set maximum age for items
   * @param {number} days - Maximum age in days
   */
  setMaxAge(days) {
    this.maxAge = days * 24 * 60 * 60 * 1000;
  }
}

// Create singleton instance
const storageManager = new StorageManager();

// Auto-cleanup on initialization
storageManager.cleanup();

// Export singleton
export default storageManager;

// Also export class for custom instances
export { StorageManager };

// Make available globally for backward compatibility
if (typeof window !== 'undefined') {
  window.StorageManager = storageManager;
}

