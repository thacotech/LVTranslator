/**
 * Translation Quality Feedback Service
 * Handles user feedback, ratings, and quality tracking
 * Requirements: 13.1-13.10
 */

class FeedbackService {
  constructor() {
    this.STORAGE_KEY = 'lvtranslator_feedback';
    this.MAX_FEEDBACK_ITEMS = 1000;
    this.feedback = new Map(); // {translationId: {rating, isFavorite, errorReport, notes, timestamp}}
    
    this.loadFeedback();
  }

  /**
   * Load feedback from localStorage
   */
  async loadFeedback() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.feedback = new Map(Object.entries(data));
        console.log(`[Feedback] Loaded ${this.feedback.size} feedback items`);
      }
    } catch (error) {
      console.error('[Feedback] Failed to load:', error);
      this.feedback = new Map();
    }
  }

  /**
   * Save feedback to localStorage
   */
  async saveFeedback() {
    try {
      const data = Object.fromEntries(this.feedback);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[Feedback] Failed to save:', error);
      
      // If storage quota exceeded, cleanup old entries
      if (error.name === 'QuotaExceededError') {
        this.cleanupOldFeedback();
        // Retry save
        const data = Object.fromEntries(this.feedback);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      }
    }
  }

  /**
   * Add or update rating for a translation
   */
  async addRating(translationId, rating, sourceText = '', targetText = '') {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const existing = this.feedback.get(translationId) || {};
    
    this.feedback.set(translationId, {
      ...existing,
      translationId,
      rating,
      sourceText: sourceText || existing.sourceText || '',
      targetText: targetText || existing.targetText || '',
      timestamp: existing.timestamp || Date.now(),
      lastUpdated: Date.now()
    });

    await this.saveFeedback();
    
    console.log(`[Feedback] Rating ${rating} stars added for translation ${translationId}`);
    return this.feedback.get(translationId);
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(translationId, sourceText = '', targetText = '') {
    const existing = this.feedback.get(translationId) || {};
    const isFavorite = !existing.isFavorite;
    
    this.feedback.set(translationId, {
      ...existing,
      translationId,
      isFavorite,
      sourceText: sourceText || existing.sourceText || '',
      targetText: targetText || existing.targetText || '',
      timestamp: existing.timestamp || Date.now(),
      lastUpdated: Date.now()
    });

    await this.saveFeedback();
    
    console.log(`[Feedback] Favorite ${isFavorite ? 'added' : 'removed'} for translation ${translationId}`);
    return isFavorite;
  }

  /**
   * Report translation error
   */
  async reportError(translationId, errorType, description, sourceText = '', targetText = '') {
    const existing = this.feedback.get(translationId) || {};
    
    const errorReport = {
      type: errorType, // 'incorrect', 'grammar', 'context', 'other'
      description,
      reportedAt: Date.now()
    };
    
    this.feedback.set(translationId, {
      ...existing,
      translationId,
      errorReport,
      sourceText: sourceText || existing.sourceText || '',
      targetText: targetText || existing.targetText || '',
      timestamp: existing.timestamp || Date.now(),
      lastUpdated: Date.now()
    });

    await this.saveFeedback();
    
    console.log(`[Feedback] Error reported for translation ${translationId}: ${errorType}`);
    return this.feedback.get(translationId);
  }

  /**
   * Add notes to a translation
   */
  async addNotes(translationId, notes, sourceText = '', targetText = '') {
    const existing = this.feedback.get(translationId) || {};
    
    this.feedback.set(translationId, {
      ...existing,
      translationId,
      notes,
      sourceText: sourceText || existing.sourceText || '',
      targetText: targetText || existing.targetText || '',
      timestamp: existing.timestamp || Date.now(),
      lastUpdated: Date.now()
    });

    await this.saveFeedback();
    
    console.log(`[Feedback] Notes added for translation ${translationId}`);
    return this.feedback.get(translationId);
  }

  /**
   * Get feedback for a specific translation
   */
  getFeedback(translationId) {
    return this.feedback.get(translationId);
  }

  /**
   * Get all favorites
   */
  getFavorites() {
    return Array.from(this.feedback.values())
      .filter(item => item.isFavorite)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get all error reports
   */
  getErrorReports() {
    return Array.from(this.feedback.values())
      .filter(item => item.errorReport)
      .sort((a, b) => b.errorReport.reportedAt - a.errorReport.reportedAt);
  }

  /**
   * Get feedback statistics
   */
  getStatistics() {
    const allFeedback = Array.from(this.feedback.values());
    
    // Rating distribution
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRatings = 0;
    let sumRatings = 0;

    allFeedback.forEach(item => {
      if (item.rating) {
        ratingCounts[item.rating]++;
        totalRatings++;
        sumRatings += item.rating;
      }
    });

    const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;

    // Error type distribution
    const errorTypes = {};
    allFeedback.forEach(item => {
      if (item.errorReport) {
        const type = item.errorReport.type;
        errorTypes[type] = (errorTypes[type] || 0) + 1;
      }
    });

    // Calculate quality score (0-100)
    const qualityScore = this.calculateQualityScore(ratingCounts, totalRatings, errorTypes);

    return {
      totalFeedback: allFeedback.length,
      totalRatings,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution: ratingCounts,
      totalFavorites: allFeedback.filter(item => item.isFavorite).length,
      totalErrorReports: allFeedback.filter(item => item.errorReport).length,
      errorTypeDistribution: errorTypes,
      qualityScore: Math.round(qualityScore),
      
      // Additional insights
      positiveRatings: (ratingCounts[4] + ratingCounts[5]),
      negativeRatings: (ratingCounts[1] + ratingCounts[2]),
      neutralRatings: ratingCounts[3],
      satisfactionRate: totalRatings > 0 
        ? Math.round(((ratingCounts[4] + ratingCounts[5]) / totalRatings) * 100)
        : 0
    };
  }

  /**
   * Calculate overall quality score
   */
  calculateQualityScore(ratingCounts, totalRatings, errorTypes) {
    if (totalRatings === 0) return 0;

    // Weight ratings: 5-star = 100, 4-star = 80, 3-star = 60, 2-star = 40, 1-star = 20
    const weights = { 1: 20, 2: 40, 3: 60, 4: 80, 5: 100 };
    let weightedSum = 0;

    Object.entries(ratingCounts).forEach(([rating, count]) => {
      weightedSum += weights[rating] * count;
    });

    let score = weightedSum / totalRatings;

    // Penalize for error reports (reduce by 5% per 10 error reports)
    const totalErrors = Object.values(errorTypes).reduce((sum, count) => sum + count, 0);
    const errorPenalty = Math.min((totalErrors / 10) * 5, 30); // Max 30% penalty
    score -= errorPenalty;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get feedback by rating
   */
  getFeedbackByRating(rating) {
    return Array.from(this.feedback.values())
      .filter(item => item.rating === rating)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Search feedback
   */
  searchFeedback(query) {
    const lowerQuery = query.toLowerCase();
    
    return Array.from(this.feedback.values())
      .filter(item => {
        return (item.sourceText && item.sourceText.toLowerCase().includes(lowerQuery)) ||
               (item.targetText && item.targetText.toLowerCase().includes(lowerQuery)) ||
               (item.notes && item.notes.toLowerCase().includes(lowerQuery)) ||
               (item.errorReport && item.errorReport.description.toLowerCase().includes(lowerQuery));
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Delete feedback
   */
  async deleteFeedback(translationId) {
    if (this.feedback.has(translationId)) {
      this.feedback.delete(translationId);
      await this.saveFeedback();
      console.log(`[Feedback] Deleted feedback for translation ${translationId}`);
      return true;
    }
    return false;
  }

  /**
   * Clear all feedback
   */
  async clearAll() {
    this.feedback.clear();
    await this.saveFeedback();
    console.log('[Feedback] All feedback cleared');
  }

  /**
   * Export feedback to JSON
   */
  exportToJson() {
    const data = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      statistics: this.getStatistics(),
      feedback: Array.from(this.feedback.values())
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import feedback from JSON
   */
  async importFromJson(jsonString, merge = true) {
    try {
      const data = JSON.parse(jsonString);
      
      if (!data.feedback || !Array.isArray(data.feedback)) {
        throw new Error('Invalid feedback data format');
      }

      if (!merge) {
        this.feedback.clear();
      }

      let imported = 0;
      data.feedback.forEach(item => {
        if (item.translationId) {
          this.feedback.set(item.translationId, item);
          imported++;
        }
      });

      await this.saveFeedback();
      
      console.log(`[Feedback] Imported ${imported} feedback items`);
      return { success: true, imported };
    } catch (error) {
      console.error('[Feedback] Import failed:', error);
      throw error;
    }
  }

  /**
   * Cleanup old feedback to free space
   */
  cleanupOldFeedback() {
    if (this.feedback.size <= this.MAX_FEEDBACK_ITEMS) return;

    // Convert to array and sort by timestamp
    const sorted = Array.from(this.feedback.entries())
      .sort((a, b) => (a[1].timestamp || 0) - (b[1].timestamp || 0));

    // Keep only the most recent items
    const toKeep = sorted.slice(-this.MAX_FEEDBACK_ITEMS);
    
    this.feedback.clear();
    toKeep.forEach(([id, item]) => {
      this.feedback.set(id, item);
    });

    console.log(`[Feedback] Cleaned up old feedback, kept ${this.feedback.size} items`);
  }

  /**
   * Generate unique translation ID
   */
  static generateTranslationId(sourceText, targetText) {
    const combined = `${sourceText}|${targetText}`;
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `trans_${Math.abs(hash)}_${Date.now()}`;
  }
}

export default FeedbackService;

