/**
 * Keyboard Shortcut Service
 * Manages keyboard shortcuts for quick actions
 * Requirements: 6.1-6.10
 */

class KeyboardShortcutService {
  constructor() {
    this.shortcuts = this.getDefaultShortcuts();
    this.customShortcuts = {};
    this.enabled = true;
    
    this.loadCustomShortcuts();
    this.init();
  }

  /**
   * Get default shortcuts
   */
  getDefaultShortcuts() {
    return {
      'translate': { key: 'Enter', ctrl: true, alt: false, shift: false, action: 'translate', description: 'Translate text' },
      'clear': { key: 'k', ctrl: true, alt: false, shift: false, action: 'clear', description: 'Clear all fields' },
      'toggleHistory': { key: 'h', ctrl: true, alt: false, shift: false, action: 'toggleHistory', description: 'Toggle history panel' },
      'copy': { key: 'c', ctrl: true, alt: false, shift: true, action: 'copyTranslation', description: 'Copy translation' },
      'saveToMemory': { key: 's', ctrl: true, alt: false, shift: false, action: 'saveToMemory', description: 'Save to memory' },
      'showHelp': { key: '/', ctrl: true, alt: false, shift: false, action: 'showHelp', description: 'Show keyboard shortcuts' },
      'focusInput': { key: 'i', ctrl: true, alt: false, shift: false, action: 'focusInput', description: 'Focus input field' },
      'focusOutput': { key: 'o', ctrl: true, alt: false, shift: false, action: 'focusOutput', description: 'Focus output field' },
      'swapLanguages': { key: 'l', ctrl: true, alt: false, shift: false, action: 'swapLanguages', description: 'Swap languages' },
      'toggleDarkMode': { key: 'd', ctrl: true, alt: false, shift: false, action: 'toggleDarkMode', description: 'Toggle dark mode' }
    };
  }

  /**
   * Initialize keyboard shortcuts
   */
  init() {
    document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    console.log('[Shortcuts] Keyboard shortcuts initialized');
  }

  /**
   * Handle key press
   */
  handleKeyPress(event) {
    if (!this.enabled) return;

    // Don't trigger shortcuts in input fields (except for specific ones)
    const isInputField = event.target.tagName === 'INPUT' || 
                         event.target.tagName === 'TEXTAREA' ||
                         event.target.isContentEditable;

    // Build key combo string
    const combo = this.getKeyCombo(event);

    // Find matching shortcut
    for (const [id, shortcut] of Object.entries(this.shortcuts)) {
      const customShortcut = this.customShortcuts[id];
      const activeShortcut = customShortcut || shortcut;

      if (this.matchesShortcut(event, activeShortcut)) {
        // Special handling for input field shortcuts
        if (activeShortcut.action === 'translate' || 
            activeShortcut.action === 'clear' ||
            activeShortcut.action === 'saveToMemory') {
          // Allow these in input fields
        } else if (isInputField && activeShortcut.action !== 'focusInput' && activeShortcut.action !== 'focusOutput') {
          // Skip other shortcuts in input fields
          continue;
        }

        event.preventDefault();
        this.executeAction(activeShortcut.action);
        break;
      }
    }

    // Special case: Esc to close modals
    if (event.key === 'Escape') {
      this.executeAction('closeModal');
    }
  }

  /**
   * Check if event matches shortcut
   */
  matchesShortcut(event, shortcut) {
    return event.key.toLowerCase() === shortcut.key.toLowerCase() &&
           event.ctrlKey === shortcut.ctrl &&
           event.altKey === shortcut.alt &&
           event.shiftKey === shortcut.shift;
  }

