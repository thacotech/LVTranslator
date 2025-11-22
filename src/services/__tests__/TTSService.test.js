/**
 * TTSService Unit Tests
 */

import TTSService from '../TTSService';

// Mock SpeechSynthesis API
global.window = {
  speechSynthesis: {
    getVoices: jest.fn(() => [
      { name: 'Vietnamese Voice', lang: 'vi-VN' },
      { name: 'Lao Voice', lang: 'lo-LA' },
      { name: 'English Voice', lang: 'en-US' }
    ]),
    speak: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    cancel: jest.fn(),
    speaking: false,
    paused: false
  },
  SpeechSynthesisUtterance: jest.fn()
};

describe('TTSService', () => {
  let ttsService;

  beforeEach(() => {
    ttsService = new TTSService();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize with default settings', () => {
      expect(ttsService.settings.rate).toBe(1.0);
      expect(ttsService.settings.pitch).toBe(1.0);
      expect(ttsService.settings.volume).toBe(1.0);
      expect(ttsService.isPlaying).toBe(false);
    });

    test('should check if TTS is supported', () => {
      const isSupported = TTSService.isSupported();
      expect(isSupported).toBe(true);
    });

    test('should load voices on init', async () => {
      await ttsService.init();
      expect(ttsService.voices.length).toBeGreaterThan(0);
    });
  });

  describe('Voice Selection', () => {
    beforeEach(async () => {
      await ttsService.init();
    });

    test('should find Vietnamese voice', () => {
      const voice = ttsService.getVoiceForLanguage('vi-VN');
      expect(voice).toBeDefined();
      expect(voice.lang).toContain('vi');
    });

    test('should find Lao voice', () => {
      const voice = ttsService.getVoiceForLanguage('lo-LA');
      expect(voice).toBeDefined();
      expect(voice.lang).toContain('lo');
    });

    test('should fallback to English if language not found', () => {
      const voice = ttsService.getVoiceForLanguage('unknown-LANG');
      expect(voice).toBeDefined();
    });
  });

  describe('Speech Control', () => {
    test('should speak text', () => {
      const text = 'Hello world';
      ttsService.speak(text, 'vi-VN');
      expect(window.speechSynthesis.speak).toHaveBeenCalled();
    });

    test('should not speak empty text', () => {
      ttsService.speak('', 'vi-VN');
      expect(window.speechSynthesis.speak).not.toHaveBeenCalled();
    });

    test('should pause speech', () => {
      ttsService.isPlaying = true;
      ttsService.pause();
      expect(window.speechSynthesis.pause).toHaveBeenCalled();
      expect(ttsService.isPlaying).toBe(false);
    });

    test('should resume speech', () => {
      window.speechSynthesis.paused = true;
      ttsService.resume();
      expect(window.speechSynthesis.resume).toHaveBeenCalled();
    });

    test('should stop speech', () => {
      ttsService.isPlaying = true;
      ttsService.stop();
      expect(window.speechSynthesis.cancel).toHaveBeenCalled();
      expect(ttsService.isPlaying).toBe(false);
    });
  });

  describe('Settings', () => {
    test('should update rate setting', () => {
      ttsService.updateSettings({ rate: 1.5 });
      expect(ttsService.settings.rate).toBe(1.5);
    });

    test('should update pitch setting', () => {
      ttsService.updateSettings({ pitch: 1.2 });
      expect(ttsService.settings.pitch).toBe(1.2);
    });

    test('should update volume setting', () => {
      ttsService.updateSettings({ volume: 0.8 });
      expect(ttsService.settings.volume).toBe(0.8);
    });

    test('should clamp rate between 0.1 and 2.0', () => {
      ttsService.updateSettings({ rate: 5.0 });
      expect(ttsService.settings.rate).toBeLessThanOrEqual(2.0);
    });

    test('should clamp pitch between 0 and 2.0', () => {
      ttsService.updateSettings({ pitch: 3.0 });
      expect(ttsService.settings.pitch).toBeLessThanOrEqual(2.0);
    });

    test('should clamp volume between 0 and 1.0', () => {
      ttsService.updateSettings({ volume: 2.0 });
      expect(ttsService.settings.volume).toBeLessThanOrEqual(1.0);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing API gracefully', () => {
      const originalSynthesis = window.speechSynthesis;
      delete window.speechSynthesis;
      
      expect(TTSService.isSupported()).toBe(false);
      
      window.speechSynthesis = originalSynthesis;
    });

    test('should handle speak error', () => {
      window.speechSynthesis.speak.mockImplementation(() => {
        throw new Error('Speech error');
      });

      expect(() => {
        ttsService.speak('test', 'vi-VN');
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    test('should handle long text efficiently', () => {
      const longText = 'Lorem ipsum '.repeat(1000);
      const start = performance.now();
      ttsService.speak(longText, 'vi-VN');
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100); // Should be fast
    });

    test('should handle rapid start/stop', () => {
      for (let i = 0; i < 10; i++) {
        ttsService.speak('test', 'vi-VN');
        ttsService.stop();
      }

      expect(window.speechSynthesis.cancel).toHaveBeenCalled();
    });
  });
});

