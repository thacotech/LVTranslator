/**
 * Glossary UI Component
 * Interface for managing custom terminology
 * Requirements: 4.1, 4.3, 4.4, 4.5, 4.6, 4.10
 */

import GlossaryService from '../services/GlossaryService.js';
import { ErrorHandler, ErrorCodes } from '../utils/errorHandler.js';

class GlossaryComponent {
  constructor(glossaryService, container) {
    this.glossaryService = glossaryService;
    this.container = container;
    this.currentFilter = { category: '', sourceLang: '', targetLang: '' };
    this.searchQuery = '';
    
    this.render();
    this.attachEventListeners();
    this.refreshGlossaryList();
  }

  render() {
    this.container.innerHTML = `
      <div class="glossary-panel">
        <div class="glossary-header">
          <h3 class="glossary-title">
            <span class="icon">📚</span>
            Glossary
          </h3>
          <button class="glossary-btn-close" id="glossaryCloseBtn">✕</button>
        </div>

        <div class="glossary-stats" id="glossaryStats">
          <div class="glossary-stat">
            <span class="stat-label">Terms:</span>
            <span class="stat-value" id="glossaryStatsTerms">0</span>
          </div>
          <div class="glossary-stat">
            <span class="stat-label">Categories:</span>
            <span class="stat-value" id="glossaryStatsCategories">0</span>
          </div>
          <div class="glossary-stat">
            <label class="glossary-highlight-toggle">
              <input type="checkbox" id="glossaryHighlightToggle" checked>
              <span>Highlight</span>
            </label>
          </div>
        </div>

        <div class="glossary-toolbar">
          <div class="glossary-search">
            <input type="text" id="glossarySearchInput" placeholder="Search terms..." class="glossary-search-input">
            <span class="search-icon">🔍</span>
          </div>

          <div class="glossary-filters">
            <select id="glossaryCategoryFilter" class="glossary-filter">
              <option value="">All Categories</option>
            </select>
            <select id="glossaryLangFilter" class="glossary-filter">
              <option value="">All Languages</option>
              <option value="vi">Vietnamese</option>
              <option value="lo">Lao</option>
              <option value="en">English</option>
            </select>
          </div>

          <div class="glossary-actions">
            <button class="glossary-btn glossary-btn-add" id="glossaryAddBtn">
              <span class="icon">➕</span>
              <span class="label">Add</span>
            </button>
            <button class="glossary-btn glossary-btn-export" id="glossaryExportBtn" title="Export">
              <span class="icon">📤</span>
            </button>
            <button class="glossary-btn glossary-btn-import" id="glossaryImportBtn" title="Import">
              <span class="icon">📥</span>
            </button>
          </div>
        </div>

        <div class="glossary-list" id="glossaryList">
          <div class="glossary-empty">
            <span class="icon">📖</span>
            <p>No glossary terms yet</p>
            <small>Add custom terminology for consistent translations</small>
          </div>
        </div>

        <!-- Add/Edit Dialog -->
        <div class="glossary-dialog" id="glossaryDialog" style="display: none;">
          <div class="glossary-dialog-content">
            <div class="glossary-dialog-header">
              <h4 id="glossaryDialogTitle">Add Term</h4>
              <button class="glossary-btn-close" id="glossaryDialogCloseBtn">✕</button>
            </div>
            <div class="glossary-dialog-body">
              <div class="glossary-form-group">
                <label for="glossarySourceTerm">Source Term</label>
                <input type="text" id="glossarySourceTerm" required>
              </div>
              <div class="glossary-form-group">
                <label for="glossaryTargetTerm">Translation</label>
                <input type="text" id="glossaryTargetTerm" required>
              </div>
              <div class="glossary-form-row">
                <div class="glossary-form-group">
                  <label for="glossarySourceLang">Source Lang</label>
                  <select id="glossarySourceLang">
                    <option value="vi">Vietnamese</option>
                    <option value="lo">Lao</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div class="glossary-form-group">
                  <label for="glossaryTargetLang">Target Lang</label>
                  <select id="glossaryTargetLang">
                    <option value="lo">Lao</option>
                    <option value="vi">Vietnamese</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
              <div class="glossary-form-group">
                <label for="glossaryCategory">Category</label>
                <input type="text" id="glossaryCategory" list="glossaryCategoryList" placeholder="general">
                <datalist id="glossaryCategoryList"></datalist>
              </div>
              <div class="glossary-form-group">
                <label for="glossaryContext">Context (optional)</label>
                <textarea id="glossaryContext" rows="2" placeholder="When to use this term"></textarea>
              </div>
              <div class="glossary-form-group">
                <label for="glossaryNotes">Notes (optional)</label>
                <textarea id="glossaryNotes" rows="2"></textarea>
              </div>
            </div>
            <div class="glossary-dialog-footer">
              <button class="glossary-btn glossary-btn-cancel" id="glossaryDialogCancelBtn">Cancel</button>
              <button class="glossary-btn glossary-btn-save" id="glossaryDialogSaveBtn">Save</button>
            </div>
          </div>
        </div>

        <!-- Export Dialog -->
        <div class="glossary-dialog" id="glossaryExportDialog" style="display: none;">
          <div class="glossary-dialog-content">
            <div class="glossary-dialog-header">
              <h4>Export Glossary</h4>
              <button class="glossary-btn-close" id="glossaryExportDialogCloseBtn">✕</button>
            </div>
            <div class="glossary-dialog-body">
              <p>Choose export format:</p>
              <div class="glossary-export-options">
                <button class="glossary-btn glossary-btn-primary" id="glossaryExportCSVBtn">
                  <span class="icon">📊</span>
                  Export as CSV
                </button>
                <button class="glossary-btn glossary-btn-primary" id="glossaryExportJSONBtn">
                  <span class="icon">📄</span>
                  Export as JSON
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Import Dialog -->
        <div class="glossary-dialog" id="glossaryImportDialog" style="display: none;">
          <div class="glossary-dialog-content">
            <div class="glossary-dialog-header">
              <h4>Import Glossary</h4>
              <button class="glossary-btn-close" id="glossaryImportDialogCloseBtn">✕</button>
            </div>
            <div class="glossary-dialog-body">
              <div class="glossary-form-group">
                <label>Select file (CSV or JSON)</label>
                <input type="file" id="glossaryImportFile" accept=".csv,.json">
              </div>
              <div class="glossary-form-group">
                <label>
                  <input type="radio" name="glossaryImportMode" value="merge" checked>
                  Merge with existing
                </label>
                <label>
                  <input type="radio" name="glossaryImportMode" value="replace">
                  Replace all
                </label>
              </div>
            </div>
            <div class="glossary-dialog-footer">
              <button class="glossary-btn glossary-btn-cancel" id="glossaryImportDialogCancelBtn">Cancel</button>
              <button class="glossary-btn glossary-btn-save" id="glossaryImportDialogImportBtn" disabled>Import</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    document.getElementById('glossaryCloseBtn').addEventListener('click', () => {
      this.container.style.display = 'none';
    });

    document.getElementById('glossarySearchInput').addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.refreshGlossaryList();
    });

    document.getElementById('glossaryCategoryFilter').addEventListener('change', (e) => {
      this.currentFilter.category = e.target.value;
      this.refreshGlossaryList();
    });

    document.getElementById('glossaryLangFilter').addEventListener('change', (e) => {
      this.currentFilter.sourceLang = e.target.value;
      this.refreshGlossaryList();
    });

    document.getElementById('glossaryHighlightToggle').addEventListener('change', (e) => {
      this.glossaryService.setHighlighting(e.target.checked);
    });

    document.getElementById('glossaryAddBtn').addEventListener('click', () => this.showAddDialog());
    document.getElementById('glossaryExportBtn').addEventListener('click', () => this.showExportDialog());
    document.getElementById('glossaryImportBtn').addEventListener('click', () => this.showImportDialog());

    // Add/Edit Dialog
    document.getElementById('glossaryDialogCloseBtn').addEventListener('click', () => this.hideDialog());
    document.getElementById('glossaryDialogCancelBtn').addEventListener('click', () => this.hideDialog());
    document.getElementById('glossaryDialogSaveBtn').addEventListener('click', () => this.saveGlossaryEntry());

    // Export Dialog
    document.getElementById('glossaryExportDialogCloseBtn').addEventListener('click', () => this.hideExportDialog());
    document.getElementById('glossaryExportCSVBtn').addEventListener('click', () => this.exportCSV());
    document.getElementById('glossaryExportJSONBtn').addEventListener('click', () => this.exportJSON());

    // Import Dialog
    document.getElementById('glossaryImportDialogCloseBtn').addEventListener('click', () => this.hideImportDialog());
    document.getElementById('glossaryImportDialogCancelBtn').addEventListener('click', () => this.hideImportDialog());
    document.getElementById('glossaryImportFile').addEventListener('change', (e) => this.handleImportFileSelect(e));
    document.getElementById('glossaryImportDialogImportBtn').addEventListener('click', () => this.performImport());

    this.updateCategoryFilter();
    
    // Set initial highlight state
    document.getElementById('glossaryHighlightToggle').checked = this.glossaryService.isHighlightingEnabled();
  }

  refreshGlossaryList() {
    const listContainer = document.getElementById('glossaryList');
    const entries = this.glossaryService.search(this.searchQuery, this.currentFilter);
    
    this.updateStats();

    if (entries.length === 0) {
      listContainer.innerHTML = `
        <div class="glossary-empty">
          <span class="icon">🔍</span>
          <p>No results found</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = entries.map(entry => this.renderGlossaryEntry(entry)).join('');
    this.attachEntryEventListeners();
  }

