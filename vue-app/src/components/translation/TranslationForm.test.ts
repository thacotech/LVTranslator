import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import { ConfigProvider, message } from 'ant-design-vue'
import TranslationForm from './TranslationForm.vue'
import { useTranslationStore } from '@/stores/translation'
import type { Language } from '@/types'

// Mock services
const mockTranslationService = {
  translate: vi.fn().mockResolvedValue({
    translatedText: 'Mocked translation',
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
}

vi.mock('@/services/translationService', () => ({
  useTranslationService: () => mockTranslationService
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

vi.mock('@/composables/useOptimizedReactivity', () => ({
  useDebouncedRef: (initial: any) => [{ value: initial }, { value: initial }],
  useCachedComputed: (fn: () => any) => ({ value: fn() }),
  useMemoizedFunction: (fn: any) => fn,
  useSelectiveWatch: vi.fn()
}))

// Mock Ant Design message
vi.mock('ant-design-vue', async () => {
  const actual = await vi.importActual('ant-design-vue')
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn()
    }
  }
})

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined)
  }
})

function createTestWrapper(props = {}) {
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
          translationInProgress: 'Translation in progress...',
          languagesSwapped: 'Languages swapped',
          sourceLanguage: 'Source language',
          targetLanguage: 'Target language'
        },
        messages: {
          enterTextToTranslate: 'Please enter text to translate',
          textLimitExceeded: 'Text limit exceeded',
          translationCompleted: 'Translation completed',
          translationFailed: 'Translation failed',
          noTranslationToCopy: 'No translation to copy',
          translationCopied: 'Translation copied to clipboard'
        }
      }
    }
  })

  return mount(TranslationForm, {
    props,
    global: {
      plugins: [pinia, i18n],
      components: {
        'a-config-provider': ConfigProvider
      },
      stubs: {
        'a-button': {
          template: '<button @click="$emit(\'click\')" :disabled="disabled"><slot /></button>',
          props: ['disabled', 'loading', 'type', 'size', 'class']
        },
        'a-select': {
          template: '<select @change="$emit(\'change\', $event.target.value)" :value="value"><slot /></select>',
          props: ['value'],
          emits: ['change']
        },
        'a-select-option': {
          template: '<option :value="value"><slot /></option>',
          props: ['value']
        },
        'TextInput': {
          template: '<textarea @input="$emit(\'update:modelValue\', $event.target.value)" :value="modelValue" @translate="$emit(\'translate\')"></textarea>',
          props: ['modelValue', 'placeholder', 'class', 'enableSTT'],
          emits: ['update:modelValue', 'input', 'translate']
        },
        'TextOutput': {
          template: '<div>{{ modelValue }}</div>',
          props: ['modelValue', 'placeholder', 'class', 'confidence', 'enableTTS', 'language', 'readonly']
        }
      }
    }
  })
}

