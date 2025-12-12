/**
 * Text-to-Speech Service for Vue.js Application
 * Migrated from original TTSService.js with TypeScript support
 * Requirements: 4.5
 */

import type { Language } from '../types/enums'

export interface TTSSettings {
  rate: number    // 0.5x to 2.0x
  pitch: number   // 0.0 to 2.0
  volume: number  // 0.0 to 1.0
  voice?: SpeechSynthesisVoice
}

export interface TTSState {
  isPlaying: boolean
  isPaused: boolean
  isSupported: boolean
}

export class TTSService {
  private synthesis: SpeechSynthesis
  private utterance: SpeechSynthesisUtterance | null = null
  private voices: SpeechSynthesisVoice[] = []
  private settings: TTSSettings = {
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0
  }
  private isPlaying = false
  private isPaused = false
  private currentPosition = 0
  private onBoundaryCallback: ((charIndex: number, charLength: number) => void) | null = null

  constructor() {
    this.synthesis = window.speechSynthesis
  }

  /**
   * Initialize TTS service and load available voices
   */
  async init(): Promise<void> {
    return new Promise((resolve) => {
      // Load voices
      this.voices = this.synthesis.getVoices()
      
      if (this.voices.length === 0) {
        // Voices may load asynchronously
        this.synthesis.onvoiceschanged = () => {
          this.voices = this.synthesis.getVoices()
          console.log(`Loaded ${this.voices.length} voices`)
          resolve()
        }
      } else {
        console.log(`Loaded ${this.voices.length} voices`)
        resolve()
      }
    })
  }

