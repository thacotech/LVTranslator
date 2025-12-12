<template>
  <div class="file-preview" v-if="file">
    <!-- File Header -->
    <div class="file-header">
      <div class="file-icon">
        <FileTextOutlined v-if="file.type === 'txt'" />
        <FileWordOutlined v-else-if="file.type === 'docx'" />
        <FilePdfOutlined v-else-if="file.type === 'pdf'" />
        <FileImageOutlined v-else-if="file.type === 'image'" />
        <FileOutlined v-else />
      </div>
      
      <div class="file-info">
        <h4 class="file-name">{{ file.name }}</h4>
        <div class="file-meta">
          <span class="file-size">{{ formatFileSize(file.size) }}</span>
          <a-divider type="vertical" />
          <span class="file-type">{{ file.type.toUpperCase() }}</span>
          <a-divider type="vertical" v-if="file.metadata?.pages" />
          <span v-if="file.metadata?.pages" class="page-count">
            {{ $t('filePreview.pages', { count: file.metadata.pages }) }}
          </span>
        </div>
      </div>

      <div class="file-actions">
        <a-button 
          v-if="showActions && file.processingStatus === 'success'"
          type="primary" 
          size="small"
          @click="$emit('use-file', file)"
        >
          {{ $t('filePreview.useFile') }}
        </a-button>
        
        <a-button 
          v-if="showActions"
          type="text" 
          size="small"
          @click="$emit('remove-file', file.id)"
          danger
        >
          <DeleteOutlined />
        </a-button>
      </div>
    </div>

    <!-- Processing Status -->
    <div class="processing-status" v-if="file.processingStatus !== 'success'">
      <!-- Loading State -->
      <div v-if="file.processingStatus === 'loading'" class="status-loading">
        <a-spin size="small" />
        <span class="status-text">{{ $t('filePreview.processing') }}...</span>
        <a-progress 
          v-if="processingProgress > 0"
          :percent="processingProgress" 
          size="small"
          :show-info="false"
        />
      </div>

      <!-- Error State -->
      <div v-else-if="file.processingStatus === 'error'" class="status-error">
        <a-alert
          :message="$t('filePreview.processingError')"
          :description="file.error || $t('filePreview.unknownError')"
          type="error"
          show-icon
          closable
          @close="$emit('dismiss-error', file.id)"
        />
        
        <div class="error-actions">
          <a-button 
            type="primary" 
            size="small"
            @click="$emit('retry-processing', file)"
          >
            {{ $t('filePreview.retry') }}
          </a-button>
        </div>
      </div>
    </div>

    <!-- File Content Preview -->
    <div v-if="file.processingStatus === 'success' && showPreview" class="content-preview">
      <div class="preview-header">
        <h5>{{ $t('filePreview.contentPreview') }}</h5>
        <a-button 
          type="text" 
          size="small"
          @click="togglePreview"
        >
          {{ showFullContent ? $t('filePreview.showLess') : $t('filePreview.showMore') }}
        </a-button>
      </div>

      <div class="preview-content">
        <div 
          v-if="file.extractedText" 
          class="extracted-text"
          :class="{ 'expanded': showFullContent }"
        >
          {{ displayText }}
        </div>
        
        <div v-else class="no-content">
          <a-empty 
            :description="$t('filePreview.noTextFound')"
            :image="Empty.PRESENTED_IMAGE_SIMPLE"
          />
        </div>
      </div>

      <!-- Content Statistics -->
      <div v-if="file.extractedText" class="content-stats">
        <a-statistic-group>
          <a-statistic 
            :title="$t('filePreview.characters')" 
            :value="file.extractedText.length"
            :value-style="{ fontSize: '14px' }"
          />
          <a-statistic 
            :title="$t('filePreview.words')" 
            :value="wordCount"
            :value-style="{ fontSize: '14px' }"
          />
          <a-statistic 
            v-if="file.metadata?.processingTime"
            :title="$t('filePreview.processingTime')" 
            :value="file.metadata.processingTime"
            suffix="ms"
            :value-style="{ fontSize: '14px' }"
          />
        </a-statistic-group>
      </div>
    </div>

    <!-- Processing Progress Indicator -->
    <div v-if="file.processingStatus === 'loading'" class="processing-indicator">
      <div class="processing-steps">
        <div 
          v-for="(step, index) in processingSteps" 
          :key="step.key"
          class="step"
          :class="{ 
            'active': currentStep === index,
            'completed': currentStep > index,
            'pending': currentStep < index
          }"
        >
          <div class="step-icon">
            <CheckCircleOutlined v-if="currentStep > index" />
            <LoadingOutlined v-else-if="currentStep === index" />
            <ClockCircleOutlined v-else />
          </div>
          <span class="step-label">{{ $t(step.label) }}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Empty State -->
  <div v-else class="file-preview-empty">
    <a-empty 
      :description="$t('filePreview.noFileSelected')"
      :image="Empty.PRESENTED_IMAGE_SIMPLE"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { 
  Button as AButton,
  Divider as ADivider,
  Progress as AProgress,
  Alert as AAlert,
  Spin as ASpin,
  Empty as AEmpty,
  Statistic as AStatistic,
  StatisticGroup as AStatisticGroup,
  Empty
} from 'ant-design-vue'
import {
  FileTextOutlined,
  FileWordOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  ClockCircleOutlined
} from '@ant-design/icons-vue'
import { useI18n } from 'vue-i18n'
import type { ProcessedFile } from '@/types'

