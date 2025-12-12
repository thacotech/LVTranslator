import type { 
  ValidationResult, 
  ValidationError, 
  ValidationWarning, 
  ValidationRule, 
  ValidationSchema,
  Language,
  FileType,
  MAX_TEXT_LENGTH,
  MAX_FILE_SIZE,
  SUPPORTED_FILE_TYPES
} from '@/types'

export class ValidationUtils {
  static validateText(text: string): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    if (!text.trim()) {
      errors.push({
        field: 'text',
        message: 'Text cannot be empty',
        code: 'EMPTY_TEXT',
        severity: 'error'
      })
    }

    if (text.length > MAX_TEXT_LENGTH) {
      errors.push({
        field: 'text',
        message: `Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters`,
        code: 'TEXT_TOO_LONG',
        severity: 'error'
      })
    }

    if (text.length > MAX_TEXT_LENGTH * 0.8) {
      warnings.push({
        field: 'text',
        message: 'Text is approaching maximum length limit',
        code: 'TEXT_LENGTH_WARNING'
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  static validateLanguage(language: string): ValidationResult {
    const errors: ValidationError[] = []
    const supportedLanguages: Language[] = ['vi', 'lo', 'en']

    if (!supportedLanguages.includes(language as Language)) {
      errors.push({
        field: 'language',
        message: `Unsupported language: ${language}`,
        code: 'INVALID_LANGUAGE',
        severity: 'error'
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    }
  }

  static validateFile(file: File): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      errors.push({
        field: 'file',
        message: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
        code: 'FILE_TOO_LARGE',
        severity: 'error'
      })
    }

    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    if (!fileExtension || !SUPPORTED_FILE_TYPES.includes(fileExtension as FileType)) {
      errors.push({
        field: 'file',
        message: 'Unsupported file type',
        code: 'UNSUPPORTED_FILE_TYPE',
        severity: 'error'
      })
    }

    // Check if file is empty
    if (file.size === 0) {
      errors.push({
        field: 'file',
        message: 'File is empty',
        code: 'EMPTY_FILE',
        severity: 'error'
      })
    }

    // Warning for large files
    if (file.size > MAX_FILE_SIZE * 0.8) {
      warnings.push({
        field: 'file',
        message: 'Large file may take longer to process',
        code: 'LARGE_FILE_WARNING'
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  static validateSchema(data: any, schema: ValidationSchema): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    for (const [field, rule] of Object.entries(schema)) {
      const value = data[field]

      // Required validation
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field,
          message: `${field} is required`,
          code: 'REQUIRED_FIELD',
          severity: 'error'
        })
        continue
      }

      // Skip other validations if field is empty and not required
      if (!value && !rule.required) continue

      // Min length validation
      if (rule.minLength && value.length < rule.minLength) {
        errors.push({
          field,
          message: `${field} must be at least ${rule.minLength} characters`,
          code: 'MIN_LENGTH',
          severity: 'error'
        })
      }

      // Max length validation
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push({
          field,
          message: `${field} must not exceed ${rule.maxLength} characters`,
          code: 'MAX_LENGTH',
          severity: 'error'
        })
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push({
          field,
          message: `${field} format is invalid`,
          code: 'INVALID_FORMAT',
          severity: 'error'
        })
      }

      // Custom validation
      if (rule.custom) {
        const customResult = rule.custom(value)
        if (customResult !== true) {
          errors.push({
            field,
            message: typeof customResult === 'string' ? customResult : `${field} is invalid`,
            code: 'CUSTOM_VALIDATION',
            severity: 'error'
          })
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
}

// Composable for validation utilities
export function useValidation() {
  return ValidationUtils
}