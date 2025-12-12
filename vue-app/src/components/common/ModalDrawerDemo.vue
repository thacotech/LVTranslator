<template>
  <div class="modal-drawer-demo">
    <a-space direction="vertical" size="large">
      <a-card title="Modal and Drawer Components Demo">
        <a-space>
          <a-button type="primary" @click="showSettingsModal">
            Open Settings Modal
          </a-button>
          <a-button @click="showHistoryDrawer">
            Open History Drawer
          </a-button>
          <a-button danger @click="showConfirmDialog">
            Show Confirm Dialog
          </a-button>
        </a-space>
      </a-card>
    </a-space>

    <!-- Settings Modal -->
    <SettingsModal v-model="settingsModalVisible" />

    <!-- History Details Drawer -->
    <HistoryDetailsDrawer
      v-model="historyDrawerVisible"
      :history-item="sampleHistoryItem"
      @use-translation="handleUseTranslation"
      @delete-item="handleDeleteItem"
      @export-item="handleExportItem"
    />

    <!-- Confirm Dialog -->
    <ConfirmDialog
      v-model="confirmDialogVisible"
      title="Delete Translation"
      content="Are you sure you want to delete this translation?"
      description="This action cannot be undone."
      type="danger"
      confirm-text="Delete"
      @confirm="handleConfirmDelete"
      @cancel="handleCancelDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useNotification } from '@/services/notificationService'
import SettingsModal from './SettingsModal.vue'
import HistoryDetailsDrawer from './HistoryDetailsDrawer.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import type { HistoryItem } from '@/types'

const { showSuccess, showInfo } = useNotification()

// Modal and drawer visibility
const settingsModalVisible = ref(false)
const historyDrawerVisible = ref(false)
const confirmDialogVisible = ref(false)

// Sample history item for demo
const sampleHistoryItem = ref<HistoryItem>({
  id: 1,
  sourceText: 'Hello, how are you today?',
  translatedText: 'Xin chào, hôm nay bạn thế nào?',
  direction: 'en-vi',
  timestamp: Date.now(),
  preview: {
    source: 'Hello, how are you today?',
    translated: 'Xin chào, hôm nay bạn thế nào?'
  }
})

// Event handlers
function showSettingsModal() {
  settingsModalVisible.value = true
}

function showHistoryDrawer() {
  historyDrawerVisible.value = true
}

function showConfirmDialog() {
  confirmDialogVisible.value = true
}

function handleUseTranslation(item: HistoryItem) {
  showSuccess('notifications.success.title', `Translation loaded: ${item.preview.source}`)
}

function handleDeleteItem(item: HistoryItem) {
  showSuccess('notifications.success.title', `Translation deleted: ${item.preview.source}`)
}

function handleExportItem(item: HistoryItem) {
  showInfo('notifications.info.title', `Exporting translation: ${item.preview.source}`)
}

function handleConfirmDelete() {
  showSuccess('notifications.success.title', 'Translation deleted successfully')
  confirmDialogVisible.value = false
}

function handleCancelDelete() {
  showInfo('notifications.info.title', 'Delete operation cancelled')
}
</script>

<style scoped>
.modal-drawer-demo {
  padding: 24px;
}
</style>