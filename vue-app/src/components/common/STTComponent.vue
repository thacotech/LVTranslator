<template>
  <div class="stt-component">
    <!-- Main STT Controls -->
    <div class="stt-main-controls">
      <a-button
        type="primary"
        danger
        :loading="isRecording"
        :disabled="!isSupported"
        @click="handleStartRecording"
        class="stt-record-btn"
        :title="$t('stt.startRecording')"
      >
        <template #icon>
          <AudioOutlined />
        </template>
        {{ $t('stt.voiceInput') }}
      </a-button>

      <a-button
        v-if="isRecording"
        :disabled="!isRecording"
        @click="handleStopRecording"
        class="stt-stop-btn"
        :title="$t('stt.stopRecording')"
      >
        <template #icon>
          <StopOutlined />
        </template>
        {{ $t('stt.stop') }}
      </a-button>

      <div class="stt-lang-selector">
        <a-select
          v-model:value="selectedLanguage"
          :disabled="isRecording"
          @change="updateLanguage"
          class="stt-language-select"
          :placeholder="$t('stt.selectLanguage')"
        >
          <a-select-option value="vi-VN">{{ $t('languages.vietnamese') }}</a-select-option>
          <a-select-option value="lo-LA">{{ $t('languages.lao') }}</a-select-option>
          <a-select-option value="en-US">{{ $t('languages.english') }}</a-select-option>
        </a-select>
      </div>
    </div>

    <!-- Recording Indicator -->
    <div v-if="isRecording" class="stt-recording-indicator">
      <a-spin size="small" />
      <span class="stt-status-text">{{ $t('stt.listening') }}</span>
      <span class="stt-timer">{{ formattedTimer }}</span>
    </div>

    <!-- Interim Results Display -->
    <div v-if="showInterimResults && interimText" class="stt-interim-results">
      <div class="stt-interim-label">{{ $t('stt.recognized') }}:</div>
      <div class="stt-interim-text">{{ interimText }}</div>
    </div>

    <!-- Browser Support Warning -->
    <a-alert
      v-if="!isSupported"
      :message="$t('stt.notSupported')"
      :description="$t('stt.browserWarning')"
      type="warning"
      show-icon
      class="stt-browser-warning"
    />

    <!-- Permission Instructions -->
    <a-alert
      v-if="showPermissionInfo"
      :message="$t('stt.permissionRequired')"
      :description="$t('stt.permissionInfo')"
      type="info"
      show-icon
      closable
      @close="showPermissionInfo = false"
      class="stt-permission-info"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { 
  AudioOutlined, 
  StopOutlined
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import type { Language } from '../../types/enums'

// Props
interface Props {
  language?: Language
  disabled?: boolean
  targetInputId?: string
}

const props = withDefaults(defineProps<Props>(), {
  language: 'vi',
  disabled: false,
  targetInputId: ''
})

// Emits
const emit = defineEmits<{
  'stt-start': []
  'stt-stop': []
  'stt-result': [text: string]
  'stt-error': [error: string]
}>()

// Composables
const { t } = useI18n()

// STT Service Implementation
class STTService {
  private recognition: any | null = null
  private isRecording = false
  private transcript = ''
  private interimTranscript = ''
  private finalTranscript = ''
  private silenceTimer: number | null = null
  private silenceTimeout = 30000 // 30 seconds
  
  // Callbacks
  private onStart: (() => void) | null = null
  private onResult: ((transcript: string, isFinal: boolean) => void) | null = null
  private onInterimResult: ((interim: string) => void) | null = null
  private onEnd: ((finalTranscript: string) => void) | null = null
  private onError: ((error: string, message: string) => void) | null = null

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    this.recognition = SpeechRecognition ? new SpeechRecognition() : null
    
    if (this.recognition) {
      this.initRecognition()
    }
  }

  private initRecognition() {
    if (!this.recognition) return

    this.recognition.continuous = true
    this.recognition.interimResults = true
    this.recognition.maxAlternatives = 1

    this.recognition.onstart = () => {
      this.isRecording = true
      console.log('STT started')
      if (this.onStart) {
        this.onStart()
      }
      this.resetSilenceTimer()
    }

    this.recognition.onresult = (event) => {
      let interim = ''
      let final = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        
        if (event.results[i].isFinal) {
          final += transcript + ' '
        } else {
          interim += transcript
        }
      }

      if (final) {
        this.finalTranscript += final
        this.transcript = this.finalTranscript
        
        if (this.onResult) {
          this.onResult(this.finalTranscript, false)
        }
        
        this.resetSilenceTimer()
      }

      if (interim) {
        this.interimTranscript = interim
        
        if (this.onInterimResult) {
          this.onInterimResult(interim)
        }
      }
    }

    this.recognition.onerror = (event) => {
      console.error('STT error:', event.error)
      this.isRecording = false
      this.clearSilenceTimer()
      
      if (this.onError) {
        this.onError(event.error, this.getErrorMessage(event.error))
      }
    }

    this.recognition.onend = () => {
      this.isRecording = false
      console.log('STT ended')
      this.clearSilenceTimer()
      
      if (this.onEnd) {
        this.onEnd(this.finalTranscript)
      }
    }
  }

  async start(lang: string = 'vi-VN'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not supported in this browser'))
        return
      }

      if (this.isRecording) {
        reject(new Error('Already recording'))
        return
      }

      // Reset transcripts
      this.transcript = ''
      this.interimTranscript = ''
      this.finalTranscript = ''

      // Set language
      this.recognition.lang = lang

      try {
        this.recognition.start()
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  stop(): void {
    if (this.recognition && this.isRecording) {
      this.recognition.stop()
      this.clearSilenceTimer()
      console.log('STT stopped manually')
    }
  }

  abort(): void {
    if (this.recognition && this.isRecording) {
      this.recognition.abort()
      this.isRecording = false
      this.clearSilenceTimer()
      console.log('STT aborted')
    }
  }

  getTranscript(): string {
    return this.finalTranscript
  }

  getInterimTranscript(): string {
    return this.interimTranscript
  }

  setOnStart(callback: () => void): void {
    this.onStart = callback
  }

  setOnResult(callback: (transcript: string, isFinal: boolean) => void): void {
    this.onResult = callback
  }

  setOnInterimResult(callback: (interim: string) => void): void {
    this.onInterimResult = callback
  }

  setOnEnd(callback: (finalTranscript: string) => void): void {
    this.onEnd = callback
  }

  setOnError(callback: (error: string, message: string) => void): void {
    this.onError = callback
  }

  getState(): { isRecording: boolean; isSupported: boolean } {
    return {
      isRecording: this.isRecording,
      isSupported: STTService.isSupported()
    }
  }

  private resetSilenceTimer(): void {
    this.clearSilenceTimer()
    
    this.silenceTimer = window.setTimeout(() => {
      console.log('Auto-stopping STT due to silence')
      this.stop()
    }, this.silenceTimeout)
  }

  private clearSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer)
      this.silenceTimer = null
    }
  }

  private getErrorMessage(error: string): string {
    const errorMessages: Record<string, string> = {
      'no-speech': 'No speech detected. Please try again.',
      'audio-capture': 'Microphone not found or not working.',
      'not-allowed': 'Microphone permission denied. Please allow microphone access.',
      'network': 'Network error. Please check your connection.',
      'aborted': 'Recording was aborted.',
      'language-not-supported': 'Selected language is not supported.',
      'service-not-allowed': 'Speech recognition service is not allowed.'
    }

    return errorMessages[error] || `Speech recognition error: ${error}`
  }

  static isSupported(): boolean {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  }

  static async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Stop the stream immediately (we just needed permission)
      stream.getTracks().forEach(track => track.stop())
      
      return true
    } catch (error) {
      console.error('Microphone permission denied:', error)
      return false
    }
  }
}

