# Design Document

## Overview

Tài liệu này mô tả thiết kế chi tiết để cải thiện Performance và Security cho LVTranslator. Giải pháp tập trung vào việc tách biệt concerns, bảo vệ API key, tối ưu hiệu suất, và đảm bảo an toàn dữ liệu người dùng.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   UI Layer   │  │ Service Layer│  │  Utils Layer │      │
│  │              │  │              │  │              │      │
│  │ - Components │  │ - Translator │  │ - Sanitizer  │      │
│  │ - Views      │  │ - History    │  │ - Validator  │      │
│  │ - Modals     │  │ - FileProc   │  │ - Cache      │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │              │
│         └─────────────────┴─────────────────┘              │
│                           │                                │
│                  ┌────────▼────────┐                       │
│                  │  API Client     │                       │
│                  │  (with cache)   │                       │
│                  └────────┬────────┘                       │
└───────────────────────────┼─────────────────────────────────┘
                            │ HTTPS
                  ┌─────────▼─────────┐
                  │  Backend Proxy    │
                  │  (Node.js/Vercel) │
                  └─────────┬─────────┘
                            │
                  ┌─────────▼─────────┐
                  │  Google Gemini    │
                  │      API          │
                  └───────────────────┘
```

### Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Security Layers                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Input Validation Layer                                  │
│     ├─ Sanitize HTML/JS                                     │
│     ├─ Validate file types & sizes                          │
│     └─ Check character limits                               │
│                                                              │
│  2. Content Security Policy (CSP)                           │
│     ├─ Restrict script sources                              │
│     ├─ Block inline scripts                                 │
│     └─ Control resource loading                             │
│                                                              │
│  3. Data Protection Layer                                   │
│     ├─ Encrypt localStorage data                            │
│     ├─ Secure API communication                             │
│     └─ Rate limiting                                        │
│                                                              │
│  4. Backend Proxy Layer                                     │
│     ├─ Hide API keys                                        │
│     ├─ Request validation                                   │
│     └─ Rate limiting & monitoring                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Security Module

#### 1.1 Input Sanitizer

```javascript
class InputSanitizer {
  /**
   * Sanitize user input to prevent XSS attacks
   * @param {string} input - Raw user input
   * @returns {string} - Sanitized input
   */
  static sanitizeHTML(input) {
    // Remove script tags, event handlers, etc.
    // Use DOMPurify library for robust sanitization
  }

  /**
   * Validate and sanitize file uploads
   * @param {File} file - Uploaded file
   * @returns {boolean} - Whether file is safe
   */
  static validateFile(file) {
    // Check file type, size, and content
  }

