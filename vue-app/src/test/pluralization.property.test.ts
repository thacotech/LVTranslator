import { describe, it, expect, beforeEach } from 'vitest'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import * as fc from 'fast-check'
import type { Language } from '@/types'

// Import locale messages
import en from '@/locales/en.json'
import vi from '@/locales/vi.json'
import lo from '@/locales/lo.json'

describe('Pluralization Property Tests', () => {
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
      messages: { en, vi, lo },
      // Pluralization rules for different languages
      pluralRules: {
        'vi': (choice: number) => {
          // Vietnamese doesn't have plural forms like English
          return choice === 0 ? 0 : 1
        },
        'lo': (choice: number) => {
          // Lao doesn't have plural forms like English
          return choice === 0 ? 0 : 1
        },
        'en': (choice: number) => {
          // English plural rules: 0 = zero, 1 = one, 2 = other
          if (choice === 0) return 0
          if (choice === 1) return 1
          return 2
        }
      }
    })
    
    app = createApp({})
    app.use(pinia)
    app.use(i18n)
  })

  /**
   * **Feature: vuejs-refactor, Property 6: Pluralization handling**
   * **Validates: Requirements 3.5**
   */
  it('should apply correct pluralization rules specific to each language for any numeric value', () => {
    fc.assert(fc.property(
      fc.constantFrom('en', 'vi', 'lo'),
      fc.constantFrom('items', 'characters', 'translations', 'files'),
      fc.integer({ min: 0, max: 1000 }),
      (language: Language, pluralKey: string, count: number) => {
        i18n.global.locale.value = language
        
        const fullKey = `pluralization.${pluralKey}`
        const translation = i18n.global.t(fullKey, { count })
        
        // Should return a valid translation
        expect(translation).toBeDefined()
        expect(translation).not.toBe(fullKey)
        expect(typeof translation).toBe('string')
        expect(translation.length).toBeGreaterThan(0)
        
        // Language-specific pluralization rules
        if (language === 'en') {
          // English has special cases for 0 and 1
          if (count === 0) {
            expect(translation.toLowerCase()).toMatch(/(no|0)\s+\w+/)
          } else if (count === 1) {
            expect(translation.toLowerCase()).toMatch(/(one|1)\s+\w+/)
          } else {
            // Plural form should include the count
            expect(translation).toContain(count.toString())
            // Should not use "one" or "no" for counts > 1
            expect(translation.toLowerCase()).not.toContain('one ')
            expect(translation.toLowerCase()).not.toContain('no ')
          }
        } else {
          // Vietnamese and Lao always include the count (no special plural forms)
          expect(translation).toContain(count.toString())
          
          // Should not use English-specific words
          expect(translation.toLowerCase()).not.toContain('one')
          expect(translation.toLowerCase()).not.toContain('no')
        }
        
        return true
      }
    ), { numRuns: 100 })
  })

  /**
   * Test that pluralization is consistent for the same count across multiple calls
   */
  it('should produce consistent pluralization results for the same count', () => {
    fc.assert(fc.property(
      fc.constantFrom('en', 'vi', 'lo'),
      fc.constantFrom('items', 'characters', 'translations', 'files'),
      fc.integer({ min: 0, max: 100 }),
      (language: Language, pluralKey: string, count: number) => {
        i18n.global.locale.value = language
        
        const fullKey = `pluralization.${pluralKey}`
        
        // Get translation multiple times
        const translation1 = i18n.global.t(fullKey, { count })
        const translation2 = i18n.global.t(fullKey, { count })
        const translation3 = i18n.global.t(fullKey, { count })
        
        // Should be identical
        expect(translation1).toBe(translation2)
        expect(translation2).toBe(translation3)
        
        return true
      }
    ), { numRuns: 100 })
  })

  /**
   * Test that different counts produce appropriate pluralization differences in English
   */
  it('should differentiate between singular and plural forms in English', () => {
    fc.assert(fc.property(
      fc.constantFrom('items', 'characters', 'translations', 'files'),
      fc.integer({ min: 2, max: 100 }), // Plural counts
      (pluralKey: string, pluralCount: number) => {
        i18n.global.locale.value = 'en'
        
        const fullKey = `pluralization.${pluralKey}`
        
        // Get singular and plural forms
        const singularTranslation = i18n.global.t(fullKey, { count: 1 })
        const pluralTranslation = i18n.global.t(fullKey, { count: pluralCount })
        
        // Should be different
        expect(singularTranslation).not.toBe(pluralTranslation)
        
        // Singular should contain "one"
        expect(singularTranslation.toLowerCase()).toContain('one')
        
        // Plural should contain the actual count
        expect(pluralTranslation).toContain(pluralCount.toString())
        expect(pluralTranslation.toLowerCase()).not.toContain('one')
        
        return true
      }
    ), { numRuns: 50 })
  })

  /**
   * Test that Vietnamese and Lao don't have singular/plural distinctions
   */
  it('should use the same form for all counts in Vietnamese and Lao', () => {
    fc.assert(fc.property(
      fc.constantFrom('vi', 'lo'),
      fc.constantFrom('items', 'characters', 'translations', 'files'),
      fc.integer({ min: 1, max: 10 }),
      fc.integer({ min: 11, max: 100 }),
      (language: Language, pluralKey: string, count1: number, count2: number) => {
        i18n.global.locale.value = language
        
        const fullKey = `pluralization.${pluralKey}`
        
        // Get translations for different counts
        const translation1 = i18n.global.t(fullKey, { count: count1 })
        const translation2 = i18n.global.t(fullKey, { count: count2 })
        
        // Extract the base form (without the number)
        const base1 = translation1.replace(count1.toString(), 'X')
        const base2 = translation2.replace(count2.toString(), 'X')
        
        // Base forms should be identical (same word, just different numbers)
        expect(base1).toBe(base2)
        
        return true
      }
    ), { numRuns: 100 })
  })

  /**
   * Test edge cases for pluralization
   */
  it('should handle edge cases correctly', () => {
    fc.assert(fc.property(
      fc.constantFrom('en', 'vi', 'lo'),
      fc.constantFrom('items', 'characters', 'translations', 'files'),
      (language: Language, pluralKey: string) => {
        i18n.global.locale.value = language
        
        const fullKey = `pluralization.${pluralKey}`
        
        // Test edge cases
        const edgeCases = [0, 1, 2, 10, 100, 1000]
        
        for (const count of edgeCases) {
          const translation = i18n.global.t(fullKey, { count })
          
          // Should always return a valid translation
          expect(translation).toBeDefined()
          expect(translation).not.toBe(fullKey)
          expect(typeof translation).toBe('string')
          expect(translation.length).toBeGreaterThan(0)
          
          // Should handle the count appropriately based on language
          if (language === 'en') {
            if (count === 0) {
              expect(translation.toLowerCase()).toMatch(/(no|0)\s+\w+/)
            } else if (count === 1) {
              expect(translation.toLowerCase()).toMatch(/(one|1)\s+\w+/)
            } else {
              expect(translation).toContain(count.toString())
            }
          } else {
            // Vietnamese and Lao always include the count
            expect(translation).toContain(count.toString())
          }
        }
        
        return true
      }
    ), { numRuns: 50 })
  })
})