// Reactive state
const isRecording = ref(false)
const isSupported = ref(false)
const selectedLanguage = ref('vi-VN')
const interimText = ref('')
const showInterimResults = ref(false)
const showPermissionInfo = ref(false)
const timerSeconds = ref(0)
const timerInterval = ref<number | null>(null)

// STT Service instance
let sttService: STTService | null = null

// Computed
const formattedTimer = computed(() => {
  const minutes = Math.floor(timerSeconds.value / 60)
  const seconds = timerSeconds.value % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

// Methods
const initializeSTT = () => {
  sttService = new STTService()
  isSupported.value = STTService.isSupported()
  
  if (sttService && isSupported.value) {
    setupCallbacks()
  }
}

const setupCallbacks = () => {
  if (!sttService) return

  sttService.setOnStart(() => {
    isRecording.value = true
    startTimer()
    emit('stt-start')
  })

  sttService.setOnInterimResult((interim) => {
    interimText.value = interim
    showInterimResults.value = !!interim
  })

  sttService.setOnResult((transcript) => {
    interimText.value = transcript
    showInterimResults.value = !!transcript
  })

  sttService.setOnEnd((finalTranscript) => {
    isRecording.value = false
    stopTimer()
    showInterimResults.value = false
    
    if (finalTranscript) {
      insertTranscriptToInput(finalTranscript)
      emit('stt-result', finalTranscript)
    }
    
    emit('stt-stop')
  })

  sttService.setOnError((error, errorMessage) => {
    isRecording.value = false
    stopTimer()
    showInterimResults.value = false
    
    if (error === 'not-allowed') {
      showPermissionInfo.value = true
    }
    
    message.error(errorMessage)
    emit('stt-error', errorMessage)
  })
}

const handleStartRecording = async () => {
  if (!sttService || !isSupported.value) {
    message.error(t('stt.notSupportedError'))
    return
  }

  // Request microphone permission
  const hasPermission = await STTService.requestMicrophonePermission()
  if (!hasPermission) {
    showPermissionInfo.value = true
    message.error(t('stt.permissionDenied'))
    return
  }

  try {
    await sttService.start(selectedLanguage.value)
    console.log(`Started STT in ${selectedLanguage.value}`)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to start speech recognition'
    message.error(errorMessage)
    emit('stt-error', errorMessage)
  }
}

const handleStopRecording = () => {
  if (sttService) {
    sttService.stop()
  }
}

const updateLanguage = (lang: string) => {
  selectedLanguage.value = lang
  console.log(`STT language set to: ${lang}`)
}

const insertTranscriptToInput = (transcript: string) => {
  if (!transcript) return

  // Find input field
  let inputField: HTMLInputElement | HTMLTextAreaElement | null = null
  
  if (props.targetInputId) {
    inputField = document.getElementById(props.targetInputId) as HTMLInputElement | HTMLTextAreaElement
  }
  
  if (!inputField) {
    // Try common selectors
    inputField = document.querySelector('.ant-input') as HTMLInputElement | HTMLTextAreaElement ||
                 document.querySelector('textarea') as HTMLTextAreaElement ||
                 document.querySelector('input[type="text"]') as HTMLInputElement
  }

  if (!inputField) {
    console.error('Input field not found')
    return
  }

  // Insert transcript
  const currentValue = inputField.value
  const newValue = currentValue ? `${currentValue} ${transcript}` : transcript
  inputField.value = newValue.trim()

  // Trigger input event for any listeners
  inputField.dispatchEvent(new Event('input', { bubbles: true }))
  
  // Focus input field
  inputField.focus()

  console.log('Inserted transcript:', transcript)
}

const setLanguageFromCode = (shortCode: Language) => {
  const langMap: Record<Language, string> = {
    'vi': 'vi-VN',
    'lo': 'lo-LA',
    'en': 'en-US'
  }
  
  const fullLangCode = langMap[shortCode] || 'vi-VN'
  selectedLanguage.value = fullLangCode
}

const startTimer = () => {
  timerSeconds.value = 0
  timerInterval.value = window.setInterval(() => {
    timerSeconds.value++
  }, 1000)
}

const stopTimer = () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
  timerSeconds.value = 0
}

// Watchers
watch(() => props.language, (newLang) => {
  if (newLang) {
    setLanguageFromCode(newLang)
  }
}, { immediate: true })

// Lifecycle
onMounted(() => {
  initializeSTT()
  
  // Keyboard shortcut (Alt+R)
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.altKey && e.key === 'r') {
      e.preventDefault()
      if (!isRecording.value) {
        handleStartRecording()
      } else {
        handleStopRecording()
      }
    }
  }
  
  document.addEventListener('keydown', handleKeydown)
  
  // Cleanup function will be called in onUnmounted
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
    if (sttService) {
      sttService.abort()
    }
    stopTimer()
  })
})

