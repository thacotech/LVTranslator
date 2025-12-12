<template>
  <a-config-provider :locale="antdLocale" :theme="antdTheme">
    <!-- Skip Navigation Links -->
    <SkipNavigation />
    
    <div
      id="app"
      :class="{
        'dark-mode': settingsStore.isDarkMode,
        'lao-interface': settingsStore.isLaoInterface,
      }"
    >
      <!-- Global Loading Overlay -->
      <a-spin 
        :spinning="globalLoading" 
        size="large" 
        :tip="$t('common.loading')"
        class="global-loading"
      >
        <!-- Main Application Layout -->
        <a-layout class="app-layout">
          <!-- Header Component -->
          <AppHeader />
          
          <!-- Main Content Area -->
          <a-layout>
            <!-- Sidebar Component -->
            <AppSidebar />
            
            <!-- Content Area -->
            <a-layout-content 
              id="main-content"
              class="main-content"
              role="main"
              tabindex="-1"
            >
              <!-- Router View with Error Boundary -->
              <Suspense>
                <template #default>
                  <RouterView v-slot="{ Component, route }">
                    <Transition name="fade" mode="out-in">
                      <component :is="Component" :key="route.path" />
                    </Transition>
                  </RouterView>
                </template>
                <template #fallback>
                  <div class="loading-fallback">
                    <a-spin size="large" :tip="$t('common.loading')" />
                  </div>
                </template>
              </Suspense>
            </a-layout-content>
          </a-layout>
        </a-layout>
      </a-spin>

      <!-- Global Error Modal -->
      <a-modal
        v-model:open="errorModalVisible"
        :title="$t('error.title')"
        :footer="null"
        @ok="clearError"
      >
        <div class="error-content">
          <a-alert
            :message="globalError?.title || $t('error.unknown')"
            :description="globalError?.description"
            type="error"
            show-icon
          />
          <div class="error-actions" v-if="globalError?.action">
            <a-button type="primary" @click="retryLastAction">
              {{ globalError.action }}
            </a-button>
            <a-button @click="clearError">
              {{ $t('common.close') }}
            </a-button>
          </div>
        </div>
      </a-modal>

      <!-- Global Success Notification -->
      <!-- Handled by Ant Design notification system -->
      
      <!-- Keyboard Shortcuts Help Modal -->
      <KeyboardShortcutsModal 
        v-model:visible="keyboardNavigation.isShortcutHelpVisible.value"
      />
    </div>
  </a-config-provider>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onErrorCaptured, provide, defineAsyncComponent, shallowRef, markRaw } from 'vue'
import { RouterView } from 'vue-router'
import { ConfigProvider as AConfigProvider, Layout as ALayout, Spin as ASpin, Modal as AModal, Alert as AAlert, Button as AButton } from 'ant-design-vue'
import { theme } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settings'
import { useTranslationStore } from '@/stores/translation'
import { useNotification } from '@/services/notificationService'

import { useKeyboardNavigation } from '@/composables/useKeyboardNavigation'
import type { ErrorMessage } from '@/types'

// Lazy load layout components with error boundaries
const AppHeader = defineAsyncComponent({
  loader: () => import('@/components/layout/AppHeader.vue'),
  loadingComponent: () => null,
  errorComponent: () => null,
  delay: 200,
  timeout: 3000
})

const AppSidebar = defineAsyncComponent({
  loader: () => import('@/components/layout/AppSidebar.vue'),
  loadingComponent: () => null,
  errorComponent: () => null,
  delay: 200,
  timeout: 3000
})

// Import accessibility components
const SkipNavigation = defineAsyncComponent(() => import('@/components/common/SkipNavigation.vue'))
const KeyboardShortcutsModal = defineAsyncComponent(() => import('@/components/common/KeyboardShortcutsModal.vue'))

// Ant Design locale imports
import enUS from 'ant-design-vue/es/locale/en_US'
import viVN from 'ant-design-vue/es/locale/vi_VN'
// Note: Lao locale not available in Ant Design, will use English as fallback

const { t, locale } = useI18n()
const settingsStore = useSettingsStore()
const translationStore = useTranslationStore()
const { showErrorMessage, showSuccess } = useNotification()
const keyboardNavigation = useKeyboardNavigation()

// Global state - simplified
const globalLoading = ref(false)
const globalError = ref<ErrorMessage | null>(null)
const errorModalVisible = ref(false)
const lastAction = ref<(() => void) | null>(null)

// Ant Design configuration - simplified
const antdLocale = computed(() => {
  switch (locale.value) {
    case 'vi':
      return viVN
    case 'lo':
      return enUS // Fallback to English for Lao
    case 'en':
    default:
      return enUS
  }
})

const antdTheme = computed(() => ({
  algorithm: settingsStore.isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 6,
    fontSize: settingsStore.preferences.fontSize === 'small' ? 12 : 
              settingsStore.preferences.fontSize === 'large' ? 16 : 14,
  },
}))

// Global error handling
function handleGlobalError(error: ErrorMessage, retryFn?: () => void) {
  // Use notification service for errors
  showErrorMessage(error)
  lastAction.value = retryFn || null
  
  // Also log to console for debugging
  console.error('Global error:', error)
}

function clearError() {
  globalError.value = null
  errorModalVisible.value = false
  lastAction.value = null
}

function retryLastAction() {
  if (lastAction.value) {
    clearError()
    lastAction.value()
  }
}

// Global loading state management - simplified
function setGlobalLoading(loading: boolean) {
  globalLoading.value = loading
}

// Watch for store loading states
watch(
  () => translationStore.isLoading,
  (loading) => {
    if (loading) {
      setGlobalLoading(true)
    } else {
      // Add small delay to prevent flashing
      setTimeout(() => setGlobalLoading(false), 300)
    }
  }
)

// Watch for store errors
watch(
  () => translationStore.error,
  (error) => {
    if (error) {
      handleGlobalError({
        title: t('error.translation.title'),
        description: error,
        action: t('common.retry'),
        severity: 'error'
      }, () => {
        // Retry last translation if available
        translationStore.clearError()
      })
    }
  }
)

// Vue error boundary
onErrorCaptured((error, instance, info) => {
  console.error('Vue error captured:', error, info)
  
  handleGlobalError({
    title: t('error.application.title'),
    description: t('error.application.description'),
    severity: 'error'
  })
  
  // Return false to prevent the error from propagating further
  return false
})

// Global unhandled promise rejection handler
function handleUnhandledRejection(event: PromiseRejectionEvent) {
  console.error('Unhandled promise rejection:', event.reason)
  
  handleGlobalError({
    title: t('error.network.title'),
    description: t('error.network.description'),
    action: t('common.retry'),
    severity: 'error'
  })
  
  // Prevent default browser error handling
  event.preventDefault()
}

// Lifecycle hooks
onMounted(() => {
  // Add global error handlers
  window.addEventListener('unhandledrejection', handleUnhandledRejection)
  
  // Initialize application
  settingsStore.loadSettings()
})

// Provide global methods for child components
provide('handleGlobalError', handleGlobalError)
provide('setGlobalLoading', setGlobalLoading)
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
}

.main-content {
  padding: 24px;
  background: var(--bg-color);
  min-height: calc(100vh - 64px);
}

.global-loading {
  min-height: 100vh;
}

.loading-fallback {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.error-content {
  margin-bottom: 16px;
}

.error-actions {
  margin-top: 16px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

/* Transition animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Dark mode styles */
.dark-mode .main-content {
  background: var(--bg-color-dark);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .main-content {
    padding: 16px;
  }
}
</style>

<style>
@import './styles/main.css';
</style>
