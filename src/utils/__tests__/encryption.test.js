/**
 * Unit tests for DataEncryption
 * Note: These tests require Web Crypto API, which may not be available in all test environments
 */

import DataEncryption from '../encryption.js';

describe('DataEncryption', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    DataEncryption.clearCache();
  });

  describe('isAvailable', () => {
    test('should check if encryption is available', () => {
      const isAvailable = DataEncryption.isAvailable();
      // This depends on the test environment
      expect(typeof isAvailable).toBe('boolean');
    });
  });

  describe('encrypt and decrypt', () => {
    test('should encrypt and decrypt string data', async () => {
      if (!DataEncryption.isAvailable()) {
        console.log('Skipping test: Web Crypto API not available');
        return;
      }

      const originalData = 'Hello, World!';
      const encrypted = await DataEncryption.encrypt(originalData);
      
      expect(encrypted).toBeTruthy();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toBe(originalData);

      const decrypted = await DataEncryption.decrypt(encrypted);
      expect(decrypted).toBe(originalData);
    });

    test('should encrypt and decrypt object data', async () => {
      if (!DataEncryption.isAvailable()) {
        console.log('Skipping test: Web Crypto API not available');
        return;
      }

      const originalData = {
        text: 'Hello',
        number: 123,
        nested: { key: 'value' }
      };

      const encrypted = await DataEncryption.encrypt(originalData);
      expect(encrypted).toBeTruthy();
      expect(typeof encrypted).toBe('string');

      const decrypted = await DataEncryption.decrypt(encrypted);
      expect(decrypted).toEqual(originalData);
    });

    test('should encrypt and decrypt array data', async () => {
      if (!DataEncryption.isAvailable()) {
        console.log('Skipping test: Web Crypto API not available');
        return;
      }

      const originalData = [1, 2, 3, 'four', { five: 5 }];

      const encrypted = await DataEncryption.encrypt(originalData);
      const decrypted = await DataEncryption.decrypt(encrypted);
      
      expect(decrypted).toEqual(originalData);
    });

    test('should handle empty string', async () => {
      if (!DataEncryption.isAvailable()) {
        console.log('Skipping test: Web Crypto API not available');
        return;
      }

      const originalData = '';
      const encrypted = await DataEncryption.encrypt(originalData);
      const decrypted = await DataEncryption.decrypt(encrypted);
      
      expect(decrypted).toBe(originalData);
    });

    test('should handle unicode characters', async () => {
      if (!DataEncryption.isAvailable()) {
        console.log('Skipping test: Web Crypto API not available');
        return;
      }

      const originalData = 'Xin chào 🇻🇳 ສະບາຍດີ 🇱🇦';
      const encrypted = await DataEncryption.encrypt(originalData);
      const decrypted = await DataEncryption.decrypt(encrypted);
      
      expect(decrypted).toBe(originalData);
    });

    test('should produce different ciphertext for same plaintext', async () => {
      if (!DataEncryption.isAvailable()) {
        console.log('Skipping test: Web Crypto API not available');
        return;
      }

      const data = 'Same data';
      const encrypted1 = await DataEncryption.encrypt(data);
      const encrypted2 = await DataEncryption.encrypt(data);
      
      // Different IV should produce different ciphertext
      expect(encrypted1).not.toBe(encrypted2);
      
      // But both should decrypt to same data
      const decrypted1 = await DataEncryption.decrypt(encrypted1);
      const decrypted2 = await DataEncryption.decrypt(encrypted2);
      expect(decrypted1).toBe(data);
      expect(decrypted2).toBe(data);
    });

    test('should throw error for invalid encrypted data', async () => {
      if (!DataEncryption.isAvailable()) {
        console.log('Skipping test: Web Crypto API not available');
        return;
      }

      await expect(DataEncryption.decrypt('invalid-data')).rejects.toThrow();
      await expect(DataEncryption.decrypt('')).rejects.toThrow();
      await expect(DataEncryption.decrypt('not-base64!')).rejects.toThrow();
    });

    test('should handle large data', async () => {
      if (!DataEncryption.isAvailable()) {
        console.log('Skipping test: Web Crypto API not available');
        return;
      }

      const largeData = 'x'.repeat(10000);
      const encrypted = await DataEncryption.encrypt(largeData);
      const decrypted = await DataEncryption.decrypt(encrypted);
      
      expect(decrypted).toBe(largeData);
      expect(decrypted.length).toBe(10000);
    });
  });

  describe('reset', () => {
    test('should reset encryption and make old data undecryptable', async () => {
      if (!DataEncryption.isAvailable()) {
        console.log('Skipping test: Web Crypto API not available');
        return;
      }

      const data = 'Secret data';
      const encrypted = await DataEncryption.encrypt(data);
      
      // Should decrypt successfully before reset
      const decrypted1 = await DataEncryption.decrypt(encrypted);
      expect(decrypted1).toBe(data);

      // Reset encryption
      DataEncryption.reset();

      // Old encrypted data should not be decryptable after reset
      await expect(DataEncryption.decrypt(encrypted)).rejects.toThrow();
    });

    test('should clear salt from localStorage', async () => {
      if (!DataEncryption.isAvailable()) {
        console.log('Skipping test: Web Crypto API not available');
        return;
      }

      await DataEncryption.encrypt('test');
      expect(localStorage.getItem('_enc_salt')).toBeTruthy();

      DataEncryption.reset();
      expect(localStorage.getItem('_enc_salt')).toBeNull();
    });
  });

  describe('clearCache', () => {
    test('should clear cached key', () => {
      DataEncryption.clearCache();
      // If this doesn't throw, it works
      expect(true).toBe(true);
    });
  });

  describe('edge cases', () => {
    test('should handle null values', async () => {
      if (!DataEncryption.isAvailable()) {
        console.log('Skipping test: Web Crypto API not available');
        return;
      }

      const encrypted = await DataEncryption.encrypt(null);
      const decrypted = await DataEncryption.decrypt(encrypted);
      expect(decrypted).toBeNull();
    });

    test('should handle boolean values', async () => {
      if (!DataEncryption.isAvailable()) {
        console.log('Skipping test: Web Crypto API not available');
        return;
      }

      const encrypted1 = await DataEncryption.encrypt(true);
      const decrypted1 = await DataEncryption.decrypt(encrypted1);
      expect(decrypted1).toBe(true);

      const encrypted2 = await DataEncryption.encrypt(false);
      const decrypted2 = await DataEncryption.decrypt(encrypted2);
      expect(decrypted2).toBe(false);
    });

    test('should handle number values', async () => {
      if (!DataEncryption.isAvailable()) {
        console.log('Skipping test: Web Crypto API not available');
        return;
      }

      const encrypted = await DataEncryption.encrypt(42);
      const decrypted = await DataEncryption.decrypt(encrypted);
      expect(decrypted).toBe(42);
    });
  });

  describe('performance', () => {
    test('should encrypt and decrypt within reasonable time', async () => {
      if (!DataEncryption.isAvailable()) {
        console.log('Skipping test: Web Crypto API not available');
        return;
      }

      const data = { text: 'Performance test data' };
      
      const startEncrypt = performance.now();
      const encrypted = await DataEncryption.encrypt(data);
      const encryptTime = performance.now() - startEncrypt;
      
      const startDecrypt = performance.now();
      const decrypted = await DataEncryption.decrypt(encrypted);
      const decryptTime = performance.now() - startDecrypt;

      // Encryption/decryption should be reasonably fast
      // These thresholds may need adjustment based on environment
      expect(encryptTime).toBeLessThan(1000); // 1 second
      expect(decryptTime).toBeLessThan(1000); // 1 second
      
      expect(decrypted).toEqual(data);
    });
  });
});

