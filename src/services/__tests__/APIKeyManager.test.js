/**
 * APIKeyManager Unit Tests
 */

import APIKeyManager from '../APIKeyManager';
import DataEncryption from '../../utils/encryption';

// Mock encryption
jest.mock('../../utils/encryption');

// Mock localStorage and sessionStorage
const createStorageMock = () => ({
  store: {},
  getItem: jest.fn((key) => createStorageMock.store[key] || null),
  setItem: jest.fn((key, value) => {
    createStorageMock.store[key] = value;
  }),
  removeItem: jest.fn((key) => {
    delete createStorageMock.store[key];
  }),
  clear: jest.fn(() => {
    createStorageMock.store = {};
  })
});

global.localStorage = createStorageMock();
global.sessionStorage = createStorageMock();

// Mock fetch
global.fetch = jest.fn();

describe('APIKeyManager', () => {
  let manager;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    
    DataEncryption.isAvailable.mockReturnValue(true);
    DataEncryption.generateKey.mockResolvedValue('mock-key');
    DataEncryption.exportKey.mockResolvedValue('exported-key');
    DataEncryption.importKey.mockResolvedValue('imported-key');
    DataEncryption.encrypt.mockResolvedValue({ encrypted: 'data', iv: 'iv' });
    DataEncryption.decrypt.mockResolvedValue('decrypted-key');
    
    manager = new APIKeyManager();
  });

  describe('Initialization', () => {
    test('should initialize successfully', () => {
      expect(manager).toBeDefined();
      expect(manager.isPersonalKey).toBe(false);
    });

    test('should generate encryption key', async () => {
      await manager.initEncryptionKey();
      expect(DataEncryption.generateKey).toHaveBeenCalled();
    });
  });

  describe('API Key Validation', () => {
    test('should validate correct Gemini API key format', () => {
      const validKey = 'AIza' + 'x'.repeat(35); // 39 chars total
      const result = manager.validateKeyFormat(validKey);
      
      expect(result).toBe(true);
    });

    test('should reject invalid key format', () => {
      const invalidKey = 'INVALID_KEY';
      const result = manager.validateKeyFormat(invalidKey);
      
      expect(result).toBe(false);
    });

    test('should reject keys that do not start with AIza', () => {
      const key = 'XXXX' + 'x'.repeat(35);
      const result = manager.validateKeyFormat(key);
      
      expect(result).toBe(false);
    });

    test('should reject keys with wrong length', () => {
      const shortKey = 'AIza123';
      const result = manager.validateKeyFormat(shortKey);
      
      expect(result).toBe(false);
    });
  });

  describe('Set Personal Key', () => {
    const validKey = 'AIza' + 'x'.repeat(35);

    beforeEach(() => {
      fetch.mockResolvedValue({ ok: true });
    });

    test('should set and encrypt personal key', async () => {
      await manager.setPersonalKey(validKey);
      
      expect(DataEncryption.encrypt).toHaveBeenCalledWith(validKey, expect.anything());
      expect(localStorage.setItem).toHaveBeenCalled();
      expect(manager.isPersonalKey).toBe(true);
    });

    test('should test API key before saving', async () => {
      await manager.setPersonalKey(validKey);
      
      expect(fetch).toHaveBeenCalled();
      const fetchUrl = fetch.mock.calls[0][0];
      expect(fetchUrl).toContain(validKey);
    });

    test('should reject empty key', async () => {
      await expect(manager.setPersonalKey('')).rejects.toThrow('empty');
    });

    test('should reject invalid format', async () => {
      await expect(manager.setPersonalKey('INVALID')).rejects.toThrow('Invalid API key format');
    });

    test('should reject failed validation', async () => {
      fetch.mockResolvedValue({ ok: false });
      
      await expect(manager.setPersonalKey(validKey)).rejects.toThrow('validation failed');
    });
  });

  describe('Load API Key', () => {
    const validKey = 'AIza' + 'x'.repeat(35);

    test('should load and decrypt stored key', async () => {
      const encrypted = { encrypted: 'data', iv: 'iv' };
      localStorage.setItem('gemini_api_key', JSON.stringify(encrypted));
      
      await manager.loadAPIKey();
      
      expect(DataEncryption.decrypt).toHaveBeenCalled();
      expect(manager.isPersonalKey).toBe(true);
    });

    test('should return null if no key stored', async () => {
      const result = await manager.loadAPIKey();
      
      expect(result).toBeNull();
      expect(manager.isPersonalKey).toBe(false);
    });

    test('should handle decryption errors', async () => {
      localStorage.setItem('gemini_api_key', 'corrupted-data');
      DataEncryption.decrypt.mockRejectedValue(new Error('Decrypt failed'));
      
      await manager.loadAPIKey();
      
      expect(manager.isPersonalKey).toBe(false);
    });
  });

  describe('Get API Key', () => {
    test('should return personal key if set', () => {
      manager.isPersonalKey = true;
      manager.apiKey = 'personal-key';
      
      const key = manager.getAPIKey();
      
      expect(key).toBe('personal-key');
    });

    test('should return null if no personal key', () => {
      manager.isPersonalKey = false;
      
      const key = manager.getAPIKey();
      
      expect(key).toBeNull();
    });
  });

  describe('Clear API Key', () => {
    test('should clear stored key', () => {
      manager.apiKey = 'test-key';
      manager.isPersonalKey = true;
      
      manager.clearAPIKey();
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('gemini_api_key');
      expect(manager.apiKey).toBeNull();
      expect(manager.isPersonalKey).toBe(false);
    });
  });

  describe('Usage Tracking', () => {
    test('should track API usage', () => {
      manager.isPersonalKey = true;
      manager.trackUsage('translate', 100);
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'api_usage',
        expect.any(String)
      );
    });

    test('should not track usage for shared key', () => {
      manager.isPersonalKey = false;
      manager.trackUsage('translate', 100);
      
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    test('should accumulate usage by date', () => {
      manager.isPersonalKey = true;
      
      manager.trackUsage('translate', 50);
      manager.trackUsage('translate', 75);
      
      const usage = manager.getUsage();
      const today = new Date().toISOString().split('T')[0];
      
      expect(usage[today].calls).toBe(2);
      expect(usage[today].tokens).toBe(125);
    });
  });

  describe('Usage Summary', () => {
    beforeEach(() => {
      const today = new Date().toISOString().split('T')[0];
      const usage = {
        [today]: { calls: 10, tokens: 1000 }
      };
      localStorage.store['api_usage'] = JSON.stringify(usage);
    });

    test('should get usage summary', () => {
      const summary = manager.getUsageSummary();
      
      expect(summary.today.calls).toBe(10);
      expect(summary.today.tokens).toBe(1000);
      expect(summary.total.calls).toBe(10);
    });

    test('should calculate monthly usage', () => {
      const thisMonth = new Date().toISOString().substring(0, 7);
      const usage = {};
      
      for (let day = 1; day <= 5; day++) {
        const date = `${thisMonth}-${String(day).padStart(2, '0')}`;
        usage[date] = { calls: 10, tokens: 100 };
      }
      
      localStorage.store['api_usage'] = JSON.stringify(usage);
      
      const summary = manager.getUsageSummary();
      
      expect(summary.thisMonth.calls).toBe(50);
      expect(summary.thisMonth.tokens).toBe(500);
    });
  });

  describe('Rate Limiting', () => {
    test('should detect approaching limit for shared key', () => {
      manager.isPersonalKey = false;
      
      const today = new Date().toISOString().split('T')[0];
      const usage = {
        [today]: { calls: 85, tokens: 0 } // 85/100 = 85% > 80% threshold
      };
      localStorage.store['api_usage'] = JSON.stringify(usage);
      
      const approaching = manager.isApproachingLimit();
      
      expect(approaching).toBe(true);
    });

    test('should not warn for personal key', () => {
      manager.isPersonalKey = true;
      
      const approaching = manager.isApproachingLimit();
      
      expect(approaching).toBe(false);
    });
  });

  describe('Export Usage', () => {
    test('should export usage data', () => {
      manager.isPersonalKey = true;
      manager.trackUsage('translate', 100);
      
      const exported = manager.exportUsage();
      const data = JSON.parse(exported);
      
      expect(data.hasPersonalKey).toBe(true);
      expect(data.summary).toBeDefined();
      expect(data.dailyUsage).toBeDefined();
    });
  });

  describe('Fallback Without Encryption', () => {
    beforeEach(() => {
      DataEncryption.isAvailable.mockReturnValue(false);
    });

    test('should store key with basic encoding if encryption unavailable', async () => {
      const validKey = 'AIza' + 'x'.repeat(35);
      fetch.mockResolvedValue({ ok: true });
      
      await manager.setPersonalKey(validKey);
      
      expect(localStorage.setItem).toHaveBeenCalled();
      const storedValue = localStorage.setItem.mock.calls[0][1];
      expect(storedValue).toBe(btoa(validKey));
    });
  });

  describe('Instructions', () => {
    test('should provide API key instructions URL', () => {
      const url = manager.getInstructionsURL();
      
      expect(url).toContain('ai.google.dev');
    });
  });
});

