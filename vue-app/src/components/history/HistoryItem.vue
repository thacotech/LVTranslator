<template>
  <div class="history-item" @click="handleUse">
    <div class="history-item-content">
      <div class="history-item-text">
        <div class="source-text">
          <span class="language-tag">{{ sourceTag }}</span>
          <span class="text-preview" :class="{ 'lao-text': sourceLangCode === 'lo' }">
            {{ item.preview.source }}
          </span>
        </div>
        <div class="arrow">→</div>
        <div class="translated-text">
          <span class="language-tag">{{ targetTag }}</span>
          <span class="text-preview" :class="{ 'lao-text': targetLangCode === 'lo' }">
            {{ item.preview.translated }}
          </span>
        </div>
      </div>
      <div class="history-item-meta">
        <span class="timestamp">{{ formatTimestamp }}</span>
        <div class="metadata-info">
          <span class="character-count">{{ $t('history.characters', { count: item.sourceText.length }) }}</span>
          <span class="direction-info">{{ item.direction.toUpperCase() }}</span>
        </div>
      </div>
    </div>
    <div v-if="showActions" class="history-item-actions" @click.stop>
      <a-button
        type="text"
        size="small"
        @click="handleUse"
        class="use-translation-btn"
        :title="$t('history.useTranslation')"
      >
        <span>↩️</span>
      </a-button>
      <a-button
        type="text"
        size="small"
        @click="handleExport"
        class="export-item-btn"
        :title="$t('history.exportItem')"
      >
        <span>📤</span>
      </a-button>
      <a-button
        type="text"
        size="small"
        danger
        @click="handleDelete"
        class="delete-item-btn"
        :title="$t('history.deleteItem')"
      >
        <span>🗑️</span>
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, withDefaults } from 'vue'
import { Button as AButton } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { useStableCallback, useRenderPerformance } from '@/composables/useComponentMemoization'
import { useCachedComputed } from '@/composables/useOptimizedReactivity'
import type { HistoryItem } from '@/types'

interface Props {
  item: HistoryItem
  showActions?: boolean
  compact?: boolean
}

interface Emits {
  (e: 'use', item: HistoryItem): void
  (e: 'delete', id: number): void
  (e: 'export', item: HistoryItem): void
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true,
  compact: false
})
const emit = defineEmits<Emits>()

const { t } = useI18n()

// Performance monitoring
const { trackRender } = useRenderPerformance('HistoryItem')

// Cached computed properties for better performance
const sourceLangCode = useCachedComputed(() => props.item.direction.split('-')[0], {
  cacheKey: `source-lang-${props.item.id}`,
  ttl: 30000
})

const targetLangCode = useCachedComputed(() => props.item.direction.split('-')[1], {
  cacheKey: `target-lang-${props.item.id}`,
  ttl: 30000
})

const sourceTag = computed(() => sourceLangCode.value.toUpperCase())
const targetTag = computed(() => targetLangCode.value.toUpperCase())

// Memoized timestamp formatting function
const formatTimestamp = useCachedComputed(() => {
  const timestamp = props.item.timestamp
  const now = Date.now()
  const diff = now - timestamp

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) {
    return t('time.justNow')
  } else if (minutes < 60) {
    return `${minutes} ${minutes > 1 ? t('time.minutesAgo') : t('time.minuteAgo')}`
  } else if (hours < 24) {
    return `${hours} ${hours > 1 ? t('time.hoursAgo') : t('time.hourAgo')}`
  } else if (days < 7) {
    return `${days} ${days > 1 ? t('time.daysAgo') : t('time.dayAgo')}`
  } else {
    return new Date(timestamp).toLocaleDateString()
  }
}, {
  cacheKey: `timestamp-${props.item.id}-${Math.floor(Date.now() / 60000)}`, // Update every minute
  ttl: 60000
})

// Stable event handlers to prevent child re-renders
const handleUse = useStableCallback(() => emit('use', props.item), [props.item])
const handleDelete = useStableCallback(() => emit('delete', props.item.id), [props.item.id])
const handleExport = useStableCallback(() => emit('export', props.item), [props.item])
</script>

<style scoped>
.history-item {
  padding: var(--spacing-lg) var(--spacing-xl);
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-in-out);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.history-item:hover {
  background-color: var(--color-surface);
  transform: translateX(5px);
}

.history-item:last-child {
  border-bottom: none;
}

.history-item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.history-item-text {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
}

.source-text,
.translated-text {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex: 1;
  min-width: 200px;
}

.language-tag {
  background: linear-gradient(45deg, var(--color-primary), var(--color-secondary));
  color: white;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  min-width: 30px;
  text-align: center;
}

.text-preview {
  color: var(--color-text);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  flex: 1;
}

.text-preview.lao-text {
  font-family: 'Phetsarath OT', Arial, sans-serif !important;
  font-size: var(--font-size-base) !important;
}

.arrow {
  color: var(--color-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  margin: 0 var(--spacing-sm);
}

.history-item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xs);
}

.timestamp {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-style: italic;
}

.metadata-info {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.character-count {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  background: var(--color-surface);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
}

.direction-info {
  color: var(--color-primary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  background: var(--color-primary-light);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
}

.history-item-actions {
  display: flex;
  gap: var(--spacing-sm);
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-in-out);
}

.history-item:hover .history-item-actions {
  opacity: 1;
}

.use-translation-btn,
.delete-item-btn {
  border-radius: var(--radius-full) !important;
  width: 32px !important;
  height: 32px !important;
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: var(--font-size-sm);
}

.use-translation-btn:hover {
  background: var(--color-success) !important;
  color: white !important;
  transform: scale(1.1);
}

.export-item-btn:hover {
  background: var(--color-info) !important;
  color: white !important;
  transform: scale(1.1);
}

.delete-item-btn:hover {
  background: var(--color-error) !important;
  color: white !important;
  transform: scale(1.1);
}

@media (max-width: 768px) {
  .history-item {
    padding: var(--spacing-md) var(--spacing-lg);
  }

  .history-item-text {
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: flex-start;
  }

  .source-text,
  .translated-text {
    min-width: auto;
    width: 100%;
  }

  .arrow {
    transform: rotate(90deg);
    margin: var(--spacing-xs) 0;
    align-self: center;
  }

  .history-item-actions {
    opacity: 1;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .use-translation-btn,
  .export-item-btn,
  .delete-item-btn {
    width: 28px !important;
    height: 28px !important;
    font-size: var(--font-size-xs);
  }

  .metadata-info {
    flex-direction: column;
    gap: var(--spacing-xs);
    align-items: flex-end;
  }
}
</style>
