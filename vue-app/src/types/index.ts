// ===== IMPORTS =====
import type { 
  Language, 
  FileType, 
  LoadingState, 
  Theme, 
  FontSize
} from './enums'

import type {
  ValidationResult,
  ValidationError,
  ValidationWarning
} from './validation'

// ===== CORE DATA MODELS =====

// Translation models
export interface Translation {
  id: string
  sourceText: string
  translatedText: string
  sourceLanguage: Language
  targetLanguage: Language
  timestamp: Date
  confidence?: number
}

export interface TranslationResult {
  translatedText: string
  confidence: number
  alternatives?: string[]
  metadata?: TranslationMetadata
}

export interface TranslationMetadata {
  processingTime: number
  characterCount: number
  wordCount: number
}

// ===== FILE PROCESSING MODELS =====

export interface ProcessedFile {
  id: string
  name: string
  type: FileType
  size: number
  content: string
  metadata: FileMetadata
  extractedText: string
  processingStatus: LoadingState
  error?: string
}

export interface FileMetadata {
  pages?: number
  images?: number
  tables?: number
  processingTime: number
}

// ===== UI STATE MODELS =====

export interface UIState {
  isLoading: boolean
  error: string | null
  success: string | null
  theme: Theme
  sidebarOpen: boolean
  modalOpen: boolean
  drawerOpen: boolean
  currentView: string
}

// Global application state
export interface AppState {
  ui: UIState
  translation: TranslationState
  settings: SettingsState
  initialized: boolean
}

// ===== USER PREFERENCES AND SETTINGS =====

export interface UserPreferences {
  autoDetectLanguage: boolean
  saveHistory: boolean
  maxHistoryItems: number
  defaultSourceLanguage: Language
  defaultTargetLanguage: Language
  enableTTS: boolean
  enableSTT: boolean
  fontSize: FontSize
  autoSave: boolean
  showConfidenceScore: boolean
  enableKeyboardShortcuts: boolean
  compactMode: boolean
}

// ===== CORE DATA MODELS =====

// History models
export interface HistoryItem {
  id: number
  sourceText: string
  translatedText: string
  direction: string
  timestamp: number
  preview: {
    source: string
    translated: string
  }
}

// API Response types
export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string
      }>
    }
  }>
}



// ===== COMPONENT PROPS TYPES =====

export interface TranslationFormProps {
  modelValue?: string
  sourceLanguage?: Language
  targetLanguage?: Language
  loading?: boolean
  disabled?: boolean
  placeholder?: string
}

export interface FileUploaderProps {
  acceptedTypes?: string[]
  maxSize?: number
  multiple?: boolean
  disabled?: boolean
}

export interface HistoryItemProps {
  item: HistoryItem
  showActions?: boolean
  compact?: boolean
}

export interface LanguageSelectorProps {
  modelValue: Language
  languages: Language[]
  disabled?: boolean
  size?: 'small' | 'default' | 'large'
}

export interface ThemeToggleProps {
  modelValue: Theme
  size?: 'small' | 'default' | 'large'
}

// ===== EVENT TYPES =====

export interface TranslationEvent {
  type: 'translation-complete' | 'translation-error' | 'translation-start'
  data?: any
  timestamp: Date
}

export interface FileUploadEvent {
  type: 'file-uploaded' | 'file-processed' | 'processing-error' | 'upload-progress'
  file?: File | ProcessedFile
  progress?: number
  error?: string
  timestamp: Date
}

export interface HistoryEvent {
  type: 'history-item-selected' | 'history-cleared' | 'history-item-deleted'
  item?: HistoryItem
  timestamp: Date
}

// ===== STORE STATE TYPES =====

export interface TranslationState {
  currentTranslation: Translation | null
  history: HistoryItem[]
  isLoading: boolean
  error: string | null
  sourceLanguage: Language
  targetLanguage: Language
  cache: Map<string, TranslationResult>
  lastTranslationTime: Date | null
}

export interface SettingsState {
  language: Language
  theme: Theme
  preferences: UserPreferences
  isInitialized: boolean
  lastSaved: Date | null
}

export interface FileState {
  currentFile: ProcessedFile | null
  processingQueue: File[]
  isProcessing: boolean
  error: string | null
  supportedTypes: FileType[]
  maxFileSize: number
}

// ===== CONFIGURATION TYPES =====

export interface AppConfig {
  apiEndpoint: string
  apiKey: string
  maxRetries: number
  retryDelay: number
  cacheTimeout: number
  supportedLanguages: Language[]
  defaultLanguage: Language
  maxHistoryItems: number
  maxFileSize: number
  supportedFileTypes: FileType[]
}

export interface I18nConfig {
  locale: Language
  fallbackLocale: Language
  messages: Record<Language, Record<string, string>>
  pluralizationRules: Record<Language, (choice: number) => number>
}

// ===== UTILITY TYPES =====

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  error?: ApiError
  timestamp: Date
}

// Pagination types
export interface PaginationOptions {
  page: number
  pageSize: number
  total?: number
}

export interface PaginatedResult<T> {
  items: T[]
  pagination: PaginationOptions
  hasMore: boolean
}

// Search and filter types
export interface SearchOptions {
  query: string
  filters?: Record<string, any>
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Cache types
export interface CacheEntry<T> {
  data: T
  timestamp: Date
  expiresAt: Date
}

export interface CacheOptions {
  ttl: number // Time to live in milliseconds
  maxSize: number
}

// Performance monitoring types
export interface PerformanceMetrics {
  pageLoadTime: number
  translationTime: number
  fileProcessingTime: number
  memoryUsage: number
  bundleSize: number
}

// Accessibility types
export interface AccessibilityOptions {
  highContrast: boolean
  reducedMotion: boolean
  screenReaderOptimized: boolean
  keyboardNavigation: boolean
}

// ===== STORE ACTION TYPES =====

export interface TranslationActions {
  translate(text: string, from: Language, to: Language): Promise<void>
  addToHistory(translation: Translation): void
  clearHistory(): void
  loadHistory(): Promise<void>
  swapLanguages(): void
  setSourceLanguage(language: Language): void
  setTargetLanguage(language: Language): void
}

export interface SettingsActions {
  setLanguage(language: Language): void
  setTheme(theme: Theme): void
  updatePreferences(preferences: Partial<UserPreferences>): void
  resetToDefaults(): void
  saveSettings(): Promise<void>
  loadSettings(): Promise<void>
}

export interface FileActions {
  uploadFile(file: File): Promise<void>
  processFile(file: File): Promise<ProcessedFile>
  removeFile(fileId: string): void
  clearQueue(): void
}

// ===== ROUTER TYPES =====

export interface RouteMetadata {
  title: string
  requiresAuth?: boolean
  layout?: string
  keepAlive?: boolean
}

// ===== TESTING TYPES =====

export interface TestContext {
  wrapper: any
  store: any
  router: any
  i18n: any
}

export interface MockData {
  translations: Translation[]
  files: ProcessedFile[]
  preferences: UserPreferences
}

// ===== RE-EXPORTS =====
export * from './enums'
export * from './validation'
export * from './services'

// ===== SERVICE RE-EXPORTS =====
export type {
  TranslationService,
  FileProcessorService,
  StorageService,
  StorageInfo,
  CacheEntry,
  CacheOptions
} from './services'