// Props
interface FilePreviewProps {
  file?: ProcessedFile | null
  showActions?: boolean
  showPreview?: boolean
  processingProgress?: number
}

const props = withDefaults(defineProps<FilePreviewProps>(), {
  showActions: true,
  showPreview: true,
  processingProgress: 0
})

// Emits
const emit = defineEmits<{
  'use-file': [file: ProcessedFile]
  'remove-file': [fileId: string]
  'retry-processing': [file: ProcessedFile]
  'dismiss-error': [fileId: string]
}>()

const { t } = useI18n()

// Reactive state
const showFullContent = ref(false)
const currentStep = ref(0)

// Processing steps for visual feedback
const processingSteps = [
  { key: 'upload', label: 'filePreview.steps.upload' },
  { key: 'validate', label: 'filePreview.steps.validate' },
  { key: 'extract', label: 'filePreview.steps.extract' },
  { key: 'complete', label: 'filePreview.steps.complete' }
]

// Computed properties
const displayText = computed(() => {
  if (!props.file?.extractedText) return ''
  
  const text = props.file.extractedText
  const maxLength = showFullContent.value ? text.length : 300
  
  if (text.length <= maxLength) {
    return text
  }
  
  return text.substring(0, maxLength) + '...'
})

const wordCount = computed(() => {
  if (!props.file?.extractedText) return 0
  return props.file.extractedText.trim().split(/\s+/).filter(word => word.length > 0).length
})

// Watch for processing progress changes
watch(() => props.processingProgress, (newProgress) => {
  if (newProgress > 0 && newProgress <= 25) {
    currentStep.value = 0
  } else if (newProgress > 25 && newProgress <= 50) {
    currentStep.value = 1
  } else if (newProgress > 50 && newProgress <= 90) {
    currentStep.value = 2
  } else if (newProgress > 90) {
    currentStep.value = 3
  }
})

// Watch for file processing status changes
watch(() => props.file?.processingStatus, (newStatus) => {
  if (newStatus === 'success') {
    currentStep.value = 4 // All steps completed
  } else if (newStatus === 'error') {
    // Keep current step to show where it failed
  } else if (newStatus === 'loading') {
    currentStep.value = 0
  }
})

// Methods
function togglePreview() {
  showFullContent.value = !showFullContent.value
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Initialize component
onMounted(() => {
  if (props.file?.processingStatus === 'success') {
    currentStep.value = 4
  }
})
</script>

<style scoped>
.file-preview {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  overflow: hidden;
}

.file-preview-empty {
  padding: var(--spacing-xl);
  text-align: center;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-elevated);
}

/* File Header */
.file-header {
  display: flex;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--color-surface-elevated);
  border-bottom: 1px solid var(--color-border);
}

.file-icon {
  font-size: 24px;
  color: var(--color-primary);
  margin-right: var(--spacing-md);
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  display: flex;
  align-items: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.file-actions {
  display: flex;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

/* Processing Status */
.processing-status {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.status-loading {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.status-text {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.status-error .error-actions {
  margin-top: var(--spacing-sm);
}

/* Content Preview */
.content-preview {
  padding: var(--spacing-md);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.preview-header h5 {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
}

.preview-content {
  margin-bottom: var(--spacing-md);
}

.extracted-text {
  padding: var(--spacing-md);
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  line-height: 1.6;
  color: var(--color-text);
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 200px;
  overflow-y: auto;
  transition: max-height var(--duration-normal) var(--ease-in-out);
}

.extracted-text.expanded {
  max-height: 500px;
}

.no-content {
  padding: var(--spacing-lg);
  text-align: center;
}

/* Content Statistics */
.content-stats {
  padding: var(--spacing-md);
  background: var(--color-surface-elevated);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.content-stats :deep(.ant-statistic) {
  text-align: center;
}

.content-stats :deep(.ant-statistic-title) {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

/* Processing Indicator */
.processing-indicator {
  padding: var(--spacing-md);
  background: var(--color-surface-elevated);
  border-top: 1px solid var(--color-border);
}

.processing-steps {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.processing-steps::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-border);
  z-index: 1;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  background: var(--color-surface);
  padding: var(--spacing-xs);
  border-radius: var(--radius-sm);
  z-index: 2;
  min-width: 80px;
}

.step-icon {
  font-size: 16px;
  transition: color var(--duration-normal) var(--ease-in-out);
}

.step.completed .step-icon {
  color: var(--color-success);
}

.step.active .step-icon {
  color: var(--color-primary);
}

.step.pending .step-icon {
  color: var(--color-text-disabled);
}

.step-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  text-align: center;
  white-space: nowrap;
}

.step.active .step-label {
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
}

.step.completed .step-label {
  color: var(--color-success);
}

/* Responsive Design */
@media (max-width: 768px) {
  .file-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .file-actions {
    align-self: flex-end;
  }

  .preview-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .processing-steps {
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .processing-steps::before {
    display: none;
  }

  .step {
    flex-direction: row;
    justify-content: flex-start;
    width: 100%;
    min-width: auto;
  }

  .extracted-text {
    font-size: var(--font-size-xs);
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .extracted-text {
    background: var(--color-surface);
  }
}

/* Loading animations */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.status-loading .ant-spin {
  animation: pulse 1.5s ease-in-out infinite;
}

/* Accessibility improvements */
.file-preview:focus-within {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.step[aria-current="step"] {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .file-preview {
    border-width: 2px;
  }
  
  .extracted-text {
    border-width: 2px;
  }
  
  .processing-steps::before {
    height: 3px;
  }
}
</style>