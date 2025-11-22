/**
 * Main Application Entry Point
 * Integrates all new features into the UI
 */

// Voice Features Only
import TTSService from './services/TTSService.js';
import STTService from './services/STTService.js';

import TTSComponent from './components/TTSComponent.js';
import STTComponent from './components/STTComponent.js';

// Disabled Features
// import TranslationMemoryService from './services/TranslationMemoryService.js';
// import GlossaryService from './services/GlossaryService.js';
// import KeyboardShortcutService from './services/KeyboardShortcutService.js';
// import FileProcessorService from './services/FileProcessorService.js';
// import APIKeyManager from './services/APIKeyManager.js';
// import TranslationMemoryComponent from './components/TranslationMemoryComponent.js';
// import GlossaryComponent from './components/GlossaryComponent.js';

/**
 * Enhanced LVTranslator Application
 */
class EnhancedLVTranslator {
  constructor() {
    this.services = {};
    this.components = {};
    
    this.initServices();
    this.initComponents();
    this.initUI();
    this.attachEventListeners();
    this.syncInitialLanguages();
    
    console.log('[App] Enhanced LVTranslator initialized with all features');
  }

  /**
   * Initialize all services
   */
  initServices() {
    try {
      // TTS Service
      if (TTSService.isSupported()) {
        this.services.tts = new TTSService();
        this.services.tts.init();
        console.log('[App] TTS Service initialized');
      } else {
        console.warn('[App] TTS not supported');
      }

      // STT Service
      if (STTService.isSupported()) {
        this.services.stt = new STTService();
        // STTService initializes in constructor, no need to call init()
        console.log('[App] STT Service initialized');
      } else {
        console.warn('[App] STT not supported');
      }

      // Translation Memory - DISABLED
      // this.services.memory = new TranslationMemoryService(500);
      // console.log('[App] Translation Memory initialized');

      // Glossary - DISABLED
      // this.services.glossary = new GlossaryService();
      // console.log('[App] Glossary initialized');

      // Keyboard Shortcuts - DISABLED
      // this.services.shortcuts = new KeyboardShortcutService();
      // console.log('[App] Keyboard Shortcuts initialized');

      // File Processor - DISABLED
      // this.services.fileProcessor = new FileProcessorService();
      // console.log('[App] File Processor initialized');

      // API Key Manager - DISABLED
      // this.services.apiKeyManager = new APIKeyManager();
      // console.log('[App] API Key Manager initialized');

    } catch (error) {
      console.error('[App] Error initializing services:', error);
    }
  }

  /**
   * Initialize all UI components
   */
  initComponents() {
    try {
      const outputElement = document.getElementById('outputText');
      const inputElement = document.getElementById('inputText');
      
      if (!outputElement || !inputElement) {
        console.error('[App] Required elements not found');
        return;
      }

      // TTS Component
      if (this.services.tts && outputElement) {
        const ttsContainer = document.createElement('div');
        ttsContainer.id = 'tts-controls';
        ttsContainer.className = 'feature-controls';
        
        // Insert after output element
        outputElement.parentElement.appendChild(ttsContainer);
        
        this.components.tts = new TTSComponent(
          this.services.tts,
          ttsContainer,
          outputElement
        );
        console.log('[App] TTS Component initialized');
      }

      // STT Component
      if (this.services.stt && inputElement) {
        const sttContainer = document.createElement('div');
        sttContainer.id = 'stt-controls';
        sttContainer.className = 'feature-controls';
        
        // Insert before input element
        inputElement.parentElement.insertBefore(sttContainer, inputElement);
        
        this.components.stt = new STTComponent(
          this.services.stt,
          sttContainer,
          inputElement
        );
        console.log('[App] STT Component initialized');
      }

      // Translation Memory Component - DISABLED
      // if (this.services.memory) {
      //   const memoryContainer = document.createElement('div');
      //   memoryContainer.id = 'memory-panel';
      //   memoryContainer.className = 'side-panel';
      //   document.body.appendChild(memoryContainer);
      //   
      //   this.components.memory = new TranslationMemoryComponent(
      //     this.services.memory,
      //     memoryContainer,
      //     inputElement,
      //     outputElement
      //   );
      //   console.log('[App] Translation Memory Component initialized');
      // }

      // Glossary Component - DISABLED
      // if (this.services.glossary) {
      //   const glossaryContainer = document.createElement('div');
      //   glossaryContainer.id = 'glossary-panel';
      //   glossaryContainer.className = 'side-panel';
      //   document.body.appendChild(glossaryContainer);
      //   
      //   this.components.glossary = new GlossaryComponent(
      //     this.services.glossary,
      //     glossaryContainer,
      //     inputElement,
      //     outputElement
      //   );
      //   console.log('[App] Glossary Component initialized');
      // }

    } catch (error) {
      console.error('[App] Error initializing components:', error);
    }
  }

