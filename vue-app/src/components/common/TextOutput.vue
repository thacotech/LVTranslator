<template>
  <div class="text-output-container">
    <a-textarea
      :value="modelValue"
      :placeholder="placeholder"
      :rows="6"
      readonly
      class="text-output"
      :aria-label="$t('translation.outputText')"
      :aria-describedby="confidence !== undefined ? 'translation-confidence' : undefined"
    />
    
    <!-- Output Controls -->
    <div v-if="modelValue" class="output-controls">
      <!-- Copy Button -->
      <a-button
        type="text"
        size="small"
        @click="copyToClipboard"
        class="control-button"
        :title="$t('translation.copyTranslation')"
        :aria-label="$t('translation.copyTranslation')"
      >
        <template #icon>
          <span>📋</span>
        </template>
      </a-button>

      <!-- TTS Button (if TTS is available) -->
      <a-button
        v-if="enableTTS"
        type="text"
        size="small"
        :loading="isSpeaking"
        @click="toggleTTS"
        class="control-button"
        :title="isSpeaking ? $t('tts.stopSpeaking') : $t('tts.startSpeaking')"
        :aria-label="isSpeaking ? $t('tts.stopSpeaking') : $t('tts.startSpeaking')"
        :aria-pressed="isSpeaking"
      >
        <template #icon>
          <span v-if="isSpeaking">🔇</span>
          <span v-else>🔊</span>
        </template>
      </a-button>
    </div>

    <!-- Translation Confidence -->
    <div 
      v-if="confidence !== undefined && showConfidence" 
      id="translation-confidence"
      class="confidence-display"
      role="status"
      :aria-label="$t('translation.confidenceLevel', { level: Math.round(confidence * 100) })"
    >
      <span class="confidence-label">{{ $t('translation.confidence') }}:</span>
      <div class="confidence-bar">
        <div 
          class="confidence-fill" 
          :style="{ width: `${confidence * 100}%` }"
          :class="confidenceClass"
        ></div>
      </div>
      <span class="confidence-value">{{ Math.round(confidence * 100) }}%</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, readonly } from 'vue'
import { Textarea as ATextarea, Button as AButton, message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'

interface Props {
  modelValue?: string
  placeholder?: string
  readonly?: boolean
  enableTTS?: boolean
  confidence?: number
  showConfidence?: boolean
  language?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'copy'): void
  (e: 'tts-start'): void
  (e: 'tts-stop'): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '',
  readonly: true,
  enableTTS: false,
  confidence: undefined,
  showConfidence: true,
  language: 'vi-VN',
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

// TTS state
const isSpeaking = ref(false)
const speechSynthesis = ref<SpeechSynthesis | null>(null)
const currentUtterance = ref<SpeechSynthesisUtterance | null>(null)

// Computed properties
const confidenceClass = computed(() => {
  if (props.confidence === undefined) return ''
  
  if (props.confidence >= 0.8) return 'confidence-high'
  if (props.confidence >= 0.6) return 'confidence-medium'
  return 'confidence-low'
})

// Copy functionality
async function copyToClipboard() {
  if (!props.modelValue) {
    message.error(t('messages.noTranslationToCopy'))
    return
  }

  try {
    await navigator.clipboard.writeText(props.modelValue)
    message.success(t('messages.translationCopied'))
    emit('copy')
  } catch (error) {
    // Fallback for browsers that don't support clipboard API
    try {
      const textArea = document.createElement('textarea')
      textArea.value = props.modelValue
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      message.success(t('messages.translationCopied'))
      emit('copy')
    } catch (fallbackError) {
      console.error('Copy failed:', fallbackError)
      message.error(t('messages.copyFailed'))
    }
  }
}

// TTS functionality
function initializeTTS() {
  if (!props.enableTTS) return

  if ('speechSynthesis' in window) {
    speechSynthesis.value = window.speechSynthesis
  } else {
    console.warn('Speech Synthesis not supported in this browser')
  }
}

function toggleTTS() {
  if (!speechSynthesis.value) {
    message.error(t('tts.notSupported'))
    return
  }

  if (isSpeaking.value) {
    stopTTS()
  } else {
    startTTS()
  }
}

function startTTS() {
  if (!speechSynthesis.value || !props.modelValue) return

  try {
    // Stop any current speech
    speechSynthesis.value.cancel()

    const utterance = new SpeechSynthesisUtterance(props.modelValue)
    
    // Set language based on prop
    utterance.lang = props.language || 'vi-VN'
    utterance.rate = 0.8
    utterance.pitch = 1
    utterance.volume = 1

    utterance.onstart = () => {
      isSpeaking.value = true
      emit('tts-start')
    }

    utterance.onend = () => {
      isSpeaking.value = false
      currentUtterance.value = null
      emit('tts-stop')
    }

    utterance.onerror = (event) => {
      console.error('TTS error:', event.error)
      isSpeaking.value = false
      currentUtterance.value = null
      message.error(t('tts.error', { error: event.error }))
    }

    currentUtterance.value = utterance
    speechSynthesis.value.speak(utterance)
  } catch (error) {
    console.error('Error starting TTS:', error)
    message.error(t('tts.startError'))
  }
}

function stopTTS() {
  if (!speechSynthesis.value) return

  try {
    speechSynthesis.value.cancel()
    isSpeaking.value = false
    currentUtterance.value = null
  } catch (error) {
    console.error('Error stopping TTS:', error)
  }
}

onMounted(() => {
  initializeTTS()
})

onUnmounted(() => {
  if (isSpeaking.value) {
    stopTTS()
  }
})

// Expose methods for parent component
defineExpose({
  copyToClipboard,
  startTTS,
  stopTTS,
  isSpeaking: readonly(isSpeaking)
})
</script>

<style scoped>
.text-output-container {
  position: relative;
  width: 100%;
}

.text-output {
  width: 100%;
  min-height: 200px;
  font-size: var(--font-size-base);
  font-family: inherit;
  line-height: var(--line-height-normal);
  background: var(--color-surface-elevated);
  transition: all var(--duration-normal) var(--ease-in-out);
}

.text-output:focus {
  border-color: var(--color-success);
  box-shadow: 0 0 0 3px hsla(142, 71%, 45%, 0.1);
}

.output-controls {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
}

.control-button {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 4px 8px;
  transition: all var(--duration-normal) var(--ease-in-out);
}

.control-button:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-success);
}

.control-button.ant-btn-loading {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
}

.confidence-display {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.confidence-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
}

.confidence-bar {
  flex: 1;
  height: 6px;
  background: var(--color-surface-elevated);
  border-radius: 3px;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.confidence-fill {
  height: 100%;
  transition: width var(--duration-normal) var(--ease-in-out);
  border-radius: 2px;
}

.confidence-fill.confidence-high {
  background: var(--color-success);
}

.confidence-fill.confidence-medium {
  background: var(--color-warning);
}

.confidence-fill.confidence-low {
  background: var(--color-error);
}

.confidence-value {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  white-space: nowrap;
  min-width: 35px;
  text-align: right;
}

/* Lao text styling */
.lao-text .text-output {
  font-family: 'Phetsarath OT', Arial, sans-serif !important;
  font-size: 18px !important;
  line-height: 1.8 !important;
}

/* Responsive design */
@media (max-width: 768px) {
  .output-controls {
    position: static;
    margin-top: 8px;
    justify-content: flex-end;
  }
  
  .confidence-display {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }
  
  .confidence-label,
  .confidence-value {
    text-align: center;
  }
}
</style>