  renderGlossaryEntry(entry) {
    return `
      <div class="glossary-entry" data-id="${entry.id}">
        <div class="glossary-entry-header">
          <span class="glossary-entry-category">${entry.category}</span>
        </div>
        <div class="glossary-entry-content">
          <div class="glossary-entry-terms">
            <div class="glossary-entry-source">
              <span class="lang-badge">${entry.sourceLang}</span>
              ${this.escapeHtml(entry.sourceTerm)}
            </div>
            <div class="glossary-entry-arrow">→</div>
            <div class="glossary-entry-target">
              <span class="lang-badge">${entry.targetLang}</span>
              ${this.escapeHtml(entry.targetTerm)}
            </div>
          </div>
          ${entry.context ? `<div class="glossary-entry-context">${this.escapeHtml(entry.context)}</div>` : ''}
          ${entry.notes ? `<div class="glossary-entry-notes">${this.escapeHtml(entry.notes)}</div>` : ''}
        </div>
        <div class="glossary-entry-actions">
          <button class="glossary-entry-btn glossary-entry-btn-edit" data-id="${entry.id}">
            <span class="icon">✏️</span>
          </button>
          <button class="glossary-entry-btn glossary-entry-btn-delete" data-id="${entry.id}">
            <span class="icon">🗑️</span>
          </button>
        </div>
      </div>
    `;
  }

