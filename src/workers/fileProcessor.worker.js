/**
 * Web Worker for File Processing
 * Processes PDF, DOCX, and Image files in a separate thread to avoid blocking UI
 */

// Worker will load libraries dynamically when needed
let pdfjsLib = null;
let mammoth = null;
let Tesseract = null;

/**
 * Handle messages from main thread
 */
self.addEventListener('message', async (e) => {
  const { type, data, id } = e.data;

  try {
    let result;

    switch (type) {
      case 'PROCESS_PDF':
        result = await processPDF(data);
        break;

      case 'PROCESS_DOCX':
        result = await processDOCX(data);
        break;

      case 'PROCESS_IMAGE':
        result = await processImage(data);
        break;

      case 'LOAD_LIBRARY':
        await loadLibrary(data.library);
        result = { loaded: true };
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    self.postMessage({
      id,
      success: true,
      result,
      type
    });

  } catch (error) {
    self.postMessage({
      id,
      success: false,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      type
    });
  }
});

/**
 * Load external library
 */
async function loadLibrary(libraryName) {
  switch (libraryName) {
    case 'pdfjs':
      if (!pdfjsLib) {
        importScripts('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
        pdfjsLib = self.pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }
      break;

    case 'mammoth':
      if (!mammoth) {
        importScripts('https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js');
        mammoth = self.mammoth;
      }
      break;

    case 'tesseract':
      if (!Tesseract) {
        importScripts('https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js');
        Tesseract = self.Tesseract;
      }
      break;

    default:
      throw new Error(`Unknown library: ${libraryName}`);
  }
}

/**
 * Process PDF file
 * @param {Object} data - Contains arrayBuffer of PDF file
 * @returns {Promise<Object>} - Extracted text and metadata
 */
async function processPDF(data) {
  const { arrayBuffer, options = {} } = data;
  const { maxPages = 100 } = options;

  // Load PDF.js if not already loaded
  await loadLibrary('pdfjs');

  // Load PDF document
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const numPages = Math.min(pdf.numPages, maxPages);
  const pages = [];
  let totalText = '';

  // Process each page
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    // Report progress
    self.postMessage({
      type: 'PROGRESS',
      progress: {
        current: pageNum,
        total: numPages,
        percentage: Math.round((pageNum / numPages) * 100)
      }
    });

    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Extract text from page
    const pageText = textContent.items
      .map(item => item.str)
      .join(' ');

    pages.push({
      pageNumber: pageNum,
      text: pageText,
      length: pageText.length
    });

    totalText += pageText + '\n\n';
  }

  return {
    text: totalText.trim(),
    pages,
    metadata: {
      numPages: pdf.numPages,
      pagesProcessed: numPages,
      totalLength: totalText.length
    }
  };
}

/**
 * Process DOCX file
 * @param {Object} data - Contains arrayBuffer of DOCX file
 * @returns {Promise<Object>} - Extracted text and metadata
 */
async function processDOCX(data) {
  const { arrayBuffer, options = {} } = data;

  // Load Mammoth.js if not already loaded
  await loadLibrary('mammoth');

  // Report progress
  self.postMessage({
    type: 'PROGRESS',
    progress: {
      current: 50,
      total: 100,
      percentage: 50
    }
  });

  // Extract text from DOCX
  const result = await mammoth.extractRawText({ arrayBuffer });

  // Report completion
  self.postMessage({
    type: 'PROGRESS',
    progress: {
      current: 100,
      total: 100,
      percentage: 100
    }
  });

  return {
    text: result.value.trim(),
    metadata: {
      length: result.value.length,
      messages: result.messages
    }
  };
}

/**
 * Process image file with OCR
 * @param {Object} data - Contains image data
 * @returns {Promise<Object>} - Extracted text
 */
async function processImage(data) {
  const { imageData, language = 'eng', options = {} } = data;

  // Load Tesseract.js if not already loaded
  await loadLibrary('tesseract');

  // Create worker
  const worker = await Tesseract.createWorker(language, 1, {
    logger: (m) => {
      // Report progress
      if (m.status === 'recognizing text') {
        self.postMessage({
          type: 'PROGRESS',
          progress: {
            current: Math.round(m.progress * 100),
            total: 100,
            percentage: Math.round(m.progress * 100)
          }
        });
      }
    }
  });

  try {
    // Perform OCR
    const result = await worker.recognize(imageData);

    return {
      text: result.data.text.trim(),
      metadata: {
        confidence: result.data.confidence,
        language: language,
        length: result.data.text.length
      }
    };
  } finally {
    // Cleanup
    await worker.terminate();
  }
}

/**
 * Chunk large text for processing
 * @param {string} text - Text to chunk
 * @param {number} chunkSize - Size of each chunk
 * @returns {Array<string>} - Array of text chunks
 */
function chunkText(text, chunkSize = 5000) {
  const chunks = [];
  
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.substring(i, i + chunkSize));
  }

  return chunks;
}

// Log that worker is ready
console.log('File Processor Worker initialized');