  /**
   * Initialize additional UI enhancements
   */
  initUI() {
    // Add feature toggle buttons to header - DISABLED
    // this.addFeatureButtons();
    
    // Initialize keyboard shortcuts help - DISABLED
    // this.initKeyboardShortcutsHelp();
    
    // Add PWA install prompt - DISABLED
    // this.initPWAInstall();
    
    console.log('[App] UI initialized (Voice features only)');
  }

  /**
   * Add feature toggle buttons
   */
  addFeatureButtons() {
    // Find header - it's a div with class header
    const header = document.querySelector('.header');
    if (!header) {
      console.warn('[App] Header not found for feature buttons');
      return;
    }

    const featureBar = document.createElement('div');
    featureBar.className = 'feature-bar';
    featureBar.innerHTML = `
      <button id="toggle-memory-btn" class="feature-btn" title="Translation Memory (Ctrl+M)">
        <span>💾</span> Memory
      </button>
      <button id="toggle-glossary-btn" class="feature-btn" title="Glossary (Ctrl+G)">
        <span>📚</span> Glossary
      </button>
      <button id="toggle-shortcuts-btn" class="feature-btn" title="Keyboard Shortcuts (Ctrl+/)">
        <span>⌨️</span> Shortcuts
      </button>
      <button id="api-key-btn" class="feature-btn" title="API Key Settings">
        <span>🔑</span> API Key
      </button>
    `;

    header.appendChild(featureBar);

    // Attach event listeners
    document.getElementById('toggle-memory-btn')?.addEventListener('click', () => {
      document.getElementById('memory-panel')?.classList.toggle('open');
    });

    document.getElementById('toggle-glossary-btn')?.addEventListener('click', () => {
      document.getElementById('glossary-panel')?.classList.toggle('open');
    });

    document.getElementById('toggle-shortcuts-btn')?.addEventListener('click', () => {
      this.showKeyboardShortcuts();
    });

    document.getElementById('api-key-btn')?.addEventListener('click', () => {
      this.showAPIKeyDialog();
    });
  }

