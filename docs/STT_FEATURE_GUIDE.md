# Speech-to-Text (STT) Feature Guide

## Overview

The STT feature allows users to speak directly into their microphone to input text for translation, eliminating the need to type - especially useful for languages with complex input methods like Lao.

## Features

### ✅ Core Functionality
- **Voice Input** - Speak directly instead of typing
- **Real-time Recognition** - See text as you speak
- **Multi-language Support** - Vietnamese (vi-VN), Lao (lo-LA), English (en-US)
- **Auto-stop** - Automatically stops after 30 seconds of silence
- **Browser Support** - Chrome, Edge (Web Speech Recognition API)

### ⚙️ Smart Recognition
- **Interim Results** - See recognized text in real-time
- **Final Results** - Polished text inserted into input field
- **Continuous Recognition** - Handles long speeches
- **Error Handling** - Graceful handling of recognition errors

### 🎯 User Interface
- One-click voice input button
- Visual recording indicator with timer
- Language selector for recognition
- Interim results display
- Permission and browser compatibility indicators

## Usage

### Basic Usage

1. **Start Voice Input**
   - Click the 🎤 **Voice Input** button
   - Or press **Alt+R** keyboard shortcut
   - Allow microphone permission if prompted

2. **Speak**
   - Speak clearly into your microphone
   - Watch interim results appear in real-time
   - Multiple sentences supported

3. **Stop Recording**
   - Click **Stop** button
   - Or wait for auto-stop (30 seconds of silence)
   - Recognized text is inserted into input field

4. **Edit & Translate**
   - Review and edit recognized text if needed
   - Click translate button as usual

### Language Selection

1. **Select Recognition Language**
   - Use language dropdown before recording
   - Choose from: Vietnamese, Lao, English
   - Language cannot be changed during recording

2. **Match Source Language**
   - Select same language you'll be speaking
   - Example: Select "Vietnamese" if speaking in Vietnamese
   - Recognition accuracy depends on correct language selection

## Integration

### For Developers

#### 1. Import STT Module

```javascript
import STTService from './src/services/STTService.js';
import STTComponent from './src/components/STTComponent.js';
```

#### 2. Create STT Service and Component

```javascript
// Create service
const sttService = new STTService();

// Find container
const sttContainer = document.querySelector('.stt-container');

// Create component
const sttComponent = new STTComponent(sttService, sttContainer);

// Set target input field
const inputField = document.getElementById('inputText');
sttComponent.setTargetInputField(inputField);
```

#### 3. Example HTML Structure

```html
<div class="input-panel" id="inputPanel">
  <textarea id="inputText"></textarea>
  
  <!-- STT container will be inserted here -->
  <div class="stt-container"></div>
</div>
```

### API Reference

#### STTService Class

```javascript
class STTService {
  // Start recording
  async start(lang = 'vi-VN')
  
  // Stop recording
  stop()
  
  // Abort recording
  abort()
  
  // Get transcripts
  getTranscript()
  getInterimTranscript()
  getFullTranscript()
  clearTranscript()
  
  // Callbacks
  setOnResult(callback)
  setOnInterimResult(callback)
  setOnEnd(callback)
  setOnError(callback)
  setOnStart(callback)
  
  // Settings
  updateSettings(settings)
  getSettings()
  
  // State
  getState()
  
  // Static methods
  static isSupported()
  static async requestMicrophonePermission()
}
```

#### Example Usage

```javascript
import STTService from './src/services/STTService.js';

// Create service
const stt = new STTService();

// Setup callbacks
stt.setOnResult((transcript, isFinal) => {
  console.log('Result:', transcript);
});

stt.setOnInterimResult((interim) => {
  console.log('Interim:', interim);
});

stt.setOnEnd((finalTranscript) => {
  console.log('Final:', finalTranscript);
  // Insert into input field
  document.getElementById('inputText').value = finalTranscript;
});

stt.setOnError((error, message) => {
  console.error('Error:', error, message);
});

// Start recording
try {
  await stt.start('vi-VN');
} catch (error) {
  console.error('Failed to start:', error);
}

// Stop recording
stt.stop();
```

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Best support, most accurate |
| Edge | ✅ Full | Chromium-based, good accuracy |
| Safari | ❌ No | Not supported |
| Firefox | ❌ No | Not supported |
| Opera | ✅ Full | Chromium-based |

### Checking Support

