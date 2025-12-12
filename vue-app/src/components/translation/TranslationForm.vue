<template>
  <div class="translation-section" role="region" aria-label="Translation interface">
    <!-- Input Panel -->
    <div class="input-panel" role="group" aria-labelledby="input-panel-title">
      <div class="panel-header">
        <h3 id="input-panel-title" class="panel-title">{{ $t('translation.inputText') }}</h3>
        <a-select
          v-model:value="translationStore.sourceLanguage"
          @change="handleSourceLanguageChange"
          class="language-selector"
          :aria-label="$t('accessibility.selectSourceLanguage')"
        >
          <a-select-option value="vi">{{ $t('languages.vietnamese') }}</a-select-option>
          <a-select-option value="lo">{{ $t('languages.lao') }}</a-select-option>
          <a-select-option value="en">{{ $t('languages.english') }}</a-select-option>
        </a-select>
      </div>

      <TextInput
        v-model="inputText"
        :class="{ 'lao-text': translationStore.sourceLanguage === 'lo' }"
        :placeholder="$t('translation.enterTextPlaceholder')"
        :enable-s-t-t="true"
        @input="updateCharCounter"
        @translate="translateText"
        :aria-describedby="'char-counter-input'"
      />

      <div 
        id="char-counter-input"
        class="char-counter" 
        :class="{ 'limit-exceeded': isLimitExceeded }"
        role="status"
        :aria-live="isLimitExceeded ? 'assertive' : 'polite'"
        :aria-label="$t('accessibility.characterCount', { count: charCount, limit: charLimit })"
      >
        {{ charCount }}/{{ charLimit }}
      </div>
    </div>

    <!-- Switch Languages Button -->
    <div class="switch-languages">
      <a-button
        type="primary"
        shape="circle"
        size="large"
        @click="switchLanguages"
        class="switch-btn"
        :title="$t('translation.switchLanguages')"
        :aria-label="$t('translation.switchLanguages')"
        role="button"
      >
        <span aria-hidden="true">⇄</span>
      </a-button>
    </div>

    <!-- Output Panel -->
    <div class="output-panel" role="group" aria-labelledby="output-panel-title">
      <div class="panel-header">
        <h3 id="output-panel-title" class="panel-title">{{ $t('translation.translation') }}</h3>
        <a-select
          v-model:value="translationStore.targetLanguage"
          @change="handleTargetLanguageChange"
          class="language-selector"
          :aria-label="$t('accessibility.selectTargetLanguage')"
        >
          <a-select-option value="lo">{{ $t('languages.lao') }}</a-select-option>
          <a-select-option value="vi">{{ $t('languages.vietnamese') }}</a-select-option>
          <a-select-option value="en">{{ $t('languages.english') }}</a-select-option>
        </a-select>
      </div>

      <TextOutput
        v-model="outputText"
        :class="{ 'lao-text': translationStore.targetLanguage === 'lo' }"
        :placeholder="$t('translation.translationPlaceholder')"
        :confidence="translationConfidence"
        :enable-t-t-s="true"
        :language="getLanguageCode(translationStore.targetLanguage)"
        readonly
      />
    </div>
  </div>

  <!-- Controls -->
  <div class="controls" role="group" aria-label="Translation actions">
    <a-button
      type="primary"
      size="large"
      :loading="translationStore.isLoading"
      :disabled="!inputText.trim() || isLimitExceeded"
      @click="translateText"
      class="translate-btn"
      :aria-describedby="translationStore.isLoading ? 'translation-status' : undefined"
    >
      <template #icon><span aria-hidden="true">🔄</span></template>
      {{ $t('translation.translate') }}
    </a-button>

    <a-button 
      size="large" 
      @click="clearAll" 
      class="clear-btn"
      :aria-label="$t('accessibility.clearAllText')"
    >
      <template #icon><span aria-hidden="true">🗑️</span></template>
      {{ $t('translation.clear') }}
    </a-button>

    <a-button 
      size="large" 
      :disabled="!outputText" 
      @click="copyTranslation" 
      class="copy-btn"
      :aria-label="$t('accessibility.copyTranslationToClipboard')"
    >
      <template #icon><span aria-hidden="true">📋</span></template>
      {{ $t('translation.copyTranslation') }}
    </a-button>
  </div>

  <!-- Screen reader status announcements -->
  <div 
    v-if="translationStore.isLoading"
    id="translation-status"
    class="sr-only"
    role="status"
    aria-live="polite"
  >
    {{ $t('accessibility.translationInProgress') }}
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, shallowRef, markRaw } from 'vue'
import {
  Button as AButton,
  Select as ASelect,
  SelectOption as ASelectOption,
  message,
} from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { useTranslationStore } from '@/stores/translation'
import { useTranslationService } from '@/services/translationService'
import { useDebouncedRef, useMemoizedFunction, useSelectiveWatch } from '@/composables/useOptimizedReactivity'
import { useScreenReader } from '@/composables/useScreenReader'
import TextInput from '@/components/common/TextInput.vue'
import TextOutput from '@/components/common/TextOutput.vue'
import type { Language } from '@/types'

