# Design Document

## Overview

Tính năng Translation History sẽ được tích hợp vào ứng dụng LVTranslator hiện tại thông qua một panel slide-out có thể mở/đóng. Tính năng này sẽ sử dụng localStorage để lưu trữ dữ liệu và tích hợp seamlessly với workflow dịch thuật hiện tại.

## Architecture

### High-level Architecture
```
┌─────────────────────────────────────────┐
│           Main Application              │
│  ┌─────────────────────────────────────┐│
│  │     VietnameseLaoTranslator         ││
│  │                                     ││
│  │  ┌─────────────────────────────────┐││
│  │  │    TranslationHistory           │││
│  │  │    - saveTranslation()          │││
│  │  │    - loadHistory()              │││
│  │  │    - clearHistory()             │││
│  │  │    - deleteItem()               │││
│  │  └─────────────────────────────────┘││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│           localStorage                  │
│  ┌─────────────────────────────────────┐│
│  │    translationHistory               ││
│  │    [                                ││
│  │      {                              ││
│  │        id: timestamp,               ││
│  │        sourceText: string,          ││
│  │        translatedText: string,      ││
│  │        direction: 'vi-lo'|'lo-vi',  ││
│  │        timestamp: Date              ││
│  │      }                              ││
│  │    ]                                ││
│  │                                     ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

## Components and Interfaces

### 1. History Panel UI Component

**Location**: Sẽ được thêm vào sau phần controls, trước file upload section

**HTML Structure**:
```html
<!-- History Section -->
<div class="history-section">
  <div class="history-header">
    <button class="history-toggle-btn" id="historyToggleBtn">
      <span>📚</span> Translation History
    </button>
  </div>
  
  <div class="history-panel" id="historyPanel" style="display: none;">
    <div class="history-panel-header">
      <h3>Recent Translations</h3>
      <div class="history-actions">
        <button class="clear-history-btn" id="clearHistoryBtn">
          <span>🗑️</span> Clear All
        </button>
        <button class="close-history-btn" id="closeHistoryBtn">
          <span>✕</span>
        </button>
      </div>
    </div>
    
    <div class="history-content" id="historyContent">
      <!-- History items will be dynamically generated here -->
    </div>
    
    <div class="history-empty" id="historyEmpty" style="display: none;">
      <p>No translation history yet</p>
    </div>
  </div>
</div>
```

### 2. History Item Component

**Structure cho mỗi history item**:
```html
<div class="history-item" data-id="timestamp">
  <div class="history-item-content">
    <div class="history-item-text">
      <div class="source-text">
        <span class="language-tag">VI</span>
        <span class="text-preview">Xin chào, bạn có khỏe không?</span>
      </div>
      <div class="arrow">→</div>
      <div class="translated-text">
        <span class="language-tag">LO</span>
        <span class="text-preview lao-text">ສະບາຍດີ, ເຈົ້າສະບາຍດີບໍ?</span>
      </div>
    </div>
    <div class="history-item-meta">
      <span class="timestamp">2 minutes ago</span>
    </div>
  </div>
  <div class="history-item-actions">
    <button class="use-translation-btn" title="Use this translation">
      <span>↩️</span>
    </button>
    <button class="delete-item-btn" title="Delete this item">
      <span>🗑️</span>
    </button>
  </div>
</div>
```

### 3. TranslationHistory Class

**Core Methods**:

```javascript
class TranslationHistory {
  constructor(translator) {
    this.translator = translator;
    this.maxItems = 50; // Maximum items to store
    this.storageKey = 'lvtranslator_history';
  }

  // Save a new translation to history
  saveTranslation(sourceText, translatedText, direction) {
    // Implementation details in tasks
  }

  // Load history from localStorage
  loadHistory() {
    // Implementation details in tasks
  }

  // Clear all history
  clearHistory() {
    // Implementation details in tasks
  }

  // Delete specific item
  deleteItem(id) {
    // Implementation details in tasks
  }

  // Use translation from history
  useTranslation(item) {
    // Implementation details in tasks
  }

