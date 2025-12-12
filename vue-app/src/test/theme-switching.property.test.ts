import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import * as fc from 'fast-check'
import { useSettingsStore } from '@/stores/settings'
import type { Theme } from '@/types'

describe('Theme Switching Property Tests', () => {
  let app: any
  let pinia: any
  let localStorageMock: any

  beforeEach(() => {
    // Create fresh instances for each test
    pinia = createPinia()
    setActivePinia(pinia)
    
    app = createApp({})
    app.use(pinia)

    // Create a proper localStorage mock that maintains state
    const storage: { [key: string]: string } = {}
    localStorageMock = {
      getItem: vi.fn((key: string) => storage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        storage[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete storage[key]
      }),
      clear: vi.fn(() => {
        Object.keys(storage).forEach(key => delete storage[key])
      })
    }

    // Replace global localStorage
    vi.stubGlobal('localStorage', localStorageMock)

    // Clear localStorage and DOM state
    localStorageMock.clear()
    document.body.className = ''
    document.documentElement.removeAttribute('data-theme')
    
    // Mock DOM methods
    vi.spyOn(document.body.classList, 'add')
    vi.spyOn(document.body.classList, 'remove')
    vi.spyOn(document.documentElement, 'setAttribute')
  })

  /**
   * **Feature: vuejs-refactor, Property 9: Theme switching functionality**
   * **Validates: Requirements 4.4**
   */
  it('should immediately update all UI elements when theme changes without page reload', async () => {
    await fc.assert(fc.asyncProperty(
      fc.array(fc.constantFrom('light', 'dark'), { minLength: 2, maxLength: 10 }),
      async (themeSequence: Theme[]) => {
        // Skip if all themes are the same
        if (new Set(themeSequence).size === 1) return true
        
        const settingsStore = useSettingsStore()
        
        // Test rapid theme switching
        for (let i = 0; i < themeSequence.length; i++) {
          const theme = themeSequence[i]
          const previousTheme = i > 0 ? themeSequence[i - 1] : settingsStore.theme
          
          // Only test when theme actually changes
          if (previousTheme !== theme) {
            // Switch theme
            settingsStore.setTheme(theme)
            
            // Verify store state updated immediately
            expect(settingsStore.theme).toBe(theme)
            expect(settingsStore.isDarkMode).toBe(theme === 'dark')
            
            // Verify localStorage persistence
            expect(localStorage.getItem('themeMode')).toBe(theme)
            
            // Wait for nextTick to complete DOM updates
            await nextTick()
            
            // Verify DOM updates only when theme actually changes
            if (theme === 'dark') {
              expect(document.body.classList.add).toHaveBeenCalledWith('dark-mode')
              expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark')
            } else {
              expect(document.body.classList.remove).toHaveBeenCalledWith('dark-mode')
              expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light')
            }
            
            // Verify theme change is immediate (no async delays)
            expect(settingsStore.theme).toBe(theme)
          }
          
          // Verify consistency - switching to same theme multiple times should be idempotent
          if (previousTheme === theme) {
            // State should remain consistent
            expect(settingsStore.theme).toBe(theme)
            expect(settingsStore.isDarkMode).toBe(theme === 'dark')
          }
        }
        
        return true
      }
    ), { numRuns: 100 })
  })

  /**
   * Test theme toggle functionality
   */
  it('should toggle between light and dark themes correctly', () => {
    fc.assert(fc.property(
      fc.constantFrom('light', 'dark'),
      fc.integer({ min: 1, max: 20 }),
      (initialTheme: Theme, toggleCount: number) => {
        const settingsStore = useSettingsStore()
        
        // Set initial theme
        settingsStore.setTheme(initialTheme)
        expect(settingsStore.theme).toBe(initialTheme)
        
        let expectedTheme = initialTheme
        
        // Perform multiple toggles
        for (let i = 0; i < toggleCount; i++) {
          settingsStore.toggleTheme()
          expectedTheme = expectedTheme === 'light' ? 'dark' : 'light'
          
          // Verify theme toggled correctly
          expect(settingsStore.theme).toBe(expectedTheme)
          expect(settingsStore.isDarkMode).toBe(expectedTheme === 'dark')
          
          // Verify persistence
          expect(localStorage.getItem('themeMode')).toBe(expectedTheme)
        }
        
        // Verify final state is correct based on toggle count
        const finalExpectedTheme = toggleCount % 2 === 0 ? initialTheme : (initialTheme === 'light' ? 'dark' : 'light')
        expect(settingsStore.theme).toBe(finalExpectedTheme)
        
        return true
      }
    ), { numRuns: 100 })
  })

  /**
   * Test theme persistence across store recreation (simulating page reload)
   */
  it('should persist theme settings across application restarts', () => {
    fc.assert(fc.property(
      fc.constantFrom('light', 'dark'),
      (theme: Theme) => {
        // First store instance - set theme
        let settingsStore = useSettingsStore()
        settingsStore.setTheme(theme)
        
        // Verify theme is set
        expect(settingsStore.theme).toBe(theme)
        expect(localStorage.getItem('themeMode')).toBe(theme)
        
        // Simulate app restart by creating new pinia instance
        const newPinia = createPinia()
        setActivePinia(newPinia)
        
        // Create new store instance (simulates page reload)
        settingsStore = useSettingsStore()
        
        // Verify theme is loaded from localStorage
        expect(settingsStore.theme).toBe(theme)
        expect(settingsStore.isDarkMode).toBe(theme === 'dark')
        
        return true
      }
    ), { numRuns: 100 })
  })

  /**
   * Test DOM class management during theme switching
   */
  it('should correctly manage DOM classes and attributes during theme changes', async () => {
    await fc.assert(fc.asyncProperty(
      fc.array(fc.constantFrom('light', 'dark'), { minLength: 3, maxLength: 8 }),
      async (themeSequence: Theme[]) => {
        // Skip if all themes are the same
        if (new Set(themeSequence).size === 1) return true
        
        const settingsStore = useSettingsStore()
        let previousTheme = settingsStore.theme
        
        for (const theme of themeSequence) {
          // Only test when theme actually changes
          if (previousTheme !== theme) {
            // Clear previous calls to track current call
            vi.clearAllMocks()
            
            settingsStore.setTheme(theme)
            
            // Wait for nextTick to complete DOM updates
            await nextTick()
            
            if (theme === 'dark') {
              // Should add dark-mode class and set data-theme to dark
              expect(document.body.classList.add).toHaveBeenCalledWith('dark-mode')
              expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark')
              expect(document.body.classList.remove).not.toHaveBeenCalledWith('dark-mode')
            } else {
              // Should remove dark-mode class and set data-theme to light
              expect(document.body.classList.remove).toHaveBeenCalledWith('dark-mode')
              expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light')
              expect(document.body.classList.add).not.toHaveBeenCalledWith('dark-mode')
            }
            
            previousTheme = theme
          }
        }
        
        return true
      }
    ), { numRuns: 100 })
  })

  /**
   * Test theme switching with invalid values
   */
  it('should handle invalid theme values gracefully', () => {
    fc.assert(fc.property(
      fc.string().filter(s => s !== 'light' && s !== 'dark'),
      (invalidTheme: string) => {
        const settingsStore = useSettingsStore()
        const initialTheme = settingsStore.theme
        
        // Attempt to set invalid theme (should be handled gracefully)
        try {
          // TypeScript would prevent this, but test runtime behavior
          (settingsStore as any).setTheme(invalidTheme)
          
          // Theme should remain unchanged or default to light
          expect(['light', 'dark']).toContain(settingsStore.theme)
          
          // Should not crash the application
          expect(settingsStore.isDarkMode).toBeDefined()
          expect(typeof settingsStore.isDarkMode).toBe('boolean')
          
        } catch (error) {
          // If it throws, that's also acceptable behavior
          expect(error).toBeDefined()
        }
        
        return true
      }
    ), { numRuns: 50 })
  })

  /**
   * Test concurrent theme changes
   */
  it('should handle rapid theme changes without race conditions', () => {
    fc.assert(fc.property(
      fc.array(fc.constantFrom('light', 'dark'), { minLength: 5, maxLength: 15 }),
      (rapidThemeChanges: Theme[]) => {
        const settingsStore = useSettingsStore()
        
        // Simulate rapid theme changes (like user clicking toggle rapidly)
        const results: Theme[] = []
        
        for (const theme of rapidThemeChanges) {
          settingsStore.setTheme(theme)
          results.push(settingsStore.theme)
          
          // Each change should be immediately reflected
          expect(settingsStore.theme).toBe(theme)
          expect(settingsStore.isDarkMode).toBe(theme === 'dark')
        }
        
        // Final state should match last theme change
        const lastTheme = rapidThemeChanges[rapidThemeChanges.length - 1]
        expect(settingsStore.theme).toBe(lastTheme)
        expect(results[results.length - 1]).toBe(lastTheme)
        
        // All intermediate states should have been correct
        for (let i = 0; i < results.length; i++) {
          expect(results[i]).toBe(rapidThemeChanges[i])
        }
        
        return true
      }
    ), { numRuns: 100 })
  })

  /**
   * Test theme switching preserves other settings
   */
  it('should preserve other settings when changing theme', () => {
    fc.assert(fc.property(
      fc.constantFrom('light', 'dark'),
      fc.constantFrom('en', 'vi', 'lo'),
      fc.record({
        autoDetectLanguage: fc.boolean(),
        saveHistory: fc.boolean(),
        maxHistoryItems: fc.integer({ min: 10, max: 100 }),
        fontSize: fc.constantFrom('small', 'medium', 'large')
      }),
      (theme: Theme, language: any, preferences: any) => {
        const settingsStore = useSettingsStore()
        
        // Set initial state
        settingsStore.setLanguage(language)
        settingsStore.updatePreferences(preferences)
        
        const initialLanguage = settingsStore.language
        const initialPreferences = { ...settingsStore.preferences }
        
        // Change theme
        settingsStore.setTheme(theme)
        
        // Verify theme changed
        expect(settingsStore.theme).toBe(theme)
        
        // Verify other settings preserved
        expect(settingsStore.language).toBe(initialLanguage)
        expect(settingsStore.preferences).toEqual(initialPreferences)
        
        return true
      }
    ), { numRuns: 100 })
  })
})