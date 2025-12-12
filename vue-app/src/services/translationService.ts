import type { 
  Language, 
  TranslationResult, 
  GeminiResponse, 
  ValidationResult,
  ValidationError,
  TranslationService as ITranslationService 
} from '@/types'

export class TranslationService implements ITranslationService {
  private cache = new Map<string, TranslationResult>()
  private apiKey: string
  private baseUrl =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async translate(text: string, from: Language, to: Language): Promise<TranslationResult> {
    if (!text.trim()) {
      throw new Error('Text cannot be empty')
    }

    if (from === to) {
      return {
        translatedText: text,
        confidence: 1.0,
      }
    }

    // Check cache first
    const cachedResult = this.getCachedTranslation(text, from, to)
    if (cachedResult) {
      return cachedResult
    }

    const languageNames = {
      vi: 'Vietnamese',
      lo: 'Lao',
      en: 'English',
    }

    const sourceLanguageName = languageNames[from]
    const targetLanguageName = languageNames[to]

    const prompt = `Translate the following ${sourceLanguageName} text to ${targetLanguageName}. Return only the complete translation without any explanations, formatting, or additional text:

${text}`

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2000,
            topP: 0.8,
            topK: 10,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.error?.message || `API request failed with status ${response.status}`
        )
      }

      const data: GeminiResponse = await response.json()

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response format from API')
      }

      let translation = data.candidates[0].content.parts[0].text

      // Clean up the response
      translation = translation.replace(/\*\*/g, '') // Remove bold formatting
      translation = translation.replace(/^.*?translation.*?:/i, '').trim() // Remove "translation:" prefix
      translation = translation.trim()

      const result: TranslationResult = {
        translatedText: translation,
        confidence: 0.9, // Default confidence
        metadata: {
          processingTime: 0,
          characterCount: text.length,
          wordCount: text.split(/\s+/).length,
        },
      }

      // Cache the result
      this.setCachedTranslation(text, from, to, result)

      return result
    } catch (error) {
      console.error('Translation API error:', error)
      throw error
    }
  }

  validateInput(text: string): ValidationResult {
    const errors: ValidationError[] = []

    if (!text.trim()) {
      errors.push({
        field: 'text',
        message: 'Text cannot be empty',
        code: 'EMPTY_TEXT',
        severity: 'error'
      })
    }

    if (text.length > 5000) {
      errors.push({
        field: 'text',
        message: 'Text exceeds maximum length of 5000 characters',
        code: 'TEXT_TOO_LONG',
        severity: 'error'
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    }
  }

  getCachedTranslation(text: string, from: Language, to: Language): TranslationResult | null {
    const cacheKey = `${text}-${from}-${to}`
    return this.cache.get(cacheKey) || null
  }

  clearCache(): void {
    this.cache.clear()
  }

  private setCachedTranslation(text: string, from: Language, to: Language, result: TranslationResult): void {
    const cacheKey = `${text}-${from}-${to}`
    this.cache.set(cacheKey, result)
  }

  detectLanguage(text: string): Language {
    // Simple language detection based on character patterns
    const laoPattern = /[\u0E80-\u0EFF]/
    const vietnamesePattern =
      /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i

    if (laoPattern.test(text)) {
      return 'lo'
    } else if (vietnamesePattern.test(text)) {
      return 'vi'
    } else {
      return 'en'
    }
  }
}

// Composable for using the translation service
export function useTranslationService() {
  // In a real app, this would come from environment variables or user settings
  const apiKey = 'AIzaSyBB5GrsVh8m6ls_6Q9n_JY4vtDELVgvZqI' // Replace with actual API key

  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    throw new Error('API key is not configured')
  }

  return new TranslationService(apiKey)
}
