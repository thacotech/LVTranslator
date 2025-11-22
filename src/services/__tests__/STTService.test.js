/**
 * STTService Unit Tests
 */

import STTService from '../STTService';

// Mock SpeechRecognition API
class MockSpeechRecognition {
  constructor() {
    this.continuous = false;
    this.interimResults = false;
    this.lang = 'vi-VN';
    this.onstart = null;
    this.onresult = null;
    this.onerror = null;
    this.onend = null;
  }
  start() {
    if (this.onstart) this.onstart();
  }
  stop() {
    if (this.onend) this.onend();
  }
  abort() {}
}

global.window = {
  SpeechRecognition: MockSpeechRecognition,
  webkitSpeechRecognition: MockSpeechRecognition
};

global.navigator = {
  permissions: {
    query: jest.fn().mockResolvedValue({ state: 'granted' })
  }
};

describe('STTService', () => {
  let sttService;

  beforeEach(() => {
    sttService = new STTService();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize successfully', () => {
      sttService.init();
      expect(sttService.recognition).toBeDefined();
    });

    test('should check if STT is supported', () => {
      const isSupported = STTService.isSupported();
      expect(isSupported).toBe(true);
    });

    test('should set default language to Vietnamese', () => {
      sttService.init();
      expect(sttService.recognitionLanguage).toBe('vi-VN');
    });
  });

  describe('Recognition Control', () => {
    beforeEach(() => {
      sttService.init();
    });

    test('should start recognition', () => {
      const onResult = jest.fn();
      const onError = jest.fn();
      const onEnd = jest.fn();

      sttService.start('vi-VN', onResult, onError, onEnd);

      expect(sttService.isRecording).toBe(true);
      expect(sttService.recognition.lang).toBe('vi-VN');
      expect(sttService.recognition.continuous).toBe(true);
    });

    test('should stop recognition', () => {
      sttService.isRecording = true;
      sttService.stop();

      expect(sttService.isRecording).toBe(false);
    });

    test('should not start if already recording', () => {
      sttService.isRecording = true;
      const result = sttService.start('vi-VN', jest.fn(), jest.fn(), jest.fn());

      expect(result).toBeUndefined();
    });

    test('should handle language change', () => {
      sttService.setRecognitionLanguage('lo-LA');
      expect(sttService.recognitionLanguage).toBe('lo-LA');
    });
  });

  describe('Result Processing', () => {
    beforeEach(() => {
      sttService.init();
    });

    test('should handle interim results', () => {
      const onResult = jest.fn();
      sttService.start('vi-VN', onResult, jest.fn(), jest.fn());

      const mockEvent = {
        results: [[{ transcript: 'test interim', isFinal: false }]],
        resultIndex: 0
      };

      sttService.recognition.onresult(mockEvent);
      expect(onResult).toHaveBeenCalledWith('test interim', false);
    });

    test('should handle final results', () => {
      const onResult = jest.fn();
      sttService.start('vi-VN', onResult, jest.fn(), jest.fn());

      const mockEvent = {
        results: [[{ transcript: 'final result', isFinal: true }]],
        resultIndex: 0
      };

      sttService.recognition.onresult(mockEvent);
      expect(onResult).toHaveBeenCalledWith('final result', true);
    });

    test('should concatenate multiple results', () => {
      const onResult = jest.fn();
      sttService.start('vi-VN', onResult, jest.fn(), jest.fn());

      const mockEvent = {
        results: [
          [{ transcript: 'hello', isFinal: true }],
          [{ transcript: 'world', isFinal: true }]
        ],
        resultIndex: 0
      };

      sttService.recognition.onresult(mockEvent);
      expect(onResult).toHaveBeenCalledWith('hello world', true);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      sttService.init();
    });

    test('should handle no-speech error', () => {
      const onError = jest.fn();
      sttService.start('vi-VN', jest.fn(), onError, jest.fn());

      sttService.recognition.onerror({ error: 'no-speech' });
      expect(onError).toHaveBeenCalled();
    });

    test('should handle not-allowed error', () => {
      const onError = jest.fn();
      sttService.start('vi-VN', jest.fn(), onError, jest.fn());

      sttService.recognition.onerror({ error: 'not-allowed' });
      expect(onError).toHaveBeenCalled();
    });

    test('should handle network error', () => {
      const onError = jest.fn();
      sttService.start('vi-VN', jest.fn(), onError, jest.fn());

      sttService.recognition.onerror({ error: 'network' });
      expect(onError).toHaveBeenCalled();
    });

    test('should handle missing API gracefully', () => {
      delete window.SpeechRecognition;
      delete window.webkitSpeechRecognition;

      expect(STTService.isSupported()).toBe(false);
    });
  });

  describe('Silence Detection', () => {
    beforeEach(() => {
      sttService.init();
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should stop after silence threshold', () => {
      sttService.start('vi-VN', jest.fn(), jest.fn(), jest.fn());

      jest.advanceTimersByTime(30000); // 30 seconds

      expect(sttService.isRecording).toBe(false);
    });

    test('should reset silence timer on result', () => {
      const onResult = jest.fn();
      sttService.start('vi-VN', onResult, jest.fn(), jest.fn());

      jest.advanceTimersByTime(20000); // 20 seconds

      const mockEvent = {
        results: [[{ transcript: 'test', isFinal: false }]],
        resultIndex: 0
      };
      sttService.recognition.onresult(mockEvent);

      jest.advanceTimersByTime(20000); // Another 20 seconds

      expect(sttService.isRecording).toBe(true);
    });
  });

  describe('Browser Compatibility', () => {
    test('should support Chrome with webkitSpeechRecognition', () => {
      delete window.SpeechRecognition;
      window.webkitSpeechRecognition = MockSpeechRecognition;

      const isSupported = STTService.isSupported();
      expect(isSupported).toBe(true);
    });

    test('should not support browsers without API', () => {
      delete window.SpeechRecognition;
      delete window.webkitSpeechRecognition;

      const isSupported = STTService.isSupported();
      expect(isSupported).toBe(false);
    });
  });

  describe('Performance', () => {
    beforeEach(() => {
      sttService.init();
    });

    test('should handle rapid results efficiently', () => {
      const onResult = jest.fn();
      sttService.start('vi-VN', onResult, jest.fn(), jest.fn());

      const start = performance.now();
      
      for (let i = 0; i < 100; i++) {
        const mockEvent = {
          results: [[{ transcript: `word${i}`, isFinal: false }]],
          resultIndex: 0
        };
        sttService.recognition.onresult(mockEvent);
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100); // Should be fast
      expect(onResult).toHaveBeenCalledTimes(100);
    });
  });
});

