<template>
  <a-modal
    :open="props.open"
    :title="$t('accessibility.keyboardShortcuts')"
    :footer="null"
    :width="600"
    class="keyboard-shortcuts-modal"
    @cancel="closeModal"
  >
    <div class="shortcuts-content">
      <p class="shortcuts-description">
        {{ $t('accessibility.shortcutsDescription') }}
      </p>
      
      <div 
        v-for="category in groupedShortcuts" 
        :key="category.name"
        class="shortcut-category"
      >
        <h3 class="category-title">{{ $t(`shortcuts.category.${category.name.toLowerCase()}`) }}</h3>
        <div class="shortcuts-list">
          <div 
            v-for="shortcut in category.shortcuts" 
            :key="shortcut.key + shortcut.description"
            class="shortcut-item"
          >
            <div class="shortcut-keys">
              <kbd v-if="shortcut.ctrlKey" class="key">Ctrl</kbd>
              <kbd v-if="shortcut.altKey" class="key">Alt</kbd>
              <kbd v-if="shortcut.shiftKey" class="key">Shift</kbd>
              <kbd v-if="shortcut.metaKey" class="key">Cmd</kbd>
              <kbd class="key">{{ formatKey(shortcut.key) }}</kbd>
            </div>
            <div class="shortcut-description">
              {{ $t(`shortcuts.${shortcut.description}`, shortcut.description) }}
            </div>
          </div>
        </div>
      </div>
      
      <div class="shortcuts-footer">
        <a-alert
          :message="$t('accessibility.shortcutsNote')"
          type="info"
          show-icon
          class="shortcuts-note"
        />
        <div class="footer-actions">
          <a-button type="primary" @click="closeModal">
            {{ $t('common.close') }}
          </a-button>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, watch, nextTick } from 'vue'
import { Modal as AModal, Alert as AAlert, Button as AButton } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { useKeyboardNavigation } from '@/composables/useKeyboardNavigation'
import type { KeyboardShortcut } from '@/composables/useKeyboardNavigation'

interface Props {
  open: boolean
}

interface Emits {
  (e: 'update:open', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()
const { shortcuts, trapFocus } = useKeyboardNavigation()

const groupedShortcuts = computed(() => {
  const groups: { [key: string]: KeyboardShortcut[] } = {}
  
  shortcuts.value.forEach(shortcut => {
    if (!groups[shortcut.category]) {
      groups[shortcut.category] = []
    }
    groups[shortcut.category].push(shortcut)
  })
  
  return Object.entries(groups).map(([name, shortcuts]) => ({
    name,
    shortcuts: shortcuts.sort((a, b) => a.description.localeCompare(b.description))
  })).sort((a, b) => {
    // Sort categories in a logical order
    const order = ['Navigation', 'Translation', 'File', 'Focus', 'Accessibility']
    const aIndex = order.indexOf(a.name)
    const bIndex = order.indexOf(b.name)
    
    if (aIndex === -1 && bIndex === -1) return a.name.localeCompare(b.name)
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    
    return aIndex - bIndex
  })
})

function formatKey(key: string): string {
  const keyMap: { [key: string]: string } = {
    'Enter': 'Enter',
    'Escape': 'Esc',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    ' ': 'Space'
  }
  
  return keyMap[key] || key.toUpperCase()
}

function closeModal() {
  emit('update:open', false)
}

// Trap focus when modal is visible
watch(() => props.open, (visible) => {
  if (visible) {
    nextTick(() => {
      const cleanup = trapFocus('.keyboard-shortcuts-modal')
      
      // Store cleanup function to call when modal closes
      if (cleanup) {
        const modal = document.querySelector('.keyboard-shortcuts-modal')
        if (modal) {
          (modal as any)._focusTrapCleanup = cleanup
        }
      }
    })
  } else {
    // Call cleanup function if it exists
    const modal = document.querySelector('.keyboard-shortcuts-modal')
    if (modal && (modal as any)._focusTrapCleanup) {
      (modal as any)._focusTrapCleanup()
      delete (modal as any)._focusTrapCleanup
    }
  }
})
</script>

<style scoped>
.shortcuts-content {
  max-height: 60vh;
  overflow-y: auto;
}

.shortcuts-description {
  margin-bottom: 24px;
  color: var(--text-color-secondary);
  font-size: 14px;
  line-height: 1.5;
}

.shortcut-category {
  margin-bottom: 24px;
}

.category-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--color-surface);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.shortcut-keys {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.key {
  display: inline-block;
  padding: 2px 6px;
  background: var(--color-surface-elevated);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-color);
  min-width: 20px;
  text-align: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.shortcut-description {
  flex: 1;
  margin-left: 16px;
  font-size: 14px;
  color: var(--text-color);
}

.shortcuts-footer {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.shortcuts-note {
  margin-bottom: 16px;
}

.footer-actions {
  display: flex;
  justify-content: flex-end;
}

/* Dark mode styles */
.dark-mode .category-title {
  color: var(--text-color-dark);
  border-bottom-color: var(--border-color-dark);
}

.dark-mode .shortcut-item {
  background: var(--color-surface-dark);
  border-color: var(--border-color-dark);
}

.dark-mode .key {
  background: var(--color-surface-elevated-dark);
  border-color: var(--border-color-dark);
  color: var(--text-color-dark);
}

.dark-mode .shortcut-description {
  color: var(--text-color-dark);
}

.dark-mode .shortcuts-footer {
  border-top-color: var(--border-color-dark);
}

/* Responsive design */
@media (max-width: 768px) {
  .shortcut-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .shortcut-description {
    margin-left: 0;
  }
  
  .shortcuts-content {
    max-height: 50vh;
  }
}

/* Focus styles for accessibility */
.shortcut-item:focus-within {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>