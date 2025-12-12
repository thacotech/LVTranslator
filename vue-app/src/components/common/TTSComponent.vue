<template>
  <div class="tts-component">
    <!-- Main TTS Controls -->
    <div class="tts-main-controls">
      <a-button
        type="primary"
        :loading="isPlaying"
        :disabled="!hasText || !isSupported"
        @click="handlePlay"
        class="tts-play-btn"
        :title="$t('tts.play')"
      >
        <template #icon>
          <SoundOutlined />
        </template>
        {{ $t('tts.play') }}
      </a-button>

      <a-button
        :disabled="!isPlaying && !isPaused"
        @click="handlePause"
        class="tts-pause-btn"
        :title="isPaused ? $t('tts.resume') : $t('tts.pause')"
      >
        <template #icon>
          <CaretRightOutlined v-if="isPaused" />
          <PauseOutlined v-else />
        </template>
        {{ isPaused ? $t('tts.resume') : $t('tts.pause') }}
      </a-button>

      <a-button
        :disabled="!isPlaying && !isPaused"
        @click="handleStop"
        class="tts-stop-btn"
        :title="$t('tts.stop')"
      >
        <template #icon>
          <StopOutlined />
        </template>
        {{ $t('tts.stop') }}
      </a-button>

      <a-button
        @click="showSettings = !showSettings"
        class="tts-settings-btn"
        :title="$t('tts.settings')"
      >
        <template #icon>
          <SettingOutlined />
        </template>
      </a-button>
    </div>

    <!-- Playing Indicator -->
    <div v-if="isPlaying" class="tts-playing-indicator">
      <a-spin size="small" />
      <span class="tts-status-text">{{ $t('tts.speaking') }}</span>
    </div>

    <!-- Language Warning Modal -->
    <a-modal
      v-model:open="showLanguageWarning"
      :title="$t('tts.languageWarning')"
      :ok-text="$t('tts.continueWithEnglish')"
      :cancel-text="$t('common.cancel')"
      @ok="handleLanguageWarningOk"
      @cancel="handleLanguageWarningCancel"
    >
      <p>{{ languageWarningMessage }}</p>
    </a-modal>

    <!-- Settings Panel -->
    <a-collapse v-model:activeKey="settingsActiveKey" v-if="showSettings" class="tts-settings-panel">
      <a-collapse-panel key="settings" :header="$t('tts.settings')">
        <div class="tts-settings-content">
          <!-- Speed Control -->
          <div class="tts-setting-item">
            <label class="tts-setting-label">
              {{ $t('tts.speed') }}: {{ settings.rate.toFixed(1) }}x
            </label>
            <a-slider
              v-model:value="settings.rate"
              :min="0.5"
              :max="2.0"
              :step="0.1"
              @change="updateSettings"
              class="tts-slider"
            />
          </div>

          <!-- Pitch Control -->
          <div class="tts-setting-item">
            <label class="tts-setting-label">
              {{ $t('tts.pitch') }}: {{ settings.pitch.toFixed(1) }}
            </label>
            <a-slider
              v-model:value="settings.pitch"
              :min="0.0"
              :max="2.0"
              :step="0.1"
              @change="updateSettings"
              class="tts-slider"
            />
          </div>

          <!-- Volume Control -->
          <div class="tts-setting-item">
            <label class="tts-setting-label">
              {{ $t('tts.volume') }}: {{ Math.round(settings.volume * 100) }}%
            </label>
            <a-slider
              v-model:value="settings.volume"
              :min="0.0"
              :max="1.0"
              :step="0.1"
              @change="updateSettings"
              class="tts-slider"
            />
          </div>

          <!-- Voice Selection -->
          <div class="tts-setting-item">
            <label class="tts-setting-label">{{ $t('tts.voice') }}:</label>
            <a-select
              v-model:value="selectedVoiceIndex"
              :placeholder="$t('tts.defaultVoice')"
              @change="updateVoice"
              class="tts-voice-select"
              :loading="loadingVoices"
            >
              <a-select-option value="">{{ $t('tts.defaultVoice') }}</a-select-option>
              <a-select-option
                v-for="(voice, index) in availableVoices"
                :key="`${voice.name}-${voice.lang}-${index}`"
                :value="index"
              >
                {{ voice.name }} ({{ voice.lang }})
              </a-select-option>
            </a-select>
          </div>

          <!-- Reset Button -->
          <div class="tts-setting-item">
            <a-button
              @click="resetSettings"
              class="tts-reset-btn"
            >
              <template #icon>
                <ReloadOutlined />
              </template>
              {{ $t('tts.reset') }}
            </a-button>
          </div>
        </div>
      </a-collapse-panel>
    </a-collapse>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { 
  SoundOutlined, 
  CaretRightOutlined, 
  PauseOutlined, 
  StopOutlined, 
  SettingOutlined,
  ReloadOutlined
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { ttsService, type TTSSettings } from '../../services/ttsService'
import type { Language } from '../../types/enums'

// Props
interface Props {
  text?: string
  language?: Language
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  text: '',
  language: 'vi',
  disabled: false
})

// Emits
const emit = defineEmits<{
  'tts-start': []
  'tts-stop': []
  'tts-error': [error: string]
}>()

// Composables
const { t } = useI18n()

// Reactive state
const isPlaying = ref(false)
const isPaused = ref(false)
const isSupported = ref(false)
const showSettings = ref(false)
const settingsActiveKey = ref<string[]>([])
const loadingVoices = ref(false)
const availableVoices = ref<SpeechSynthesisVoice[]>([])
const selectedVoiceIndex = ref<string>('')
const showLanguageWarning = ref(false)
const languageWarningMessage = ref('')
const languageWarningResolve = ref<((value: boolean) => void) | null>(null)

