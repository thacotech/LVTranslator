<template>
  <div class="text-input-container">
    <a-textarea
      :value="modelValue"
      :placeholder="placeholder"
      :rows="6"
      :maxlength="maxLength"
      show-count
      class="text-input"
      :class="{ 'error': isOverLimit }"
      @input="handleInput"
      @keydown="handleKeydown"
      @paste="handlePaste"
      :aria-label="$t('translation.inputText')"
      :aria-describedby="showLimitWarning ? 'character-limit-warning' : undefined"
      :aria-invalid="isOverLimit"
    />
    
    <!-- STT Button (if STT is available) -->
    <div v-if="enableSTT" class="input-controls">
      <a-button
        type="text"
        size="small"
        :loading="isListening"
        @click="toggleSTT"
        class="stt-button"
        :title="isListening ? $t('stt.stopListening') : $t('stt.startListening')"
        :aria-label="isListening ? $t('stt.stopListening') : $t('stt.startListening')"
        :aria-pressed="isListening"
      >
        <template #icon>
          <span v-if="isListening">🔴</span>
          <span v-else>🎤</span>
        </template>
      </a-button>
    </div>

    <!-- Character limit warning -->
    <div 
      v-if="showLimitWarning" 
      id="character-limit-warning"
      class="limit-warning"
      role="alert"
      :aria-live="isOverLimit ? 'assertive' : 'polite'"
    >
      {{ $t('validation.characterLimitWarning', { limit: maxLength }) }}
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
  maxLength?: number
  enableSTT?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'input', value: string): void
  (e: 'translate'): void
  (e: 'stt-start'): void
  (e: 'stt-stop'): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '',
  maxLength: 5000,
  enableSTT: false,
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

// STT state
const isListening = ref(false)
const recognition = ref<SpeechRecognition | null>(null)

// Computed properties
const isOverLimit = computed(() => props.modelValue.length > props.maxLength)
const showLimitWarning = computed(() => props.modelValue.length > props.maxLength * 0.9)

function handleInput(e: Event) {
  const target = e.target as HTMLTextAreaElement
  let value = target.value

  // Enforce character limit
  if (value.length > props.maxLength) {
    value = value.substring(0, props.maxLength)
    message.warning(t('validation.characterLimitExceeded', { limit: props.maxLength }))
  }

  emit('update:modelValue', value)
  emit('input', value)
}

function handlePaste(e: ClipboardEvent) {
  const pastedText = e.clipboardData?.getData('text') || ''
  const currentText = props.modelValue
  const newLength = currentText.length + pastedText.length

  if (newLength > props.maxLength) {
    e.preventDefault()
    const availableSpace = props.maxLength - currentText.length
    const truncatedText = pastedText.substring(0, availableSpace)
    
    if (truncatedText.length > 0) {
      emit('update:modelValue', currentText + truncatedText)
      message.warning(t('validation.pastedTextTruncated'))
    } else {
      message.error(t('validation.noSpaceForPaste'))
    }
  }
}

function handleKeydown(e: KeyboardEvent) {
  // Ctrl+Enter to translate
  if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault()
    emit('translate')
  }
  
  // Escape to stop STT
  if (e.key === 'Escape' && isListening.value) {
    stopSTT()
  }
}

// STT functionality
function initializeSTT() {
  if (!props.enableSTT) return

  // Check if browser supports Speech Recognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  
  if (!SpeechRecognition) {
    console.warn('Speech Recognition not supported in this browser')
    return
  }

  recognition.value = new SpeechRecognition()
  recognition.value.continuous = true
  recognition.value.interimResults = true
  recognition.value.lang = 'vi-VN' // Default to Vietnamese, should be dynamic based on source language

  recognition.value.onstart = () => {
    isListening.value = true
    emit('stt-start')
  }

  recognition.value.onresult = (event: SpeechRecognitionEvent) => {
    let finalTranscript = ''
    let interimTranscript = ''

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript
      if (event.results[i].isFinal) {
        finalTranscript += transcript
      } else {
        interimTranscript += transcript
      }
    }

    if (finalTranscript) {
      const newValue = props.modelValue + finalTranscript
      if (newValue.length <= props.maxLength) {
        emit('update:modelValue', newValue)
      } else {
        message.warning(t('validation.sttTextTooLong'))
        stopSTT()
      }
    }
  }

  recognition.value.onerror = (event: SpeechRecognitionErrorEvent) => {
    console.error('Speech recognition error:', event.error)
    isListening.value = false
    message.error(t('stt.error', { error: event.error }))
  }

  recognition.value.onend = () => {
    isListening.value = false
    emit('stt-stop')
  }
}

function toggleSTT() {
  if (!recognition.value) {
    message.error(t('stt.notSupported'))
    return
  }

  if (isListening.value) {
    stopSTT()
  } else {
    startSTT()
  }
}

function startSTT() {
  if (!recognition.value) return

  try {
    recognition.value.start()
  } catch (error) {
    console.error('Error starting speech recognition:', error)
    message.error(t('stt.startError'))
  }
}

function stopSTT() {
  if (!recognition.value) return

  try {
    recognition.value.stop()
  } catch (error) {
    console.error('Error stopping speech recognition:', error)
  }
  isListening.value = false
}

onMounted(() => {
  initializeSTT()
})

onUnmounted(() => {
  if (isListening.value) {
    stopSTT()
  }
})

// Expose methods for parent component
defineExpose({
  startSTT,
  stopSTT,
  isListening: readonly(isListening)
})
</script>

<style scoped>
.text-input-container {
  position: relative;
  width: 100%;
}

.text-input {
  width: 100%;
  min-height: 200px;
  font-size: var(--font-size-base);
  font-family: inherit;
  line-height: var(--line-height-normal);
  transition: all var(--duration-normal) var(--ease-in-out);
}

.text-input:focus {
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px hsla(var(--primary-hue), 70%, 65%, 0.1);
}

.text-input.error {
  border-color: var(--color-error);
}

.text-input.error:focus {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px hsla(0, 70%, 65%, 0.1);
}

.input-controls {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
}

.stt-button {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 4px 8px;
  transition: all var(--duration-normal) var(--ease-in-out);
}

.stt-button:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-primary);
}

.stt-button.ant-btn-loading {
  background: var(--color-error-light);
  border-color: var(--color-error);
}

.limit-warning {
  position: absolute;
  bottom: -24px;
  right: 0;
  font-size: var(--font-size-sm);
  color: var(--color-warning);
  font-weight: var(--font-weight-medium);
}

/* Lao text styling */
.lao-text .text-input {
  font-family: 'Phetsarath OT', Arial, sans-serif !important;
  font-size: 18px !important;
  line-height: 1.8 !important;
}

/* Responsive design */
@media (max-width: 768px) {
  .input-controls {
    position: static;
    margin-top: 8px;
    justify-content: flex-end;
  }
  
  .limit-warning {
    position: static;
    margin-top: 4px;
    text-align: right;
  }
}
</style>
