/**
 * Unit tests for StorageManager
 */

import { StorageManager } from '../storageManager.js';

describe('StorageManager', () => {
  let storage;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    storage = new StorageManager();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('basic operations', () => {
    test('should store and retrieve data', () => {
      storage.set('test-key', 'test-value', false);
      const value = storage.get('test-key', false);
      
      expect(value).toBe('test-value');
    });

    test('should store and retrieve objects', () => {
      const obj = { name: 'Test', value: 123 };
      storage.set('test-obj', obj, false);
      const retrieved = storage.get('test-obj', false);
      
      expect(retrieved).toEqual(obj);
    });

    test('should return null for non-existent keys', () => {
      const value = storage.get('non-existent');
      expect(value).toBeNull();
    });

    test('should remove items', () => {
      storage.set('test-key', 'test-value', false);
      expect(storage.has('test-key')).toBe(true);
      
      storage.remove('test-key');
      expect(storage.has('test-key')).toBe(false);
    });

    test('should clear all items', () => {
      storage.set('key1', 'value1', false);
      storage.set('key2', 'value2', false);
      
      expect(storage.keys().length).toBeGreaterThan(0);
      
      storage.clear();
      expect(storage.keys().length).toBe(0);
    });

    test('should check if key exists', () => {
      expect(storage.has('test-key')).toBe(false);
      
      storage.set('test-key', 'test-value', false);
      expect(storage.has('test-key')).toBe(true);
    });

    test('should get all keys', () => {
      storage.set('key1', 'value1', false);
      storage.set('key2', 'value2', false);
      storage.set('key3', 'value3', false);
      
      const keys = storage.keys();
      expect(keys.length).toBeGreaterThanOrEqual(3);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
    });
  });

  describe('compression', () => {
    test('should compress large data', () => {
      const largeData = 'x'.repeat(2000);
      storage.setCompression(true);
      storage.set('large-data', largeData, true);
      
      const retrieved = storage.get('large-data', true);
      expect(retrieved).toBe(largeData);
    });

    test('should not compress small data', () => {
      const smallData = 'small';
      const shouldCompress = storage.shouldCompress(smallData);
      expect(shouldCompress).toBe(false);
    });

    test('should detect data that needs compression', () => {
      const largeData = 'x'.repeat(2000);
      const shouldCompress = storage.shouldCompress(largeData);
      expect(shouldCompress).toBe(true);
    });

    test('should handle compression toggle', () => {
      storage.setCompression(true);
      expect(storage.compressionEnabled).toBe(true);
      
      storage.setCompression(false);
      expect(storage.compressionEnabled).toBe(false);
    });
  });

  describe('usage monitoring', () => {
    test('should calculate storage usage', () => {
      storage.set('test1', 'value1', false);
      storage.set('test2', 'value2', false);
      
      const usage = storage.getUsage();
      
      expect(usage).toHaveProperty('used');
      expect(usage).toHaveProperty('quota');
      expect(usage).toHaveProperty('usage');
      expect(usage).toHaveProperty('items');
      expect(usage.items).toBeGreaterThanOrEqual(2);
    });

    test('should warn when approaching quota', () => {
      const usage = storage.getUsage();
      expect(typeof usage.warning).toBe('boolean');
    });

    test('should track item sizes', () => {
      storage.set('small', 'x', false);
      storage.set('large', 'x'.repeat(1000), false);
      
      const usage = storage.getUsage();
      expect(usage.itemSizes).toHaveProperty('small');
      expect(usage.itemSizes).toHaveProperty('large');
      expect(usage.itemSizes.large).toBeGreaterThan(usage.itemSizes.small);
    });
  });

  describe('cleanup', () => {
    test('should remove old items', async () => {
      // Set items with old timestamp
      const oldData = {
        _compressed: false,
        value: 'old-value',
        _timestamp: Date.now() - (31 * 24 * 60 * 60 * 1000) // 31 days ago
      };
      localStorage.setItem('old-item', JSON.stringify(oldData));
      
      // Set recent item
      storage.set('new-item', 'new-value', false);
      
      // Cleanup items older than 30 days
      const result = storage.cleanup({ maxAge: 30 * 24 * 60 * 60 * 1000 });
      
      expect(result.removed).toBeGreaterThan(0);
      expect(storage.has('old-item')).toBe(false);
      expect(storage.has('new-item')).toBe(true);
    });

    test('should respect maxItems limit', () => {
      // Add more items than limit
      for (let i = 0; i < 10; i++) {
        storage.set(`item${i}`, `value${i}`, false);
      }
      
      // Cleanup with maxItems = 5
      const result = storage.cleanup({ maxItems: 5, maxAge: Infinity });
      
      expect(result.removed).toBeGreaterThanOrEqual(5);
      expect(storage.keys().filter(k => k.startsWith('item')).length).toBeLessThanOrEqual(5);
    });

    test('should clean up by pattern', () => {
      storage.set('history-1', 'value1', false);
      storage.set('history-2', 'value2', false);
      storage.set('settings-1', 'value3', false);
      
      const result = storage.cleanup({
        pattern: /^history-/,
        maxItems: 0,
        maxAge: 0
      });
      
      expect(storage.has('history-1')).toBe(false);
      expect(storage.has('history-2')).toBe(false);
      expect(storage.has('settings-1')).toBe(true);
    });

    test('should return cleanup statistics', () => {
      storage.set('item1', 'value1', false);
      
      const result = storage.cleanup({ maxAge: 0 });
      
      expect(result).toHaveProperty('removed');
      expect(result).toHaveProperty('freedSpace');
      expect(result).toHaveProperty('remainingItems');
    });
  });

  describe('export and import', () => {
    test('should export all data', () => {
      storage.set('key1', 'value1', false);
      storage.set('key2', 'value2', false);
      
      const exported = storage.export();
      
      expect(exported).toHaveProperty('key1');
      expect(exported).toHaveProperty('key2');
      expect(exported.key1).toBe('value1');
      expect(exported.key2).toBe('value2');
    });

    test('should import data', () => {
      const data = {
        'key1': 'value1',
        'key2': 'value2'
      };
      
      storage.import(data, false);
      
      expect(storage.get('key1', false)).toBe('value1');
      expect(storage.get('key2', false)).toBe('value2');
    });

    test('should merge imported data', () => {
      storage.set('existing', 'value', false);
      
      const data = {
        'key1': 'value1',
        'key2': 'value2'
      };
      
      storage.import(data, true);
      
      expect(storage.get('existing', false)).toBe('value');
      expect(storage.get('key1', false)).toBe('value1');
    });

    test('should replace data when not merging', () => {
      storage.set('existing', 'value', false);
      
      const data = {
        'key1': 'value1'
      };
      
      storage.import(data, false);
      
      expect(storage.get('existing', false)).toBeNull();
      expect(storage.get('key1', false)).toBe('value1');
    });
  });

  describe('statistics', () => {
    test('should provide detailed statistics', () => {
      storage.set('history-1', 'value1', false);
      storage.set('settings-1', 'value2', false);
      storage.set('cache-1', 'value3', false);
      storage.set('other', 'value4', false);
      
      const stats = storage.getStats();
      
      expect(stats).toHaveProperty('categories');
      expect(stats.categories).toHaveProperty('history');
      expect(stats.categories).toHaveProperty('settings');
      expect(stats.categories).toHaveProperty('cache');
      expect(stats.categories).toHaveProperty('other');
      
      expect(stats.categories.history).toBeGreaterThanOrEqual(1);
      expect(stats.categories.settings).toBeGreaterThanOrEqual(1);
      expect(stats.categories.cache).toBeGreaterThanOrEqual(1);
    });
  });

  describe('configuration', () => {
    test('should update max items', () => {
      storage.setMaxItems(100);
      expect(storage.maxItems).toBe(100);
    });

    test('should update max age', () => {
      storage.setMaxAge(60); // 60 days
      expect(storage.maxAge).toBe(60 * 24 * 60 * 60 * 1000);
    });
  });
});

