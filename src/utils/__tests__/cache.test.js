/**
 * Unit tests for TranslationCache
 */

import { TranslationCache } from '../cache.js';

describe('TranslationCache', () => {
  let cache;

  beforeEach(() => {
    cache = new TranslationCache(3); // Small size for testing
  });

  describe('set and get', () => {
    test('should cache and retrieve translations', () => {
      cache.set('Hello', 'en', 'vi', 'Xin chào');
      const result = cache.get('Hello', 'en', 'vi');
      expect(result).toBe('Xin chào');
    });

    test('should return null for non-existent translations', () => {
      const result = cache.get('Not cached', 'en', 'vi');
      expect(result).toBeNull();
    });

    test('should handle different language pairs', () => {
      cache.set('Hello', 'en', 'vi', 'Xin chào');
      cache.set('Hello', 'en', 'lo', 'ສະບາຍດີ');
      
      expect(cache.get('Hello', 'en', 'vi')).toBe('Xin chào');
      expect(cache.get('Hello', 'en', 'lo')).toBe('ສະບາຍດີ');
    });

    test('should treat same text with different languages as different', () => {
      cache.set('Test', 'en', 'vi', 'Translation 1');
      cache.set('Test', 'vi', 'en', 'Translation 2');
      
      expect(cache.get('Test', 'en', 'vi')).toBe('Translation 1');
      expect(cache.get('Test', 'vi', 'en')).toBe('Translation 2');
    });
  });

  describe('LRU eviction', () => {
    test('should evict least recently used item when at capacity', () => {
      cache.set('First', 'en', 'vi', 'Translation 1');
      cache.set('Second', 'en', 'vi', 'Translation 2');
      cache.set('Third', 'en', 'vi', 'Translation 3');
      
      // All three should be cached
      expect(cache.get('First', 'en', 'vi')).toBe('Translation 1');
      expect(cache.get('Second', 'en', 'vi')).toBe('Translation 2');
      expect(cache.get('Third', 'en', 'vi')).toBe('Translation 3');
      
      // Add fourth item, should evict first
      cache.set('Fourth', 'en', 'vi', 'Translation 4');
      
      expect(cache.get('First', 'en', 'vi')).toBeNull();
      expect(cache.get('Fourth', 'en', 'vi')).toBe('Translation 4');
    });

    test('should update access order when retrieving items', () => {
      cache.set('A', 'en', 'vi', 'Translation A');
      cache.set('B', 'en', 'vi', 'Translation B');
      cache.set('C', 'en', 'vi', 'Translation C');
      
      // Access A to make it most recently used
      cache.get('A', 'en', 'vi');
      
      // Add D, should evict B (least recently used)
      cache.set('D', 'en', 'vi', 'Translation D');
      
      expect(cache.get('A', 'en', 'vi')).toBe('Translation A');
      expect(cache.get('B', 'en', 'vi')).toBeNull();
      expect(cache.get('C', 'en', 'vi')).toBe('Translation C');
      expect(cache.get('D', 'en', 'vi')).toBe('Translation D');
    });
  });

  describe('has', () => {
    test('should check if translation is cached', () => {
      expect(cache.has('Hello', 'en', 'vi')).toBe(false);
      
      cache.set('Hello', 'en', 'vi', 'Xin chào');
      
      expect(cache.has('Hello', 'en', 'vi')).toBe(true);
    });
  });

  describe('clear', () => {
    test('should clear all cached entries', () => {
      cache.set('A', 'en', 'vi', 'Translation A');
      cache.set('B', 'en', 'vi', 'Translation B');
      
      expect(cache.cache.size).toBe(2);
      
      cache.clear();
      
      expect(cache.cache.size).toBe(0);
      expect(cache.get('A', 'en', 'vi')).toBeNull();
    });

    test('should reset statistics', () => {
      cache.set('A', 'en', 'vi', 'Translation A');
      cache.get('A', 'en', 'vi'); // Hit
      cache.get('B', 'en', 'vi'); // Miss
      
      cache.clear();
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe('statistics', () => {
    test('should track hits and misses', () => {
      cache.set('A', 'en', 'vi', 'Translation A');
      
      cache.get('A', 'en', 'vi'); // Hit
      cache.get('A', 'en', 'vi'); // Hit
      cache.get('B', 'en', 'vi'); // Miss
      cache.get('C', 'en', 'vi'); // Miss
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBe('50.00%');
    });

    test('should calculate hit rate correctly', () => {
      cache.set('A', 'en', 'vi', 'Translation A');
      
      cache.get('A', 'en', 'vi'); // Hit
      cache.get('A', 'en', 'vi'); // Hit
      cache.get('A', 'en', 'vi'); // Hit
      cache.get('B', 'en', 'vi'); // Miss
      
      const stats = cache.getStats();
      expect(stats.hitRate).toBe('75.00%');
    });

    test('should show cache utilization', () => {
      cache.set('A', 'en', 'vi', 'Translation A');
      cache.set('B', 'en', 'vi', 'Translation B');
      
      const stats = cache.getStats();
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(3);
      expect(stats.utilization).toBe('66.67%');
    });
  });

  describe('hashString', () => {
    test('should generate consistent hashes', () => {
      const hash1 = cache.hashString('Hello');
      const hash2 = cache.hashString('Hello');
      expect(hash1).toBe(hash2);
    });

    test('should generate different hashes for different strings', () => {
      const hash1 = cache.hashString('Hello');
      const hash2 = cache.hashString('World');
      expect(hash1).not.toBe(hash2);
    });

    test('should handle empty string', () => {
      const hash = cache.hashString('');
      expect(hash).toBe('0');
    });

    test('should handle unicode characters', () => {
      const hash = cache.hashString('Xin chào 🇻🇳');
      expect(hash).toBeTruthy();
      expect(typeof hash).toBe('string');
    });
  });

  describe('removeOlderThan', () => {
    test('should remove entries older than specified age', async () => {
      cache.set('A', 'en', 'vi', 'Translation A');
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));
      
      cache.set('B', 'en', 'vi', 'Translation B');
      
      // Remove entries older than 5ms
      const removed = cache.removeOlderThan(5);
      
      expect(removed).toBe(1);
      expect(cache.get('A', 'en', 'vi')).toBeNull();
      expect(cache.get('B', 'en', 'vi')).toBe('Translation B');
    });
  });

  describe('removeLeastUsed', () => {
    test('should remove least frequently used entries', () => {
      cache.set('A', 'en', 'vi', 'Translation A');
      cache.set('B', 'en', 'vi', 'Translation B');
      cache.set('C', 'en', 'vi', 'Translation C');
      
      // Access some entries multiple times
      cache.get('B', 'en', 'vi');
      cache.get('B', 'en', 'vi');
      cache.get('C', 'en', 'vi');
      
      // Remove 1 least used entry (A with 0 hits)
      const removed = cache.removeLeastUsed(1);
      
      expect(removed).toBe(1);
      expect(cache.get('A', 'en', 'vi')).toBeNull();
      expect(cache.get('B', 'en', 'vi')).toBe('Translation B');
      expect(cache.get('C', 'en', 'vi')).toBe('Translation C');
    });
  });

  describe('export and import', () => {
    test('should export cache to JSON', () => {
      cache.set('A', 'en', 'vi', 'Translation A');
      cache.set('B', 'en', 'vi', 'Translation B');
      
      const json = cache.export();
      
      expect(json).toBeTruthy();
      expect(typeof json).toBe('string');
      
      const data = JSON.parse(json);
      expect(data.entries).toBeDefined();
      expect(data.stats).toBeDefined();
      expect(data.timestamp).toBeDefined();
    });

    test('should import cache from JSON', () => {
      cache.set('A', 'en', 'vi', 'Translation A');
      const json = cache.export();
      
      const newCache = new TranslationCache();
      const success = newCache.import(json);
      
      expect(success).toBe(true);
      expect(newCache.get('A', 'en', 'vi')).toBe('Translation A');
    });

    test('should preserve statistics on import', () => {
      cache.set('A', 'en', 'vi', 'Translation A');
      cache.get('A', 'en', 'vi'); // Generate some hits
      
      const json = cache.export();
      
      const newCache = new TranslationCache();
      newCache.import(json);
      
      expect(newCache.hits).toBe(cache.hits);
      expect(newCache.misses).toBe(cache.misses);
    });
  });

  describe('getSize', () => {
    test('should calculate approximate cache size', () => {
      cache.set('A', 'en', 'vi', 'Translation A');
      const size = cache.getSize();
      
      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe('number');
    });
  });

  describe('getEntries', () => {
    test('should return all cache entries', () => {
      cache.set('A', 'en', 'vi', 'Translation A');
      cache.set('B', 'en', 'vi', 'Translation B');
      
      const entries = cache.getEntries();
      
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(2);
      expect(entries[0]).toHaveProperty('key');
      expect(entries[0]).toHaveProperty('value');
      expect(entries[0]).toHaveProperty('hits');
      expect(entries[0]).toHaveProperty('age');
    });
  });
});

