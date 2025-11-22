/**
 * FileProcessorService Unit Tests
 */

import FileProcessorService from '../FileProcessorService';

// Mock File API
class MockFile {
  constructor(content, name, options = {}) {
    this.content = content;
    this.name = name;
    this.size = content.length;
    this.type = options.type || 'text/plain';
  }
  
  text() {
    return Promise.resolve(this.content);
  }
}

global.File = MockFile;

describe('FileProcessorService', () => {
  let service;

  beforeEach(() => {
    service = new FileProcessorService();
  });

  describe('File Validation', () => {
    test('should validate TXT file', () => {
      const file = new MockFile('Hello', 'test.txt', { type: 'text/plain' });
      const result = service.validateFile(file);
      
      expect(result.valid).toBe(true);
      expect(result.fileType).toBe('txt');
    });

    test('should validate CSV file', () => {
      const file = new MockFile('a,b,c', 'test.csv', { type: 'text/csv' });
      const result = service.validateFile(file);
      
      expect(result.valid).toBe(true);
      expect(result.fileType).toBe('csv');
    });

    test('should validate SRT file', () => {
      const file = new MockFile('subtitle', 'test.srt', { type: 'application/x-subrip' });
      const result = service.validateFile(file);
      
      expect(result.valid).toBe(true);
      expect(result.fileType).toBe('srt');
    });

    test('should reject unsupported file type', () => {
      const file = new MockFile('data', 'test.xyz', { type: 'application/xyz' });
      const result = service.validateFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should reject empty file', () => {
      const file = new MockFile('', 'test.txt', { type: 'text/plain' });
      const result = service.validateFile(file);
      
      expect(result.valid).toBe(false);
    });

    test('should reject oversized file', () => {
      const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
      const file = new MockFile(largeContent, 'test.txt');
      const result = service.validateFile(file);
      
      expect(result.valid).toBe(false);
    });
  });

  describe('TXT Processing', () => {
    test('should process simple text file', async () => {
      const content = 'Line 1\nLine 2\nLine 3';
      const file = new MockFile(content, 'test.txt');
      
      const result = await service.processFile(file);
      
      expect(result.type).toBe('txt');
      expect(result.content).toBe(content);
      expect(result.lines.length).toBe(3);
    });

    test('should handle paragraphs', async () => {
      const content = 'Para 1\n\nPara 2\n\nPara 3';
      const file = new MockFile(content, 'test.txt');
      
      const result = await service.processFile(file);
      
      expect(result.paragraphs.length).toBe(3);
    });

    test('should preserve line breaks', async () => {
      const content = 'Line 1\nLine 2';
      const file = new MockFile(content, 'test.txt');
      
      const result = await service.processFile(file);
      
      expect(result.content).toContain('\n');
    });
  });

  describe('CSV Processing', () => {
    test('should process simple CSV', async () => {
      const content = 'Name,Age,City\nJohn,30,NYC\nJane,25,LA';
      const file = new MockFile(content, 'test.csv');
      
      const result = await service.processFile(file);
      
      expect(result.type).toBe('csv');
      expect(result.headers).toEqual(['Name', 'Age', 'City']);
      expect(result.data.length).toBe(2);
    });

    test('should handle quoted fields', async () => {
      const content = '"Name","Description"\n"Item 1","Has, comma"\n"Item 2","Has ""quotes"""';
      const file = new MockFile(content, 'test.csv');
      
      const result = await service.processFile(file);
      
      expect(result.data[0][1]).toBe('Has, comma');
      expect(result.data[1][1]).toBe('Has "quotes"');
    });

    test('should create row objects', async () => {
      const content = 'Name,Age\nJohn,30';
      const file = new MockFile(content, 'test.csv');
      
      const result = await service.processFile(file);
      
      expect(result.rows[0].Name).toBe('John');
      expect(result.rows[0].Age).toBe('30');
    });
  });

  describe('SRT Processing', () => {
    test('should process SRT subtitles', async () => {
      const content = `1
00:00:20,000 --> 00:00:24,400
First subtitle

2
00:00:24,600 --> 00:00:27,800
Second subtitle`;
      
      const file = new MockFile(content, 'test.srt');
      const result = await service.processFile(file);
      
      expect(result.type).toBe('srt');
      expect(result.subtitles.length).toBe(2);
      expect(result.subtitles[0].text).toBe('First subtitle');
      expect(result.subtitles[0].start).toBe('00:00:20,000');
      expect(result.subtitles[0].end).toBe('00:00:24,400');
    });

    test('should calculate subtitle duration', async () => {
      const content = `1
00:00:00,000 --> 00:00:05,000
Test`;
      
      const file = new MockFile(content, 'test.srt');
      const result = await service.processFile(file);
      
      expect(result.subtitles[0].duration).toBe(5000); // 5 seconds in ms
    });

    test('should handle multi-line subtitles', async () => {
      const content = `1
00:00:00,000 --> 00:00:05,000
Line 1
Line 2
Line 3`;
      
      const file = new MockFile(content, 'test.srt');
      const result = await service.processFile(file);
      
      expect(result.subtitles[0].text).toBe('Line 1\nLine 2\nLine 3');
    });
  });

  describe('Export Functionality', () => {
    test('should export CSV with translations', () => {
      const processedData = {
        type: 'csv',
        headers: ['English', 'Vietnamese'],
        data: [['Hello', 'Xin chào'], ['Goodbye', 'Tạm biệt']]
      };
      
      const translations = {
        '0_1': 'XIN CHÀO',
        '1_1': 'TẠM BIỆT'
      };
      
      const csv = service.exportCSV(processedData, translations);
      
      expect(csv).toContain('XIN CHÀO');
      expect(csv).toContain('TẠM BIỆT');
    });

    test('should export SRT with translations', () => {
      const processedData = {
        type: 'srt',
        subtitles: [
          { index: 1, start: '00:00:00,000', end: '00:00:05,000', text: 'Original' }
        ]
      };
      
      const translations = { 0: 'Translated' };
      
      const srt = service.exportSRT(processedData, translations);
      
      expect(srt).toContain('Translated');
      expect(srt).toContain('00:00:00,000 --> 00:00:05,000');
    });

    test('should escape CSV special characters', () => {
      const field = 'Text, with comma and "quotes"';
      const escaped = service.escapeCSV(field);
      
      expect(escaped).toBe('"Text, with comma and ""quotes"""');
    });
  });

  describe('File Preview', () => {
    test('should generate preview for text file', async () => {
      const content = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5';
      const file = new MockFile(content, 'test.txt');
      
      const preview = await service.getFilePreview(file, 3);
      
      expect(preview.lines.length).toBe(3);
      expect(preview.hasMore).toBe(true);
      expect(preview.totalLines).toBe(5);
    });

    test('should handle small files', async () => {
      const content = 'Line 1\nLine 2';
      const file = new MockFile(content, 'test.txt');
      
      const preview = await service.getFilePreview(file, 10);
      
      expect(preview.lines.length).toBe(2);
      expect(preview.hasMore).toBe(false);
    });
  });

  describe('Progress Callback', () => {
    test('should call progress callback during processing', async () => {
      const content = 'test content';
      const file = new MockFile(content, 'test.txt');
      const onProgress = jest.fn();
      
      await service.processFile(file, onProgress);
      
      expect(onProgress).toHaveBeenCalled();
      expect(onProgress.mock.calls[onProgress.mock.calls.length - 1][0]).toBe(100);
    });
  });

  describe('Error Handling', () => {
    test('should handle file read errors', async () => {
      const file = new MockFile('test', 'test.txt');
      file.text = () => Promise.reject(new Error('Read error'));
      
      await expect(service.processFile(file)).rejects.toThrow();
    });

    test('should handle invalid CSV format', async () => {
      const content = 'Invalid\nCSV\nFormat';
      const file = new MockFile(content, 'test.csv');
      
      const result = await service.processFile(file);
      
      // Should still process but data may be unexpected
      expect(result.type).toBe('csv');
    });
  });

  describe('Performance', () => {
    test('should handle large text files efficiently', async () => {
      const largeContent = 'Line\n'.repeat(10000);
      const file = new MockFile(largeContent, 'large.txt');
      
      const start = performance.now();
      const result = await service.processFile(file);
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(1000);
      expect(result.lines.length).toBe(10000);
    });
  });
});

