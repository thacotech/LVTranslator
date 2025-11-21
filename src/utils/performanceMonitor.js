/**
 * Performance Monitor Utility
 * Tracks and reports performance metrics
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.marks = new Map();
    this.observers = new Set();
    this.thresholds = {
      pageLoad: 2000, // 2 seconds
      translation: 3000, // 3 seconds
      fileProcessing: 5000, // 5 seconds per MB
      apiCall: 1000 // 1 second
    };
    this.setupObservers();
  }

  /**
   * Setup performance observers
   */
  setupObservers() {
    if (!('PerformanceObserver' in window)) {
      return;
    }

    // Observe navigation timing
    try {
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordNavigationTiming(entry);
        }
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.add(navigationObserver);
    } catch (e) {
      console.warn('Navigation timing observer not supported');
    }

    // Observe resource timing
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordResourceTiming(entry);
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.add(resourceObserver);
    } catch (e) {
      console.warn('Resource timing observer not supported');
    }

    // Observe long tasks
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordLongTask(entry);
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.add(longTaskObserver);
    } catch (e) {
      console.warn('Long task observer not supported');
    }
  }

  /**
   * Start timing a specific operation
   * @param {string} name - Operation name
   */
  startTiming(name) {
    const mark = `${name}-start`;
    if ('performance' in window && 'mark' in performance) {
      performance.mark(mark);
    } else {
      this.marks.set(mark, Date.now());
    }
  }

  /**
   * End timing a specific operation
   * @param {string} name - Operation name
   * @returns {number} - Duration in milliseconds
   */
  endTiming(name) {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;

    let duration;

    if ('performance' in window && 'mark' in performance) {
      performance.mark(endMark);

      try {
        const measure = performance.measure(name, startMark, endMark);
        duration = measure.duration;
      } catch (e) {
        console.warn('Could not measure performance:', e);
        return 0;
      }

      // Cleanup marks
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(name);
    } else {
      const startTime = this.marks.get(startMark);
      if (!startTime) return 0;
      duration = Date.now() - startTime;
      this.marks.delete(startMark);
    }

    // Record metric
    this.recordMetric(name, duration);

    // Check threshold
    this.checkThreshold(name, duration);

    return duration;
  }

  /**
   * Record a metric
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   * @param {Object} metadata - Additional metadata
   */
  recordMetric(name, value, metadata = {}) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    this.metrics.get(name).push({
      value,
      timestamp: Date.now(),
      ...metadata
    });

    // Keep only last 100 entries per metric
    const entries = this.metrics.get(name);
    if (entries.length > 100) {
      entries.shift();
    }
  }

  /**
   * Get metric statistics
   * @param {string} name - Metric name
   * @returns {Object} - Statistics (avg, min, max, count)
   */
  getMetricStats(name) {
    const entries = this.metrics.get(name);
    if (!entries || entries.length === 0) {
      return null;
    }

    const values = entries.map(e => e.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      count: values.length,
      avg: Math.round(avg),
      min: Math.round(min),
      max: Math.round(max),
      total: Math.round(sum),
      recent: values.slice(-10) // Last 10 values
    };
  }

  /**
   * Get all metrics
   * @returns {Object} - All metrics with statistics
   */
  getAllMetrics() {
    const result = {};
    for (const [name] of this.metrics) {
      result[name] = this.getMetricStats(name);
    }
    return result;
  }

  /**
   * Record navigation timing
   * @private
   */
  recordNavigationTiming(entry) {
    const timing = {
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      tcp: entry.connectEnd - entry.connectStart,
      request: entry.responseStart - entry.requestStart,
      response: entry.responseEnd - entry.responseStart,
      dom: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      load: entry.loadEventEnd - entry.loadEventStart,
      total: entry.loadEventEnd - entry.fetchStart
    };

    for (const [key, value] of Object.entries(timing)) {
      this.recordMetric(`navigation.${key}`, value);
    }

    // Log if exceeds threshold
    if (timing.total > this.thresholds.pageLoad) {
      console.warn(`Page load time (${timing.total}ms) exceeds threshold (${this.thresholds.pageLoad}ms)`);
    }
  }

  /**
   * Record resource timing
   * @private
   */
  recordResourceTiming(entry) {
    const duration = entry.responseEnd - entry.startTime;
    const resourceType = entry.initiatorType;

    this.recordMetric(`resource.${resourceType}`, duration, {
      name: entry.name,
      size: entry.transferSize || 0
    });
  }

  /**
   * Record long task
   * @private
   */
  recordLongTask(entry) {
    const duration = entry.duration;
    this.recordMetric('longtask', duration, {
      name: entry.name,
      startTime: entry.startTime
    });

    if (duration > 50) {
      console.warn(`Long task detected: ${duration.toFixed(2)}ms at ${entry.startTime.toFixed(2)}ms`);
    }
  }

  /**
   * Check if metric exceeds threshold
   * @private
   */
  checkThreshold(name, value) {
    const threshold = this.thresholds[name];
    if (threshold && value > threshold) {
      console.warn(`${name} duration (${value}ms) exceeds threshold (${threshold}ms)`);
    }
  }

  /**
   * Get memory usage (if available)
   * @returns {Object|null} - Memory usage info
   */
  getMemoryUsage() {
    if ('memory' in performance) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        usage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100).toFixed(2) + '%'
      };
    }
    return null;
  }

  /**
   * Get connection info (if available)
   * @returns {Object|null} - Connection info
   */
  getConnectionInfo() {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn) return null;

    return {
      effectiveType: conn.effectiveType, // '4g', '3g', etc.
      downlink: conn.downlink, // Mbps
      rtt: conn.rtt, // Round trip time in ms
      saveData: conn.saveData // Data saver enabled
    };
  }

  /**
   * Check if connection is slow
   * @returns {boolean}
   */
  isSlowConnection() {
    const conn = this.getConnectionInfo();
    if (!conn) return false;

    return (
      conn.effectiveType === 'slow-2g' ||
      conn.effectiveType === '2g' ||
      conn.saveData === true ||
      conn.downlink < 1
    );
  }

  /**
   * Get Web Vitals metrics
   * @returns {Object} - Web Vitals
   */
  getWebVitals() {
    const vitals = {};

    // FCP - First Contentful Paint
    const fcp = performance.getEntriesByName('first-contentful-paint')[0];
    if (fcp) {
      vitals.fcp = Math.round(fcp.startTime);
    }

    // LCP - Largest Contentful Paint
    const lcp = performance.getEntriesByType('largest-contentful-paint').pop();
    if (lcp) {
      vitals.lcp = Math.round(lcp.renderTime || lcp.loadTime);
    }

    // FID - First Input Delay (requires user interaction)
    const fid = performance.getEntriesByType('first-input').pop();
    if (fid) {
      vitals.fid = Math.round(fid.processingStart - fid.startTime);
    }

    // CLS - Cumulative Layout Shift
    const cls = performance.getEntriesByType('layout-shift')
      .filter(entry => !entry.hadRecentInput)
      .reduce((sum, entry) => sum + entry.value, 0);
    if (cls) {
      vitals.cls = cls.toFixed(3);
    }

    // TTFB - Time to First Byte
    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) {
      vitals.ttfb = Math.round(navigation.responseStart - navigation.requestStart);
    }

    return vitals;
  }

  /**
   * Export all performance data
   * @returns {Object} - Complete performance report
   */
  exportReport() {
    return {
      metrics: this.getAllMetrics(),
      memory: this.getMemoryUsage(),
      connection: this.getConnectionInfo(),
      webVitals: this.getWebVitals(),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  }

  /**
   * Log performance report to console
   */
  logReport() {
    console.group('📊 Performance Report');
    console.table(this.getAllMetrics());
    console.log('💾 Memory:', this.getMemoryUsage());
    console.log('📡 Connection:', this.getConnectionInfo());
    console.log('⚡ Web Vitals:', this.getWebVitals());
    console.groupEnd();
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics.clear();
    this.marks.clear();
  }

  /**
   * Cleanup observers
   */
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.clearMetrics();
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Export
export default performanceMonitor;
export { PerformanceMonitor };

// Make available globally
if (typeof window !== 'undefined') {
  window.PerformanceMonitor = performanceMonitor;
}

