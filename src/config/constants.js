/**
 * Application Constants and Configuration
 */

export const APP_CONFIG = {
  name: 'LVTranslator',
  version: '2.0.0',
  description: 'Vietnamese ↔ Lao Translator with AI-powered translation'
};

export const LANGUAGES = {
  VI: 'vi',
  LO: 'lo',
  EN: 'en'
};

export const LANGUAGE_NAMES = {
  [LANGUAGES.VI]: 'Vietnamese',
  [LANGUAGES.LO]: 'Lao',
  [LANGUAGES.EN]: 'English'
};

export const LANGUAGE_FLAGS = {
  [LANGUAGES.VI]: '🇻🇳',
  [LANGUAGES.LO]: '🇱🇦',
  [LANGUAGES.EN]: '🇬🇧'
};

export const API_CONFIG = {
  // Backend API endpoint (will be proxied through Vercel)
  endpoint: '/api/translate',
  healthEndpoint: '/api/health',
  timeout: 30000, // 30 seconds
  retries: 3
};

export const FILE_CONFIG = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    txt: 'text/plain'
  },
  allowedExtensions: ['.pdf', '.docx', '.png', '.jpg', '.jpeg', '.txt']
};

export const CACHE_CONFIG = {
  maxSize: 100, // Maximum number of cached translations
  ttl: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
};

export const DEBOUNCE_CONFIG = {
  translationDelay: 500, // 500ms delay for translation requests
  searchDelay: 300, // 300ms delay for search inputs
  resizeDelay: 150 // 150ms delay for window resize
};

export const STORAGE_CONFIG = {
  prefix: 'lvt_', // Prefix for all localStorage keys
  maxItems: 50, // Maximum number of history items
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
  compressionEnabled: true,
  encryptionEnabled: true
};

export const STORAGE_KEYS = {
  HISTORY: 'lvt_history',
  SETTINGS: 'lvt_settings',
  CACHE: 'lvt_cache',
  FAVORITES: 'lvt_favorites',
  USER_PREFERENCES: 'lvt_user_preferences',
  LAST_USED: 'lvt_last_used'
};

export const VALIDATION_CONFIG = {
  minTextLength: 1,
  maxTextLength: 10000, // 10,000 characters
  allowEmptyTranslation: false
};

export const UI_CONFIG = {
  animationDuration: 250, // milliseconds
  toastDuration: 3000, // 3 seconds
  loadingDelay: 200, // Delay before showing loading indicator
  virtualScrollItemHeight: 80 // Height of each history item in pixels
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Lỗi kết nối mạng. Vui lòng kiểm tra internet.',
  API_ERROR: 'Lỗi kết nối đến dịch vụ. Vui lòng thử lại.',
  RATE_LIMIT: 'Bạn đã vượt quá giới hạn. Vui lòng đợi một chút.',
  FILE_TOO_LARGE: 'File quá lớn. Vui lòng chọn file nhỏ hơn 10MB.',
  INVALID_FILE_TYPE: 'Định dạng file không được hỗ trợ.',
  TEXT_TOO_LONG: 'Văn bản vượt quá giới hạn 10,000 ký tự.',
  EMPTY_TEXT: 'Vui lòng nhập văn bản cần dịch.',
  ENCRYPTION_ERROR: 'Lỗi bảo mật dữ liệu.',
  STORAGE_QUOTA_EXCEEDED: 'Bộ nhớ đã đầy. Vui lòng xóa một số lịch sử.',
  WORKER_ERROR: 'Lỗi xử lý file. Vui lòng thử lại.',
  UNKNOWN_ERROR: 'Đã xảy ra lỗi. Vui lòng thử lại.'
};

export const SUCCESS_MESSAGES = {
  TRANSLATION_COMPLETE: 'Dịch thuật hoàn tất!',
  FILE_PROCESSED: 'File đã được xử lý thành công!',
  COPIED_TO_CLIPBOARD: 'Đã sao chép vào clipboard!',
  HISTORY_CLEARED: 'Đã xóa lịch sử!',
  SETTINGS_SAVED: 'Đã lưu cài đặt!',
  EXPORT_SUCCESS: 'Đã xuất dữ liệu thành công!',
  IMPORT_SUCCESS: 'Đã nhập dữ liệu thành công!'
};

export const LIBRARY_URLS = {
  dompurify: 'https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.6/purify.min.js',
  mammoth: 'https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js',
  pdfjs: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'pdfjs-worker': 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  tesseract: 'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js',
  'lz-string': 'https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.5.0/lz-string.min.js'
};

export const FEATURE_FLAGS = {
  enableEncryption: true,
  enableCompression: true,
  enableCache: true,
  enableWebWorkers: true,
  enableOfflineMode: false, // Future feature
  enableAnalytics: false // Future feature
};

export const PERFORMANCE_THRESHOLDS = {
  pageLoadTime: 2000, // 2 seconds
  translationTime: 3000, // 3 seconds
  fileProcessingTime: 5000, // 5 seconds per MB
  cacheHitRate: 0.3 // 30% minimum cache hit rate
};

// Export all as default for convenience
export default {
  APP_CONFIG,
  LANGUAGES,
  LANGUAGE_NAMES,
  LANGUAGE_FLAGS,
  API_CONFIG,
  FILE_CONFIG,
  CACHE_CONFIG,
  DEBOUNCE_CONFIG,
  STORAGE_CONFIG,
  STORAGE_KEYS,
  VALIDATION_CONFIG,
  UI_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LIBRARY_URLS,
  FEATURE_FLAGS,
  PERFORMANCE_THRESHOLDS
};

