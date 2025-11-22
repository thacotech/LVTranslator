/**
 * Advanced File Processor Service
 * Handles .txt, .srt, .csv file processing
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

class FileProcessorService {
  constructor() {
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.supportedTypes = {
      'text/plain': 'txt',
      'text/csv': 'csv',
      'application/x-subrip': 'srt',
      'text/srt': 'srt'
    };
  }

  /**
   * Validate file
   */
  validateFile(file) {
    const errors = [];

    // Check file exists
    if (!file) {
      errors.push('No file selected');
      return { valid: false, errors };
    }

    // Check file size
    if (file.size === 0) {
      errors.push('File is empty');
    }

    if (file.size > this.maxFileSize) {
      errors.push(`File size exceeds ${this.maxFileSize / (1024 * 1024)}MB limit`);
    }

    // Check file type
    const extension = file.name.split('.').pop().toLowerCase();
    const isSupported = ['txt', 'csv', 'srt'].includes(extension);
    
    if (!isSupported) {
      errors.push('Unsupported file type. Supported: .txt, .csv, .srt');
    }

    return {
      valid: errors.length === 0,
      errors,
      fileType: extension
    };
  }

  /**
   * Process file based on type
   */
  async processFile(file, onProgress = null) {
    const validation = this.validateFile(file);
    
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    const extension = file.name.split('.').pop().toLowerCase();

    try {
      if (onProgress) onProgress(10, 'Reading file...');

      switch (extension) {
        case 'txt':
          return await this.processTXT(file, onProgress);
        case 'csv':
          return await this.processCSV(file, onProgress);
        case 'srt':
          return await this.processSRT(file, onProgress);
        default:
          throw new Error('Unsupported file type');
      }
    } catch (error) {
      console.error('[FileProcessor] Error:', error);
      throw error;
    }
  }

  /**
   * Process TXT file
   */
  async processTXT(file, onProgress) {
    if (onProgress) onProgress(30, 'Processing TXT...');

    const text = await file.text();
    
    if (onProgress) onProgress(100, 'Complete');

    return {
      type: 'txt',
      content: text,
      lines: text.split('\n'),
      paragraphs: text.split('\n\n').filter(p => p.trim()),
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        lineCount: text.split('\n').length,
        charCount: text.length
      }
    };
  }

  /**
   * Process CSV file
   */
  async processCSV(file, onProgress) {
    if (onProgress) onProgress(30, 'Processing CSV...');

    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }

    if (onProgress) onProgress(60, 'Parsing CSV...');

    // Parse CSV
    const rows = lines.map(line => this.parseCSVLine(line));
    const headers = rows[0];
    const data = rows.slice(1);

    if (onProgress) onProgress(100, 'Complete');

    return {
      type: 'csv',
      headers,
      data,
      rows: data.map((row, index) => {
        const obj = { _index: index };
        headers.forEach((header, i) => {
          obj[header] = row[i] || '';
        });
        return obj;
      }),
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        rowCount: data.length,
        columnCount: headers.length
      }
    };
  }

  /**
   * Process SRT (subtitle) file
   */
  async processSRT(file, onProgress) {
    if (onProgress) onProgress(30, 'Processing SRT...');

    const text = await file.text();
    
    if (onProgress) onProgress(60, 'Parsing subtitles...');

    // Parse SRT format
    const subtitles = this.parseSRT(text);

    if (onProgress) onProgress(100, 'Complete');

    return {
      type: 'srt',
      subtitles,
      content: text,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        subtitleCount: subtitles.length,
        duration: this.calculateSRTDuration(subtitles)
      }
    };
  }

  /**
   * Parse CSV line (handles quoted fields)
   */
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * Parse SRT subtitle format
   */
  parseSRT(text) {
    const subtitles = [];
    const blocks = text.split('\n\n').filter(block => block.trim());

    blocks.forEach(block => {
      const lines = block.split('\n');
      
      if (lines.length >= 3) {
        const index = parseInt(lines[0].trim());
        const timecode = lines[1].trim();
        const textContent = lines.slice(2).join('\n').trim();

        // Parse timecode: 00:00:20,000 --> 00:00:24,400
        const [start, end] = timecode.split(' --> ').map(t => t.trim());

        subtitles.push({
          index,
          start,
          end,
          text: textContent,
          duration: this.calculateDuration(start, end)
        });
      }
    });

    return subtitles;
  }

  /**
   * Calculate duration between two SRT timecodes
   */
  calculateDuration(start, end) {
    const startMs = this.timecodeToMs(start);
    const endMs = this.timecodeToMs(end);
    return endMs - startMs;
  }

  /**
   * Convert SRT timecode to milliseconds
   */
  timecodeToMs(timecode) {
    // Format: 00:00:20,000
    const parts = timecode.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const [seconds, milliseconds] = parts[2].split(',').map(n => parseInt(n));

    return (hours * 3600 + minutes * 60 + seconds) * 1000 + milliseconds;
  }

  /**
   * Calculate total SRT duration
   */
  calculateSRTDuration(subtitles) {
    if (subtitles.length === 0) return 0;
    
    const lastSubtitle = subtitles[subtitles.length - 1];
    return this.timecodeToMs(lastSubtitle.end);
  }

  /**
   * Export processed data back to file
   */
  exportToFile(processedData, translatedContent) {
    const { type, metadata } = processedData;
    let content = '';
    let mimeType = 'text/plain';
    let extension = 'txt';

    switch (type) {
      case 'txt':
        content = translatedContent;
        mimeType = 'text/plain';
        extension = 'txt';
        break;

      case 'csv':
        content = this.exportCSV(processedData, translatedContent);
        mimeType = 'text/csv';
        extension = 'csv';
        break;

      case 'srt':
        content = this.exportSRT(processedData, translatedContent);
        mimeType = 'application/x-subrip';
        extension = 'srt';
        break;
    }

    // Create blob and download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translated-${Date.now()}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Export CSV with translations
   */
  exportCSV(processedData, translations) {
    const { headers, data } = processedData;
    const rows = [headers];

    data.forEach((row, index) => {
      const translatedRow = row.map((cell, cellIndex) => {
        // If translation exists for this cell, use it
        const translation = translations[`${index}_${cellIndex}`];
        return translation || cell;
      });
      rows.push(translatedRow);
    });

    return rows.map(row => 
      row.map(cell => this.escapeCSV(cell)).join(',')
    ).join('\n');
  }

  /**
   * Export SRT with translations
   */
  exportSRT(processedData, translations) {
    const { subtitles } = processedData;
    
    return subtitles.map((sub, index) => {
      const translatedText = translations[index] || sub.text;
      return `${sub.index}\n${sub.start} --> ${sub.end}\n${translatedText}\n`;
    }).join('\n');
  }

  /**
   * Escape CSV field
   */
  escapeCSV(field) {
    if (!field) return '';
    const fieldStr = String(field);
    if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
      return `"${fieldStr.replace(/"/g, '""')}"`;
    }
    return fieldStr;
  }

  /**
   * Validate text content for unsupported characters
   */
  validateContent(text) {
    const warnings = [];

    // Check for control characters
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(text)) {
      warnings.push('File contains control characters that may cause issues');
    }

    // Check encoding
    try {
      new TextEncoder().encode(text);
    } catch (error) {
      warnings.push('File may have encoding issues');
    }

    return warnings;
  }

  /**
   * Get file preview
   */
  async getFilePreview(file, maxLines = 10) {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      return { error: validation.errors.join(', ') };
    }

    try {
      const text = await file.text();
      const lines = text.split('\n').slice(0, maxLines);
      const hasMore = text.split('\n').length > maxLines;

      return {
        lines,
        hasMore,
        totalLines: text.split('\n').length,
        fileSize: file.size,
        fileType: validation.fileType
      };
    } catch (error) {
      return { error: error.message };
    }
  }
}

export default FileProcessorService;