```javascript
if (STTService.isSupported()) {
  // STT is available
  initializeSTT();
} else {
  // Show fallback message
  showError('Speech recognition not supported. Please use Chrome or Edge.');
}
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Alt + R** | Start/Stop recording |
| **Esc** | Stop recording (if active) |

## Microphone Permission

### First-Time Setup

1. **Click Voice Input button**
2. **Browser will request permission**
3. **Click "Allow"** in the browser prompt
4. **Recording starts automatically**

### Permission Denied

If you accidentally denied permission:

1. **Chrome/Edge:**
   - Click 🔒 icon in address bar
   - Find "Microphone" setting
   - Change to "Allow"
   - Reload page

2. **System Settings:**
   - Ensure microphone is not blocked in OS settings
   - Check browser has microphone access

## Troubleshooting

### No Sound Detected

**Problem**: "No speech detected" error

**Solutions**:
1. Check microphone is working
2. Speak louder and clearer
3. Check system microphone permissions
4. Try different microphone (if available)
5. Reduce background noise

### Permission Denied

**Problem**: Cannot access microphone

**Solutions**:
1. Click allow in browser prompt
2. Check browser microphone settings
3. Check OS microphone permissions
4. Try different browser
5. Restart browser

### Poor Recognition Accuracy

**Problem**: Wrong text recognized

**Solutions**:
1. Speak more clearly
2. Reduce background noise
3. Check correct language selected
4. Use better quality microphone
5. Speak at moderate speed

### Auto-Stop Too Early

**Problem**: Recording stops while still speaking

**Solutions**:
1. Speak continuously without long pauses
2. Adjust silence timeout in settings
3. Manually stop instead of relying on auto-stop

### Browser Not Supported

**Problem**: "Speech recognition not supported" message

**Solutions**:
1. Use Chrome or Edge browser
2. Update browser to latest version
3. Enable experimental features in browser flags (not recommended)

## Best Practices

### For Best Recognition

1. **Environment**
   - Quiet environment
   - Minimal background noise
   - Close to microphone

2. **Speaking**
   - Speak clearly and at moderate speed
   - Normal volume (don't shout)
   - Natural pronunciation
   - Pause briefly between sentences

3. **Language**
   - Select correct language before recording
   - Stick to one language per recording
   - Use standard dialect when possible

4. **Technical**
   - Use good quality microphone
   - Check microphone levels
   - Close unnecessary apps using microphone
   - Use wired microphone when possible (less latency)

## Advanced Features

### Callbacks

```javascript
// Custom processing on interim results
stt.setOnInterimResult((interim) => {
  // Show interim text in custom UI
  updateInterimDisplay(interim);
});

// Custom processing on final results
stt.setOnResult((transcript, isFinal) => {
  if (isFinal) {
    // Process final transcript
    processTranscript(transcript);
  }
});

// Custom error handling
stt.setOnError((error, message) => {
  // Show custom error UI
  showCustomError(message);
  
  // Track error analytics
  trackError('STT', error);
});
```

### Custom Settings

```javascript
// Adjust silence timeout
stt.updateSettings({
  silenceTimeout: 60000  // 60 seconds instead of 30
});

// Disable interim results
stt.updateSettings({
  interimResults: false
});

// Increase alternatives
stt.updateSettings({
  maxAlternatives: 3  // Get top 3 recognition alternatives
});
```

## Privacy & Security

- **No External Calls** - Uses browser's built-in Web Speech Recognition API
- **No Data Collection** - Audio not stored or transmitted
- **Temporary Processing** - Recognition happens in real-time, nothing saved
- **Local Only** - All processing in browser (may use Google API internally)
- **No Server Required** - Pure client-side implementation

**Note**: While the Web Speech Recognition API runs in the browser, browsers like Chrome may send audio to Google's servers for processing. Check your browser's privacy policy for details.

## Accessibility

- ARIA labels on all buttons
- Keyboard navigation support
- Screen reader compatible
- Visual feedback for all states
- Error messages announced
- Touch-friendly on mobile

## Performance

### Optimization Tips

1. **Minimize CPU Usage**
   - Stop other audio/video applications
   - Close unnecessary browser tabs
   - Use hardware acceleration if available

2. **Reduce Latency**
   - Use wired microphone when possible
   - Reduce background applications
   - Use latest browser version

3. **Battery Saving** (Mobile)
   - Use auto-stop feature
   - Stop recording when done
   - Avoid very long recordings

## Requirements Fulfilled

This feature fulfills the following requirements from `requirements.md`:

- ✅ **R2.1** - Request microphone permission
- ✅ **R2.2** - Real-time speech-to-text conversion
- ✅ **R2.3** - Support Vietnamese and Lao languages
- ✅ **R2.4** - Visual recording indicator
- ✅ **R2.5** - Auto-stop after 30 seconds silence
- ✅ **R2.6** - Insert recognized text into input field
- ✅ **R2.7** - Allow editing before translation
- ✅ **R2.8** - Disable feature on unsupported browsers
- ✅ **R2.9** - Graceful error handling
- ✅ **R2.10** - Language selection before recording

## Credits

- Built with Web Speech Recognition API
- Part of LVTranslator v2.0 Static Web Enhancements
- Client-side only, no backend required

---

**Last Updated**: November 21, 2025  
**Version**: 1.0.0  
**Status**: ✅ Complete

