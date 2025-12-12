<template>
  <a-drawer
    v-model:open="visible"
    :title="$t('history.details.title')"
    :width="400"
    placement="right"
    @close="handleClose"
  >
    <div v-if="historyItem" class="history-details">
      <!-- Translation Content -->
      <a-card :title="$t('history.details.content')" class="details-section">
        <div class="translation-pair">
          <div class="source-section">
            <h4>{{ getLanguageName(historyItem.direction.split('-')[0]) }}</h4>
            <div class="text-content">
              {{ historyItem.sourceText }}
            </div>
          </div>
          
          <div class="arrow-section">
            <a-icon type="arrow-down" />
          </div>
          
          <div class="target-section">
            <h4>{{ getLanguageName(historyItem.direction.split('-')[1]) }}</h4>
            <div class="text-content">
              {{ historyItem.translatedText }}
            </div>
          </div>
        </div>
      </a-card>

      <!-- Metadata -->
      <a-card :title="$t('history.details.metadata')" class="details-section">
        <a-descriptions :column="1" size="small">
          <a-descriptions-item :label="$t('history.details.timestamp')">
            {{ formatTimestamp(historyItem.timestamp) }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('history.details.direction')">
            {{ formatDirection(historyItem.direction) }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('history.details.sourceLength')">
            {{ $t('history.characters', { count: historyItem.sourceText.length }) }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('history.details.targetLength')">
            {{ $t('history.characters', { count: historyItem.translatedText.length }) }}
          </a-descriptions-item>
        </a-descriptions>
      </a-card>

      <!-- Actions -->
      <a-card :title="$t('history.details.actions')" class="details-section">
        <a-space direction="vertical" style="width: 100%">
          <a-button 
            type="primary" 
            block 
            @click="handleUseTranslation"
          >
            <template #icon>
              <a-icon type="redo" />
            </template>
            {{ $t('history.useTranslation') }}
          </a-button>
          
          <a-button 
            block 
            @click="handleCopySource"
          >
            <template #icon>
              <a-icon type="copy" />
            </template>
            {{ $t('history.details.copySource') }}
          </a-button>
          
          <a-button 
            block 
            @click="handleCopyTranslation"
          >
            <template #icon>
              <a-icon type="copy" />
            </template>
            {{ $t('history.details.copyTranslation') }}
          </a-button>
          
          <a-button 
            block 
            @click="handleExport"
          >
            <template #icon>
              <a-icon type="download" />
            </template>
            {{ $t('history.exportItem') }}
          </a-button>
          
          <a-button 
            danger 
            block 
            @click="handleDelete"
          >
            <template #icon>
              <a-icon type="delete" />
            </template>
            {{ $t('history.deleteItem') }}
          </a-button>
        </a-space>
      </a-card>
    </div>
    
    <div v-else class="no-item">
      <a-empty :description="$t('history.details.noItemSelected')" />
    </div>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTranslationStore } from '@/stores/translation'
import { useNotification } from '@/services/notificationService'
import type { HistoryItem, Language } from '@/types'

interface Props {
  modelValue: boolean
  historyItem?: HistoryItem | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'use-translation', item: HistoryItem): void
  (e: 'delete-item', item: HistoryItem): void
  (e: 'export-item', item: HistoryItem): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()
const translationStore = useTranslationStore()
const { showSuccess, showError } = useNotification()

// Computed visibility
const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

// Helper functions
function getLanguageName(langCode: string): string {
  switch (langCode) {
    case 'vi':
      return t('languages.vietnamese')
    case 'lo':
      return t('languages.lao')
    case 'en':
      return t('languages.english')
    default:
      return langCode
  }
}

function formatDirection(direction: string): string {
  const [source, target] = direction.split('-')
  return `${getLanguageName(source)} → ${getLanguageName(target)}`
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString()
}

// Action handlers
function handleClose() {
  visible.value = false
}

function handleUseTranslation() {
  if (props.historyItem) {
    emit('use-translation', props.historyItem)
    showSuccess('notifications.success.title', 'Translation loaded from history')
    visible.value = false
  }
}

async function handleCopySource() {
  if (props.historyItem) {
    try {
      await navigator.clipboard.writeText(props.historyItem.sourceText)
      showSuccess('notifications.success.textCopied')
    } catch (error) {
      showError('notifications.error.title', 'Failed to copy text')
    }
  }
}

async function handleCopyTranslation() {
  if (props.historyItem) {
    try {
      await navigator.clipboard.writeText(props.historyItem.translatedText)
      showSuccess('notifications.success.textCopied')
    } catch (error) {
      showError('notifications.error.title', 'Failed to copy text')
    }
  }
}

function handleExport() {
  if (props.historyItem) {
    emit('export-item', props.historyItem)
  }
}

function handleDelete() {
  if (props.historyItem) {
    emit('delete-item', props.historyItem)
    visible.value = false
  }
}
</script>

<style scoped>
.history-details {
  padding: 0;
}

.details-section {
  margin-bottom: 16px;
}

.details-section:last-child {
  margin-bottom: 0;
}

.translation-pair {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.source-section,
.target-section {
  flex: 1;
}

.source-section h4,
.target-section h4 {
  margin: 0 0 8px 0;
  color: var(--text-color-secondary);
  font-size: 12px;
  text-transform: uppercase;
  font-weight: 600;
}

.text-content {
  padding: 12px;
  background: var(--bg-color-light);
  border-radius: 6px;
  border: 1px solid var(--border-color);
  line-height: 1.5;
  word-wrap: break-word;
}

.arrow-section {
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--text-color-secondary);
}

.no-item {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

/* Dark mode styles */
:global(.dark-mode) .text-content {
  background: var(--bg-color-dark);
  border-color: var(--border-color-dark);
}

:global(.dark-mode) .source-section h4,
:global(.dark-mode) .target-section h4 {
  color: var(--text-color-secondary-dark);
}

:global(.dark-mode) .arrow-section {
  color: var(--text-color-secondary-dark);
}
</style>