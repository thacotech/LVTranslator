/**
 * PWA Installation Handler
 * Manages PWA installation prompt and service worker
 * Requirements: 5.3, 5.9
 */

class PWAInstaller {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.serviceWorkerRegistration = null;
    
    this.init();
  }

  /**
   * Initialize PWA installer
   */
  init() {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
      this.isInstalled = true;
      console.log('[PWA] App is installed');
    }

    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('[PWA] Install prompt available');
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      this.isInstalled = true;
      this.hideInstallButton();
      this.deferredPrompt = null;
    });

    // Register service worker
    this.registerServiceWorker();

    // Listen for service worker updates
    this.listenForUpdates();
  }

  /**
   * Register service worker
   */
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('[PWA] Service workers not supported');
      return;
    }

    try {
      this.serviceWorkerRegistration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('[PWA] Service worker registered:', this.serviceWorkerRegistration.scope);

      // Check for updates
      this.serviceWorkerRegistration.addEventListener('updatefound', () => {
        console.log('[PWA] Service worker update found');
        const newWorker = this.serviceWorkerRegistration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[PWA] New service worker available');
            this.showUpdatePrompt();
          }
        });
      });

    } catch (error) {
      console.error('[PWA] Service worker registration failed:', error);
    }
  }

  /**
   * Show install button
   */
  showInstallButton() {
    // Dispatch custom event
    const event = new CustomEvent('pwa-installable', {
      detail: { canInstall: true }
    });
    window.dispatchEvent(event);

    // Create install button if container exists
    const container = document.getElementById('pwaInstallContainer');
    if (container && !this.isInstalled) {
      container.innerHTML = `
        <button class="pwa-install-btn" id="pwaInstallBtn">
          <span class="icon">📲</span>
          <span class="text">Install App</span>
        </button>
      `;

      document.getElementById('pwaInstallBtn').addEventListener('click', () => {
        this.promptInstall();
      });

      container.style.display = 'block';
    }
  }

  /**
   * Hide install button
   */
  hideInstallButton() {
    const container = document.getElementById('pwaInstallContainer');
    if (container) {
      container.style.display = 'none';
    }
  }

  /**
   * Prompt user to install PWA
   */
  async promptInstall() {
    if (!this.deferredPrompt) {
      console.warn('[PWA] No install prompt available');
      return;
    }

    // Show the install prompt
    this.deferredPrompt.prompt();

    // Wait for user response
    const { outcome } = await this.deferredPrompt.userChoice;
    console.log('[PWA] User response:', outcome);

    if (outcome === 'accepted') {
      console.log('[PWA] User accepted installation');
    } else {
      console.log('[PWA] User dismissed installation');
    }

    // Clear the deferred prompt
    this.deferredPrompt = null;
  }

  /**
   * Show update prompt
   */
  showUpdatePrompt() {
    const updateContainer = document.getElementById('pwaUpdateContainer');
    if (updateContainer) {
      updateContainer.innerHTML = `
        <div class="pwa-update-banner">
          <span class="icon">🔄</span>
          <span class="text">New version available!</span>
          <button class="pwa-update-btn" id="pwaUpdateBtn">Update</button>
        </div>
      `;

      document.getElementById('pwaUpdateBtn').addEventListener('click', () => {
        this.applyUpdate();
      });

      updateContainer.style.display = 'block';
    }
  }

  /**
   * Apply service worker update
   */
  applyUpdate() {
    if (!this.serviceWorkerRegistration || !this.serviceWorkerRegistration.waiting) {
      return;
    }

    // Tell the service worker to skip waiting
    this.serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Reload the page when the new service worker activates
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }

  /**
   * Listen for online/offline status
   */
  listenForUpdates() {
    window.addEventListener('online', () => {
      console.log('[PWA] Back online');
      this.showOnlineIndicator();
    });

    window.addEventListener('offline', () => {
      console.log('[PWA] Offline');
      this.showOfflineIndicator();
    });

    // Set initial status
    if (!navigator.onLine) {
      this.showOfflineIndicator();
    }
  }

  /**
   * Show offline indicator
   */
  showOfflineIndicator() {
    const indicator = document.getElementById('connectionIndicator');
    if (indicator) {
      indicator.innerHTML = `
        <div class="connection-offline">
          <span class="icon">📡</span>
          <span>Offline</span>
        </div>
      `;
      indicator.style.display = 'block';
    }

    // Dispatch event
    window.dispatchEvent(new CustomEvent('connection-status', {
      detail: { online: false }
    }));
  }

  /**
   * Show online indicator
   */
  showOnlineIndicator() {
    const indicator = document.getElementById('connectionIndicator');
    if (indicator) {
      indicator.innerHTML = `
        <div class="connection-online">
          <span class="icon">✓</span>
          <span>Back online</span>
        </div>
      `;
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        indicator.style.display = 'none';
      }, 3000);
    }

    // Dispatch event
    window.dispatchEvent(new CustomEvent('connection-status', {
      detail: { online: true }
    }));
  }

  /**
   * Check if PWA is installable
   */
  isInstallable() {
    return this.deferredPrompt !== null && !this.isInstalled;
  }

  /**
   * Check if PWA is installed
   */
  isPWAInstalled() {
    return this.isInstalled;
  }

  /**
   * Get service worker registration
   */
  getServiceWorkerRegistration() {
    return this.serviceWorkerRegistration;
  }
}

export default PWAInstaller;