  // Render history UI
  renderHistory() {
    // Implementation details in tasks
  }
}
```

## Data Models

### Translation History Item
```javascript
{
  id: number,              // timestamp as unique ID
  sourceText: string,      // original text
  translatedText: string,  // translated text
  direction: string,       // 'vi-lo' or 'lo-vi'
  timestamp: number,       // Date.now()
  preview: {
    source: string,        // truncated source (max 50 chars)
    translated: string     // truncated translation (max 50 chars)
  }
}
```

### localStorage Structure
```javascript
{
  "lvtranslator_history": [
    {
      "id": 1703123456789,
      "sourceText": "Xin chào, bạn có khỏe không?",
      "translatedText": "ສະບາຍດີ, ເຈົ້າສະບາຍດີບໍ?",
      "direction": "vi-lo",
      "timestamp": 1703123456789,
      "preview": {
        "source": "Xin chào, bạn có khỏe không?",
        "translated": "ສະບາຍດີ, ເຈົ້າສະບາຍດີບໍ?"
      }
    }
  ]
}
```

## Error Handling

### localStorage Errors
- **Quota Exceeded**: Tự động xóa 10 items cũ nhất và thử lại
- **localStorage Unavailable**: Hiển thị warning và disable history feature
- **Corrupted Data**: Clear toàn bộ history và khởi tạo lại

### UI Error States
- **Empty History**: Hiển thị friendly message với icon
- **Load Error**: Hiển thị error message và retry button
- **Delete Confirmation**: Modal dialog để xác nhận xóa toàn bộ

## Testing Strategy

### Unit Tests
1. **TranslationHistory Class**:
   - Test saveTranslation() với các input khác nhau
   - Test loadHistory() với localStorage empty/có data/corrupted
   - Test clearHistory() và deleteItem()
   - Test maxItems limit và auto-cleanup

2. **UI Components**:
   - Test history panel toggle
   - Test history item rendering
   - Test use translation functionality
   - Test delete item functionality

### Integration Tests
1. **End-to-End Workflow**:
   - Translate text → Check history saved
   - Use history item → Check fields populated
   - Clear history → Check UI updated
   - Switch languages → Check history still works

2. **Cross-browser Testing**:
   - localStorage compatibility
   - Font rendering (Phetsarath OT)
   - Responsive design

### Manual Testing Scenarios
1. **Performance**: Test với 50+ history items
2. **Memory**: Test localStorage quota limits
3. **UX**: Test workflow interruption khi sử dụng history
4. **Accessibility**: Test keyboard navigation và screen readers

## CSS Design Specifications

### History Panel Styling
```css
.history-section {
  margin: 30px 0;
}

.history-toggle-btn {
  background: linear-gradient(45deg, #17a2b8, #6610f2);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 15px 30px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 auto;
}

.history-panel {
  background: #f8f9fa;
  border-radius: 15px;
  margin-top: 20px;
  border: 1px solid #e9ecef;
  max-height: 400px;
  overflow-y: auto;
  animation: slideDown 0.3s ease;
}

.history-item {
  padding: 15px;
  border-bottom: 1px solid #e9ecef;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.history-item:hover {
  background-color: #e9ecef;
}
```

### Dark Mode Support
```css
body.dark-mode .history-panel {
  background: #23272b;
  border-color: #444;
}

body.dark-mode .history-item {
  border-bottom-color: #444;
  color: #f1f1f1;
}

body.dark-mode .history-item:hover {
  background-color: #2c3034;
}
```

### Responsive Design
```css
@media (max-width: 768px) {
  .history-item-content {
    flex-direction: column;
    gap: 10px;
  }
  
  .history-item-text {
    flex-direction: column;
  }
  
  .arrow {
    transform: rotate(90deg);
  }
}
```

## Integration Points

### 1. Main Translator Class Integration
- Hook vào `translateText()` method để auto-save
- Extend `switchLanguages()` để handle history direction
- Integrate với existing language/theme systems

### 2. UI Integration Points
- Add history button vào controls section
- Ensure consistent styling với existing components
- Maintain responsive behavior

### 3. Internationalization Integration
- Add history-related strings vào existing translations object
- Support cho cả 3 ngôn ngữ: EN, VI, LO
- Maintain font consistency (Phetsarath OT cho Lao text)

## Performance Considerations

### Memory Management
- Limit history items to 50 maximum
- Implement LRU (Least Recently Used) cleanup
- Compress long texts trong preview

### UI Performance
- Virtual scrolling cho large history lists
- Debounce search/filter functionality
- Lazy loading cho history items

### Storage Optimization
- Store only essential data
- Implement data compression cho large texts
- Regular cleanup của expired items