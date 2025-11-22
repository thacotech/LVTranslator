# Design Document

## Overview

Tài liệu này mô tả thiết kế chi tiết cho việc mở rộng LVTranslator với 13 tính năng mới, tất cả được thiết kế để hoạt động hoàn toàn ở client-side phù hợp với static web hosting trên GitHub Pages. Thiết kế tập trung vào modular architecture, performance optimization, và user experience.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Environment                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              UI Layer (Components)                    │  │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐      │  │
│  │  │ TTS  │ │ STT  │ │Memory│ │Gloss.│ │Theme │      │  │
│  │  └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘      │  │
│  └─────┼────────┼────────┼────────┼────────┼───────────┘  │
│        │        │        │        │        │              │
│  ┌─────▼────────▼────────▼────────▼────────▼───────────┐  │
│  │           Service Layer (Business Logic)            │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐           │  │
│  │  │  Speech  │ │  Memory  │ │  Storage │           │  │
│  │  │ Service  │ │ Service  │ │ Service  │           │  │
│  │  └──────────┘ └──────────┘ └──────────┘           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────��  │
│  │         Data Layer (localStorage + IndexedDB)        │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │  │
│  │  │ Settings │ │  Memory  │ │ Glossary │            │  │
│  │  └──────────┘ └──────────┘ └──────────┘            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Browser APIs                             │  │
│  │  Web Speech API │ Service Worker │ File API          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```


### PWA Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      PWA Structure                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  Main Thread                          │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │  │
│  │  │    App     │  │   Cache    │  │   Sync     │    │  │
│  │  │   Logic    │  │  Manager   │  │  Manager   │    │  │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘    │  │
│  └────────┼───────────────┼───────────────┼────────────┘  │
│           │               │               │               │
│  ┌────────▼───────────────▼───────────────▼────────────┐  │
│  │              Service Worker                          │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │  │
│  │  │  Cache   │ │ Offline  │ │  Sync    │            │  │
│  │  │ Strategy │ │ Fallback │ │  Queue   │            │  │
│  │  └──────────┘ └──────────┘ └──────────┘            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Cache Storage                            │  │
│  │  Static Assets │ API Responses │ User Data           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Text-to-Speech Module

#### 1.1 TTSService Class

```javascript
class TTSService {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.utterance = null;
    this.voices = [];
    this.settings = {
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      voice: null
    };
    this.isPlaying = false;
    this.currentPosition = 0;
  }

  /**
   * Initialize TTS service and load available voices
   * @returns {Promise<void>}
   */
  async init() {
    return new Promise((resolve) => {
      // Load voices
      this.voices = this.synthesis.getVoices();
      
      if (this.voices.length === 0) {
        this.synthesis.onvoiceschanged = () => {
          this.voices = this.synthesis.getVoices();
          resolve();
        };
      } else {
        resolve();
      }
    });
  }

  /**
   * Speak text with current settings
   * @param {string} text - Text to speak
   * @param {string} lang - Language code (vi-VN, lo-LA)
   * @param {Function} onBoundary - Callback for word boundaries
   * @returns {Promise<void>}
   */
  speak(text, lang = 'vi-VN', onBoundary = null) {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Stop any ongoing speech
      this.stop();

      this.utterance = new SpeechSynthesisUtterance(text);
      this.utterance.lang = lang;
      this.utterance.rate = this.settings.rate;
      this.utterance.pitch = this.settings.pitch;
      this.utterance.volume = this.settings.volume;

      // Set voice if available
      const voice = this.getVoiceForLanguage(lang);
      if (voice) {
        this.utterance.voice = voice;
      }

      // Event handlers
      this.utterance.onstart = () => {
        this.isPlaying = true;
      };

      this.utterance.onend = () => {
        this.isPlaying = false;
        this.currentPosition = 0;
        resolve();
      };

      this.utterance.onerror = (event) => {
        this.isPlaying = false;
        reject(event.error);
      };

      // Word boundary for highlighting
      if (onBoundary) {
        this.utterance.onboundary = (event) => {
          onBoundary(event.charIndex, event.charLength);
        };
      }

      this.synthesis.speak(this.utterance);
    });
  }

  /**
   * Pause speech
   */
  pause() {
    if (this.synthesis && this.isPlaying) {
      this.synthesis.pause();
      this.isPlaying = false;
    }
  }

  /**
   * Resume speech
   */
  resume() {
    if (this.synthesis && !this.isPlaying) {
      this.synthesis.resume();
      this.isPlaying = true;
    }
  }

  /**
   * Stop speech
   */
  stop() {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.isPlaying = false;
      this.currentPosition = 0;
    }
  }

  /**
   * Get voice for specific language
   * @param {string} lang - Language code
   * @returns {SpeechSynthesisVoice|null}
   */
  getVoiceForLanguage(lang) {
    return this.voices.find(voice => voice.lang === lang) || null;
  }

  /**
   * Update TTS settings
   * @param {Object} settings - New settings
   */
  updateSettings(settings) {
    this.settings = { ...this.settings, ...settings };
  }

  /**
   * Check if TTS is supported
   * @returns {boolean}
   */
  static isSupported() {
    return 'speechSynthesis' in window;
  }
}
```

#### 1.2 TTS UI Component

```javascript
class TTSComponent {
  constructor(ttsService, container) {
    this.ttsService = ttsService;
    this.container = container;
    this.render();
    this.attachEventListeners();
  }

