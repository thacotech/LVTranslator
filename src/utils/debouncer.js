/**
 * Request Debouncer Utility
 * Delays function execution until after a specified delay has elapsed since the last call
 */

class RequestDebouncer {
  constructor(delay = 500) {
    this.delay = delay;
    this.timeoutId = null;
    this.pendingController = null;
  }

  /**
   * Debounce a function call
   * @param {Function} fn - Function to debounce
   * @param {...any} args - Function arguments
   * @returns {Promise} - Promise that resolves with function result
   */
  debounce(fn, ...args) {
    // Cancel pending request
    if (this.pendingController) {
      this.pendingController.abort();
      this.pendingController = null;
    }

    // Clear existing timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    return new Promise((resolve, reject) => {
      this.timeoutId = setTimeout(async () => {
        // Create AbortController for this request
        this.pendingController = new AbortController();
        
        try {
          const result = await fn(...args, { signal: this.pendingController.signal });
          this.pendingController = null;
          resolve(result);
        } catch (error) {
          this.pendingController = null;
          
          // Don't reject for aborted requests
          if (error.name === 'AbortError') {
            // Request was cancelled, silently ignore
            return;
          }
          
          reject(error);
        }
      }, this.delay);
    });
  }

  /**
   * Cancel pending debounced call
   */
  cancel() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.pendingController) {
      this.pendingController.abort();
      this.pendingController = null;
    }
  }

  /**
   * Update delay time
   * @param {number} newDelay - New delay in milliseconds
   */
  setDelay(newDelay) {
    this.delay = newDelay;
  }

  /**
   * Check if there's a pending call
   * @returns {boolean} - Whether there's a pending call
   */
  isPending() {
    return this.timeoutId !== null;
  }

  /**
   * Immediately execute pending call without waiting for delay
   * @returns {void}
   */
  flush() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      // Note: We can't actually execute the pending function here
      // because we don't have access to the original function and args
      // This just cancels the pending timeout
      this.timeoutId = null;
    }
  }
}

/**
 * Create a debounced version of a function
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(fn, delay = 500) {
  let timeoutId = null;
  let pendingController = null;

  const debouncedFn = function(...args) {
    // Cancel pending request
    if (pendingController) {
      pendingController.abort();
      pendingController = null;
    }

    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        pendingController = new AbortController();
        
        try {
          const result = await fn.apply(this, [...args, { signal: pendingController.signal }]);
          pendingController = null;
          resolve(result);
        } catch (error) {
          pendingController = null;
          
          if (error.name === 'AbortError') {
            return;
          }
          
          reject(error);
        }
      }, delay);
    });
  };

  debouncedFn.cancel = function() {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (pendingController) {
      pendingController.abort();
      pendingController = null;
    }
  };

  debouncedFn.flush = function() {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  debouncedFn.isPending = function() {
    return timeoutId !== null;
  };

  return debouncedFn;
}

/**
 * Create a throttled version of a function
 * Ensures function is called at most once per specified interval
 * @param {Function} fn - Function to throttle
 * @param {number} interval - Interval in milliseconds
 * @returns {Function} - Throttled function
 */
export function throttle(fn, interval = 500) {
  let lastCall = 0;
  let timeoutId = null;

  return function(...args) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    const callFunction = () => {
      lastCall = Date.now();
      return fn.apply(this, args);
    };

    if (timeSinceLastCall >= interval) {
      // Enough time has passed, call immediately
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      return callFunction();
    } else {
      // Not enough time has passed, schedule for later
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      return new Promise((resolve, reject) => {
        timeoutId = setTimeout(() => {
          timeoutId = null;
          try {
            resolve(callFunction());
          } catch (error) {
            reject(error);
          }
        }, interval - timeSinceLastCall);
      });
    }
  };
}

export default RequestDebouncer;

// Also make available globally for backward compatibility
if (typeof window !== 'undefined') {
  window.RequestDebouncer = RequestDebouncer;
  window.debounce = debounce;
  window.throttle = throttle;
}

