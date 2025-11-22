/**
 * STT UI Component
 * Provides user interface for Speech-to-Text controls
 * Requirements: 2.1, 2.3, 2.4, 2.5, 2.10
 */

import STTService from '../services/STTService.js';
import { ErrorHandler, ErrorCodes } from '../utils/errorHandler.js';

class STTComponent {
  constructor(sttService, container) {
    this.sttService = sttService;
    this.container = container;
    this.targetInputField = null;
    
    this.render();
    this.attachEventListeners();
    this.setupCallbacks();
  }

  /**
   * Render STT controls UI
   */
  render() {
    this.container.innerHTML = `
      <div class="stt-controls">
        <div class="stt-main-controls">
          <button class="stt-btn stt-btn-record" id="sttRecordBtn" title="Start recording (Alt+R)" aria-label="Start voice input">
            <span class="icon">🎤</span>
            <span class="label">Voice Input</span>
          </button>
          
          <button class="stt-btn stt-btn-stop" id="sttStopBtn" title="Stop recording" aria-label="Stop voice input" style="display: none;">
            <span class="icon">⏹️</span>
            <span class="label">Stop</span>
          </button>
          
          <div class="stt-lang-selector">
            <label for="sttLangSelect">Language:</label>
            <select id="sttLangSelect">
              <option value="vi-VN">Vietnamese</option>
              <option value="lo-LA">Lao</option>
              <option value="en-US">English</option>
            </select>
          </div>
        </div>

        <!-- Recording Indicator (Hidden by default) -->
        <div class="stt-recording-indicator" id="sttRecordingIndicator" style="display: none;">
          <span class="stt-pulse"></span>
          <span>Listening...</span>
          <span class="stt-timer" id="sttTimer">0:00</span>
        </div>

        <!-- Interim Results Display -->
        <div class="stt-interim-results" id="sttInterimResults" style="display: none;">
          <div class="stt-interim-label">Recognized:</div>
          <div class="stt-interim-text" id="sttInterimText"></div>
        </div>

        <!-- Browser Support Warning -->
        <div class="stt-browser-warning" id="sttBrowserWarning" style="display: none;">
          <span class="icon">⚠️</span>
          <span>Speech recognition is not supported in this browser. Please use Chrome or Edge.</span>
        </div>

        <!-- Permission Instructions -->
        <div class="stt-permission-info" id="sttPermissionInfo" style="display: none;">
          <span class="icon">🔒</span>
          <span>Please allow microphone access to use voice input.</span>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    const recordBtn = document.getElementById('sttRecordBtn');
    const stopBtn = document.getElementById('sttStopBtn');
    const langSelect = document.getElementById('sttLangSelect');

    recordBtn.addEventListener('click', () => this.handleStartRecording());
    stopBtn.addEventListener('click', () => this.handleStopRecording());
    langSelect.addEventListener('change', (e) => this.updateLanguage(e.target.value));

    // Keyboard shortcut (Alt+R)
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === 'r') {
        e.preventDefault();
        const state = this.sttService.getState();
        if (!state.isRecording) {
          this.handleStartRecording();
        } else {
          this.handleStopRecording();
        }
      }
    });

    // Check browser support
    if (!STTService.isSupported()) {
      this.showBrowserWarning();
    }
  }

  /**
   * Setup STT service callbacks
   */
  setupCallbacks() {
    // On start
    this.sttService.setOnStart(() => {
      this.setRecordingState(true);
      this.startTimer();
    });

    // On interim result
    this.sttService.setOnInterimResult((interim) => {
      this.showInterimResult(interim);
    });

    // On final result
    this.sttService.setOnResult((transcript, isFinal) => {
      this.showInterimResult(transcript);
    });

    // On end
    this.sttService.setOnEnd((finalTranscript) => {
      this.setRecordingState(false);
      this.stopTimer();
      this.insertTranscriptToInput(finalTranscript);
      this.hideInterimResult();
    });

    // On error
    this.sttService.setOnError((error, message) => {
      this.setRecordingState(false);
      this.stopTimer();
      this.hideInterimResult();
      
      if (error === 'not-allowed') {
        this.showPermissionInfo();
        ErrorHandler.handle(
          new Error(message),
          { code: ErrorCodes.MICROPHONE_PERMISSION_DENIED }
        );
      } else {
        ErrorHandler.handle(
          new Error(message),
          { code: ErrorCodes.STT_ERROR, details: { error } }
        );
      }
    });
  }

  /**
   * Handle start recording button click
   */
  async handleStartRecording() {
    // Check if STT is supported
    if (!STTService.isSupported()) {
      ErrorHandler.handle(
        new Error('Speech recognition is not supported in this browser. Please use Chrome or Edge.'),
        { code: ErrorCodes.STT_NOT_SUPPORTED }
      );
      return;
    }

    // Request microphone permission
    const hasPermission = await STTService.requestMicrophonePermission();
    if (!hasPermission) {
      this.showPermissionInfo();
      ErrorHandler.handle(
        new Error('Microphone permission denied. Please allow microphone access in your browser settings.'),
        { code: ErrorCodes.MICROPHONE_PERMISSION_DENIED }
      );
      return;
    }

    // Get language
    const langSelect = document.getElementById('sttLangSelect');
    const lang = langSelect.value;

    try {
      // Start recording
      await this.sttService.start(lang);
      console.log(`Started STT in ${lang}`);
    } catch (error) {
      ErrorHandler.handle(error, {
        code: ErrorCodes.STT_ERROR,
        context: 'Failed to start speech recognition'
      });
    }
  }

  /**
   * Handle stop recording button click
   */
  handleStopRecording() {
    this.sttService.stop();
  }

  /**
   * Set recording state UI
   * @param {boolean} isRecording
   */
  setRecordingState(isRecording) {
    const recordBtn = document.getElementById('sttRecordBtn');
    const stopBtn = document.getElementById('sttStopBtn');
    const indicator = document.getElementById('sttRecordingIndicator');
    const langSelect = document.getElementById('sttLangSelect');

    if (isRecording) {
      recordBtn.style.display = 'none';
      stopBtn.style.display = 'flex';
      indicator.style.display = 'flex';
      langSelect.disabled = true;
    } else {
      recordBtn.style.display = 'flex';
      stopBtn.style.display = 'none';
      indicator.style.display = 'none';
      langSelect.disabled = false;
    }
  }

  /**
   * Show interim result
   * @param {string} text
   */
  showInterimResult(text) {
    const interimContainer = document.getElementById('sttInterimResults');
    const interimText = document.getElementById('sttInterimText');
    
    if (text) {
      interimContainer.style.display = 'block';
      interimText.textContent = text;
    }
  }

  /**
   * Hide interim result
   */
  hideInterimResult() {
    const interimContainer = document.getElementById('sttInterimResults');
    interimContainer.style.display = 'none';
  }

  /**
   * Insert transcript into input field
   * @param {string} transcript
   */
  insertTranscriptToInput(transcript) {
    if (!transcript) return;

    // Find input field (can be set externally or use default)
    const inputField = this.targetInputField || 
                       document.getElementById('inputText') ||
                       document.querySelector('.translation-input textarea');

    if (!inputField) {
      console.error('Input field not found');
      return;
    }

    // Insert transcript
    const currentValue = inputField.value;
    const newValue = currentValue ? `${currentValue} ${transcript}` : transcript;
    inputField.value = newValue.trim();

    // Trigger input event for any listeners
    inputField.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Focus input field
    inputField.focus();

    console.log('Inserted transcript:', transcript);
  }

  /**
   * Set target input field
   * @param {HTMLElement} inputField
   */
  setTargetInputField(inputField) {
    this.targetInputField = inputField;
  }

  /**
   * Update language setting
   * @param {string} lang
   */
  updateLanguage(lang) {
    this.sttService.updateSettings({ lang });
    console.log(`STT language set to: ${lang}`);
  }

  /**
   * Show browser warning
   */
  showBrowserWarning() {
    const warning = document.getElementById('sttBrowserWarning');
    const recordBtn = document.getElementById('sttRecordBtn');
    
    warning.style.display = 'flex';
    recordBtn.disabled = true;
  }

  /**
   * Show permission info
   */
  showPermissionInfo() {
    const info = document.getElementById('sttPermissionInfo');
    info.style.display = 'flex';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      info.style.display = 'none';
    }, 5000);
  }

  /**
   * Timer management
   */
  startTimer() {
    this.timerSeconds = 0;
    this.timerInterval = setInterval(() => {
      this.timerSeconds++;
      this.updateTimerDisplay();
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.timerSeconds = 0;
    this.updateTimerDisplay();
  }

  updateTimerDisplay() {
    const timer = document.getElementById('sttTimer');
    const minutes = Math.floor(this.timerSeconds / 60);
    const seconds = this.timerSeconds % 60;
    timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

export default STTComponent;