  render() {
    this.container.innerHTML = `
      <div class="tts-controls">
        <button class="tts-btn" id="ttsPlayBtn" title="Play (Alt+P)">
          <span class="icon">🔊</span>
          <span class="text">Play</span>
        </button>
        <button class="tts-btn" id="ttsPauseBtn" title="Pause" disabled>
          <span class="icon">⏸️</span>
        </button>
        <button class="tts-btn" id="ttsStopBtn" title="Stop" disabled>
          <span class="icon">⏹️</span>
        </button>
        
        <div class="tts-settings">
          <label>
            Speed: <span id="ttsRateValue">1.0x</span>
            <input type="range" id="ttsRate" min="0.5" max="2.0" step="0.1" value="1.0">
          </label>
          <label>
            Pitch: <span id="ttsPitchValue">1.0</span>
            <input type="range" id="ttsPitch" min="0.5" max="2.0" step="0.1" value="1.0">
          </label>
          <label>
            Volume: <span id="ttsVolumeValue">100%</span>
            <input type="range" id="ttsVolume" min="0" max="1" step="0.1" value="1.0">
          </label>
        </div>
      </div>
      
      <div class="tts-highlight" id="ttsHighlight"></div>
    `;
  }

  attachEventListeners() {
    // Play button
    document.getElementById('ttsPlayBtn').addEventListener('click', () => {
      this.play();
    });

    // Pause button
    document.getElementById('ttsPauseBtn').addEventListener('click', () => {
      this.ttsService.pause();
      this.updateButtonStates('paused');
    });

    // Stop button
    document.getElementById('ttsStopBtn').addEventListener('click', () => {
      this.ttsService.stop();
      this.updateButtonStates('stopped');
    });

    // Settings sliders
    document.getElementById('ttsRate').addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      document.getElementById('ttsRateValue').textContent = `${value}x`;
      this.ttsService.updateSettings({ rate: value });
    });

    document.getElementById('ttsPitch').addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      document.getElementById('ttsPitchValue').textContent = value.toFixed(1);
      this.ttsService.updateSettings({ pitch: value });
    });

    document.getElementById('ttsVolume').addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      document.getElementById('ttsVolumeValue').textContent = `${Math.round(value * 100)}%`;
      this.ttsService.updateSettings({ volume: value });
    });

    // Keyboard shortcut
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === 'p') {
        e.preventDefault();
        this.play();
      }
    });
  }

  async play() {
    const text = document.getElementById('outputText').value;
    const lang = document.getElementById('targetLangSelector').value === 'lo' ? 'lo-LA' : 'vi-VN';

    if (!text) {
      alert('No text to speak');
      return;
    }

    this.updateButtonStates('playing');

    try {
      await this.ttsService.speak(text, lang, (charIndex, charLength) => {
        this.highlightText(charIndex, charLength);
      });
      this.updateButtonStates('stopped');
    } catch (error) {
      console.error('TTS error:', error);
      alert('Failed to play speech: ' + error.message);
      this.updateButtonStates('stopped');
    }
  }

  highlightText(charIndex, charLength) {
    const outputText = document.getElementById('outputText');
    const text = outputText.value;
    
    // Create highlighted version
    const before = text.substring(0, charIndex);
    const highlighted = text.substring(charIndex, charIndex + charLength);
    const after = text.substring(charIndex + charLength);
    
    // Update highlight display
    const highlightDiv = document.getElementById('ttsHighlight');
    highlightDiv.innerHTML = `${before}<mark>${highlighted}</mark>${after}`;
  }

  updateButtonStates(state) {
    const playBtn = document.getElementById('ttsPlayBtn');
    const pauseBtn = document.getElementById('ttsPauseBtn');
    const stopBtn = document.getElementById('ttsStopBtn');

    switch (state) {
      case 'playing':
        playBtn.disabled = true;
        pauseBtn.disabled = false;
        stopBtn.disabled = false;
        break;
      case 'paused':
        playBtn.disabled = false;
        pauseBtn.disabled = true;
        stopBtn.disabled = false;
        break;
      case 'stopped':
        playBtn.disabled = false;
        pauseBtn.disabled = true;
        stopBtn.disabled = true;
        document.getElementById('ttsHighlight').innerHTML = '';
        break;
    }
  }
}
```


### 2. Speech-to-Text Module

#### 2.1 STTService Class

```javascript
class STTService {
  constructor() {
    this.recognition = null;
    this.isRecording = false;
    this.transcript = '';
    this.interimTranscript = '';
    this.lang = 'vi-VN';
    
    if (this.isSupported()) {
      this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      this.setupRecognition();
    }
  }

