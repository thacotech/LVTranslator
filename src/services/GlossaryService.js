/**
 * Glossary Service
 * Manages custom terminology dictionary
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

class GlossaryService {
  constructor() {
    this.glossary = [];
    this.storageKey = 'glossary';
    this.highlightEnabled = true;
    this.loadGlossary();
  }

  /**
   * Load glossary from localStorage
   */
  loadGlossary() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.glossary = JSON.parse(stored);
        console.log(`Loaded ${this.glossary.length} glossary entries`);
      }

      // Load highlight preference
      const highlightPref = localStorage.getItem('glossary_highlight_enabled');
      if (highlightPref !== null) {
        this.highlightEnabled = highlightPref === 'true';
      }
    } catch (error) {
      console.error('Failed to load glossary:', error);
      this.glossary = [];
    }
  }

  /**
   * Save glossary to localStorage
   */
  saveGlossary() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.glossary));
      console.log(`Saved ${this.glossary.length} glossary entries`);
    } catch (error) {
      console.error('Failed to save glossary:', error);
      throw error;
    }
  }

  /**
   * Add entry to glossary
   * @param {Object} entry - Glossary entry {sourceTerm, targetTerm, sourceLang, targetLang, category, notes, context}
   * @returns {Object} Added entry with id
   */
  addEntry(entry) {
    // Check for duplicate
    const duplicate = this.findDuplicate(entry.sourceTerm, entry.sourceLang, entry.targetLang);
    if (duplicate) {
      console.warn('Duplicate glossary entry exists');
      return duplicate;
    }

    // Create new entry
    const newEntry = {
      id: this.generateId(),
      sourceTerm: entry.sourceTerm,
      targetTerm: entry.targetTerm,
      sourceLang: entry.sourceLang,
      targetLang: entry.targetLang,
      category: entry.category || 'general',
      notes: entry.notes || '',
      context: entry.context || '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.glossary.push(newEntry);
    this.saveGlossary();
    
    console.log('Added glossary entry:', newEntry);
    return newEntry;
  }

  /**
   * Update existing entry
   * @param {string} id - Entry ID
   * @param {Object} updates - Fields to update
   * @returns {Object|null} Updated entry or null
   */
  updateEntry(id, updates) {
    const entry = this.glossary.find(e => e.id === id);
    if (!entry) {
      console.error('Entry not found:', id);
      return null;
    }

    Object.assign(entry, updates);
    entry.updatedAt = Date.now();

    this.saveGlossary();
    console.log('Updated glossary entry:', entry);
    return entry;
  }

  /**
   * Delete entry from glossary
   * @param {string} id - Entry ID
   * @returns {boolean} Success status
   */
  deleteEntry(id) {
    const index = this.glossary.findIndex(e => e.id === id);
    if (index === -1) {
      console.error('Entry not found:', id);
      return false;
    }

    this.glossary.splice(index, 1);
    this.saveGlossary();
    
    console.log('Deleted glossary entry:', id);
    return true;
  }

  /**
   * Get entry by ID
   * @param {string} id - Entry ID
   * @returns {Object|null} Glossary entry or null
   */
  getEntry(id) {
    return this.glossary.find(e => e.id === id) || null;
  }

  /**
   * Get all entries
   * @returns {Array} All glossary entries
   */
  getAllEntries() {
    return [...this.glossary];
  }

  /**
   * Search glossary
   * @param {string} query - Search query
   * @param {Object} filters - Optional filters {category, sourceLang, targetLang}
   * @returns {Array} Matching entries
   */
  search(query, filters = {}) {
    let results = this.glossary;

    // Apply filters
    if (filters.category) {
      results = results.filter(e => e.category === filters.category);
    }
    if (filters.sourceLang) {
      results = results.filter(e => e.sourceLang === filters.sourceLang);
    }
    if (filters.targetLang) {
      results = results.filter(e => e.targetLang === filters.targetLang);
    }

    // Apply text search
    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(e => 
        e.sourceTerm.toLowerCase().includes(lowerQuery) ||
        e.targetTerm.toLowerCase().includes(lowerQuery) ||
        (e.notes && e.notes.toLowerCase().includes(lowerQuery)) ||
        (e.context && e.context.toLowerCase().includes(lowerQuery))
      );
    }

    return results;
  }

  /**
   * Find terms in text for highlighting
   * @param {string} text - Text to search
   * @param {string} sourceLang - Source language
   * @returns {Array} Found terms with positions
   */
  findTermsInText(text, sourceLang) {
    if (!this.highlightEnabled || !text) {
      return [];
    }

    const found = [];
    const lowerText = text.toLowerCase();

    // Sort by term length (longest first) to prioritize longer matches
    const sortedEntries = [...this.glossary]
      .filter(e => e.sourceLang === sourceLang)
      .sort((a, b) => b.sourceTerm.length - a.sourceTerm.length);

    sortedEntries.forEach(entry => {
      const lowerTerm = entry.sourceTerm.toLowerCase();
      let startIndex = 0;

      while (true) {
        const index = lowerText.indexOf(lowerTerm, startIndex);
        if (index === -1) break;

        // Check if it's a whole word match
        const isWordStart = index === 0 || /\s/.test(lowerText[index - 1]);
        const isWordEnd = index + lowerTerm.length === lowerText.length || 
                          /\s/.test(lowerText[index + lowerTerm.length]);

        if (isWordStart && isWordEnd) {
          found.push({
            term: text.substring(index, index + lowerTerm.length),
            start: index,
            end: index + lowerTerm.length,
            entry: entry
          });
        }

        startIndex = index + 1;
      }
    });

    // Sort by position
    return found.sort((a, b) => a.start - b.start);
  }

  /**
   * Get entries by category
   * @param {string} category - Category name
   * @returns {Array} Entries in category
   */
  getByCategory(category) {
    return this.glossary.filter(e => e.category === category);
  }

  /**
   * Get all categories
   * @returns {Array} List of categories with counts
   */
  getCategories() {
    const categories = {};
    
    this.glossary.forEach(entry => {
      const cat = entry.category || 'general';
      categories[cat] = (categories[cat] || 0) + 1;
    });

    return Object.entries(categories).map(([name, count]) => ({
      name,
      count
    }));
  }

  /**
   * Find duplicate entry
   * @param {string} sourceTerm - Source term
   * @param {string} sourceLang - Source language
   * @param {string} targetLang - Target language
   * @returns {Object|null} Duplicate entry or null
   */
  findDuplicate(sourceTerm, sourceLang, targetLang) {
    return this.glossary.find(e =>
      e.sourceTerm.toLowerCase() === sourceTerm.toLowerCase() &&
      e.sourceLang === sourceLang &&
      e.targetLang === targetLang
    ) || null;
  }

  /**
   * Toggle highlighting
   * @param {boolean} enabled - Enable/disable highlighting
   */
  setHighlighting(enabled) {
    this.highlightEnabled = enabled;
    localStorage.setItem('glossary_highlight_enabled', enabled.toString());
    console.log(`Glossary highlighting ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get highlighting status
   * @returns {boolean} Whether highlighting is enabled
   */
  isHighlightingEnabled() {
    return this.highlightEnabled;
  }

  /**
   * Export glossary to CSV
   * @returns {string} CSV string
   */
  exportToCSV() {
    const headers = ['Source Term', 'Target Term', 'Source Lang', 'Target Lang', 'Category', 'Notes', 'Context'];
    const rows = this.glossary.map(e => [
      this.escapeCSV(e.sourceTerm),
      this.escapeCSV(e.targetTerm),
      e.sourceLang,
      e.targetLang,
      this.escapeCSV(e.category),
      this.escapeCSV(e.notes),
      this.escapeCSV(e.context)
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }

  /**
   * Export glossary to JSON
   * @returns {string} JSON string
   */
  exportToJSON() {
    return JSON.stringify({
      version: '1.0',
      exportDate: new Date().toISOString(),
      entryCount: this.glossary.length,
      entries: this.glossary
    }, null, 2);
  }

  /**
   * Import glossary from CSV
   * @param {string} csvString - CSV string
   * @param {boolean} merge - Merge with existing (true) or replace (false)
   * @returns {Object} Import result
   */
  importFromCSV(csvString, merge = true) {
    try {
      const lines = csvString.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file is empty or invalid');
      }

      let entriesImported = 0;
      let duplicatesSkipped = 0;
      const errors = [];

      // If not merging, clear existing
      if (!merge) {
        this.glossary = [];
      }

      // Parse CSV (skip header row)
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = this.parseCSVLine(lines[i]);
          
          if (values.length < 4) {
            errors.push(`Line ${i + 1}: Insufficient columns`);
            continue;
          }

          const entry = {
            sourceTerm: values[0],
            targetTerm: values[1],
            sourceLang: values[2] || 'vi',
            targetLang: values[3] || 'lo',
            category: values[4] || 'general',
            notes: values[5] || '',
            context: values[6] || ''
          };

          // Check for duplicate
          if (this.findDuplicate(entry.sourceTerm, entry.sourceLang, entry.targetLang)) {
            duplicatesSkipped++;
            continue;
          }

          this.addEntry(entry);
          entriesImported++;

        } catch (error) {
          errors.push(`Line ${i + 1}: ${error.message}`);
        }
      }

      this.saveGlossary();

      return {
        success: true,
        entriesImported,
        duplicatesSkipped,
        errors
      };

    } catch (error) {
      return {
        success: false,
        entriesImported: 0,
        duplicatesSkipped: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Import glossary from JSON
   * @param {string} jsonString - JSON string
   * @param {boolean} merge - Merge with existing (true) or replace (false)
   * @returns {Object} Import result
   */
  importFromJSON(jsonString, merge = true) {
    try {
      const data = JSON.parse(jsonString);
      
      if (!data.entries || !Array.isArray(data.entries)) {
        throw new Error('Invalid format: entries array not found');
      }

      let entriesImported = 0;
      let duplicatesSkipped = 0;
      const errors = [];

      // If not merging, clear existing
      if (!merge) {
        this.glossary = [];
      }

      // Import entries
      data.entries.forEach((entry, index) => {
        try {
          if (!entry.sourceTerm || !entry.targetTerm) {
            errors.push(`Entry ${index}: Missing required fields`);
            return;
          }

          // Check for duplicate
          if (this.findDuplicate(entry.sourceTerm, entry.sourceLang, entry.targetLang)) {
            duplicatesSkipped++;
            return;
          }

          this.addEntry(entry);
          entriesImported++;

        } catch (error) {
          errors.push(`Entry ${index}: ${error.message}`);
        }
      });

      this.saveGlossary();

      return {
        success: true,
        entriesImported,
        duplicatesSkipped,
        errors
      };

    } catch (error) {
      return {
        success: false,
        entriesImported: 0,
        duplicatesSkipped: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Clear all glossary
   */
  clearGlossary() {
    this.glossary = [];
    this.saveGlossary();
    console.log('Glossary cleared');
  }

  /**
   * Get statistics
   * @returns {Object} Glossary statistics
   */
  getStats() {
    const totalEntries = this.glossary.length;
    const categories = this.getCategories();

    return {
      totalEntries,
      categories: categories.length,
      highlightEnabled: this.highlightEnabled
    };
  }

  /**
   * Parse CSV line (handles quoted fields)
   * @param {string} line - CSV line
   * @returns {Array} Parsed values
   */
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * Escape CSV field
   * @param {string} field - Field value
   * @returns {string} Escaped value
   */
  escapeCSV(field) {
    if (!field) return '';
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  /**
   * Generate unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return `gls_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default GlossaryService;
