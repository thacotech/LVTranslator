import { defineStore } from 'pinia'
import { ref, computed, shallowRef, markRaw, nextTick } from 'vue'
import type { Language, Theme, UserPreferences } from '@/types'

export const useSettingsStore = defineStore('settings', () => {
  // State - optimized with shallow refs for objects
  const language = ref<Language>('en')
  const theme = ref<Theme>('light')
  const preferences = shallowRef<UserPreferences>(markRaw({
    autoDetectLanguage: false,
    saveHistory: true,
    maxHistoryItems: 50,
    defaultSourceLanguage: 'vi',
    defaultTargetLanguage: 'lo',
    enableTTS: false,
    enableSTT: false,
    fontSize: 'medium',
  }))

  // Getters - cached for better performance
  const isDarkMode = computed(() => theme.value === 'dark')
  const isLaoInterface = computed(() => language.value === 'lo')

  // Actions
  function setLanguage(newLanguage: Language) {
    language.value = newLanguage
    localStorage.setItem('interfaceLanguage', newLanguage)

    // Batch DOM updates for better performance
    nextTick(() => {
      // Apply language-specific classes to body
      document.body.classList.remove('lao-interface', 'vietnamese-interface', 'english-interface')
      
      switch (newLanguage) {
        case 'lo':
          document.body.classList.add('lao-interface')
          break
        case 'vi':
          document.body.classList.add('vietnamese-interface')
          break
        case 'en':
          document.body.classList.add('english-interface')
          break
      }

      // Set document language attribute for accessibility
      document.documentElement.lang = newLanguage
    })
  }

  function setTheme(newTheme: Theme) {
    theme.value = newTheme
    localStorage.setItem('themeMode', newTheme)

    // Batch DOM updates for better performance
    nextTick(() => {
      // Apply theme classes
      if (newTheme === 'dark') {
        document.body.classList.add('dark-mode')
        document.documentElement.setAttribute('data-theme', 'dark')
      } else {
        document.body.classList.remove('dark-mode')
        document.documentElement.setAttribute('data-theme', 'light')
      }
    })
  }

  function toggleTheme() {
    setTheme(theme.value === 'light' ? 'dark' : 'light')
  }

  function updatePreferences(newPreferences: Partial<UserPreferences>) {
    // Create new object reference for better reactivity
    preferences.value = markRaw({ ...preferences.value, ...newPreferences })
    localStorage.setItem('userPreferences', JSON.stringify(preferences.value))
  }

  function loadSettings() {
    // Load interface language
    const savedLanguage = localStorage.getItem('interfaceLanguage') as Language
    if (savedLanguage && ['en', 'vi', 'lo'].includes(savedLanguage)) {
      setLanguage(savedLanguage)
    }

    // Load theme
    const savedTheme = localStorage.getItem('themeMode') as Theme
    if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
      setTheme(savedTheme)
    }

    // Load preferences
    try {
      const savedPreferences = localStorage.getItem('userPreferences')
      if (savedPreferences) {
        const parsed = JSON.parse(savedPreferences)
        preferences.value = { ...preferences.value, ...parsed }
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    }
  }

  function resetSettings() {
    setLanguage('en')
    setTheme('light')
    preferences.value = {
      autoDetectLanguage: false,
      saveHistory: true,
      maxHistoryItems: 50,
      defaultSourceLanguage: 'vi',
      defaultTargetLanguage: 'lo',
      enableTTS: false,
      enableSTT: false,
      fontSize: 'medium',
    }

    localStorage.removeItem('interfaceLanguage')
    localStorage.removeItem('themeMode')
    localStorage.removeItem('userPreferences')
  }

  // Initialize settings on store creation
  loadSettings()

  return {
    // State
    language,
    theme,
    preferences,

    // Getters
    isDarkMode,
    isLaoInterface,

    // Actions
    setLanguage,
    setTheme,
    toggleTheme,
    updatePreferences,
    loadSettings,
    resetSettings,
  }
})
