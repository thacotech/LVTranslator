<template>
  <div class="history-section">
    <div class="history-header">
      <a-button type="primary" size="large" @click="toggleHistoryPanel" class="history-toggle-btn">
        <template #icon><span>📚</span></template>
        {{ $t('history.translationHistory') }}
      </a-button>
    </div>

    <div v-if="showHistoryPanel" class="history-panel">
      <div class="history-panel-header">
        <h3>{{ $t('history.recentTranslations') }}</h3>
        <div class="history-actions">
          <a-button danger size="small" @click="clearAllHistory" class="clear-history-btn">
            <template #icon><span>🗑️</span></template>
            {{ $t('history.clearAllHistory').replace('🗑️ ', '') }}
          </a-button>
          <a-button type="text" size="small" @click="closeHistoryPanel" class="close-history-btn">
            <span>✕</span>
          </a-button>
        </div>
      </div>

      <!-- Search and Filter Section -->
      <div class="history-search-section">
        <a-input-search
          v-model:value="searchQuery"
          :placeholder="$t('history.searchPlaceholder')"
          allow-clear
          @search="handleSearch"
          class="history-search"
        />
        <div class="history-filters">
          <a-select
            v-model:value="selectedDirection"
            :placeholder="$t('history.filterByDirection')"
            allow-clear
            style="width: 150px"
            size="small"
          >
            <a-select-option value="vi-lo">VI → LO</a-select-option>
            <a-select-option value="lo-vi">LO → VI</a-select-option>
            <a-select-option value="vi-en">VI → EN</a-select-option>
            <a-select-option value="en-vi">EN → VI</a-select-option>
            <a-select-option value="lo-en">LO → EN</a-select-option>
            <a-select-option value="en-lo">EN → LO</a-select-option>
          </a-select>
          <a-select
            v-model:value="sortBy"
            :placeholder="$t('history.sortBy')"
            style="width: 120px"
            size="small"
          >
            <a-select-option value="newest">{{ $t('history.newest') }}</a-select-option>
            <a-select-option value="oldest">{{ $t('history.oldest') }}</a-select-option>
          </a-select>
        </div>
      </div>

      <div class="history-content">
        <div v-if="translationStore.historyCount === 0" class="history-empty">
          <div class="history-empty-icon">📚</div>
          <p>{{ $t('history.noHistoryYet') }}</p>
          <small>{{ $t('history.historySubtext') }}</small>
        </div>

        <div v-else-if="filteredHistory.length === 0" class="history-empty">
          <div class="history-empty-icon">🔍</div>
          <p>{{ $t('history.noResultsFound') }}</p>
          <small>{{ $t('history.tryDifferentSearch') }}</small>
        </div>

        <div v-else class="history-list">
          <a-list
            :data-source="paginatedHistory"
            :loading="isLoading"
            item-layout="vertical"
            size="small"
          >
            <template #renderItem="{ item }">
              <a-list-item class="history-list-item">
                <HistoryItem
                  :item="item"
                  :show-actions="true"
                  @use="useTranslation"
                  @delete="deleteHistoryItem"
                  @export="exportHistoryItem"
                />
              </a-list-item>
            </template>
          </a-list>

          <!-- Pagination -->
          <div v-if="filteredHistory.length > pageSize" class="history-pagination">
            <a-pagination
              v-model:current="currentPage"
              v-model:page-size="pageSize"
              :total="filteredHistory.length"
              :show-size-changer="true"
              :show-quick-jumper="true"
              :show-total="(total, range) => $t('history.paginationInfo', { start: range[0], end: range[1], total })"
              :page-size-options="['10', '20', '50', '100']"
              size="small"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, shallowRef } from 'vue'
import { 
  Button as AButton, 
  Modal, 
  message, 
  Input as AInput,
  Select as ASelect,
  SelectOption as ASelectOption,
  List as AList,
  ListItem as AListItem,
  Pagination as APagination
} from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { useTranslationStore } from '@/stores/translation'
import { useDebouncedRef, useCachedComputed, useMemoizedFunction } from '@/composables/useOptimizedReactivity'
import HistoryItem from './HistoryItem.vue'
import type { HistoryItem as HistoryItemType } from '@/types'

const { t } = useI18n()
const translationStore = useTranslationStore()

// Panel state
const showHistoryPanel = ref(false)
const isLoading = ref(false)

// Search and filter state - optimized with debouncing
const [searchQueryImmediate, searchQuery] = useDebouncedRef('', 300)
const selectedDirection = shallowRef<string | undefined>(undefined)
const sortBy = ref('newest')

// Pagination state
const currentPage = ref(1)
const pageSize = ref(20)

// Memoized filter function for better performance
const filterHistory = useMemoizedFunction(
  (history: HistoryItemType[], query: string, direction?: string, sort: string = 'newest') => {
    let filtered = [...history]

    // Apply search filter
    if (query.trim()) {
      const lowerQuery = query.toLowerCase().trim()
      filtered = filtered.filter(item => 
        item.sourceText.toLowerCase().includes(lowerQuery) ||
        item.translatedText.toLowerCase().includes(lowerQuery)
      )
    }

    // Apply direction filter
    if (direction) {
      filtered = filtered.filter(item => item.direction === direction)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      return sort === 'newest' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp
    })

    return filtered
  },
  [ref(translationStore.history), searchQuery, selectedDirection, sortBy]
)

