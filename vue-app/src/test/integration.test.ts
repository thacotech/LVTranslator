import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import { ConfigProvider } from 'ant-design-vue'
import TranslationForm from '@/components/translation/TranslationForm.vue'
import FileUploader from '@/components/file/FileUploader.vue'
import TranslationHistory from '@/components/history/TranslationHistory.vue'
import { useTranslationStore } from '@/stores/translation'
import { useSettingsStore } from '@/stores/settings'
import type { Language } from '@/types'

// Mock services
vi.mock('@/services/translationService', () => ({
  useTranslationService: () => ({
    translate: vi.fn().mockResolvedValue({
      translatedText: 'Translated text',
      confidence: 0.9,
      metadata: {
        processingTime: 100,
        characterCount: 10,
        wordCount: 2
      }
    }),
    validateInput: vi.fn().mockReturnValue({
      isValid: true,
      errors: [],
      warnings: []
    })
  })
}))

vi.mock('@/services/fileProcessorService', () => ({
  useFileProcessorService: () => ({
    processFile: vi.fn().mockResolvedValue({
      id: 'test-file-id',
      name: 'test.txt',
      type: 'txt',
      size: 1024,
      content: 'Test file content',
      extractedText: 'Test file content',
      processingStatus: 'success',
      metadata: {
        processingTime: 50
      }
    }),
    validateFile: vi.fn().mockReturnValue({
      isValid: true,
      errors: [],
      warnings: []
    })
  })
}))

vi.mock('@/services/notificationService', () => ({
  useNotification: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showWarning: vi.fn(),
    showInfo: vi.fn(),
    showErrorMessage: vi.fn()
  })
}))

vi.mock('@/composables/useScreenReader', () => ({
  useScreenReader: () => ({
    announceTranslationStart: vi.fn(),
    announceTranslationComplete: vi.fn(),
    announceTranslationError: vi.fn(),
    announceSettingChange: vi.fn()
  })
}))

vi.mock('@/composables/useKeyboardNavigation', () => ({
  useKeyboardNavigation: () => ({
    isShortcutHelpVisible: { value: false }
  })
}))

vi.mock('@/composables/useOptimizedReactivity', () => ({
  useDebouncedRef: (initial: any) => [{ value: initial }, { value: initial }],
  useCachedComputed: (fn: () => any) => ({ value: fn() }),
  useMemoizedFunction: (fn: any) => fn,
  useSelectiveWatch: vi.fn()
}))

// Create test utilities
function createTestWrapper(component: any, props = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)

  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    messages: {
      en: {
        translation: {
          inputText: 'Input Text',
          translation: 'Translation',
          translate: 'Translate',
          clear: 'Clear',
          copyTranslation: 'Copy Translation',
          switchLanguages: 'Switch Languages',
          enterTextPlaceholder: 'Enter text to translate...',
          translationPlaceholder: 'Translation will appear here...'
        },
        languages: {
          vietnamese: 'Vietnamese',
          lao: 'Lao',
          english: 'English'
        },
        accessibility: {
          selectSourceLanguage: 'Select source language',
          selectTargetLanguage: 'Select target language',
          characterCount: 'Character count: {count} of {limit}',
          clearAllText: 'Clear all text',
          copyTranslationToClipboard: 'Copy translation to clipboard',
          translationInProgress: 'Translation in progress...'
        },
        messages: {
          enterTextToTranslate: 'Please enter text to translate',
          textLimitExceeded: 'Text limit exceeded',
          translationCompleted: 'Translation completed',
          translationFailed: 'Translation failed',
          noTranslationToCopy: 'No translation to copy',
          translationCopied: 'Translation copied to clipboard'
        },
        fileUpload: {
          dragDropText: 'Click or drag file to this area to upload',
          supportedFormats: 'Supported formats: {formats}',
          maxSize: 'Maximum size: {size}',
          uploading: 'Uploading',
          uploadSuccess: 'File uploaded successfully',
          uploadError: 'Upload failed: {error}'
        },
        history: {
          translationHistory: 'Translation History',
          recentTranslations: 'Recent Translations',
          clearAllHistory: 'Clear All History',
          searchPlaceholder: 'Search translations...',
          filterByDirection: 'Filter by direction',
          sortBy: 'Sort by',
          newest: 'Newest',
          oldest: 'Oldest',
          noHistoryYet: 'No translation history yet',
          historySubtext: 'Your translations will appear here',
          noResultsFound: 'No results found',
          tryDifferentSearch: 'Try a different search term',
          paginationInfo: 'Showing {start}-{end} of {total} items',
          historyLoadedFromHistory: 'Translation loaded from history',
          confirmDeleteItem: 'Delete this translation?',
          confirmDeleteItemContent: 'This action cannot be undone',
          historyItemDeleted: 'Translation deleted',
          exportSuccess: 'Translation exported successfully',
          exportFailed: 'Export failed',
          confirmClearHistory: 'Clear all history?',
          confirmClearHistoryContent: 'This will delete all translation history',
          historyCleared: 'History cleared'
        },
        common: {
          loading: 'Loading...',
          close: 'Close',
          retry: 'Retry'
        },
        error: {
          title: 'Error',
          unknown: 'Unknown error',
          translation: {
            title: 'Translation Error'
          },
          application: {
            title: 'Application Error',
            description: 'An unexpected error occurred'
          },
          network: {
            title: 'Network Error',
            description: 'Please check your connection'
          }
        }
      }
    }
  })

  return mount(component, {
    props,
    global: {
      plugins: [pinia, i18n],
      components: {
        'a-config-provider': ConfigProvider
      },
      stubs: {
        'a-button': true,
        'a-select': true,
        'a-select-option': true,
        'a-upload-dragger': true,
        'a-progress': true,
        'a-alert': true,
        'a-input-search': true,
        'a-list': true,
        'a-list-item': true,
        'a-pagination': true,
        'TextInput': true,
        'TextOutput': true,
        'HistoryItem': true,
        'FileOutlined': true
      }
    }
  })
}

