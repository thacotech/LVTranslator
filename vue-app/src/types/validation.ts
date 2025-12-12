// ===== VALIDATION AND ERROR HANDLING TYPES =====

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
  severity: 'error' | 'warning' | 'info' | 'success'
}

export interface ValidationWarning {
  field: string
  message: string
  code: string
}

export interface ErrorMessage {
  title: string
  description: string
  action?: string
  severity: 'error' | 'warning' | 'info' | 'success'
  timestamp?: Date
}

export interface ApiError {
  code: string
  message: string
  details?: any
  statusCode?: number
}

export interface NetworkError {
  type: 'CONNECTION_ERROR' | 'TIMEOUT_ERROR' | 'AUTHENTICATION_ERROR' | 'RATE_LIMIT_ERROR' | 'SERVER_ERROR' | 'UNKNOWN_ERROR'
  message: string
  retryable: boolean
  retryAfter?: number
}

// Validation rules
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => boolean | string
}

export interface ValidationSchema {
  [field: string]: ValidationRule
}

// Error codes
export const ERROR_CODES = {
  // Translation errors
  TRANSLATION_FAILED: 'TRANSLATION_FAILED',
  INVALID_LANGUAGE: 'INVALID_LANGUAGE',
  TEXT_TOO_LONG: 'TEXT_TOO_LONG',
  EMPTY_TEXT: 'EMPTY_TEXT',
  
  // File errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UNSUPPORTED_FILE_TYPE: 'UNSUPPORTED_FILE_TYPE',
  FILE_CORRUPTED: 'FILE_CORRUPTED',
  EXTRACTION_FAILED: 'EXTRACTION_FAILED',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // Storage errors
  STORAGE_FULL: 'STORAGE_FULL',
  STORAGE_ERROR: 'STORAGE_ERROR',
  
  // General errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR'
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]