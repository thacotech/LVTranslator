/**
 * Unit tests for InputSanitizer
 */

import InputSanitizer from '../sanitizer.js';

describe('InputSanitizer', () => {
  describe('sanitizeHTML', () => {
    test('should remove script tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const output = InputSanitizer.sanitizeHTML(input);
      expect(output).not.toContain('<script>');
      expect(output).not.toContain('alert');
    });

    test('should remove event handlers', () => {
      const input = '<div onclick="alert(1)">Click me</div>';
      const output = InputSanitizer.sanitizeHTML(input);
      expect(output).not.toContain('onclick');
    });

    test('should remove javascript: protocol', () => {
      const input = '<a href="javascript:alert(1)">Link</a>';
      const output = InputSanitizer.sanitizeHTML(input);
      expect(output).not.toContain('javascript:');
    });

    test('should remove dangerous tags', () => {
      const input = '<iframe src="evil.com"></iframe><object data="evil"></object>';
      const output = InputSanitizer.sanitizeHTML(input);
      expect(output).not.toContain('<iframe');
      expect(output).not.toContain('<object');
    });

    test('should return empty string for null/undefined', () => {
      expect(InputSanitizer.sanitizeHTML(null)).toBe('');
      expect(InputSanitizer.sanitizeHTML(undefined)).toBe('');
    });

    test('should handle plain text correctly', () => {
      const input = 'Hello, World!';
      const output = InputSanitizer.sanitizeHTML(input);
      expect(output).toBe('Hello, World!');
    });
  });

  describe('escapeHTML', () => {
    test('should escape HTML entities', () => {
      const input = '<div>Test & "quotes"</div>';
      const output = InputSanitizer.escapeHTML(input);
      expect(output).toBe('&lt;div&gt;Test &amp; &quot;quotes&quot;&lt;&#x2F;div&gt;');
    });

    test('should escape all special characters', () => {
      const input = '<>&"\'/`=';
      const output = InputSanitizer.escapeHTML(input);
      expect(output).toContain('&lt;');
      expect(output).toContain('&gt;');
      expect(output).toContain('&amp;');
      expect(output).toContain('&quot;');
    });

    test('should return empty string for null/undefined', () => {
      expect(InputSanitizer.escapeHTML(null)).toBe('');
      expect(InputSanitizer.escapeHTML(undefined)).toBe('');
    });

    test('should not modify plain text', () => {
      const input = 'Hello World';
      const output = InputSanitizer.escapeHTML(input);
      expect(output).toBe('Hello World');
    });
  });

  describe('validateFile', () => {
    test('should reject file exceeding size limit', () => {
      const file = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
      const result = InputSanitizer.validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('size exceeds');
    });

    test('should reject empty file', () => {
      const file = new File([''], 'empty.pdf', { type: 'application/pdf' });
      const result = InputSanitizer.validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });

    test('should reject invalid file type', () => {
      const file = new File(['test'], 'test.exe', { type: 'application/x-msdownload' });
      const result = InputSanitizer.validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('type not allowed');
    });

    test('should accept valid PDF file', () => {
      const file = new File(['test'], 'document.pdf', { type: 'application/pdf' });
      const result = InputSanitizer.validateFile(file);
      expect(result.valid).toBe(true);
    });

    test('should accept valid DOCX file', () => {
      const file = new File(['test'], 'document.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const result = InputSanitizer.validateFile(file);
      expect(result.valid).toBe(true);
    });

    test('should accept valid image file', () => {
      const file = new File(['test'], 'image.png', { type: 'image/png' });
      const result = InputSanitizer.validateFile(file);
      expect(result.valid).toBe(true);
    });

    test('should reject file with double extension', () => {
      const file = new File(['test'], 'document.pdf.exe', { type: 'application/pdf' });
      const result = InputSanitizer.validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Suspicious');
    });

    test('should reject null file', () => {
      const result = InputSanitizer.validateFile(null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('No file');
    });
  });

  describe('validateText', () => {
    test('should reject empty text when not allowed', () => {
      const result = InputSanitizer.validateText('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    test('should accept empty text when allowed', () => {
      const result = InputSanitizer.validateText('', { allowEmpty: true });
      expect(result.valid).toBe(true);
    });

    test('should reject text exceeding max length', () => {
      const text = 'x'.repeat(10001);
      const result = InputSanitizer.validateText(text);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum length');
    });

    test('should accept valid text', () => {
      const result = InputSanitizer.validateText('Hello, World!');
      expect(result.valid).toBe(true);
    });

    test('should reject whitespace-only text', () => {
      const result = InputSanitizer.validateText('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });

    test('should reject non-string input', () => {
      const result = InputSanitizer.validateText(123);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be a string');
    });
  });

  describe('sanitizeTranslationText', () => {
    test('should remove null bytes', () => {
      const input = 'Hello\x00World';
      const output = InputSanitizer.sanitizeTranslationText(input);
      expect(output).not.toContain('\x00');
      expect(output).toBe('HelloWorld');
    });

    test('should normalize line endings', () => {
      const input = 'Line1\r\nLine2\rLine3';
      const output = InputSanitizer.sanitizeTranslationText(input);
      expect(output).toBe('Line1\nLine2\nLine3');
    });

    test('should trim whitespace', () => {
      const input = '  Hello World  ';
      const output = InputSanitizer.sanitizeTranslationText(input);
      expect(output).toBe('Hello World');
    });

    test('should preserve valid content', () => {
      const input = 'Valid translation text with numbers 123 and symbols !@#';
      const output = InputSanitizer.sanitizeTranslationText(input);
      expect(output).toBe(input.trim());
    });
  });

  describe('validateLanguageCode', () => {
    test('should accept valid language codes', () => {
      expect(InputSanitizer.validateLanguageCode('vi')).toBe(true);
      expect(InputSanitizer.validateLanguageCode('lo')).toBe(true);
      expect(InputSanitizer.validateLanguageCode('en')).toBe(true);
    });

    test('should reject invalid language codes', () => {
      expect(InputSanitizer.validateLanguageCode('fr')).toBe(false);
      expect(InputSanitizer.validateLanguageCode('xx')).toBe(false);
      expect(InputSanitizer.validateLanguageCode('')).toBe(false);
      expect(InputSanitizer.validateLanguageCode(null)).toBe(false);
    });
  });

  describe('sanitizeURL', () => {
    test('should accept valid HTTP URLs', () => {
      const url = 'http://example.com';
      expect(InputSanitizer.sanitizeURL(url)).toBe(url);
    });

    test('should accept valid HTTPS URLs', () => {
      const url = 'https://example.com';
      expect(InputSanitizer.sanitizeURL(url)).toBe(url);
    });

    test('should reject javascript: protocol', () => {
      const url = 'javascript:alert(1)';
      expect(InputSanitizer.sanitizeURL(url)).toBeNull();
    });

    test('should reject data: protocol', () => {
      const url = 'data:text/html,<script>alert(1)</script>';
      expect(InputSanitizer.sanitizeURL(url)).toBeNull();
    });

    test('should reject invalid URLs', () => {
      expect(InputSanitizer.sanitizeURL('not a url')).toBeNull();
      expect(InputSanitizer.sanitizeURL('')).toBeNull();
      expect(InputSanitizer.sanitizeURL(null)).toBeNull();
    });
  });

  describe('stripHTML', () => {
    test('should remove all HTML tags', () => {
      const input = '<div><p>Hello <strong>World</strong></p></div>';
      const output = InputSanitizer.stripHTML(input);
      expect(output).toBe('Hello World');
    });

    test('should handle nested tags', () => {
      const input = '<div><span><a href="#">Link</a></span></div>';
      const output = InputSanitizer.stripHTML(input);
      expect(output).toBe('Link');
    });

    test('should return empty string for null/undefined', () => {
      expect(InputSanitizer.stripHTML(null)).toBe('');
      expect(InputSanitizer.stripHTML(undefined)).toBe('');
    });

    test('should preserve plain text', () => {
      const input = 'Plain text';
      const output = InputSanitizer.stripHTML(input);
      expect(output).toBe('Plain text');
    });
  });

  describe('sanitizeFilename', () => {
    test('should remove dangerous characters', () => {
      const input = 'file<>:"/\\|?*.txt';
      const output = InputSanitizer.sanitizeFilename(input);
      expect(output).not.toContain('<');
      expect(output).not.toContain('>');
      expect(output).not.toContain(':');
      expect(output).not.toContain('"');
    });

    test('should remove leading/trailing dots and spaces', () => {
      const input = '  ..filename.txt..  ';
      const output = InputSanitizer.sanitizeFilename(input);
      expect(output).toBe('filename.txt');
    });

    test('should limit filename length', () => {
      const input = 'a'.repeat(300) + '.txt';
      const output = InputSanitizer.sanitizeFilename(input);
      expect(output.length).toBeLessThanOrEqual(255);
    });

    test('should return "unnamed" for empty input', () => {
      expect(InputSanitizer.sanitizeFilename('')).toBe('unnamed');
      expect(InputSanitizer.sanitizeFilename(null)).toBe('unnamed');
    });

    test('should preserve valid filenames', () => {
      const input = 'document_2024.pdf';
      const output = InputSanitizer.sanitizeFilename(input);
      expect(output).toBe(input);
    });
  });
});

