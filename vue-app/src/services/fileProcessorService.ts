import mammoth from 'mammoth'
import * as pdfjsLib from 'pdfjs-dist'
import type { 
  FileType, 
  ValidationResult, 
  ValidationError,
  ValidationWarning,
  ProcessedFile, 
  FileProcessorService as IFileProcessorService
} from '@/types'

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  (pdfjsLib as any).GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`
}

export class FileProcessorService implements IFileProcessorService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async processFile(file: File): Promise<ProcessedFile> {
    const validation = this.validateFile(file)
    if (!validation.isValid) {
      throw new Error(validation.errors.map(e => e.message).join(', '))
    }

    const fileType = this.getFileType(file)
    const startTime = Date.now()

    try {
      const extractedText = await this.extractText(file, fileType)
      const processingTime = Date.now() - startTime

      return {
        id: crypto.randomUUID(),
        name: file.name,
        type: fileType,
        size: file.size,
        content: extractedText,
        metadata: {
          processingTime,
          pages: fileType === 'pdf' ? await this.getPdfPageCount(file) : undefined
        },
        extractedText,
        processingStatus: 'success'
      }
    } catch (error) {
      return {
        id: crypto.randomUUID(),
        name: file.name,
        type: fileType,
        size: file.size,
        content: '',
        metadata: {
          processingTime: Date.now() - startTime
        },
        extractedText: '',
        processingStatus: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async extractText(file: File, type: FileType): Promise<string> {
    switch (type) {
      case 'docx':
        return await this.extractFromDocx(file)
      case 'pdf':
        return await this.extractFromPdf(file)
      case 'image':
        return await this.extractFromImage(file)
      case 'txt':
        return await this.extractFromTxt(file)
      default:
        throw new Error(`Unsupported file type: ${type}`)
    }
  }

  private async extractFromTxt(file: File): Promise<string> {
    try {
      const text = await file.text()
      
      if (!text.trim()) {
        throw new Error('Text file is empty')
      }

      // Clean and validate the text
      const cleanedText = this.cleanExtractedText(text)
      
      // Check if cleaning removed all content
      if (!cleanedText || cleanedText.trim().length === 0) {
        // Return original text if cleaning was too aggressive
        return text.trim()
      }
      
      // Check for potential encoding issues
      if (cleanedText.includes('�')) {
        console.warn('Text file may have encoding issues')
      }

      return cleanedText
    } catch (error) {
      throw new Error(`Failed to extract text from file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  getSupportedTypes(): FileType[] {
    return ['docx', 'pdf', 'image', 'txt']
  }

  getMaxFileSize(): number {
    return 10 * 1024 * 1024 // 10MB
  }

  /**
   * Get file preview for validation
   */
  async getFilePreview(file: File, maxLines = 10): Promise<{
    lines?: string[]
    hasMore?: boolean
    totalLines?: number
    fileSize: number
    fileType: FileType
    error?: string
  }> {
    const validation = this.validateFile(file)
    if (!validation.isValid) {
      return { 
        error: validation.errors.map(e => e.message).join(', '),
        fileSize: file.size,
        fileType: this.getFileType(file)
      }
    }

    try {
      const fileType = this.getFileType(file)
      
      if (fileType === 'txt') {
        const text = await file.text()
        const lines = text.split('\n').slice(0, maxLines)
        const hasMore = text.split('\n').length > maxLines

        return {
          lines,
          hasMore,
          totalLines: text.split('\n').length,
          fileSize: file.size,
          fileType
        }
      }

      return {
        fileSize: file.size,
        fileType,
        lines: [`Preview not available for ${fileType} files`],
        hasMore: false,
        totalLines: 1
      }
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Unknown error',
        fileSize: file.size,
        fileType: this.getFileType(file)
      }
    }
  }

  validateFile(file: File): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Check if file exists
    if (!file) {
      errors.push({
        field: 'file',
        message: 'No file provided',
        code: 'NO_FILE',
        severity: 'error'
      })
      return { isValid: false, errors, warnings }
    }

    // Check if file is empty
    if (file.size === 0) {
      errors.push({ 
        field: 'file', 
        message: 'File is empty', 
        code: 'EMPTY_FILE',
        severity: 'error'
      })
    }

    // Check file size
    const maxSize = this.getMaxFileSize()
    if (file.size > maxSize) {
      errors.push({ 
        field: 'file', 
        message: `File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds ${(maxSize / (1024 * 1024))}MB limit`, 
        code: 'FILE_TOO_LARGE',
        severity: 'error'
      })
    }

    // Warn for large files
    if (file.size > maxSize * 0.8) {
      warnings.push({
        field: 'file',
        message: 'File is quite large and may take longer to process',
        code: 'LARGE_FILE'
      })
    }

    // Check file type by extension and MIME type
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const supportedExtensions = ['docx', 'pdf', 'jpg', 'jpeg', 'png', 'txt']
    const supportedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'text/plain'
    ]

    const isValidExtension = fileExtension && supportedExtensions.includes(fileExtension)
    const isValidMimeType = supportedMimeTypes.includes(file.type)

    if (!isValidExtension && !isValidMimeType) {
      errors.push({ 
        field: 'file', 
        message: `Unsupported file type. Supported formats: ${supportedExtensions.join(', ')}`, 
        code: 'UNSUPPORTED_FILE_TYPE',
        severity: 'error'
      })
    }

    // Warn about potential MIME type mismatch
    if (isValidExtension && !isValidMimeType) {
      warnings.push({
        field: 'file',
        message: 'File extension and MIME type may not match',
        code: 'MIME_TYPE_MISMATCH'
      })
    }

    // Check file name
    if (!file.name || file.name.trim() === '') {
      warnings.push({
        field: 'file',
        message: 'File has no name',
        code: 'NO_FILENAME'
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  private getFileType(file: File): FileType {
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return 'docx'
    } else if (file.type === 'application/pdf') {
      return 'pdf'
    } else if (file.type.startsWith('image/')) {
      return 'image'
    } else {
      return 'txt'
    }
  }

  private async extractFromDocx(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = async (e) => {
        try {
          const result = await mammoth.extractRawText({
            arrayBuffer: e.target?.result as ArrayBuffer,
          })

          if (!result.value || result.value.trim().length === 0) {
            throw new Error('No text content found in DOCX file')
          }

          // Clean up the extracted text
          const cleanedText = this.cleanExtractedText(result.value)
          resolve(cleanedText)
        } catch (error) {
          reject(new Error(`Failed to extract text from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`))
        }
      }

      reader.onerror = () => {
        reject(new Error('Failed to read DOCX file'))
      }

      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * Clean extracted text with consistent formatting
   */
  private cleanExtractedText(text: string): string {
    if (!text || text.trim().length === 0) {
      return ''
    }
    
    return text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks
      .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space (but preserve other chars)
      .replace(/\n /g, '\n') // Remove leading spaces after line breaks
      .replace(/^\s+|\s+$/gm, '') // Trim each line
      .trim()
  }

  private async extractFromPdf(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = async (e) => {
        try {
          const pdf = await pdfjsLib.getDocument({
            data: e.target?.result as ArrayBuffer,
          }).promise

          if (pdf.numPages === 0) {
            throw new Error('PDF file contains no pages')
          }

          let fullText = ''

          for (let i = 1; i <= pdf.numPages; i++) {
            try {
              const page = await pdf.getPage(i)
              const textContent = await page.getTextContent()

              // Better text extraction with proper spacing and line breaks
              let pageText = ''
              let lastItem: any = null

              textContent.items.forEach((item: any) => {
                if (lastItem) {
                  // Add line break if Y position changes significantly
                  const yDiff = Math.abs(item.transform[5] - lastItem.transform[5])
                  if (yDiff > 5) {
                    pageText += '\n'
                  }
                  // Add space if items are on same line but far apart
                  else if (item.transform[4] - (lastItem.transform[4] + (lastItem.width || 0)) > 10) {
                    pageText += ' '
                  }
                }
                pageText += item.str || ''
                lastItem = item
              })

              fullText += pageText + (i < pdf.numPages ? '\n\n' : '') // Double line break between pages
            } catch (pageError) {
              console.warn(`Failed to extract text from page ${i}:`, pageError)
              // Continue with other pages
            }
          }

          if (!fullText.trim()) {
            throw new Error('No text content found in PDF file')
          }

          // Clean up the text
          const cleanedText = this.cleanExtractedText(fullText)
          resolve(cleanedText)
        } catch (error) {
          reject(new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`))
        }
      }

      reader.onerror = () => {
        reject(new Error('Failed to read PDF file'))
      }

      reader.readAsArrayBuffer(file)
    })
  }

  private async extractFromImage(file: File): Promise<string> {
    // For image OCR, we'll use Gemini Vision API
    if (!this.apiKey || this.apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      throw new Error('API key is not configured for image text extraction')
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = async (e) => {
        try {
          const dataUrl = e.target?.result as string
          if (!dataUrl) {
            throw new Error('Failed to read image data')
          }

          const base64Data = dataUrl.split(',')[1]
          if (!base64Data) {
            throw new Error('Invalid image data format')
          }

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: 'Extract all text from this image. Return only the extracted text without any additional formatting or explanations. If no text is found, return "No text found in image".',
                      },
                      {
                        inline_data: {
                          mime_type: file.type,
                          data: base64Data,
                        },
                      },
                    ],
                  },
                ],
                generationConfig: {
                  temperature: 0.1,
                  maxOutputTokens: 2000,
                },
              }),
            }
          )

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(
              errorData.error?.message || `API request failed with status ${response.status}`
            )
          }

          const data = await response.json()
          
          if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Invalid response format from OCR API')
          }

          let extractedText = data.candidates[0].content.parts[0].text || ''
          
          // Clean up the extracted text
          extractedText = this.cleanExtractedText(extractedText)
          
          if (!extractedText || extractedText.toLowerCase().includes('no text found')) {
            throw new Error('No text content found in image')
          }

          resolve(extractedText)
        } catch (error) {
          reject(new Error(`Failed to extract text from image: ${error instanceof Error ? error.message : 'Unknown error'}`))
        }
      }

      reader.onerror = () => {
        reject(new Error('Failed to read image file'))
      }

      reader.readAsDataURL(file)
    })
  }

  private async getPdfPageCount(file: File): Promise<number> {
    return new Promise((resolve) => {
      const reader = new FileReader()

      reader.onload = async (e) => {
        try {
          const pdf = await pdfjsLib.getDocument({
            data: e.target?.result as ArrayBuffer,
          }).promise
          resolve(pdf.numPages)
        } catch (error) {
          resolve(1) // Default to 1 page if we can't determine
        }
      }

      reader.onerror = () => {
        resolve(1) // Default to 1 page on error
      }

      reader.readAsArrayBuffer(file)
    })
  }
}

// Composable for using the file processor service
export function useFileProcessorService() {
  // In a real app, this would come from environment variables or user settings
  const apiKey = 'AIzaSyBB5GrsVh8m6ls_6Q9n_JY4vtDELVgvZqI' // Replace with actual API key

  return new FileProcessorService(apiKey)
}