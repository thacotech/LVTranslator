import { computed } from 'vue'
import { useI18n as useVueI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settings'
import type { Language } from '@/types'

/**
 * Enhanced i18n composable that integrates with settings store
 * Provides dynamic language switching and locale management
 */
export function useI18n() {
  const { locale, t, n, d, availableLocales } = useVueI18n()
  const settingsStore = useSettingsStore()

  // Computed properties
  const currentLocale = computed(() => locale.value as Language)
  const supportedLocales = computed(() => ['en', 'vi', 'lo'] as Language[])

  /**
   * Change the application language
   * Updates both i18n locale and settings store
   */
  function changeLanguage(newLanguage: Language) {
    if (!supportedLocales.value.includes(newLanguage)) {
      console.warn(`Language ${newLanguage} is not supported`)
      return
    }

    // Update i18n locale
    locale.value = newLanguage
    
    // Update settings store (which handles localStorage persistence)
    settingsStore.setLanguage(newLanguage)
  }

  /**
   * Get localized language name
   */
  function getLanguageName(lang: Language): string {
    const names = {
      en: t('languages.english'),
      vi: t('languages.vietnamese'),
      lo: t('languages.lao')
    }
    return names[lang] || lang
  }

  /**
   * Check if a language is supported
   */
  function isLanguageSupported(lang: string): lang is Language {
    return supportedLocales.value.includes(lang as Language)
  }

  /**
   * Get browser language preference
   */
  function getBrowserLanguage(): Language {
    const browserLang = navigator.language || navigator.languages?.[0] || 'en'
    
    if (browserLang.startsWith('vi')) return 'vi'
    if (browserLang.startsWith('lo')) return 'lo'
    if (browserLang.startsWith('en')) return 'en'
    
    return 'en'
  }

  /**
   * Auto-detect and set language based on browser preference
   */
  function autoDetectLanguage() {
    const detectedLang = getBrowserLanguage()
    changeLanguage(detectedLang)
  }

  /**
   * Pluralization helper for different languages
   */
  function pluralize(key: string, count: number, options?: Record<string, any>) {
    return t(key, { count, ...options }, count)
  }

  /**
   * Format number according to current locale
   */
  function formatNumber(value: number, format = 'decimal') {
    return n(value, format)
  }

  /**
   * Format date according to current locale
   */
  function formatDate(value: Date | number, format = 'short') {
    return d(value, format)
  }

  /**
   * Get relative time string (e.g., "2 minutes ago")
   */
  function getRelativeTime(timestamp: number): string {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) {
      return t('time.justNow')
    } else if (minutes === 1) {
      return `1 ${t('time.minuteAgo')}`
    } else if (minutes < 60) {
      return `${minutes} ${t('time.minutesAgo')}`
    } else if (hours === 1) {
      return `1 ${t('time.hourAgo')}`
    } else if (hours < 24) {
      return `${hours} ${t('time.hoursAgo')}`
    } else if (days === 1) {
      return `1 ${t('time.dayAgo')}`
    } else {
      return `${days} ${t('time.daysAgo')}`
    }
  }

  return {
    // Vue i18n functions
    t,
    n,
    d,
    
    // Computed properties
    currentLocale,
    supportedLocales,
    availableLocales,
    
    // Language management
    changeLanguage,
    getLanguageName,
    isLanguageSupported,
    getBrowserLanguage,
    autoDetectLanguage,
    
    // Formatting helpers
    pluralize,
    formatNumber,
    formatDate,
    getRelativeTime
  }
}