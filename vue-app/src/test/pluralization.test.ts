import { describe, it, expect, beforeEach } from 'vitest'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'

// Import locale messages
import en from '@/locales/en.json'
import vi from '@/locales/vi.json'
import lo from '@/locales/lo.json'

describe('Pluralization Rules', () => {
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

  it('should handle English pluralization correctly', () => {
    i18n.global.locale.value = 'en'
    
    // Test zero case
    expect(i18n.global.t('pluralization.items', { count: 0 })).toBe('no items')
    
    // Test singular case
    expect(i18n.global.t('pluralization.items', { count: 1 })).toBe('one item')
    
    // Test plural case
    expect(i18n.global.t('pluralization.items', { count: 2 })).toBe('2 items')
    expect(i18n.global.t('pluralization.items', { count: 5 })).toBe('5 items')
  })

  it('should handle Vietnamese pluralization correctly', () => {
    i18n.global.locale.value = 'vi'
    
    // Vietnamese doesn't distinguish between singular and plural
    expect(i18n.global.t('pluralization.items', { count: 0 })).toBe('0 mục')
    expect(i18n.global.t('pluralization.items', { count: 1 })).toBe('1 mục')
    expect(i18n.global.t('pluralization.items', { count: 2 })).toBe('2 mục')
    expect(i18n.global.t('pluralization.items', { count: 5 })).toBe('5 mục')
  })

  it('should handle Lao pluralization correctly', () => {
    i18n.global.locale.value = 'lo'
    
    // Lao doesn't distinguish between singular and plural
    expect(i18n.global.t('pluralization.items', { count: 0 })).toBe('0 ລາຍການ')
    expect(i18n.global.t('pluralization.items', { count: 1 })).toBe('1 ລາຍການ')
    expect(i18n.global.t('pluralization.items', { count: 2 })).toBe('2 ລາຍການ')
    expect(i18n.global.t('pluralization.items', { count: 5 })).toBe('5 ລາຍການ')
  })

  it('should handle different pluralization keys', () => {
    i18n.global.locale.value = 'en'
    
    // Test characters
    expect(i18n.global.t('pluralization.characters', { count: 0 })).toBe('no characters')
    expect(i18n.global.t('pluralization.characters', { count: 1 })).toBe('one character')
    expect(i18n.global.t('pluralization.characters', { count: 10 })).toBe('10 characters')
    
    // Test translations
    expect(i18n.global.t('pluralization.translations', { count: 0 })).toBe('no translations')
    expect(i18n.global.t('pluralization.translations', { count: 1 })).toBe('one translation')
    expect(i18n.global.t('pluralization.translations', { count: 3 })).toBe('3 translations')
  })

  it('should work with numeric values in different languages', () => {
    const testCases = [
      { locale: 'en', count: 0, key: 'files', expected: 'no files' },
      { locale: 'en', count: 1, key: 'files', expected: 'one file' },
      { locale: 'en', count: 42, key: 'files', expected: '42 files' },
      { locale: 'vi', count: 0, key: 'files', expected: '0 tệp' },
      { locale: 'vi', count: 1, key: 'files', expected: '1 tệp' },
      { locale: 'vi', count: 42, key: 'files', expected: '42 tệp' },
      { locale: 'lo', count: 0, key: 'files', expected: '0 ໄຟລ໌' },
      { locale: 'lo', count: 1, key: 'files', expected: '1 ໄຟລ໌' },
      { locale: 'lo', count: 42, key: 'files', expected: '42 ໄຟລ໌' }
    ]

    testCases.forEach(({ locale, count, key, expected }) => {
      i18n.global.locale.value = locale
      const result = i18n.global.t(`pluralization.${key}`, { count })
      expect(result).toBe(expected)
    })
  })
})