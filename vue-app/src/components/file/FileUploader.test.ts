import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import FileUploader from './FileUploader.vue'
import type { UploadRequestOption } from 'ant-design-vue/es/upload/interface'

// Mock file processor service
const mockFileProcessorService = {
  processFile: vi.fn().mockResolvedValue({
    id: 'test-file-id',
    name: 'test.txt',
    type: 'txt',
    size: 1024,
    content: 'Test file content',
    extractedText: 'Test file content',
    processingStatus: 'success',
    metadata: {
      processingTime: 50
    }
  }),
  validateFile: vi.fn().mockReturnValue({
    isValid: true,
    errors: [],
    warnings: []
  })
}

vi.mock('@/services/fileProcessorService', () => ({
  useFileProcessorService: () => mockFileProcessorService
}))

// Mock Ant Design message
vi.mock('ant-design-vue', async () => {
  const actual = await vi.importActual('ant-design-vue')
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn()
    }
  }
})

function createTestWrapper(props = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)

  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    messages: {
      en: {
        fileUpload: {
          dragDropText: 'Click or drag file to this area to upload',
          supportedFormats: 'Supported formats: {formats}',
          maxSize: 'Maximum size: {size}',
          uploading: 'Uploading',
          uploadSuccess: 'File uploaded successfully',
          uploadError: 'Upload failed: {error}'
        }
      }
    }
  })

  const defaultProps = {
    acceptedTypes: ['.docx', '.pdf', '.jpg', '.jpeg', '.png', '.txt'],
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    disabled: false,
    ...props
  }

  return mount(FileUploader, {
    props: defaultProps,
    global: {
      plugins: [pinia, i18n],
      stubs: {
        'a-upload-dragger': {
          template: '<div class="upload-dragger" @drop="$emit(\'drop\', $event)" @dragover="$emit(\'dragover\', $event)" @dragleave="$emit(\'dragleave\', $event)"><slot /></div>',
          emits: ['drop', 'dragover', 'dragleave']
        },
        'a-progress': {
          template: '<div class="progress" :data-percent="percent" :data-status="status"></div>',
          props: ['percent', 'status']
        },
        'a-alert': {
          template: '<div class="alert" :data-type="type" @close="$emit(\'close\')"><slot /></div>',
          props: ['message', 'type', 'showIcon', 'closable'],
          emits: ['close']
        },
        'FileOutlined': {
          template: '<span class="file-icon"></span>'
        }
      }
    }
  })
}

