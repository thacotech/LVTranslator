/**
 * File Processor Service
 * Manages file processing using Web Workers
 */

import InputSanitizer from '../utils/sanitizer.js';

class FileProcessorService {
  constructor() {
    this.worker = null;
    this.messageId = 0;
    this.pendingMessages = new Map();
    this.progressCallbacks = new Map();
  }

  /**
   * Initialize Web Worker
   */
  initWorker() {
    if (this.worker) {
      return;
    }

    try {
      this.worker = new Worker(new URL('../workers/fileProcessor.worker.js', import.meta.url));
      
      this.worker.addEventListener('message', (e) => {
        this.handleWorkerMessage(e.data);
      });

      this.worker.addEventListener('error', (error) => {
        console.error('Worker error:', error);
      });

      console.log('✓ File Processor Worker initialized');
    } catch (error) {
      console.error('Failed to initialize worker:', error);
      throw new Error('Web Workers not supported or failed to initialize');
    }
  }

  /**
   * Handle messages from worker
   */
  handleWorkerMessage(data) {
    const { id, type, success, result, error, progress } = data;

    // Handle progress updates
    if (type === 'PROGRESS' && progress) {
      const callback = this.progressCallbacks.get(id);
      if (callback) {
        callback(progress);
      }
      return;
    }

    // Handle regular responses
    const pending = this.pendingMessages.get(id);
    if (!pending) {
      return;
    }

    this.pendingMessages.delete(id);
    this.progressCallbacks.delete(id);

    if (success) {
      pending.resolve(result);
    } else {
      pending.reject(new Error(error.message));
    }
  }

  /**
   * Send message to worker
   */
  sendMessage(type, data, onProgress = null) {
    if (!this.worker) {
      this.initWorker();
    }

    const id = ++this.messageId;

    if (onProgress) {
      this.progressCallbacks.set(id, onProgress);
    }

    return new Promise((resolve, reject) => {
      this.pendingMessages.set(id, { resolve, reject });

      this.worker.postMessage({
        id,
        type,
        data
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        if (this.pendingMessages.has(id)) {
          this.pendingMessages.delete(id);
          this.progressCallbacks.delete(id);
          reject(new Error('Worker timeout'));
        }
      }, 5 * 60 * 1000);
    });
  }

  /**
   * Process PDF file
   * @param {File} file - PDF file to process
   * @param {Object} options - Processing options
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} - Extracted text and metadata
   */
  async processPDF(file, options = {}, onProgress = null) {
    // Validate file
    const validation = InputSanitizer.validateFile(file, {
      allowedTypes: ['application/pdf'],
      allowedExtensions: ['.pdf']
    });

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Read file as ArrayBuffer
    const arrayBuffer = await this.readFileAsArrayBuffer(file);

    // Process in worker
    const result = await this.sendMessage(
      'PROCESS_PDF',
      { arrayBuffer, options },
      onProgress
    );

    return result;
  }

  /**
   * Process DOCX file
   * @param {File} file - DOCX file to process
   * @param {Object} options - Processing options
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} - Extracted text and metadata
   */
  async processDOCX(file, options = {}, onProgress = null) {
    // Validate file
    const validation = InputSanitizer.validateFile(file, {
      allowedTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      allowedExtensions: ['.docx']
    });

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Read file as ArrayBuffer
    const arrayBuffer = await this.readFileAsArrayBuffer(file);

    // Process in worker
    const result = await this.sendMessage(
      'PROCESS_DOCX',
      { arrayBuffer, options },
      onProgress
    );

    return result;
  }

  /**
   * Process image file with OCR
   * @param {File} file - Image file to process
   * @param {Object} options - Processing options
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} - Extracted text
   */
  async processImage(file, options = {}, onProgress = null) {
    const { language = 'eng' } = options;

    // Validate file
    const validation = InputSanitizer.validateFile(file, {
      allowedTypes: ['image/png', 'image/jpeg', 'image/jpg'],
      allowedExtensions: ['.png', '.jpg', '.jpeg']
    });

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Read file as data URL
    const imageData = await this.readFileAsDataURL(file);

    // Process in worker
    const result = await this.sendMessage(
      'PROCESS_IMAGE',
      { imageData, language, options },
      onProgress
    );

    return result;
  }

  /**
   * Process any supported file type
   * @param {File} file - File to process
   * @param {Object} options - Processing options
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} - Extracted text
   */
  async processFile(file, options = {}, onProgress = null) {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return this.processPDF(file, options, onProgress);
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
      return this.processDOCX(file, options, onProgress);
    } else if (fileType.startsWith('image/')) {
      return this.processImage(file, options, onProgress);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  /**
   * Read file as ArrayBuffer
   */
  readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Read file as Data URL
   */
  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Terminate worker
   */
  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.pendingMessages.clear();
      this.progressCallbacks.clear();
      console.log('✓ File Processor Worker terminated');
    }
  }

  /**
   * Check if worker is initialized
   */
  isInitialized() {
    return this.worker !== null;
  }
}

// Create singleton instance
const fileProcessorService = new FileProcessorService();

// Export singleton
export default fileProcessorService;

// Also export class for custom instances
export { FileProcessorService };

// Make available globally for backward compatibility
if (typeof window !== 'undefined') {
  window.FileProcessorService = fileProcessorService;
}

