/**
 * API Key Manager
 * Manages user-provided Gemini API keys
 * Requirements: 11.1-11.10
 */

// DataEncryption will be imported only if available
let DataEncryption = null;
try {
  const module = await import('../utils/encryption.js');
  DataEncryption = module.default;
} catch (e) {
  console.warn('[APIKey] Encryption module not available, using fallback');
}

class APIKeyManager {
  constructor() {
    this.storageKey = 'gemini_api_key';
    this.usageKey = 'api_usage';
    this.encryptionKey = null;
    this.apiKey = null;
    this.isPersonalKey = false;
    
    this.init();
  }

  /**
   * Initialize API key manager
   */
  async init() {
    try {
      // Generate or load encryption key
      await this.initEncryptionKey();
      
      // Load stored API key if exists
      await this.loadAPIKey();
      
      console.log('[APIKey] Manager initialized');
    } catch (error) {
      console.error('[APIKey] Init failed:', error);
    }
  }

  /**
   * Initialize encryption key
   */
  async initEncryptionKey() {
    if (!DataEncryption || !DataEncryption.isAvailable || !DataEncryption.isAvailable()) {
      console.warn('[APIKey] Web Crypto API not available, using basic storage');
      return;
    }

    try {
      const stored = sessionStorage.getItem('api_encryption_key');
      
      if (stored) {
        this.encryptionKey = await DataEncryption.importKey(stored);
      } else {
        this.encryptionKey = await DataEncryption.generateKey();
        const exported = await DataEncryption.exportKey(this.encryptionKey);
        sessionStorage.setItem('api_encryption_key', exported);
      }
    } catch (error) {
      console.warn('[APIKey] Encryption init failed, using basic storage:', error);
    }
  }

  /**
   * Set personal API key
   */
  async setPersonalKey(apiKey) {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('API key cannot be empty');
    }

    // Validate API key format
    if (!this.validateKeyFormat(apiKey)) {
      throw new Error('Invalid API key format');
    }

    // Test API key
    const isValid = await this.testAPIKey(apiKey);
    if (!isValid) {
      throw new Error('API key validation failed. Please check your key.');
    }

    // Encrypt and store
    try {
      if (DataEncryption && DataEncryption.isAvailable && DataEncryption.isAvailable() && this.encryptionKey) {
        const encrypted = await DataEncryption.encrypt(apiKey, this.encryptionKey);
        localStorage.setItem(this.storageKey, JSON.stringify(encrypted));
      } else {
        // Fallback: store with basic obfuscation (not secure but works)
        console.warn('[APIKey] Storing without encryption (basic obfuscation)');
        localStorage.setItem(this.storageKey, btoa(apiKey));
      }

      this.apiKey = apiKey;
      this.isPersonalKey = true;

      console.log('[APIKey] Personal key saved');
      return true;
    } catch (error) {
      console.error('[APIKey] Failed to save key:', error);
      throw error;
    }
  }

  /**
   * Load stored API key
   */
  async loadAPIKey() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      
      if (!stored) {
        this.isPersonalKey = false;
        return null;
      }

      if (DataEncryption.isAvailable() && this.encryptionKey) {
        const encrypted = JSON.parse(stored);
        this.apiKey = await DataEncryption.decrypt(encrypted, this.encryptionKey);
      } else {
        // Fallback: decode from base64
        this.apiKey = atob(stored);
      }

      this.isPersonalKey = true;
      console.log('[APIKey] Personal key loaded');
      return this.apiKey;
    } catch (error) {
      console.error('[APIKey] Failed to load key:', error);
      this.clearAPIKey();
      return null;
    }
  }

  /**
   * Get current API key (personal or shared)
   */
  getAPIKey() {
    if (this.isPersonalKey && this.apiKey) {
      return this.apiKey;
    }
    
    // Return shared key (should be from environment variable or config)
    return this.getSharedKey();
  }

  /**
   * Get shared API key
   */
  getSharedKey() {
    // In production, this would come from backend or config
    // For static web, we need to use personal keys only
    return null;
  }

  /**
   * Check if using personal key
   */
  hasPersonalKey() {
    return this.isPersonalKey && this.apiKey !== null;
  }

  /**
   * Clear personal API key
   */
  clearAPIKey() {
    localStorage.removeItem(this.storageKey);
    this.apiKey = null;
    this.isPersonalKey = false;
    console.log('[APIKey] Personal key cleared');
  }

  /**
   * Validate API key format
   */
  validateKeyFormat(apiKey) {
    // Gemini API keys typically start with "AIza" and are 39 characters
    return apiKey.startsWith('AIza') && apiKey.length === 39;
  }

  /**
   * Test API key with dummy request
   */
  async testAPIKey(apiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
      );

      return response.ok;
    } catch (error) {
      console.error('[APIKey] Test failed:', error);
      return false;
    }
  }

  /**
   * Track API usage
   */
  trackUsage(endpoint, tokensUsed = 0) {
    if (!this.isPersonalKey) return;

    try {
      const usage = this.getUsage();
      const today = new Date().toISOString().split('T')[0];

      if (!usage[today]) {
        usage[today] = { calls: 0, tokens: 0 };
      }

      usage[today].calls++;
      usage[today].tokens += tokensUsed;

      localStorage.setItem(this.usageKey, JSON.stringify(usage));
    } catch (error) {
      console.error('[APIKey] Failed to track usage:', error);
    }
  }

  /**
   * Get usage statistics
   */
  getUsage() {
    try {
      const stored = localStorage.getItem(this.usageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Get usage summary
   */
  getUsageSummary() {
    const usage = this.getUsage();
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.substring(0, 7); // YYYY-MM

    let todayCalls = 0;
    let todayTokens = 0;
    let monthCalls = 0;
    let monthTokens = 0;
    let totalCalls = 0;
    let totalTokens = 0;

    Object.entries(usage).forEach(([date, stats]) => {
      totalCalls += stats.calls;
      totalTokens += stats.tokens;

      if (date === today) {
        todayCalls = stats.calls;
        todayTokens = stats.tokens;
      }

      if (date.startsWith(thisMonth)) {
        monthCalls += stats.calls;
        monthTokens += stats.tokens;
      }
    });

    return {
      today: { calls: todayCalls, tokens: todayTokens },
      thisMonth: { calls: monthCalls, tokens: monthTokens },
      total: { calls: totalCalls, tokens: totalTokens }
    };
  }

  /**
   * Check if approaching rate limit
   */
  isApproachingLimit() {
    if (this.isPersonalKey) {
      // Personal keys have higher limits
      return false;
    }

    const summary = this.getUsageSummary();
    const dailyLimit = 100; // Shared key limit
    
    return summary.today.calls >= dailyLimit * 0.8; // 80% threshold
  }

  /**
   * Get instructions URL for obtaining API key
   */
  getInstructionsURL() {
    return 'https://ai.google.dev/tutorials/setup';
  }

  /**
   * Export usage data
   */
  exportUsage() {
    const usage = this.getUsage();
    const summary = this.getUsageSummary();

    const data = {
      exportDate: new Date().toISOString(),
      hasPersonalKey: this.isPersonalKey,
      summary,
      dailyUsage: usage
    };

    return JSON.stringify(data, null, 2);
  }
}

export default APIKeyManager;

