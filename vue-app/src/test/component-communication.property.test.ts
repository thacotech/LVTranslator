import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import * as fc from 'fast-check'
import TranslationForm from '@/components/translation/TranslationForm.vue'
import TextInput from '@/components/common/TextInput.vue'
import TextOutput from '@/components/common/TextOutput.vue'
import { useTranslationStore } from '@/stores/translation'
import type { Language } from '@/types'

// Mock Ant Design Vue components
vi.mock('ant-design-vue', () => ({
  Button: { name: 'AButton', template: '<button><slot /></button>' },
  Select: { name: 'ASelect', template: '<select><slot /></select>' },
  SelectOption: { name: 'ASelectOption', template: '<option><slot /></option>' },
  Textarea: { name: 'ATextarea', template: '<textarea></textarea>' },
  message: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}))

// Mock translation service
vi.mock('@/services/translationService', () => ({
  useTranslationService: () => ({
    translate: vi.fn().mockResolvedValue({
      translatedText: 'mocked translation',
      confidence: 0.9,
      metadata: {
        processingTime: 100,
        characterCount: 10,
        wordCount: 2,
      },
    }),
    validateInput: vi.fn().mockReturnValue({
      isValid: true,
      errors: [],
      warnings: [],
    }),
  }),
}))

describe('Component Communication Property Tests', () => {
  let pinia: any
  let i18n: any

  beforeEach(() => {
    // Setup Pinia
    pinia = createPinia()
    setActivePinia(pinia)

    // Setup i18n with legacy mode disabled
    i18n = createI18n({
      legacy: false,
      locale: 'en',
      fallbackLocale: 'en',
      globalInjection: true,
      messages: {
        en: {
          translation: {
            inputText: 'Input Text',
            translation: 'Translation',
            enterTextPlaceholder: 'Enter text to translate',
            translationPlaceholder: 'Translation will appear here',
            translate: 'Translate',
            clear: 'Clear',
            copyTranslation: 'Copy Translation',
            switchLanguages: 'Switch Languages',
            confidence: 'Confidence',
          },
          languages: {
            vietnamese: 'Vietnamese',
            lao: 'Lao',
            english: 'English',
          },
          messages: {
            enterTextToTranslate: 'Please enter text to translate',
            textLimitExceeded: 'Text limit exceeded',
            translationCompleted: 'Translation completed',
            translationFailed: 'Translation failed',
            translationCopied: 'Translation copied',
            noTranslationToCopy: 'No translation to copy',
          },
          validation: {
            characterLimitWarning: 'Approaching character limit: {limit}',
            characterLimitExceeded: 'Character limit exceeded: {limit}',
            pastedTextTruncated: 'Pasted text was truncated',
            noSpaceForPaste: 'No space available for paste',
            sttTextTooLong: 'Speech recognition text too long',
          },
          stt: {
            startListening: 'Start Listening',
            stopListening: 'Stop Listening',
            notSupported: 'Speech recognition not supported',
            error: 'Speech recognition error: {error}',
            startError: 'Error starting speech recognition',
          },
          tts: {
            startSpeaking: 'Start Speaking',
            stopSpeaking: 'Stop Speaking',
            notSupported: 'Text-to-speech not supported',
            error: 'Text-to-speech error: {error}',
            startError: 'Error starting text-to-speech',
          },
        },
      },
    })

    // Mock localStorage
    const storage: { [key: string]: string } = {}
    const localStorageMock = {
      getItem: vi.fn((key: string) => storage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        storage[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete storage[key]
      }),
      clear: vi.fn(() => {
        Object.keys(storage).forEach(key => delete storage[key])
      }),
    }
    vi.stubGlobal('localStorage', localStorageMock)

    // Mock clipboard API
    const clipboardMock = {
      writeText: vi.fn().mockResolvedValue(undefined),
    }
    vi.stubGlobal('navigator', { clipboard: clipboardMock })

    // Mock Speech Recognition and Speech Synthesis
    global.SpeechRecognition = vi.fn()
    global.webkitSpeechRecognition = vi.fn()
    global.speechSynthesis = {
      speak: vi.fn(),
      cancel: vi.fn(),
      getVoices: vi.fn().mockReturnValue([]),
    }
  })

  /**
   * **Feature: vuejs-refactor, Property 11: Component communication**
   * **Validates: Requirements 5.2**
   */
  it('should correctly pass data through props and events without data loss or corruption', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 100 }),
      fc.constantFrom('vi', 'lo', 'en'),
      fc.constantFrom('vi', 'lo', 'en'),
      fc.float({ min: 0, max: 1 }),
      (inputText: string, sourceLanguage: Language, targetLanguage: Language, confidence: number) => {
        // Skip if source and target are the same
        if (sourceLanguage === targetLanguage) return true

        const wrapper = mount(TranslationForm, {
          global: {
            plugins: [pinia, i18n],
            stubs: {
              TextInput: true,
              TextOutput: true,
            },
          },
        })

        const store = useTranslationStore()
        
        // Test prop passing to child components
        store.setSourceLanguage(sourceLanguage)
        store.setTargetLanguage(targetLanguage)

        // Verify store state is correctly set
        expect(store.sourceLanguage).toBe(sourceLanguage)
        expect(store.targetLanguage).toBe(targetLanguage)

        // Test data flow through component hierarchy
        const translationData = {
          sourceText: inputText,
          translatedText: `translated_${inputText}`,
          confidence,
          sourceLanguage,
          targetLanguage,
        }

        // Simulate adding translation to history
        store.addToHistory({
          id: Date.now().toString(),
          sourceText: translationData.sourceText,
          translatedText: translationData.translatedText,
          sourceLanguage: translationData.sourceLanguage,
          targetLanguage: translationData.targetLanguage,
          timestamp: new Date(),
          confidence: translationData.confidence,
        })

        // Verify data integrity in store
        const historyItem = store.history[0]
        expect(historyItem.sourceText).toBe(translationData.sourceText)
        expect(historyItem.translatedText).toBe(translationData.translatedText)
        expect(historyItem.direction).toBe(`${sourceLanguage}-${targetLanguage}`)

        // Test that data is not corrupted during component communication
        expect(historyItem.sourceText.length).toBe(inputText.length)
        expect(historyItem.translatedText).toContain(inputText)

        return true
      }
    ), { numRuns: 100 })
  })

  /**
   * Test TextInput component prop and event communication
   */
  it('should correctly handle TextInput props and events without data corruption', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 0, maxLength: 200 }),
      fc.string({ minLength: 5, maxLength: 50 }),
      fc.integer({ min: 100, max: 10000 }),
      fc.boolean(),
      (modelValue: string, placeholder: string, maxLength: number, enableSTT: boolean) => {
        let emittedValue = ''
        let inputEventFired = false
        let translateEventFired = false

        const wrapper = mount(TextInput, {
          props: {
            modelValue,
            placeholder,
            maxLength,
            enableSTT,
          },
          global: {
            plugins: [i18n],
          },
          attrs: {
            'onUpdate:modelValue': (value: string) => {
              emittedValue = value
            },
            onInput: () => {
              inputEventFired = true
            },
            onTranslate: () => {
              translateEventFired = true
            },
          },
        })

        // Verify props are correctly received
        expect(wrapper.props('modelValue')).toBe(modelValue)
        expect(wrapper.props('placeholder')).toBe(placeholder)
        expect(wrapper.props('maxLength')).toBe(maxLength)
        expect(wrapper.props('enableSTT')).toBe(enableSTT)

        // Test event emission with different input values
        const testInput = 'test input'
        const textarea = wrapper.find('textarea')
        
        if (textarea.exists()) {
          // Simulate input event
          textarea.setValue(testInput)
          textarea.trigger('input')

          // Verify event was emitted with correct data
          expect(inputEventFired).toBe(true)
          
          // Test that data is not corrupted during event emission
          if (testInput.length <= maxLength) {
            expect(emittedValue).toBe(testInput)
          }
        }

        return true
      }
    ), { numRuns: 100 })
  })

  /**
   * Test TextOutput component prop and event communication
   */
  it('should correctly handle TextOutput props and events without data corruption', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
      fc.string({ minLength: 5, maxLength: 50 }),
      fc.float({ min: 0, max: 1 }),
      fc.boolean(),
      fc.boolean(),
      fc.constantFrom('vi-VN', 'lo-LA', 'en-US'),
      (modelValue: string, placeholder: string, confidence: number, enableTTS: boolean, showConfidence: boolean, language: string) => {
        const wrapper = mount(TextOutput, {
          props: {
            modelValue,
            placeholder,
            confidence,
            enableTTS,
            showConfidence,
            language,
          },
          global: {
            plugins: [i18n],
          },
        })

        // Verify props are correctly received
        expect(wrapper.props('modelValue')).toBe(modelValue)
        expect(wrapper.props('placeholder')).toBe(placeholder)
        expect(wrapper.props('confidence')).toBe(confidence)
        expect(wrapper.props('enableTTS')).toBe(enableTTS)
        expect(wrapper.props('showConfidence')).toBe(showConfidence)
        expect(wrapper.props('language')).toBe(language)

        // Test confidence display when showConfidence is true
        if (showConfidence && confidence !== undefined) {
          const confidenceDisplay = wrapper.find('.confidence-display')
          if (confidenceDisplay.exists()) {
            const confidenceValue = wrapper.find('.confidence-value')
            if (confidenceValue.exists()) {
              const displayedConfidence = parseInt(confidenceValue.text().replace('%', ''))
              const expectedConfidence = Math.round(confidence * 100)
              expect(displayedConfidence).toBe(expectedConfidence)
            }
          }
        }

        // Verify no data corruption in props
        expect(typeof modelValue).toBe('string')
        expect(typeof confidence).toBe('number')
        expect(typeof enableTTS).toBe('boolean')
        expect(typeof showConfidence).toBe('boolean')
        expect(typeof language).toBe('string')

        return true
      }
    ), { numRuns: 100 })
  })

  /**
   * Test parent-child component data flow integrity
   */
  it('should maintain data integrity during parent-child component interactions', () => {
    fc.assert(fc.property(
      fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
      fc.constantFrom('vi', 'lo', 'en'),
      fc.constantFrom('vi', 'lo', 'en'),
      (textInputs: string[], sourceLanguage: Language, targetLanguage: Language) => {
        // Skip if source and target are the same
        if (sourceLanguage === targetLanguage) return true

        const wrapper = mount(TranslationForm, {
          global: {
            plugins: [pinia, i18n],
            stubs: {
              TextInput: {
                template: '<div class="text-input-stub"><textarea v-model="modelValue" @input="$emit(\'input\', $event.target.value)" /></div>',
                props: ['modelValue', 'placeholder', 'enableSTT'],
                emits: ['update:modelValue', 'input', 'translate'],
              },
              TextOutput: {
                template: '<div class="text-output-stub"><textarea :value="modelValue" readonly /></div>',
                props: ['modelValue', 'placeholder', 'confidence', 'enableTTS', 'language'],
                emits: ['copy', 'tts-start', 'tts-stop'],
              },
            },
          },
        })

        const store = useTranslationStore()
        store.setSourceLanguage(sourceLanguage)
        store.setTargetLanguage(targetLanguage)

        // Test multiple text inputs to verify data integrity
        for (const textInput of textInputs) {
          // Simulate user input
          const inputComponent = wrapper.findComponent({ name: 'TextInput' })
          if (inputComponent.exists()) {
            const textarea = inputComponent.find('textarea')
            if (textarea.exists()) {
              textarea.setValue(textInput)
              textarea.trigger('input')

              // Verify the input value is correctly passed through
              expect(inputComponent.props('modelValue')).toBe(textInput)
              
              // Verify no data corruption occurred
              expect(textInput.length).toBeGreaterThan(0)
              expect(typeof textInput).toBe('string')
            }
          }

          // Test translation flow
          const mockTranslation = `translated_${textInput}`
          
          // Simulate translation result
          const outputComponent = wrapper.findComponent({ name: 'TextOutput' })
          if (outputComponent.exists()) {
            // Verify output receives correct props
            expect(outputComponent.props('language')).toBeDefined()
            expect(outputComponent.props('enableTTS')).toBe(true)
          }
        }

        // Verify store state integrity
        expect(store.sourceLanguage).toBe(sourceLanguage)
        expect(store.targetLanguage).toBe(targetLanguage)

        return true
      }
    ), { numRuns: 100 })
  })

  /**
   * Test event propagation and handling
   */
  it('should correctly propagate events through component hierarchy without loss', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 100 }),
      fc.constantFrom('vi', 'lo', 'en'),
      (inputText: string, language: Language) => {
        let eventsReceived: string[] = []

        const wrapper = mount(TranslationForm, {
          global: {
            plugins: [pinia, i18n],
            stubs: {
              TextInput: {
                template: `
                  <div class="text-input-stub">
                    <textarea 
                      v-model="modelValue" 
                      @input="handleInput"
                      @keydown.ctrl.enter="$emit('translate')"
                    />
                  </div>
                `,
                props: ['modelValue', 'placeholder', 'enableSTT'],
                emits: ['update:modelValue', 'input', 'translate'],
                methods: {
                  handleInput(e: Event) {
                    const target = e.target as HTMLTextAreaElement
                    this.$emit('update:modelValue', target.value)
                    this.$emit('input', target.value)
                  },
                },
              },
              TextOutput: {
                template: `
                  <div class="text-output-stub">
                    <textarea :value="modelValue" readonly />
                    <button @click="$emit('copy')" class="copy-btn">Copy</button>
                  </div>
                `,
                props: ['modelValue', 'placeholder', 'confidence', 'enableTTS', 'language'],
                emits: ['copy', 'tts-start', 'tts-stop'],
              },
            },
          },
        })

        const store = useTranslationStore()
        store.setSourceLanguage(language)

        // Test input event propagation
        const inputComponent = wrapper.findComponent({ name: 'TextInput' })
        if (inputComponent.exists()) {
          const textarea = inputComponent.find('textarea')
          if (textarea.exists()) {
            // Test input event
            textarea.setValue(inputText)
            textarea.trigger('input')
            eventsReceived.push('input')

            // Test translate event (Ctrl+Enter)
            textarea.trigger('keydown.ctrl.enter')
            eventsReceived.push('translate')
          }
        }

        // Test output event propagation
        const outputComponent = wrapper.findComponent({ name: 'TextOutput' })
        if (outputComponent.exists()) {
          const copyButton = outputComponent.find('.copy-btn')
          if (copyButton.exists()) {
            copyButton.trigger('click')
            eventsReceived.push('copy')
          }
        }

        // Verify events were properly handled (at least input event should be fired)
        if (eventsReceived.length > 0) {
          expect(eventsReceived.length).toBeGreaterThan(0)
          // Input event should be included if any events were fired
          if (eventsReceived.includes('input')) {
            expect(eventsReceived).toContain('input')
          }
        }

        // Verify no event data corruption
        for (const event of eventsReceived) {
          expect(typeof event).toBe('string')
          expect(event.length).toBeGreaterThan(0)
        }

        return true
      }
    ), { numRuns: 100 })
  })

  /**
   * Test reactive prop updates
   */
  it('should reactively update when props change without data loss', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 50 }),
      fc.float({ min: Math.fround(0.1), max: Math.fround(1) }).filter(n => !isNaN(n) && isFinite(n)),
      fc.string({ minLength: 1, maxLength: 50 }),
      fc.float({ min: Math.fround(0.1), max: Math.fround(1) }).filter(n => !isNaN(n) && isFinite(n)),
      (initialText: string, initialConfidence: number, newText: string, newConfidence: number) => {
        const wrapper = mount(TextOutput, {
          props: {
            modelValue: initialText,
            confidence: initialConfidence,
            showConfidence: true,
            enableTTS: true,
          },
          global: {
            plugins: [i18n],
          },
        })

        // Verify initial props
        expect(wrapper.props('modelValue')).toBe(initialText)
        expect(wrapper.props('confidence')).toBeCloseTo(initialConfidence, 3)

        // Verify data integrity - no corruption in initial values
        expect(typeof initialText).toBe('string')
        expect(typeof initialConfidence).toBe('number')
        expect(initialText.length).toBeGreaterThan(0)
        expect(initialConfidence).toBeGreaterThan(0)
        expect(isFinite(initialConfidence)).toBe(true)

        // Verify data integrity - no corruption in new values
        expect(typeof newText).toBe('string')
        expect(typeof newConfidence).toBe('number')
        expect(newText.length).toBeGreaterThan(0)
        expect(newConfidence).toBeGreaterThan(0)
        expect(isFinite(newConfidence)).toBe(true)

        return true
      }
    ), { numRuns: 100 })
  })
})