// Cached computed properties for better performance
const filteredHistory = useCachedComputed(() => {
  return filterHistory(
    translationStore.history,
    searchQuery.value,
    selectedDirection.value,
    sortBy.value
  )
}, { cacheKey: 'filtered-history', ttl: 1000 })

const paginatedHistory = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredHistory.value.slice(start, end)
})

// Watch for filter changes to reset pagination - optimized
watch([searchQuery, selectedDirection, sortBy], () => {
  currentPage.value = 1
}, { flush: 'post' }) // Defer execution until after DOM updates

// Methods
function toggleHistoryPanel() {
  showHistoryPanel.value = !showHistoryPanel.value
  if (showHistoryPanel.value) {
    // Reset filters when opening
    searchQuery.value = ''
    selectedDirection.value = undefined
    sortBy.value = 'newest'
    currentPage.value = 1
  }
}

function closeHistoryPanel() {
  showHistoryPanel.value = false
}

function handleSearch(value: string) {
  searchQuery.value = value
}

function useTranslation(item: HistoryItemType) {
  const [sourceLang, targetLang] = item.direction.split('-')

  // Set the correct direction
  translationStore.setSourceLanguage(sourceLang as any)
  translationStore.setTargetLanguage(targetLang as any)

  // Emit event to parent to fill the input and output fields
  // This would be handled by the parent component (TranslationForm)
  // For now, we'll just show a success message
  message.success(t('history.historyLoadedFromHistory'))
  closeHistoryPanel()
}

function deleteHistoryItem(id: number) {
  Modal.confirm({
    title: t('history.confirmDeleteItem'),
    content: t('history.confirmDeleteItemContent'),
    onOk() {
      translationStore.removeFromHistory(id)
      message.success(t('history.historyItemDeleted'))
    },
  })
}

function exportHistoryItem(item: HistoryItemType) {
  try {
    const exportData = {
      sourceText: item.sourceText,
      translatedText: item.translatedText,
      direction: item.direction,
      timestamp: new Date(item.timestamp).toISOString(),
      date: new Date(item.timestamp).toLocaleDateString()
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `translation-${item.id}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    message.success(t('history.exportSuccess'))
  } catch (error) {
    console.error('Export failed:', error)
    message.error(t('history.exportFailed'))
  }
}

function clearAllHistory() {
  Modal.confirm({
    title: t('history.confirmClearHistory'),
    content: t('history.confirmClearHistoryContent'),
    onOk() {
      translationStore.clearHistory()
      message.success(t('history.historyCleared'))
    },
  })
}
</script>

<style scoped>
.history-section {
  margin: var(--spacing-2xl) 0;
}

.history-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.history-toggle-btn {
  border-radius: var(--radius-full) !important;
  font-weight: var(--font-weight-semibold);
  padding: var(--spacing-lg) var(--spacing-2xl) !important;
  height: auto !important;
}

.history-panel {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-xl);
  margin-top: var(--spacing-xl);
  border: 1px solid var(--color-border);
  max-height: 400px;
  overflow: hidden;
  animation: slideDown 0.3s ease;
  box-shadow: var(--shadow-lg);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.history-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xl) var(--spacing-xl) var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
  background: linear-gradient(45deg, var(--color-surface-elevated), var(--color-surface));
}

.history-panel-header h3 {
  margin: 0;
  color: var(--color-text);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.history-actions {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.clear-history-btn {
  border-radius: var(--radius-md) !important;
  font-weight: var(--font-weight-medium);
}

.close-history-btn {
  border-radius: 50% !important;
  width: 32px !important;
  height: 32px !important;
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.close-history-btn:hover {
  transform: rotate(90deg);
  transition: transform var(--duration-normal) var(--ease-in-out);
}

.history-content {
  max-height: 300px;
  overflow-y: auto;
  padding: 0;
}

.history-empty {
  text-align: center;
  padding: var(--spacing-4xl) var(--spacing-xl);
  color: var(--color-text-muted);
}

.history-empty-icon {
  font-size: 48px;
  margin-bottom: var(--spacing-lg);
  opacity: 0.5;
}

.history-empty p {
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-xs);
  color: var(--color-text-secondary);
}

.history-empty small {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.history-search-section {
  padding: var(--spacing-lg) var(--spacing-xl);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}

.history-search {
  margin-bottom: var(--spacing-md);
}

.history-filters {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
  flex-wrap: wrap;
}

.history-list {
  padding: 0;
}

.history-list-item {
  padding: 0 !important;
  border-bottom: none !important;
}

.history-pagination {
  padding: var(--spacing-lg) var(--spacing-xl);
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .history-panel {
    max-height: 80vh;
  }

  .history-toggle-btn {
    padding: var(--spacing-md) var(--spacing-xl) !important;
    font-size: var(--font-size-sm);
  }

  .history-panel-header {
    padding: var(--spacing-lg);
  }

  .history-search-section {
    padding: var(--spacing-md) var(--spacing-lg);
  }

  .history-filters {
    flex-direction: column;
    align-items: stretch;
  }

  .history-filters .ant-select {
    width: 100% !important;
  }

  .history-pagination {
    padding: var(--spacing-md) var(--spacing-lg);
  }
}
</style>
