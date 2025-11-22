/**
 * Translation Memory Service
 * Manages saved translations with categories, search, and autocomplete
 * Requirements: 3.1, 3.2, 3.4, 3.5, 3.6, 3.9, 3.10
 */

class TranslationMemoryService {
  constructor() {
    this.memory = [];
    this.maxItems = 500;
    this.storageKey = 'translation_memory';
    this.loadMemory();
  }

  /**
   * Load memory from localStorage
   */
  loadMemory() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.memory = JSON.parse(stored);
        console.log(`Loaded ${this.memory.length} items from translation memory`);
      }
    } catch (error) {
      console.error('Failed to load translation memory:', error);
      this.memory = [];
    }
  }

  /**
   * Save memory to localStorage
   */
  saveMemory() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.memory));
      console.log(`Saved ${this.memory.length} items to translation memory`);
    } catch (error) {
      console.error('Failed to save translation memory:', error);
      throw error;
    }
  }

  /**
   * Add item to memory
   * @param {Object} item - Memory item {sourceText, translatedText, sourceLang, targetLang, category, notes}
   * @returns {Object} Added item with id
   */
  addItem(item) {
    // Check if duplicate exists
    const duplicate = this.findDuplicate(item.sourceText, item.sourceLang, item.targetLang);
    if (duplicate) {
      // Update usage count instead of adding duplicate
      duplicate.usageCount++;
      duplicate.lastUsed = Date.now();
      this.saveMemory();
      return duplicate;
    }

    // Check if limit reached
    if (this.memory.length >= this.maxItems) {
      // Remove least used item (LRU eviction)
      this.evictLeastUsed();
    }

    // Create new item
    const newItem = {
      id: this.generateId(),
      sourceText: item.sourceText,
      translatedText: item.translatedText,
      sourceLang: item.sourceLang,
      targetLang: item.targetLang,
      category: item.category || 'general',
      notes: item.notes || '',
      usageCount: 1,
      createdAt: Date.now(),
      lastUsed: Date.now()
    };

    this.memory.unshift(newItem);
    this.saveMemory();
    
    console.log('Added to memory:', newItem);
    return newItem;
  }

  /**
   * Update existing item
   * @param {string} id - Item ID
   * @param {Object} updates - Fields to update
   * @returns {Object|null} Updated item or null if not found
   */
  updateItem(id, updates) {
    const item = this.memory.find(m => m.id === id);
    if (!item) {
      console.error('Item not found:', id);
      return null;
    }

    // Update fields
    Object.assign(item, updates);
    item.lastUsed = Date.now();

    this.saveMemory();
    console.log('Updated memory item:', item);
    return item;
  }

  /**
   * Delete item from memory
   * @param {string} id - Item ID
   * @returns {boolean} Success status
   */
  deleteItem(id) {
    const index = this.memory.findIndex(m => m.id === id);
    if (index === -1) {
      console.error('Item not found:', id);
      return false;
    }

    this.memory.splice(index, 1);
    this.saveMemory();
    
    console.log('Deleted memory item:', id);
    return true;
  }

  /**
   * Get item by ID
   * @param {string} id - Item ID
   * @returns {Object|null} Memory item or null
   */
  getItem(id) {
    return this.memory.find(m => m.id === id) || null;
  }

  /**
   * Get all items
   * @returns {Array} All memory items
   */
  getAllItems() {
    return [...this.memory];
  }

  /**
   * Search memory
   * @param {string} query - Search query
   * @param {Object} filters - Optional filters {category, sourceLang, targetLang}
   * @returns {Array} Matching items
   */
  search(query, filters = {}) {
    let results = this.memory;

    // Apply filters
    if (filters.category) {
      results = results.filter(m => m.category === filters.category);
    }
    if (filters.sourceLang) {
      results = results.filter(m => m.sourceLang === filters.sourceLang);
    }
    if (filters.targetLang) {
      results = results.filter(m => m.targetLang === filters.targetLang);
    }

    // Apply text search
    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(m => 
        m.sourceText.toLowerCase().includes(lowerQuery) ||
        m.translatedText.toLowerCase().includes(lowerQuery) ||
        (m.notes && m.notes.toLowerCase().includes(lowerQuery))
      );
    }

    return results;
  }

  /**
   * Get suggestions for autocomplete
   * @param {string} text - Current input text
   * @param {string} sourceLang - Source language
   * @param {number} limit - Max suggestions
   * @returns {Array} Suggested items
   */
  getSuggestions(text, sourceLang, limit = 5) {
    if (!text || text.length < 2) {
      return [];
    }

    const lowerText = text.toLowerCase();
    
    // Find items that start with the input
    const startsWith = this.memory.filter(m => 
      m.sourceLang === sourceLang &&
      m.sourceText.toLowerCase().startsWith(lowerText)
    );

    // Find items that contain the input
    const contains = this.memory.filter(m => 
      m.sourceLang === sourceLang &&
      !m.sourceText.toLowerCase().startsWith(lowerText) &&
      m.sourceText.toLowerCase().includes(lowerText)
    );

    // Combine and sort by usage count
    const suggestions = [...startsWith, ...contains]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);

    return suggestions;
  }

  /**
   * Get items by category
   * @param {string} category - Category name
   * @returns {Array} Items in category
   */
  getByCategory(category) {
    return this.memory.filter(m => m.category === category);
  }

  /**
   * Get all categories
   * @returns {Array} List of categories with counts
   */
  getCategories() {
    const categories = {};
    
    this.memory.forEach(item => {
      const cat = item.category || 'general';
      categories[cat] = (categories[cat] || 0) + 1;
    });

    return Object.entries(categories).map(([name, count]) => ({
      name,
      count
    }));
  }

  /**
   * Get most used items
   * @param {number} limit - Number of items
   * @returns {Array} Most used items
   */
  getMostUsed(limit = 10) {
    return [...this.memory]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  /**
   * Get recently used items
   * @param {number} limit - Number of items
   * @returns {Array} Recently used items
   */
  getRecentlyUsed(limit = 10) {
    return [...this.memory]
      .sort((a, b) => b.lastUsed - a.lastUsed)
      .slice(0, limit);
  }

  /**
   * Increment usage count
   * @param {string} id - Item ID
   */
  incrementUsage(id) {
    const item = this.memory.find(m => m.id === id);
    if (item) {
      item.usageCount++;
      item.lastUsed = Date.now();
      this.saveMemory();
    }
  }

  /**
   * Find duplicate item
   * @param {string} sourceText - Source text
   * @param {string} sourceLang - Source language
   * @param {string} targetLang - Target language
   * @returns {Object|null} Duplicate item or null
   */
  findDuplicate(sourceText, sourceLang, targetLang) {
    return this.memory.find(m =>
      m.sourceText === sourceText &&
      m.sourceLang === sourceLang &&
      m.targetLang === targetLang
    ) || null;
  }

  /**
   * Evict least used item (LRU)
   */
  evictLeastUsed() {
    if (this.memory.length === 0) return;

    // Find item with lowest usage count and oldest lastUsed
    const leastUsed = this.memory.reduce((min, item) => {
      if (item.usageCount < min.usageCount) return item;
      if (item.usageCount === min.usageCount && item.lastUsed < min.lastUsed) return item;
      return min;
    });

    console.log('Evicting least used item:', leastUsed);
    this.deleteItem(leastUsed.id);
  }

  /**
   * Export memory to JSON
   * @returns {string} JSON string
   */
  exportToJSON() {
    return JSON.stringify({
      version: '1.0',
      exportDate: new Date().toISOString(),
      itemCount: this.memory.length,
      items: this.memory
    }, null, 2);
  }

  /**
   * Import memory from JSON
   * @param {string} jsonString - JSON string
   * @param {boolean} merge - Merge with existing (true) or replace (false)
   * @returns {Object} Import result {success, itemsImported, duplicatesSkipped, errors}
   */
  importFromJSON(jsonString, merge = true) {
    try {
      const data = JSON.parse(jsonString);
      
      if (!data.items || !Array.isArray(data.items)) {
        throw new Error('Invalid format: items array not found');
      }

      let itemsImported = 0;
      let duplicatesSkipped = 0;
      const errors = [];

      // If not merging, clear existing memory
      if (!merge) {
        this.memory = [];
      }

      // Import items
      data.items.forEach((item, index) => {
        try {
          // Validate item
          if (!item.sourceText || !item.translatedText) {
            errors.push(`Item ${index}: Missing required fields`);
            return;
          }

          // Check for duplicate
          if (this.findDuplicate(item.sourceText, item.sourceLang, item.targetLang)) {
            duplicatesSkipped++;
            return;
          }

          // Add item (without creating duplicate)
          const newItem = {
            id: this.generateId(),
            sourceText: item.sourceText,
            translatedText: item.translatedText,
            sourceLang: item.sourceLang || 'vi',
            targetLang: item.targetLang || 'lo',
            category: item.category || 'general',
            notes: item.notes || '',
            usageCount: item.usageCount || 0,
            createdAt: item.createdAt || Date.now(),
            lastUsed: item.lastUsed || Date.now()
          };

          this.memory.push(newItem);
          itemsImported++;

        } catch (error) {
          errors.push(`Item ${index}: ${error.message}`);
        }
      });

      // Enforce max items limit
      if (this.memory.length > this.maxItems) {
        this.memory = this.memory.slice(0, this.maxItems);
      }

      this.saveMemory();

      return {
        success: true,
        itemsImported,
        duplicatesSkipped,
        errors
      };

    } catch (error) {
      return {
        success: false,
        itemsImported: 0,
        duplicatesSkipped: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Clear all memory
   */
  clearMemory() {
    this.memory = [];
    this.saveMemory();
    console.log('Translation memory cleared');
  }

  /**
   * Get statistics
   * @returns {Object} Memory statistics
   */
  getStats() {
    const totalItems = this.memory.length;
    const categories = this.getCategories();
    const totalUsage = this.memory.reduce((sum, item) => sum + item.usageCount, 0);
    const avgUsage = totalItems > 0 ? (totalUsage / totalItems).toFixed(1) : 0;

    return {
      totalItems,
      maxItems: this.maxItems,
      utilizationPercent: ((totalItems / this.maxItems) * 100).toFixed(1),
      categories: categories.length,
      totalUsage,
      avgUsage,
      mostUsed: this.getMostUsed(1)[0] || null
    };
  }

  /**
   * Generate unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default TranslationMemoryService;