const { t } = useI18n()
const translationStore = useTranslationStore()
const translationService = useTranslationService()
const { 
  announceTranslationStart, 
  announceTranslationComplete, 
  announceTranslationError,
  announceSettingChange 
} = useScreenReader()

// Optimized reactive state
const [inputTextImmediate, inputText] = useDebouncedRef('', 300)
const outputText = ref('')
const translationConfidence = shallowRef<number | undefined>(undefined)
const charLimit = 5000

// Memoized computed properties for better performance
const charCount = computed(() => inputTextImmediate.value.length)
const isLimitExceeded = computed(() => charCount.value > charLimit)

// Memoized language code function
const getLanguageCode = useMemoizedFunction(
  (language: Language): string => {
    const languageCodes = {
      vi: 'vi-VN',
      lo: 'lo-LA',
      en: 'en-US'
    }
    return languageCodes[language] || 'vi-VN'
  },
  [ref(translationStore.targetLanguage)]
)

function updateCharCounter() {
  // Character counter is automatically updated via computed property
}

function handleSourceLanguageChange(value: Language) {
  if (value === translationStore.targetLanguage) {
    // If source becomes same as target, swap target to old source
    const oldSource = translationStore.sourceLanguage
    translationStore.setSourceLanguage(value)
    translationStore.setTargetLanguage(oldSource)
    announceSettingChange(
      t('accessibility.sourceLanguage'), 
      t(`languages.${value}`)
    )
  } else {
    translationStore.setSourceLanguage(value)
    announceSettingChange(
      t('accessibility.sourceLanguage'), 
      t(`languages.${value}`)
    )
  }
}

function handleTargetLanguageChange(value: Language) {
  if (value === translationStore.sourceLanguage) {
    // If target becomes same as source, swap source to old target
    const oldTarget = translationStore.targetLanguage
    translationStore.setTargetLanguage(value)
    translationStore.setSourceLanguage(oldTarget)
    announceSettingChange(
      t('accessibility.targetLanguage'), 
      t(`languages.${value}`)
    )
  } else {
    translationStore.setTargetLanguage(value)
    announceSettingChange(
      t('accessibility.targetLanguage'), 
      t(`languages.${value}`)
    )
  }
}

function switchLanguages() {
  const oldSource = translationStore.sourceLanguage
  const oldTarget = translationStore.targetLanguage
  
  translationStore.switchLanguages()

  // Swap text content
  const tempInput = inputText.value
  inputText.value = outputText.value
  outputText.value = tempInput
  
  // Announce the language switch
  announceSettingChange(
    t('accessibility.languagesSwapped'),
    `${t(`languages.${oldTarget}`)} → ${t(`languages.${oldSource}`)}`
  )
}

