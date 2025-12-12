import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { TranslationService } from '../translationService'
import type { Language } from '@/types'

// **Feature: vuejs-refactor, Property 15: Translation caching**
describe('Translation Caching Property Tests', () => {
  let translationService: TranslationService
  let fetchCallCount: number
  
  beforeEach(() => {
    fetchCallCount = 0
    
    // Mock fetch for API calls with call counting
    global.fetch = vi.fn().mockImplementation(() => {
      fetchCallCount++
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{
                text: `translated_${fetchCallCount}`
              }]
            }
          }]
        })
      })
    })
    
    translationService = new TranslationService('test-api-key')
  })

  it('should cache translation results and avoid duplicate API calls', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        fc.constantFrom('vi', 'lo'),
        fc.constantFrom('vi', 'lo'),
        async (text: string, from: Language, to: Language) => {
          // Skip same language translations
          if (from === to) return true
          
          // Clear cache and reset call count
          translationService.clearCache()
          fetchCallCount = 0
          
          // First translation should make API call
          const result1 = await translationService.translate(text, from, to)
          expect(fetchCallCount).toBe(1)
          
          // Second identical translation should use cache
          const result2 = await translationService.translate(text, from, to)
          expect(fetchCallCount).toBe(1) // Should not increase
          
          // Results should be identical
          expect(result1.translatedText).toBe(result2.translatedText)
          expect(result1.confidence).toBe(result2.confidence)
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should cache different language pairs separately', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
        async (text: string) => {
          // Clear cache and reset call count
          translationService.clearCache()
          fetchCallCount = 0
          
          // Translate same text in different directions
          const viToLo = await translationService.translate(text, 'vi', 'lo')
          expect(fetchCallCount).toBe(1)
          
          const loToVi = await translationService.translate(text, 'lo', 'vi')
          expect(fetchCallCount).toBe(2) // Should make new API call
          
          // Repeat translations should use cache
          const viToLo2 = await translationService.translate(text, 'vi', 'lo')
          expect(fetchCallCount).toBe(2) // Should not increase
          
          const loToVi2 = await translationService.translate(text, 'lo', 'vi')
          expect(fetchCallCount).toBe(2) // Should not increase
          
          // Cached results should match
          expect(viToLo.translatedText).toBe(viToLo2.translatedText)
          expect(loToVi.translatedText).toBe(loToVi2.translatedText)
          
          return true
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should handle cache retrieval correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 40 }).filter(s => s.trim().length > 0),
        fc.constantFrom('vi', 'lo'),
        fc.constantFrom('vi', 'lo'),
        async (text: string, from: Language, to: Language) => {
          if (from === to) return true
          
          // Clear cache
          translationService.clearCache()
          
          // Initially no cache
          const cached1 = translationService.getCachedTranslation(text, from, to)
          expect(cached1).toBeNull()
          
          // After translation, should be cached
          const result = await translationService.translate(text, from, to)
          const cached2 = translationService.getCachedTranslation(text, from, to)
          
          expect(cached2).not.toBeNull()
          expect(cached2?.translatedText).toBe(result.translatedText)
          expect(cached2?.confidence).toBe(result.confidence)
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain cache consistency across multiple operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 2, maxLength: 5 })
          .filter(texts => texts.every(text => text.trim().length > 0)), // Filter out empty/whitespace strings
        fc.constantFrom('vi', 'lo'),
        fc.constantFrom('vi', 'lo'),
        async (texts: string[], from: Language, to: Language) => {
          if (from === to) return true
          
          // Clear cache and reset call count
          translationService.clearCache()
          fetchCallCount = 0
          
          // Translate all texts once
          const results1: any[] = []
          for (const text of texts) {
            results1.push(await translationService.translate(text, from, to))
          }
          
          const expectedCalls = texts.length
          expect(fetchCallCount).toBe(expectedCalls)
          
          // Translate all texts again - should use cache
          const results2: any[] = []
          for (const text of texts) {
            results2.push(await translationService.translate(text, from, to))
          }
          
          expect(fetchCallCount).toBe(expectedCalls) // Should not increase
          
          // Results should be identical
          for (let i = 0; i < texts.length; i++) {
            expect(results1[i].translatedText).toBe(results2[i].translatedText)
            expect(results1[i].confidence).toBe(results2[i].confidence)
          }
          
          return true
        }
      ),
      { numRuns: 30 }
    )
  })

  it('should clear cache properly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
        fc.constantFrom('vi', 'lo'),
        fc.constantFrom('vi', 'lo'),
        async (text: string, from: Language, to: Language) => {
          if (from === to) return true
          
          // Clear cache and reset call count
          translationService.clearCache()
          fetchCallCount = 0
          
          // Translate and cache
          await translationService.translate(text, from, to)
          expect(fetchCallCount).toBe(1)
          
          // Verify cached
          const cached1 = translationService.getCachedTranslation(text, from, to)
          expect(cached1).not.toBeNull()
          
          // Clear cache
          translationService.clearCache()
          
          // Should not be cached anymore
          const cached2 = translationService.getCachedTranslation(text, from, to)
          expect(cached2).toBeNull()
          
          // Next translation should make new API call
          await translationService.translate(text, from, to)
          expect(fetchCallCount).toBe(2)
          
          return true
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should handle cache key generation consistently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 25 }).filter(s => s.trim().length > 0),
        async (text: string) => {
          // Clear cache
          translationService.clearCache()
          
          // Same text with same languages should use same cache key
          await translationService.translate(text, 'vi', 'lo')
          const cached1 = translationService.getCachedTranslation(text, 'vi', 'lo')
          
          await translationService.translate(text, 'vi', 'lo')
          const cached2 = translationService.getCachedTranslation(text, 'vi', 'lo')
          
          expect(cached1).not.toBeNull()
          expect(cached2).not.toBeNull()
          expect(cached1?.translatedText).toBe(cached2?.translatedText)
          
          // Different language pair should have different cache
          await translationService.translate(text, 'lo', 'vi')
          const cached3 = translationService.getCachedTranslation(text, 'lo', 'vi')
          
          expect(cached3).not.toBeNull()
          // Should be different from vi->lo translation (unless text is same in both languages)
          
          return true
        }
      ),
      { numRuns: 50 }
    )
  })
})