  /**
   * Speak text with current settings
   */
  async speak(
    text: string, 
    lang: string = 'vi-VN', 
    onBoundary?: (charIndex: number, charLength: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported in this browser'))
        return
      }

      if (!text || text.trim() === '') {
        reject(new Error('Text is empty'))
        return
      }

      // Stop any ongoing speech
      this.stop()

      this.utterance = new SpeechSynthesisUtterance(text)
      this.utterance.lang = lang
      this.utterance.rate = this.settings.rate
      this.utterance.pitch = this.settings.pitch
      this.utterance.volume = this.settings.volume

      // Set voice if available for language
      const voice = this.getVoiceForLanguage(lang)
      if (voice) {
        this.utterance.voice = voice
        console.log(`Using voice: ${voice.name} (${voice.lang})`)
      } else {
        console.warn(`No specific voice found for ${lang}, using default`)
      }

      // Event handlers
      this.utterance.onstart = () => {
        this.isPlaying = true
        this.isPaused = false
        console.log('TTS started')
      }

      this.utterance.onend = () => {
        this.isPlaying = false
        this.isPaused = false
        this.currentPosition = 0
        console.log('TTS ended')
        resolve()
      }

      this.utterance.onerror = (event) => {
        this.isPlaying = false
        this.isPaused = false
        console.error('TTS error:', event.error)
        reject(new Error(`TTS Error: ${event.error}`))
      }

      // Word boundary for text highlighting
      if (onBoundary) {
        this.onBoundaryCallback = onBoundary
        this.utterance.onboundary = (event) => {
          if (event.name === 'word') {
            onBoundary(event.charIndex, event.charLength || 0)
          }
        }
      }

      // Speak
      this.synthesis.speak(this.utterance)
    })
  }

  /**
   * Pause speech
   */
  pause(): void {
    if (this.synthesis && this.isPlaying && !this.isPaused) {
      this.synthesis.pause()
      this.isPaused = true
      this.isPlaying = false
      console.log('TTS paused')
    }
  }

  /**
   * Resume speech
   */
  resume(): void {
    if (this.synthesis && !this.isPlaying && this.isPaused) {
      this.synthesis.resume()
      this.isPlaying = true
      this.isPaused = false
      console.log('TTS resumed')
    }
  }

  /**
   * Stop speech
   */
  stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel()
      this.isPlaying = false
      this.isPaused = false
      this.currentPosition = 0
      console.log('TTS stopped')
    }
  }

  /**
   * Get voice for specific language
   */
  getVoiceForLanguage(lang: string): SpeechSynthesisVoice | null {
    if (!this.voices || this.voices.length === 0) {
      console.warn('[TTS] No voices available')
      return null
    }

    // Try exact match first
    let voice = this.voices.find(v => v.lang === lang)
    
    if (!voice) {
      // Try partial match (e.g., vi-VN matches vi)
      const langPrefix = lang.split('-')[0].toLowerCase()
      voice = this.voices.find(v => v.lang.toLowerCase().startsWith(langPrefix))
    }

    // For Vietnamese: try alternative codes
    if (!voice && lang.includes('vi')) {
      voice = this.voices.find(v => 
        v.lang.toLowerCase().includes('vi') || 
        v.name.toLowerCase().includes('vietnamese')
      )
    }

    // For Lao: try alternative codes
    if (!voice && lang.includes('lo')) {
      voice = this.voices.find(v => 
        v.lang.toLowerCase().includes('lo') ||
        v.name.toLowerCase().includes('lao')
      )
    }

    if (voice) {
      console.log(`[TTS] ✓ Found voice for ${lang}: ${voice.name} (${voice.lang})`)
    } else {
      console.warn(`[TTS] ⚠ No voice found for ${lang}, using default`)
      voice = this.voices[0] // Fallback to first available
    }
    
    return voice
  }

  /**
   * Get all available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    return this.voices
  }

  /**
   * Get voices for a specific language
   */
  getVoicesForLanguage(lang: string): SpeechSynthesisVoice[] {
    const langPrefix = lang.split('-')[0]
    return this.voices.filter(v => 
      v.lang === lang || v.lang.startsWith(langPrefix)
    )
  }

  /**
   * Check if native voice is available for language
   */
  hasNativeVoiceForLanguage(lang: string): boolean {
    if (!this.voices || this.voices.length === 0) {
      return false
    }

    const langPrefix = lang.split('-')[0].toLowerCase()
    
    // Try exact match
    let voice = this.voices.find(v => v.lang === lang)
    if (voice) return true

    // Try partial match
    voice = this.voices.find(v => v.lang.toLowerCase().startsWith(langPrefix))
    if (voice) return true

    // For Vietnamese
    if (lang.includes('vi')) {
      voice = this.voices.find(v => 
        v.lang.toLowerCase().includes('vi') || 
        v.name.toLowerCase().includes('vietnamese')
      )
      if (voice) return true
    }

    // For Lao
    if (lang.includes('lo')) {
      voice = this.voices.find(v => 
        v.lang.toLowerCase().includes('lo') ||
        v.name.toLowerCase().includes('lao')
      )
      if (voice) return true
    }

    return false
  }

  /**
   * Get language name from code
   */
  getLanguageName(lang: string): string {
    const langMap: Record<string, string> = {
      'vi': 'Vietnamese',
      'vi-VN': 'Vietnamese',
      'lo': 'Lao',
      'lo-LA': 'Lao',
      'en': 'English',
      'en-US': 'English'
    }
    
    const langPrefix = lang.split('-')[0].toLowerCase()
    return langMap[lang] || langMap[langPrefix] || lang
  }

  /**
   * Convert Language enum to TTS language code
   */
  getLangCode(lang: Language): string {
    const langMap: Record<Language, string> = {
      'vi': 'vi-VN',
      'lo': 'lo-LA',
      'en': 'en-US'
    }
    return langMap[lang] || 'vi-VN'
  }

  /**
   * Update TTS settings
   */
  updateSettings(settings: Partial<TTSSettings>): void {
    if (settings.rate !== undefined) {
      this.settings.rate = Math.max(0.5, Math.min(2.0, settings.rate))
    }
    if (settings.pitch !== undefined) {
      this.settings.pitch = Math.max(0.0, Math.min(2.0, settings.pitch))
    }
    if (settings.volume !== undefined) {
      this.settings.volume = Math.max(0.0, Math.min(1.0, settings.volume))
    }
    if (settings.voice !== undefined) {
      this.settings.voice = settings.voice
    }
    
    console.log('TTS settings updated:', this.settings)
    
    // Save to localStorage
    this.saveSettings()
  }

  /**
   * Save settings to localStorage
   */
  saveSettings(): void {
    try {
      const settingsToSave = {
        rate: this.settings.rate,
        pitch: this.settings.pitch,
        volume: this.settings.volume,
        voiceName: this.settings.voice?.name || null,
        voiceLang: this.settings.voice?.lang || null
      }
      localStorage.setItem('tts_settings', JSON.stringify(settingsToSave))
    } catch (error) {
      console.error('Failed to save TTS settings:', error)
    }
  }

  /**
   * Load settings from localStorage
   */
  loadSettings(): void {
    try {
      const saved = localStorage.getItem('tts_settings')
      if (saved) {
        const settings = JSON.parse(saved)
        
        // Restore basic settings
        this.updateSettings({
          rate: settings.rate,
          pitch: settings.pitch,
          volume: settings.volume
        })

        // Restore voice if available
        if (settings.voiceName && settings.voiceLang) {
          const voice = this.voices.find(v => 
            v.name === settings.voiceName && v.lang === settings.voiceLang
          )
          if (voice) {
            this.settings.voice = voice
          }
        }
      }
    } catch (error) {
      console.error('Failed to load TTS settings:', error)
    }
  }

  /**
   * Get current settings
   */
  getSettings(): TTSSettings {
    return { ...this.settings }
  }

  /**
   * Get current state
   */
  getState(): TTSState {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      isSupported: TTSService.isSupported()
    }
  }

  /**
   * Check if TTS is supported
   */
  static isSupported(): boolean {
    return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
  }
}

// Create singleton instance
export const ttsService = new TTSService()