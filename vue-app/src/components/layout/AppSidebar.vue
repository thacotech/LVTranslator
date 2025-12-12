<template>
  <a-layout-sider
    v-model:collapsed="collapsed"
    :trigger="null"
    collapsible
    :width="280"
    :collapsed-width="64"
    :theme="settingsStore.isDarkMode ? 'dark' : 'light'"
    class="app-sidebar"
    :class="{
      'mobile-sidebar': isMobile,
      'sidebar-visible': isMobile && sidebarVisible
    }"
    role="complementary"
    :aria-label="$t('accessibility.sidebar')"
    :aria-expanded="!collapsed"
  >
    <!-- Sidebar Header -->
    <div class="sidebar-header">
      <div class="sidebar-title" v-if="!collapsed">
        <FileTextOutlined class="sidebar-icon" />
        <span>{{ $t('sidebar.navigation') }}</span>
      </div>
      <a-button
        type="text"
        class="collapse-btn"
        @click="toggleCollapsed"
        :title="$t(collapsed ? 'sidebar.expand' : 'sidebar.collapse')"
        :aria-label="$t(collapsed ? 'sidebar.expand' : 'sidebar.collapse')"
        :aria-expanded="!collapsed"
      >
        <template #icon>
          <MenuUnfoldOutlined v-if="collapsed" />
          <MenuFoldOutlined v-else />
        </template>
      </a-button>
    </div>

    <!-- Main Navigation Menu -->
    <a-menu
      v-model:selectedKeys="selectedKeys"
      :mode="'inline'"
      :theme="settingsStore.isDarkMode ? 'dark' : 'light'"
      class="sidebar-menu"
    >
      <!-- Translation Section -->
      <a-menu-item key="translate" @click="navigateTo('/')">
        <template #icon>
          <TranslationOutlined />
        </template>
        <span>{{ $t('nav.translate') }}</span>
      </a-menu-item>

      <!-- File Upload -->
      <a-menu-item key="file-upload" @click="navigateTo('/file-upload')">
        <template #icon>
          <UploadOutlined />
        </template>
        <span>{{ $t('nav.fileUpload') }}</span>
      </a-menu-item>

      <!-- History Section -->
      <a-sub-menu key="history" :title="$t('nav.history')">
        <template #icon>
          <HistoryOutlined />
        </template>
        <a-menu-item key="recent-translations" @click="navigateTo('/history')">
          <template #icon>
            <ClockCircleOutlined />
          </template>
          <span>{{ $t('history.recent') }}</span>
        </a-menu-item>
        <a-menu-item key="favorites" @click="navigateTo('/history/favorites')">
          <template #icon>
            <StarOutlined />
          </template>
          <span>{{ $t('history.favorites') }}</span>
        </a-menu-item>
        <a-menu-item key="search-history" @click="navigateTo('/history/search')">
          <template #icon>
            <SearchOutlined />
          </template>
          <span>{{ $t('history.search') }}</span>
        </a-menu-item>
      </a-sub-menu>

      <!-- Tools Section -->
      <a-sub-menu key="tools" :title="$t('nav.tools')">
        <template #icon>
          <ToolOutlined />
        </template>
        <a-menu-item key="tts" @click="navigateTo('/tools/tts')">
          <template #icon>
            <SoundOutlined />
          </template>
          <span>{{ $t('tools.textToSpeech') }}</span>
        </a-menu-item>
        <a-menu-item key="stt" @click="navigateTo('/tools/stt')">
          <template #icon>
            <AudioOutlined />
          </template>
          <span>{{ $t('tools.speechToText') }}</span>
        </a-menu-item>
        <a-menu-item key="batch-translate" @click="navigateTo('/tools/batch')">
          <template #icon>
            <FileTextOutlined />
          </template>
          <span>{{ $t('tools.batchTranslate') }}</span>
        </a-menu-item>
      </a-sub-menu>

      <!-- Settings -->
      <a-menu-item key="settings" @click="navigateTo('/settings')">
        <template #icon>
          <SettingOutlined />
        </template>
        <span>{{ $t('nav.settings') }}</span>
      </a-menu-item>
    </a-menu>

    <!-- Quick Stats (when not collapsed) -->
    <div class="sidebar-stats" v-if="!collapsed">
      <a-divider />
      <div class="stats-section">
        <h4 class="stats-title">{{ $t('sidebar.quickStats') }}</h4>
        <div class="stat-item">
          <span class="stat-label">{{ $t('stats.totalTranslations') }}:</span>
          <span class="stat-value">{{ translationStore.history.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">{{ $t('stats.todayTranslations') }}:</span>
          <span class="stat-value">{{ todayTranslationsCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">{{ $t('stats.favoriteLanguage') }}:</span>
          <span class="stat-value">{{ mostUsedLanguage }}</span>
        </div>
      </div>
    </div>

    <!-- Quick Actions (when not collapsed) -->
    <div class="sidebar-actions" v-if="!collapsed">
      <a-divider />
      <div class="actions-section">
        <h4 class="actions-title">{{ $t('sidebar.quickActions') }}</h4>
        <a-space direction="vertical" style="width: 100%">
          <a-button 
            type="primary" 
            block 
            size="small"
            @click="navigateTo('/')"
          >
            <template #icon>
              <PlusOutlined />
            </template>
            {{ $t('actions.newTranslation') }}
          </a-button>
          <a-button 
            block 
            size="small"
            @click="clearHistory"
            :disabled="translationStore.history.length === 0"
          >
            <template #icon>
              <DeleteOutlined />
            </template>
            {{ $t('actions.clearHistory') }}
          </a-button>
          <a-button 
            block 
            size="small"
            @click="exportHistory"
            :disabled="translationStore.history.length === 0"
          >
            <template #icon>
              <ExportOutlined />
            </template>
            {{ $t('actions.exportHistory') }}
          </a-button>
        </a-space>
      </div>
    </div>

    <!-- Footer Info (when not collapsed) -->
    <div class="sidebar-footer" v-if="!collapsed">
      <a-divider />
      <div class="footer-content">
        <div class="app-version">
          <small>{{ $t('app.version') }} 2.0.0</small>
        </div>
        <div class="last-update">
          <small>{{ $t('sidebar.lastUpdate') }}: {{ lastUpdateTime }}</small>
        </div>
      </div>
    </div>
  </a-layout-sider>

  <!-- Mobile Overlay -->
  <div 
    v-if="isMobile && sidebarVisible"
    class="sidebar-overlay"
    @click="closeSidebar"
  ></div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  Menu as AMenu,
  Button as AButton,
  Divider as ADivider,
  Space as ASpace,
  Modal
} from 'ant-design-vue'
import {
  TranslationOutlined,
  HistoryOutlined,
  SettingOutlined,
  UploadOutlined,
  ClockCircleOutlined,
  StarOutlined,
  SearchOutlined,
  ToolOutlined,
  SoundOutlined,
  AudioOutlined,
  FileTextOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  DeleteOutlined,
  ExportOutlined
} from '@ant-design/icons-vue'
import { useSettingsStore } from '@/stores/settings'
import { useTranslationStore } from '@/stores/translation'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const settingsStore = useSettingsStore()
const translationStore = useTranslationStore()

// Component state
const collapsed = ref(false)
const selectedKeys = ref<string[]>([])
const sidebarVisible = ref(false)
const isMobile = ref(false)

// Computed properties
const todayTranslationsCount = computed(() => {
  const today = new Date().toDateString()
  return translationStore.history.filter(
    translation => new Date(translation.timestamp).toDateString() === today
  ).length
})

const mostUsedLanguage = computed(() => {
  if (translationStore.history.length === 0) return 'N/A'
  
  const languageCounts: { [key: string]: number } = {}
  translationStore.history.forEach(translation => {
    const direction = translation.direction
    languageCounts[direction] = (languageCounts[direction] || 0) + 1
  })
  
  const mostUsed = Object.entries(languageCounts).reduce((a, b) => 
    languageCounts[a[0]] > languageCounts[b[0]] ? a : b
  )
  
  return mostUsed ? mostUsed[0] : 'N/A'
})

const lastUpdateTime = computed(() => {
  if (translationStore.history.length === 0) return t('common.never')
  
  const lastTranslation = translationStore.history[0] // Assuming newest first
  const date = new Date(lastTranslation.timestamp)
  return date.toLocaleString()
})

// Methods
function navigateTo(path: string) {
  router.push(path)
  if (isMobile.value) {
    closeSidebar()
  }
}

function toggleCollapsed() {
  collapsed.value = !collapsed.value
  
  // Save preference
  localStorage.setItem('sidebarCollapsed', collapsed.value.toString())
}

function openSidebar() {
  sidebarVisible.value = true
}

function closeSidebar() {
  sidebarVisible.value = false
}

function clearHistory() {
  Modal.confirm({
    title: t('confirm.clearHistory.title'),
    content: t('confirm.clearHistory.content'),
    okText: t('common.yes'),
    cancelText: t('common.no'),
    onOk() {
      translationStore.clearHistory()
    }
  })
}

function exportHistory() {
  try {
    const data = JSON.stringify(translationStore.history, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `translation-history-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Export failed:', error)
  }
}

// Update selected menu key based on current route
function updateSelectedKey() {
  const path = route.path
  
  if (path === '/') {
    selectedKeys.value = ['translate']
  } else if (path.startsWith('/file-upload')) {
    selectedKeys.value = ['file-upload']
  } else if (path === '/history') {
    selectedKeys.value = ['recent-translations']
  } else if (path.startsWith('/history/favorites')) {
    selectedKeys.value = ['favorites']
  } else if (path.startsWith('/history/search')) {
    selectedKeys.value = ['search-history']
  } else if (path.startsWith('/tools/tts')) {
    selectedKeys.value = ['tts']
  } else if (path.startsWith('/tools/stt')) {
    selectedKeys.value = ['stt']
  } else if (path.startsWith('/tools/batch')) {
    selectedKeys.value = ['batch-translate']
  } else if (path.startsWith('/settings')) {
    selectedKeys.value = ['settings']
  } else {
    selectedKeys.value = []
  }
}

// Check if mobile
function checkMobile() {
  isMobile.value = window.innerWidth < 768
  
  // Auto-collapse on mobile
  if (isMobile.value) {
    collapsed.value = true
  }
}

// Handle window resize
function handleResize() {
  checkMobile()
}

// Watch for route changes
watch(
  () => route.path,
  () => {
    updateSelectedKey()
  }
)

// Lifecycle hooks
onMounted(() => {
  updateSelectedKey()
  checkMobile()
  
  // Load saved collapsed state
  const savedCollapsed = localStorage.getItem('sidebarCollapsed')
  if (savedCollapsed !== null && !isMobile.value) {
    collapsed.value = savedCollapsed === 'true'
  }
  
  // Add resize listener
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// Expose methods for parent component
defineExpose({
  openSidebar,
  closeSidebar,
  toggleCollapsed
})
</script>

<style scoped>
.app-sidebar {
  background: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  height: 100vh;
  position: fixed;
  left: 0;
  top: 64px; /* Account for header height */
  z-index: 100;
  overflow-y: auto;
  transition: all 0.3s ease;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  min-height: 64px;
}

.sidebar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--text-color);
}

.sidebar-icon {
  font-size: 16px;
  color: var(--primary-color);
}

.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 4px;
}

.sidebar-menu {
  border-right: none;
  background: transparent;
}

.sidebar-stats,
.sidebar-actions,
.sidebar-footer {
  padding: 16px;
}

.stats-title,
.actions-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-color-secondary);
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
}

.stat-label {
  color: var(--text-color-secondary);
}

.stat-value {
  color: var(--text-color);
  font-weight: 500;
}

.footer-content {
  text-align: center;
  color: var(--text-color-secondary);
}

.app-version,
.last-update {
  margin-bottom: 4px;
}

/* Mobile styles */
.mobile-sidebar {
  position: fixed;
  top: 64px;
  left: -280px;
  z-index: 1001;
  transition: left 0.3s ease;
}

.mobile-sidebar.sidebar-visible {
  left: 0;
}

.sidebar-overlay {
  position: fixed;
  top: 64px;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

/* Dark mode styles */
.dark-mode .app-sidebar {
  background: var(--sidebar-bg-dark);
  border-right-color: var(--border-color-dark);
}

.dark-mode .sidebar-header {
  border-bottom-color: var(--border-color-dark);
}

.dark-mode .sidebar-title {
  color: var(--text-color-dark);
}

.dark-mode .stat-label {
  color: var(--text-color-secondary-dark);
}

.dark-mode .stat-value {
  color: var(--text-color-dark);
}

.dark-mode .footer-content {
  color: var(--text-color-secondary-dark);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .app-sidebar {
    position: fixed;
    left: -280px;
    z-index: 1001;
  }
  
  .app-sidebar.sidebar-visible {
    left: 0;
  }
}

/* Scrollbar styling */
.app-sidebar::-webkit-scrollbar {
  width: 6px;
}

.app-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.app-sidebar::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 3px;
}

.app-sidebar::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}

/* Menu item hover effects */
:deep(.ant-menu-item:hover),
:deep(.ant-menu-submenu-title:hover) {
  background-color: var(--menu-item-hover-bg) !important;
}

:deep(.ant-menu-item-selected) {
  background-color: var(--menu-item-selected-bg) !important;
}

:deep(.ant-menu-item-selected::after) {
  border-right-color: var(--primary-color) !important;
}

/* Collapsed state adjustments */
:deep(.ant-layout-sider-collapsed) .sidebar-header {
  padding: 16px 8px;
  justify-content: center;
}

:deep(.ant-layout-sider-collapsed) .sidebar-title {
  display: none;
}

/* Animation for smooth transitions */
.sidebar-stats,
.sidebar-actions,
.sidebar-footer {
  transition: opacity 0.3s ease;
}

:deep(.ant-layout-sider-collapsed) .sidebar-stats,
:deep(.ant-layout-sider-collapsed) .sidebar-actions,
:deep(.ant-layout-sider-collapsed) .sidebar-footer {
  opacity: 0;
  pointer-events: none;
}
</style>