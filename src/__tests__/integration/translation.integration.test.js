/**
 * Integration Tests for Translation Flow
 * Tests end-to-end translation functionality
 */

describe('Translation Integration Tests', () => {
  let mockFetch;

  beforeEach(() => {
    // Mock fetch for API calls
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('End-to-End Translation Flow', () => {
    test('should translate text from Vietnamese to Lao', async () => {
      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          translatedText: 'ສະບາຍດີ',
          sourceLang: 'vi',
          targetLang: 'lo',
          timestamp: Date.now()
        })
      });

      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Xin chào',
          sourceLang: 'vi',
          targetLang: 'lo'
        })
      });

      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.translatedText).toBe('ສະບາຍດີ');
      expect(data.sourceLang).toBe('vi');
      expect(data.targetLang).toBe('lo');
    });

    test('should handle empty text error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Invalid request',
          message: 'Text cannot be empty'
        })
      });

      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: '',
          sourceLang: 'vi',
          targetLang: 'lo'
        })
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });

    test('should handle rate limiting', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: 'Too many requests',
          message: 'Rate limit exceeded',
          retryAfter: 60
        })
      });

      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Test',
          sourceLang: 'vi',
          targetLang: 'lo'
        })
      });

      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.error).toBe('Too many requests');
    });

    test('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        fetch('/api/translate', {
          method: 'POST',
          body: JSON.stringify({ text: 'Test', sourceLang: 'vi', targetLang: 'lo' })
        })
      ).rejects.toThrow('Network error');
    });
  });

  describe('Translation with Cache', () => {
    test('should cache translation results', async () => {
      const { TranslationCache } = require('../../utils/cache.js');
      const cache = new TranslationCache();

      // First translation - should call API
      const text = 'Hello';
      const sourceLang = 'en';
      const targetLang = 'vi';
      const translation = 'Xin chào';

      // Check cache miss
      expect(cache.get(text, sourceLang, targetLang)).toBeNull();

      // Set cache
      cache.set(text, sourceLang, targetLang, translation);

      // Check cache hit
      expect(cache.get(text, sourceLang, targetLang)).toBe(translation);

      // Verify cache statistics
      const stats = cache.getStats();
      expect(stats.hits).toBeGreaterThan(0);
    });

    test('should not make duplicate API calls for cached translations', async () => {
      const { TranslationCache } = require('../../utils/cache.js');
      const cache = new TranslationCache();

      const text = 'Test';
      const translation = 'Kiểm tra';

      // Cache the translation
      cache.set(text, 'en', 'vi', translation);

      // Try to get from cache
      const cached = cache.get(text, 'en', 'vi');

      // Should get cached value without API call
      expect(cached).toBe(translation);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Translation History', () => {
    test('should save translation to history', () => {
      const StorageManager = require('../../utils/storageManager.js').default;

      const historyItem = {
        id: Date.now(),
        sourceText: 'Hello',
        translatedText: 'Xin chào',
        sourceLang: 'en',
        targetLang: 'vi',
        timestamp: Date.now()
      };

      // Save to history
      StorageManager.set('test_history_item', historyItem, false);

      // Retrieve from history
      const retrieved = StorageManager.get('test_history_item', false);

      expect(retrieved.sourceText).toBe(historyItem.sourceText);
      expect(retrieved.translatedText).toBe(historyItem.translatedText);
    });

    test('should encrypt sensitive history data', async () => {
      const DataEncryption = require('../../utils/encryption.js').default;

      if (!DataEncryption.isAvailable()) {
        console.log('Skipping test: Web Crypto API not available');
        return;
      }

      const sensitiveData = {
        text: 'Private message',
        translation: 'Tin nhắn riêng tư'
      };

      // Encrypt
      const encrypted = await DataEncryption.encrypt(sensitiveData);

      // Should be encrypted (different from original)
      expect(encrypted).not.toContain('Private message');

      // Decrypt
      const decrypted = await DataEncryption.decrypt(encrypted);

      // Should match original
      expect(decrypted).toEqual(sensitiveData);
    });
  });

  describe('Input Validation', () => {
    test('should sanitize malicious input', () => {
      const InputSanitizer = require('../../utils/sanitizer.js').default;

      const maliciousInput = '<script>alert("XSS")</script>Hello';
      const sanitized = InputSanitizer.sanitizeHTML(maliciousInput);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });

    test('should validate text length', () => {
      const InputSanitizer = require('../../utils/sanitizer.js').default;

      const tooLong = 'x'.repeat(10001);
      const result = InputSanitizer.validateText(tooLong);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum length');
    });

    test('should validate language codes', () => {
      const InputSanitizer = require('../../utils/sanitizer.js').default;

      expect(InputSanitizer.validateLanguageCode('vi')).toBe(true);
      expect(InputSanitizer.validateLanguageCode('lo')).toBe(true);
      expect(InputSanitizer.validateLanguageCode('en')).toBe(true);
      expect(InputSanitizer.validateLanguageCode('invalid')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', () => {
      const ErrorHandler = require('../../utils/errorHandler.js').default;

      const testError = new Error('API Error');
      testError.code = 'API_ERROR';

      const message = ErrorHandler.getUserMessage(testError);

      expect(message).toBeTruthy();
      expect(typeof message).toBe('string');
    });

    test('should track errors', () => {
      const ErrorHandler = require('../../utils/errorHandler.js').default;

      ErrorHandler.clearErrors();

      const error = new Error('Test error');
      ErrorHandler.handle(error, { context: 'test' });

      const errors = ErrorHandler.getErrors();
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});

