<template>
  <div class="file-uploader">
    <a-upload-dragger
      v-model:fileList="fileList"
      :before-upload="beforeUpload"
      :custom-request="handleUpload"
      :accept="acceptString"
      :multiple="multiple"
      :disabled="disabled"
      class="upload-dragger"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
    >
      <p class="ant-upload-drag-icon">
        <FileOutlined style="font-size: 48px; color: var(--color-primary)" />
      </p>
      <p class="ant-upload-text">
        {{ $t('fileUpload.dragDropText') }}
      </p>
      <p class="ant-upload-hint">
        {{ $t('fileUpload.supportedFormats', { formats: acceptedTypes.join(', ') }) }}
      </p>
      <p class="ant-upload-hint">
        {{ $t('fileUpload.maxSize', { size: formatFileSize(maxSize) }) }}
      </p>
    </a-upload-dragger>

    <!-- Upload Progress -->
    <div v-if="uploadProgress > 0 && uploadProgress < 100" class="upload-progress">
      <a-progress :percent="uploadProgress" :status="uploadStatus" />
      <p class="progress-text">{{ $t('fileUpload.uploading') }}...</p>
    </div>

    <!-- Validation Errors -->
    <div v-if="validationErrors.length > 0" class="validation-errors">
      <a-alert
        v-for="error in validationErrors"
        :key="error.code"
        :message="error.message"
        type="error"
        show-icon
        closable
        @close="removeValidationError(error.code)"
      />
    </div>

    <!-- Validation Warnings -->
    <div v-if="validationWarnings.length > 0" class="validation-warnings">
      <a-alert
        v-for="warning in validationWarnings"
        :key="warning.code"
        :message="warning.message"
        type="warning"
        show-icon
        closable
        @close="removeValidationWarning(warning.code)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  UploadDragger as AUploadDragger, 
  Progress as AProgress,
  Alert as AAlert,
  message 
} from 'ant-design-vue'
import { FileOutlined } from '@ant-design/icons-vue'
import { useI18n } from 'vue-i18n'
import { useFileProcessorService } from '@/services/fileProcessorService'
import type { 
  UploadFile, 
  UploadRequestOption 
} from 'ant-design-vue/es/upload/interface'
import type { 
  FileUploaderProps, 
  FileUploadEvent, 
  ValidationError, 
  ValidationWarning 
} from '@/types'

// Props with defaults
const props = withDefaults(defineProps<FileUploaderProps>(), {
  acceptedTypes: () => ['.docx', '.pdf', '.jpg', '.jpeg', '.png', '.txt'],
  maxSize: 10 * 1024 * 1024, // 10MB
  multiple: false,
  disabled: false
})

// Emits
const emit = defineEmits<{
  'file-uploaded': [event: FileUploadEvent]
  'file-processed': [event: FileUploadEvent]
  'processing-error': [event: FileUploadEvent]
  'upload-progress': [event: FileUploadEvent]
}>()

const { t } = useI18n()
const fileProcessorService = useFileProcessorService()

// Reactive state
const fileList = ref<UploadFile[]>([])
const uploadProgress = ref(0)
const uploadStatus = ref<'normal' | 'active' | 'success' | 'exception'>('normal')
const validationErrors = ref<ValidationError[]>([])
const validationWarnings = ref<ValidationWarning[]>([])

// Computed properties
const acceptedTypes = computed(() => props.acceptedTypes)
const maxSize = computed(() => props.maxSize)

const acceptString = computed(() => {
  return acceptedTypes.value.join(',')
})

// Watch for prop changes to clear validation messages
watch(() => props.disabled, (newVal) => {
  if (newVal) {
    clearValidationMessages()
  }
})

// File validation
function beforeUpload(file: File): boolean {
  clearValidationMessages()
  
  const validation = fileProcessorService.validateFile(file)
  
  if (!validation.isValid) {
    validationErrors.value = validation.errors
    validationWarnings.value = validation.warnings
    return false
  }
  
  // Show warnings but allow upload
  if (validation.warnings.length > 0) {
    validationWarnings.value = validation.warnings
  }
  
  return true
}

