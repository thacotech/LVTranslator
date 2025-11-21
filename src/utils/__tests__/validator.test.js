/**
 * Unit tests for InputValidator
 */

import InputValidator from '../validator.js';

describe('InputValidator', () => {
  describe('isValidEmail', () => {
    test('should accept valid email addresses', () => {
      expect(InputValidator.isValidEmail('test@example.com')).toBe(true);
      expect(InputValidator.isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(InputValidator.isValidEmail('user+tag@example.com')).toBe(true);
    });

    test('should reject invalid email addresses', () => {
      expect(InputValidator.isValidEmail('invalid')).toBe(false);
      expect(InputValidator.isValidEmail('invalid@')).toBe(false);
      expect(InputValidator.isValidEmail('@example.com')).toBe(false);
      expect(InputValidator.isValidEmail('invalid@example')).toBe(false);
      expect(InputValidator.isValidEmail('')).toBe(false);
      expect(InputValidator.isValidEmail(null)).toBe(false);
    });
  });

  describe('isValidURL', () => {
    test('should accept valid URLs', () => {
      expect(InputValidator.isValidURL('http://example.com')).toBe(true);
      expect(InputValidator.isValidURL('https://example.com')).toBe(true);
      expect(InputValidator.isValidURL('https://example.com/path?query=value')).toBe(true);
    });

    test('should reject invalid URLs', () => {
      expect(InputValidator.isValidURL('javascript:alert(1)')).toBe(false);
      expect(InputValidator.isValidURL('not a url')).toBe(false);
      expect(InputValidator.isValidURL('')).toBe(false);
      expect(InputValidator.isValidURL(null)).toBe(false);
    });
  });

  describe('containsSQLInjection', () => {
    test('should detect SQL injection patterns', () => {
      expect(InputValidator.containsSQLInjection('SELECT * FROM users')).toBe(true);
      expect(InputValidator.containsSQLInjection('DROP TABLE users')).toBe(true);
      expect(InputValidator.containsSQLInjection("' OR '1'='1")).toBe(true);
      expect(InputValidator.containsSQLInjection('--comment')).toBe(true);
    });

    test('should not flag normal text', () => {
      expect(InputValidator.containsSQLInjection('Hello World')).toBe(false);
      expect(InputValidator.containsSQLInjection('This is a test')).toBe(false);
    });
  });

  describe('containsXSS', () => {
    test('should detect XSS patterns', () => {
      expect(InputValidator.containsXSS('<script>alert(1)</script>')).toBe(true);
      expect(InputValidator.containsXSS('javascript:alert(1)')).toBe(true);
      expect(InputValidator.containsXSS('<img onerror="alert(1)">')).toBe(true);
      expect(InputValidator.containsXSS('<iframe src="evil.com">')).toBe(true);
    });

    test('should not flag normal text', () => {
      expect(InputValidator.containsXSS('Hello World')).toBe(false);
      expect(InputValidator.containsXSS('This is a test')).toBe(false);
    });
  });

  describe('isValidFileSize', () => {
    test('should accept valid file sizes', () => {
      expect(InputValidator.isValidFileSize(1024)).toBe(true);
      expect(InputValidator.isValidFileSize(5 * 1024 * 1024)).toBe(true);
      expect(InputValidator.isValidFileSize(10 * 1024 * 1024)).toBe(true);
    });

    test('should reject invalid file sizes', () => {
      expect(InputValidator.isValidFileSize(0)).toBe(false);
      expect(InputValidator.isValidFileSize(-1)).toBe(false);
      expect(InputValidator.isValidFileSize(11 * 1024 * 1024)).toBe(false);
    });

    test('should respect custom max size', () => {
      expect(InputValidator.isValidFileSize(6 * 1024 * 1024, 5 * 1024 * 1024)).toBe(false);
      expect(InputValidator.isValidFileSize(4 * 1024 * 1024, 5 * 1024 * 1024)).toBe(true);
    });
  });

  describe('hasValidExtension', () => {
    test('should accept valid extensions', () => {
      expect(InputValidator.hasValidExtension('document.pdf')).toBe(true);
      expect(InputValidator.hasValidExtension('document.docx')).toBe(true);
      expect(InputValidator.hasValidExtension('image.png')).toBe(true);
      expect(InputValidator.hasValidExtension('image.jpg')).toBe(true);
    });

    test('should reject invalid extensions', () => {
      expect(InputValidator.hasValidExtension('malware.exe')).toBe(false);
      expect(InputValidator.hasValidExtension('script.js')).toBe(false);
      expect(InputValidator.hasValidExtension('noextension')).toBe(false);
    });

    test('should be case insensitive', () => {
      expect(InputValidator.hasValidExtension('DOCUMENT.PDF')).toBe(true);
      expect(InputValidator.hasValidExtension('Image.PNG')).toBe(true);
    });
  });

  describe('isInRange', () => {
    test('should accept values in range', () => {
      expect(InputValidator.isInRange(5, 0, 10)).toBe(true);
      expect(InputValidator.isInRange(0, 0, 10)).toBe(true);
      expect(InputValidator.isInRange(10, 0, 10)).toBe(true);
    });

    test('should reject values out of range', () => {
      expect(InputValidator.isInRange(-1, 0, 10)).toBe(false);
      expect(InputValidator.isInRange(11, 0, 10)).toBe(false);
    });
  });

  describe('isValidLength', () => {
    test('should accept valid lengths', () => {
      expect(InputValidator.isValidLength('hello', 0, 10)).toBe(true);
      expect(InputValidator.isValidLength('hello', 5, 5)).toBe(true);
      expect(InputValidator.isValidLength('', 0, 10)).toBe(true);
    });

    test('should reject invalid lengths', () => {
      expect(InputValidator.isValidLength('hello', 6, 10)).toBe(false);
      expect(InputValidator.isValidLength('hello', 0, 4)).toBe(false);
    });
  });

  describe('isNotEmpty', () => {
    test('should detect non-empty values', () => {
      expect(InputValidator.isNotEmpty('hello')).toBe(true);
      expect(InputValidator.isNotEmpty([1, 2, 3])).toBe(true);
      expect(InputValidator.isNotEmpty({ key: 'value' })).toBe(true);
      expect(InputValidator.isNotEmpty(123)).toBe(true);
    });

    test('should detect empty values', () => {
      expect(InputValidator.isNotEmpty('')).toBe(false);
      expect(InputValidator.isNotEmpty('   ')).toBe(false);
      expect(InputValidator.isNotEmpty([])).toBe(false);
      expect(InputValidator.isNotEmpty({})).toBe(false);
      expect(InputValidator.isNotEmpty(null)).toBe(false);
      expect(InputValidator.isNotEmpty(undefined)).toBe(false);
    });
  });

  describe('isValidJSON', () => {
    test('should accept valid JSON', () => {
      expect(InputValidator.isValidJSON('{}')).toBe(true);
      expect(InputValidator.isValidJSON('[]')).toBe(true);
      expect(InputValidator.isValidJSON('{"key":"value"}')).toBe(true);
      expect(InputValidator.isValidJSON('[1,2,3]')).toBe(true);
    });

    test('should reject invalid JSON', () => {
      expect(InputValidator.isValidJSON('{')).toBe(false);
      expect(InputValidator.isValidJSON('not json')).toBe(false);
      expect(InputValidator.isValidJSON('')).toBe(false);
      expect(InputValidator.isValidJSON(null)).toBe(false);
    });
  });

  describe('isValidBase64', () => {
    test('should accept valid base64', () => {
      expect(InputValidator.isValidBase64('SGVsbG8gV29ybGQ=')).toBe(true);
      expect(InputValidator.isValidBase64('YWJjZA==')).toBe(true);
    });

    test('should reject invalid base64', () => {
      expect(InputValidator.isValidBase64('not base64!')).toBe(false);
      expect(InputValidator.isValidBase64('')).toBe(false);
      expect(InputValidator.isValidBase64(null)).toBe(false);
    });
  });

  describe('isValidHexColor', () => {
    test('should accept valid hex colors', () => {
      expect(InputValidator.isValidHexColor('#FF0000')).toBe(true);
      expect(InputValidator.isValidHexColor('#fff')).toBe(true);
      expect(InputValidator.isValidHexColor('#123ABC')).toBe(true);
    });

    test('should reject invalid hex colors', () => {
      expect(InputValidator.isValidHexColor('FF0000')).toBe(false);
      expect(InputValidator.isValidHexColor('#GG0000')).toBe(false);
      expect(InputValidator.isValidHexColor('')).toBe(false);
      expect(InputValidator.isValidHexColor(null)).toBe(false);
    });
  });

  describe('isValidDate', () => {
    test('should accept valid dates', () => {
      expect(InputValidator.isValidDate('2024-01-01')).toBe(true);
      expect(InputValidator.isValidDate('2024-01-01T00:00:00Z')).toBe(true);
      expect(InputValidator.isValidDate('Jan 1, 2024')).toBe(true);
    });

    test('should reject invalid dates', () => {
      expect(InputValidator.isValidDate('not a date')).toBe(false);
      expect(InputValidator.isValidDate('2024-13-01')).toBe(false);
      expect(InputValidator.isValidDate('')).toBe(false);
    });
  });

  describe('isInteger', () => {
    test('should detect integers', () => {
      expect(InputValidator.isInteger(0)).toBe(true);
      expect(InputValidator.isInteger(123)).toBe(true);
      expect(InputValidator.isInteger(-456)).toBe(true);
    });

    test('should reject non-integers', () => {
      expect(InputValidator.isInteger(1.5)).toBe(false);
      expect(InputValidator.isInteger('123')).toBe(false);
      expect(InputValidator.isInteger(null)).toBe(false);
    });
  });

  describe('isPositive', () => {
    test('should detect positive numbers', () => {
      expect(InputValidator.isPositive(1)).toBe(true);
      expect(InputValidator.isPositive(0.1)).toBe(true);
      expect(InputValidator.isPositive(1000)).toBe(true);
    });

    test('should reject non-positive numbers', () => {
      expect(InputValidator.isPositive(0)).toBe(false);
      expect(InputValidator.isPositive(-1)).toBe(false);
      expect(InputValidator.isPositive('1')).toBe(false);
    });
  });

  describe('validate', () => {
    test('should validate data against rules', () => {
      const data = {
        email: 'test@example.com',
        name: 'John Doe',
        age: 25
      };

      const rules = {
        email: { required: true, email: true },
        name: { required: true, minLength: 2, maxLength: 50 },
        age: { required: true, min: 18, max: 100 }
      };

      const result = InputValidator.validate(data, rules);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    test('should detect validation errors', () => {
      const data = {
        email: 'invalid-email',
        name: '',
        age: 15
      };

      const rules = {
        email: { required: true, email: true },
        name: { required: true, minLength: 2 },
        age: { required: true, min: 18 }
      };

      const result = InputValidator.validate(data, rules);
      expect(result.valid).toBe(false);
      expect(result.errors.email).toBeDefined();
      expect(result.errors.name).toBeDefined();
      expect(result.errors.age).toBeDefined();
    });

    test('should handle custom validation functions', () => {
      const data = {
        password: 'weak'
      };

      const rules = {
        password: {
          required: true,
          custom: (value) => {
            if (value.length < 8) {
              return 'Password must be at least 8 characters';
            }
            return true;
          }
        }
      };

      const result = InputValidator.validate(data, rules);
      expect(result.valid).toBe(false);
      expect(result.errors.password).toContain('at least 8 characters');
    });

    test('should handle pattern validation', () => {
      const data = {
        username: 'user@123'
      };

      const rules = {
        username: {
          required: true,
          pattern: /^[a-zA-Z0-9_]+$/
        }
      };

      const result = InputValidator.validate(data, rules);
      expect(result.valid).toBe(false);
      expect(result.errors.username).toBeDefined();
    });
  });
});

