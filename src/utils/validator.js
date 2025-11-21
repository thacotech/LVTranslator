/**
 * Input Validator Utility
 * Provides validation methods for various input types
 */

class InputValidator {
  /**
   * Validate email address
   * @param {string} email - Email to validate
   * @returns {boolean} - Whether email is valid
   */
  static isValidEmail(email) {
    if (!email || typeof email !== 'string') {
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate URL
   * @param {string} url - URL to validate
   * @returns {boolean} - Whether URL is valid
   */
  static isValidURL(url) {
    if (!url || typeof url !== 'string') {
      return false;
    }

    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch (e) {
      return false;
    }
  }

  /**
   * Check if string contains only alphanumeric characters
   * @param {string} str - String to check
   * @returns {boolean} - Whether string is alphanumeric
   */
  static isAlphanumeric(str) {
    if (!str || typeof str !== 'string') {
      return false;
    }

    return /^[a-zA-Z0-9]+$/.test(str);
  }

  /**
   * Check if string contains SQL injection patterns
   * @param {string} str - String to check
   * @returns {boolean} - Whether string contains SQL injection patterns
   */
  static containsSQLInjection(str) {
    if (!str || typeof str !== 'string') {
      return false;
    }

    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/i,
      /(--|;|\/\*|\*\/)/,
      /('|('')|(\-\-)|(;)|(\/*)|(\*\/))/
    ];

    return sqlPatterns.some(pattern => pattern.test(str));
  }

  /**
   * Check if string contains XSS patterns
   * @param {string} str - String to check
   * @returns {boolean} - Whether string contains XSS patterns
   */
  static containsXSS(str) {
    if (!str || typeof str !== 'string') {
      return false;
    }

    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi
    ];

    return xssPatterns.some(pattern => pattern.test(str));
  }

  /**
   * Validate file size
   * @param {number} size - File size in bytes
   * @param {number} maxSize - Maximum allowed size in bytes
   * @returns {boolean} - Whether file size is valid
   */
  static isValidFileSize(size, maxSize = 10 * 1024 * 1024) {
    return typeof size === 'number' && size > 0 && size <= maxSize;
  }

  /**
   * Validate file extension
   * @param {string} filename - Filename to validate
   * @param {Array<string>} allowedExtensions - Allowed extensions
   * @returns {boolean} - Whether file extension is valid
   */
  static hasValidExtension(filename, allowedExtensions = ['.pdf', '.docx', '.txt', '.png', '.jpg', '.jpeg']) {
    if (!filename || typeof filename !== 'string') {
      return false;
    }

    const lowerFilename = filename.toLowerCase();
    return allowedExtensions.some(ext => lowerFilename.endsWith(ext));
  }

  /**
   * Check if number is within range
   * @param {number} value - Value to check
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {boolean} - Whether value is in range
   */
  static isInRange(value, min, max) {
    return typeof value === 'number' && value >= min && value <= max;
  }

  /**
   * Validate length
   * @param {string} str - String to validate
   * @param {number} min - Minimum length
   * @param {number} max - Maximum length
   * @returns {boolean} - Whether length is valid
   */
  static isValidLength(str, min = 0, max = Infinity) {
    if (typeof str !== 'string') {
      return false;
    }

    const length = str.length;
    return length >= min && length <= max;
  }

  /**
   * Check if value is not empty
   * @param {any} value - Value to check
   * @returns {boolean} - Whether value is not empty
   */
  static isNotEmpty(value) {
    if (value === null || value === undefined) {
      return false;
    }

    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (typeof value === 'object') {
      return Object.keys(value).length > 0;
    }

    return true;
  }

  /**
   * Validate JSON string
   * @param {string} str - JSON string to validate
   * @returns {boolean} - Whether string is valid JSON
   */
  static isValidJSON(str) {
    if (!str || typeof str !== 'string') {
      return false;
    }

    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Validate base64 string
   * @param {string} str - Base64 string to validate
   * @returns {boolean} - Whether string is valid base64
   */
  static isValidBase64(str) {
    if (!str || typeof str !== 'string') {
      return false;
    }

    const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
    return base64Regex.test(str);
  }

  /**
   * Validate hex color
   * @param {string} color - Hex color to validate
   * @returns {boolean} - Whether color is valid hex
   */
  static isValidHexColor(color) {
    if (!color || typeof color !== 'string') {
      return false;
    }

    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  }

  /**
   * Check if string contains only allowed characters
   * @param {string} str - String to check
   * @param {RegExp} allowedPattern - Regex pattern for allowed characters
   * @returns {boolean} - Whether string contains only allowed characters
   */
  static containsOnlyAllowedCharacters(str, allowedPattern) {
    if (!str || typeof str !== 'string' || !(allowedPattern instanceof RegExp)) {
      return false;
    }

    return allowedPattern.test(str);
  }

  /**
   * Validate date string
   * @param {string} dateStr - Date string to validate
   * @returns {boolean} - Whether date is valid
   */
  static isValidDate(dateStr) {
    if (!dateStr) {
      return false;
    }

    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Validate integer
   * @param {any} value - Value to validate
   * @returns {boolean} - Whether value is an integer
   */
  static isInteger(value) {
    return Number.isInteger(value);
  }

  /**
   * Validate positive number
   * @param {any} value - Value to validate
   * @returns {boolean} - Whether value is a positive number
   */
  static isPositive(value) {
    return typeof value === 'number' && !isNaN(value) && value > 0;
  }

  /**
   * Batch validation
   * @param {Object} data - Data to validate
   * @param {Object} rules - Validation rules
   * @returns {Object} - { valid: boolean, errors: Object }
   */
  static validate(data, rules) {
    const errors = {};
    let valid = true;

    for (const [field, fieldRules] of Object.entries(rules)) {
      const value = data[field];

      for (const [rule, ruleValue] of Object.entries(fieldRules)) {
        let isValid = true;
        let errorMessage = '';

        switch (rule) {
          case 'required':
            isValid = ruleValue ? this.isNotEmpty(value) : true;
            errorMessage = `${field} is required`;
            break;

          case 'minLength':
            isValid = typeof value === 'string' && value.length >= ruleValue;
            errorMessage = `${field} must be at least ${ruleValue} characters`;
            break;

          case 'maxLength':
            isValid = typeof value === 'string' && value.length <= ruleValue;
            errorMessage = `${field} must not exceed ${ruleValue} characters`;
            break;

          case 'email':
            isValid = ruleValue ? this.isValidEmail(value) : true;
            errorMessage = `${field} must be a valid email`;
            break;

          case 'url':
            isValid = ruleValue ? this.isValidURL(value) : true;
            errorMessage = `${field} must be a valid URL`;
            break;

          case 'pattern':
            isValid = ruleValue.test(value);
            errorMessage = `${field} format is invalid`;
            break;

          case 'min':
            isValid = typeof value === 'number' && value >= ruleValue;
            errorMessage = `${field} must be at least ${ruleValue}`;
            break;

          case 'max':
            isValid = typeof value === 'number' && value <= ruleValue;
            errorMessage = `${field} must not exceed ${ruleValue}`;
            break;

          case 'custom':
            const result = ruleValue(value, data);
            isValid = result === true;
            errorMessage = typeof result === 'string' ? result : `${field} is invalid`;
            break;
        }

        if (!isValid) {
          errors[field] = errorMessage;
          valid = false;
          break; // Stop checking rules for this field after first error
        }
      }
    }

    return { valid, errors };
  }
}

// Export for use in modules
export default InputValidator;

// Also make available globally for backward compatibility
if (typeof window !== 'undefined') {
  window.InputValidator = InputValidator;
}

