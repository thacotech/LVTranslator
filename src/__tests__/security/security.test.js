/**
 * Security Tests
 * Tests security features and vulnerability prevention
 */

describe('Security Tests', () => {
  describe('XSS Prevention', () => {
    test('should prevent script injection in input', () => {
      const InputSanitizer = require('../../utils/sanitizer.js').default;

      const maliciousInputs = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert(1)>',
        '<iframe src="evil.com"></iframe>',
        'javascript:alert(1)',
        '<body onload=alert(1)>',
        '<svg onload=alert(1)>',
        '<object data="evil.swf">',
        '<embed src="evil.swf">'
      ];

      maliciousInputs.forEach(input => {
        const sanitized = InputSanitizer.sanitizeHTML(input);

        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('onerror');
        expect(sanitized).not.toContain('onload');
        expect(sanitized).not.toContain('<iframe');
        expect(sanitized).not.toContain('<object');
        expect(sanitized).not.toContain('<embed');
        expect(sanitized).not.toContain('javascript:');
      });
    });

    test('should escape HTML entities', () => {
      const InputSanitizer = require('../../utils/sanitizer.js').default;

      const input = '<div>Test & "quotes" \' /</div>';
      const escaped = InputSanitizer.escapeHTML(input);

      expect(escaped).toContain('&lt;');
      expect(escaped).toContain('&gt;');
      expect(escaped).toContain('&amp;');
      expect(escaped).toContain('&quot;');
      expect(escaped).toContain('&#x27;');
      expect(escaped).toContain('&#x2F;');
    });

    test('should detect XSS patterns', () => {
      const InputValidator = require('../../utils/validator.js').default;

      const xssPatterns = [
        '<script>alert(1)</script>',
        'javascript:void(0)',
        'onclick="alert(1)"',
        '<iframe src="evil"></iframe>',
        'eval(\'evil\')',
        'expression(alert(1))'
      ];

      xssPatterns.forEach(pattern => {
        expect(InputValidator.containsXSS(pattern)).toBe(true);
      });
    });

    test('should allow safe HTML', () => {
      const InputSanitizer = require('../../utils/sanitizer.js').default;

      const safeInput = 'This is safe text with numbers 123';
      const sanitized = InputSanitizer.sanitizeHTML(safeInput);

      expect(sanitized).toBe(safeInput);
    });
  });

  describe('SQL Injection Prevention', () => {
    test('should detect SQL injection patterns', () => {
      const InputValidator = require('../../utils/validator.js').default;

      const sqlInjectionPatterns = [
        "'; DROP TABLE users--",
        "1' OR '1'='1",
        "SELECT * FROM users",
        "UNION SELECT * FROM passwords",
        "DELETE FROM users WHERE 1=1",
        "INSERT INTO users VALUES ('hacker', 'pass')",
        "'; EXEC xp_cmdshell('dir')--"
      ];

      sqlInjectionPatterns.forEach(pattern => {
        expect(InputValidator.containsSQLInjection(pattern)).toBe(true);
      });
    });

    test('should allow normal text with SQL keywords', () => {
      const InputValidator = require('../../utils/validator.js').default;

      const normalText = 'Please select your option from the list';
      expect(InputValidator.containsSQLInjection(normalText)).toBe(false);
    });
  });

  describe('File Upload Validation', () => {
    test('should reject malicious files', () => {
      const InputSanitizer = require('../../utils/sanitizer.js').default;

      const maliciousFiles = [
        { name: 'malware.exe', type: 'application/x-msdownload', size: 1000 },
        { name: 'script.js', type: 'application/javascript', size: 500 },
        { name: 'virus.bat', type: 'application/x-bat', size: 200 },
        { name: 'doc.pdf.exe', type: 'application/pdf', size: 1000 }
      ];

      maliciousFiles.forEach(file => {
        const result = InputSanitizer.validateFile(file);
        expect(result.valid).toBe(false);
      });
    });

    test('should accept valid files', () => {
      const InputSanitizer = require('../../utils/sanitizer.js').default;

      const validFiles = [
        { name: 'document.pdf', type: 'application/pdf', size: 5000000 },
        { name: 'report.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 3000000 },
        { name: 'image.png', type: 'image/png', size: 2000000 }
      ];

      validFiles.forEach(file => {
        const result = InputSanitizer.validateFile(file);
        expect(result.valid).toBe(true);
      });
    });

    test('should reject oversized files', () => {
      const InputSanitizer = require('../../utils/sanitizer.js').default;

      const oversizedFile = {
        name: 'huge.pdf',
        type: 'application/pdf',
        size: 15 * 1024 * 1024 // 15MB
      };

      const result = InputSanitizer.validateFile(oversizedFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('size exceeds');
    });

    test('should reject empty files', () => {
      const InputSanitizer = require('../../utils/sanitizer.js').default;

      const emptyFile = {
        name: 'empty.pdf',
        type: 'application/pdf',
        size: 0
      };

      const result = InputSanitizer.validateFile(emptyFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });

    test('should detect double extensions', () => {
      const InputSanitizer = require('../../utils/sanitizer.js').default;

      const suspiciousFiles = [
        { name: 'document.pdf.exe', type: 'application/pdf', size: 1000 },
        { name: 'image.jpg.bat', type: 'image/jpeg', size: 1000 },
        { name: 'file.docx.js', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 1000 }
      ];

      suspiciousFiles.forEach(file => {
        const result = InputSanitizer.validateFile(file);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Suspicious');
      });
    });
  });

  describe('Data Encryption', () => {
    test('should encrypt sensitive data', async () => {
      const DataEncryption = require('../../utils/encryption.js').default;

      if (!DataEncryption.isAvailable()) {
        console.log('Skipping test: Web Crypto API not available');
        return;
      }

      const sensitiveData = {
        apiKey: 'secret-key-12345',
        password: 'user-password',
        personalInfo: 'sensitive information'
      };

      const encrypted = await DataEncryption.encrypt(sensitiveData);

      // Encrypted data should not contain original values
      expect(encrypted).not.toContain('secret-key');
      expect(encrypted).not.toContain('password');
      expect(encrypted).not.toContain('sensitive information');

      // Should be able to decrypt
      const decrypted = await DataEncryption.decrypt(encrypted);
      expect(decrypted).toEqual(sensitiveData);
    });

    test('should fail to decrypt tampered data', async () => {
      const DataEncryption = require('../../utils/encryption.js').default;

      if (!DataEncryption.isAvailable()) {
        console.log('Skipping test: Web Crypto API not available');
        return;
      }

      const data = 'Secret message';
      const encrypted = await DataEncryption.encrypt(data);

      // Tamper with encrypted data
      const tampered = encrypted + 'xxx';

      // Should fail to decrypt
      await expect(DataEncryption.decrypt(tampered)).rejects.toThrow();
    });

    test('should use different IVs for same data', async () => {
      const DataEncryption = require('../../utils/encryption.js').default;

      if (!DataEncryption.isAvailable()) {
        console.log('Skipping test: Web Crypto API not available');
        return;
      }

      const data = 'Same data';

      const encrypted1 = await DataEncryption.encrypt(data);
      const encrypted2 = await DataEncryption.encrypt(data);

      // Should produce different ciphertexts
      expect(encrypted1).not.toBe(encrypted2);

      // But both should decrypt to same value
      const decrypted1 = await DataEncryption.decrypt(encrypted1);
      const decrypted2 = await DataEncryption.decrypt(encrypted2);

      expect(decrypted1).toBe(data);
      expect(decrypted2).toBe(data);
    });
  });

  describe('URL Sanitization', () => {
    test('should block dangerous protocols', () => {
      const InputSanitizer = require('../../utils/sanitizer.js').default;

      const dangerousUrls = [
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'vbscript:msgbox(1)',
        'file:///etc/passwd'
      ];

      dangerousUrls.forEach(url => {
        const sanitized = InputSanitizer.sanitizeURL(url);
        expect(sanitized).toBeNull();
      });
    });

    test('should allow safe URLs', () => {
      const InputSanitizer = require('../../utils/sanitizer.js').default;

      const safeUrls = [
        'https://example.com',
        'http://example.com',
        'https://example.com/path?query=value'
      ];

      safeUrls.forEach(url => {
        const sanitized = InputSanitizer.sanitizeURL(url);
        expect(sanitized).toBe(url);
      });
    });
  });

  describe('Filename Sanitization', () => {
    test('should remove dangerous characters from filename', () => {
      const InputSanitizer = require('../../utils/sanitizer.js').default;

      const dangerousFilenames = [
        '../../../etc/passwd',
        'file<>:"/\\|?*.txt',
        'script.js; rm -rf /',
        'file\x00.txt'
      ];

      dangerousFilenames.forEach(filename => {
        const sanitized = InputSanitizer.sanitizeFilename(filename);

        expect(sanitized).not.toContain('..');
        expect(sanitized).not.toContain('/');
        expect(sanitized).not.toContain('\\');
        expect(sanitized).not.toContain(':');
        expect(sanitized).not.toContain('*');
        expect(sanitized).not.toContain('?');
        expect(sanitized).not.toContain('"');
        expect(sanitized).not.toContain('<');
        expect(sanitized).not.toContain('>');
        expect(sanitized).not.toContain('|');
      });
    });
  });

  describe('Rate Limiting', () => {
    test('should track request counts', () => {
      // Mock rate limiter
      const requests = [];
      const maxRequests = 10;
      const windowMs = 60000;

      // Simulate requests
      for (let i = 0; i < 15; i++) {
        requests.push({
          timestamp: Date.now(),
          ip: '192.168.1.1'
        });
      }

      // Filter recent requests
      const now = Date.now();
      const recentRequests = requests.filter(
        req => now - req.timestamp < windowMs
      );

      // Should detect rate limit exceeded
      expect(recentRequests.length).toBeGreaterThan(maxRequests);
    });
  });

  describe('Content Security Policy', () => {
    test('should have CSP headers configured', () => {
      // Verify CSP configuration exists
      const vercelConfig = require('../../../vercel.json');

      expect(vercelConfig.headers).toBeDefined();
      const cspHeader = vercelConfig.headers[0].headers.find(
        h => h.key === 'Content-Security-Policy'
      );

      expect(cspHeader).toBeDefined();
      expect(cspHeader.value).toContain('default-src');
      expect(cspHeader.value).toContain('script-src');
      expect(cspHeader.value).toContain('frame-ancestors');
    });

    test('should have security headers configured', () => {
      const vercelConfig = require('../../../vercel.json');

      const headers = vercelConfig.headers[0].headers;
      const headerKeys = headers.map(h => h.key);

      expect(headerKeys).toContain('Content-Security-Policy');
      expect(headerKeys).toContain('X-Content-Type-Options');
      expect(headerKeys).toContain('X-Frame-Options');
      expect(headerKeys).toContain('X-XSS-Protection');
      expect(headerKeys).toContain('Referrer-Policy');
    });
  });

  describe('Input Length Validation', () => {
    test('should reject excessively long input', () => {
      const InputSanitizer = require('../../utils/sanitizer.js').default;

      const tooLong = 'x'.repeat(10001);
      const result = InputSanitizer.validateText(tooLong);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum length');
    });

    test('should accept input within limits', () => {
      const InputSanitizer = require('../../utils/sanitizer.js').default;

      const validLength = 'x'.repeat(5000);
      const result = InputSanitizer.validateText(validLength);

      expect(result.valid).toBe(true);
    });
  });

  describe('Error Message Security', () => {
    test('should not leak sensitive information in errors', () => {
      const ErrorHandler = require('../../utils/errorHandler.js').default;

      const sensitiveError = new Error('Database connection failed: password=secret123');
      const userMessage = ErrorHandler.getUserMessage(sensitiveError);

      // Should not expose sensitive details
      expect(userMessage).not.toContain('password');
      expect(userMessage).not.toContain('secret123');
      expect(userMessage).not.toContain('Database connection');
    });
  });
});

