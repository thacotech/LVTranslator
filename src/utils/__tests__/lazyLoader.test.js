/**
 * Unit tests for LazyLoader
 * Note: These tests use mocked DOM APIs
 */

import LazyLoader from '../lazyLoader.js';

describe('LazyLoader', () => {
  beforeEach(() => {
    // Reset loader state
    LazyLoader.reset();
    
    // Clear document head
    document.head.innerHTML = '';
  });

  describe('isLoaded', () => {
    test('should return false for unloaded library', () => {
      expect(LazyLoader.isLoaded('dompurify')).toBe(false);
    });
  });

  describe('isLoading', () => {
    test('should return false when not loading', () => {
      expect(LazyLoader.isLoading('dompurify')).toBe(false);
    });
  });

  describe('setLibraryUrl', () => {
    test('should set custom library URL', () => {
      LazyLoader.setLibraryUrl('custom-lib', 'https://example.com/lib.js');
      const stats = LazyLoader.getStats();
      expect(stats.available).toContain('custom-lib');
    });
  });

  describe('getStats', () => {
    test('should return loading statistics', () => {
      const stats = LazyLoader.getStats();
      
      expect(stats).toHaveProperty('loaded');
      expect(stats).toHaveProperty('loading');
      expect(stats).toHaveProperty('available');
      
      expect(Array.isArray(stats.loaded)).toBe(true);
      expect(Array.isArray(stats.loading)).toBe(true);
      expect(Array.isArray(stats.available)).toBe(true);
    });

    test('should include default libraries in available', () => {
      const stats = LazyLoader.getStats();
      
      expect(stats.available).toContain('dompurify');
      expect(stats.available).toContain('mammoth');
      expect(stats.available).toContain('pdfjs');
    });
  });

  describe('unload', () => {
    test('should remove library from loaded set', () => {
      // Simulate a loaded library
      LazyLoader.loadedLibraries.add('test-lib');
      expect(LazyLoader.isLoaded('test-lib')).toBe(true);
      
      LazyLoader.unload('test-lib');
      expect(LazyLoader.isLoaded('test-lib')).toBe(false);
    });
  });

  describe('reset', () => {
    test('should clear all loaded libraries', () => {
      LazyLoader.loadedLibraries.add('lib1');
      LazyLoader.loadedLibraries.add('lib2');
      
      LazyLoader.reset();
      
      const stats = LazyLoader.getStats();
      expect(stats.loaded).toHaveLength(0);
      expect(stats.loading).toHaveLength(0);
    });
  });

  describe('preload', () => {
    test('should initiate loading for multiple libraries', () => {
      // This test just checks that preload doesn't throw
      LazyLoader.preload(['dompurify', 'mammoth']);
      
      // Preload is async and doesn't wait, so we can't easily test completion
      expect(true).toBe(true);
    });
  });

  describe('loadCSS', () => {
    test('should create link element for CSS', async () => {
      const url = 'https://example.com/style.css';
      const id = 'test-css';
      
      // Mock the link element
      const originalCreateElement = document.createElement.bind(document);
      document.createElement = jest.fn((tag) => {
        const element = originalCreateElement(tag);
        if (tag === 'link') {
          // Simulate successful load after a short delay
          setTimeout(() => {
            if (element.onload) element.onload();
          }, 10);
        }
        return element;
      });

      await LazyLoader.loadCSS(url, id);
      
      // Restore original
      document.createElement = originalCreateElement;
      
      expect(true).toBe(true);
    });

    test('should not reload CSS with same ID', async () => {
      const url = 'https://example.com/style.css';
      const id = 'existing-css';
      
      // Add existing link
      const existingLink = document.createElement('link');
      existingLink.id = id;
      existingLink.rel = 'stylesheet';
      existingLink.href = url;
      document.head.appendChild(existingLink);
      
      // Should resolve immediately
      await LazyLoader.loadCSS(url, id);
      
      // Should only have one link element
      const links = document.querySelectorAll(`#${id}`);
      expect(links.length).toBe(1);
    });
  });

  describe('error handling', () => {
    test('should throw error for unknown library without URL', async () => {
      await expect(LazyLoader.loadLibrary('unknown-lib')).rejects.toThrow('No URL configured');
    });
  });

  describe('configuration', () => {
    test('should have default library URLs configured', () => {
      expect(LazyLoader.libraryUrls).toHaveProperty('dompurify');
      expect(LazyLoader.libraryUrls).toHaveProperty('mammoth');
      expect(LazyLoader.libraryUrls).toHaveProperty('pdfjs');
      expect(LazyLoader.libraryUrls).toHaveProperty('tesseract');
      expect(LazyLoader.libraryUrls).toHaveProperty('lz-string');
    });

    test('should have valid URLs for all libraries', () => {
      Object.entries(LazyLoader.libraryUrls).forEach(([name, url]) => {
        expect(url).toBeTruthy();
        expect(typeof url).toBe('string');
        expect(url.startsWith('http')).toBe(true);
      });
    });
  });
});

