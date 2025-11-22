/**
 * Translation Memory UI Component
 * Provides interface for managing saved translations
 * Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.9
 */

import TranslationMemoryService from '../services/TranslationMemoryService.js';
import { ErrorHandler, ErrorCodes } from '../utils/errorHandler.js';

class TranslationMemoryComponent {
  constructor(memoryService, container) {
    this.memoryService = memoryService;
    this.container = container;
    this.currentFilter = { category: '', sourceLang: '', targetLang: '' };
    this.searchQuery = '';
    
    this.render();
    this.attachEventListeners();
    this.refreshMemoryList();
  }

  /**
   * Render Translation Memory UI
   */
  render() {
    this.container.innerHTML = `
      <div class="memory-panel">
        <!-- Header -->
        <div class="memory-header">
          <h3 class="memory-title">
            <span class="icon">💾</span>
            Translation Memory
          </h3>
          <button class="memory-btn memory-btn-close" id="memoryCloseBtn" title="Close">
            <span class="icon">✕</span>
          </button>
        </div>

        <!-- Stats Bar -->
        <div class="memory-stats" id="memoryStats">
          <div class="memory-stat">
            <span class="stat-label">Items:</span>
            <span class="stat-value" id="memoryStatsItems">0</span>
          </div>
          <div class="memory-stat">
            <span class="stat-label">Categories:</span>
            <span class="stat-value" id="memoryStatsCategories">0</span>
          </div>
          <div class="memory-stat">
            <span class="stat-label">Usage:</span>
            <span class="stat-value" id="memoryStatsUsage">0%</span>
          </div>
        </div>

        <!-- Toolbar -->
        <div class="memory-toolbar">
          <div class="memory-search">
            <input 
              type="text" 
              id="memorySearchInput" 
              placeholder="Search translations..."
              class="memory-search-input"
            >
            <span class="search-icon">🔍</span>
          </div>

          <div class="memory-filters">
            <select id="memoryCategoryFilter" class="memory-filter">
              <option value="">All Categories</option>
            </select>

            <select id="memoryLangFilter" class="memory-filter">
              <option value="">All Languages</option>
              <option value="vi">Vietnamese</option>
              <option value="lo">Lao</option>
              <option value="en">English</option>
            </select>
          </div>

          <div class="memory-actions">
            <button class="memory-btn memory-btn-add" id="memoryAddBtn" title="Add new (Ctrl+S)">
              <span class="icon">➕</span>
              <span class="label">Add</span>
            </button>
            
            <button class="memory-btn memory-btn-export" id="memoryExportBtn" title="Export">
              <span class="icon">📤</span>
            </button>
            
            <button class="memory-btn memory-btn-import" id="memoryImportBtn" title="Import">
              <span class="icon">📥</span>
            </button>
          </div>
        </div>

        <!-- Memory List -->
        <div class="memory-list" id="memoryList">
          <div class="memory-empty">
            <span class="icon">📭</span>
            <p>No saved translations yet</p>
            <small>Save frequently used translations for quick access</small>
          </div>
        </div>

        <!-- Add/Edit Dialog (Hidden) -->
        <div class="memory-dialog" id="memoryDialog" style="display: none;">
          <div class="memory-dialog-content">
            <div class="memory-dialog-header">
              <h4 id="memoryDialogTitle">Add to Memory</h4>
              <button class="memory-btn-close" id="memoryDialogCloseBtn">✕</button>
            </div>

            <div class="memory-dialog-body">
              <div class="memory-form-group">
                <label for="memorySourceText">Source Text</label>
                <textarea id="memorySourceText" rows="2" required></textarea>
              </div>

              <div class="memory-form-group">
                <label for="memoryTranslatedText">Translation</label>
                <textarea id="memoryTranslatedText" rows="2" required></textarea>
              </div>

              <div class="memory-form-row">
                <div class="memory-form-group">
                  <label for="memorySourceLang">Source Lang</label>
                  <select id="memorySourceLang">
                    <option value="vi">Vietnamese</option>
                    <option value="lo">Lao</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div class="memory-form-group">
                  <label for="memoryTargetLang">Target Lang</label>
                  <select id="memoryTargetLang">
                    <option value="lo">Lao</option>
                    <option value="vi">Vietnamese</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <div class="memory-form-group">
                <label for="memoryCategory">Category</label>
                <input type="text" id="memoryCategory" list="memoryCategoryList" placeholder="general">
                <datalist id="memoryCategoryList"></datalist>
              </div>

              <div class="memory-form-group">
                <label for="memoryNotes">Notes (optional)</label>
                <textarea id="memoryNotes" rows="2"></textarea>
              </div>
            </div>

            <div class="memory-dialog-footer">
              <button class="memory-btn memory-btn-cancel" id="memoryDialogCancelBtn">Cancel</button>
              <button class="memory-btn memory-btn-save" id="memoryDialogSaveBtn">Save</button>
            </div>
          </div>
        </div>

        <!-- Import Dialog (Hidden) -->
        <div class="memory-dialog" id="memoryImportDialog" style="display: none;">
          <div class="memory-dialog-content">
            <div class="memory-dialog-header">
              <h4>Import Translation Memory</h4>
              <button class="memory-btn-close" id="memoryImportDialogCloseBtn">✕</button>
            </div>

            <div class="memory-dialog-body">
              <div class="memory-form-group">
                <label>Select JSON file</label>
                <input type="file" id="memoryImportFile" accept=".json">
              </div>

              <div class="memory-form-group">
                <label>
                  <input type="radio" name="importMode" value="merge" checked>
                  Merge with existing items
                </label>
                <label>
                  <input type="radio" name="importMode" value="replace">
                  Replace all items
                </label>
              </div>

              <div class="memory-import-preview" id="memoryImportPreview" style="display: none;">
                <p><strong>Preview:</strong></p>
                <p id="memoryImportPreviewText"></p>
              </div>
            </div>

            <div class="memory-dialog-footer">
              <button class="memory-btn memory-btn-cancel" id="memoryImportDialogCancelBtn">Cancel</button>
              <button class="memory-btn memory-btn-save" id="memoryImportDialogImportBtn" disabled>Import</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Close panel
    document.getElementById('memoryCloseBtn').addEventListener('click', () => {
      this.container.style.display = 'none';
    });

    // Search
    document.getElementById('memorySearchInput').addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.refreshMemoryList();
    });

    // Filters
    document.getElementById('memoryCategoryFilter').addEventListener('change', (e) => {
      this.currentFilter.category = e.target.value;
      this.refreshMemoryList();
    });

    document.getElementById('memoryLangFilter').addEventListener('change', (e) => {
      this.currentFilter.sourceLang = e.target.value;
      this.refreshMemoryList();
    });

    // Actions
    document.getElementById('memoryAddBtn').addEventListener('click', () => {
      this.showAddDialog();
    });

    document.getElementById('memoryExportBtn').addEventListener('click', () => {
      this.exportMemory();
    });

    document.getElementById('memoryImportBtn').addEventListener('click', () => {
      this.showImportDialog();
    });

    // Add/Edit Dialog
    document.getElementById('memoryDialogCloseBtn').addEventListener('click', () => {
      this.hideDialog();
    });

    document.getElementById('memoryDialogCancelBtn').addEventListener('click', () => {
      this.hideDialog();
    });

    document.getElementById('memoryDialogSaveBtn').addEventListener('click', () => {
      this.saveMemoryItem();
    });

    // Import Dialog
    document.getElementById('memoryImportDialogCloseBtn').addEventListener('click', () => {
      this.hideImportDialog();
    });

    document.getElementById('memoryImportDialogCancelBtn').addEventListener('click', () => {
      this.hideImportDialog();
    });

    document.getElementById('memoryImportFile').addEventListener('change', (e) => {
      this.handleImportFileSelect(e);
    });

    document.getElementById('memoryImportDialogImportBtn').addEventListener('click', () => {
      this.performImport();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl+S to add from current translation
      if (e.ctrlKey && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        this.addCurrentTranslation();
      }
    });

    // Update category filter
    this.updateCategoryFilter();
  }

  /**
   * Refresh memory list display
   */
  refreshMemoryList() {
    const listContainer = document.getElementById('memoryList');
    
    // Get filtered items
    const items = this.memoryService.search(this.searchQuery, this.currentFilter);

    // Update stats
    this.updateStats();

    // Render items
    if (items.length === 0) {
      listContainer.innerHTML = `
        <div class="memory-empty">
          <span class="icon">🔍</span>
          <p>No results found</p>
          <small>${this.searchQuery ? 'Try different search terms' : 'No items match your filters'}</small>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = items.map(item => this.renderMemoryItem(item)).join('');

    // Attach item event listeners
    this.attachItemEventListeners();
  }

