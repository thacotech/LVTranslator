# Design Document

## Overview

Dự án LVTranslator hiện tại được xây dựng như một single-page application sử dụng HTML/CSS/JavaScript thuần với tất cả code trong một file index.html duy nhất. Để cải thiện khả năng bảo trì, mở rộng và phát triển, chúng ta sẽ refactor toàn bộ frontend sang Vue.js 3 framework với Ant Design Vue component library và hệ thống i18n chuyên nghiệp.

Việc refactor này sẽ chuyển đổi từ kiến trúc monolithic sang component-based architecture, tách biệt concerns, cải thiện code reusability và maintainability. Đồng thời, chúng ta sẽ tích hợp TypeScript để có type safety tốt hơn và development experience hiện đại.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Vue.js Application                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Components    │  │     Stores      │  │    i18n      │ │
│  │   (Ant Design)  │  │    (Pinia)      │  │  (Vue I18n)  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │    Services     │  │    Utilities    │  │   Workers    │ │
│  │  (Translation,  │  │  (Sanitizer,    │  │ (File Proc.) │ │
│  │   File Proc.)   │  │   Storage)      │  │              │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                     Backend APIs                            │
│              (Google Gemini, File Processing)               │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

```
App.vue
├── Layout/
│   ├── AppHeader.vue (Language selector, theme toggle)
│   ├── AppFooter.vue
│   └── AppSidebar.vue (History, settings)
├── Translation/
│   ├── TranslationForm.vue (Main translation interface)
│   ├── LanguageSelector.vue
│   ├── TextInput.vue
│   ├── TextOutput.vue
│   └── SwapLanguages.vue
├── FileUpload/
│   ├── FileUploader.vue
│   ├── FilePreview.vue
│   └── FileProcessor.vue
├── History/
│   ├── TranslationHistory.vue
│   ├── HistoryItem.vue
│   └── HistorySearch.vue
├── Features/
│   ├── TTSComponent.vue (Text-to-Speech)
│   ├── STTComponent.vue (Speech-to-Text)
│   └── ThemeToggle.vue
└── Common/
    ├── LoadingSpinner.vue
    ├── ErrorMessage.vue
    ├── SuccessMessage.vue
    └── ConfirmDialog.vue
```

## Components and Interfaces

### Core Components

#### 1. App.vue (Root Component)
- **Purpose**: Main application container, routing, global state management
- **Props**: None
- **Events**: None
- **State**: Global application state, current route
- **Dependencies**: Pinia stores, Vue Router, i18n

#### 2. TranslationForm.vue
- **Purpose**: Main translation interface with input/output areas
- **Props**: None
- **Events**: `translation-complete`, `translation-error`
- **State**: Input text, output text, loading state, selected languages
- **Dependencies**: Translation service, file upload service

#### 3. FileUploader.vue
- **Purpose**: Handle file upload and processing (DOCX, PDF, images)
- **Props**: `acceptedTypes: string[]`, `maxSize: number`
- **Events**: `file-uploaded`, `file-processed`, `processing-error`
- **State**: Upload progress, processing status, file metadata
- **Dependencies**: FileProcessorService, Web Workers

#### 4. TranslationHistory.vue
- **Purpose**: Display and manage translation history
- **Props**: None
- **Events**: `history-item-selected`, `history-cleared`
- **State**: History items, search query, pagination
- **Dependencies**: StorageManager, history store

### Service Layer

#### 1. TranslationService
```typescript
interface TranslationService {
  translate(text: string, from: Language, to: Language): Promise<TranslationResult>
  detectLanguage(text: string): Promise<Language>
  validateInput(text: string): ValidationResult
}
```

#### 2. FileProcessorService
```typescript
interface FileProcessorService {
  processFile(file: File): Promise<ProcessedFile>
  validateFile(file: File): ValidationResult
  extractText(file: File, type: FileType): Promise<string>
}
```

#### 3. StorageService
```typescript
interface StorageService {
  save(key: string, data: any): Promise<void>
  load(key: string): Promise<any>
  remove(key: string): Promise<void>
  clear(): Promise<void>
}
```

### Store Interfaces (Pinia)

#### 1. Translation Store
```typescript
interface TranslationStore {
  state: {
    currentTranslation: Translation | null
    history: Translation[]
    isLoading: boolean
    error: string | null
  }
  actions: {
    translate(text: string, from: Language, to: Language): Promise<void>
    addToHistory(translation: Translation): void
    clearHistory(): void
    loadHistory(): Promise<void>
  }
}
```

#### 2. Settings Store
```typescript
interface SettingsStore {
  state: {
    language: Language
    theme: Theme
    preferences: UserPreferences
  }
  actions: {
    setLanguage(language: Language): void
    setTheme(theme: Theme): void
    updatePreferences(preferences: Partial<UserPreferences>): void
  }
}
```

## Data Models

