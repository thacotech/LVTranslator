/**
 * Input Sanitizer Utility
 * Provides methods to sanitize user input and prevent XSS attacks
 */

class InputSanitizer {
  /**
   * Sanitize HTML to prevent XSS attacks
   * Removes script tags, event handlers, and dangerous attributes
   * @param {string} input - Raw user input
   * @returns {string} - Sanitized input
   */
  static sanitizeHTML(input) {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Create a temporary div to parse HTML
    const temp = document.createElement('div');
    temp.textContent = input; // This automatically escapes HTML
    
    // Remove script tags and their content
    let sanitized = temp.innerHTML;
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove event handlers (onclick, onerror, etc.)
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
    
    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');
    
    // Remove data: protocol (except for images which we'll handle separately)
    sanitized = sanitized.replace(/data:(?!image\/)/gi, '');
    
    // Remove dangerous tags
    const dangerousTags = ['iframe', 'object', 'embed', 'link', 'style', 'meta', 'base'];
    dangerousTags.forEach(tag => {
      const regex = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, 'gi');
      sanitized = sanitized.replace(regex, '');
      // Also remove self-closing tags
      const selfClosing = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi');
      sanitized = sanitized.replace(selfClosing, '');
    });
    
    return sanitized;
  }

  /**
   * Escape HTML entities to prevent XSS
   * Converts special characters to HTML entities
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   */
  static escapeHTML(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    const entityMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    };

    return text.replace(/[&<>"'`=\/]/g, char => entityMap[char]);
  }

  /**
   * Unescape HTML entities back to characters
   * @param {string} text - Text with HTML entities
   * @returns {string} - Unescaped text
   */
  static unescapeHTML(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    const temp = document.createElement('textarea');
    temp.innerHTML = text;
    return temp.value;
  }

  /**
   * Validate file uploads to prevent malicious files
   * @param {File} file - File object to validate
   * @param {Object} options - Validation options
   * @returns {Object} - { valid: boolean, error?: string }
   */
  static validateFile(file, options = {}) {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg', 'image/jpg', 'text/plain'],
      allowedExtensions = ['.pdf', '.docx', '.png', '.jpg', '.jpeg', '.txt']
    } = options;

    // Check if file exists
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
      return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` };
    }

    // Check file size is not zero
    if (file.size === 0) {
      return { valid: false, error: 'File is empty' };
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not allowed' };
    }

    // Check file extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      return { valid: false, error: 'File extension not allowed' };
    }

    // Check for double extensions (e.g., file.pdf.exe)
    const parts = fileName.split('.');
    if (parts.length > 2) {
      const secondLastExt = '.' + parts[parts.length - 2];
      const dangerousExts = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.js', '.jar'];
      if (dangerousExts.includes(secondLastExt)) {
        return { valid: false, error: 'Suspicious file name detected' };
      }
    }

    return { valid: true };
  }

  /**
   * Validate text input
   * @param {string} text - Text to validate
   * @param {Object} options - Validation options
   * @returns {Object} - { valid: boolean, error?: string }
   */
  static validateText(text, options = {}) {
    const {
      minLength = 1,
      maxLength = 10000,
      allowEmpty = false
    } = options;

    // Check if text is provided
    if (!text && !allowEmpty) {
      return { valid: false, error: 'Text is required' };
    }

    // Check if text is string
    if (typeof text !== 'string') {
      return { valid: false, error: 'Text must be a string' };
    }

    // Check if text is empty or whitespace only
    const trimmed = text.trim();
    if (trimmed.length === 0 && !allowEmpty) {
      return { valid: false, error: 'Text cannot be empty' };
    }

    // Check minimum length
    if (trimmed.length < minLength) {
      return { valid: false, error: `Text must be at least ${minLength} characters` };
    }

    // Check maximum length
    if (text.length > maxLength) {
      return { valid: false, error: `Text exceeds maximum length of ${maxLength} characters` };
    }

    return { valid: true };
  }

  /**
   * Sanitize translation text
   * Removes potentially dangerous content but preserves formatting
   * @param {string} text - Text to sanitize
   * @returns {string} - Sanitized text
   */
  static sanitizeTranslationText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    // Basic sanitization while preserving line breaks
    let sanitized = text.trim();
    
    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');
    
    // Remove control characters except newlines and tabs
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Normalize whitespace (but preserve line breaks)
    sanitized = sanitized.replace(/\r\n/g, '\n'); // Windows line endings
    sanitized = sanitized.replace(/\r/g, '\n'); // Old Mac line endings
    
    return sanitized;
  }

  /**
   * Validate language code
   * @param {string} langCode - Language code to validate
   * @returns {boolean} - Whether language code is valid
   */
  static validateLanguageCode(langCode) {
    const validCodes = ['vi', 'lo', 'en'];
    return validCodes.includes(langCode);
  }

  /**
   * Sanitize URL
   * Ensures URL is safe and valid
   * @param {string} url - URL to sanitize
   * @returns {string|null} - Sanitized URL or null if invalid
   */
  static sanitizeURL(url) {
    if (!url || typeof url !== 'string') {
      return null;
    }

    try {
      const parsed = new URL(url);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return null;
      }

      return parsed.href;
    } catch (e) {
      return null;
    }
  }

  /**
   * Strip all HTML tags from text
   * @param {string} html - HTML string
   * @returns {string} - Plain text
   */
  static stripHTML(html) {
    if (!html || typeof html !== 'string') {
      return '';
    }

    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  }

  /**
   * Sanitize filename
   * Removes dangerous characters from filename
   * @param {string} filename - Original filename
   * @returns {string} - Sanitized filename
   */
  static sanitizeFilename(filename) {
    if (!filename || typeof filename !== 'string') {
      return 'unnamed';
    }

    // Remove path separators and dangerous characters
    let sanitized = filename.replace(/[\/\\:*?"<>|]/g, '_');
    
    // Remove leading/trailing dots and spaces
    sanitized = sanitized.replace(/^[\s.]+|[\s.]+$/g, '');
    
    // Limit length
    if (sanitized.length > 255) {
      const ext = sanitized.split('.').pop();
      const name = sanitized.substring(0, 250 - ext.length);
      sanitized = name + '.' + ext;
    }

    return sanitized || 'unnamed';
  }
}

// Export for use in modules
export default InputSanitizer;

// Also make available globally for backward compatibility
if (typeof window !== 'undefined') {
  window.InputSanitizer = InputSanitizer;
}

