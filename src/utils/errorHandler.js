/**
 * Global Error Handler
 * Centralized error handling with user-friendly messages
 */

import { ERROR_MESSAGES } from '../config/constants.js';

/**
 * Error types enum
 */
export const ErrorTypes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  FILE_ERROR: 'FILE_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  ENCRYPTION_ERROR: 'ENCRYPTION_ERROR',
  WORKER_ERROR: 'WORKER_ERROR',
  TTS_NOT_SUPPORTED: 'TTS_NOT_SUPPORTED',
  TTS_ERROR: 'TTS_ERROR',
  STT_NOT_SUPPORTED: 'STT_NOT_SUPPORTED',
  STT_ERROR: 'STT_ERROR',
  MICROPHONE_PERMISSION_DENIED: 'MICROPHONE_PERMISSION_DENIED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

// Alias for backward compatibility
export const ErrorCodes = ErrorTypes;

/**
 * Custom Error Classes
 */
export class TranslationError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'TranslationError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export class ValidationError extends Error {
  constructor(message, field, value) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
    this.timestamp = new Date().toISOString();
  }
}

export class NetworkError extends Error {
  constructor(message, statusCode, url) {
    super(message);
    this.name = 'NetworkError';
    this.statusCode = statusCode;
    this.url = url;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Error Handler Class
 */
class ErrorHandler {
  constructor() {
    this.errors = [];
    this.maxErrors = 100;
    this.listeners = new Set();
    this.setupGlobalHandlers();
  }

  /**
   * Setup global error handlers
   */
  setupGlobalHandlers() {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.handleUncaughtError(event.error);
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleUnhandledRejection(event.reason);
    });
  }

  /**
   * Handle an error
   * @param {Error} error - Error object
   * @param {Object} context - Additional context
   */
  handle(error, context = {}) {
    // Log error for debugging
    this.logError(error, context);

    // Get user-friendly message
    const userMessage = this.getUserMessage(error);

    // Show error to user
    this.showErrorToUser(userMessage, error.code || ErrorTypes.UNKNOWN_ERROR);

    // Track error
    this.trackError(error, context);

    // Notify listeners
    this.notifyListeners(error, context);

    return userMessage;
  }

  /**
   * Handle uncaught errors
   * @param {Error} error - Error object
   */
  handleUncaughtError(error) {
    console.error('Uncaught error:', error);
    this.handle(error, { type: 'uncaught' });
  }

  /**
   * Handle unhandled promise rejections
   * @param {any} reason - Rejection reason
   */
  handleUnhandledRejection(reason) {
    console.error('Unhandled rejection:', reason);
    const error = reason instanceof Error ? reason : new Error(String(reason));
    this.handle(error, { type: 'unhandled_rejection' });
  }

  /**
   * Log error for debugging
   * @param {Error} error - Error object
   * @param {Object} context - Additional context
   */
  logError(error, context) {
    const errorInfo = {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorInfo);
    }

