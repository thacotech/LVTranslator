/**
 * TranslationMemoryService Unit Tests
 */

import TranslationMemoryService from '../TranslationMemoryService';

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem: jest.fn((key) => localStorageMock.store[key] || null),
  setItem: jest.fn((key, value) => {
    localStorageMock.store[key] = value;
  }),
  removeItem: jest.fn((key) => {
    delete localStorageMock.store[key];
  }),
  clear: jest.fn(() => {
    localStorageMock.store = {};
  })
};

global.localStorage = localStorageMock;

describe('TranslationMemoryService', () => {
  let service;

  beforeEach(() => {
    localStorageMock.clear();
    service = new TranslationMemoryService(500);
  });

  describe('Initialization', () => {
    test('should initialize with empty memory', () => {
      expect(service.memory.size).toBe(0);
      expect(service.maxSize).toBe(500);
    });

    test('should load existing memory from storage', async () => {
      const existingData = {
        'id1': { source: 'Hello', target: 'Xin chào', category: 'General', usageCount: 5, timestamp: Date.now() }
      };
      localStorageMock.store['lvtranslator_translation_memory'] = JSON.stringify(existingData);

      const newService = new TranslationMemoryService();
      await newService.loadMemory();

      expect(newService.memory.size).toBe(1);
    });
  });

  describe('Add Items', () => {
    test('should add new item successfully', () => {
      const id = service.addItem('Hello', 'Xin chào', 'Greetings');
      
      expect(id).toBeDefined();
      expect(service.memory.size).toBe(1);
      
      const item = service.memory.get(id);
      expect(item.source).toBe('Hello');
      expect(item.target).toBe('Xin chào');
      expect(item.category).toBe('Greetings');
      expect(item.usageCount).toBe(1);
    });

    test('should not add duplicate items', () => {
      service.addItem('Hello', 'Xin chào');
      service.addItem('Hello', 'Xin chào');
      
      expect(service.memory.size).toBe(1);
    });

    test('should increment usage count on duplicate', () => {
      const id1 = service.addItem('Hello', 'Xin chào');
      service.addItem('Hello', 'Xin chào');
      
      const item = service.memory.get(id1);
      expect(item.usageCount).toBe(2);
    });

    test('should handle empty strings', () => {
      const id = service.addItem('', '');
      expect(id).toBeNull();
      expect(service.memory.size).toBe(0);
    });
  });

  describe('Update Items', () => {
    test('should update existing item', () => {
      const id = service.addItem('Hello', 'Xin chào');
      service.updateItem(id, 'Hi', 'Chào', 'Casual');
      
      const item = service.memory.get(id);
      expect(item.source).toBe('Hi');
      expect(item.target).toBe('Chào');
      expect(item.category).toBe('Casual');
    });

    test('should return false for non-existent item', () => {
      const result = service.updateItem('nonexistent', 'test', 'test');
      expect(result).toBe(false);
    });
  });

  describe('Delete Items', () => {
    test('should delete existing item', () => {
      const id = service.addItem('Hello', 'Xin chào');
      const result = service.deleteItem(id);
      
      expect(result).toBe(true);
      expect(service.memory.size).toBe(0);
    });

    test('should return false for non-existent item', () => {
      const result = service.deleteItem('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('Search and Suggestions', () => {
    beforeEach(() => {
      service.addItem('Hello world', 'Xin chào thế giới');
      service.addItem('Hello there', 'Xin chào bạn');
      service.addItem('Good morning', 'Chào buổi sáng');
      service.addItem('Good evening', 'Chào buổi tối');
    });

    test('should find suggestions by prefix', () => {
      const suggestions = service.getSuggestions('Hello');
      expect(suggestions.length).toBe(2);
    });

    test('should limit suggestions', () => {
      const suggestions = service.getSuggestions('', 2);
      expect(suggestions.length).toBeLessThanOrEqual(2);
    });

    test('should search by query', () => {
      const results = service.search('Hello');
      expect(results.length).toBe(2);
    });

    test('should search by category', () => {
      service.addItem('Test', 'Kiểm tra', 'Technical');
      const results = service.search('', 'Technical');
      expect(results.length).toBeGreaterThan(0);
    });

    test('should return empty for no matches', () => {
      const suggestions = service.getSuggestions('xyz123');
      expect(suggestions.length).toBe(0);
    });
  });

  describe('Categories', () => {
    test('should get all unique categories', () => {
      service.addItem('A', 'B', 'Cat1');
      service.addItem('C', 'D', 'Cat2');
      service.addItem('E', 'F', 'Cat1');
      
      const categories = service.getAllCategories();
      expect(categories).toContain('Cat1');
      expect(categories).toContain('Cat2');
      expect(categories.length).toBe(2);
    });

    test('should return empty array when no items', () => {
      const categories = service.getAllCategories();
      expect(categories).toEqual([]);
    });
  });

  describe('LRU Eviction', () => {
    test('should evict oldest when reaching max size', () => {
      const smallService = new TranslationMemoryService(3);
      
      smallService.addItem('A', '1');
      smallService.addItem('B', '2');
      smallService.addItem('C', '3');
      smallService.addItem('D', '4'); // Should evict 'A'
      
      expect(smallService.memory.size).toBe(3);
      
      const items = smallService.getMemoryItems();
      const sources = items.map(item => item.source);
      expect(sources).not.toContain('A');
      expect(sources).toContain('D');
    });

    test('should keep most recently used items', () => {
      const smallService = new TranslationMemoryService(3);
      
      const id1 = smallService.addItem('A', '1');
      smallService.addItem('B', '2');
      smallService.addItem('C', '3');
      
      // Use 'A' again
      smallService.addItem('A', '1');
      
      // Add new item - should evict 'B' (oldest unused)
      smallService.addItem('D', '4');
      
      const items = smallService.getMemoryItems();
      const sources = items.map(item => item.source);
      expect(sources).toContain('A');
      expect(sources).not.toContain('B');
    });
  });

  describe('Export/Import', () => {
    beforeEach(() => {
      service.addItem('Hello', 'Xin chào', 'Greetings');
      service.addItem('Goodbye', 'Tạm biệt', 'Greetings');
    });

    test('should export to JSON', () => {
      const json = service.exportToJson();
      const data = JSON.parse(json);
      
      expect(data.version).toBe('1.0');
      expect(data.exportDate).toBeDefined();
      expect(Object.keys(data.memory).length).toBe(2);
    });

    test('should import from JSON (merge)', () => {
      const exported = service.exportToJson();
      
      const newService = new TranslationMemoryService();
      const result = newService.importFromJson(exported, true);
      
      expect(result.imported).toBe(2);
      expect(newService.memory.size).toBe(2);
    });

    test('should import from JSON (replace)', () => {
      const exported = service.exportToJson();
      
      const newService = new TranslationMemoryService();
      newService.addItem('Test', 'Test');
      
      const result = newService.importFromJson(exported, false);
      
      expect(result.imported).toBe(2);
      expect(newService.memory.size).toBe(2);
    });

    test('should handle invalid JSON', () => {
      const result = service.importFromJson('invalid json', true);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should validate import data format', () => {
      const invalidData = JSON.stringify({ invalid: 'data' });
      const result = service.importFromJson(invalidData, true);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Persistence', () => {
    test('should save to localStorage', async () => {
      service.addItem('Hello', 'Xin chào');
      await service.saveMemory();
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'lvtranslator_translation_memory',
        expect.any(String)
      );
    });

    test('should load from localStorage', async () => {
      service.addItem('Hello', 'Xin chào');
      await service.saveMemory();
      
      const newService = new TranslationMemoryService();
      await newService.loadMemory();
      
      expect(newService.memory.size).toBe(1);
    });
  });

  describe('Performance', () => {
    test('should handle 500 items efficiently', () => {
      const start = performance.now();
      
      for (let i = 0; i < 500; i++) {
        service.addItem(`Source ${i}`, `Target ${i}`, 'Performance');
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(1000); // Should be under 1 second
      expect(service.memory.size).toBe(500);
    });

    test('should search through 500 items quickly', () => {
      for (let i = 0; i < 500; i++) {
        service.addItem(`Source ${i}`, `Target ${i}`);
      }
      
      const start = performance.now();
      const results = service.search('Source 250');
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(50); // Should be very fast
      expect(results.length).toBeGreaterThan(0);
    });
  });
});

