/**
 * GlossaryService Unit Tests
 */

import GlossaryService from '../GlossaryService';

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem: jest.fn((key) => localStorageMock.store[key] || null),
  setItem: jest.fn((key, value) => {
    localStorageMock.store[key] = value;
  }),
  clear: jest.fn(() => {
    localStorageMock.store = {};
  })
};

global.localStorage = localStorageMock;

describe('GlossaryService', () => {
  let service;

  beforeEach(() => {
    localStorageMock.clear();
    service = new GlossaryService();
  });

  describe('Add Entry', () => {
    test('should add new term successfully', () => {
      const id = service.addEntry('API', 'Giao diện lập trình ứng dụng', 'Technical', 'Application Programming Interface');
      
      expect(id).toBeDefined();
      expect(service.glossary.size).toBe(1);
      
      const entry = service.glossary.get(id);
      expect(entry.source).toBe('API');
      expect(entry.target).toBe('Giao diện lập trình ứng dụng');
      expect(entry.category).toBe('Technical');
    });

    test('should not add duplicate terms', () => {
      service.addEntry('API', 'Translation 1');
      const id2 = service.addEntry('API', 'Translation 2');
      
      expect(service.glossary.size).toBe(1);
      expect(id2).toBeNull();
    });

    test('should handle case-insensitive duplicates', () => {
      service.addEntry('API', 'Translation 1');
      const id2 = service.addEntry('api', 'Translation 2');
      
      expect(id2).toBeNull();
    });
  });

  describe('Find Terms in Text', () => {
    beforeEach(() => {
      service.addEntry('API', 'Giao diện lập trình', 'Technical');
      service.addEntry('database', 'cơ sở dữ liệu', 'Technical');
      service.addEntry('user', 'người dùng', 'General');
    });

    test('should find single term in text', () => {
      const text = 'The API is ready';
      const terms = service.findTermsInText(text);
      
      expect(terms.length).toBe(1);
      expect(terms[0].term).toBe('API');
      expect(terms[0].translation).toBe('Giao diện lập trình');
    });

    test('should find multiple terms in text', () => {
      const text = 'The API connects to the database for user data';
      const terms = service.findTermsInText(text);
      
      expect(terms.length).toBe(3);
    });

    test('should handle case-insensitive matching', () => {
      const text = 'The api and DATABASE are ready';
      const terms = service.findTermsInText(text);
      
      expect(terms.length).toBe(2);
    });

    test('should return empty array for no matches', () => {
      const text = 'No special terms here';
      const terms = service.findTermsInText(text);
      
      expect(terms).toEqual([]);
    });

    test('should find word boundaries correctly', () => {
      const text = 'apikey is not API';
      const terms = service.findTermsInText(text);
      
      // Should only match 'API' not 'api' in 'apikey'
      expect(terms.length).toBe(1);
      expect(terms[0].term).toBe('API');
    });
  });

  describe('Search', () => {
    beforeEach(() => {
      service.addEntry('API', 'Giao diện', 'Technical');
      service.addEntry('SDK', 'Bộ công cụ', 'Technical');
      service.addEntry('hello', 'xin chào', 'General');
    });

    test('should search by query', () => {
      const results = service.search('API');
      expect(results.length).toBe(1);
      expect(results[0].source).toBe('API');
    });

    test('should search by category', () => {
      const results = service.search('', 'Technical');
      expect(results.length).toBe(2);
    });

    test('should search with both query and category', () => {
      const results = service.search('API', 'Technical');
      expect(results.length).toBe(1);
    });

    test('should return all entries for empty search', () => {
      const results = service.search('');
      expect(results.length).toBe(3);
    });
  });

  describe('Export/Import', () => {
    beforeEach(() => {
      service.addEntry('API', 'Giao diện', 'Technical', 'Note 1');
      service.addEntry('SDK', 'Bộ công cụ', 'Technical', 'Note 2');
    });

    test('should export to JSON', () => {
      const json = service.exportToJson();
      const data = JSON.parse(json);
      
      expect(data.version).toBe('1.0');
      expect(Object.keys(data.glossary).length).toBe(2);
    });

    test('should export to CSV', () => {
      const csv = service.exportToCsv();
      const lines = csv.split('\n');
      
      expect(lines[0]).toBe('Source,Target,Category,Notes');
      expect(lines.length).toBe(3); // Header + 2 entries
    });

    test('should import from JSON (merge)', () => {
      const exported = service.exportToJson();
      
      const newService = new GlossaryService();
      const result = newService.importFromJson(exported, true);
      
      expect(result.imported).toBe(2);
      expect(newService.glossary.size).toBe(2);
    });

    test('should import from JSON (replace)', () => {
      const exported = service.exportToJson();
      
      const newService = new GlossaryService();
      newService.addEntry('Old', 'Old');
      
      const result = newService.importFromJson(exported, false);
      
      expect(result.imported).toBe(2);
      expect(newService.glossary.size).toBe(2);
    });

    test('should import from CSV', () => {
      const csv = 'Source,Target,Category,Notes\nNew,Mới,General,Test note\nOld,Cũ,General,';
      
      const newService = new GlossaryService();
      const result = newService.importFromCsv(csv, false);
      
      expect(result.imported).toBe(2);
      expect(newService.glossary.size).toBe(2);
    });

    test('should handle quoted CSV fields', () => {
      const csv = 'Source,Target,Category,Notes\n"Term with, comma","Translation","General",""';
      
      const result = service.importFromCsv(csv, true);
      expect(result.imported).toBe(1);
    });
  });

  describe('Performance', () => {
    test('should handle 1000 terms efficiently', () => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        service.addEntry(`Term${i}`, `Translation${i}`, 'Performance');
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(1000);
      expect(service.glossary.size).toBe(1000);
    });

    test('should find terms in large text quickly', () => {
      service.addEntry('test', 'kiểm tra');
      const largeText = 'word '.repeat(1000) + 'test ' + 'word '.repeat(1000);
      
      const start = performance.now();
      const terms = service.findTermsInText(largeText);
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(100);
      expect(terms.length).toBe(1);
    });
  });
});

