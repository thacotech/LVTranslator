/**
 * Touch Handler Utility
 * Optimizes touch interactions for mobile devices
 */

class TouchHandler {
  constructor() {
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;
    this.minSwipeDistance = 50; // Minimum distance for swipe (pixels)
    this.maxVerticalDistance = 100; // Maximum vertical movement for horizontal swipe
    this.tapTimeout = null;
    this.doubleTapDelay = 300; // ms
    this.lastTap = 0;
    this.listeners = new Map();
  }

  /**
   * Initialize touch events on element
   * @param {HTMLElement} element - Element to add touch events to
   * @param {Object} handlers - Event handlers
   */
  init(element, handlers = {}) {
    const {
      onSwipeLeft,
      onSwipeRight,
      onSwipeUp,
      onSwipeDown,
      onTap,
      onDoubleTap,
      onLongPress
    } = handlers;

    // Store handlers
    this.listeners.set(element, handlers);

    // Touch start
    element.addEventListener('touchstart', (e) => {
      this.handleTouchStart(e, element);
    }, { passive: true });

    // Touch end
    element.addEventListener('touchend', (e) => {
      this.handleTouchEnd(e, element);
    }, { passive: true });

    // Touch move (for preventing default if needed)
    element.addEventListener('touchmove', (e) => {
      this.handleTouchMove(e, element);
    }, { passive: true });

    // Prevent default context menu on long press
    element.addEventListener('contextmenu', (e) => {
      if (handlers.onLongPress) {
        e.preventDefault();
      }
    });
  }

  /**
   * Handle touch start
   * @private
   */
  handleTouchStart(event, element) {
    const handlers = this.listeners.get(element);
    if (!handlers) return;

    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;

    // Setup long press detection
    if (handlers.onLongPress) {
      this.tapTimeout = setTimeout(() => {
        handlers.onLongPress(event);
      }, 500);
    }
  }

  /**
   * Handle touch move
   * @private
   */
  handleTouchMove(event, element) {
    // Clear long press timeout on move
    if (this.tapTimeout) {
      clearTimeout(this.tapTimeout);
      this.tapTimeout = null;
    }
  }

  /**
   * Handle touch end
   * @private
   */
  handleTouchEnd(event, element) {
    const handlers = this.listeners.get(element);
    if (!handlers) return;

    // Clear long press timeout
    if (this.tapTimeout) {
      clearTimeout(this.tapTimeout);
      this.tapTimeout = null;
    }

    const touch = event.changedTouches[0];
    this.touchEndX = touch.clientX;
    this.touchEndY = touch.clientY;

    // Calculate distances
    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = this.touchEndY - this.touchStartY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Check for swipe
    if (absDeltaX > this.minSwipeDistance || absDeltaY > this.minSwipeDistance) {
      // Horizontal swipe
      if (absDeltaX > absDeltaY && absDeltaY < this.maxVerticalDistance) {
        if (deltaX > 0 && handlers.onSwipeRight) {
          handlers.onSwipeRight(event, deltaX);
        } else if (deltaX < 0 && handlers.onSwipeLeft) {
          handlers.onSwipeLeft(event, Math.abs(deltaX));
        }
      }
      // Vertical swipe
      else if (absDeltaY > absDeltaX) {
        if (deltaY > 0 && handlers.onSwipeDown) {
          handlers.onSwipeDown(event, deltaY);
        } else if (deltaY < 0 && handlers.onSwipeUp) {
          handlers.onSwipeUp(event, Math.abs(deltaY));
        }
      }
    }
    // Check for tap
    else if (absDeltaX < 10 && absDeltaY < 10) {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - this.lastTap;

      // Double tap
      if (tapLength < this.doubleTapDelay && tapLength > 0) {
        if (handlers.onDoubleTap) {
          handlers.onDoubleTap(event);
        }
        this.lastTap = 0; // Reset
      }
      // Single tap
      else {
        this.lastTap = currentTime;
        if (handlers.onTap) {
          // Delay to check for double tap
          setTimeout(() => {
            if (this.lastTap === currentTime) {
              handlers.onTap(event);
            }
          }, this.doubleTapDelay);
        }
      }
    }
  }

  /**
   * Remove touch handlers from element
   * @param {HTMLElement} element - Element to remove handlers from
   */
  destroy(element) {
    this.listeners.delete(element);
    // Note: Actual event listeners would need to be stored to be removed
    // This is a simplified version
  }

  /**
   * Enable haptic feedback (if supported)
   * @param {string} style - 'light', 'medium', 'heavy'
   */
  hapticFeedback(style = 'light') {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      };
      navigator.vibrate(patterns[style] || patterns.light);
    }
  }

  /**
   * Check if device is touch-capable
   * @returns {boolean}
   */
  static isTouchDevice() {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
  }

  /**
   * Optimize button size for touch
   * Ensures minimum 44x44px touch target
   * @param {HTMLElement} element - Button or touch target
   */
  static optimizeTouchTarget(element) {
    const rect = element.getBoundingClientRect();
    const minSize = 44; // Minimum recommended touch target size

    if (rect.width < minSize || rect.height < minSize) {
      // Add padding to increase touch area
      const paddingX = Math.max(0, (minSize - rect.width) / 2);
      const paddingY = Math.max(0, (minSize - rect.height) / 2);

      element.style.padding = `${paddingY}px ${paddingX}px`;
    }
  }

  /**
   * Prevent zoom on double-tap for specific element
   * @param {HTMLElement} element - Element to prevent zoom on
   */
  static preventZoom(element) {
    let lastTouchEnd = 0;
    element.addEventListener('touchend', (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, { passive: false });
  }

  /**
   * Add pull-to-refresh disable for element
   * @param {HTMLElement} element - Element to disable pull-to-refresh on
   */
  static disablePullToRefresh(element) {
    let startY = 0;

    element.addEventListener('touchstart', (e) => {
      startY = e.touches[0].pageY;
    }, { passive: true });

    element.addEventListener('touchmove', (e) => {
      const y = e.touches[0].pageY;
      // Prevent pull-to-refresh if scrolling down at top of page
      if (element.scrollTop === 0 && y > startY) {
        e.preventDefault();
      }
    }, { passive: false });
  }
}

// Create singleton instance
const touchHandler = new TouchHandler();

// Export
export default touchHandler;
export { TouchHandler };

// Make available globally
if (typeof window !== 'undefined') {
  window.TouchHandler = touchHandler;
}