  /**
   * Initialize keyboard shortcuts help
   */
  initKeyboardShortcutsHelp() {
    if (!this.services.shortcuts) return;

    // Keyboard shortcuts are already initialized and working
    // The service handles them internally via addEventListener
    console.log('[App] Keyboard shortcuts ready (handled by service)');
    
    // Optional: Add custom handlers if needed
    document.addEventListener('keydown', (e) => {
      // Ctrl+M for Memory panel
      if (e.ctrlKey && e.key === 'm') {
        e.preventDefault();
        document.getElementById('memory-panel')?.classList.toggle('open');
      }
      // Ctrl+G for Glossary panel
      if (e.ctrlKey && e.key === 'g') {
        e.preventDefault();
        document.getElementById('glossary-panel')?.classList.toggle('open');
      }
      // Ctrl+/ for help
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        this.showKeyboardShortcuts();
      }
    });
  }

  /**
   * Show keyboard shortcuts dialog
   */
  showKeyboardShortcuts() {
    const dialog = document.createElement('div');
    dialog.className = 'shortcuts-dialog modal';
    dialog.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>⌨️ Keyboard Shortcuts</h2>
          <button class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <table class="shortcuts-table">
            <tr><td><kbd>Ctrl</kbd> + <kbd>Enter</kbd></td><td>Translate</td></tr>
            <tr><td><kbd>Ctrl</kbd> + <kbd>K</kbd></td><td>Clear all</td></tr>
            <tr><td><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>C</kbd></td><td>Copy translation</td></tr>
            <tr><td><kbd>Ctrl</kbd> + <kbd>M</kbd></td><td>Toggle Memory</td></tr>
            <tr><td><kbd>Ctrl</kbd> + <kbd>G</kbd></td><td>Toggle Glossary</td></tr>
            <tr><td><kbd>Ctrl</kbd> + <kbd>S</kbd></td><td>Save to memory</td></tr>
            <tr><td><kbd>Alt</kbd> + <kbd>P</kbd></td><td>Play TTS</td></tr>
            <tr><td><kbd>Alt</kbd> + <kbd>R</kbd></td><td>Start STT</td></tr>
            <tr><td><kbd>Ctrl</kbd> + <kbd>/</kbd></td><td>Show this help</td></tr>
            <tr><td><kbd>Esc</kbd></td><td>Close dialogs</td></tr>
          </table>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);
    dialog.style.display = 'flex';

    dialog.querySelector('.close-btn').addEventListener('click', () => {
      dialog.remove();
    });

    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.remove();
    });
  }

  /**
   * Show API Key dialog
   */
  showAPIKeyDialog() {
    const hasKey = this.services.apiKeyManager?.hasPersonalKey();
    const usage = this.services.apiKeyManager?.getUsageSummary();

    const dialog = document.createElement('div');
    dialog.className = 'api-key-dialog modal';
    dialog.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>🔑 API Key Management</h2>
          <button class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <p>Use your personal Gemini API key for unlimited translations.</p>
          
          <div class="form-group">
            <label>API Key:</label>
            <input type="password" id="api-key-input" placeholder="AIza..." 
                   value="${hasKey ? '••••••••••••••••••••' : ''}">
            <button id="api-key-save-btn" class="primary-btn">Save</button>
            ${hasKey ? '<button id="api-key-clear-btn" class="danger-btn">Clear</button>' : ''}
          </div>

          ${hasKey ? `
            <div class="usage-stats">
              <h3>Usage Statistics</h3>
              <p>Today: ${usage.today.calls} calls, ${usage.today.tokens} tokens</p>
              <p>This Month: ${usage.thisMonth.calls} calls, ${usage.thisMonth.tokens} tokens</p>
              <p>Total: ${usage.total.calls} calls, ${usage.total.tokens} tokens</p>
            </div>
          ` : ''}

          <div class="info-box">
            <p>Get your free API key: <a href="https://ai.google.dev/tutorials/setup" target="_blank">Google AI Studio</a></p>
            <p><small>Your key is encrypted and stored locally. Never shared.</small></p>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);
    dialog.style.display = 'flex';

    // Event listeners
    dialog.querySelector('.close-btn').addEventListener('click', () => dialog.remove());
    dialog.querySelector('#api-key-save-btn')?.addEventListener('click', async () => {
      const input = dialog.querySelector('#api-key-input');
      const key = input.value.trim();
      
      if (key && !key.includes('•')) {
        try {
          await this.services.apiKeyManager.setPersonalKey(key);
          alert('✅ API Key saved successfully!');
          dialog.remove();
        } catch (error) {
          alert('❌ Invalid API key: ' + error.message);
        }
      }
    });

    dialog.querySelector('#api-key-clear-btn')?.addEventListener('click', () => {
      if (confirm('Clear your personal API key?')) {
        this.services.apiKeyManager.clearAPIKey();
        alert('API key cleared');
        dialog.remove();
      }
    });

    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.remove();
    });
  }

  /**
   * Initialize PWA install prompt
   */
  initPWAInstall() {
    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;

      // Show install button
      const installBtn = document.createElement('button');
      installBtn.className = 'pwa-install-btn';
      installBtn.innerHTML = '📱 Install App';
      installBtn.onclick = async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log(`User response: ${outcome}`);
          deferredPrompt = null;
          installBtn.remove();
        }
      };

      document.querySelector('.feature-bar')?.appendChild(installBtn);
    });
  }

  /**
   * Sync initial languages on page load
   */
  syncInitialLanguages() {
    const sourceLangSelector = document.getElementById('sourceLangSelector');
    if (sourceLangSelector && this.components.stt) {
      const currentLang = sourceLangSelector.value; // e.g., 'vi', 'lo', 'en'
      this.components.stt.setLanguageFromCode(currentLang);
      console.log(`[App] Initial STT language synced to: ${currentLang}`);
    }
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Auto-sync Input Language with Voice Input Language
    const sourceLangSelector = document.getElementById('sourceLangSelector');
    if (sourceLangSelector && this.components.stt) {
      sourceLangSelector.addEventListener('change', (e) => {
        const selectedLang = e.target.value; // e.g., 'vi', 'lo', 'en'
        this.components.stt.setLanguageFromCode(selectedLang);
        console.log(`[App] Auto-synced STT language to: ${selectedLang}`);
      });
    }

    // Listen for translations to save to memory automatically
    document.addEventListener('translation-complete', (e) => {
      const { source, target, sourceLang, targetLang } = e.detail;
      
      // Auto-save to memory if enabled
      const autoSave = localStorage.getItem('autoSaveMemory') === 'true';
      if (autoSave && source && target) {
        this.services.memory?.addItem(source, target, 'Auto');
      }
    });

    // Listen for glossary term highlighting
    document.addEventListener('input-change', (e) => {
      const text = e.detail.text;
      const terms = this.services.glossary?.findTermsInText(text);
      
      if (terms && terms.length > 0) {
        console.log(`Found ${terms.length} glossary terms in text`);
        // Highlight terms in UI
      }
    });
  }
}

// Initialize enhanced app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.enhancedApp = new EnhancedLVTranslator();
  });
} else {
  window.enhancedApp = new EnhancedLVTranslator();
}

export default EnhancedLVTranslator;

