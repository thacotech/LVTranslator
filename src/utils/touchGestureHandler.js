/**
 * Touch Gesture Handler for Mobile UX
 * Handles swipe, pull-to-refresh, haptic feedback
 * Requirements: 8.1, 8.2, 8.3, 8.7
 */

class TouchGestureHandler {
  constructor() {
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;
    this.threshold = 50; // Minimum swipe distance
    this.isPulling = false;
    this.pullThreshold = 80;
    
    this.init();
  }

  init() {
    // Swipe gestures for panels
    this.initSwipeGestures();
    
    // Pull to refresh
    this.initPullToRefresh();
    
    console.log('[Touch] Gesture handler initialized');
  }

  /**
   * Initialize swipe gestures
   */
  initSwipeGestures() {
    document.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
      this.touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.touchEndY = e.changedTouches[0].screenY;
      this.handleSwipe();
    }, { passive: true });
  }

  /**
   * Handle swipe gesture
   */
  handleSwipe() {
    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = this.touchEndY - this.touchStartY;

    // Check if horizontal swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > this.threshold) {
      if (deltaX > 0) {
        this.handleSwipeRight();
      } else {
        this.handleSwipeLeft();
      }
      this.triggerHaptic('light');
    }

    // Check if vertical swipe down (for closing modals)
    if (deltaY > this.threshold && Math.abs(deltaX) < this.threshold) {
      this.handleSwipeDown();
      this.triggerHaptic('light');
    }
  }

  /**
   * Handle swipe right
   */
  handleSwipeRight() {
    console.log('[Touch] Swipe right');
    window.dispatchEvent(new CustomEvent('swipe-right'));
  }

  /**
   * Handle swipe left
   */
  handleSwipeLeft() {
    console.log('[Touch] Swipe left');
    window.dispatchEvent(new CustomEvent('swipe-left'));
  }

  /**
   * Handle swipe down
   */
  handleSwipeDown() {
    console.log('[Touch] Swipe down');
    
    // Close open modals
    const modals = document.querySelectorAll('.modal, [role="dialog"]');
    modals.forEach(modal => {
      if (modal.style.display !== 'none') {
        modal.style.display = 'none';
        this.triggerHaptic('medium');
      }
    });
  }

  /**
   * Initialize pull-to-refresh
   */
  initPullToRefresh() {
    let startY = 0;
    let currentY = 0;
    let pulling = false;

    document.addEventListener('touchstart', (e) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        pulling = true;
      }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      if (!pulling) return;
      
      currentY = e.touches[0].clientY;
      const pullDistance = currentY - startY;

      if (pullDistance > 0) {
        this.showPullIndicator(pullDistance);
      }
    }, { passive: true });

    document.addEventListener('touchend', () => {
      if (!pulling) return;
      
      const pullDistance = currentY - startY;
      
      if (pullDistance > this.pullThreshold) {
        this.triggerRefresh();
        this.triggerHaptic('heavy');
      }
      
      this.hidePullIndicator();
      pulling = false;
    }, { passive: true });
  }

  /**
   * Show pull indicator
   */
  showPullIndicator(distance) {
    let indicator = document.getElementById('pullIndicator');
    
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'pullIndicator';
      indicator.className = 'pull-indicator';
      indicator.innerHTML = '<div class="pull-spinner"></div>';
      document.body.appendChild(indicator);
    }

    const opacity = Math.min(distance / this.pullThreshold, 1);
    const rotation = (distance / this.pullThreshold) * 360;
    
    indicator.style.opacity = opacity;
    indicator.style.transform = `translateY(${Math.min(distance, this.pullThreshold)}px) rotate(${rotation}deg)`;
  }

  /**
   * Hide pull indicator
   */
  hidePullIndicator() {
    const indicator = document.getElementById('pullIndicator');
    if (indicator) {
      indicator.style.opacity = 0;
      indicator.style.transform = 'translateY(0) rotate(0)';
    }
  }

  /**
   * Trigger refresh
   */
  triggerRefresh() {
    console.log('[Touch] Pull to refresh triggered');
    
    window.dispatchEvent(new CustomEvent('pull-to-refresh'));
    
    // Reload after animation
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }

  /**
   * Trigger haptic feedback
   */
  triggerHaptic(intensity = 'light') {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30, 10, 30]
      };
      navigator.vibrate(patterns[intensity] || patterns.light);
    }
  }

  /**
   * Optimize touch targets (ensure 44x44px minimum)
   */
  static optimizeTouchTargets() {
    const buttons = document.querySelectorAll('button, a, input[type="button"], input[type="submit"]');
    
    buttons.forEach(btn => {
      const rect = btn.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        btn.style.minWidth = '44px';
        btn.style.minHeight = '44px';
        btn.style.padding = btn.style.padding || '12px';
      }
    });
  }
}

export default TouchGestureHandler;