// Expose methods for parent components
defineExpose({
  setLanguageFromCode,
  handleStartRecording,
  handleStopRecording
})
</script>

<style scoped>
.stt-component {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stt-main-controls {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.stt-record-btn {
  min-width: 120px;
}

.stt-stop-btn {
  min-width: 80px;
}

.stt-lang-selector {
  margin-left: auto;
}

.stt-language-select {
  min-width: 140px;
}

.stt-recording-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--ant-color-error-bg);
  border: 1px solid var(--ant-color-error-border);
  border-radius: 6px;
  font-size: 14px;
  color: var(--ant-color-error);
}

.stt-status-text {
  font-weight: 500;
}

.stt-timer {
  margin-left: auto;
  font-family: var(--ant-font-family-code, monospace);
  font-size: 14px;
  font-weight: 500;
}

.stt-interim-results {
  padding: 12px;
  background: var(--ant-color-fill-quaternary);
  border-radius: 6px;
  border: 1px solid var(--ant-color-border);
}

.stt-interim-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--ant-color-text-secondary);
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stt-interim-text {
  font-size: 14px;
  color: var(--ant-color-text);
  line-height: 1.5;
  min-height: 2em;
  font-style: italic;
  opacity: 0.8;
}

.stt-browser-warning,
.stt-permission-info {
  margin-top: 8px;
}

/* Responsive design */
@media (max-width: 768px) {
  .stt-main-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .stt-record-btn,
  .stt-stop-btn {
    width: 100%;
  }
  
  .stt-lang-selector {
    margin-left: 0;
    width: 100%;
  }
  
  .stt-language-select {
    width: 100%;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .stt-recording-indicator {
    background: rgba(255, 77, 79, 0.1);
    border-color: rgba(255, 77, 79, 0.3);
  }
  
  .stt-interim-results {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.12);
  }
}
</style>