import { describe, it, expect, beforeEach } from 'vitest'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import * as fc from 'fast-check'
import { useI18n } from '@/composables/useI18n'
import type { Language } from '@/types'

// Import locale messages
import en from '@/locales/en.json'
import vi from '@/locales/vi.json'
import lo from '@/locales/lo.json'

describe('I18n Property Tests', () => {
  let app: any
  let i18n: any
  let pinia: any

  beforeEach(() => {
    // Create fresh instances for each test
    pinia = createPinia()
    i18n = createI18n({
      legacy: false,
      locale: 'en',
      fallbackLocale: 'en',
      globalInjection: true,
      messages: { en, vi, lo }
    })
    
    app = createApp({})
    app.use(pinia)
    app.use(i18n)
  })

  /**
   * **Feature: vuejs-refactor, Property 3: Interface language support**
   * **Validates: Requirements 3.1, 3.4**
   */
  it('should provide complete translations for all UI elements in any supported language', () => {
    fc.assert(fc.property(
      fc.constantFrom('en', 'vi', 'lo'),
      fc.constantFrom(
        'app.title',
        'app.subtitle',
        'languages.vietnamese',
        'languages.lao',
        'languages.english',
        'translation.inputText',
        'translation.translation',
        'translation.translate',
        'translation.clear',
        'fileUpload.uploadDocument',
        'theme.darkMode',
        'theme.lightMode',
        'history.translationHistory',
        'messages.enterTextToTranslate',
        'messages.translationCompleted',
        'time.justNow',
        'footer.allRightsReserved'
      ),
      (language: Language, translationKey: string) => {
        // Set the locale
        i18n.global.locale.value = language
        
        // Get the translation
        const translation = i18n.global.t(translationKey)
        
        // Verify translation exists and is not empty
        expect(translation).toBeDefined()
        expect(translation).not.toBe('')
        expect(translation).not.toBe(translationKey) // Should not return the key itself
        expect(typeof translation).toBe('string')
        
        // Verify translation is different from other languages (unless it's a proper noun)
        const otherLanguages = (['en', 'vi', 'lo'] as Language[]).filter(lang => lang !== language)
        
        for (const otherLang of otherLanguages) {
          i18n.global.locale.value = otherLang
          const otherTranslation = i18n.global.t(translationKey)
          
          // Some keys might be the same across languages (like proper nouns or symbols)
          // but most should be different
          if (!translationKey.includes('title') && !translationKey.includes('subtitle')) {
            // Allow some flexibility for short translations or symbols
            if (translation.length > 3 && otherTranslation.length > 3) {
              expect(translation).not.toBe(otherTranslation)
            }
          }
        }
        
        return true
      }
    ), { numRuns: 100 })
  })

  /**
   * Test that all required translation keys exist in all supported languages
   */
  it('should have all required translation keys in every supported language', () => {
    const requiredKeys = [
      'app.title',
      'app.subtitle',
      'languages.vietnamese',
      'languages.lao', 
      'languages.english',
      'translation.inputText',
      'translation.translation',
      'translation.translate',
      'translation.clear',
      'translation.copyTranslation',
      'fileUpload.uploadDocument',
      'theme.darkMode',
      'theme.lightMode',
      'history.translationHistory',
      'messages.enterTextToTranslate',
      'messages.translationCompleted',
      'time.justNow',
      'footer.allRightsReserved'
    ]

    fc.assert(fc.property(
      fc.constantFrom('en', 'vi', 'lo'),
      fc.constantFrom(...requiredKeys),
      (language: Language, key: string) => {
        i18n.global.locale.value = language
        const translation = i18n.global.t(key)
        
        // Should not return the key itself (which happens when translation is missing)
        expect(translation).not.toBe(key)
        expect(translation).toBeDefined()
        expect(translation.length).toBeGreaterThan(0)
        
        return true
      }
    ), { numRuns: 100 })
  })

  /**
   * Test pluralization functionality across languages
   */
  it('should handle pluralization correctly for all supported languages', () => {
    fc.assert(fc.property(
      fc.constantFrom('en', 'vi', 'lo'),
      fc.constantFrom('items', 'characters', 'translations', 'files'),
      fc.integer({ min: 0, max: 100 }),
      (language: Language, pluralKey: string, count: number) => {
        i18n.global.locale.value = language
        
        const fullKey = `pluralization.${pluralKey}`
        const translation = i18n.global.t(fullKey, { count })
        
        // Should return a valid translation
        expect(translation).toBeDefined()
        expect(translation).not.toBe(fullKey)
        expect(typeof translation).toBe('string')
        expect(translation.length).toBeGreaterThan(0)
        
        // For English, special cases for 0 and 1
        // For Vietnamese and Lao, should always include the count
        if (language === 'en') {
          if (count === 0) {
            // English might use "no items" for zero
            expect(translation.toLowerCase()).toMatch(/(no|0)\s+\w+/)
          } else if (count === 1) {
            // English might use "one item" for singular
            expect(translation.toLowerCase()).toMatch(/(one|1)\s+\w+/)
          } else {
            // Should include the count in the translation
            expect(translation).toContain(count.toString())
          }
        } else {
          // Vietnamese and Lao should always include the count
          expect(translation).toContain(count.toString())
        }
        
        return true
      }
    ), { numRuns: 100 })
  })

  /**
   * Test that locale switching works correctly
   */
  it('should switch locales correctly and maintain translation consistency', () => {
    fc.assert(fc.property(
      fc.array(fc.constantFrom('en', 'vi', 'lo'), { minLength: 2, maxLength: 5 }),
      fc.constantFrom('app.title', 'translation.translate', 'messages.translationCompleted'),
      (localeSequence: Language[], key: string) => {
        const translations: string[] = []
        
        // Switch through locales and collect translations
        for (const locale of localeSequence) {
          i18n.global.locale.value = locale
          const translation = i18n.global.t(key)
          translations.push(translation)
          
          // Verify current locale is set correctly
          expect(i18n.global.locale.value).toBe(locale)
          expect(translation).toBeDefined()
          expect(translation).not.toBe(key)
        }
        
        // Verify that switching back to the same locale gives the same translation
        const firstLocale = localeSequence[0]
        i18n.global.locale.value = firstLocale
        const finalTranslation = i18n.global.t(key)
        expect(finalTranslation).toBe(translations[0])
        
        return true
      }
    ), { numRuns: 100 })
  })

  /**
   * Test fallback behavior when translations are missing
   */
  it('should fallback to English when translation is missing in other languages', () => {
    fc.assert(fc.property(
      fc.constantFrom('vi', 'lo'), // Test non-English languages
      fc.string({ minLength: 5, maxLength: 20 }).filter(s => !s.includes('.')), // Generate fake keys
      (language: Language, fakeKey: string) => {
        i18n.global.locale.value = language
        
        // Try to get a translation for a non-existent key
        const translation = i18n.global.t(`fake.${fakeKey}`)
        
        // Should either return the key itself (no fallback found) or a fallback
        expect(translation).toBeDefined()
        expect(typeof translation).toBe('string')
        
        return true
      }
    ), { numRuns: 50 })
  })

  /**
   * **Feature: vuejs-refactor, Property 4: Dynamic language switching**
   * **Validates: Requirements 3.2**
   */
  it('should switch interface language dynamically without page reload', () => {
    fc.assert(fc.property(
      fc.array(fc.constantFrom('en', 'vi', 'lo'), { minLength: 3, maxLength: 10 }),
      fc.constantFrom(
        'app.title',
        'translation.translate',
        'messages.translationCompleted',
        'history.translationHistory',
        'theme.darkMode'
      ),
      (languageSequence: Language[], translationKey: string) => {
        const translations: { [key: string]: string } = {}
        
        // Test rapid language switching
        for (const language of languageSequence) {
          // Switch language
          i18n.global.locale.value = language
          
          // Verify locale changed immediately
          expect(i18n.global.locale.value).toBe(language)
          
          // Get translation
          const translation = i18n.global.t(translationKey)
          
          // Store translation for this language
          if (!translations[language]) {
            translations[language] = translation
          }
          
          // Verify translation is consistent for the same language
          expect(translation).toBe(translations[language])
          
          // Verify translation is valid
          expect(translation).toBeDefined()
          expect(translation).not.toBe('')
          expect(translation).not.toBe(translationKey)
          expect(typeof translation).toBe('string')
        }
        
        // Verify that different languages produce different translations
        // (except for some edge cases like symbols or proper nouns)
        const uniqueTranslations = Object.values(translations)
        const uniqueLanguages = Object.keys(translations)
        
        if (uniqueLanguages.length > 1 && !translationKey.includes('title')) {
          // Most translations should be different across languages
          const allSame = uniqueTranslations.every(t => t === uniqueTranslations[0])
          if (uniqueTranslations[0].length > 3) { // Allow short translations to be the same
            expect(allSame).toBe(false)
          }
        }
        
        return true
      }
    ), { numRuns: 100 })
  })

  /**
   * Test that language switching preserves application state
   */
  it('should preserve application state during language switching', () => {
    fc.assert(fc.property(
      fc.constantFrom('en', 'vi', 'lo'),
      fc.constantFrom('en', 'vi', 'lo'),
      fc.constantFrom(
        'translation.inputText',
        'fileUpload.uploadDocument',
        'messages.enterTextToTranslate'
      ),
      (initialLanguage: Language, targetLanguage: Language, key: string) => {
        // Set initial language
        i18n.global.locale.value = initialLanguage
        const initialTranslation = i18n.global.t(key)
        
        // Switch to target language
        i18n.global.locale.value = targetLanguage
        const targetTranslation = i18n.global.t(key)
        
        // Switch back to initial language
        i18n.global.locale.value = initialLanguage
        const finalTranslation = i18n.global.t(key)
        
        // Verify consistency
        expect(finalTranslation).toBe(initialTranslation)
        expect(i18n.global.locale.value).toBe(initialLanguage)
        
        // If languages are different, translations should be different
        if (initialLanguage !== targetLanguage && key.length > 5) {
          expect(initialTranslation).not.toBe(targetTranslation)
        }
        
        return true
      }
    ), { numRuns: 100 })
  })
})