async function translateText() {
  if (!inputText.value.trim()) {
    message.error(t('messages.enterTextToTranslate'))
    return
  }

  if (isLimitExceeded.value) {
    message.error(t('messages.textLimitExceeded'))
    return
  }

  try {
    translationStore.setLoading(true)
    translationStore.setError(null)
    
    // Announce translation start
    announceTranslationStart(
      t(`languages.${translationStore.sourceLanguage}`),
      t(`languages.${translationStore.targetLanguage}`)
    )

    const result = await translationService.translate(
      inputText.value,
      translationStore.sourceLanguage,
      translationStore.targetLanguage
    )

    outputText.value = result.translatedText
    translationConfidence.value = result.confidence

    // Add to history
    translationStore.addToHistory({
      id: Date.now().toString(),
      sourceText: inputText.value,
      translatedText: result.translatedText,
      sourceLanguage: translationStore.sourceLanguage,
      targetLanguage: translationStore.targetLanguage,
      timestamp: new Date(),
      confidence: result.confidence,
    })

    // Announce successful completion
    announceTranslationComplete(result.translatedText, result.confidence)
    message.success(t('messages.translationCompleted'))
  } catch (error) {
    console.error('Translation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Translation failed'
    translationStore.setError(errorMessage)
    
    // Announce error
    announceTranslationError(errorMessage)
    message.error(`${t('messages.translationFailed')} ${errorMessage}`)
  } finally {
    translationStore.setLoading(false)
  }
}

function clearAll() {
  inputText.value = ''
  outputText.value = ''
  translationConfidence.value = undefined
  translationStore.setError(null)
}

// Memoized copy function for better performance
const copyTranslation = useMemoizedFunction(
  async () => {
    if (!outputText.value) {
      message.error(t('messages.noTranslationToCopy'))
      return
    }

    try {
      await navigator.clipboard.writeText(outputText.value)
      message.success(t('messages.translationCopied'))
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = outputText.value
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      message.success(t('messages.translationCopied'))
    }
  },
  [outputText]
)

// Optimized watcher for auto-translate functionality
useSelectiveWatch(
  () => ({ text: inputText.value, source: translationStore.sourceLanguage, target: translationStore.targetLanguage }),
  (state) => state.text,
  () => {
    // Auto-translate could be implemented here if needed
    // Only triggers when text changes, not when languages change
  },
  { debounce: 500 }
)
</script>

<style scoped>
.translation-section {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  grid-template-rows: auto;
  gap: var(--spacing-2xl);
  margin-bottom: var(--spacing-2xl);
  align-items: start;
}

.input-panel,
.output-panel {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  transition: all var(--duration-normal) var(--ease-in-out);
}

.input-panel {
  grid-column: 1;
  grid-row: 1;
}

.output-panel {
  grid-column: 3;
  grid-row: 1;
  border-color: var(--color-success);
}

.input-panel:hover,
.output-panel:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.switch-languages {
  grid-column: 2;
  grid-row: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.panel-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: 0;
}

.language-selector {
  min-width: 120px;
}

.switch-btn {
  width: 60px !important;
  height: 60px !important;
  font-size: var(--font-size-xl);
  transition: all var(--duration-normal) var(--ease-in-out);
}

.switch-btn:hover {
  transform: rotate(180deg) scale(1.05);
}

/* Screen reader only content */
.sr-only {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}

.controls {
  display: flex;
  justify-content: center;
  gap: var(--spacing-lg);
  margin: var(--spacing-2xl) 0;
}

.char-counter {
  text-align: right;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-top: var(--spacing-sm);
  padding-right: var(--spacing-xs);
}

.char-counter.limit-exceeded {
  color: var(--color-error);
  font-weight: var(--font-weight-semibold);
}

@media (max-width: 768px) {
  .translation-section {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    gap: var(--spacing-lg);
  }

  .input-panel {
    grid-column: 1;
    grid-row: 1;
  }

  .switch-languages {
    grid-column: 1;
    grid-row: 2;
  }

  .output-panel {
    grid-column: 1;
    grid-row: 3;
  }

  .controls {
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-md);
  }

  .controls .ant-btn {
    width: 100%;
    max-width: 300px;
  }

  .switch-btn {
    width: 50px !important;
    height: 50px !important;
    font-size: var(--font-size-lg);
  }
}
</style>
