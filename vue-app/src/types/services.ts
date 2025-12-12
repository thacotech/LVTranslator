import type { 
  Language, 
  FileType, 
  TranslationResult, 
  ValidationResult, 
  ProcessedFile 
} from './index'

// ===== SERVICE INTERFACES =====

export interface TranslationService {
  translate(text: string, from: Language, to: Language): Promise<TranslationResult>
  detectLanguage(text: string): Promise<Language>
  validateInput(text: string): ValidationResult
  getCachedTranslation(text: string, from: Language, to: Language): TranslationResult | null
  clearCache(): void
}

export interface FileProcessorService {
  processFile(file: File): Promise<ProcessedFile>
  validateFile(file: File): ValidationResult
  extractText(file: File, type: FileType): Promise<string>
  getSupportedTypes(): FileType[]
  getMaxFileSize(): number
}

export interface StorageService {
  save(key: string, data: any): Promise<void>
  load<T>(key: string): Promise<T | null>
  remove(key: string): Promise<void>
  clear(): Promise<void>
  getStorageInfo(): Promise<StorageInfo>
}

export interface StorageInfo {
  used: number
  available: number
  quota: number
}

export interface CacheEntry<T> {
  data: T
  timestamp: Date
  expiresAt: Date
}

export interface CacheOptions {
  ttl: number // Time to live in milliseconds
  maxSize: number
}

export interface NotificationService {
  success(message: string, options?: NotificationOptions): void
  error(message: string, options?: NotificationOptions): void
  warning(message: string, options?: NotificationOptions): void
  info(message: string, options?: NotificationOptions): void
  clear(): void
}

export interface NotificationOptions {
  duration?: number
  closable?: boolean
  placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
}

export interface I18nService {
  t(key: string, params?: Record<string, any>): string
  setLocale(locale: Language): void
  getLocale(): Language
  hasTranslation(key: string, locale?: Language): boolean
}

export interface CacheService<T> {
  get(key: string): T | null
  set(key: string, value: T, ttl?: number): void
  delete(key: string): void
  clear(): void
  size(): number
}

export interface PerformanceService {
  startTimer(name: string): void
  endTimer(name: string): number
  getMetrics(): PerformanceMetrics
  clearMetrics(): void
}

export interface PerformanceMetrics {
  pageLoadTime: number
  translationTime: number
  fileProcessingTime: number
  memoryUsage: number
  bundleSize: number
}