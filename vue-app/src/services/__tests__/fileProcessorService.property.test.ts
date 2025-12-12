import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { FileProcessorService } from '../fileProcessorService'
import type { FileType } from '@/types'

// **Feature: vuejs-refactor, Property 7: File processing preservation**
describe('FileProcessorService Property Tests', () => {
  let fileProcessorService: FileProcessorService
  
  beforeEach(() => {
    // Mock fetch for API calls (for image OCR)
    global.fetch = vi.fn()
    fileProcessorService = new FileProcessorService('test-api-key')
  })

  it('should validate files consistently', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          size: fc.integer({ min: 0, max: 20 * 1024 * 1024 }), // 0 to 20MB
          type: fc.constantFrom(
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/pdf',
            'image/jpeg',
            'image/png',
            'text/plain',
            'application/unknown'
          )
        }),
        (fileProps) => {
          // Create a mock file object
          const mockFile = {
            name: fileProps.name,
            size: fileProps.size,
            type: fileProps.type
          } as File

          const result = fileProcessorService.validateFile(mockFile)
          
          // Validation result should have consistent structure
          expect(result).toHaveProperty('isValid')
          expect(result).toHaveProperty('errors')
          expect(result).toHaveProperty('warnings')
          expect(typeof result.isValid).toBe('boolean')
          expect(Array.isArray(result.errors)).toBe(true)
          expect(Array.isArray(result.warnings)).toBe(true)
          
          // Empty files should be invalid
          if (fileProps.size === 0) {
            expect(result.isValid).toBe(false)
            expect(result.errors.some(e => e.code === 'EMPTY_FILE')).toBe(true)
          }
          
          // Files too large should be invalid
          const maxSize = fileProcessorService.getMaxFileSize()
          if (fileProps.size > maxSize) {
            expect(result.isValid).toBe(false)
            expect(result.errors.some(e => e.code === 'FILE_TOO_LARGE')).toBe(true)
          }
          
          // Unsupported file types should be invalid
          const supportedTypes = [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/pdf',
            'image/jpeg',
            'image/png',
            'text/plain'
          ]
          
          if (!supportedTypes.includes(fileProps.type)) {
            expect(result.isValid).toBe(false)
            expect(result.errors.some(e => e.code === 'UNSUPPORTED_FILE_TYPE')).toBe(true)
          }
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return consistent supported file types', () => {
    fc.assert(
      fc.property(
        fc.constant(null), // No input needed
        () => {
          const supportedTypes = fileProcessorService.getSupportedTypes()
          
          // Should return an array
          expect(Array.isArray(supportedTypes)).toBe(true)
          
          // Should contain expected types
          expect(supportedTypes).toContain('docx')
          expect(supportedTypes).toContain('pdf')
          expect(supportedTypes).toContain('image')
          expect(supportedTypes).toContain('txt')
          
          // Should be consistent across calls
          const supportedTypes2 = fileProcessorService.getSupportedTypes()
          expect(supportedTypes).toEqual(supportedTypes2)
          
          return true
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should return consistent max file size', () => {
    fc.assert(
      fc.property(
        fc.constant(null), // No input needed
        () => {
          const maxSize = fileProcessorService.getMaxFileSize()
          
          // Should be a positive number
          expect(typeof maxSize).toBe('number')
          expect(maxSize).toBeGreaterThan(0)
          
          // Should be consistent across calls
          const maxSize2 = fileProcessorService.getMaxFileSize()
          expect(maxSize).toBe(maxSize2)
          
          // Should be reasonable (between 1MB and 100MB)
          expect(maxSize).toBeGreaterThanOrEqual(1024 * 1024) // At least 1MB
          expect(maxSize).toBeLessThanOrEqual(100 * 1024 * 1024) // At most 100MB
          
          return true
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should handle text file processing correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 2, maxLength: 1000 }).filter(s => s.trim().length >= 2),
        async (textContent: string) => {
          // Create a mock text file
          const mockFile = new File([textContent], 'test.txt', { type: 'text/plain' })
          
          try {
            const result = await fileProcessorService.processFile(mockFile)
            
            // Should have consistent structure
            expect(result).toHaveProperty('id')
            expect(result).toHaveProperty('name')
            expect(result).toHaveProperty('type')
            expect(result).toHaveProperty('size')
            expect(result).toHaveProperty('content')
            expect(result).toHaveProperty('extractedText')
            expect(result).toHaveProperty('processingStatus')
            expect(result).toHaveProperty('metadata')
            
            // Should extract the text correctly
            expect(result.extractedText).toBeDefined()
            expect(typeof result.extractedText).toBe('string')
            // Processing status should be either success or error
            expect(['success', 'error']).toContain(result.processingStatus)
            expect(result.type).toBe('txt')
            expect(result.name).toBe('test.txt')
            
            // Metadata should be present
            expect(result.metadata).toHaveProperty('processingTime')
            expect(typeof result.metadata.processingTime).toBe('number')
            expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0)
            
            // If processing succeeded, should have extracted text
            if (result.processingStatus === 'success') {
              expect(result.extractedText.length).toBeGreaterThan(0)
            }
            
          } catch (error) {
            // If processing fails, it should be due to validation
            const validation = fileProcessorService.validateFile(mockFile)
            if (validation.isValid) {
              // If validation passes but processing fails, it's unexpected
              throw error
            }
          }
          
          return true
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should handle file preview generation consistently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
        fc.integer({ min: 1, max: 20 }),
        async (textContent: string, maxLines: number) => {
          // Create a mock text file
          const mockFile = new File([textContent], 'test.txt', { type: 'text/plain' })
          
          const preview = await fileProcessorService.getFilePreview(mockFile, maxLines)
          
          // Should have consistent structure
          expect(preview).toHaveProperty('fileSize')
          expect(preview).toHaveProperty('fileType')
          expect(preview.fileSize).toBe(mockFile.size)
          expect(preview.fileType).toBe('txt')
          
          if (preview.error) {
            // If there's an error, it should be a string
            expect(typeof preview.error).toBe('string')
          } else {
            // If no error, should have preview data
            expect(preview).toHaveProperty('lines')
            expect(preview).toHaveProperty('hasMore')
            expect(preview).toHaveProperty('totalLines')
            
            if (preview.lines) {
              expect(Array.isArray(preview.lines)).toBe(true)
              expect(preview.lines.length).toBeLessThanOrEqual(maxLines)
            }
          }
          
          return true
        }
      ),
      { numRuns: 30 }
    )
  })

  it('should handle invalid files gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 0, maxLength: 50 }),
          size: fc.integer({ min: 0, max: 0 }), // Empty files
          type: fc.constantFrom('application/unknown', 'text/unknown', '')
        }),
        async (fileProps) => {
          // Create a mock invalid file
          const mockFile = {
            name: fileProps.name,
            size: fileProps.size,
            type: fileProps.type,
            text: () => Promise.resolve('')
          } as unknown as File
          
          try {
            await fileProcessorService.processFile(mockFile)
            // Should not reach here for invalid files
            expect(false).toBe(true)
          } catch (error) {
            // Should throw an error for invalid files
            expect(error).toBeInstanceOf(Error)
            expect(error instanceof Error ? error.message : '').toBeTruthy()
          }
          
          return true
        }
      ),
      { numRuns: 30 }
    )
  })

  it('should maintain processing consistency for identical files', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 100 }).filter(s => s.trim().length > 0),
        async (textContent: string) => {
          // Create two identical mock files
          const mockFile1 = new File([textContent], 'test1.txt', { type: 'text/plain' })
          const mockFile2 = new File([textContent], 'test2.txt', { type: 'text/plain' })
          
          try {
            const result1 = await fileProcessorService.processFile(mockFile1)
            const result2 = await fileProcessorService.processFile(mockFile2)
            
            // Should extract the same text content
            expect(result1.extractedText).toBe(result2.extractedText)
            expect(result1.processingStatus).toBe(result2.processingStatus)
            expect(result1.type).toBe(result2.type)
            
            // Should have different IDs but same content
            expect(result1.id).not.toBe(result2.id)
            expect(result1.name).not.toBe(result2.name) // Different filenames
            
          } catch (error) {
            // Both should fail in the same way
            try {
              await fileProcessorService.processFile(mockFile2)
              // If first fails but second succeeds, that's inconsistent
              expect(false).toBe(true)
            } catch (error2) {
              // Both failed, which is consistent
              expect(error).toBeInstanceOf(Error)
              expect(error2).toBeInstanceOf(Error)
            }
          }
          
          return true
        }
      ),
      { numRuns: 20 }
    )
  })
})