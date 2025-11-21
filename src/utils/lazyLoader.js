/**
 * Lazy Loader Utility
 * Dynamically loads external libraries on demand to improve initial page load time
 */

class LazyLoader {
  constructor() {
    this.loadedLibraries = new Set();
    this.loadingPromises = new Map();
    
    // Library URLs configuration
    this.libraryUrls = {
      'dompurify': 'https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.6/purify.min.js',
      'mammoth': 'https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js',
      'pdfjs': 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
      'pdfjs-worker': 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
      'tesseract': 'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js',
      'lz-string': 'https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.5.0/lz-string.min.js'
    };
  }

  /**
   * Load a JavaScript library
   * @param {string} libraryName - Name of library to load
   * @param {Object} options - Loading options
   * @returns {Promise} - Resolves when library is loaded
   */
  async loadLibrary(libraryName, options = {}) {
    const {
      url = this.libraryUrls[libraryName],
      checkGlobal = null,
      timeout = 30000,
      retries = 3
    } = options;

    // Check if already loaded
    if (this.loadedLibraries.has(libraryName)) {
      return Promise.resolve();
    }

    // Check if already loading
    if (this.loadingPromises.has(libraryName)) {
      return this.loadingPromises.get(libraryName);
    }

    // Validate URL
    if (!url) {
      throw new Error(`No URL configured for library: ${libraryName}`);
    }

    // Create loading promise
    const loadPromise = this._loadScriptWithRetry(url, libraryName, checkGlobal, timeout, retries);
    this.loadingPromises.set(libraryName, loadPromise);

    try {
      await loadPromise;
      this.loadedLibraries.add(libraryName);
      this.loadingPromises.delete(libraryName);
      console.log(`✓ Loaded library: ${libraryName}`);
      return Promise.resolve();
    } catch (error) {
      this.loadingPromises.delete(libraryName);
      console.error(`✗ Failed to load library: ${libraryName}`, error);
      throw error;
    }
  }

  /**
   * Load script with retry logic
   * @private
   */
  async _loadScriptWithRetry(url, libraryName, checkGlobal, timeout, retries) {
    let lastError;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this._loadScript(url, libraryName, checkGlobal, timeout);
        return;
      } catch (error) {
        lastError = error;
        console.warn(`Load attempt ${attempt}/${retries} failed for ${libraryName}:`, error.message);
        
        if (attempt < retries) {
          // Wait before retry (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await this._delay(delay);
        }
      }
    }

    throw new Error(`Failed to load ${libraryName} after ${retries} attempts: ${lastError.message}`);
  }

  /**
   * Load a single script
   * @private
   */
  _loadScript(url, libraryName, checkGlobal, timeout) {
    return new Promise((resolve, reject) => {
      // Check if global is already available
      if (checkGlobal && window[checkGlobal]) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.crossOrigin = 'anonymous';

      // Timeout handling
      const timeoutId = setTimeout(() => {
        script.remove();
        reject(new Error(`Timeout loading ${libraryName}`));
      }, timeout);

      script.onload = () => {
        clearTimeout(timeoutId);
        
        // Double-check global if specified
        if (checkGlobal && !window[checkGlobal]) {
          reject(new Error(`Library ${libraryName} loaded but global ${checkGlobal} not found`));
          return;
        }
        
        resolve();
      };

      script.onerror = () => {
        clearTimeout(timeoutId);
        script.remove();
        reject(new Error(`Failed to load script: ${url}`));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Load library only when needed with callback
   * @param {string} libraryName - Library name
   * @param {Function} callback - Function to execute after loading
   * @returns {Promise} - Promise that resolves with callback result
   */
  async loadOnDemand(libraryName, callback) {
    await this.loadLibrary(libraryName);
    return callback();
  }

  /**
   * Preload libraries in the background
   * @param {Array<string>} libraryNames - Array of library names to preload
   */
  preload(libraryNames) {
    libraryNames.forEach(name => {
      // Load in background, don't wait for result
      this.loadLibrary(name).catch(error => {
        console.warn(`Preload failed for ${name}:`, error);
      });
    });
  }

  /**
   * Load multiple libraries in parallel
   * @param {Array<string>} libraryNames - Array of library names
   * @returns {Promise<Array>>} - Promise that resolves when all are loaded
   */
  async loadMultiple(libraryNames) {
    return Promise.all(libraryNames.map(name => this.loadLibrary(name)));
  }

  /**
   * Check if library is loaded
   * @param {string} libraryName - Library name
   * @returns {boolean} - Whether library is loaded
   */
  isLoaded(libraryName) {
    return this.loadedLibraries.has(libraryName);
  }

  /**
   * Check if library is currently loading
   * @param {string} libraryName - Library name
   * @returns {boolean} - Whether library is loading
   */
  isLoading(libraryName) {
    return this.loadingPromises.has(libraryName);
  }

  /**
   * Unload a library (remove from loaded set)
   * Note: This doesn't remove the script tag or global variables
   * @param {string} libraryName - Library name
   */
  unload(libraryName) {
    this.loadedLibraries.delete(libraryName);
  }

  /**
   * Get loading progress
   * @returns {Object} - Loading statistics
   */
  getStats() {
    return {
      loaded: Array.from(this.loadedLibraries),
      loading: Array.from(this.loadingPromises.keys()),
      available: Object.keys(this.libraryUrls)
    };
  }

  /**
   * Delay helper
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Load CSS file
   * @param {string} url - CSS file URL
   * @param {string} id - Optional ID for the link element
   * @returns {Promise} - Resolves when CSS is loaded
   */
  async loadCSS(url, id = null) {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (id && document.getElementById(id)) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      if (id) link.id = id;

      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load CSS: ${url}`));

      document.head.appendChild(link);
    });
  }

  /**
   * Load font
   * @param {string} fontFamily - Font family name
   * @param {string} url - Font file URL
   * @param {Object} options - Font loading options
   * @returns {Promise} - Resolves when font is loaded
   */
  async loadFont(fontFamily, url, options = {}) {
    const {
      weight = 'normal',
      style = 'normal',
      display = 'swap'
    } = options;

    const fontFace = new FontFace(fontFamily, `url(${url})`, {
      weight,
      style,
      display
    });

    try {
      const loadedFace = await fontFace.load();
      document.fonts.add(loadedFace);
      return loadedFace;
    } catch (error) {
      throw new Error(`Failed to load font ${fontFamily}: ${error.message}`);
    }
  }

  /**
   * Configure or update library URL
   * @param {string} libraryName - Library name
   * @param {string} url - Library URL
   */
  setLibraryUrl(libraryName, url) {
    this.libraryUrls[libraryName] = url;
  }

  /**
   * Clear all loaded libraries (for testing)
   */
  reset() {
    this.loadedLibraries.clear();
    this.loadingPromises.clear();
  }
}

// Create singleton instance
const lazyLoaderInstance = new LazyLoader();

// Export singleton
export default lazyLoaderInstance;

// Also make available globally for backward compatibility
if (typeof window !== 'undefined') {
  window.LazyLoader = lazyLoaderInstance;
}