  /**
   * Escape HTML entities
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   */
  static escapeHTML(text) {
    // Escape <, >, &, ", '
  }
}
```

#### 1.2 API Key Manager (Backend)

```javascript
// backend/api/translate.js
export default async function handler(req, res) {
  // Rate limiting
  const rateLimiter = new RateLimiter({
    windowMs: 60000, // 1 minute
    max: 10 // 10 requests per minute per IP
  });

  if (!rateLimiter.check(req.ip)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  // Validate request
  const { text, sourceLang, targetLang } = req.body;
  if (!validateTranslationRequest(text, sourceLang, targetLang)) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  // Call Gemini API with server-side key
  const apiKey = process.env.GEMINI_API_KEY;
  const result = await callGeminiAPI(text, sourceLang, targetLang, apiKey);
  
  return res.json(result);
}
```

#### 1.3 Data Encryption

```javascript
class DataEncryption {
  /**
   * Encrypt data before storing in localStorage
   * @param {any} data - Data to encrypt
   * @returns {string} - Encrypted data
   */
  static encrypt(data) {
    // Use Web Crypto API for encryption
    // AES-GCM encryption with user-specific key
  }

  /**
   * Decrypt data from localStorage
   * @param {string} encryptedData - Encrypted data
   * @returns {any} - Decrypted data
   */
  static decrypt(encryptedData) {
    // Decrypt using Web Crypto API
  }
}
```

### 2. Performance Optimization Module

#### 2.1 Lazy Loader

```javascript
class LazyLoader {
  /**
   * Lazy load external libraries
   * @param {string} libraryName - Name of library to load
   * @returns {Promise} - Resolves when library is loaded
   */
  static async loadLibrary(libraryName) {
    if (this.loadedLibraries.has(libraryName)) {
      return Promise.resolve();
    }

    const script = document.createElement('script');
    script.src = this.libraryUrls[libraryName];
    
    return new Promise((resolve, reject) => {
      script.onload = () => {
        this.loadedLibraries.add(libraryName);
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Load library only when needed
   * @param {string} libraryName - Library name
   * @param {Function} callback - Function to execute after loading
   */
  static async loadOnDemand(libraryName, callback) {
    await this.loadLibrary(libraryName);
    callback();
  }
}
```

#### 2.2 Request Debouncer

```javascript
class RequestDebouncer {
  constructor(delay = 500) {
    this.delay = delay;
    this.timeoutId = null;
    this.pendingRequest = null;
  }

  /**
   * Debounce translation requests
   * @param {Function} fn - Function to debounce
   * @param {Array} args - Function arguments
   * @returns {Promise} - Promise that resolves with function result
   */
  debounce(fn, ...args) {
    // Cancel pending request
    if (this.pendingRequest) {
      this.pendingRequest.cancel();
    }

    // Clear existing timeout
    clearTimeout(this.timeoutId);

    return new Promise((resolve, reject) => {
      this.timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, this.delay);
    });
  }
}
```

#### 2.3 Translation Cache

```javascript
class TranslationCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * Generate cache key
   * @param {string} text - Text to translate
   * @param {string} sourceLang - Source language
   * @param {string} targetLang - Target language
   * @returns {string} - Cache key
   */
  generateKey(text, sourceLang, targetLang) {
    return `${sourceLang}-${targetLang}-${this.hashString(text)}`;
  }

  /**
   * Get cached translation
   * @param {string} key - Cache key
   * @returns {string|null} - Cached translation or null
   */
  get(key) {
    if (this.cache.has(key)) {
      // Move to end (LRU)
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return null;
  }

  /**
   * Set cached translation
   * @param {string} key - Cache key
   * @param {string} value - Translation result
   */
  set(key, value) {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  /**
   * Hash string for cache key
   * @param {string} str - String to hash
   * @returns {string} - Hash
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }
}
```

#### 2.4 Web Worker for File Processing

```javascript
// fileProcessor.worker.js
self.addEventListener('message', async (e) => {
  const { type, data } = e.data;

  try {
    let result;
    switch (type) {
      case 'PROCESS_PDF':
        result = await processPDF(data);
        break;
      case 'PROCESS_DOCX':
        result = await processDOCX(data);
        break;
      case 'PROCESS_IMAGE':
        result = await processImage(data);
        break;
    }

    self.postMessage({ success: true, result });
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
});

async function processPDF(arrayBuffer) {
  // Process PDF in worker thread
  // Import PDF.js in worker
  importScripts('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js');
  // ... processing logic
}
```

#### 2.5 Virtual Scroll for History

```javascript
class VirtualScroll {
  constructor(container, items, itemHeight, renderItem) {
    this.container = container;
    this.items = items;
    this.itemHeight = itemHeight;
    this.renderItem = renderItem;
    this.visibleStart = 0;
    this.visibleEnd = 0;
    this.init();
  }

  /**
   * Initialize virtual scroll
   */
  init() {
    this.container.style.height = `${this.items.length * this.itemHeight}px`;
    this.container.style.position = 'relative';
    
    this.viewport = document.createElement('div');
    this.viewport.style.overflow = 'auto';
    this.viewport.style.height = '400px';
    
    this.viewport.addEventListener('scroll', () => this.onScroll());
    this.render();
  }

  /**
   * Handle scroll event
   */
  onScroll() {
    const scrollTop = this.viewport.scrollTop;
    this.visibleStart = Math.floor(scrollTop / this.itemHeight);
    this.visibleEnd = Math.ceil((scrollTop + this.viewport.clientHeight) / this.itemHeight);
    this.render();
  }

  /**
   * Render visible items only
   */
  render() {
    const fragment = document.createDocumentFragment();
    
    for (let i = this.visibleStart; i < this.visibleEnd && i < this.items.length; i++) {
      const item = this.renderItem(this.items[i]);
      item.style.position = 'absolute';
      item.style.top = `${i * this.itemHeight}px`;
      fragment.appendChild(item);
    }

    this.container.innerHTML = '';
    this.container.appendChild(fragment);
  }
}
```

### 3. Modular Architecture

#### 3.1 Project Structure

```
lvtranslator/
├── src/
│   ├── components/
│   │   ├── TranslationPanel.js
│   │   ├── HistoryPanel.js
│   │   ├── FileUpload.js
│   │   └── LanguageSelector.js
│   ├── services/
│   │   ├── TranslationService.js
│   │   ├── HistoryService.js
│   │   ├── FileProcessorService.js
│   │   └── APIClient.js
│   ├── utils/
│   │   ├── sanitizer.js
│   │   ├── validator.js
│   │   ├── cache.js
│   │   ├── debouncer.js
│   │   └── encryption.js
│   ├── workers/
│   │   └── fileProcessor.worker.js
│   ├── styles/
│   │   ├── main.css
│   │   ├── components.css
│   │   └── responsive.css
│   ├── config/
│   │   └── constants.js
│   └── main.js
├── backend/
│   ├── api/
│   │   └── translate.js
│   ├── middleware/
│   │   ├── rateLimiter.js
│   │   └── validator.js
│   └── utils/
│       └── logger.js
├── public/
│   ├── index.html
│   ├── fonts/
│   └── images/
├── package.json
├── vite.config.js
└── vercel.json
```

## Data Models

### Translation Request

```typescript
interface TranslationRequest {
  text: string;
  sourceLang: 'vi' | 'lo' | 'en';
  targetLang: 'vi' | 'lo' | 'en';
  timestamp: number;
}
```

### Translation Response

```typescript
interface TranslationResponse {
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: number;
  cached: boolean;
}
```

### History Item (Encrypted)

```typescript
interface HistoryItem {
  id: number;
  sourceText: string; // Encrypted
  translatedText: string; // Encrypted
  direction: string;
  timestamp: number;
  preview: {
    source: string;
    translated: string;
  };
}
```

### Cache Entry

```typescript
interface CacheEntry {
  key: string;
  value: string;
  timestamp: number;
  hits: number;
}
```

## Error Handling

### Error Types

```javascript
class TranslationError extends Error {
  constructor(message, code, details) {
    super(message);
    this.name = 'TranslationError';
    this.code = code;
    this.details = details;
  }
}

// Error codes
const ErrorCodes = {
  INVALID_INPUT: 'INVALID_INPUT',
  API_ERROR: 'API_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UNSUPPORTED_FILE_TYPE: 'UNSUPPORTED_FILE_TYPE',
  NETWORK_ERROR: 'NETWORK_ERROR',
  ENCRYPTION_ERROR: 'ENCRYPTION_ERROR'
};
```

### Error Handler

```javascript
class ErrorHandler {
  /**
   * Handle errors globally
   * @param {Error} error - Error object
   * @param {Object} context - Error context
   */
  static handle(error, context = {}) {
    // Log error
    this.logError(error, context);

    // Show user-friendly message
    const userMessage = this.getUserMessage(error);
    this.showErrorToUser(userMessage);

    // Track error for monitoring
    this.trackError(error, context);
  }

  /**
   * Get user-friendly error message
   * @param {Error} error - Error object
   * @returns {string} - User message
   */
  static getUserMessage(error) {
    const messages = {
      [ErrorCodes.INVALID_INPUT]: 'Vui lòng kiểm tra lại dữ liệu nhập vào.',
      [ErrorCodes.API_ERROR]: 'Lỗi kết nối đến dịch vụ. Vui lòng thử lại.',
      [ErrorCodes.RATE_LIMIT_EXCEEDED]: 'Bạn đã vượt quá giới hạn. Vui lòng đợi một chút.',
      [ErrorCodes.FILE_TOO_LARGE]: 'File quá lớn. Vui lòng chọn file nhỏ hơn 10MB.',
      [ErrorCodes.UNSUPPORTED_FILE_TYPE]: 'Định dạng file không được hỗ trợ.',
      [ErrorCodes.NETWORK_ERROR]: 'Lỗi kết nối mạng. Vui lòng kiểm tra internet.',
      [ErrorCodes.ENCRYPTION_ERROR]: 'Lỗi bảo mật dữ liệu.'
    };

    return messages[error.code] || 'Đã xảy ra lỗi. Vui lòng thử lại.';
  }
}
```

## Testing Strategy

### Unit Tests

```javascript
// tests/unit/sanitizer.test.js
describe('InputSanitizer', () => {
  test('should remove script tags', () => {
    const input = '<script>alert("xss")</script>Hello';
    const output = InputSanitizer.sanitizeHTML(input);
    expect(output).toBe('Hello');
  });

  test('should escape HTML entities', () => {
    const input = '<div>Test & "quotes"</div>';
    const output = InputSanitizer.escapeHTML(input);
    expect(output).toBe('&lt;div&gt;Test &amp; &quot;quotes&quot;&lt;/div&gt;');
  });
});

// tests/unit/cache.test.js
describe('TranslationCache', () => {
  test('should cache and retrieve translations', () => {
    const cache = new TranslationCache();
    const key = cache.generateKey('Hello', 'en', 'vi');
    cache.set(key, 'Xin chào');
    expect(cache.get(key)).toBe('Xin chào');
  });

  test('should implement LRU eviction', () => {
    const cache = new TranslationCache(2);
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');
    expect(cache.get('key1')).toBeNull();
  });
});
```

### Integration Tests

```javascript
// tests/integration/translation.test.js
describe('Translation Flow', () => {
  test('should translate text end-to-end', async () => {
    const translator = new TranslationService();
    const result = await translator.translate('Hello', 'en', 'vi');
    expect(result.translatedText).toBeTruthy();
    expect(result.cached).toBe(false);
  });

  test('should use cached translation on second request', async () => {
    const translator = new TranslationService();
    await translator.translate('Hello', 'en', 'vi');
    const result = await translator.translate('Hello', 'en', 'vi');
    expect(result.cached).toBe(true);
  });
});
```

### Performance Tests

```javascript
// tests/performance/load.test.js
describe('Performance', () => {
  test('should load page in under 2 seconds', async () => {
    const startTime = performance.now();
    await loadPage();
    const loadTime = performance.now() - startTime;
    expect(loadTime).toBeLessThan(2000);
  });

  test('should handle 100 concurrent translations', async () => {
    const promises = Array(100).fill().map(() => 
      translator.translate('Test', 'en', 'vi')
    );
    const results = await Promise.all(promises);
    expect(results.length).toBe(100);
  });
});
```

### Security Tests

```javascript
// tests/security/xss.test.js
describe('XSS Prevention', () => {
  test('should prevent script injection in input', () => {
    const maliciousInput = '<img src=x onerror=alert(1)>';
    const sanitized = InputSanitizer.sanitizeHTML(maliciousInput);
    expect(sanitized).not.toContain('onerror');
  });

  test('should validate file uploads', () => {
    const maliciousFile = new File(['<script>alert(1)</script>'], 'test.html', {
      type: 'text/html'
    });
    expect(InputSanitizer.validateFile(maliciousFile)).toBe(false);
  });
});
```

## Implementation Phases

### Phase 1: Critical Security Fixes (Week 1)
- Implement backend proxy for API key protection
- Add input sanitization
- Implement CSP headers
- Add rate limiting

### Phase 2: Performance Optimization (Week 2)
- Implement lazy loading for libraries
- Add request debouncing
- Implement translation cache
- Add Web Worker for file processing

### Phase 3: Code Refactoring (Week 3)
- Split monolithic file into modules
- Implement build process with Vite
- Add proper error handling
- Implement monitoring

### Phase 4: Advanced Features (Week 4)
- Add data encryption for localStorage
- Implement virtual scrolling
- Add service worker for offline support
- Optimize mobile performance

## Monitoring and Metrics

### Key Performance Indicators (KPIs)

1. **Page Load Time**: < 2 seconds
2. **Time to Interactive**: < 3 seconds
3. **Translation Response Time**: < 1 second (cached), < 3 seconds (API)
4. **File Processing Time**: < 5 seconds for 5MB file
5. **Memory Usage**: < 100MB
6. **Cache Hit Rate**: > 30%

### Monitoring Tools

- **Performance**: Lighthouse, Web Vitals
- **Errors**: Sentry or similar error tracking
- **Analytics**: Google Analytics or Plausible
- **API Monitoring**: Custom logging to track API usage and errors

## Security Checklist

- [ ] API key không bị expose trong client code
- [ ] Tất cả user input được sanitized
- [ ] CSP headers được implement
- [ ] HTTPS được enforce
- [ ] Rate limiting được implement
- [ ] File uploads được validated
- [ ] localStorage data được encrypted
- [ ] XSS prevention được test
- [ ] Injection attacks được prevent
- [ ] Error messages không leak sensitive info
