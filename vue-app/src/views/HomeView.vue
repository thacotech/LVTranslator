<template>
  <div class="home-view">
    <div class="container">
      <!-- Translation Section - Always loaded -->
      <Suspense>
        <template #default>
          <TranslationForm />
        </template>
        <template #fallback>
          <div class="loading-section">
            <a-spin size="large" :tip="$t('common.loading')" />
          </div>
        </template>
      </Suspense>

      <!-- File Upload Section - Lazy loaded -->
      <div ref="fileUploaderSection" class="lazy-section">
        <Suspense v-if="showFileUploader">
          <template #default>
            <FileUploader />
          </template>
          <template #fallback>
            <div class="loading-section">
              <a-spin size="large" :tip="$t('fileUpload.loading')" />
            </div>
          </template>
        </Suspense>
        <div v-else class="placeholder-section" @click="loadFileUploader">
          <a-button type="dashed" size="large" block>
            <template #icon>
              <UploadOutlined />
            </template>
            {{ $t('fileUpload.loadComponent') }}
          </a-button>
        </div>
      </div>

      <!-- Translation History - Lazy loaded -->
      <div ref="historySection" class="lazy-section">
        <Suspense v-if="showHistory">
          <template #default>
            <TranslationHistory />
          </template>
          <template #fallback>
            <div class="loading-section">
              <a-spin size="large" :tip="$t('history.loading')" />
            </div>
          </template>
        </Suspense>
        <div v-else class="placeholder-section" @click="loadHistory">
          <a-button type="dashed" size="large" block>
            <template #icon>
              <HistoryOutlined />
            </template>
            {{ $t('history.loadComponent') }}
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
import { Button as AButton, Spin as ASpin } from 'ant-design-vue'
import { UploadOutlined, HistoryOutlined } from '@ant-design/icons-vue'

// Always load the main translation form
const TranslationForm = defineAsyncComponent(() => 
  import('@/components/translation/TranslationForm.vue')
)

// Lazy load heavy components
const FileUploader = defineAsyncComponent(() => 
  import('@/components/file/FileUploader.vue')
)

const TranslationHistory = defineAsyncComponent(() => 
  import('@/components/history/TranslationHistory.vue')
)

// Component visibility state
const showFileUploader = ref(false)
const showHistory = ref(false)

// Element refs for intersection observer
const fileUploaderSection = ref<HTMLElement | null>(null)
const historySection = ref<HTMLElement | null>(null)

// Manual loading functions
function loadFileUploader() {
  showFileUploader.value = true
}

function loadHistory() {
  showHistory.value = true
}

// Auto-load components after a delay for better UX
onMounted(() => {
  // Auto-load file uploader after 2 seconds
  setTimeout(() => {
    if (!showFileUploader.value) {
      loadFileUploader()
    }
  }, 2000)

  // Auto-load history after 3 seconds
  setTimeout(() => {
    if (!showHistory.value) {
      loadHistory()
    }
  }, 3000)
})
</script>

<style scoped>
.home-view {
  min-height: 100vh;
  padding: var(--spacing-lg);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  background: var(--color-surface);
  border-radius: var(--radius-2xl);
  padding: var(--spacing-2xl);
  box-shadow: var(--shadow-xl);
  backdrop-filter: blur(10px);
  border: 1px solid var(--color-border-light);
  transition:
    background-color var(--duration-normal) var(--ease-in-out),
    border-color var(--duration-normal) var(--ease-in-out);
}

.lazy-section {
  margin-top: var(--spacing-xl);
}

.loading-section {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  padding: var(--spacing-xl);
}

.placeholder-section {
  padding: var(--spacing-xl);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  text-align: center;
  transition: all var(--duration-fast) var(--ease-in-out);
}

.placeholder-section:hover {
  border-color: var(--color-primary);
  background-color: var(--color-primary-bg);
}

@media (max-width: 768px) {
  .home-view {
    padding: var(--spacing-sm);
  }

  .container {
    margin: 0;
    padding: var(--spacing-lg);
    border-radius: var(--radius-xl);
  }
}
</style>