// Settings
const settings = ref<TTSSettings>({
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0
})

// Computed
const hasText = computed(() => props.text && props.text.trim().length > 0)

// Methods
const initializeTTS = async () => {
  try {
    isSupported.value = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
    
    if (isSupported.value) {
      loadingVoices.value = true
      await ttsService.init()
      await loadVoices()
      loadSettings()
      loadingVoices.value = false
    }
  } catch (error) {
    console.error('Failed to initialize TTS:', error)
    isSupported.value = false
    loadingVoices.value = false
  }
}

const loadVoices = async () => {
  try {
    availableVoices.value = ttsService.getVoices()
    console.log(`Loaded ${availableVoices.value.length} voices`)
  } catch (error) {
    console.error('Failed to load voices:', error)
  }
}

const handlePlay = async () => {
  if (!hasText.value) {
    message.error(t('tts.noTextError'))
    return
  }

  if (!isSupported.value) {
    message.error(t('tts.notSupportedError'))
    return
  }

  try {
    const langCode = ttsService.getLangCode(props.language)
    
    // Check if native voice is available for this language
    if (!ttsService.hasNativeVoiceForLanguage(langCode)) {
      const langName = ttsService.getLanguageName(langCode)
      const shouldContinue = await showLanguageWarningDialog(langName)
      
      if (!shouldContinue) {
        console.log('[TTS] User cancelled playback due to missing voice')
        return
      }
    }

    isPlaying.value = true
    emit('tts-start')

    await ttsService.speak(props.text, langCode, (charIndex, charLength) => {
      // Text highlighting callback - could emit event for parent to handle
      console.log(`Highlighting: ${charIndex}-${charIndex + charLength}`)
    })

    isPlaying.value = false
    isPaused.value = false
    emit('tts-stop')

  } catch (error) {
    isPlaying.value = false
    isPaused.value = false
    const errorMessage = error instanceof Error ? error.message : 'Unknown TTS error'
    message.error(errorMessage)
    emit('tts-error', errorMessage)
  }
}

const handlePause = () => {
  const state = ttsService.getState()
  
  if (state.isPlaying) {
    ttsService.pause()
    isPaused.value = true
    isPlaying.value = false
  } else if (state.isPaused) {
    ttsService.resume()
    isPaused.value = false
    isPlaying.value = true
  }
}

const handleStop = () => {
  ttsService.stop()
  isPlaying.value = false
  isPaused.value = false
  emit('tts-stop')
}

const updateSettings = () => {
  ttsService.updateSettings(settings.value)
}

const updateVoice = (voiceIndex: string) => {
  if (voiceIndex === '') {
    // Use default voice
    const newSettings = { ...settings.value }
    delete newSettings.voice
    settings.value = newSettings
  } else {
    const voice = availableVoices.value[parseInt(voiceIndex)]
    if (voice) {
      settings.value = { ...settings.value, voice }
    }
  }
  updateSettings()
}

const resetSettings = () => {
  settings.value = {
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0
  }
  selectedVoiceIndex.value = ''
  updateSettings()
  message.success(t('tts.settingsReset'))
}

const loadSettings = () => {
  ttsService.loadSettings()
  const currentSettings = ttsService.getSettings()
  settings.value = currentSettings
  
  // Find the selected voice index
  if (currentSettings.voice) {
    const voiceIndex = availableVoices.value.findIndex(v => 
      v.name === currentSettings.voice?.name && v.lang === currentSettings.voice?.lang
    )
    selectedVoiceIndex.value = voiceIndex >= 0 ? voiceIndex.toString() : ''
  }
}

const showLanguageWarningDialog = (langName: string): Promise<boolean> => {
  return new Promise((resolve) => {
    languageWarningMessage.value = t('tts.languageNotSupported', { language: langName })
    languageWarningResolve.value = resolve
    showLanguageWarning.value = true
  })
}

const handleLanguageWarningOk = () => {
  showLanguageWarning.value = false
  if (languageWarningResolve.value) {
    languageWarningResolve.value(true)
    languageWarningResolve.value = null
  }
}

const handleLanguageWarningCancel = () => {
  showLanguageWarning.value = false
  if (languageWarningResolve.value) {
    languageWarningResolve.value(false)
    languageWarningResolve.value = null
  }
}

// Watchers
watch(() => settings.value, updateSettings, { deep: true })

// Lifecycle
onMounted(() => {
  initializeTTS()
})

// Keyboard shortcut (Alt+P)
onMounted(() => {
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.altKey && e.key === 'p') {
      e.preventDefault()
      handlePlay()
    }
  }
  
  document.addEventListener('keydown', handleKeydown)
  
  // Cleanup
  return () => {
    document.removeEventListener('keydown', handleKeydown)
  }
})
</script>

<style scoped>
.tts-component {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tts-main-controls {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.tts-play-btn {
  min-width: 80px;
}

.tts-playing-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--ant-color-primary-bg);
  border: 1px solid var(--ant-color-primary-border);
  border-radius: 6px;
  font-size: 14px;
  color: var(--ant-color-primary);
}

.tts-status-text {
  font-weight: 500;
}

.tts-settings-panel {
  margin-top: 8px;
}

.tts-settings-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tts-setting-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tts-setting-label {
  font-weight: 500;
  font-size: 14px;
  color: var(--ant-color-text);
}

.tts-slider {
  width: 100%;
}

.tts-voice-select {
  width: 100%;
}

.tts-reset-btn {
  align-self: flex-start;
}

/* Responsive design */
@media (max-width: 768px) {
  .tts-main-controls {
    justify-content: center;
  }
  
  .tts-play-btn {
    min-width: 70px;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .tts-playing-indicator {
    background: rgba(24, 144, 255, 0.1);
    border-color: rgba(24, 144, 255, 0.3);
  }
}
</style>