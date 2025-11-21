/**
 * DOM Optimizer Utility
 * Reduces DOM manipulation and improves rendering performance
 */

class DOMOptimizer {
  constructor() {
    this.pendingUpdates = new Map();
    this.rafId = null;
    this.batchQueue = [];
  }

  /**
   * Batch DOM updates using DocumentFragment
   * @param {HTMLElement} container - Container element
   * @param {Array<HTMLElement>} elements - Elements to append
   */
  batchInsert(container, elements) {
    const fragment = document.createDocumentFragment();
    elements.forEach(element => fragment.appendChild(element));
    container.appendChild(fragment);
  }

  /**
   * Batch update multiple elements
   * @param {Array<Object>} updates - Array of {element, property, value}
   */
  batchUpdate(updates) {
    // Use requestAnimationFrame to batch updates
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }

    this.batchQueue.push(...updates);

    this.rafId = requestAnimationFrame(() => {
      // Apply all pending updates
      this.batchQueue.forEach(({ element, property, value }) => {
        if (property === 'class') {
          element.className = value;
        } else if (property === 'style') {
          Object.assign(element.style, value);
        } else if (property === 'text') {
          element.textContent = value;
        } else if (property === 'html') {
          element.innerHTML = value;
        } else {
          element[property] = value;
        }
      });

      this.batchQueue = [];
      this.rafId = null;
    });
  }

  /**
   * Debounced DOM update
   * @param {string} key - Unique key for this update
   * @param {Function} callback - Update function
   * @param {number} delay - Delay in ms
   */
  debouncedUpdate(key, callback, delay = 16) {
    if (this.pendingUpdates.has(key)) {
      clearTimeout(this.pendingUpdates.get(key));
    }

    const timeoutId = setTimeout(() => {
      callback();
      this.pendingUpdates.delete(key);
    }, delay);

    this.pendingUpdates.set(key, timeoutId);
  }

  /**
   * Throttled DOM update using requestAnimationFrame
   * @param {Function} callback - Update function
   * @returns {Function} - Throttled function
   */
  throttleRAF(callback) {
    let rafId = null;
    let lastArgs = null;

    return (...args) => {
      lastArgs = args;

      if (rafId) {
        return;
      }

      rafId = requestAnimationFrame(() => {
        callback.apply(this, lastArgs);
        rafId = null;
      });
    };
  }

  /**
   * Measure and apply DOM updates to minimize reflow
   * @param {Function} readCallback - Read operations (getComputedStyle, getBoundingClientRect)
   * @param {Function} writeCallback - Write operations (style changes, classList)
   */
  measureAndUpdate(readCallback, writeCallback) {
    // Read phase
    requestAnimationFrame(() => {
      const measurements = readCallback();

      // Write phase
      requestAnimationFrame(() => {
        writeCallback(measurements);
      });
    });
  }

  /**
   * Create a virtual scroll container
   * @param {HTMLElement} container - Container element
   * @param {Array} items - Array of items
   * @param {Function} renderItem - Function to render each item
   * @param {number} itemHeight - Height of each item
   * @returns {Object} - Virtual scroll controller
   */
  createVirtualScroll(container, items, renderItem, itemHeight) {
    const viewport = container;
    const viewportHeight = viewport.clientHeight;
    const totalHeight = items.length * itemHeight;

    // Create scroll container
    const scrollContainer = document.createElement('div');
    scrollContainer.style.height = `${totalHeight}px`;
    scrollContainer.style.position = 'relative';

    // Create content container
    const content = document.createElement('div');
    content.style.position = 'absolute';
    content.style.top = '0';
    content.style.left = '0';
    content.style.width = '100%';

    scrollContainer.appendChild(content);
    viewport.appendChild(scrollContainer);

    let startIndex = 0;
    let endIndex = 0;

    const render = () => {
      const scrollTop = viewport.scrollTop;
      startIndex = Math.floor(scrollTop / itemHeight);
      endIndex = Math.ceil((scrollTop + viewportHeight) / itemHeight);

      // Add buffer
      startIndex = Math.max(0, startIndex - 5);
      endIndex = Math.min(items.length, endIndex + 5);

      // Clear content
      content.innerHTML = '';

      // Render visible items
      const fragment = document.createDocumentFragment();
      for (let i = startIndex; i < endIndex; i++) {
        const item = renderItem(items[i], i);
        item.style.position = 'absolute';
        item.style.top = `${i * itemHeight}px`;
        item.style.width = '100%';
        fragment.appendChild(item);
      }

      content.appendChild(fragment);
    };

    // Throttled scroll handler
    const handleScroll = this.throttleRAF(render);
    viewport.addEventListener('scroll', handleScroll, { passive: true });

    // Initial render
    render();

    return {
      update: (newItems) => {
        items = newItems;
        scrollContainer.style.height = `${newItems.length * itemHeight}px`;
        render();
      },
      scrollToIndex: (index) => {
        viewport.scrollTop = index * itemHeight;
      },
      destroy: () => {
        viewport.removeEventListener('scroll', handleScroll);
        scrollContainer.remove();
      }
    };
  }

  /**
   * Lazy load images with Intersection Observer
   * @param {HTMLElement} container - Container with images
   * @param {Object} options - Intersection Observer options
   */
  lazyLoadImages(container, options = {}) {
    const {
      rootMargin = '50px',
      threshold = 0.01
    } = options;

    if (!('IntersectionObserver' in window)) {
      // Fallback: load all images immediately
      const images = container.querySelectorAll('img[data-src]');
      images.forEach(img => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      });
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin,
      threshold
    });

    const images = container.querySelectorAll('img[data-src]');
    images.forEach(img => observer.observe(img));

    return observer;
  }

  /**
   * Defer non-critical CSS
   * @param {string} href - CSS file URL
   * @param {string} media - Media query
   */
  deferCSS(href, media = 'all') {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.media = 'print'; // Load as print to not block render
    link.onload = function() {
      this.media = media; // Switch to target media after load
    };
    document.head.appendChild(link);
  }

  /**
   * Preload critical resources
   * @param {string} href - Resource URL
   * @param {string} as - Resource type
   */
  preload(href, as = 'script') {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  }

  /**
   * Measure element with minimal reflow
   * @param {HTMLElement} element - Element to measure
   * @returns {Object} - Measurements
   */
  measure(element) {
    return {
      rect: element.getBoundingClientRect(),
      computed: window.getComputedStyle(element),
      scroll: {
        top: element.scrollTop,
        left: element.scrollLeft,
        height: element.scrollHeight,
        width: element.scrollWidth
      }
    };
  }

  /**
   * Apply styles without triggering reflow
   * @param {HTMLElement} element - Element to style
   * @param {Object} styles - Styles to apply
   */
  applyStyles(element, styles) {
    // Batch style changes
    requestAnimationFrame(() => {
      Object.assign(element.style, styles);
    });
  }

  /**
   * Move element with transform (hardware accelerated)
   * @param {HTMLElement} element - Element to move
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  moveElement(element, x, y) {
    element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    element.style.willChange = 'transform';
  }

  /**
   * Hide element with visibility (keeps layout)
   * @param {HTMLElement} element - Element to hide
   */
  hide(element) {
    element.style.visibility = 'hidden';
  }

  /**
   * Show element
   * @param {HTMLElement} element - Element to show
   */
  show(element) {
    element.style.visibility = 'visible';
  }

  /**
   * Remove element with animation
   * @param {HTMLElement} element - Element to remove
   * @param {number} duration - Animation duration in ms
   */
  async removeWithAnimation(element, duration = 300) {
    element.style.transition = `opacity ${duration}ms ease`;
    element.style.opacity = '0';

    await new Promise(resolve => setTimeout(resolve, duration));
    element.remove();
  }

  /**
   * Check if element is in viewport
   * @param {HTMLElement} element - Element to check
   * @returns {boolean}
   */
  isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );
  }

  /**
   * Cleanup pending updates
   */
  cleanup() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.pendingUpdates.forEach(timeoutId => clearTimeout(timeoutId));
    this.pendingUpdates.clear();
    this.batchQueue = [];
  }
}

// Create singleton instance
const domOptimizer = new DOMOptimizer();

// Export
export default domOptimizer;
export { DOMOptimizer };

// Make available globally
if (typeof window !== 'undefined') {
  window.DOMOptimizer = domOptimizer;
}