describe('TranslationForm Component', () => {
  let translationStore: ReturnType<typeof useTranslationStore>

  beforeEach(() => {
    const pinia = createPinia()
    setActivePinia(pinia)
    translationStore = useTranslationStore()
    
    // Reset mocks
    vi.clearAllMocks()
    
    // Reset store state
    translationStore.setSourceLanguage('vi')
    translationStore.setTargetLanguage('lo')
    translationStore.setLoading(false)
    translationStore.setError(null)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render correctly with default props', () => {
      const wrapper = createTestWrapper()
      
      expect(wrapper.find('.translation-section').exists()).toBe(true)
      expect(wrapper.find('.input-panel').exists()).toBe(true)
      expect(wrapper.find('.output-panel').exists()).toBe(true)
      expect(wrapper.find('.switch-languages').exists()).toBe(true)
      expect(wrapper.find('.controls').exists()).toBe(true)
    })

    it('should display correct language options', () => {
      const wrapper = createTestWrapper()
      
      const selects = wrapper.findAll('select')
      expect(selects).toHaveLength(2) // Source and target language selectors
      
      const options = wrapper.findAll('option')
      expect(options.length).toBeGreaterThan(0)
    })

    it('should show character counter', async () => {
      const wrapper = createTestWrapper()
      
      expect(wrapper.find('.char-counter').exists()).toBe(true)
      expect(wrapper.find('.char-counter').text()).toContain('0/5000')
    })
  })

  describe('Language Selection', () => {
    it('should handle source language change', async () => {
      const wrapper = createTestWrapper()
      
      await wrapper.vm.handleSourceLanguageChange('en' as Language)
      
      expect(translationStore.sourceLanguage).toBe('en')
    })

    it('should handle target language change', async () => {
      const wrapper = createTestWrapper()
      
      await wrapper.vm.handleTargetLanguageChange('en' as Language)
      
      expect(translationStore.targetLanguage).toBe('en')
    })

    it('should swap languages when source equals target', async () => {
      const wrapper = createTestWrapper()
      
      // Set initial state
      translationStore.setSourceLanguage('vi')
      translationStore.setTargetLanguage('lo')
      
      // Change source to same as target
      await wrapper.vm.handleSourceLanguageChange('lo' as Language)
      
      expect(translationStore.sourceLanguage).toBe('lo')
      expect(translationStore.targetLanguage).toBe('vi')
    })

    it('should switch languages and swap text content', async () => {
      const wrapper = createTestWrapper()
      
      // Set initial text
      await wrapper.setData({ 
        inputText: 'Hello',
        outputText: 'Xin chào'
      })
      
      const initialSource = translationStore.sourceLanguage
      const initialTarget = translationStore.targetLanguage
      
      await wrapper.vm.switchLanguages()
      
      expect(translationStore.sourceLanguage).toBe(initialTarget)
      expect(translationStore.targetLanguage).toBe(initialSource)
      expect(wrapper.vm.inputText).toBe('Xin chào')
      expect(wrapper.vm.outputText).toBe('Hello')
    })
  })

  describe('Text Input and Validation', () => {
    it('should update character counter on input', async () => {
      const wrapper = createTestWrapper()
      
      const testText = 'Hello world'
      await wrapper.setData({ inputText: testText })
      
      expect(wrapper.vm.charCount).toBe(testText.length)
    })

    it('should detect when character limit is exceeded', async () => {
      const wrapper = createTestWrapper()
      
      const longText = 'a'.repeat(6000)
      await wrapper.setData({ inputText: longText })
      
      expect(wrapper.vm.isLimitExceeded).toBe(true)
      expect(wrapper.find('.char-counter.limit-exceeded').exists()).toBe(true)
    })

    it('should disable translate button when input is empty', async () => {
      const wrapper = createTestWrapper()
      
      await wrapper.setData({ inputText: '' })
      
      const translateButton = wrapper.find('.translate-btn')
      expect(translateButton.attributes('disabled')).toBeDefined()
    })

    it('should disable translate button when limit is exceeded', async () => {
      const wrapper = createTestWrapper()
      
      const longText = 'a'.repeat(6000)
      await wrapper.setData({ inputText: longText })
      
      const translateButton = wrapper.find('.translate-btn')
      expect(translateButton.attributes('disabled')).toBeDefined()
    })
  })

  describe('Translation Functionality', () => {
    it('should translate text successfully', async () => {
      const wrapper = createTestWrapper()
      
      await wrapper.setData({ inputText: 'Hello world' })
      
      await wrapper.vm.translateText()
      
      expect(mockTranslationService.translate).toHaveBeenCalledWith(
        'Hello world',
        'vi',
        'lo'
      )
      expect(wrapper.vm.outputText).toBe('Mocked translation')
      expect(wrapper.vm.translationConfidence).toBe(0.9)
    })

    it('should add translation to history', async () => {
      const wrapper = createTestWrapper()
      
      await wrapper.setData({ inputText: 'Test text' })
      await wrapper.vm.translateText()
      
      expect(translationStore.historyCount).toBe(1)
      
      const historyItem = translationStore.history[0]
      expect(historyItem.sourceText).toBe('Test text')
      expect(historyItem.translatedText).toBe('Mocked translation')
      expect(historyItem.direction).toBe('vi-lo')
    })

    it('should handle translation errors', async () => {
      const wrapper = createTestWrapper()
      
      // Mock translation service to throw error
      mockTranslationService.translate.mockRejectedValueOnce(new Error('API Error'))
      
      await wrapper.setData({ inputText: 'Test text' })
      await wrapper.vm.translateText()
      
      expect(translationStore.error).toBe('API Error')
      expect(message.error).toHaveBeenCalled()
    })

    it('should not translate empty text', async () => {
      const wrapper = createTestWrapper()
      
      await wrapper.setData({ inputText: '' })
      await wrapper.vm.translateText()
      
      expect(mockTranslationService.translate).not.toHaveBeenCalled()
      expect(message.error).toHaveBeenCalledWith('Please enter text to translate')
    })

    it('should not translate when limit exceeded', async () => {
      const wrapper = createTestWrapper()
      
      const longText = 'a'.repeat(6000)
      await wrapper.setData({ inputText: longText })
      await wrapper.vm.translateText()
      
      expect(mockTranslationService.translate).not.toHaveBeenCalled()
      expect(message.error).toHaveBeenCalledWith('Text limit exceeded')
    })
  })

  describe('Control Actions', () => {
    it('should clear all text and reset state', async () => {
      const wrapper = createTestWrapper()
      
      await wrapper.setData({ 
        inputText: 'Test input',
        outputText: 'Test output',
        translationConfidence: 0.8
      })
      
      await wrapper.vm.clearAll()
      
      expect(wrapper.vm.inputText).toBe('')
      expect(wrapper.vm.outputText).toBe('')
      expect(wrapper.vm.translationConfidence).toBeUndefined()
      expect(translationStore.error).toBeNull()
    })

    it('should copy translation to clipboard', async () => {
      const wrapper = createTestWrapper()
      
      await wrapper.setData({ outputText: 'Translation to copy' })
      
      await wrapper.vm.copyTranslation()
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Translation to copy')
      expect(message.success).toHaveBeenCalledWith('Translation copied to clipboard')
    })

    it('should handle copy error when no translation exists', async () => {
      const wrapper = createTestWrapper()
      
      await wrapper.setData({ outputText: '' })
      
      await wrapper.vm.copyTranslation()
      
      expect(navigator.clipboard.writeText).not.toHaveBeenCalled()
      expect(message.error).toHaveBeenCalledWith('No translation to copy')
    })

    it('should handle clipboard API failure gracefully', async () => {
      const wrapper = createTestWrapper()
      
      // Mock clipboard to fail
      vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('Clipboard error'))
      
      // Mock document.execCommand for fallback
      const mockExecCommand = vi.fn().mockReturnValue(true)
      Object.defineProperty(document, 'execCommand', {
        value: mockExecCommand,
        writable: true
      })
      
      await wrapper.setData({ outputText: 'Test translation' })
      await wrapper.vm.copyTranslation()
      
      expect(message.success).toHaveBeenCalledWith('Translation copied to clipboard')
    })
  })

  describe('Loading States', () => {
    it('should show loading state during translation', async () => {
      const wrapper = createTestWrapper()
      
      translationStore.setLoading(true)
      await wrapper.vm.$nextTick()
      
      const translateButton = wrapper.find('.translate-btn')
      expect(translateButton.attributes('loading')).toBeDefined()
    })

    it('should disable controls during loading', async () => {
      const wrapper = createTestWrapper()
      
      translationStore.setLoading(true)
      await wrapper.vm.$nextTick()
      
      const translateButton = wrapper.find('.translate-btn')
      expect(translateButton.attributes('loading')).toBeDefined()
    })
  })

  describe('Accessibility Features', () => {
    it('should have proper ARIA labels', () => {
      const wrapper = createTestWrapper()
      
      expect(wrapper.find('[role="region"]').exists()).toBe(true)
      expect(wrapper.find('[aria-label="Select source language"]').exists()).toBe(true)
      expect(wrapper.find('[aria-label="Select target language"]').exists()).toBe(true)
    })

    it('should have screen reader announcements', () => {
      const wrapper = createTestWrapper()
      
      expect(wrapper.find('[role="status"]').exists()).toBe(true)
      expect(wrapper.find('.sr-only').exists()).toBe(true)
    })

    it('should update character counter with proper ARIA attributes', async () => {
      const wrapper = createTestWrapper()
      
      const charCounter = wrapper.find('.char-counter')
      expect(charCounter.attributes('role')).toBe('status')
      expect(charCounter.attributes('aria-live')).toBe('polite')
    })
  })

  describe('Error Handling', () => {
    it('should display error state correctly', async () => {
      const wrapper = createTestWrapper()
      
      translationStore.setError('Translation service unavailable')
      await wrapper.vm.$nextTick()
      
      expect(translationStore.error).toBe('Translation service unavailable')
    })

    it('should clear error on successful translation', async () => {
      const wrapper = createTestWrapper()
      
      translationStore.setError('Previous error')
      
      await wrapper.setData({ inputText: 'Test text' })
      await wrapper.vm.translateText()
      
      expect(translationStore.error).toBeNull()
    })
  })

  describe('Component Props and Events', () => {
    it('should emit events correctly', async () => {
      const wrapper = createTestWrapper()
      
      // Test input event
      const textInput = wrapper.findComponent({ name: 'TextInput' })
      await textInput.vm.$emit('input')
      
      // Test translate event
      await textInput.vm.$emit('translate')
      
      // Verify events were handled
      expect(wrapper.emitted()).toBeDefined()
    })

    it('should handle component updates correctly', async () => {
      const wrapper = createTestWrapper()
      
      // Update input text through component
      const textInput = wrapper.findComponent({ name: 'TextInput' })
      await textInput.vm.$emit('update:modelValue', 'New text')
      
      // Component should react to the change
      expect(wrapper.vm.inputText).toBe('New text')
    })
  })
})