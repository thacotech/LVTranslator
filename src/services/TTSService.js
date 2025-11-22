/**
 * Text-to-Speech Service
 * Handles speech synthesis using Web Speech API
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8
 */

class TTSService {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.utterance = null;
    this.voices = [];
    this.settings = {
      rate: 1.0,    // 0.5x to 2.0x
      pitch: 1.0,   // 0.0 to 2.0
      volume: 1.0   // 0.0 to 1.0
    };
    this.isPlaying = false;
    this.isPaused = false;
    this.currentPosition = 0;
    this.onBoundaryCallback = null;
  }

  /**
   * Initialize TTS service and load available voices
   * @returns {Promise<void>}
   */
  async init() {
    return new Promise((resolve) => {
      // Load voices
      this.voices = this.synthesis.getVoices();
      
      if (this.voices.length === 0) {
        // Voices may load asynchronously
        this.synthesis.onvoiceschanged = () => {
          this.voices = this.synthesis.getVoices();
          console.log(`Loaded ${this.voices.length} voices`);
          resolve();
        };
      } else {
        console.log(`Loaded ${this.voices.length} voices`);
        resolve();
      }
    });
  }

  /**
   * Speak text with current settings
   * @param {string} text - Text to speak
   * @param {string} lang - Language code (vi-VN, lo-LA, en-US)
   * @param {Function} onBoundary - Callback for word boundaries (charIndex, charLength)
   * @returns {Promise<void>}
   */
  speak(text, lang = 'vi-VN', onBoundary = null) {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported in this browser'));
        return;
      }

      if (!text || text.trim() === '') {
        reject(new Error('Text is empty'));
        return;
      }

      // Stop any ongoing speech
      this.stop();

      this.utterance = new SpeechSynthesisUtterance(text);
      this.utterance.lang = lang;
      this.utterance.rate = this.settings.rate;
      this.utterance.pitch = this.settings.pitch;
      this.utterance.volume = this.settings.volume;

      // Set voice if available for language
      const voice = this.getVoiceForLanguage(lang);
      if (voice) {
        this.utterance.voice = voice;
        console.log(`Using voice: ${voice.name} (${voice.lang})`);
      } else {
        console.warn(`No specific voice found for ${lang}, using default`);
      }

      // Event handlers
      this.utterance.onstart = () => {
        this.isPlaying = true;
        this.isPaused = false;
        console.log('TTS started');
      };

      this.utterance.onend = () => {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentPosition = 0;
        console.log('TTS ended');
        resolve();
      };

      this.utterance.onerror = (event) => {
        this.isPlaying = false;
        this.isPaused = false;
        console.error('TTS error:', event.error);
        reject(new Error(`TTS Error: ${event.error}`));
      };

      // Word boundary for text highlighting
      if (onBoundary) {
        this.onBoundaryCallback = onBoundary;
        this.utterance.onboundary = (event) => {
          if (event.name === 'word') {
            onBoundary(event.charIndex, event.charLength || 0);
          }
        };
      }

      // Speak
      this.synthesis.speak(this.utterance);
    });
  }

  /**
   * Pause speech
   */
  pause() {
    if (this.synthesis && this.isPlaying && !this.isPaused) {
      this.synthesis.pause();
      this.isPaused = true;
      this.isPlaying = false;
      console.log('TTS paused');
    }
  }

  /**
   * Resume speech
   */
  resume() {
    if (this.synthesis && !this.isPlaying && this.isPaused) {
      this.synthesis.resume();
      this.isPlaying = true;
      this.isPaused = false;
      console.log('TTS resumed');
    }
  }

  /**
   * Stop speech
   */
  stop() {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.isPlaying = false;
      this.isPaused = false;
      this.currentPosition = 0;
      console.log('TTS stopped');
    }
  }

  /**
   * Get voice for specific language
   * @param {string} lang - Language code (vi-VN, lo-LA, en-US)
   * @returns {SpeechSynthesisVoice|null}
   */
  getVoiceForLanguage(lang) {
    if (!this.voices || this.voices.length === 0) {
      console.warn('[TTS] No voices available');
      return null;
    }

    // Try exact match first
    let voice = this.voices.find(v => v.lang === lang);
    
    if (!voice) {
      // Try partial match (e.g., vi-VN matches vi)
      const langPrefix = lang.split('-')[0].toLowerCase();
      voice = this.voices.find(v => v.lang.toLowerCase().startsWith(langPrefix));
    }

    // For Vietnamese: try alternative codes
    if (!voice && lang.includes('vi')) {
      voice = this.voices.find(v => 
        v.lang.toLowerCase().includes('vi') || 
        v.name.toLowerCase().includes('vietnamese')
      );
    }

    // For Lao: try alternative codes
    if (!voice && lang.includes('lo')) {
      voice = this.voices.find(v => 
        v.lang.toLowerCase().includes('lo') ||
        v.name.toLowerCase().includes('lao')
      );
    }

    if (voice) {
      console.log(`[TTS] ✓ Found voice for ${lang}: ${voice.name} (${voice.lang})`);
    } else {
      console.warn(`[TTS] ⚠ No voice found for ${lang}, using default`);
      voice = this.voices[0]; // Fallback to first available
    }
    
    return voice;
  }

  /**
   * Get all available voices
   * @returns {SpeechSynthesisVoice[]}
   */
  getVoices() {
    return this.voices;
  }

  /**
   * Get voices for a specific language
   * @param {string} lang - Language code
   * @returns {SpeechSynthesisVoice[]}
   */
  getVoicesForLanguage(lang) {
    const langPrefix = lang.split('-')[0];
    return this.voices.filter(v => 
      v.lang === lang || v.lang.startsWith(langPrefix)
    );
  }

  /**
   * Check if native voice is available for language
   * @param {string} lang - Language code (vi-VN, lo-LA, en-US)
   * @returns {boolean}
   */
  hasNativeVoiceForLanguage(lang) {
    if (!this.voices || this.voices.length === 0) {
      return false;
    }

    const langPrefix = lang.split('-')[0].toLowerCase();
    
    // Try exact match
    let voice = this.voices.find(v => v.lang === lang);
    if (voice) return true;

    // Try partial match
    voice = this.voices.find(v => v.lang.toLowerCase().startsWith(langPrefix));
    if (voice) return true;

    // For Vietnamese
    if (lang.includes('vi')) {
      voice = this.voices.find(v => 
        v.lang.toLowerCase().includes('vi') || 
        v.name.toLowerCase().includes('vietnamese')
      );
      if (voice) return true;
    }

    // For Lao
    if (lang.includes('lo')) {
      voice = this.voices.find(v => 
        v.lang.toLowerCase().includes('lo') ||
        v.name.toLowerCase().includes('lao')
      );
      if (voice) return true;
    }

    return false;
  }

  /**
   * Get language name from code
   * @param {string} lang - Language code
   * @returns {string}
   */
  getLanguageName(lang) {
    const langMap = {
      'vi': 'Vietnamese',
      'vi-VN': 'Vietnamese',
      'lo': 'Lao',
      'lo-LA': 'Lao',
      'en': 'English',
      'en-US': 'English'
    };
    
    const langPrefix = lang.split('-')[0].toLowerCase();
    return langMap[lang] || langMap[langPrefix] || lang;
  }

  /**
   * Update TTS settings
   * @param {Object} settings - New settings {rate, pitch, volume, voice}
   */
  updateSettings(settings) {
    if (settings.rate !== undefined) {
      this.settings.rate = Math.max(0.5, Math.min(2.0, settings.rate));
    }
    if (settings.pitch !== undefined) {
      this.settings.pitch = Math.max(0.0, Math.min(2.0, settings.pitch));
    }
    if (settings.volume !== undefined) {
      this.settings.volume = Math.max(0.0, Math.min(1.0, settings.volume));
    }
    
    console.log('TTS settings updated:', this.settings);
    
    // Save to localStorage
    this.saveSettings();
  }

  /**
   * Save settings to localStorage
   */
  saveSettings() {
    try {
      localStorage.setItem('tts_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save TTS settings:', error);
    }
  }

  /**
   * Load settings from localStorage
   */
  loadSettings() {
    try {
      const saved = localStorage.getItem('tts_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.updateSettings(settings);
      }
    } catch (error) {
      console.error('Failed to load TTS settings:', error);
    }
  }

  /**
   * Get current settings
   * @returns {Object} Current settings
   */
  getSettings() {
    return { ...this.settings };
  }

  /**
   * Get current state
   * @returns {Object} Current state
   */
  getState() {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      isSupported: TTSService.isSupported()
    };
  }

  /**
   * Check if TTS is supported
   * @returns {boolean}
   */
  static isSupported() {
    return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }
}

export default TTSService;