describe('FileUploader Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render correctly with default props', () => {
      const wrapper = createTestWrapper()
      
      expect(wrapper.find('.file-uploader').exists()).toBe(true)
      expect(wrapper.find('.upload-dragger').exists()).toBe(true)
      expect(wrapper.find('.file-icon').exists()).toBe(true)
    })

    it('should display correct upload text and hints', () => {
      const wrapper = createTestWrapper()
      
      expect(wrapper.text()).toContain('Click or drag file to this area to upload')
      expect(wrapper.text()).toContain('Supported formats:')
      expect(wrapper.text()).toContain('Maximum size:')
    })

    it('should handle custom props correctly', () => {
      const customProps = {
        acceptedTypes: ['.txt', '.pdf'],
        maxSize: 5 * 1024 * 1024, // 5MB
        multiple: true,
        disabled: true
      }
      
      const wrapper = createTestWrapper(customProps)
      
      expect(wrapper.vm.acceptedTypes).toEqual(['.txt', '.pdf'])
      expect(wrapper.vm.maxSize).toBe(5 * 1024 * 1024)
      expect(wrapper.props('multiple')).toBe(true)
      expect(wrapper.props('disabled')).toBe(true)
    })
  })

  describe('File Validation', () => {
    it('should validate file successfully', () => {
      const wrapper = createTestWrapper()
      
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' })
      const result = wrapper.vm.beforeUpload(mockFile)
      
      expect(mockFileProcessorService.validateFile).toHaveBeenCalledWith(mockFile)
      expect(result).toBe(true)
      expect(wrapper.vm.validationErrors).toHaveLength(0)
    })

    it('should reject invalid files', () => {
      const wrapper = createTestWrapper()
      
      // Mock validation to return errors
      mockFileProcessorService.validateFile.mockReturnValueOnce({
        isValid: false,
        errors: [{ field: 'file', message: 'Invalid file type', code: 'INVALID_TYPE', severity: 'error' }],
        warnings: []
      })
      
      const mockFile = new File(['content'], 'test.xyz', { type: 'application/unknown' })
      const result = wrapper.vm.beforeUpload(mockFile)
      
      expect(result).toBe(false)
      expect(wrapper.vm.validationErrors).toHaveLength(1)
      expect(wrapper.vm.validationErrors[0].message).toBe('Invalid file type')
    })

    it('should show warnings but allow upload', () => {
      const wrapper = createTestWrapper()
      
      // Mock validation to return warnings
      mockFileProcessorService.validateFile.mockReturnValueOnce({
        isValid: true,
        errors: [],
        warnings: [{ field: 'file', message: 'Large file warning', code: 'LARGE_FILE' }]
      })
      
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' })
      const result = wrapper.vm.beforeUpload(mockFile)
      
      expect(result).toBe(true)
      expect(wrapper.vm.validationWarnings).toHaveLength(1)
      expect(wrapper.vm.validationWarnings[0].message).toBe('Large file warning')
    })

    it('should clear validation messages when disabled', async () => {
      const wrapper = createTestWrapper()
      
      // Add some validation errors
      wrapper.vm.validationErrors = [{ field: 'file', message: 'Error', code: 'ERROR', severity: 'error' }]
      
      // Set disabled prop
      await wrapper.setProps({ disabled: true })
      
      expect(wrapper.vm.validationErrors).toHaveLength(0)
    })
  })

  describe('File Upload Process', () => {
    it('should handle successful file upload', async () => {
      const wrapper = createTestWrapper()
      
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' })
      const mockOptions: UploadRequestOption = {
        file: mockFile,
        onProgress: vi.fn(),
        onSuccess: vi.fn(),
        onError: vi.fn(),
        filename: 'test.txt',
        action: '',
        data: {},
        headers: {},
        withCredentials: false
      }
      
      await wrapper.vm.handleUpload(mockOptions)
      
      expect(mockFileProcessorService.processFile).toHaveBeenCalledWith(mockFile)
      expect(mockOptions.onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-file-id',
          name: 'test.txt',
          extractedText: 'Test file content'
        })
      )
      expect(message.success).toHaveBeenCalledWith('File uploaded successfully')
    })

    it('should emit correct events during upload', async () => {
      const wrapper = createTestWrapper()
      
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' })
      const mockOptions: UploadRequestOption = {
        file: mockFile,
        onProgress: vi.fn(),
        onSuccess: vi.fn(),
        onError: vi.fn(),
        filename: 'test.txt',
        action: '',
        data: {},
        headers: {},
        withCredentials: false
      }
      
      await wrapper.vm.handleUpload(mockOptions)
      
      const emittedEvents = wrapper.emitted()
      expect(emittedEvents['file-uploaded']).toBeDefined()
      expect(emittedEvents['file-processed']).toBeDefined()
      expect(emittedEvents['upload-progress']).toBeDefined()
    })

    it('should handle upload errors', async () => {
      const wrapper = createTestWrapper()
      
      // Mock file processor to throw error
      mockFileProcessorService.processFile.mockRejectedValueOnce(new Error('Processing failed'))
      
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' })
      const mockOptions: UploadRequestOption = {
        file: mockFile,
        onProgress: vi.fn(),
        onSuccess: vi.fn(),
        onError: vi.fn(),
        filename: 'test.txt',
        action: '',
        data: {},
        headers: {},
        withCredentials: false
      }
      
      await wrapper.vm.handleUpload(mockOptions)
      
      expect(mockOptions.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Processing failed'
        })
      )
      expect(message.error).toHaveBeenCalledWith('Upload failed: Processing failed')
      
      const emittedEvents = wrapper.emitted()
      expect(emittedEvents['processing-error']).toBeDefined()
    })

    it('should show upload progress', async () => {
      const wrapper = createTestWrapper()
      
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' })
      const mockOptions: UploadRequestOption = {
        file: mockFile,
        onProgress: vi.fn(),
        onSuccess: vi.fn(),
        onError: vi.fn(),
        filename: 'test.txt',
        action: '',
        data: {},
        headers: {},
        withCredentials: false
      }
      
      // Start upload (don't await to check progress)
      const uploadPromise = wrapper.vm.handleUpload(mockOptions)
      
      // Check that progress is shown
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.uploadProgress).toBeGreaterThan(0)
      expect(wrapper.vm.uploadStatus).toBe('active')
      
      // Wait for completion
      await uploadPromise
      
      expect(wrapper.vm.uploadProgress).toBe(100)
      expect(wrapper.vm.uploadStatus).toBe('success')
    })
  })

  describe('Drag and Drop Functionality', () => {
    it('should handle drag events', () => {
      const wrapper = createTestWrapper()
      
      const mockEvent = new DragEvent('drop')
      Object.defineProperty(mockEvent, 'preventDefault', {
        value: vi.fn(),
        writable: true
      })
      
      wrapper.vm.handleDrop(mockEvent)
      wrapper.vm.handleDragOver(mockEvent)
      wrapper.vm.handleDragLeave(mockEvent)
      
      expect(mockEvent.preventDefault).toHaveBeenCalledTimes(3)
    })
  })

  describe('Validation Message Management', () => {
    it('should remove validation errors', async () => {
      const wrapper = createTestWrapper()
      
      wrapper.vm.validationErrors = [
        { field: 'file', message: 'Error 1', code: 'ERROR1', severity: 'error' },
        { field: 'file', message: 'Error 2', code: 'ERROR2', severity: 'error' }
      ]
      
      wrapper.vm.removeValidationError('ERROR1')
      
      expect(wrapper.vm.validationErrors).toHaveLength(1)
      expect(wrapper.vm.validationErrors[0].code).toBe('ERROR2')
    })

    it('should remove validation warnings', async () => {
      const wrapper = createTestWrapper()
      
      wrapper.vm.validationWarnings = [
        { field: 'file', message: 'Warning 1', code: 'WARN1' },
        { field: 'file', message: 'Warning 2', code: 'WARN2' }
      ]
      
      wrapper.vm.removeValidationWarning('WARN1')
      
      expect(wrapper.vm.validationWarnings).toHaveLength(1)
      expect(wrapper.vm.validationWarnings[0].code).toBe('WARN2')
    })

    it('should clear all validation messages', () => {
      const wrapper = createTestWrapper()
      
      wrapper.vm.validationErrors = [{ field: 'file', message: 'Error', code: 'ERROR', severity: 'error' }]
      wrapper.vm.validationWarnings = [{ field: 'file', message: 'Warning', code: 'WARN' }]
      
      wrapper.vm.clearValidationMessages()
      
      expect(wrapper.vm.validationErrors).toHaveLength(0)
      expect(wrapper.vm.validationWarnings).toHaveLength(0)
    })
  })

  describe('Utility Functions', () => {
    it('should format file size correctly', () => {
      const wrapper = createTestWrapper()
      
      expect(wrapper.vm.formatFileSize(0)).toBe('0 Bytes')
      expect(wrapper.vm.formatFileSize(1024)).toBe('1 KB')
      expect(wrapper.vm.formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(wrapper.vm.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
      expect(wrapper.vm.formatFileSize(1536)).toBe('1.5 KB')
    })
  })

  describe('Component Props and Events', () => {
    it('should emit file-uploaded event with correct data', async () => {
      const wrapper = createTestWrapper()
      
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' })
      const mockOptions: UploadRequestOption = {
        file: mockFile,
        onProgress: vi.fn(),
        onSuccess: vi.fn(),
        onError: vi.fn(),
        filename: 'test.txt',
        action: '',
        data: {},
        headers: {},
        withCredentials: false
      }
      
      await wrapper.vm.handleUpload(mockOptions)
      
      const uploadedEvents = wrapper.emitted('file-uploaded')
      expect(uploadedEvents).toBeDefined()
      expect(uploadedEvents![0][0]).toMatchObject({
        type: 'file-uploaded',
        file: mockFile,
        timestamp: expect.any(Date)
      })
    })

    it('should emit file-processed event with correct data', async () => {
      const wrapper = createTestWrapper()
      
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' })
      const mockOptions: UploadRequestOption = {
        file: mockFile,
        onProgress: vi.fn(),
        onSuccess: vi.fn(),
        onError: vi.fn(),
        filename: 'test.txt',
        action: '',
        data: {},
        headers: {},
        withCredentials: false
      }
      
      await wrapper.vm.handleUpload(mockOptions)
      
      const processedEvents = wrapper.emitted('file-processed')
      expect(processedEvents).toBeDefined()
      expect(processedEvents![0][0]).toMatchObject({
        type: 'file-processed',
        file: expect.objectContaining({
          id: 'test-file-id',
          name: 'test.txt'
        }),
        timestamp: expect.any(Date)
      })
    })

    it('should emit processing-error event on failure', async () => {
      const wrapper = createTestWrapper()
      
      mockFileProcessorService.processFile.mockRejectedValueOnce(new Error('Processing failed'))
      
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' })
      const mockOptions: UploadRequestOption = {
        file: mockFile,
        onProgress: vi.fn(),
        onSuccess: vi.fn(),
        onError: vi.fn(),
        filename: 'test.txt',
        action: '',
        data: {},
        headers: {},
        withCredentials: false
      }
      
      await wrapper.vm.handleUpload(mockOptions)
      
      const errorEvents = wrapper.emitted('processing-error')
      expect(errorEvents).toBeDefined()
      expect(errorEvents![0][0]).toMatchObject({
        type: 'processing-error',
        file: mockFile,
        error: 'Processing failed',
        timestamp: expect.any(Date)
      })
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle unknown errors gracefully', async () => {
      const wrapper = createTestWrapper()
      
      // Mock file processor to throw non-Error object
      mockFileProcessorService.processFile.mockRejectedValueOnce('String error')
      
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' })
      const mockOptions: UploadRequestOption = {
        file: mockFile,
        onProgress: vi.fn(),
        onSuccess: vi.fn(),
        onError: vi.fn(),
        filename: 'test.txt',
        action: '',
        data: {},
        headers: {},
        withCredentials: false
      }
      
      await wrapper.vm.handleUpload(mockOptions)
      
      expect(mockOptions.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'String error'
        })
      )
    })

    it('should reset progress after successful upload', async () => {
      const wrapper = createTestWrapper()
      
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' })
      const mockOptions: UploadRequestOption = {
        file: mockFile,
        onProgress: vi.fn(),
        onSuccess: vi.fn(),
        onError: vi.fn(),
        filename: 'test.txt',
        action: '',
        data: {},
        headers: {},
        withCredentials: false
      }
      
      await wrapper.vm.handleUpload(mockOptions)
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 2100))
      
      expect(wrapper.vm.uploadProgress).toBe(0)
      expect(wrapper.vm.uploadStatus).toBe('normal')
    })

    it('should reset progress after failed upload', async () => {
      const wrapper = createTestWrapper()
      
      mockFileProcessorService.processFile.mockRejectedValueOnce(new Error('Processing failed'))
      
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' })
      const mockOptions: UploadRequestOption = {
        file: mockFile,
        onProgress: vi.fn(),
        onSuccess: vi.fn(),
        onError: vi.fn(),
        filename: 'test.txt',
        action: '',
        data: {},
        headers: {},
        withCredentials: false
      }
      
      await wrapper.vm.handleUpload(mockOptions)
      
      expect(wrapper.vm.uploadStatus).toBe('exception')
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 3100))
      
      expect(wrapper.vm.uploadProgress).toBe(0)
      expect(wrapper.vm.uploadStatus).toBe('normal')
    })
  })
})