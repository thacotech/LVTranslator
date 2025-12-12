import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTranslationStore } from '../translation'
import type { Translation } from '@/types'
import * as fc from 'fast-check'

describe('Translation Store', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
    // Create fresh Pinia instance for each test
    setActivePinia(createPinia())
  })

  describe('Basic functionality', () => {
    it('should initialize with default state', () => {
      const store = useTranslationStore()
      
      expect(store.currentTranslation).toBeNull()
      expect(store.history).toEqual([])
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.sourceLanguage).toBe('vi')
      expect(store.targetLanguage).toBe('lo')
    })

    it('should add translation to history', () => {
      const store = useTranslationStore()
      const translation: Translation = {
        id: '1',
        sourceText: 'Hello',
        translatedText: 'ສະບາຍດີ',
        sourceLanguage: 'en',
        targetLanguage: 'lo',
        timestamp: new Date()
      }

      store.addToHistory(translation)
      
      expect(store.history).toHaveLength(1)
      expect(store.history[0].sourceText).toBe('Hello')
      expect(store.history[0].translatedText).toBe('ສະບາຍດີ')
    })

    it('should clear history', () => {
      const store = useTranslationStore()
      const translation: Translation = {
        id: '1',
        sourceText: 'Hello',
        translatedText: 'ສະບາຍດີ',
        sourceLanguage: 'en',
        targetLanguage: 'lo',
        timestamp: new Date()
      }

      store.addToHistory(translation)
      expect(store.history).toHaveLength(1)
      
      store.clearHistory()
      expect(store.history).toHaveLength(0)
    })
  })

  describe('Property-based tests', () => {
    // **Feature: vuejs-refactor, Property 8: Translation history persistence**
    it('should persist translation history across store instances', () => {
      fc.assert(fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom('vi', 'lo', 'en'),
        fc.constantFrom('vi', 'lo', 'en'),
        (sourceText, translatedText, sourceLang, targetLang) => {
          // Skip if same language or empty text
          if (sourceLang === targetLang || sourceText.trim().length === 0 || translatedText.trim().length === 0) {
            return true
          }
          
          // Clear localStorage and reset mocks
          localStorage.clear()
          vi.clearAllMocks()
          
          // Ensure localStorage.getItem returns null initially
          vi.mocked(localStorage.getItem).mockReturnValue(null)
          
          // Create fresh Pinia instance and store
          setActivePinia(createPinia())
          const store1 = useTranslationStore()
          
          const translation: Translation = {
            id: 'test-1',
            sourceText: sourceText,
            translatedText: translatedText,
            sourceLanguage: sourceLang,
            targetLanguage: targetLang,
            timestamp: new Date()
          }
          
          store1.addToHistory(translation)
          
          // Should have exactly 1 item
          expect(store1.history).toHaveLength(1)
          
          // Manually verify localStorage was called
          expect(localStorage.setItem).toHaveBeenCalledWith('lvtranslator_history', expect.any(String))
          
          // Get the stored data
          const storedData = (localStorage.setItem as any).mock.calls
            .find((call: any[]) => call[0] === 'lvtranslator_history')?.[1]
          
          if (!storedData) return true
          
          // Mock localStorage.getItem to return the stored data
          vi.mocked(localStorage.getItem).mockImplementation((key) => {
            if (key === 'lvtranslator_history') return storedData
            return null
          })
          
          // Create new store instance (simulating app restart)
          setActivePinia(createPinia())
          const store2 = useTranslationStore()
          
          // History should be loaded from localStorage
          expect(store2.history).toHaveLength(1)
          expect(store2.history[0].sourceText).toBe(sourceText)
          expect(store2.history[0].translatedText).toBe(translatedText)
          
          return true
        }
      ), { numRuns: 100 })
    })

    it('should maintain history order with newest first', () => {
      fc.assert(fc.property(
        fc.array(fc.record({
          sourceText: fc.string({ minLength: 1, maxLength: 50 }),
          translatedText: fc.string({ minLength: 1, maxLength: 50 }),
          sourceLanguage: fc.constantFrom('vi', 'lo', 'en'),
          targetLanguage: fc.constantFrom('vi', 'lo', 'en')
        }), { minLength: 2, maxLength: 5 }),
        (translationData) => {
          const store = useTranslationStore()
          const addedTranslations: Translation[] = []
          
          translationData.forEach((data, index) => {
            if (data.sourceLanguage !== data.targetLanguage) {
              const translation: Translation = {
                id: `test-${index}`,
                sourceText: data.sourceText,
                translatedText: data.translatedText,
                sourceLanguage: data.sourceLanguage,
                targetLanguage: data.targetLanguage,
                timestamp: new Date(Date.now() + index * 1000) // Ensure different timestamps
              }
              addedTranslations.push(translation)
              store.addToHistory(translation)
            }
          })

          if (addedTranslations.length >= 2) {
            // History should be ordered with newest first
            for (let i = 0; i < store.history.length - 1; i++) {
              expect(store.history[i].timestamp).toBeGreaterThanOrEqual(store.history[i + 1].timestamp)
            }
          }
          
          return true
        }
      ), { numRuns: 100 })
    })

    it('should handle duplicate translations correctly', () => {
      fc.assert(fc.property(
        fc.record({
          sourceText: fc.string({ minLength: 1, maxLength: 50 }),
          translatedText: fc.string({ minLength: 1, maxLength: 50 }),
          sourceLanguage: fc.constantFrom('vi', 'lo', 'en'),
          targetLanguage: fc.constantFrom('vi', 'lo', 'en')
        }),
        (data) => {
          if (data.sourceLanguage === data.targetLanguage) return true
          
          const store = useTranslationStore()
          const translation: Translation = {
            id: 'test-1',
            sourceText: data.sourceText,
            translatedText: data.translatedText,
            sourceLanguage: data.sourceLanguage,
            targetLanguage: data.targetLanguage,
            timestamp: new Date()
          }

          // Add same translation twice
          store.addToHistory(translation)
          const firstCount = store.history.length
          
          store.addToHistory(translation)
          const secondCount = store.history.length
          
          // Should not create duplicate entries
          expect(secondCount).toBe(firstCount)
          
          return true
        }
      ), { numRuns: 100 })
    })

    it('should limit history to maximum items', () => {
      const store = useTranslationStore()
      const maxItems = 50 // As defined in the store
      
      // Add more than max items
      for (let i = 0; i < maxItems + 10; i++) {
        const translation: Translation = {
          id: `test-${i}`,
          sourceText: `Source ${i}`,
          translatedText: `Translation ${i}`,
          sourceLanguage: 'vi',
          targetLanguage: 'lo',
          timestamp: new Date(Date.now() + i * 1000)
        }
        store.addToHistory(translation)
      }
      
      expect(store.history.length).toBeLessThanOrEqual(maxItems)
    })
  })

  describe('Language settings persistence', () => {
    it('should persist language settings', () => {
      fc.assert(fc.property(
        fc.constantFrom('vi', 'lo', 'en'),
        fc.constantFrom('vi', 'lo', 'en'),
        (sourceLang, targetLang) => {
          // Clear localStorage first
          localStorage.clear()
          
          const store1 = useTranslationStore()
          store1.setSourceLanguage(sourceLang)
          store1.setTargetLanguage(targetLang)
          
          // Verify localStorage was called
          expect(localStorage.setItem).toHaveBeenCalledWith('sourceLanguage', sourceLang)
          expect(localStorage.setItem).toHaveBeenCalledWith('targetLanguage', targetLang)
          
          // Mock localStorage.getItem to return the stored values
          vi.mocked(localStorage.getItem).mockImplementation((key) => {
            if (key === 'sourceLanguage') return sourceLang
            if (key === 'targetLanguage') return targetLang
            return null
          })
          
          // Create new store instance
          setActivePinia(createPinia())
          const store2 = useTranslationStore()
          
          expect(store2.sourceLanguage).toBe(sourceLang)
          expect(store2.targetLanguage).toBe(targetLang)
          
          return true
        }
      ), { numRuns: 100 })
    })
  })
})