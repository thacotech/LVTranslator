<template>
  <a-modal
    v-model:open="visible"
    :title="title || $t('common.confirm')"
    :width="400"
    :centered="true"
    :mask-closable="false"
    @ok="handleConfirm"
    @cancel="handleCancel"
  >
    <template #footer>
      <a-space>
        <a-button @click="handleCancel">
          {{ cancelText || $t('common.cancel') }}
        </a-button>
        <a-button 
          :type="confirmType" 
          :loading="loading"
          @click="handleConfirm"
        >
          {{ confirmText || $t('common.ok') }}
        </a-button>
      </a-space>
    </template>

    <div class="confirm-content">
      <!-- Icon based on type -->
      <div class="confirm-icon">
        <a-icon 
          v-if="type === 'warning'" 
          type="exclamation-circle" 
          class="warning-icon"
        />
        <a-icon 
          v-else-if="type === 'error' || type === 'danger'" 
          type="close-circle" 
          class="error-icon"
        />
        <a-icon 
          v-else-if="type === 'info'" 
          type="info-circle" 
          class="info-icon"
        />
        <a-icon 
          v-else 
          type="question-circle" 
          class="question-icon"
        />
      </div>

      <!-- Content -->
      <div class="confirm-text">
        <div v-if="content" class="main-content">
          {{ content }}
        </div>
        <div v-if="description" class="description">
          {{ description }}
        </div>
        <slot />
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  modelValue: boolean
  title?: string
  content?: string
  description?: string
  type?: 'info' | 'warning' | 'error' | 'danger' | 'question'
  confirmText?: string
  cancelText?: string
  loading?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'question',
  loading: false
})

const emit = defineEmits<Emits>()

const { t } = useI18n()

// Computed visibility
const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

// Computed confirm button type
const confirmType = computed(() => {
  switch (props.type) {
    case 'error':
    case 'danger':
      return 'primary'
    case 'warning':
      return 'primary'
    default:
      return 'primary'
  }
})

// Event handlers
function handleConfirm() {
  emit('confirm')
}

function handleCancel() {
  emit('cancel')
  visible.value = false
}
</script>

<style scoped>
.confirm-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 8px 0;
}

.confirm-icon {
  flex-shrink: 0;
  font-size: 22px;
  margin-top: 2px;
}

.warning-icon {
  color: #faad14;
}

.error-icon {
  color: #ff4d4f;
}

.info-icon {
  color: #1890ff;
}

.question-icon {
  color: #722ed1;
}

.confirm-text {
  flex: 1;
  line-height: 1.5;
}

.main-content {
  font-size: 14px;
  color: var(--text-color);
  margin-bottom: 8px;
}

.description {
  font-size: 12px;
  color: var(--text-color-secondary);
  line-height: 1.4;
}

/* Dark mode styles */
:global(.dark-mode) .main-content {
  color: var(--text-color-dark);
}

:global(.dark-mode) .description {
  color: var(--text-color-secondary-dark);
}
</style>