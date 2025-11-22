/**
 * TTS UI Component
 * Provides user interface for Text-to-Speech controls
 * Requirements: 1.3, 1.4, 1.5, 1.6, 1.7, 1.9
 */

import TTSService from '../services/TTSService.js';
import { ErrorHandler, ErrorCodes } from '../utils/errorHandler.js';

class TTSComponent {
  constructor(ttsService, container) {
    this.ttsService = ttsService;
    this.container = container;
    this.highlightedElement = null;
    this.currentHighlightIndex = -1;
    
    this.render();
    this.attachEventListeners();
    this.loadSettings();
  }

  /**
   * Render TTS controls UI
   */
  render() {
    this.container.innerHTML = `
      <div class="tts-controls">
        <div class="tts-main-controls">
          <button class="tts-btn tts-btn-play" id="ttsPlayBtn" title="Play (Alt+P)" aria-label="Play speech">
            <span class="icon">🔊</span>
            <span class="label">Play</span>
          </button>
          <button class="tts-btn tts-btn-pause" id="ttsPauseBtn" title="Pause" aria-label="Pause speech" disabled>
            <span class="icon">⏸️</span>
            <span class="label">Pause</span>
          </button>
          <button class="tts-btn tts-btn-stop" id="ttsStopBtn" title="Stop" aria-label="Stop speech" disabled>
            <span class="icon">⏹️</span>
            <span class="label">Stop</span>
          </button>
          
          <button class="tts-btn tts-btn-settings" id="ttsSettingsBtn" title="Settings" aria-label="TTS Settings">
            <span class="icon">⚙️</span>
          </button>
        </div>

        <!-- TTS Settings Panel (Hidden by default) -->
        <div class="tts-settings-panel" id="ttsSettingsPanel" style="display: none;">
          <div class="tts-setting">
            <label for="ttsSpeed">
              <span>Speed:</span>
              <span id="ttsSpeedValue">1.0x</span>
            </label>
            <input type="range" id="ttsSpeed" min="0.5" max="2.0" step="0.1" value="1.0">
          </div>

          <div class="tts-setting">
            <label for="ttsPitch">
              <span>Pitch:</span>
              <span id="ttsPitchValue">1.0</span>
            </label>
            <input type="range" id="ttsPitch" min="0.0" max="2.0" step="0.1" value="1.0">
          </div>

          <div class="tts-setting">
            <label for="ttsVolume">
              <span>Volume:</span>
              <span id="ttsVolumeValue">100%</span>
            </label>
            <input type="range" id="ttsVolume" min="0.0" max="1.0" step="0.1" value="1.0">
          </div>

          <div class="tts-setting">
            <label for="ttsVoice">Voice:</label>
            <select id="ttsVoice">
              <option value="">Default</option>
            </select>
          </div>

          <button class="tts-btn tts-btn-reset" id="ttsResetBtn" title="Reset to defaults">
            <span class="icon">🔄</span>
            <span class="label">Reset</span>
          </button>
        </div>

        <!-- Playing indicator -->
        <div class="tts-playing-indicator" id="ttsPlayingIndicator" style="display: none;">
          <span class="tts-pulse"></span>
          <span>Speaking...</span>
        </div>

        <!-- Language Not Supported Warning -->
        <div class="tts-language-warning" id="ttsLanguageWarning" style="display: none;">
          <div class="tts-warning-content">
            <span class="icon">⚠️</span>
            <div class="tts-warning-text">
              <strong id="ttsWarningTitle">Voice Not Available</strong>
              <p id="ttsWarningMessage"></p>
            </div>
          </div>
          <div class="tts-warning-actions">
            <button class="tts-btn tts-btn-secondary" id="ttsWarningClose">Cancel</button>
            <button class="tts-btn tts-btn-primary" id="ttsWarningContinue">Continue with English</button>
          </div>
          <a href="./TTS_VOICE_GUIDE.md" target="_blank" class="tts-help-link">📖 How to install language packs</a>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners to controls
   */
  attachEventListeners() {
    // Main controls
    const playBtn = document.getElementById('ttsPlayBtn');
    const pauseBtn = document.getElementById('ttsPauseBtn');
    const stopBtn = document.getElementById('ttsStopBtn');
    const settingsBtn = document.getElementById('ttsSettingsBtn');
    const resetBtn = document.getElementById('ttsResetBtn');

    playBtn.addEventListener('click', () => this.handlePlay());
    pauseBtn.addEventListener('click', () => this.handlePause());
    stopBtn.addEventListener('click', () => this.handleStop());
    settingsBtn.addEventListener('click', () => this.toggleSettings());
    resetBtn.addEventListener('click', () => this.resetSettings());

    // Settings controls
    const speedSlider = document.getElementById('ttsSpeed');
    const pitchSlider = document.getElementById('ttsPitch');
    const volumeSlider = document.getElementById('ttsVolume');
    const voiceSelect = document.getElementById('ttsVoice');

    speedSlider.addEventListener('input', (e) => this.updateSpeed(e.target.value));
    pitchSlider.addEventListener('input', (e) => this.updatePitch(e.target.value));
    volumeSlider.addEventListener('input', (e) => this.updateVolume(e.target.value));
    voiceSelect.addEventListener('change', (e) => this.updateVoice(e.target.value));

    // Load voices into dropdown
    this.loadVoices();

    // Keyboard shortcut (Alt+P)
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === 'p') {
        e.preventDefault();
        this.handlePlay();
      }
    });
  }

  /**
   * Load available voices into dropdown
   */
  async loadVoices() {
    await this.ttsService.init();
    const voices = this.ttsService.getVoices();
    const voiceSelect = document.getElementById('ttsVoice');
    
    // Clear existing options except default
    voiceSelect.innerHTML = '<option value="">Default</option>';
    
    // Add voices
    voices.forEach((voice, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = `${voice.name} (${voice.lang})`;
      voiceSelect.appendChild(option);
    });

    console.log(`Loaded ${voices.length} voices into dropdown`);
  }

  /**
   * Handle play button click
   */
  async handlePlay() {
    // Check if TTS is supported
    if (!TTSService.isSupported()) {
      ErrorHandler.handle(
        new Error('Text-to-Speech is not supported in this browser. Please use Chrome, Edge, or Safari.'),
        { code: ErrorCodes.TTS_NOT_SUPPORTED }
      );
      return;
    }

    // Get text to speak from output field
    const outputField = document.getElementById('outputText');
    if (!outputField) {
      console.error('Output field not found');
      return;
    }

    const text = outputField.value.trim();
    if (!text) {
      ErrorHandler.handle(
        new Error('No text to speak. Please translate something first.'),
        { code: ErrorCodes.INVALID_INPUT }
      );
      return;
    }

    // Get language from target language selector
    const langSelector = document.getElementById('targetLangSelector');
    const lang = langSelector ? this.getLangCode(langSelector.value) : 'vi-VN';

    // Check if native voice is available for this language
    if (!this.ttsService.hasNativeVoiceForLanguage(lang)) {
      const langName = this.ttsService.getLanguageName(lang);
      
      // Show warning and wait for user decision
      const shouldContinue = await this.showLanguageWarning(langName, lang);
      
      if (!shouldContinue) {
        console.log('[TTS] User cancelled playback due to missing voice');
        return;
      }
      
      // User chose to continue with English
      console.log('[TTS] Continuing with English voice as fallback');
    }

    try {
      // Update UI
      this.setPlayingState(true);

      // Speak with highlighting
      await this.ttsService.speak(text, lang, (charIndex, charLength) => {
        this.highlightText(outputField, charIndex, charLength);
      });

      // Update UI when done
      this.setPlayingState(false);
      this.clearHighlight();

    } catch (error) {
      this.setPlayingState(false);
      this.clearHighlight();
      ErrorHandler.handle(error, { 
        code: ErrorCodes.TTS_ERROR,
        context: 'TTS playback failed'
      });
    }
  }

  /**
   * Handle pause button click
   */
  handlePause() {
    const state = this.ttsService.getState();
    
    if (state.isPlaying) {
      this.ttsService.pause();
      this.updatePauseButton(true); // Show resume
    } else if (state.isPaused) {
      this.ttsService.resume();
      this.updatePauseButton(false); // Show pause
    }
  }

  /**
   * Handle stop button click
   */
  handleStop() {
    this.ttsService.stop();
    this.setPlayingState(false);
    this.clearHighlight();
  }

  /**
   * Toggle settings panel
   */
  toggleSettings() {
    const panel = document.getElementById('ttsSettingsPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  }

  /**
   * Update speed setting
   */
  updateSpeed(value) {
    const speed = parseFloat(value);
    this.ttsService.updateSettings({ rate: speed });
    document.getElementById('ttsSpeedValue').textContent = `${speed.toFixed(1)}x`;
  }

  /**
   * Update pitch setting
   */
  updatePitch(value) {
    const pitch = parseFloat(value);
    this.ttsService.updateSettings({ pitch });
    document.getElementById('ttsPitchValue').textContent = pitch.toFixed(1);
  }

  /**
   * Update volume setting
   */
  updateVolume(value) {
    const volume = parseFloat(value);
    this.ttsService.updateSettings({ volume });
    document.getElementById('ttsVolumeValue').textContent = `${Math.round(volume * 100)}%`;
  }

  /**
   * Update voice setting
   */
  updateVoice(voiceIndex) {
    if (voiceIndex === '') {
      // Use default
      return;
    }
    const voices = this.ttsService.getVoices();
    const voice = voices[parseInt(voiceIndex)];
    if (voice) {
      this.ttsService.updateSettings({ voice });
    }
  }

  /**
   * Reset settings to defaults
   */
  resetSettings() {
    this.ttsService.updateSettings({
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0
    });

    // Update UI
    document.getElementById('ttsSpeed').value = 1.0;
    document.getElementById('ttsPitch').value = 1.0;
    document.getElementById('ttsVolume').value = 1.0;
    document.getElementById('ttsSpeedValue').textContent = '1.0x';
    document.getElementById('ttsPitchValue').textContent = '1.0';
    document.getElementById('ttsVolumeValue').textContent = '100%';
    document.getElementById('ttsVoice').value = '';
  }

  /**
   * Load saved settings
   */
  loadSettings() {
    this.ttsService.loadSettings();
    const settings = this.ttsService.getSettings();

    // Update UI
    document.getElementById('ttsSpeed').value = settings.rate;
    document.getElementById('ttsPitch').value = settings.pitch;
    document.getElementById('ttsVolume').value = settings.volume;
    document.getElementById('ttsSpeedValue').textContent = `${settings.rate.toFixed(1)}x`;
    document.getElementById('ttsPitchValue').textContent = settings.pitch.toFixed(1);
    document.getElementById('ttsVolumeValue').textContent = `${Math.round(settings.volume * 100)}%`;
  }

  /**
   * Set playing state UI
   */
  setPlayingState(isPlaying) {
    const playBtn = document.getElementById('ttsPlayBtn');
    const pauseBtn = document.getElementById('ttsPauseBtn');
    const stopBtn = document.getElementById('ttsStopBtn');
    const indicator = document.getElementById('ttsPlayingIndicator');

    playBtn.disabled = isPlaying;
    pauseBtn.disabled = !isPlaying;
    stopBtn.disabled = !isPlaying;
    indicator.style.display = isPlaying ? 'flex' : 'none';
  }

  /**
   * Update pause button state
   */
  updatePauseButton(isPaused) {
    const pauseBtn = document.getElementById('ttsPauseBtn');
    const icon = pauseBtn.querySelector('.icon');
    const label = pauseBtn.querySelector('.label');

    if (isPaused) {
      icon.textContent = '▶️';
      label.textContent = 'Resume';
      pauseBtn.title = 'Resume';
    } else {
      icon.textContent = '⏸️';
      label.textContent = 'Pause';
      pauseBtn.title = 'Pause';
    }
  }

  /**
   * Show language not supported warning
   * @param {string} langName - Language name (e.g., 'Vietnamese', 'Lao')
   * @param {string} langCode - Language code (e.g., 'vi-VN', 'lo-LA')
   * @returns {Promise<boolean>} - true if user wants to continue with English
   */
  showLanguageWarning(langName, langCode) {
    return new Promise((resolve) => {
      const warning = document.getElementById('ttsLanguageWarning');
      const closeBtn = document.getElementById('ttsWarningClose');
      const continueBtn = document.getElementById('ttsWarningContinue');
      const messageEl = document.getElementById('ttsWarningMessage');

      // Set warning message
      messageEl.innerHTML = `
        <strong>${langName}</strong> voice is not available on your system.<br>
        Only <strong>English</strong> voice is currently supported.<br><br>
        Would you like to continue with English pronunciation, or cancel?
      `;

      // Show warning
      warning.style.display = 'block';

      // Handle close button
      const handleClose = () => {
        warning.style.display = 'none';
        closeBtn.removeEventListener('click', handleClose);
        continueBtn.removeEventListener('click', handleContinue);
        resolve(false);
      };

      // Handle continue button
      const handleContinue = () => {
        warning.style.display = 'none';
        closeBtn.removeEventListener('click', handleClose);
        continueBtn.removeEventListener('click', handleContinue);
        resolve(true);
      };

      closeBtn.addEventListener('click', handleClose);
      continueBtn.addEventListener('click', handleContinue);
    });
  }

  /**
   * Highlight text during playback
   */
  highlightText(element, charIndex, charLength) {
    const text = element.value;
    const start = charIndex;
    const end = charIndex + charLength;

    // Store current selection
    this.currentHighlightIndex = charIndex;

    // Highlight by setting selection (for textarea)
    element.setSelectionRange(start, end);
    element.focus();
  }

  /**
   * Clear text highlighting
   */
  clearHighlight() {
    const outputField = document.getElementById('outputText');
    if (outputField) {
      outputField.setSelectionRange(0, 0);
    }
    this.currentHighlightIndex = -1;
  }

  /**
   * Get language code for TTS
   */
  getLangCode(lang) {
    const langMap = {
      'vi': 'vi-VN',
      'lo': 'lo-LA',
      'en': 'en-US'
    };
    return langMap[lang] || 'vi-VN';
  }
}

export default TTSComponent;