### Core Data Types

```typescript
// Language types
type Language = 'vi' | 'lo' | 'en'
type TranslationDirection = 'vi-lo' | 'lo-vi'

// Translation models
interface Translation {
  id: string
  sourceText: string
  translatedText: string
  sourceLanguage: Language
  targetLanguage: Language
  timestamp: Date
  confidence?: number
}

interface TranslationResult {
  translatedText: string
  confidence: number
  alternatives?: string[]
  metadata?: TranslationMetadata
}

interface TranslationMetadata {
  processingTime: number
  characterCount: number
  wordCount: number
}

// File processing models
interface ProcessedFile {
  id: string
  name: string
  type: FileType
  size: number
  content: string
  metadata: FileMetadata
  extractedText: string
}

type FileType = 'docx' | 'pdf' | 'image' | 'txt'

interface FileMetadata {
  pages?: number
  images?: number
  tables?: number
  processingTime: number
}

// UI State models
interface UIState {
  isLoading: boolean
  error: string | null
  success: string | null
  theme: 'light' | 'dark'
  sidebarOpen: boolean
}

// User preferences
interface UserPreferences {
  autoDetectLanguage: boolean
  saveHistory: boolean
  maxHistoryItems: number
  defaultSourceLanguage: Language
  defaultTargetLanguage: Language
  enableTTS: boolean
  enableSTT: boolean
  fontSize: 'small' | 'medium' | 'large'
}

// Validation models
interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

interface ValidationError {
  field: string
  message: string
  code: string
}

interface ValidationWarning {
  field: string
  message: string
  code: string
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After reviewing all properties identified in the prework analysis, I identified several areas where properties can be consolidated:

- **Translation functionality properties** (1.1, 4.1, 7.5) can be combined into comprehensive translation behavior properties
- **i18n properties** (3.1-3.5) are all distinct and provide unique validation value
- **Performance properties** (6.1-6.5) each test different aspects and should remain separate
- **UI component properties** (8.2-8.5) test different UI behaviors and should remain separate
- **File processing and theme properties** (4.2, 4.4) are distinct functional areas

The remaining properties provide unique validation value and should be maintained as separate properties.

**Property 1: Translation functionality preservation**
*For any* valid text input and language pair (Vietnamese ↔ Lao), the VueJS application should produce the same translation results as the original HTML/CSS/JS application
**Validates: Requirements 1.1, 4.1, 7.5**

**Property 2: Responsive design behavior**
*For any* screen size within the supported range (320px to 1920px width), the application should maintain proper layout and functionality using Ant Design's grid system
**Validates: Requirements 2.3**

**Property 3: Interface language support**
*For any* supported interface language (Vietnamese, Lao, English), the i18n system should provide complete translations for all UI elements
**Validates: Requirements 3.1, 3.4**

**Property 4: Dynamic language switching**
*For any* interface language change, the application should update all UI text immediately without requiring a page reload
**Validates: Requirements 3.2**

**Property 5: Language persistence**
*For any* selected interface language, the choice should be preserved across browser sessions and restored on application restart
**Validates: Requirements 3.3**

**Property 6: Pluralization handling**
*For any* numeric value and supported language, the i18n system should apply correct pluralization rules specific to that language
**Validates: Requirements 3.5**

**Property 7: File processing preservation**
*For any* supported file type (DOCX, PDF, image), the VueJS application should extract and process text with the same accuracy as the original application
**Validates: Requirements 4.2**

**Property 8: Translation history persistence**
*For any* completed translation, the result should be automatically saved to local storage and remain accessible across browser sessions
**Validates: Requirements 4.3**

**Property 9: Theme switching functionality**
*For any* theme change (light/dark), the application should immediately update all UI elements to reflect the new theme without page reload
**Validates: Requirements 4.4**

**Property 10: Accessibility preservation**
*For any* keyboard shortcut or accessibility feature from the original application, the same functionality should be available in the VueJS version
**Validates: Requirements 4.5**

**Property 11: Component communication**
*For any* parent-child component interaction, data should flow correctly through props and events without data loss or corruption
**Validates: Requirements 5.2**

**Property 12: Lazy loading behavior**
*For any* heavy component or library, loading should occur only when needed and not during initial application startup
**Validates: Requirements 6.1**

**Property 13: Code splitting optimization**
*For any* application build, the bundler should generate multiple chunks with no single chunk exceeding reasonable size limits
**Validates: Requirements 6.2**

**Property 14: Performance maintenance**
*For any* key performance metric (page load time, time to interactive), the VueJS application should perform equal to or better than the original application
**Validates: Requirements 6.3**

**Property 15: Translation caching**
*For any* repeated translation request with identical input and language pair, the result should be served from cache without making a new API call
**Validates: Requirements 6.4**

**Property 16: Efficient reactivity**
*For any* state change, only components that depend on the changed state should re-render, minimizing unnecessary updates
**Validates: Requirements 6.5**

**Property 17: Notification system functionality**
*For any* user action requiring feedback, appropriate notifications should appear using Ant Design's notification system
**Validates: Requirements 8.2**

**Property 18: Loading state indicators**
*For any* asynchronous operation, appropriate loading states and progress indicators should be displayed using Ant Design components
**Validates: Requirements 8.3**

**Property 19: Modal and drawer functionality**
*For any* secondary interface (settings, history details), Ant Design modal or drawer components should open and close correctly
**Validates: Requirements 8.4**

**Property 20: Accessibility standards compliance**
*For any* UI interaction, accessibility standards should be maintained through Ant Design's built-in accessibility features
**Validates: Requirements 8.5**

## Error Handling

### Error Categories

#### 1. Translation Errors
- **API Errors**: Network failures, API rate limits, invalid API keys
- **Input Validation Errors**: Empty text, unsupported characters, text too long
- **Language Detection Errors**: Unable to detect source language

#### 2. File Processing Errors
- **Upload Errors**: File too large, unsupported format, corrupted file
- **Processing Errors**: Unable to extract text, OCR failures, parsing errors
- **Security Errors**: Malicious file detection, virus scanning failures

#### 3. Storage Errors
- **Quota Exceeded**: localStorage full, unable to save history
- **Data Corruption**: Invalid stored data, version mismatch
- **Access Denied**: Storage blocked by browser settings

#### 4. Network Errors
- **Connection Errors**: No internet, server unreachable
- **Timeout Errors**: Request timeout, slow response
- **Authentication Errors**: Invalid credentials, expired tokens

### Error Handling Strategy

#### 1. User-Friendly Error Messages
```typescript
interface ErrorMessage {
  title: string
  description: string
  action?: string
  severity: 'error' | 'warning' | 'info'
}