  setupRecognition() {
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
  }

  /**
   * Start speech recognition
   * @param {string} lang - Language code
   * @param {Function} onResult - Callback for results
   * @param {Function} onError - Callback for errors
   * @returns {Promise<void>}
   */
  start(lang = 'vi-VN', onResult, onError) {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not supported'));
        return;
      }

      this.lang = lang;
      this.recognition.lang = lang;
      this.transcript = '';
      this.interimTranscript = '';

      this.recognition.onstart = () => {
        this.isRecording = true;
        resolve();
      };

      this.recognition.onresult = (event) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript + ' ';
          } else {
            interim += transcript;
          }
        }

        if (final) {
          this.transcript += final;
        }
        this.interimTranscript = interim;

        if (onResult) {
          onResult({
            transcript: this.transcript,
            interimTranscript: this.interimTranscript,
            isFinal: final.length > 0
          });
        }
      };

      this.recognition.onerror = (event) => {
        this.isRecording = false;
        if (onError) {
          onError(event.error);
        }
      };

      this.recognition.onend = () => {
        this.isRecording = false;
      };

      try {
        this.recognition.start();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop speech recognition
   */
  stop() {
    if (this.recognition && this.isRecording) {
      this.recognition.stop();
      this.isRecording = false;
    }
  }

  /**
   * Get final transcript
   * @returns {string}
   */
  getTranscript() {
    return this.transcript.trim();
  }

  /**
   * Check if STT is supported
   * @returns {boolean}
   */
  static isSupported() {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }
}
```

### 3. Translation Memory Module

#### 3.1 TranslationMemoryService Class

```javascript
class TranslationMemoryService {
  constructor() {
    this.storageKey = 'lvtranslator_memory';
    this.maxItems = 500;
    this.memory = this.loadMemory();
  }