// Handle file upload
async function handleUpload(options: UploadRequestOption) {
  const { file, onProgress, onSuccess, onError } = options
  const uploadFile = file as File

  try {
    // Emit upload started event
    emit('file-uploaded', {
      type: 'file-uploaded',
      file: uploadFile,
      timestamp: new Date()
    })

    // Simulate upload progress
    uploadProgress.value = 0
    uploadStatus.value = 'active'
    
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += Math.random() * 20
        onProgress?.({ percent: uploadProgress.value })
        
        emit('upload-progress', {
          type: 'upload-progress',
          file: uploadFile,
          progress: uploadProgress.value,
          timestamp: new Date()
        })
      }
    }, 200)

    // Process the file
    const processedFile = await fileProcessorService.processFile(uploadFile)
    
    // Complete progress
    clearInterval(progressInterval)
    uploadProgress.value = 100
    uploadStatus.value = 'success'
    
    onProgress?.({ percent: 100 })
    onSuccess?.(processedFile)

    // Emit processing complete event
    emit('file-processed', {
      type: 'file-processed',
      file: processedFile,
      timestamp: new Date()
    })

    message.success(t('fileUpload.uploadSuccess'))
    
    // Reset progress after a delay
    setTimeout(() => {
      uploadProgress.value = 0
      uploadStatus.value = 'normal'
    }, 2000)

  } catch (error) {
    uploadStatus.value = 'exception'
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    onError?.(new Error(errorMessage))
    
    emit('processing-error', {
      type: 'processing-error',
      file: uploadFile,
      error: errorMessage,
      timestamp: new Date()
    })

    message.error(t('fileUpload.uploadError', { error: errorMessage }))
    
    // Reset progress after a delay
    setTimeout(() => {
      uploadProgress.value = 0
      uploadStatus.value = 'normal'
    }, 3000)
  }
}

// Drag and drop handlers
function handleDrop(e: DragEvent) {
  e.preventDefault()
  // Additional drop handling if needed
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  // Visual feedback for drag over
}

function handleDragLeave(e: DragEvent) {
  e.preventDefault()
  // Reset visual feedback
}

// Validation message management
function removeValidationError(code: string) {
  validationErrors.value = validationErrors.value.filter(error => error.code !== code)
}

function removeValidationWarning(code: string) {
  validationWarnings.value = validationWarnings.value.filter(warning => warning.code !== code)
}

function clearValidationMessages() {
  validationErrors.value = []
  validationWarnings.value = []
}

// Utility functions
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style scoped>
.file-uploader {
  width: 100%;
}

.upload-dragger {
  background: var(--color-surface-elevated);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  transition: all var(--duration-normal) var(--ease-in-out);
}

.upload-dragger:hover {
  border-color: var(--color-primary);
  background: var(--color-surface);
}

.upload-dragger.ant-upload-drag-hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.ant-upload-text {
  color: var(--color-text);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  margin: var(--spacing-md) 0;
}

.ant-upload-hint {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin: var(--spacing-xs) 0;
}

.upload-progress {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--color-surface);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.progress-text {
  text-align: center;
  margin-top: var(--spacing-sm);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.validation-errors,
.validation-warnings {
  margin-top: var(--spacing-md);
}

.validation-errors .ant-alert,
.validation-warnings .ant-alert {
  margin-bottom: var(--spacing-sm);
}

.validation-errors .ant-alert:last-child,
.validation-warnings .ant-alert:last-child {
  margin-bottom: 0;
}

/* Disabled state */
.file-uploader :deep(.ant-upload-disabled) {
  opacity: 0.6;
  cursor: not-allowed;
}

.file-uploader :deep(.ant-upload-disabled .upload-dragger) {
  background: var(--color-surface-disabled);
  border-color: var(--color-border-disabled);
}

.file-uploader :deep(.ant-upload-disabled .ant-upload-text),
.file-uploader :deep(.ant-upload-disabled .ant-upload-hint) {
  color: var(--color-text-disabled);
}

/* Responsive design */
@media (max-width: 768px) {
  .upload-dragger {
    padding: var(--spacing-lg);
  }
  
  .ant-upload-drag-icon {
    font-size: 36px !important;
  }
  
  .ant-upload-text {
    font-size: var(--font-size-md);
  }
  
  .ant-upload-hint {
    font-size: var(--font-size-xs);
  }
}
</style>