    // Store error (limited to maxErrors)
    this.errors.push(errorInfo);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift(); // Remove oldest
    }

    // Could send to logging service here
    // this.sendToLoggingService(errorInfo);
  }

  /**
   * Get user-friendly error message
   * @param {Error} error - Error object
   * @returns {string} - User-friendly message
   */
  getUserMessage(error) {
    // Check for specific error codes
    if (error.code && ERROR_MESSAGES[error.code]) {
      return ERROR_MESSAGES[error.code];
    }

    // Check error type
    if (error instanceof ValidationError) {
      return ERROR_MESSAGES.TEXT_TOO_LONG || error.message;
    }

    if (error instanceof NetworkError) {
      if (error.statusCode === 429) {
        return ERROR_MESSAGES.RATE_LIMIT;
      }
      return ERROR_MESSAGES.NETWORK_ERROR;
    }

    if (error.name === 'QuotaExceededError') {
      return ERROR_MESSAGES.STORAGE_QUOTA_EXCEEDED;
    }

    // Check error message patterns
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }

    if (message.includes('api') || message.includes('gemini')) {
      return ERROR_MESSAGES.API_ERROR;
    }

    if (message.includes('rate limit')) {
      return ERROR_MESSAGES.RATE_LIMIT;
    }

    if (message.includes('file')) {
      if (message.includes('size')) {
        return ERROR_MESSAGES.FILE_TOO_LARGE;
      }
      if (message.includes('type')) {
        return ERROR_MESSAGES.INVALID_FILE_TYPE;
      }
      return 'Lỗi xử lý file. Vui lòng thử lại.';
    }

    if (message.includes('storage') || message.includes('quota')) {
      return ERROR_MESSAGES.STORAGE_QUOTA_EXCEEDED;
    }

    if (message.includes('encrypt') || message.includes('decrypt')) {
      return ERROR_MESSAGES.ENCRYPTION_ERROR;
    }

    if (message.includes('worker')) {
      return ERROR_MESSAGES.WORKER_ERROR;
    }

    // Default error message
    return ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  /**
   * Show error to user
   * @param {string} message - Error message
   * @param {string} type - Error type
   */
  showErrorToUser(message, type = ErrorTypes.UNKNOWN_ERROR) {
    // Create error element
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message error-toast';
    errorElement.setAttribute('role', 'alert');
    errorElement.innerHTML = `
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <span class="error-text">${message}</span>
        <button class="error-close" aria-label="Đóng">✕</button>
      </div>
    `;

    // Add to DOM
    document.body.appendChild(errorElement);

    // Close button handler
    const closeBtn = errorElement.querySelector('.error-close');
    closeBtn.addEventListener('click', () => {
      errorElement.remove();
    });

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (errorElement.parentNode) {
        errorElement.remove();
      }
    }, 5000);

    // Animate in
    setTimeout(() => {
      errorElement.classList.add('show');
    }, 10);
  }

  /**
   * Track error for monitoring
   * @param {Error} error - Error object
   * @param {Object} context - Additional context
   */
  trackError(error, context) {
    // Could send to analytics service here
    // Example: Google Analytics, Sentry, etc.
    
    if (typeof gtag !== 'undefined') {
      try {
        gtag('event', 'exception', {
          description: error.message,
          fatal: false
        });
      } catch (e) {
        // Ignore tracking errors
      }
    }
  }

  /**
   * Add error listener
   * @param {Function} listener - Listener function
   */
  addListener(listener) {
    this.listeners.add(listener);
  }

  /**
   * Remove error listener
   * @param {Function} listener - Listener function
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }

  /**
   * Notify all listeners
   * @param {Error} error - Error object
   * @param {Object} context - Additional context
   */
  notifyListeners(error, context) {
    this.listeners.forEach(listener => {
      try {
        listener(error, context);
      } catch (e) {
        console.error('Error in error listener:', e);
      }
    });
  }

  /**
   * Get all logged errors
   * @returns {Array} - Array of error objects
   */
  getErrors() {
    return [...this.errors];
  }

  /**
   * Clear logged errors
   */
  clearErrors() {
    this.errors = [];
  }

  /**
   * Export errors as JSON
   * @returns {string} - JSON string of errors
   */
  exportErrors() {
    return JSON.stringify(this.errors, null, 2);
  }

  /**
   * Get error statistics
   * @returns {Object} - Error statistics
   */
  getStats() {
    const stats = {
      total: this.errors.length,
      byType: {},
      byCode: {},
      recent: this.errors.slice(-10)
    };

    this.errors.forEach(error => {
      // Count by type
      const type = error.name || 'Unknown';
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // Count by code
      if (error.code) {
        stats.byCode[error.code] = (stats.byCode[error.code] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Create a safe async wrapper
   * @param {Function} fn - Async function to wrap
   * @param {Object} context - Context for error handling
   * @returns {Function} - Wrapped function
   */
  wrapAsync(fn, context = {}) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.handle(error, context);
        throw error;
      }
    };
  }

  /**
   * Create a safe function wrapper
   * @param {Function} fn - Function to wrap
   * @param {Object} context - Context for error handling
   * @returns {Function} - Wrapped function
   */
  wrap(fn, context = {}) {
    return (...args) => {
      try {
        return fn(...args);
      } catch (error) {
        this.handle(error, context);
        throw error;
      }
    };
  }

  /**
   * Handle API errors specifically
   * @param {Response} response - Fetch response
   * @param {string} url - Request URL
   * @returns {Promise} - Throws appropriate error
   */
  async handleAPIError(response, url) {
    const statusCode = response.status;
    let message = 'API request failed';

    try {
      const data = await response.json();
      message = data.message || data.error || message;
    } catch (e) {
      // Could not parse JSON
    }

    if (statusCode === 429) {
      throw new NetworkError(
        ERROR_MESSAGES.RATE_LIMIT,
        statusCode,
        url
      );
    }

    if (statusCode >= 500) {
      throw new NetworkError(
        ERROR_MESSAGES.API_ERROR,
        statusCode,
        url
      );
    }

    if (statusCode >= 400) {
      throw new NetworkError(
        message,
        statusCode,
        url
      );
    }

    throw new NetworkError(message, statusCode, url);
  }
}

// Create singleton instance
const errorHandler = new ErrorHandler();

// Export singleton and classes
export default errorHandler;
export { ErrorHandler };

// Make available globally for backward compatibility
if (typeof window !== 'undefined') {
  window.ErrorHandler = errorHandler;
}

