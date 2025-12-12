import { defineStore } from 'pinia'
import { ref, computed, shallowRef, shallowReactive, markRaw } from 'vue'
import type { Language, Translation, HistoryItem } from '@/types'

export const useTranslationStore = defineStore('translation', () => {
  // State - optimized with shallow refs where appropriate
  const currentTranslation = shallowRef<Translation | null>(null)
  const history = shallowRef<HistoryItem[]>([])
  const isLoading = ref(false)
  const error = shallowRef<string | null>(null)
  const sourceLanguage = ref<Language>('vi')
  const targetLanguage = ref<Language>('lo')

  // Getters - memoized for better performance
  const hasTranslation = computed(() => currentTranslation.value !== null)
  const historyCount = computed(() => history.value.length)
  const recentHistory = computed(() => {
    // Use slice with shallow copy for better performance
    return history.value.length > 20 ? history.value.slice(0, 20) : history.value
  })

  // Actions
  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function setError(errorMessage: string | null) {
    error.value = errorMessage
  }

  function setCurrentTranslation(translation: Translation | null) {
    currentTranslation.value = translation
  }

  function setSourceLanguage(language: Language) {
    sourceLanguage.value = language
    localStorage.setItem('sourceLanguage', language)
  }

  function setTargetLanguage(language: Language) {
    targetLanguage.value = language
    localStorage.setItem('targetLanguage', language)
  }

  function switchLanguages() {
    const temp = sourceLanguage.value
    sourceLanguage.value = targetLanguage.value
    targetLanguage.value = temp

    localStorage.setItem('sourceLanguage', sourceLanguage.value)
    localStorage.setItem('targetLanguage', targetLanguage.value)
  }

  function addToHistory(translation: Translation) {
    const historyItem: HistoryItem = markRaw({
      id: Date.now(),
      sourceText: translation.sourceText,
      translatedText: translation.translatedText,
      direction: `${translation.sourceLanguage}-${translation.targetLanguage}`,
      timestamp: Date.now(),
      preview: {
        source:
          translation.sourceText.length > 50
            ? translation.sourceText.substring(0, 50) + '...'
            : translation.sourceText,
        translated:
          translation.translatedText.length > 50
            ? translation.translatedText.substring(0, 50) + '...'
            : translation.translatedText,
      },
    })

    // Create new array for better reactivity performance
    const newHistory = [...history.value]
    
    // Check for duplicate
    const existingIndex = newHistory.findIndex(
      (item) =>
        item.sourceText === translation.sourceText && item.direction === historyItem.direction
    )

    if (existingIndex !== -1) {
      // Update existing item
      newHistory[existingIndex] = historyItem
    } else {
      // Add new item to beginning
      newHistory.unshift(historyItem)
    }

    // Limit to 50 items
    if (newHistory.length > 50) {
      newHistory.splice(50)
    }

    // Update with new array reference
    history.value = newHistory
    saveHistoryToStorage()
  }

  function removeFromHistory(id: number) {
    const index = history.value.findIndex((item) => item.id === id)
    if (index !== -1) {
      history.value.splice(index, 1)
      saveHistoryToStorage()
    }
  }

  function clearHistory() {
    history.value = []
    localStorage.removeItem('lvtranslator_history')
  }

  function loadHistory() {
    try {
      const stored = localStorage.getItem('lvtranslator_history')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          history.value = parsed.sort((a, b) => b.timestamp - a.timestamp)
        }
      }
    } catch (error) {
      console.error('Error loading history:', error)
      history.value = []
    }
  }

  function saveHistoryToStorage() {
    try {
      localStorage.setItem('lvtranslator_history', JSON.stringify(history.value))
    } catch (error) {
      console.error('Error saving history:', error)
    }
  }

  function loadLanguageSettings() {
    const savedSource = localStorage.getItem('sourceLanguage') as Language
    const savedTarget = localStorage.getItem('targetLanguage') as Language

    if (savedSource) sourceLanguage.value = savedSource
    if (savedTarget) targetLanguage.value = savedTarget
  }

  // Initialize
  loadHistory()
  loadLanguageSettings()

  return {
    // State
    currentTranslation,
    history,
    isLoading,
    error,
    sourceLanguage,
    targetLanguage,

    // Getters
    hasTranslation,
    historyCount,
    recentHistory,

    // Actions
    setLoading,
    setError,
    setCurrentTranslation,
    setSourceLanguage,
    setTargetLanguage,
    switchLanguages,
    addToHistory,
    removeFromHistory,
    clearHistory,
    loadHistory,
    saveHistoryToStorage,
    loadLanguageSettings,
  }
})