  /**
   * Render single memory item
   */
  renderMemoryItem(item) {
    return `
      <div class="memory-item" data-id="${item.id}">
        <div class="memory-item-header">
          <span class="memory-item-category">${item.category}</span>
          <span class="memory-item-usage" title="Usage count">
            <span class="icon">📊</span>
            ${item.usageCount}
          </span>
        </div>

        <div class="memory-item-content">
          <div class="memory-item-text">
            <div class="memory-item-source">
              <span class="lang-badge">${item.sourceLang}</span>
              ${this.escapeHtml(item.sourceText)}
            </div>
            <div class="memory-item-arrow">→</div>
            <div class="memory-item-translation">
              <span class="lang-badge">${item.targetLang}</span>
              ${this.escapeHtml(item.translatedText)}
            </div>
          </div>

          ${item.notes ? `<div class="memory-item-notes">${this.escapeHtml(item.notes)}</div>` : ''}
        </div>

        <div class="memory-item-actions">
          <button class="memory-item-btn memory-item-btn-insert" data-id="${item.id}" title="Insert">
            <span class="icon">📝</span>
            Insert
          </button>
          <button class="memory-item-btn memory-item-btn-edit" data-id="${item.id}" title="Edit">
            <span class="icon">✏️</span>
          </button>
          <button class="memory-item-btn memory-item-btn-delete" data-id="${item.id}" title="Delete">
            <span class="icon">🗑️</span>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners to memory items
   */
  attachItemEventListeners() {
    // Insert buttons
    document.querySelectorAll('.memory-item-btn-insert').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        this.insertMemoryItem(id);
      });
    });

    // Edit buttons
    document.querySelectorAll('.memory-item-btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        this.showEditDialog(id);
      });
    });

    // Delete buttons
    document.querySelectorAll('.memory-item-btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        this.deleteMemoryItem(id);
      });
    });
  }

  /**
   * Update stats display
   */
  updateStats() {
    const stats = this.memoryService.getStats();
    
    document.getElementById('memoryStatsItems').textContent = 
      `${stats.totalItems}/${stats.maxItems}`;
    document.getElementById('memoryStatsCategories').textContent = stats.categories;
    document.getElementById('memoryStatsUsage').textContent = `${stats.utilizationPercent}%`;
  }

  /**
   * Update category filter dropdown
   */
  updateCategoryFilter() {
    const categories = this.memoryService.getCategories();
    const select = document.getElementById('memoryCategoryFilter');
    
    // Keep "All Categories" option
    select.innerHTML = '<option value="">All Categories</option>';
    
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.name;
      option.textContent = `${cat.name} (${cat.count})`;
      select.appendChild(option);
    });

    // Also update datalist for autocomplete
    const datalist = document.getElementById('memoryCategoryList');
    datalist.innerHTML = categories.map(cat => 
      `<option value="${cat.name}">`
    ).join('');
  }

  /**
   * Show add dialog
   */
  showAddDialog() {
    document.getElementById('memoryDialogTitle').textContent = 'Add to Memory';
    document.getElementById('memoryDialog').style.display = 'flex';
    
    // Clear form
    document.getElementById('memorySourceText').value = '';
    document.getElementById('memoryTranslatedText').value = '';
    document.getElementById('memoryCategory').value = 'general';
    document.getElementById('memoryNotes').value = '';
    
    // Store that we're adding (not editing)
    this.editingItemId = null;
  }

  /**
   * Show edit dialog
   */
  showEditDialog(id) {
    const item = this.memoryService.getItem(id);
    if (!item) return;

    document.getElementById('memoryDialogTitle').textContent = 'Edit Memory Item';
    document.getElementById('memoryDialog').style.display = 'flex';
    
    // Fill form
    document.getElementById('memorySourceText').value = item.sourceText;
    document.getElementById('memoryTranslatedText').value = item.translatedText;
    document.getElementById('memorySourceLang').value = item.sourceLang;
    document.getElementById('memoryTargetLang').value = item.targetLang;
    document.getElementById('memoryCategory').value = item.category;
    document.getElementById('memoryNotes').value = item.notes;
    
    // Store item ID
    this.editingItemId = id;
  }

  /**
   * Hide dialog
   */
  hideDialog() {
    document.getElementById('memoryDialog').style.display = 'none';
    this.editingItemId = null;
  }

  /**
   * Save memory item (add or update)
   */
  saveMemoryItem() {
    const sourceText = document.getElementById('memorySourceText').value.trim();
    const translatedText = document.getElementById('memoryTranslatedText').value.trim();
    
    if (!sourceText || !translatedText) {
      alert('Source text and translation are required');
      return;
    }

    const item = {
      sourceText,
      translatedText,
      sourceLang: document.getElementById('memorySourceLang').value,
      targetLang: document.getElementById('memoryTargetLang').value,
      category: document.getElementById('memoryCategory').value || 'general',
      notes: document.getElementById('memoryNotes').value.trim()
    };

    try {
      if (this.editingItemId) {
        // Update existing
        this.memoryService.updateItem(this.editingItemId, item);
      } else {
        // Add new
        this.memoryService.addItem(item);
      }

      this.hideDialog();
      this.refreshMemoryList();
      this.updateCategoryFilter();

    } catch (error) {
      ErrorHandler.handle(error, {
        code: ErrorCodes.STORAGE_ERROR,
        context: 'Failed to save memory item'
      });
    }
  }

  /**
   * Add current translation to memory
   */
  addCurrentTranslation() {
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    const sourceLang = document.getElementById('sourceLangSelector');
    const targetLang = document.getElementById('targetLangSelector');

    if (!inputText || !outputText) return;

    const sourceText = inputText.value.trim();
    const translatedText = outputText.value.trim();

    if (!sourceText || !translatedText) {
      alert('Please translate something first');
      return;
    }

    // Pre-fill dialog with current translation
    document.getElementById('memorySourceText').value = sourceText;
    document.getElementById('memoryTranslatedText').value = translatedText;
    
    if (sourceLang) {
      document.getElementById('memorySourceLang').value = sourceLang.value;
    }
    if (targetLang) {
      document.getElementById('memoryTargetLang').value = targetLang.value;
    }

    this.showAddDialog();
  }

  /**
   * Insert memory item into input field
   */
  insertMemoryItem(id) {
    const item = this.memoryService.getItem(id);
    if (!item) return;

    const inputText = document.getElementById('inputText');
    if (inputText) {
      inputText.value = item.sourceText;
      inputText.dispatchEvent(new Event('input', { bubbles: true }));
      inputText.focus();
    }

    // Increment usage
    this.memoryService.incrementUsage(id);
    this.refreshMemoryList();
  }

  /**
   * Delete memory item
   */
  deleteMemoryItem(id) {
    if (!confirm('Delete this item from memory?')) return;

    try {
      this.memoryService.deleteItem(id);
      this.refreshMemoryList();
      this.updateCategoryFilter();
    } catch (error) {
      ErrorHandler.handle(error, {
        code: ErrorCodes.STORAGE_ERROR,
        context: 'Failed to delete memory item'
      });
    }
  }

  /**
   * Export memory to JSON file
   */
  exportMemory() {
    try {
      const jsonString = this.memoryService.exportToJSON();
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `translation-memory-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      
      console.log('Memory exported successfully');
    } catch (error) {
      ErrorHandler.handle(error, {
        code: ErrorCodes.STORAGE_ERROR,
        context: 'Failed to export memory'
      });
    }
  }

  /**
   * Show import dialog
   */
  showImportDialog() {
    document.getElementById('memoryImportDialog').style.display = 'flex';
    document.getElementById('memoryImportFile').value = '';
    document.getElementById('memoryImportPreview').style.display = 'none';
    document.getElementById('memoryImportDialogImportBtn').disabled = true;
  }

  /**
   * Hide import dialog
   */
  hideImportDialog() {
    document.getElementById('memoryImportDialog').style.display = 'none';
  }

  /**
   * Handle import file selection
   */
  async handleImportFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Show preview
      const preview = document.getElementById('memoryImportPreview');
      const previewText = document.getElementById('memoryImportPreviewText');
      
      previewText.textContent = `${data.items?.length || 0} items found`;
      preview.style.display = 'block';
      
      // Enable import button
      document.getElementById('memoryImportDialogImportBtn').disabled = false;
      
      // Store data for import
      this.importData = text;
      
    } catch (error) {
      alert('Invalid JSON file');
      console.error('Import file error:', error);
    }
  }

  /**
   * Perform import
   */
  performImport() {
    if (!this.importData) return;

    const merge = document.querySelector('input[name="importMode"]:checked').value === 'merge';

    try {
      const result = this.memoryService.importFromJSON(this.importData, merge);
      
      if (result.success) {
        alert(`Import successful!\n\nItems imported: ${result.itemsImported}\nDuplicates skipped: ${result.duplicatesSkipped}\nErrors: ${result.errors.length}`);
        
        this.hideImportDialog();
        this.refreshMemoryList();
        this.updateCategoryFilter();
      } else {
        alert(`Import failed:\n${result.errors.join('\n')}`);
      }
      
    } catch (error) {
      ErrorHandler.handle(error, {
        code: ErrorCodes.STORAGE_ERROR,
        context: 'Failed to import memory'
      });
    }
  }

  /**
   * Get suggestions for autocomplete
   * @param {string} text - Current input text
   * @param {string} sourceLang - Source language
   * @returns {Array} Suggestions
   */
  getSuggestions(text, sourceLang) {
    return this.memoryService.getSuggestions(text, sourceLang);
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Show/hide panel
   */
  toggle() {
    this.container.style.display = 
      this.container.style.display === 'none' ? 'block' : 'none';
    
    if (this.container.style.display === 'block') {
      this.refreshMemoryList();
    }
  }
}

export default TranslationMemoryComponent;
