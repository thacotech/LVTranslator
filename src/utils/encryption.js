/**
 * Data Encryption Utility
 * Provides encryption/decryption for sensitive data using Web Crypto API
 */

class DataEncryption {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
    this.ivLength = 12; // 96 bits for AES-GCM
    this.saltLength = 16;
    this.iterations = 100000;
    this._cachedKey = null;
  }

  /**
   * Generate a cryptographic key from password
   * @param {string} password - Password to derive key from
   * @param {Uint8Array} salt - Salt for key derivation
   * @returns {Promise<CryptoKey>} - Derived key
   */
  async deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const passwordKey = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    return await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.iterations,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: this.algorithm, length: this.keyLength },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generate a device-specific key
   * Uses browser fingerprinting to create a consistent key per device
   * @returns {Promise<string>} - Device-specific password
   */
  async getDeviceKey() {
    // Create a fingerprint from various browser properties
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 0,
      navigator.deviceMemory || 0
    ].join('|');

    // Hash the fingerprint
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprint);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get or create encryption key
   * @returns {Promise<CryptoKey>} - Encryption key
   */
  async getEncryptionKey() {
    if (this._cachedKey) {
      return this._cachedKey;
    }

    // Get device-specific password
    const password = await this.getDeviceKey();
    
    // Get or generate salt
    let salt = localStorage.getItem('_enc_salt');
    if (!salt) {
      const saltArray = window.crypto.getRandomValues(new Uint8Array(this.saltLength));
      salt = this.arrayBufferToBase64(saltArray);
      localStorage.setItem('_enc_salt', salt);
    }

    const saltArray = this.base64ToArrayBuffer(salt);
    this._cachedKey = await this.deriveKey(password, saltArray);
    return this._cachedKey;
  }

  /**
   * Encrypt data
   * @param {any} data - Data to encrypt (will be JSON stringified)
   * @returns {Promise<string>} - Encrypted data as base64 string
   */
  async encrypt(data) {
    try {
      // Convert data to string
      const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
      
      // Get encryption key
      const key = await this.getEncryptionKey();
      
      // Generate random IV
      const iv = window.crypto.getRandomValues(new Uint8Array(this.ivLength));
      
      // Encrypt data
      const encoder = new TextEncoder();
      const encodedData = encoder.encode(plaintext);
      
      const encryptedData = await window.crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        encodedData
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedData.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encryptedData), iv.length);

      // Convert to base64
      return this.arrayBufferToBase64(combined);
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data
   * @param {string} encryptedData - Encrypted data as base64 string
   * @returns {Promise<any>} - Decrypted data (parsed as JSON if possible)
   */
  async decrypt(encryptedData) {
    try {
      // Convert from base64
      const combined = this.base64ToArrayBuffer(encryptedData);
      
      // Extract IV and encrypted data
      const iv = combined.slice(0, this.ivLength);
      const data = combined.slice(this.ivLength);
      
      // Get decryption key
      const key = await this.getEncryptionKey();
      
      // Decrypt data
      const decryptedData = await window.crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        data
      );

      // Convert to string
      const decoder = new TextDecoder();
      const plaintext = decoder.decode(decryptedData);

      // Try to parse as JSON
      try {
        return JSON.parse(plaintext);
      } catch (e) {
        return plaintext;
      }
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Convert ArrayBuffer to base64 string
   * @param {ArrayBuffer|Uint8Array} buffer - Buffer to convert
   * @returns {string} - Base64 string
   */
  arrayBufferToBase64(buffer) {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Convert base64 string to Uint8Array
   * @param {string} base64 - Base64 string
   * @returns {Uint8Array} - Uint8Array
   */
  base64ToArrayBuffer(base64) {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Check if encryption is available
   * @returns {boolean} - Whether encryption is available
   */
  static isAvailable() {
    return !!(window.crypto && window.crypto.subtle);
  }

  /**
   * Clear cached encryption key
   */
  clearCache() {
    this._cachedKey = null;
  }

  /**
   * Reset encryption (remove salt, clear cache)
   * Warning: This will make all encrypted data unrecoverable
   */
  reset() {
    localStorage.removeItem('_enc_salt');
    this.clearCache();
  }
}

// Create singleton instance
const encryptionInstance = new DataEncryption();

// Export singleton methods
export default {
  encrypt: (data) => encryptionInstance.encrypt(data),
  decrypt: (encryptedData) => encryptionInstance.decrypt(encryptedData),
  isAvailable: () => DataEncryption.isAvailable(),
  clearCache: () => encryptionInstance.clearCache(),
  reset: () => encryptionInstance.reset()
};

// Also make available globally for backward compatibility
if (typeof window !== 'undefined') {
  window.DataEncryption = encryptionInstance;
}

