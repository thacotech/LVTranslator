import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '../settings'
import type { Language, Theme, UserPreferences } from '@/types'
import * as fc from 'fast-check'

describe('Settings Store', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
    // Create fresh Pinia instance for each test
    setActivePinia(createPinia())
  })

  describe('Basic functionality', () => {
    it('should initialize with default state', () => {
      // Ensure localStorage.getItem returns null initially
      vi.mocked(localStorage.getItem).mockReturnValue(null)
      
      const store = useSettingsStore()
      
      expect(store.language).toBe('en')
      expect(store.theme).toBe('light')
      expect(store.preferences).toEqual({
        autoDetectLanguage: false,
        saveHistory: true,
        maxHistoryItems: 50,
        defaultSourceLanguage: 'vi',
        defaultTargetLanguage: 'lo',
        enableTTS: false,
        enableSTT: false,
        fontSize: 'medium',
      })
    })

    it('should set language and persist to localStorage', () => {
      const store = useSettingsStore()
      
      store.setLanguage('vi')
      
      expect(store.language).toBe('vi')
      expect(localStorage.setItem).toHaveBeenCalledWith('interfaceLanguage', 'vi')
    })

    it('should set theme and persist to localStorage', () => {
      const store = useSettingsStore()
      
      store.setTheme('dark')
      
      expect(store.theme).toBe('dark')
      expect(localStorage.setItem).toHaveBeenCalledWith('themeMode', 'dark')
    })

    it('should toggle theme', () => {
      const store = useSettingsStore()
      
      expect(store.theme).toBe('light')
      store.toggleTheme()
      expect(store.theme).toBe('dark')
      store.toggleTheme()
      expect(store.theme).toBe('light')
    })

    it('should update preferences', () => {
      const store = useSettingsStore()
      
      const newPreferences: Partial<UserPreferences> = {
        enableTTS: true,
        fontSize: 'large'
      }
      
      store.updatePreferences(newPreferences)
      
      expect(store.preferences.enableTTS).toBe(true)
      expect(store.preferences.fontSize).toBe('large')
      expect(localStorage.setItem).toHaveBeenCalledWith('userPreferences', expect.any(String))
    })
  })

  describe('Property-based tests', () => {
    // **Feature: vuejs-refactor, Property 5: Language persistence**
    it('should persist language settings across store instances', () => {
      fc.assert(fc.property(
        fc.constantFrom('vi', 'lo', 'en'),
        (language) => {
          // Clear localStorage and reset mocks
          localStorage.clear()
          vi.clearAllMocks()
          
          // Ensure localStorage.getItem returns null initially
          vi.mocked(localStorage.getItem).mockReturnValue(null)
          
          // Create first store instance and set language
          setActivePinia(createPinia())
          const store1 = useSettingsStore()
          store1.setLanguage(language)
          
          // Verify localStorage was called
          expect(localStorage.setItem).toHaveBeenCalledWith('interfaceLanguage', language)
          
          // Mock localStorage.getItem to return the stored language
          vi.mocked(localStorage.getItem).mockImplementation((key) => {
            if (key === 'interfaceLanguage') return language
            return null
          })
          
          // Create new store instance (simulating app restart)
          setActivePinia(createPinia())
          const store2 = useSettingsStore()
          
          // Language should be loaded from localStorage
          expect(store2.language).toBe(language)
          
          return true
        }
      ), { numRuns: 100 })
    })

    it('should persist theme settings across store instances', () => {
      fc.assert(fc.property(
        fc.constantFrom('light', 'dark'),
        (theme) => {
          // Clear localStorage and reset mocks
          localStorage.clear()
          vi.clearAllMocks()
          
          // Ensure localStorage.getItem returns null initially
          vi.mocked(localStorage.getItem).mockReturnValue(null)
          
          // Create first store instance and set theme
          setActivePinia(createPinia())
          const store1 = useSettingsStore()
          store1.setTheme(theme)
          
          // Verify localStorage was called
          expect(localStorage.setItem).toHaveBeenCalledWith('themeMode', theme)
          
          // Mock localStorage.getItem to return the stored theme
          vi.mocked(localStorage.getItem).mockImplementation((key) => {
            if (key === 'themeMode') return theme
            return null
          })
          
          // Create new store instance (simulating app restart)
          setActivePinia(createPinia())
          const store2 = useSettingsStore()
          
          // Theme should be loaded from localStorage
          expect(store2.theme).toBe(theme)
          
          return true
        }
      ), { numRuns: 100 })
    })

    it('should persist user preferences across store instances', () => {
      fc.assert(fc.property(
        fc.record({
          autoDetectLanguage: fc.boolean(),
          saveHistory: fc.boolean(),
          maxHistoryItems: fc.integer({ min: 10, max: 100 }),
          enableTTS: fc.boolean(),
          enableSTT: fc.boolean(),
          fontSize: fc.constantFrom('small', 'medium', 'large')
        }),
        (preferences) => {
          // Clear localStorage and reset mocks
          localStorage.clear()
          vi.clearAllMocks()
          
          // Ensure localStorage.getItem returns null initially
          vi.mocked(localStorage.getItem).mockReturnValue(null)
          
          // Create first store instance and update preferences
          setActivePinia(createPinia())
          const store1 = useSettingsStore()
          store1.updatePreferences(preferences)
          
          // Verify localStorage was called
          expect(localStorage.setItem).toHaveBeenCalledWith('userPreferences', expect.any(String))
          
          // Get the stored preferences data
          const storedData = (localStorage.setItem as any).mock.calls
            .find((call: any[]) => call[0] === 'userPreferences')?.[1]
          
          if (!storedData) return true
          
          // Mock localStorage.getItem to return the stored preferences
          vi.mocked(localStorage.getItem).mockImplementation((key) => {
            if (key === 'userPreferences') return storedData
            return null
          })
          
          // Create new store instance (simulating app restart)
          setActivePinia(createPinia())
          const store2 = useSettingsStore()
          
          // Preferences should be loaded from localStorage
          expect(store2.preferences.autoDetectLanguage).toBe(preferences.autoDetectLanguage)
          expect(store2.preferences.saveHistory).toBe(preferences.saveHistory)
          expect(store2.preferences.maxHistoryItems).toBe(preferences.maxHistoryItems)
          expect(store2.preferences.enableTTS).toBe(preferences.enableTTS)
          expect(store2.preferences.enableSTT).toBe(preferences.enableSTT)
          expect(store2.preferences.fontSize).toBe(preferences.fontSize)
          
          return true
        }
      ), { numRuns: 100 })
    })

    it('should handle invalid stored language gracefully', () => {
      fc.assert(fc.property(
        fc.string({ minLength: 1, maxLength: 10 }).filter(s => !['vi', 'lo', 'en'].includes(s)),
        (invalidLanguage) => {
          // Clear localStorage and reset mocks
          localStorage.clear()
          vi.clearAllMocks()
          
          // Mock localStorage.getItem to return invalid language
          vi.mocked(localStorage.getItem).mockImplementation((key) => {
            if (key === 'interfaceLanguage') return invalidLanguage
            return null
          })
          
          // Create store instance
          setActivePinia(createPinia())
          const store = useSettingsStore()
          
          // Should fall back to default language
          expect(store.language).toBe('en')
          
          return true
        }
      ), { numRuns: 100 })
    })

    it('should handle invalid stored theme gracefully', () => {
      fc.assert(fc.property(
        fc.string({ minLength: 1, maxLength: 10 }).filter(s => !['light', 'dark'].includes(s)),
        (invalidTheme) => {
          // Clear localStorage and reset mocks
          localStorage.clear()
          vi.clearAllMocks()
          
          // Mock localStorage.getItem to return invalid theme
          vi.mocked(localStorage.getItem).mockImplementation((key) => {
            if (key === 'themeMode') return invalidTheme
            return null
          })
          
          // Create store instance
          setActivePinia(createPinia())
          const store = useSettingsStore()
          
          // Should fall back to default theme
          expect(store.theme).toBe('light')
          
          return true
        }
      ), { numRuns: 100 })
    })

    it('should handle corrupted preferences data gracefully', () => {
      fc.assert(fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => {
          try {
            JSON.parse(s)
            return false // Valid JSON, skip
          } catch {
            return true // Invalid JSON, use this
          }
        }),
        (corruptedData) => {
          // Clear localStorage and reset mocks
          localStorage.clear()
          vi.clearAllMocks()
          
          // Mock localStorage.getItem to return corrupted data
          vi.mocked(localStorage.getItem).mockImplementation((key) => {
            if (key === 'userPreferences') return corruptedData
            return null
          })
          
          // Create store instance
          setActivePinia(createPinia())
          const store = useSettingsStore()
          
          // Should fall back to default preferences
          expect(store.preferences).toEqual({
            autoDetectLanguage: false,
            saveHistory: true,
            maxHistoryItems: 50,
            defaultSourceLanguage: 'vi',
            defaultTargetLanguage: 'lo',
            enableTTS: false,
            enableSTT: false,
            fontSize: 'medium',
          })
          
          return true
        }
      ), { numRuns: 100 })
    })
  })

  describe('Computed properties', () => {
    it('should compute isDarkMode correctly', () => {
      const store = useSettingsStore()
      
      expect(store.isDarkMode).toBe(false)
      
      store.setTheme('dark')
      expect(store.isDarkMode).toBe(true)
      
      store.setTheme('light')
      expect(store.isDarkMode).toBe(false)
    })

    it('should compute isLaoInterface correctly', () => {
      const store = useSettingsStore()
      
      expect(store.isLaoInterface).toBe(false)
      
      store.setLanguage('lo')
      expect(store.isLaoInterface).toBe(true)
      
      store.setLanguage('vi')
      expect(store.isLaoInterface).toBe(false)
    })
  })

  describe('Reset functionality', () => {
    it('should reset all settings to defaults', () => {
      const store = useSettingsStore()
      
      // Change some settings
      store.setLanguage('lo')
      store.setTheme('dark')
      store.updatePreferences({ enableTTS: true, fontSize: 'large' })
      
      // Reset
      store.resetSettings()
      
      // Should be back to defaults
      expect(store.language).toBe('en')
      expect(store.theme).toBe('light')
      expect(store.preferences).toEqual({
        autoDetectLanguage: false,
        saveHistory: true,
        maxHistoryItems: 50,
        defaultSourceLanguage: 'vi',
        defaultTargetLanguage: 'lo',
        enableTTS: false,
        enableSTT: false,
        fontSize: 'medium',
      })
    })
  })
})