  /**
   * Get key combo string
   */
  getKeyCombo(event) {
    const parts = [];
    if (event.ctrlKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    parts.push(event.key.toUpperCase());
    return parts.join('+');
  }

  /**
   * Execute shortcut action
   */
  executeAction(action) {
    console.log('[Shortcuts] Executing action:', action);

    switch (action) {
      case 'translate':
        this.triggerTranslate();
        break;
      
      case 'clear':
        this.clearAllFields();
        break;
      
      case 'toggleHistory':
        this.toggleHistoryPanel();
        break;
      
      case 'copyTranslation':
        this.copyTranslation();
        break;
      
      case 'saveToMemory':
        this.saveToMemory();
        break;
      
      case 'showHelp':
        this.showHelpModal();
        break;
      
      case 'focusInput':
        this.focusField('input');
        break;
      
      case 'focusOutput':
        this.focusField('output');
        break;
      
      case 'swapLanguages':
        this.swapLanguages();
        break;
      
      case 'toggleDarkMode':
        this.toggleDarkMode();
        break;
      
      case 'closeModal':
        this.closeModals();
        break;
    }

    // Dispatch custom event for external handlers
    window.dispatchEvent(new CustomEvent('shortcut-action', {
      detail: { action }
    }));
  }

  /**
   * Trigger translation
   */
  triggerTranslate() {
    const translateBtn = document.getElementById('translateBtn') || 
                        document.querySelector('[data-action="translate"]');
    if (translateBtn) {
      translateBtn.click();
    }
  }

  /**
   * Clear all fields
   */
  clearAllFields() {
    const inputField = document.getElementById('inputText');
    const outputField = document.getElementById('outputText');
    
    if (inputField) inputField.value = '';
    if (outputField) outputField.value = '';
    
    if (inputField) inputField.focus();
  }

  /**
   * Toggle history panel
   */
  toggleHistoryPanel() {
    const historyPanel = document.getElementById('historyPanel') ||
                        document.querySelector('.history-panel');
    
    if (historyPanel) {
      const isVisible = historyPanel.style.display !== 'none';
      historyPanel.style.display = isVisible ? 'none' : 'block';
    }
  }

  /**
   * Copy translation to clipboard
   */
  async copyTranslation() {
    const outputField = document.getElementById('outputText');
    
    if (outputField && outputField.value) {
      try {
        await navigator.clipboard.writeText(outputField.value);
        console.log('[Shortcuts] Translation copied');
        
        // Show toast notification
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { message: 'Translation copied!', type: 'success' }
        }));
      } catch (error) {
        console.error('[Shortcuts] Failed to copy:', error);
      }
    }
  }

  /**
   * Save to memory
   */
  saveToMemory() {
    // Dispatch event for memory component to handle
    window.dispatchEvent(new CustomEvent('save-to-memory'));
  }

  /**
   * Show help modal
   */
  showHelpModal() {
    // Create or show help modal
    let modal = document.getElementById('shortcutsHelpModal');
    
    if (!modal) {
      modal = this.createHelpModal();
      document.body.appendChild(modal);
    }
    
    modal.style.display = 'flex';
  }

  /**
   * Create help modal
   */
  createHelpModal() {
    const modal = document.createElement('div');
    modal.id = 'shortcutsHelpModal';
    modal.className = 'shortcuts-help-modal';
    
    const shortcuts = Object.entries(this.shortcuts).map(([id, shortcut]) => {
      const custom = this.customShortcuts[id];
      const active = custom || shortcut;
      const combo = this.formatKeyCombo(active);
      
      return `
        <div class="shortcut-item">
          <span class="shortcut-combo">${combo}</span>
          <span class="shortcut-desc">${active.description}</span>
        </div>
      `;
    }).join('');
    
    modal.innerHTML = `
      <div class="shortcuts-help-content">
        <div class="shortcuts-help-header">
          <h3>⌨️ Keyboard Shortcuts</h3>
          <button class="close-btn" onclick="document.getElementById('shortcutsHelpModal').style.display='none'">✕</button>
        </div>
        <div class="shortcuts-help-body">
          ${shortcuts}
        </div>
        <div class="shortcuts-help-footer">
          <button class="btn-primary" onclick="document.getElementById('shortcutsHelpModal').style.display='none'">Got it!</button>
        </div>
      </div>
    `;
    
    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
    
    return modal;
  }

  /**
   * Format key combo for display
   */
  formatKeyCombo(shortcut) {
    const parts = [];
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.shift) parts.push('Shift');
    parts.push(shortcut.key.toUpperCase());
    return parts.join(' + ');
  }

  /**
   * Focus field
   */
  focusField(field) {
    const fieldId = field === 'input' ? 'inputText' : 'outputText';
    const element = document.getElementById(fieldId);
    
    if (element) {
      element.focus();
      element.select();
    }
  }

  /**
   * Swap languages
   */
  swapLanguages() {
    const sourceSelector = document.getElementById('sourceLangSelector');
    const targetSelector = document.getElementById('targetLangSelector');
    
    if (sourceSelector && targetSelector) {
      const temp = sourceSelector.value;
      sourceSelector.value = targetSelector.value;
      targetSelector.value = temp;
      
      // Trigger change event
      sourceSelector.dispatchEvent(new Event('change'));
      targetSelector.dispatchEvent(new Event('change'));
    }
  }

  /**
   * Toggle dark mode
   */
  toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    
    // Save preference
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('dark_mode', isDark);
  }

  /**
   * Close all modals
   */
  closeModals() {
    const modals = document.querySelectorAll('.modal, [role="dialog"], .dialog');
    modals.forEach(modal => {
      modal.style.display = 'none';
    });
  }

  /**
   * Set custom shortcut
   */
  setCustomShortcut(id, shortcut) {
    // Validate shortcut
    if (!this.shortcuts[id]) {
      console.error('[Shortcuts] Invalid shortcut ID:', id);
      return false;
    }

    // Check for conflicts
    if (this.hasConflict(shortcut, id)) {
      console.error('[Shortcuts] Shortcut conflict detected');
      return false;
    }

    this.customShortcuts[id] = shortcut;
    this.saveCustomShortcuts();
    
    console.log('[Shortcuts] Custom shortcut set:', id, shortcut);
    return true;
  }

  /**
   * Check for shortcut conflicts
   */
  hasConflict(newShortcut, excludeId = null) {
    for (const [id, shortcut] of Object.entries(this.shortcuts)) {
      if (id === excludeId) continue;
      
      const active = this.customShortcuts[id] || shortcut;
      
      if (active.key === newShortcut.key &&
          active.ctrl === newShortcut.ctrl &&
          active.alt === newShortcut.alt &&
          active.shift === newShortcut.shift) {
        return true;
      }
    }
    return false;
  }

  /**
   * Reset shortcut to default
   */
  resetShortcut(id) {
    delete this.customShortcuts[id];
    this.saveCustomShortcuts();
  }

  /**
   * Reset all shortcuts to defaults
   */
  resetAllShortcuts() {
    this.customShortcuts = {};
    this.saveCustomShortcuts();
  }

  /**
   * Get all shortcuts
   */
  getAllShortcuts() {
    return Object.entries(this.shortcuts).map(([id, shortcut]) => ({
      id,
      ...shortcut,
      custom: this.customShortcuts[id] || null
    }));
  }

  /**
   * Enable/disable shortcuts
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log('[Shortcuts] Shortcuts', enabled ? 'enabled' : 'disabled');
  }

  /**
   * Save custom shortcuts to localStorage
   */
  saveCustomShortcuts() {
    try {
      localStorage.setItem('custom_shortcuts', JSON.stringify(this.customShortcuts));
    } catch (error) {
      console.error('[Shortcuts] Failed to save custom shortcuts:', error);
    }
  }

  /**
   * Load custom shortcuts from localStorage
   */
  loadCustomShortcuts() {
    try {
      const saved = localStorage.getItem('custom_shortcuts');
      if (saved) {
        this.customShortcuts = JSON.parse(saved);
        console.log('[Shortcuts] Loaded custom shortcuts');
      }
    } catch (error) {
      console.error('[Shortcuts] Failed to load custom shortcuts:', error);
      this.customShortcuts = {};
    }
  }
}

export default KeyboardShortcutService;

