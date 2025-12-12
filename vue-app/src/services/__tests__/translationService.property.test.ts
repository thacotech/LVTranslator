import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { TranslationService } from '../translationService'
import type { Language } from '@/types'

// **Feature: vuejs-refactor, Property 1: Translation functionality preservation**
describe('TranslationService Property Tests', () => {
  let translationService: TranslationService
  
  beforeEach(() => {
    // Mock fetch for API calls
    global.fetch = vi.fn()
    translationService = new TranslationService('test-api-key')
  })

  it('should preserve translation functionality - same input should produce consistent results', async () => {
    // Mock successful API response
    const mockResponse = {
      candidates: [{
        content: {
          parts: [{
            text: 'translated text'
          }]
        }
      }]
    }

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as Response)

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        fc.constantFrom('vi', 'lo', 'en'),
        fc.constantFrom('vi', 'lo', 'en'),
        async (text: string, sourceLang: Language, targetLang: Language) => {
          // Skip same language translations
          if (sourceLang === targetLang) {
            const result = await translationService.translate(text, sourceLang, targetLang)
            expect(result.translatedText).toBe(text)
            expect(result.confidence).toBe(1.0)
            return true
          }

          // Test that same input produces same output (caching)
          const result1 = await translationService.translate(text, sourceLang, targetLang)
          const result2 = await translationService.translate(text, sourceLang, targetLang)
          
          expect(result1.translatedText).toBe(result2.translatedText)
          expect(result1.confidence).toBe(result2.confidence)
          
          // Verify result structure
          expect(result1).toHaveProperty('translatedText')
          expect(result1).toHaveProperty('confidence')
          expect(result1).toHaveProperty('metadata')
          expect(typeof result1.translatedText).toBe('string')
          expect(typeof result1.confidence).toBe('number')
          expect(result1.confidence).toBeGreaterThanOrEqual(0)
          expect(result1.confidence).toBeLessThanOrEqual(1)
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle input validation consistently', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (text: string) => {
          const result = translationService.validateInput(text)
          
          // Validation result should have consistent structure
          expect(result).toHaveProperty('isValid')
          expect(result).toHaveProperty('errors')
          expect(result).toHaveProperty('warnings')
          expect(typeof result.isValid).toBe('boolean')
          expect(Array.isArray(result.errors)).toBe(true)
          expect(Array.isArray(result.warnings)).toBe(true)
          
          // Empty text should be invalid
          if (!text.trim()) {
            expect(result.isValid).toBe(false)
            expect(result.errors.length).toBeGreaterThan(0)
          }
          
          // Text too long should be invalid
          if (text.length > 5000) {
            expect(result.isValid).toBe(false)
            expect(result.errors.some(e => e.code === 'TEXT_TOO_LONG')).toBe(true)
          }
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should detect languages consistently', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        (text: string) => {
          const detectedLang = translationService.detectLanguage(text)
          
          // Should return a valid language
          expect(['vi', 'lo', 'en']).toContain(detectedLang)
          
          // Same text should always detect same language
          const detectedLang2 = translationService.detectLanguage(text)
          expect(detectedLang).toBe(detectedLang2)
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle caching correctly', async () => {
    const mockResponse = {
      candidates: [{
        content: {
          parts: [{
            text: 'cached translation'
          }]
        }
      }]
    }

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as Response)

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        fc.constantFrom('vi', 'lo'),
        fc.constantFrom('vi', 'lo'),
        async (text: string, from: Language, to: Language) => {
          if (from === to) return true
          
          // Clear cache first
          translationService.clearCache()
          
          // First call should not be cached
          const cached1 = translationService.getCachedTranslation(text, from, to)
          expect(cached1).toBeNull()
          
          // Translate and cache
          const result = await translationService.translate(text, from, to)
          
          // Second call should be cached
          const cached2 = translationService.getCachedTranslation(text, from, to)
          expect(cached2).not.toBeNull()
          expect(cached2?.translatedText).toBe(result.translatedText)
          
          return true
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should handle API errors gracefully', async () => {
    // Mock API error
    vi.mocked(fetch).mockRejectedValue(new Error('API Error'))

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        fc.constantFrom('vi', 'lo'),
        fc.constantFrom('vi', 'lo'),
        async (text: string, from: Language, to: Language) => {
          if (from === to) return true
          
          try {
            await translationService.translate(text, from, to)
            // Should not reach here
            expect(false).toBe(true)
          } catch (error) {
            // Should throw an error
            expect(error).toBeInstanceOf(Error)
          }
          
          return true
        }
      ),
      { numRuns: 20 }
    )
  })
})