  attachEntryEventListeners() {
    document.querySelectorAll('.glossary-entry-btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        this.showEditDialog(id);
      });
    });

    document.querySelectorAll('.glossary-entry-btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        this.deleteGlossaryEntry(id);
      });
    });
  }

  updateStats() {
    const stats = this.glossaryService.getStats();
    document.getElementById('glossaryStatsTerms').textContent = stats.totalEntries;
    document.getElementById('glossaryStatsCategories').textContent = stats.categories;
  }

  updateCategoryFilter() {
    const categories = this.glossaryService.getCategories();
    const select = document.getElementById('glossaryCategoryFilter');
    select.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.name;
      option.textContent = `${cat.name} (${cat.count})`;
      select.appendChild(option);
    });

    const datalist = document.getElementById('glossaryCategoryList');
    datalist.innerHTML = categories.map(cat => `<option value="${cat.name}">`).join('');
  }

  showAddDialog() {
    document.getElementById('glossaryDialogTitle').textContent = 'Add Term';
    document.getElementById('glossaryDialog').style.display = 'flex';
    document.getElementById('glossarySourceTerm').value = '';
    document.getElementById('glossaryTargetTerm').value = '';
    document.getElementById('glossaryCategory').value = 'general';
    document.getElementById('glossaryContext').value = '';
    document.getElementById('glossaryNotes').value = '';
    this.editingEntryId = null;
  }

  showEditDialog(id) {
    const entry = this.glossaryService.getEntry(id);
    if (!entry) return;

    document.getElementById('glossaryDialogTitle').textContent = 'Edit Term';
    document.getElementById('glossaryDialog').style.display = 'flex';
    document.getElementById('glossarySourceTerm').value = entry.sourceTerm;
    document.getElementById('glossaryTargetTerm').value = entry.targetTerm;
    document.getElementById('glossarySourceLang').value = entry.sourceLang;
    document.getElementById('glossaryTargetLang').value = entry.targetLang;
    document.getElementById('glossaryCategory').value = entry.category;
    document.getElementById('glossaryContext').value = entry.context;
    document.getElementById('glossaryNotes').value = entry.notes;
    this.editingEntryId = id;
  }

  hideDialog() {
    document.getElementById('glossaryDialog').style.display = 'none';
    this.editingEntryId = null;
  }

  saveGlossaryEntry() {
    const sourceTerm = document.getElementById('glossarySourceTerm').value.trim();
    const targetTerm = document.getElementById('glossaryTargetTerm').value.trim();

    if (!sourceTerm || !targetTerm) {
      alert('Source term and translation are required');
      return;
    }

    const entry = {
      sourceTerm,
      targetTerm,
      sourceLang: document.getElementById('glossarySourceLang').value,
      targetLang: document.getElementById('glossaryTargetLang').value,
      category: document.getElementById('glossaryCategory').value || 'general',
      context: document.getElementById('glossaryContext').value.trim(),
      notes: document.getElementById('glossaryNotes').value.trim()
    };

    try {
      if (this.editingEntryId) {
        this.glossaryService.updateEntry(this.editingEntryId, entry);
      } else {
        this.glossaryService.addEntry(entry);
      }
      this.hideDialog();
      this.refreshGlossaryList();
      this.updateCategoryFilter();
    } catch (error) {
      ErrorHandler.handle(error, { code: ErrorCodes.STORAGE_ERROR });
    }
  }

  deleteGlossaryEntry(id) {
    if (!confirm('Delete this glossary entry?')) return;
    try {
      this.glossaryService.deleteEntry(id);
      this.refreshGlossaryList();
      this.updateCategoryFilter();
    } catch (error) {
      ErrorHandler.handle(error, { code: ErrorCodes.STORAGE_ERROR });
    }
  }

  showExportDialog() {
    document.getElementById('glossaryExportDialog').style.display = 'flex';
  }

  hideExportDialog() {
    document.getElementById('glossaryExportDialog').style.display = 'none';
  }

  exportCSV() {
    try {
      const csvString = this.glossaryService.exportToCSV();
      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `glossary-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      this.hideExportDialog();
    } catch (error) {
      ErrorHandler.handle(error, { code: ErrorCodes.STORAGE_ERROR });
    }
  }

  exportJSON() {
    try {
      const jsonString = this.glossaryService.exportToJSON();
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `glossary-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.hideExportDialog();
    } catch (error) {
      ErrorHandler.handle(error, { code: ErrorCodes.STORAGE_ERROR });
    }
  }

  showImportDialog() {
    document.getElementById('glossaryImportDialog').style.display = 'flex';
    document.getElementById('glossaryImportFile').value = '';
    document.getElementById('glossaryImportDialogImportBtn').disabled = true;
  }

  hideImportDialog() {
    document.getElementById('glossaryImportDialog').style.display = 'none';
  }

  async handleImportFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      this.importData = { text, type: file.name.endsWith('.csv') ? 'csv' : 'json' };
      document.getElementById('glossaryImportDialogImportBtn').disabled = false;
    } catch (error) {
      alert('Failed to read file');
    }
  }

  performImport() {
    if (!this.importData) return;

    const merge = document.querySelector('input[name="glossaryImportMode"]:checked').value === 'merge';

    try {
      let result;
      if (this.importData.type === 'csv') {
        result = this.glossaryService.importFromCSV(this.importData.text, merge);
      } else {
        result = this.glossaryService.importFromJSON(this.importData.text, merge);
      }

      if (result.success) {
        alert(`Import successful!\nEntries: ${result.entriesImported}\nDuplicates skipped: ${result.duplicatesSkipped}`);
        this.hideImportDialog();
        this.refreshGlossaryList();
        this.updateCategoryFilter();
      } else {
        alert(`Import failed:\n${result.errors.join('\n')}`);
      }
    } catch (error) {
      ErrorHandler.handle(error, { code: ErrorCodes.STORAGE_ERROR });
    }
  }

  highlightTermsInText(textElement, sourceLang) {
    const text = textElement.value || textElement.textContent;
    const terms = this.glossaryService.findTermsInText(text, sourceLang);
    return terms;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  toggle() {
    this.container.style.display = this.container.style.display === 'none' ? 'block' : 'none';
    if (this.container.style.display === 'block') {
      this.refreshGlossaryList();
    }
  }
}

export default GlossaryComponent;