  /**
   * Load memory from localStorage
   * @returns {Array}
   */
  loadMemory() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load memory:', error);
      return [];
    }
  }

  /**
   * Save memory to localStorage
   */
  saveMemory() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.memory));
    } catch (error) {
      console.error('Failed to save memory:', error);
    }
  }

  /**
   * Add item to memory
   * @param {Object} item - Memory item
   * @returns {boolean}
   */
  addItem(item) {
    // Check if already exists
    const exists = this.memory.find(m => 
      m.sourceText === item.sourceText && 
      m.direction === item.direction
    );

    if (exists) {
      exists.usageCount++;
      exists.lastUsed = Date.now();
    } else {
      const memoryItem = {
        id: Date.now(),
        sourceText: item.sourceText,
        translatedText: item.translatedText,
        direction: item.direction,
        category: item.category || 'general',
        usageCount: 1,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        tags: item.tags || []
      };

      this.memory.unshift(memoryItem);

      // Enforce max items
      if (this.memory.length > this.maxItems) {
        this.memory = this.memory.slice(0, this.maxItems);
      }
    }

    this.saveMemory();
    return true;
  }

  /**
   * Search memory
   * @param {string} query - Search query
   * @param {string} category - Filter by category
   * @returns {Array}
   */
  search(query, category = null) {
    let results = this.memory;

    if (category) {
      results = results.filter(item => item.category === category);
    }

    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(item =>
        item.sourceText.toLowerCase().includes(lowerQuery) ||
        item.translatedText.toLowerCase().includes(lowerQuery) ||
        item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }

    return results;
  }

  /**
   * Get suggestions based on input
   * @param {string} input - Current input text
   * @param {number} limit - Max suggestions
   * @returns {Array}
   */
  getSuggestions(input, limit = 5) {
    if (!input || input.length < 2) return [];

    const lowerInput = input.toLowerCase();
    const suggestions = this.memory
      .filter(item => item.sourceText.toLowerCase().startsWith(lowerInput))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);

    return suggestions;
  }

  /**
   * Update memory item
   * @param {number} id - Item ID
   * @param {Object} updates - Updates to apply
   * @returns {boolean}
   */
  updateItem(id, updates) {
    const item = this.memory.find(m => m.id === id);
    if (item) {
      Object.assign(item, updates);
      this.saveMemory();
      return true;
    }
    return false;
  }

  /**
   * Delete memory item
   * @param {number} id - Item ID
   * @returns {boolean}
   */
  deleteItem(id) {
    const index = this.memory.findIndex(m => m.id === id);
    if (index !== -1) {
      this.memory.splice(index, 1);
      this.saveMemory();
      return true;
    }
    return false;
  }

  /**
   * Get all categories
   * @returns {Array}
   */
  getCategories() {
    const categories = new Set(this.memory.map(item => item.category));
    return Array.from(categories);
  }

  /**
   * Export memory to JSON
   * @returns {string}
   */
  export() {
    return JSON.stringify({
      version: '1.0',
      exportDate: new Date().toISOString(),
      items: this.memory
    }, null, 2);
  }

  /**
   * Import memory from JSON
   * @param {string} jsonData - JSON data
   * @param {boolean} merge - Merge with existing or replace
   * @returns {boolean}
   */
  import(jsonData, merge = true) {
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.items || !Array.isArray(data.items)) {
        throw new Error('Invalid memory format');
      }

      if (merge) {
        // Merge with existing, avoiding duplicates
        data.items.forEach(item => {
          const exists = this.memory.find(m =>
            m.sourceText === item.sourceText &&
            m.direction === item.direction
          );
          if (!exists) {
            this.memory.push(item);
          }
        });
      } else {
        this.memory = data.items;
      }

      // Enforce max items
      if (this.memory.length > this.maxItems) {
        this.memory = this.memory
          .sort((a, b) => b.usageCount - a.usageCount)
          .slice(0, this.maxItems);
      }

      this.saveMemory();
      return true;
    } catch (error) {
      console.error('Failed to import memory:', error);
      return false;
    }
  }
}
```

### 4. Glossary Module

#### 4.1 GlossaryService Class

```javascript
class GlossaryService {
  constructor() {
    this.storageKey = 'lvtranslator_glossary';
    this.glossary = this.loadGlossary();
  }

