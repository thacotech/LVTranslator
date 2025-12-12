// ===== ENUMS AND CONSTANTS =====

// Language types
export type Language = 'vi' | 'lo' | 'en'
export type TranslationDirection = 'vi-lo' | 'lo-vi' | 'vi-en' | 'en-vi' | 'lo-en' | 'en-lo'

// UI and Theme types
export type Theme = 'light' | 'dark'
export type FontSize = 'small' | 'medium' | 'large'
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

// File types
export type FileType = 'docx' | 'pdf' | 'image' | 'txt'

// Notification and error types
export type NotificationSeverity = 'error' | 'warning' | 'info' | 'success'
export type NetworkErrorType = 
  | 'CONNECTION_ERROR'
  | 'TIMEOUT_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR'

// Component sizes
export type ComponentSize = 'small' | 'default' | 'large'

// Sort orders
export type SortOrder = 'asc' | 'desc'

// Event types
export type TranslationEventType = 'translation-complete' | 'translation-error' | 'translation-start'
export type FileUploadEventType = 'file-uploaded' | 'file-processed' | 'processing-error' | 'upload-progress'
export type HistoryEventType = 'history-item-selected' | 'history-cleared' | 'history-item-deleted'

// Language constants
export const SUPPORTED_LANGUAGES: Language[] = ['vi', 'lo', 'en']
export const DEFAULT_LANGUAGE: Language = 'vi'

// File constants
export const SUPPORTED_FILE_TYPES: FileType[] = ['docx', 'pdf', 'image', 'txt']
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const MAX_TEXT_LENGTH = 5000

// UI constants
export const DEFAULT_THEME: Theme = 'light'
export const DEFAULT_FONT_SIZE: FontSize = 'medium'
export const MAX_HISTORY_ITEMS = 100