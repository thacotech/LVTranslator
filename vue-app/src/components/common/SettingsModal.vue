<template>
  <a-modal
    v-model:open="visible"
    :title="$t('settings.title')"
    :width="600"
    :footer="null"
    @cancel="handleCancel"
  >
    <div class="settings-content">
      <!-- Language Settings -->
      <a-card :title="$t('settings.language.title')" class="settings-section">
        <a-form layout="vertical">
          <a-form-item :label="$t('settings.language.interface')">
            <a-select
              v-model:value="localSettings.language"
              :placeholder="$t('settings.language.selectInterface')"
              @change="handleLanguageChange"
            >
              <a-select-option value="en">{{ $t('languages.english') }}</a-select-option>
              <a-select-option value="vi">{{ $t('languages.vietnamese') }}</a-select-option>
              <a-select-option value="lo">{{ $t('languages.lao') }}</a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item :label="$t('settings.language.defaultSource')">
            <a-select
              v-model:value="localSettings.preferences.defaultSourceLanguage"
              :placeholder="$t('settings.language.selectDefault')"
            >
              <a-select-option value="vi">{{ $t('languages.vietnamese') }}</a-select-option>
              <a-select-option value="lo">{{ $t('languages.lao') }}</a-select-option>
              <a-select-option value="en">{{ $t('languages.english') }}</a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item :label="$t('settings.language.defaultTarget')">
            <a-select
              v-model:value="localSettings.preferences.defaultTargetLanguage"
              :placeholder="$t('settings.language.selectDefault')"
            >
              <a-select-option value="vi">{{ $t('languages.vietnamese') }}</a-select-option>
              <a-select-option value="lo">{{ $t('languages.lao') }}</a-select-option>
              <a-select-option value="en">{{ $t('languages.english') }}</a-select-option>
            </a-select>
          </a-form-item>
        </a-form>
      </a-card>

      <!-- Appearance Settings -->
      <a-card :title="$t('settings.appearance.title')" class="settings-section">
        <a-form layout="vertical">
          <a-form-item :label="$t('settings.appearance.theme')">
            <a-radio-group v-model:value="localSettings.theme">
              <a-radio value="light">{{ $t('theme.lightMode') }}</a-radio>
              <a-radio value="dark">{{ $t('theme.darkMode') }}</a-radio>
            </a-radio-group>
          </a-form-item>

          <a-form-item :label="$t('settings.appearance.fontSize')">
            <a-radio-group v-model:value="localSettings.preferences.fontSize">
              <a-radio value="small">{{ $t('settings.appearance.small') }}</a-radio>
              <a-radio value="medium">{{ $t('settings.appearance.medium') }}</a-radio>
              <a-radio value="large">{{ $t('settings.appearance.large') }}</a-radio>
            </a-radio-group>
          </a-form-item>

          <a-form-item>
            <a-checkbox v-model:checked="localSettings.preferences.compactMode">
              {{ $t('settings.appearance.compactMode') }}
            </a-checkbox>
          </a-form-item>
        </a-form>
      </a-card>

      <!-- API Configuration -->
      <a-card title="API Configuration" class="settings-section">
        <a-form layout="vertical">
          <a-form-item label="Google Gemini API Key">
            <a-input-password
              v-model:value="apiKey"
              placeholder="Enter your Google Gemini API key"
              @change="handleApiKeyChange"
            />
            <div class="api-key-help">
              <a-typography-text type="secondary">
                Get your free API key from 
                <a href="https://aistudio.google.com/" target="_blank">Google AI Studio</a>
              </a-typography-text>
            </div>
          </a-form-item>
          
          <a-form-item>
            <a-button type="primary" @click="testApiKey" :loading="testingApiKey">
              Test API Key
            </a-button>
            <a-button @click="clearApiKey" style="margin-left: 8px;">
              Clear
            </a-button>
          </a-form-item>
        </a-form>
      </a-card>

      <!-- Translation Settings -->
      <a-card :title="$t('settings.translation.title')" class="settings-section">
        <a-form layout="vertical">
          <a-form-item>
            <a-checkbox v-model:checked="localSettings.preferences.autoDetectLanguage">
              {{ $t('settings.translation.autoDetect') }}
            </a-checkbox>
          </a-form-item>

          <a-form-item>
            <a-checkbox v-model:checked="localSettings.preferences.showConfidenceScore">
              {{ $t('settings.translation.showConfidence') }}
            </a-checkbox>
          </a-form-item>

          <a-form-item>
            <a-checkbox v-model:checked="localSettings.preferences.autoSave">
              {{ $t('settings.translation.autoSave') }}
            </a-checkbox>
          </a-form-item>
        </a-form>
      </a-card>

      <!-- History Settings -->
      <a-card :title="$t('settings.history.title')" class="settings-section">
        <a-form layout="vertical">
          <a-form-item>
            <a-checkbox v-model:checked="localSettings.preferences.saveHistory">
              {{ $t('settings.history.saveHistory') }}
            </a-checkbox>
          </a-form-item>

          <a-form-item :label="$t('settings.history.maxItems')">
            <a-input-number
              v-model:value="localSettings.preferences.maxHistoryItems"
              :min="10"
              :max="1000"
              :step="10"
              style="width: 100%"
            />
          </a-form-item>
        </a-form>
      </a-card>

      <!-- Audio Settings -->
      <a-card :title="$t('settings.audio.title')" class="settings-section">
        <a-form layout="vertical">
          <a-form-item>
            <a-checkbox v-model:checked="localSettings.preferences.enableTTS">
              {{ $t('settings.audio.enableTTS') }}
            </a-checkbox>
          </a-form-item>

          <a-form-item>
            <a-checkbox v-model:checked="localSettings.preferences.enableSTT">
              {{ $t('settings.audio.enableSTT') }}
            </a-checkbox>
          </a-form-item>
        </a-form>
      </a-card>

      <!-- Accessibility Settings -->
      <a-card :title="$t('settings.accessibility.title')" class="settings-section">
        <a-form layout="vertical">
          <a-form-item>
            <a-checkbox v-model:checked="localSettings.preferences.enableKeyboardShortcuts">
              {{ $t('settings.accessibility.keyboardShortcuts') }}
            </a-checkbox>
          </a-form-item>
        </a-form>
      </a-card>

      <!-- Action Buttons -->
      <div class="settings-actions">
        <a-space>
          <a-button @click="handleReset">
            {{ $t('settings.actions.reset') }}
          </a-button>
          <a-button @click="handleCancel">
            {{ $t('common.cancel') }}
          </a-button>
          <a-button type="primary" @click="handleSave">
            {{ $t('settings.actions.save') }}
          </a-button>
        </a-space>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Typography } from 'ant-design-vue'