describe('Integration Tests - Complete Translation Workflows', () => {
  let translationStore: ReturnType<typeof useTranslationStore>
  let settingsStore: ReturnType<typeof useSettingsStore>

  beforeEach(() => {
    const pinia = createPinia()
    setActivePinia(pinia)
    translationStore = useTranslationStore()
    settingsStore = useSettingsStore()
    
    // Reset stores
    translationStore.clearHistory()
    translationStore.setSourceLanguage('vi')
    translationStore.setTargetLanguage('lo')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('End-to-End Translation Workflow', () => {
    it('should complete a full translation workflow from input to history', async () => {
      // **Feature: vuejs-refactor, Integration Test: Complete translation workflow**
      // **Validates: Requirements 1.1, 4.1**
      
      const wrapper = createTestWrapper(TranslationForm)
      
      // Verify initial state
      expect(translationStore.sourceLanguage).toBe('vi')
      expect(translationStore.targetLanguage).toBe('lo')
      expect(translationStore.historyCount).toBe(0)
      
      // Simulate user input
      const inputText = 'Xin chào'
      await wrapper.setData({ inputText })
      
      // Trigger translation
      await wrapper.vm.translateText()
      
      // Verify translation was processed
      expect(translationStore.historyCount).toBe(1)
      
      const historyItem = translationStore.history[0]
      expect(historyItem.sourceText).toBe(inputText)
      expect(historyItem.translatedText).toBe('Translated text')
      expect(historyItem.direction).toBe('vi-lo')
      expect(historyItem.timestamp).toBeDefined()
    })

    it('should handle language switching during translation workflow', async () => {
      // **Feature: vuejs-refactor, Integration Test: Language switching workflow**
      // **Validates: Requirements 1.1, 4.1**
      
      const wrapper = createTestWrapper(TranslationForm)
      
      // Set initial text
      await wrapper.setData({ inputText: 'Hello', outputText: 'Xin chào' })
      
      // Switch languages
      await wrapper.vm.switchLanguages()
      
      // Verify languages were switched
      expect(translationStore.sourceLanguage).toBe('lo')
      expect(translationStore.targetLanguage).toBe('vi')
      
      // Verify text was swapped
      expect(wrapper.vm.inputText).toBe('Xin chào')
      expect(wrapper.vm.outputText).toBe('Hello')
    })

    it('should validate input before translation', async () => {
      // **Feature: vuejs-refactor, Integration Test: Input validation workflow**
      // **Validates: Requirements 1.1**
      
      const wrapper = createTestWrapper(TranslationForm)
      
      // Test empty input
      await wrapper.setData({ inputText: '' })
      await wrapper.vm.translateText()
      
      // Should not add to history
      expect(translationStore.historyCount).toBe(0)
      
      // Test text limit exceeded
      const longText = 'a'.repeat(6000)
      await wrapper.setData({ inputText: longText })
      
      expect(wrapper.vm.isLimitExceeded).toBe(true)
      
      await wrapper.vm.translateText()
      
      // Should not add to history
      expect(translationStore.historyCount).toBe(0)
    })
  })

  describe('File Upload and Processing Integration', () => {
    it('should process uploaded file and extract text for translation', async () => {
      // **Feature: vuejs-refactor, Integration Test: File processing workflow**
      // **Validates: Requirements 4.2**
      
      const wrapper = createTestWrapper(FileUploader)
      
      // Create mock file
      const mockFile = new File(['Test content'], 'test.txt', { type: 'text/plain' })
      
      // Simulate file upload
      const uploadOptions = {
        file: mockFile,
        onProgress: vi.fn(),
        onSuccess: vi.fn(),
        onError: vi.fn()
      }
      
      await wrapper.vm.handleUpload(uploadOptions)
      
      // Verify file was processed
      expect(uploadOptions.onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-file-id',
          name: 'test.txt',
          extractedText: 'Test file content',
          processingStatus: 'success'
        })
      )
    })

    it('should validate file before processing', async () => {
      // **Feature: vuejs-refactor, Integration Test: File validation workflow**
      // **Validates: Requirements 4.2**
      
      const wrapper = createTestWrapper(FileUploader)
      
      // Test invalid file type
      const invalidFile = new File(['content'], 'test.xyz', { type: 'application/unknown' })
      
      const result = wrapper.vm.beforeUpload(invalidFile)
      
      expect(result).toBe(false)
      expect(wrapper.vm.validationErrors.length).toBeGreaterThan(0)
    })

    it('should handle file processing errors gracefully', async () => {
      // **Feature: vuejs-refactor, Integration Test: File error handling**
      // **Validates: Requirements 4.2**
      
      // Mock file processor to throw error
      vi.mocked(require('@/services/fileProcessorService').useFileProcessorService).mockReturnValue({
        processFile: vi.fn().mockRejectedValue(new Error('Processing failed')),
        validateFile: vi.fn().mockReturnValue({ isValid: true, errors: [], warnings: [] })
      })
      
      const wrapper = createTestWrapper(FileUploader)
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' })
      
      const uploadOptions = {
        file: mockFile,
        onProgress: vi.fn(),
        onSuccess: vi.fn(),
        onError: vi.fn()
      }
      
      await wrapper.vm.handleUpload(uploadOptions)
      
      // Verify error was handled
      expect(uploadOptions.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Processing failed'
        })
      )
    })
  })

  describe('Cross-Component Communication and State Management', () => {
    it('should maintain consistent state across components', async () => {
      // **Feature: vuejs-refactor, Integration Test: State consistency**
      // **Validates: Requirements 5.2**
      
      // Create multiple component instances
      const translationWrapper = createTestWrapper(TranslationForm)
      const historyWrapper = createTestWrapper(TranslationHistory)
      
      // Add translation through TranslationForm
      await translationWrapper.setData({ inputText: 'Test text' })
      await translationWrapper.vm.translateText()
      
      // Verify history component reflects the change
      expect(translationStore.historyCount).toBe(1)
      expect(historyWrapper.vm.filteredHistory.length).toBe(1)
    })

    it('should handle store mutations correctly', async () => {
      // **Feature: vuejs-refactor, Integration Test: Store mutations**
      // **Validates: Requirements 5.2**
      
      const wrapper = createTestWrapper(TranslationForm)
      
      // Test language changes
      translationStore.setSourceLanguage('en')
      translationStore.setTargetLanguage('vi')
      
      await wrapper.vm.$nextTick()
      
      expect(translationStore.sourceLanguage).toBe('en')
      expect(translationStore.targetLanguage).toBe('vi')
      
      // Test loading state
      translationStore.setLoading(true)
      expect(translationStore.isLoading).toBe(true)
      
      translationStore.setLoading(false)
      expect(translationStore.isLoading).toBe(false)
    })

    it('should handle error states across components', async () => {
      // **Feature: vuejs-refactor, Integration Test: Error state management**
      // **Validates: Requirements 5.2**
      
      const wrapper = createTestWrapper(TranslationForm)
      
      // Set error state
      const errorMessage = 'Translation service unavailable'
      translationStore.setError(errorMessage)
      
      await wrapper.vm.$nextTick()
      
      expect(translationStore.error).toBe(errorMessage)
    })

    it('should persist and restore state correctly', async () => {
      // **Feature: vuejs-refactor, Integration Test: State persistence**
      // **Validates: Requirements 4.3**
      
      // Add some history
      translationStore.addToHistory({
        id: '1',
        sourceText: 'Test',
        translatedText: 'Translated',
        sourceLanguage: 'vi',
        targetLanguage: 'lo',
        timestamp: new Date()
      })
      
      // Verify localStorage was called
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'lvtranslator_history',
        expect.stringContaining('Test')
      )
      
      // Test language settings persistence
      translationStore.setSourceLanguage('en')
      expect(localStorage.setItem).toHaveBeenCalledWith('sourceLanguage', 'en')
    })
  })

  describe('Component Props and Events Communication', () => {
    it('should emit events correctly from FileUploader', async () => {
      // **Feature: vuejs-refactor, Integration Test: Component events**
      // **Validates: Requirements 5.2**
      
      const wrapper = createTestWrapper(FileUploader)
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' })
      
      const uploadOptions = {
        file: mockFile,
        onProgress: vi.fn(),
        onSuccess: vi.fn(),
        onError: vi.fn()
      }
      
      await wrapper.vm.handleUpload(uploadOptions)
      
      // Check if events were emitted
      const emittedEvents = wrapper.emitted()
      expect(emittedEvents['file-uploaded']).toBeDefined()
      expect(emittedEvents['file-processed']).toBeDefined()
    })

    it('should handle props changes correctly', async () => {
      // **Feature: vuejs-refactor, Integration Test: Props handling**
      // **Validates: Requirements 5.2**
      
      const wrapper = createTestWrapper(FileUploader, {
        acceptedTypes: ['.txt'],
        maxSize: 1024,
        disabled: false
      })
      
      expect(wrapper.vm.acceptedTypes).toEqual(['.txt'])
      expect(wrapper.vm.maxSize).toBe(1024)
      
      // Change props
      await wrapper.setProps({ disabled: true })
      expect(wrapper.props('disabled')).toBe(true)
    })
  })

  describe('Translation History Integration', () => {
    it('should filter and search history correctly', async () => {
      // **Feature: vuejs-refactor, Integration Test: History filtering**
      // **Validates: Requirements 4.3**
      
      // Add multiple history items
      translationStore.addToHistory({
        id: '1',
        sourceText: 'Hello world',
        translatedText: 'Xin chào thế giới',
        sourceLanguage: 'en',
        targetLanguage: 'vi',
        timestamp: new Date()
      })
      
      translationStore.addToHistory({
        id: '2',
        sourceText: 'Goodbye',
        translatedText: 'Tạm biệt',
        sourceLanguage: 'en',
        targetLanguage: 'vi',
        timestamp: new Date()
      })
      
      const wrapper = createTestWrapper(TranslationHistory)
      
      // Test search functionality
      await wrapper.setData({ searchQuery: 'Hello' })
      await wrapper.vm.$nextTick()
      
      const filtered = wrapper.vm.filteredHistory
      expect(filtered.length).toBe(1)
      expect(filtered[0].sourceText).toBe('Hello world')
    })

    it('should handle history item actions correctly', async () => {
      // **Feature: vuejs-refactor, Integration Test: History actions**
      // **Validates: Requirements 4.3**
      
      translationStore.addToHistory({
        id: '1',
        sourceText: 'Test',
        translatedText: 'Translated',
        sourceLanguage: 'vi',
        targetLanguage: 'lo',
        timestamp: new Date()
      })
      
      const wrapper = createTestWrapper(TranslationHistory)
      
      // Test delete action
      await wrapper.vm.deleteHistoryItem(1)
      
      // History should be empty after deletion (user confirms in modal)
      expect(translationStore.historyCount).toBe(0)
    })
  })
})