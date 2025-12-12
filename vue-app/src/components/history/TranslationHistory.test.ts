import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import { Modal, message } from 'ant-design-vue'
import TranslationHistory from './TranslationHistory.vue'
import { useTranslationStore } from '@/stores/translation'
import type { HistoryItem } from '@/types'

// Mock Ant Design components
vi.mock('ant-design-vue', async () => {
  const actual = await vi.importActual('ant-design-vue')
  return {
    ...actual,
    Modal: {
      confirm: vi.fn()
    },
    message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn()
    }
  }
})

vi.mock('@/composables/useOptimizedReactivity', () => ({
  useDebouncedRef: (initial: any) => [{ value: initial }, { value: initial }],
  useCachedComputed: (fn: () => any) => ({ value: fn() }),
  useMemoizedFunction: (fn: any) => fn
}))

// Mock URL.createObjectURL and related APIs
global.URL.createObjectURL = vi.fn(() => 'mock-url')
global.URL.revokeObjectURL = vi.fn()

// Mock document methods
Object.defineProperty(document, 'createElement', {
  value: vi.fn(() => ({
    href: '',
    download: '',
    click: vi.fn(),
    remove: vi.fn()
  })),
  writable: true
})

Object.defineProperty(document.body, 'appendChild', {
  value: vi.fn(),
  writable: true
})

Object.defineProperty(document.body, 'removeChild', {
  value: vi.fn(),
  writable: true
})

function createTestWrapper(props = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)

  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    messages: {
      en: {
        history: {
          translationHistory: 'Translation History',
          recentTranslations: 'Recent Translations',
          clearAllHistory: 'Clear All History',
          searchPlaceholder: 'Search translations...',
          filterByDirection: 'Filter by direction',
          sortBy: 'Sort by',
          newest: 'Newest',
          oldest: 'Oldest',
          noHistoryYet: 'No translation history yet',
          historySubtext: 'Your translations will appear here',
          noResultsFound: 'No results found',
          tryDifferentSearch: 'Try a different search term',
          paginationInfo: 'Showing {start}-{end} of {total} items',
          historyLoadedFromHistory: 'Translation loaded from history',
          confirmDeleteItem: 'Delete this translation?',
          confirmDeleteItemContent: 'This action cannot be undone',
          historyItemDeleted: 'Translation deleted',
          exportSuccess: 'Translation exported successfully',
          exportFailed: 'Export failed',
          confirmClearHistory: 'Clear all history?',
          confirmClearHistoryContent: 'This will delete all translation history',
          historyCleared: 'History cleared'
        }
      }
    }
  })

  return mount(TranslationHistory, {
    props,
    global: {
      plugins: [pinia, i18n],
      stubs: {
        'a-button': {
          template: '<button @click="$emit(\'click\')" :class="type" :size="size" :danger="danger"><slot /></button>',
          props: ['type', 'size', 'danger']
        },
        'a-input-search': {
          template: '<input @search="$emit(\'search\', $event.target.value)" @input="$emit(\'update:value\', $event.target.value)" :value="value" :placeholder="placeholder" />',
          props: ['value', 'placeholder', 'allowClear'],
          emits: ['search', 'update:value']
        },
        'a-select': {
          template: '<select @change="$emit(\'update:value\', $event.target.value)" :value="value"><slot /></select>',
          props: ['value', 'placeholder', 'allowClear', 'style', 'size'],
          emits: ['update:value']
        },
        'a-select-option': {
          template: '<option :value="value"><slot /></option>',
          props: ['value']
        },
        'a-list': {
          template: '<div class="list" :data-loading="loading"><slot name="renderItem" v-for="item in dataSource" :item="item" :key="item.id" /></div>',
          props: ['dataSource', 'loading', 'itemLayout', 'size']
        },
        'a-list-item': {
          template: '<div class="list-item"><slot /></div>'
        },
        'a-pagination': {
          template: '<div class="pagination" :data-current="current" :data-page-size="pageSize" :data-total="total"></div>',
          props: ['current', 'pageSize', 'total', 'showSizeChanger', 'showQuickJumper', 'showTotal', 'pageSizeOptions', 'size'],
          emits: ['update:current', 'update:pageSize']
        },
        'HistoryItem': {
          template: '<div class="history-item" @use="$emit(\'use\', item)" @delete="$emit(\'delete\', item.id)" @export="$emit(\'export\', item)">{{ item.sourceText }} -> {{ item.translatedText }}</div>',
          props: ['item', 'showActions'],
          emits: ['use', 'delete', 'export']
        }
      }
    }
  })
}

