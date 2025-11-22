/**
 * Speech-to-Text Service
 * Handles speech recognition using Web Speech API
 * Requirements: 2.1, 2.2, 2.3, 2.5, 2.8, 2.9
 */

class STTService {
  constructor() {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = SpeechRecognition ? new SpeechRecognition() : null;
    
    this.isRecording = false;
    this.transcript = '';
    this.interimTranscript = '';
    this.finalTranscript = '';
    
    // Callbacks
    this.onResult = null;
    this.onInterimResult = null;
    this.onEnd = null;
    this.onError = null;
    this.onStart = null;
    
    // Auto-stop timer
    this.silenceTimer = null;
    this.silenceTimeout = 30000; // 30 seconds
    
    // Settings
    this.settings = {
      lang: 'vi-VN',
      continuous: true,
      interimResults: true,
      maxAlternatives: 1
    };
    
    if (this.recognition) {
      this.initRecognition();
    }
  }

  /**
   * Initialize speech recognition
   */
  initRecognition() {
    // Configure recognition
    this.recognition.continuous = this.settings.continuous;
    this.recognition.interimResults = this.settings.interimResults;
    this.recognition.maxAlternatives = this.settings.maxAlternatives;
    this.recognition.lang = this.settings.lang;

    // Event handlers
    this.recognition.onstart = () => {
      this.isRecording = true;
      console.log('STT started');
      if (this.onStart) {
        this.onStart();
      }
      
      // Start silence timer
      this.resetSilenceTimer();
    };

    this.recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      // Update transcripts
      if (final) {
        this.finalTranscript += final;
        this.transcript = this.finalTranscript;
        
        if (this.onResult) {
          this.onResult(this.finalTranscript, false);
        }
        
        // Reset silence timer on speech
        this.resetSilenceTimer();
      }

      if (interim) {
        this.interimTranscript = interim;
        
        if (this.onInterimResult) {
          this.onInterimResult(interim);
        }
      }
    };

    this.recognition.onerror = (event) => {
      console.error('STT error:', event.error);
      this.isRecording = false;
      this.clearSilenceTimer();
      
      if (this.onError) {
        this.onError(event.error, this.getErrorMessage(event.error));
      }
    };

    this.recognition.onend = () => {
      this.isRecording = false;
      console.log('STT ended');
      this.clearSilenceTimer();
      
      if (this.onEnd) {
        this.onEnd(this.finalTranscript);
      }
    };
  }

  /**
   * Start recording
   * @param {string} lang - Language code (vi-VN, lo-LA, en-US)
   * @returns {Promise<void>}
   */
  async start(lang = 'vi-VN') {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not supported in this browser'));
        return;
      }

      if (this.isRecording) {
        reject(new Error('Already recording'));
        return;
      }

      // Reset transcripts
      this.transcript = '';
      this.interimTranscript = '';
      this.finalTranscript = '';

      // Set language
      this.recognition.lang = lang;
      this.settings.lang = lang;

      // Start recognition
      try {
        this.recognition.start();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop recording
   */
  stop() {
    if (this.recognition && this.isRecording) {
      this.recognition.stop();
      this.clearSilenceTimer();
      console.log('STT stopped manually');
    }
  }

  /**
   * Abort recording
   */
  abort() {
    if (this.recognition && this.isRecording) {
      this.recognition.abort();
      this.isRecording = false;
      this.clearSilenceTimer();
      console.log('STT aborted');
    }
  }

  /**
   * Get current transcript
   * @returns {string}
   */
  getTranscript() {
    return this.finalTranscript;
  }

  /**
   * Get interim transcript
   * @returns {string}
   */
  getInterimTranscript() {
    return this.interimTranscript;
  }

  /**
   * Get full transcript (final + interim)
   * @returns {string}
   */
  getFullTranscript() {
    return this.finalTranscript + this.interimTranscript;
  }

  /**
   * Clear transcript
   */
  clearTranscript() {
    this.transcript = '';
    this.interimTranscript = '';
    this.finalTranscript = '';
  }

  /**
   * Set result callback
   * @param {Function} callback - Callback(transcript, isFinal)
   */
  setOnResult(callback) {
    this.onResult = callback;
  }

  /**
   * Set interim result callback
   * @param {Function} callback - Callback(interimTranscript)
   */
  setOnInterimResult(callback) {
    this.onInterimResult = callback;
  }

  /**
   * Set end callback
   * @param {Function} callback - Callback(finalTranscript)
   */
  setOnEnd(callback) {
    this.onEnd = callback;
  }

  /**
   * Set error callback
   * @param {Function} callback - Callback(error, message)
   */
  setOnError(callback) {
    this.onError = callback;
  }

  /**
   * Set start callback
   * @param {Function} callback - Callback()
   */
  setOnStart(callback) {
    this.onStart = callback;
  }

  /**
   * Update settings
   * @param {Object} settings - New settings
   */
  updateSettings(settings) {
    this.settings = { ...this.settings, ...settings };
    
    if (this.recognition) {
      this.recognition.continuous = this.settings.continuous;
      this.recognition.interimResults = this.settings.interimResults;
      this.recognition.maxAlternatives = this.settings.maxAlternatives;
      this.recognition.lang = this.settings.lang;
    }
    
    if (settings.silenceTimeout !== undefined) {
      this.silenceTimeout = settings.silenceTimeout;
    }
  }

  /**
   * Get current settings
   * @returns {Object}
   */
  getSettings() {
    return { ...this.settings, silenceTimeout: this.silenceTimeout };
  }

  /**
   * Get recording state
   * @returns {boolean}
   */
  getState() {
    return {
      isRecording: this.isRecording,
      isSupported: STTService.isSupported()
    };
  }

  /**
   * Reset silence timer
   */
  resetSilenceTimer() {
    this.clearSilenceTimer();
    
    this.silenceTimer = setTimeout(() => {
      console.log('Auto-stopping STT due to silence');
      this.stop();
    }, this.silenceTimeout);
  }

  /**
   * Clear silence timer
   */
  clearSilenceTimer() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  /**
   * Get user-friendly error message
   * @param {string} error - Error code
   * @returns {string}
   */
  getErrorMessage(error) {
    const errorMessages = {
      'no-speech': 'No speech detected. Please try again.',
      'audio-capture': 'Microphone not found or not working.',
      'not-allowed': 'Microphone permission denied. Please allow microphone access.',
      'network': 'Network error. Please check your connection.',
      'aborted': 'Recording was aborted.',
      'language-not-supported': 'Selected language is not supported.',
      'service-not-allowed': 'Speech recognition service is not allowed.'
    };

    return errorMessages[error] || `Speech recognition error: ${error}`;
  }

  /**
   * Check if STT is supported
   * @returns {boolean}
   */
  static isSupported() {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  /**
   * Request microphone permission
   * @returns {Promise<boolean>}
   */
  static async requestMicrophonePermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Stop the stream immediately (we just needed permission)
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  }
}

export default STTService;