import { useSettingsStore } from '@/stores/settings'
import { useNotification } from '@/services/notificationService'
import type { Language, Theme, FontSize } from '@/types/enums'
import type { UserPreferences } from '@/types'

const { Text: ATypographyText } = Typography

interface Props {
  open?: boolean
  isEmbedded?: boolean
}

interface Emits {
  (e: 'update:open', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  isEmbedded: false
})
const emit = defineEmits<Emits>()

const { t, locale } = useI18n()
const settingsStore = useSettingsStore()
const { showSuccess, showError } = useNotification()

// API Key management
const apiKey = ref(localStorage.getItem('gemini_api_key') || '')
const testingApiKey = ref(false)

// Local reactive copy of settings
const localSettings = ref({
  language: settingsStore.language,
  theme: settingsStore.theme,
  preferences: { ...settingsStore.preferences }
})

// Computed visibility
const visible = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value)
})

// Watch for external settings changes
watch(
  () => settingsStore.$state,
  (newState) => {
    localSettings.value = {
      language: newState.language,
      theme: newState.theme,
      preferences: { ...newState.preferences }
    }
  },
  { deep: true }
)

// Handle language change immediately for UI feedback
function handleLanguageChange(newLanguage: Language) {
  locale.value = newLanguage
}

// Handle save
async function handleSave() {
  try {
    // Update store with local settings
    settingsStore.setLanguage(localSettings.value.language)
    settingsStore.setTheme(localSettings.value.theme)
    settingsStore.updatePreferences(localSettings.value.preferences)
    
    // Save to storage
    await settingsStore.saveSettings()
    
    showSuccess('notifications.success.settingsSaved')
    visible.value = false
  } catch (error) {
    console.error('Failed to save settings:', error)
    showError('notifications.error.title', 'Failed to save settings')
  }
}

// Handle cancel
function handleCancel() {
  // Reset local settings to store values
  localSettings.value = {
    language: settingsStore.language,
    theme: settingsStore.theme,
    preferences: { ...settingsStore.preferences }
  }
  
  // Reset locale if it was changed
  locale.value = settingsStore.language
  
  visible.value = false
}

// API Key functions
function handleApiKeyChange() {
  if (apiKey.value) {
    localStorage.setItem('gemini_api_key', apiKey.value)
    showSuccess('API Key Updated', 'Your API key has been saved successfully')
  }
}

async function testApiKey() {
  if (!apiKey.value) {
    showError('API Key Required', 'Please enter an API key first')
    return
  }

  testingApiKey.value = true
  
  try {
    // Test the API key with a simple request
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey.value}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Hello' }] }],
          generationConfig: { maxOutputTokens: 10 }
        })
      }
    )

    if (response.ok) {
      showSuccess('API Key Valid', 'Your API key is working correctly!')
    } else {
      const error = await response.json()
      showError('API Key Invalid', error.error?.message || 'Invalid API key')
    }
  } catch (error) {
    showError('Connection Error', 'Failed to test API key. Please check your internet connection.')
  } finally {
    testingApiKey.value = false
  }
}

function clearApiKey() {
  apiKey.value = ''
  localStorage.removeItem('gemini_api_key')
  showSuccess('API Key Cleared', 'Your API key has been removed')
}

// Handle reset to defaults
function handleReset() {
  settingsStore.resetToDefaults()
  localSettings.value = {
    language: settingsStore.language,
    theme: settingsStore.theme,
    preferences: { ...settingsStore.preferences }
  }
  locale.value = settingsStore.language
  showSuccess('notifications.success.title', 'Settings reset to defaults')
}
</script>

<style scoped>
.settings-content {
  max-height: 70vh;
  overflow-y: auto;
}

.settings-section {
  margin-bottom: 16px;
}

.settings-section:last-of-type {
  margin-bottom: 24px;
}

.api-key-help {
  margin-top: 8px;
}

.settings-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

/* Dark mode styles */
:global(.dark-mode) .settings-actions {
  border-top-color: var(--border-color-dark);
}
</style>