  /**
   * Load glossary from localStorage
   * @returns {Array}
   */
  loadGlossary() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load glossary:', error);
      return [];
    }
  }

  /**
   * Save glossary to localStorage
   */
  saveGlossary() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.glossary));
    } catch (error) {
      console.error('Failed to save glossary:', error);
    }
  }

  /**
   * Add glossary entry
   * @param {Object} entry - Glossary entry
   * @returns {boolean}
   */
  addEntry(entry) {
    const glossaryEntry = {
      id: Date.now(),
      sourceTerm: entry.sourceTerm,
      targetTerm: entry.targetTerm,
      direction: entry.direction,
      category: entry.category || 'general',
      notes: entry.notes || '',
      context: entry.context || '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.glossary.push(glossaryEntry);
    this.saveGlossary();
    return true;
  }

  /**
   * Find glossary terms in text
   * @param {string} text - Text to search
   * @param {string} direction - Translation direction
   * @returns {Array}
   */
  findTermsInText(text, direction) {
    const found = [];
    const lowerText = text.toLowerCase();

    this.glossary
      .filter(entry => entry.direction === direction)
      .forEach(entry => {
        const term = entry.sourceTerm.toLowerCase();
        let index = lowerText.indexOf(term);
        
        while (index !== -1) {
          found.push({
            term: entry.sourceTerm,
            translation: entry.targetTerm,
            start: index,
            end: index + term.length,
            entry: entry
          });
          index = lowerText.indexOf(term, index + 1);
        }
      });

    return found.sort((a, b) => a.start - b.start);
  }

  /**
   * Search glossary
   * @param {string} query - Search query
   * @param {string} category - Filter by category
   * @returns {Array}
   */
  search(query, category = null) {
    let results = this.glossary;

    if (category) {
      results = results.filter(entry => entry.category === category);
    }

    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(entry =>
        entry.sourceTerm.toLowerCase().includes(lowerQuery) ||
        entry.targetTerm.toLowerCase().includes(lowerQuery) ||
        entry.notes.toLowerCase().includes(lowerQuery)
      );
    }

    return results;
  }

  /**
   * Update glossary entry
   * @param {number} id - Entry ID
   * @param {Object} updates - Updates to apply
   * @returns {boolean}
   */
  updateEntry(id, updates) {
    const entry = this.glossary.find(e => e.id === id);
    if (entry) {
      Object.assign(entry, updates, { updatedAt: Date.now() });
      this.saveGlossary();
      return true;
    }
    return false;
  }

  /**
   * Delete glossary entry
   * @param {number} id - Entry ID
   * @returns {boolean}
   */
  deleteEntry(id) {
    const index = this.glossary.findIndex(e => e.id === id);
    if (index !== -1) {
      this.glossary.splice(index, 1);
      this.saveGlossary();
      return true;
    }
    return false;
  }

  /**
   * Export glossary to CSV
   * @returns {string}
   */
  exportToCSV() {
    const headers = ['Source Term', 'Target Term', 'Direction', 'Category', 'Notes', 'Context'];
    const rows = this.glossary.map(entry => [
      entry.sourceTerm,
      entry.targetTerm,
      entry.direction,
      entry.category,
      entry.notes,
      entry.context
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csv;
  }

  /**
   * Import glossary from CSV
   * @param {string} csvData - CSV data
   * @param {boolean} merge - Merge with existing or replace
   * @returns {boolean}
   */
  importFromCSV(csvData, merge = true) {
    try {
      const lines = csvData.split('\n');
      const entries = [];

      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Parse CSV line (handle quoted fields)
        const fields = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (fields && fields.length >= 2) {
          entries.push({
            sourceTerm: fields[0].replace(/"/g, ''),
            targetTerm: fields[1].replace(/"/g, ''),
            direction: fields[2] ? fields[2].replace(/"/g, '') : 'vi-lo',
            category: fields[3] ? fields[3].replace(/"/g, '') : 'general',
            notes: fields[4] ? fields[4].replace(/"/g, '') : '',
            context: fields[5] ? fields[5].replace(/"/g, '') : ''
          });
        }
      }

      if (!merge) {
        this.glossary = [];
      }

      entries.forEach(entry => this.addEntry(entry));
      return true;
    } catch (error) {
      console.error('Failed to import glossary:', error);
      return false;
    }
  }
}
```


### 5. PWA Implementation

#### 5.1 Service Worker (sw.js)

```javascript
const CACHE_NAME = 'lvtranslator-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/scripts/main.js',
  '/fonts/Phetsarath-OT.ttf',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request).then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    })
  );
});
```

#### 5.2 Manifest (manifest.json)

```json
{
  "name": "LVTranslator - Vietnamese Lao Translator",
  "short_name": "LVTranslator",
  "description": "Translate between Vietnamese and Lao languages",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#667eea",
  "orientation": "any",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "categories": ["productivity", "education", "utilities"],
  "screenshots": [
    {
      "src": "/screenshots/desktop.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    },
    {
      "src": "/screenshots/mobile.png",
      "sizes": "750x1334",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ]
}
```

### 6. Keyboard Shortcuts Module

```javascript
class KeyboardShortcutService {
  constructor() {
    this.shortcuts = {
      'Ctrl+Enter': { action: 'translate', description: 'Translate text' },
      'Ctrl+K': { action: 'clear', description: 'Clear all fields' },
      'Ctrl+H': { action: 'toggleHistory', description: 'Toggle history panel' },
      'Ctrl+C': { action: 'copy', description: 'Copy translation' },
      'Ctrl+S': { action: 'saveToMemory', description: 'Save to memory' },
      'Ctrl+/': { action: 'showHelp', description: 'Show shortcuts help' },
      'Escape': { action: 'closeModal', description: 'Close modal/panel' },
      'Alt+P': { action: 'playTTS', description: 'Play text-to-speech' },
      'Alt+M': { action: 'startSTT', description: 'Start speech recognition' }
    };
    
    this.customShortcuts = this.loadCustomShortcuts();
    this.init();
  }

  init() {
    document.addEventListener('keydown', (e) => this.handleKeyPress(e));
  }

  handleKeyPress(event) {
    const key = this.getKeyCombo(event);
    const shortcut = this.shortcuts[key] || this.customShortcuts[key];

    if (shortcut) {
      event.preventDefault();
      this.executeAction(shortcut.action);
    }
  }

  getKeyCombo(event) {
    const parts = [];
    if (event.ctrlKey || event.metaKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    
    const key = event.key === ' ' ? 'Space' : event.key;
    parts.push(key);
    
    return parts.join('+');
  }

  executeAction(action) {
    const actions = {
      translate: () => document.getElementById('translateBtn').click(),
      clear: () => document.getElementById('clearBtn').click(),
      toggleHistory: () => document.getElementById('historyToggleBtn').click(),
      copy: () => document.getElementById('copyBtn').click(),
      saveToMemory: () => this.saveCurrentToMemory(),
      showHelp: () => this.showShortcutsHelp(),
      closeModal: () => this.closeTopModal(),
      playTTS: () => document.getElementById('ttsPlayBtn').click(),
      startSTT: () => document.getElementById('sttStartBtn').click()
    };

    if (actions[action]) {
      actions[action]();
    }
  }

  loadCustomShortcuts() {
    try {
      const stored = localStorage.getItem('custom_shortcuts');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      return {};
    }
  }

  saveCustomShortcuts() {
    localStorage.setItem('custom_shortcuts', JSON.stringify(this.customShortcuts));
  }

  updateShortcut(action, newKey) {
    // Remove old shortcut
    Object.keys(this.customShortcuts).forEach(key => {
      if (this.customShortcuts[key].action === action) {
        delete this.customShortcuts[key];
      }
    });

    // Add new shortcut
    const defaultShortcut = Object.entries(this.shortcuts).find(
      ([_, s]) => s.action === action
    );
    
    if (defaultShortcut) {
      this.customShortcuts[newKey] = defaultShortcut[1];
      this.saveCustomShortcuts();
    }
  }

  showShortcutsHelp() {
    const allShortcuts = { ...this.shortcuts, ...this.customShortcuts };
    const helpHTML = Object.entries(allShortcuts)
      .map(([key, shortcut]) => `
        <div class="shortcut-item">
          <kbd>${key}</kbd>
          <span>${shortcut.description}</span>
        </div>
      `)
      .join('');

    // Show modal with shortcuts
    const modal = document.createElement('div');
    modal.className = 'shortcuts-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h2>Keyboard Shortcuts</h2>
        <div class="shortcuts-list">${helpHTML}</div>
        <button onclick="this.closest('.shortcuts-modal').remove()">Close</button>
      </div>
    `;
    document.body.appendChild(modal);
  }
}
```

### 7. Theme Customization Module

```javascript
class ThemeService {
  constructor() {
    this.themes = {
      light: {
        name: 'Light',
        colors: {
          primary: '#667eea',
          secondary: '#764ba2',
          background: '#ffffff',
          surface: '#f8f9fa',
          text: '#333333'
        }
      },
      dark: {
        name: 'Dark',
        colors: {
          primary: '#8b9dc3',
          secondary: '#9d7bb5',
          background: '#1a1a1a',
          surface: '#2c2c2c',
          text: '#e0e0e0'
        }
      },
      blue: {
        name: 'Ocean Blue',
        colors: {
          primary: '#0077be',
          secondary: '#00a8e8',
          background: '#f0f8ff',
          surface: '#e6f3ff',
          text: '#003d5c'
        }
      },
      purple: {
        name: 'Purple Dream',
        colors: {
          primary: '#9b59b6',
          secondary: '#8e44ad',
          background: '#f8f5ff',
          surface: '#f0ebff',
          text: '#4a235a'
        }
      },
      green: {
        name: 'Forest Green',
        colors: {
          primary: '#27ae60',
          secondary: '#2ecc71',
          background: '#f0fff4',
          surface: '#e6f9ed',
          text: '#145a32'
        }
      }
    };

    this.currentTheme = this.loadTheme();
    this.customSettings = this.loadCustomSettings();
  }

  loadTheme() {
    const saved = localStorage.getItem('theme');
    return saved || 'light';
  }

  loadCustomSettings() {
    try {
      const saved = localStorage.getItem('theme_custom_settings');
      return saved ? JSON.parse(saved) : {
        fontSize: 16,
        fontFamily: 'system',
        lineHeight: 1.5,
        letterSpacing: 0
      };
    } catch (error) {
      return {
        fontSize: 16,
        fontFamily: 'system',
        lineHeight: 1.5,
        letterSpacing: 0
      };
    }
  }

  applyTheme(themeName) {
    const theme = this.themes[themeName];
    if (!theme) return;

    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    this.currentTheme = themeName;
    localStorage.setItem('theme', themeName);
    
    // Apply custom settings
    this.applyCustomSettings();
  }

  applyCustomSettings() {
    const root = document.documentElement;
    root.style.setProperty('--font-size-base', `${this.customSettings.fontSize}px`);
    root.style.setProperty('--line-height-normal', this.customSettings.lineHeight);
    root.style.setProperty('--letter-spacing', `${this.customSettings.letterSpacing}px`);

    const fontFamilies = {
      system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      serif: 'Georgia, "Times New Roman", serif',
      monospace: '"Courier New", Courier, monospace'
    };

    root.style.setProperty('--font-family-base', fontFamilies[this.customSettings.fontFamily]);
  }

  updateCustomSettings(settings) {
    this.customSettings = { ...this.customSettings, ...settings };
    localStorage.setItem('theme_custom_settings', JSON.stringify(this.customSettings));
    this.applyCustomSettings();
  }

  exportTheme() {
    return JSON.stringify({
      theme: this.currentTheme,
      customSettings: this.customSettings
    }, null, 2);
  }

  importTheme(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      if (data.theme && this.themes[data.theme]) {
        this.applyTheme(data.theme);
      }
      if (data.customSettings) {
        this.updateCustomSettings(data.customSettings);
      }
      return true;
    } catch (error) {
      console.error('Failed to import theme:', error);
      return false;
    }
  }
}
```

## Data Models

### Translation Memory Item
```typescript
interface MemoryItem {
  id: number;
  sourceText: string;
  translatedText: string;
  direction: string; // 'vi-lo', 'lo-vi', etc.
  category: string;
  usageCount: number;
  createdAt: number;
  lastUsed: number;
  tags: string[];
}
```

### Glossary Entry
```typescript
interface GlossaryEntry {
  id: number;
  sourceTerm: string;
  targetTerm: string;
  direction: string;
  category: string;
  notes: string;
  context: string;
  createdAt: number;
  updatedAt: number;
}
```

### Theme Settings
```typescript
interface ThemeSettings {
  theme: string;
  customSettings: {
    fontSize: number;
    fontFamily: string;
    lineHeight: number;
    letterSpacing: number;
  };
}
```

### Export Data Structure
```typescript
interface ExportData {
  version: string;
  exportDate: string;
  history: HistoryItem[];
  memory: MemoryItem[];
  glossary: GlossaryEntry[];
  settings: {
    theme: ThemeSettings;
    apiKey: string; // encrypted
    preferences: object;
  };
}
```

## Error Handling

### Error Types
```javascript
const ErrorTypes = {
  TTS_NOT_SUPPORTED: 'TTS_NOT_SUPPORTED',
  STT_NOT_SUPPORTED: 'STT_NOT_SUPPORTED',
  MICROPHONE_PERMISSION_DENIED: 'MICROPHONE_PERMISSION_DENIED',
  STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
  IMPORT_INVALID_FORMAT: 'IMPORT_INVALID_FORMAT',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  PWA_INSTALL_FAILED: 'PWA_INSTALL_FAILED'
};
```

## Testing Strategy

### Unit Tests
- Test each service class independently
- Mock browser APIs (Web Speech API, localStorage)
- Test edge cases and error handling

### Integration Tests
- Test feature workflows end-to-end
- Test data persistence and retrieval
- Test PWA installation and offline functionality

### Browser Compatibility Tests
- Test on Chrome, Firefox, Safari, Edge
- Test on iOS and Android devices
- Test graceful degradation for unsupported features

### Performance Tests
- Measure TTS/STT latency
- Test with large glossary/memory datasets
- Test PWA cache performance

## Implementation Phases

### Phase 1: Core Voice Features (Week 1-2)
- Implement TTS service and UI
- Implement STT service and UI
- Add voice controls and settings

### Phase 2: Data Management (Week 2-3)
- Implement Translation Memory
- Implement Glossary
- Add export/import functionality

### Phase 3: PWA & UX (Week 3-4)
- Implement Service Worker
- Create manifest.json
- Add keyboard shortcuts
- Implement theme customization

### Phase 4: Mobile & Advanced (Week 4-5)
- Optimize mobile UX with gestures
- Add advanced file support
- Implement batch translation
- Add quality feedback system

### Phase 5: Polish & Testing (Week 5-6)
- Comprehensive testing
- Bug fixes
- Performance optimization
- Documentation

## Security Considerations

- Encrypt API keys in localStorage using Web Crypto API
- Sanitize all user inputs before storage
- Validate imported data before applying
- Use HTTPS for all external resources
- Implement CSP headers

## Performance Optimization

- Lazy load non-critical features
- Use IndexedDB for large datasets
- Implement virtual scrolling for long lists
- Optimize PWA cache strategy
- Minimize DOM manipulations

## Accessibility

- All features accessible via keyboard
- ARIA labels for screen readers
- High contrast mode support
- Focus management for modals
- Keyboard navigation for all interactive elements