describe('TranslationHistory Component', () => {
  let translationStore: ReturnType<typeof useTranslationStore>

  beforeEach(() => {
    const pinia = createPinia()
    setActivePinia(pinia)
    translationStore = useTranslationStore()
    
    vi.clearAllMocks()
    
    // Reset store
    translationStore.clearHistory()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render correctly with default state', () => {
      const wrapper = createTestWrapper()
      
      expect(wrapper.find('.history-section').exists()).toBe(true)
      expect(wrapper.find('.history-toggle-btn').exists()).toBe(true)
      expect(wrapper.text()).toContain('Translation History')
    })

    it('should show empty state when no history exists', async () => {
      const wrapper = createTestWrapper()
      
      // Open history panel
      await wrapper.vm.toggleHistoryPanel()
      
      expect(wrapper.find('.history-empty').exists()).toBe(true)
      expect(wrapper.text()).toContain('No translation history yet')
    })

    it('should show history panel when toggled', async () => {
      const wrapper = createTestWrapper()
      
      expect(wrapper.vm.showHistoryPanel).toBe(false)
      
      await wrapper.vm.toggleHistoryPanel()
      
      expect(wrapper.vm.showHistoryPanel).toBe(true)
      expect(wrapper.find('.history-panel').exists()).toBe(true)
    })
  })

  describe('History Management', () => {
    beforeEach(() => {
      // Add some test history items
      translationStore.addToHistory({
        id: '1',
        sourceText: 'Hello world',
        translatedText: 'Xin chào thế giới',
        sourceLanguage: 'en',
        targetLanguage: 'vi',
        timestamp: new Date('2023-01-01')
      })
      
      translationStore.addToHistory({
        id: '2',
        sourceText: 'Goodbye',
        translatedText: 'Tạm biệt',
        sourceLanguage: 'en',
        targetLanguage: 'vi',
        timestamp: new Date('2023-01-02')
      })
      
      translationStore.addToHistory({
        id: '3',
        sourceText: 'Thank you',
        translatedText: 'Cảm ơn',
        sourceLanguage: 'en',
        targetLanguage: 'vi',
        timestamp: new Date('2023-01-03')
      })
    })

    it('should display history items correctly', async () => {
      const wrapper = createTestWrapper()
      
      await wrapper.vm.toggleHistoryPanel()
      
      expect(translationStore.historyCount).toBe(3)
      expect(wrapper.vm.filteredHistory.length).toBe(3)
    })

    it('should filter history by search query', async () => {
      const wrapper = createTestWrapper()
      
      await wrapper.vm.toggleHistoryPanel()
      
      // Search for "Hello"
      await wrapper.setData({ searchQuery: 'Hello' })
      
      const filtered = wrapper.vm.filteredHistory
      expect(filtered.length).toBe(1)
      expect(filtered[0].sourceText).toBe('Hello world')
    })

    it('should filter history by direction', async () => {
      const wrapper = createTestWrapper()
      
      await wrapper.vm.toggleHistoryPanel()
      
      // Filter by direction
      await wrapper.setData({ selectedDirection: 'en-vi' })
      
      const filtered = wrapper.vm.filteredHistory
      expect(filtered.length).toBe(3) // All items are en-vi
      expect(filtered.every(item => item.direction === 'en-vi')).toBe(true)
    })

    it('should sort history correctly', async () => {
      const wrapper = createTestWrapper()
      
      await wrapper.vm.toggleHistoryPanel()
      
      // Sort by oldest
      await wrapper.setData({ sortBy: 'oldest' })
      
      const filtered = wrapper.vm.filteredHistory
      expect(filtered[0].sourceText).toBe('Hello world') // Oldest first
      expect(filtered[2].sourceText).toBe('Thank you') // Newest last
    })

    it('should handle search with no results', async () => {
      const wrapper = createTestWrapper()
      
      await wrapper.vm.toggleHistoryPanel()
      
      // Search for non-existent text
      await wrapper.setData({ searchQuery: 'nonexistent' })
      
      expect(wrapper.vm.filteredHistory.length).toBe(0)
      expect(wrapper.find('.history-empty').exists()).toBe(true)
      expect(wrapper.text()).toContain('No results found')
    })
  })

  describe('Pagination', () => {
    beforeEach(() => {
      // Add many history items to test pagination
      for (let i = 1; i <= 25; i++) {
        translationStore.addToHistory({
          id: i.toString(),
          sourceText: `Text ${i}`,
          translatedText: `Translation ${i}`,
          sourceLanguage: 'en',
          targetLanguage: 'vi',
          timestamp: new Date(`2023-01-${i.toString().padStart(2, '0')}`)
        })
      }
    })

    it('should paginate history correctly', async () => {
      const wrapper = createTestWrapper()
      
      await wrapper.vm.toggleHistoryPanel()
      
      expect(wrapper.vm.filteredHistory.length).toBe(25)
      expect(wrapper.vm.paginatedHistory.length).toBe(20) // Default page size
      
      // Change page
      wrapper.vm.currentPage = 2
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.paginatedHistory.length).toBe(5) // Remaining items
    })

    it('should reset pagination when filters change', async () => {
      const wrapper = createTestWrapper()
      
      await wrapper.vm.toggleHistoryPanel()
      
      // Go to page 2
      wrapper.vm.currentPage = 2
      
      // Change search query
      await wrapper.setData({ searchQuery: 'Text 1' })
      
      expect(wrapper.vm.currentPage).toBe(1) // Should reset to page 1
    })
  })

  describe('History Actions', () => {
    beforeEach(() => {
      translationStore.addToHistory({
        id: '1',
        sourceText: 'Test text',
        translatedText: 'Test translation',
        sourceLanguage: 'en',
        targetLanguage: 'vi',
        timestamp: new Date()
      })
    })

    it('should use translation from history', async () => {
      const wrapper = createTestWrapper()
      
      const historyItem: HistoryItem = {
        id: 1,
        sourceText: 'Test text',
        translatedText: 'Test translation',
        direction: 'en-vi',
        timestamp: Date.now(),
        preview: {
          source: 'Test text',
          translated: 'Test translation'
        }
      }
      
      await wrapper.vm.useTranslation(historyItem)
      
      expect(translationStore.sourceLanguage).toBe('en')
      expect(translationStore.targetLanguage).toBe('vi')
      expect(message.success).toHaveBeenCalledWith('Translation loaded from history')
      expect(wrapper.vm.showHistoryPanel).toBe(false)
    })

    it('should delete history item with confirmation', async () => {
      const wrapper = createTestWrapper()
      
      // Mock Modal.confirm to call onOk immediately
      vi.mocked(Modal.confirm).mockImplementation((config: any) => {
        config.onOk()
        return Promise.resolve()
      })
      
      await wrapper.vm.deleteHistoryItem(1)
      
      expect(Modal.confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Delete this translation?',
          content: 'This action cannot be undone'
        })
      )
      expect(message.success).toHaveBeenCalledWith('Translation deleted')
    })

    it('should export history item', async () => {
      const wrapper = createTestWrapper()
      
      const historyItem: HistoryItem = {
        id: 1,
        sourceText: 'Test text',
        translatedText: 'Test translation',
        direction: 'en-vi',
        timestamp: Date.now(),
        preview: {
          source: 'Test text',
          translated: 'Test translation'
        }
      }
      
      await wrapper.vm.exportHistoryItem(historyItem)
      
      expect(global.URL.createObjectURL).toHaveBeenCalled()
      expect(document.createElement).toHaveBeenCalledWith('a')
      expect(message.success).toHaveBeenCalledWith('Translation exported successfully')
    })

    it('should handle export error', async () => {
      const wrapper = createTestWrapper()
      
      // Mock URL.createObjectURL to throw error
      vi.mocked(global.URL.createObjectURL).mockImplementationOnce(() => {
        throw new Error('Export failed')
      })
      
      const historyItem: HistoryItem = {
        id: 1,
        sourceText: 'Test text',
        translatedText: 'Test translation',
        direction: 'en-vi',
        timestamp: Date.now(),
        preview: {
          source: 'Test text',
          translated: 'Test translation'
        }
      }
      
      await wrapper.vm.exportHistoryItem(historyItem)
      
      expect(message.error).toHaveBeenCalledWith('Export failed')
    })

    it('should clear all history with confirmation', async () => {
      const wrapper = createTestWrapper()
      
      // Mock Modal.confirm to call onOk immediately
      vi.mocked(Modal.confirm).mockImplementation((config: any) => {
        config.onOk()
        return Promise.resolve()
      })
      
      await wrapper.vm.clearAllHistory()
      
      expect(Modal.confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Clear all history?',
          content: 'This will delete all translation history'
        })
      )
      expect(translationStore.historyCount).toBe(0)
      expect(message.success).toHaveBeenCalledWith('History cleared')
    })
  })

  describe('Panel Management', () => {
    it('should toggle history panel', async () => {
      const wrapper = createTestWrapper()
      
      expect(wrapper.vm.showHistoryPanel).toBe(false)
      
      await wrapper.vm.toggleHistoryPanel()
      expect(wrapper.vm.showHistoryPanel).toBe(true)
      
      await wrapper.vm.toggleHistoryPanel()
      expect(wrapper.vm.showHistoryPanel).toBe(false)
    })

    it('should close history panel', async () => {
      const wrapper = createTestWrapper()
      
      wrapper.vm.showHistoryPanel = true
      
      await wrapper.vm.closeHistoryPanel()
      
      expect(wrapper.vm.showHistoryPanel).toBe(false)
    })

    it('should reset filters when opening panel', async () => {
      const wrapper = createTestWrapper()
      
      // Set some filters
      await wrapper.setData({
        searchQuery: 'test',
        selectedDirection: 'en-vi',
        sortBy: 'oldest',
        currentPage: 2
      })
      
      await wrapper.vm.toggleHistoryPanel()
      
      expect(wrapper.vm.searchQuery).toBe('')
      expect(wrapper.vm.selectedDirection).toBeUndefined()
      expect(wrapper.vm.sortBy).toBe('newest')
      expect(wrapper.vm.currentPage).toBe(1)
    })
  })

  describe('Search Functionality', () => {
    beforeEach(() => {
      translationStore.addToHistory({
        id: '1',
        sourceText: 'Hello world',
        translatedText: 'Xin chào thế giới',
        sourceLanguage: 'en',
        targetLanguage: 'vi',
        timestamp: new Date()
      })
    })

    it('should handle search input', async () => {
      const wrapper = createTestWrapper()
      
      await wrapper.vm.handleSearch('Hello')
      
      expect(wrapper.vm.searchQuery).toBe('Hello')
    })

    it('should search in both source and translated text', async () => {
      const wrapper = createTestWrapper()
      
      await wrapper.vm.toggleHistoryPanel()
      
      // Search in source text
      await wrapper.setData({ searchQuery: 'Hello' })
      expect(wrapper.vm.filteredHistory.length).toBe(1)
      
      // Search in translated text
      await wrapper.setData({ searchQuery: 'chào' })
      expect(wrapper.vm.filteredHistory.length).toBe(1)
      
      // Search for non-matching text
      await wrapper.setData({ searchQuery: 'xyz' })
      expect(wrapper.vm.filteredHistory.length).toBe(0)
    })

    it('should be case insensitive', async () => {
      const wrapper = createTestWrapper()
      
      await wrapper.vm.toggleHistoryPanel()
      
      // Search with different cases
      await wrapper.setData({ searchQuery: 'HELLO' })
      expect(wrapper.vm.filteredHistory.length).toBe(1)
      
      await wrapper.setData({ searchQuery: 'hello' })
      expect(wrapper.vm.filteredHistory.length).toBe(1)
      
      await wrapper.setData({ searchQuery: 'Hello' })
      expect(wrapper.vm.filteredHistory.length).toBe(1)
    })
  })

  describe('Component Events and Props', () => {
    it('should handle HistoryItem events correctly', async () => {
      const wrapper = createTestWrapper()
      
      translationStore.addToHistory({
        id: '1',
        sourceText: 'Test',
        translatedText: 'Translation',
        sourceLanguage: 'en',
        targetLanguage: 'vi',
        timestamp: new Date()
      })
      
      await wrapper.vm.toggleHistoryPanel()
      
      const historyItem = wrapper.findComponent({ name: 'HistoryItem' })
      
      // Test use event
      await historyItem.vm.$emit('use', {
        id: 1,
        direction: 'en-vi'
      })
      
      // Test delete event
      await historyItem.vm.$emit('delete', 1)
      
      // Test export event
      await historyItem.vm.$emit('export', {
        id: 1,
        sourceText: 'Test',
        translatedText: 'Translation',
        direction: 'en-vi',
        timestamp: Date.now()
      })
      
      // Events should be handled without errors
      expect(wrapper.vm.showHistoryPanel).toBe(false) // Closed after use
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty search gracefully', async () => {
      const wrapper = createTestWrapper()
      
      translationStore.addToHistory({
        id: '1',
        sourceText: 'Test',
        translatedText: 'Translation',
        sourceLanguage: 'en',
        targetLanguage: 'vi',
        timestamp: new Date()
      })
      
      await wrapper.vm.toggleHistoryPanel()
      
      // Empty search should show all items
      await wrapper.setData({ searchQuery: '' })
      expect(wrapper.vm.filteredHistory.length).toBe(1)
      
      // Whitespace-only search should show all items
      await wrapper.setData({ searchQuery: '   ' })
      expect(wrapper.vm.filteredHistory.length).toBe(1)
    })

    it('should handle invalid direction filter', async () => {
      const wrapper = createTestWrapper()
      
      translationStore.addToHistory({
        id: '1',
        sourceText: 'Test',
        translatedText: 'Translation',
        sourceLanguage: 'en',
        targetLanguage: 'vi',
        timestamp: new Date()
      })
      
      await wrapper.vm.toggleHistoryPanel()
      
      // Invalid direction should show no items
      await wrapper.setData({ selectedDirection: 'invalid-direction' })
      expect(wrapper.vm.filteredHistory.length).toBe(0)
    })

    it('should handle pagination edge cases', async () => {
      const wrapper = createTestWrapper()
      
      // Add one item
      translationStore.addToHistory({
        id: '1',
        sourceText: 'Test',
        translatedText: 'Translation',
        sourceLanguage: 'en',
        targetLanguage: 'vi',
        timestamp: new Date()
      })
      
      await wrapper.vm.toggleHistoryPanel()
      
      // Set page beyond available pages
      wrapper.vm.currentPage = 10
      await wrapper.vm.$nextTick()
      
      // Should still work without errors
      expect(wrapper.vm.paginatedHistory.length).toBe(0)
    })
  })
})