const errorMessages: Record<string, ErrorMessage> = {
  'TRANSLATION_FAILED': {
    title: 'Translation Failed',
    description: 'Unable to translate text. Please try again.',
    action: 'Retry',
    severity: 'error'
  },
  'FILE_TOO_LARGE': {
    title: 'File Too Large',
    description: 'File size exceeds 10MB limit. Please choose a smaller file.',
    severity: 'warning'
  }
}
```

#### 2. Retry Mechanisms
- **Exponential Backoff**: For network failures
- **Circuit Breaker**: For repeated API failures
- **Fallback Options**: Alternative processing methods

#### 3. Error Recovery
- **Auto-save**: Preserve user input during errors
- **State Recovery**: Restore previous working state
- **Graceful Degradation**: Disable features instead of breaking

## Testing Strategy

### Dual Testing Approach

The testing strategy combines unit testing and property-based testing to provide comprehensive coverage:

- **Unit tests** verify specific examples, edge cases, and error conditions
- **Property tests** verify universal properties that should hold across all inputs
- Together they provide comprehensive coverage: unit tests catch concrete bugs, property tests verify general correctness

### Unit Testing

Unit tests will cover:
- Component rendering and behavior with specific props
- Service method functionality with known inputs
- Error handling with specific error conditions
- Integration points between components
- User interaction flows with specific scenarios

**Testing Framework**: Vitest with Vue Test Utils
**Coverage Target**: 80% code coverage for critical paths

### Property-Based Testing

Property-based tests will verify the correctness properties defined above using **fast-check** library for JavaScript/TypeScript.

**Configuration Requirements**:
- Each property-based test must run a minimum of 100 iterations
- Each test must be tagged with a comment referencing the design document property
- Tag format: `**Feature: vuejs-refactor, Property {number}: {property_text}**`

**Example Property Test Structure**:
```typescript
// **Feature: vuejs-refactor, Property 1: Translation functionality preservation**
test('translation results should match original application', () => {
  fc.assert(fc.property(
    fc.string({ minLength: 1, maxLength: 1000 }),
    fc.constantFrom('vi', 'lo'),
    fc.constantFrom('vi', 'lo'),
    async (text, sourceLang, targetLang) => {
      if (sourceLang === targetLang) return true;
      
      const vueResult = await vueTranslationService.translate(text, sourceLang, targetLang);
      const originalResult = await originalTranslationService.translate(text, sourceLang, targetLang);
      
      return vueResult.translatedText === originalResult.translatedText;
    }
  ), { numRuns: 100 });
});
```

### Integration Testing

Integration tests will verify:
- End-to-end translation workflows
- File upload and processing flows
- Cross-component communication
- API integration functionality

### Performance Testing

Performance tests will verify:
- Page load times meet requirements
- Bundle sizes are optimized
- Memory usage is reasonable
- Lazy loading works correctly

### Accessibility Testing

Accessibility tests will verify:
- Keyboard navigation works correctly
- Screen reader compatibility
- ARIA attributes are properly set
- Color contrast meets standards