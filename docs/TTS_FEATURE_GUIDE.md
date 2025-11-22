# Text-to-Speech (TTS) Feature Guide

## Overview

The TTS feature allows users to listen to translated text with natural voice synthesis, supporting Vietnamese, Lao, and English languages.

## Features

### ✅ Core Functionality
- **Play/Pause/Stop Controls** - Full playback control
- **Text Highlighting** - Highlights words as they are spoken
- **Multi-language Support** - Vietnamese (vi-VN), Lao (lo-LA), English (en-US)
- **Browser Support** - Chrome, Edge, Safari (Web Speech API)

### ⚙️ Customizable Settings
- **Speed Control** - 0.5x to 2.0x playback speed
- **Pitch Control** - Adjust voice pitch (0.0 to 2.0)
- **Volume Control** - 0% to 100% volume
- **Voice Selection** - Choose from available system voices
- **Persistent Preferences** - Settings saved to localStorage

### 🎯 User Interface
- Clean, modern control panel
- Visual feedback during playback
- Keyboard shortcut support (Alt+P to play)
- Responsive design for mobile and desktop

## Usage

### Basic Usage

1. **Translate Text**
   - Enter text and translate as usual
   - Translation appears in output field

2. **Play Audio**
   - Click the 🔊 **Play** button
   - Or press **Alt+P** keyboard shortcut
   - Text will be spoken with highlighting

3. **Control Playback**
   - **Pause/Resume**: Click ⏸️ button
   - **Stop**: Click ⏹️ button

### Advanced Settings

1. **Open Settings Panel**
   - Click ⚙️ **Settings** button
   - Settings panel will expand

2. **Adjust Speed**
   - Use speed slider (0.5x - 2.0x)
   - Real-time value display
   - Setting is saved automatically

3. **Adjust Pitch & Volume**
   - Use pitch slider (0.0 - 2.0)
   - Use volume slider (0% - 100%)
   - Changes apply to next playback

4. **Select Voice**
   - Choose from dropdown of available voices
   - Voices are filtered by language
   - Default voice used if not specified

5. **Reset Settings**
   - Click 🔄 **Reset** button
   - All settings return to defaults

## Integration

### For Developers

#### 1. Import TTS Module

```javascript
import { initializeTTS, addTTSContainerToDOM } from './integration/tts-integration.js';
```

#### 2. Add TTS Container to DOM

```javascript
// Add TTS container to output panel
addTTSContainerToDOM();
```

#### 3. Initialize TTS

```javascript
// Initialize TTS service and component
const tts = await initializeTTS();

if (tts) {
  console.log('TTS initialized successfully');
} else {
  console.warn('TTS not supported');
}
```

#### 4. Example HTML Structure

```html
<div class="output-panel" id="outputPanel">
  <textarea id="outputText"></textarea>
  
  <!-- TTS container will be inserted here -->
  <div class="tts-container"></div>
</div>
```

### API Reference

#### TTSService Class

```javascript
class TTSService {
  // Initialize and load voices
  async init()
  
  // Speak text with optional highlighting callback
  speak(text, lang, onBoundary)
  
  // Playback controls
  pause()
  resume()
  stop()
  
  // Settings management
  updateSettings(settings)
  loadSettings()
  saveSettings()
  getSettings()
  
  // Voice management
  getVoices()
  getVoiceForLanguage(lang)
  getVoicesForLanguage(lang)
  
  // State
  getState()
  
  // Static method
  static isSupported()
}
```

#### Example Usage

```javascript
import TTSService from './src/services/TTSService.js';

// Create service
const tts = new TTSService();

// Initialize
await tts.init();

// Speak text
try {
  await tts.speak('Xin chào', 'vi-VN', (charIndex, charLength) => {
    console.log(`Highlighting: ${charIndex}-${charIndex + charLength}`);
  });
} catch (error) {
  console.error('TTS error:', error);
}

// Update settings
tts.updateSettings({
  rate: 1.2,  // 1.2x speed
  pitch: 1.0,
  volume: 0.8  // 80% volume
});
```

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Best support, multiple voices |
| Edge | ✅ Full | Windows voices available |
| Safari | ✅ Full | macOS and iOS voices |
| Firefox | ⚠️ Limited | Basic support, fewer voices |
| Opera | ✅ Full | Chromium-based |

### Checking Support

```javascript
if (TTSService.isSupported()) {
  // TTS is available
  initializeTTS();
} else {
  // Show fallback message
  showError('TTS not supported in this browser');
}
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Alt + P** | Play/Resume TTS |
| **Esc** | Stop TTS (if playing) |

## Troubleshooting

### No Voices Available

**Problem**: Voice dropdown is empty or only shows "Default"

**Solutions**:
1. Wait a few seconds for voices to load
2. Reload the page
3. Check browser permissions
4. Update browser to latest version

### TTS Not Speaking

**Problem**: Play button does nothing or shows error

**Solutions**:
1. Ensure output text is not empty
2. Check browser console for errors
3. Try different voice from dropdown
4. Check system audio/volume settings

### Text Not Highlighting

**Problem**: Text doesn't highlight during playback

**Solutions**:
1. Ensure output field has focus
2. Try clicking inside output text first
3. Some browsers may not support boundary events

### Playback Stops Immediately

**Problem**: Audio stops right after starting

**Solutions**:
1. Check if text contains special characters
2. Try with shorter text first
3. Clear browser cache
4. Disable browser extensions

## Performance Tips

1. **Shorter Texts** - Break long texts into paragraphs for better control
2. **Voice Selection** - Some voices are faster than others
3. **Rate Adjustment** - Faster rate = shorter playback time
4. **Browser Choice** - Chrome/Edge have best performance

## Accessibility

- All controls have ARIA labels
- Keyboard navigation supported
- Screen reader compatible
- High contrast mode compatible
- Touch-friendly on mobile (44px minimum targets)

## Privacy & Security

- **No External Calls** - Uses browser's built-in Web Speech API
- **No Data Collection** - Settings stored locally only
- **Offline Compatible** - Works without internet (after initial load)
- **No Server Required** - Pure client-side implementation

## Future Enhancements

Potential features for future versions:
- Multiple voice selection per language
- Custom voice speed presets
- Bookmark positions in long texts
- Download audio as file
- Advanced pronunciation dictionary
- SSML support for fine control

## Requirements Fulfilled

This feature fulfills the following requirements from `requirements.md`:

- ✅ **R1.1** - TTS button plays audio of translated text
- ✅ **R1.2** - Support for Vietnamese and Lao languages
- ✅ **R1.3** - Pause, resume, stop controls
- ✅ **R1.4** - Speech rate adjustment (0.5x-2.0x)
- ✅ **R1.5** - Pitch and volume adjustment
- ✅ **R1.6** - Visual indicator during playback
- ✅ **R1.7** - Text highlighting during reading
- ✅ **R1.8** - Error handling for unsupported browsers
- ✅ **R1.9** - Remember user preferences (localStorage)
- ✅ **R1.10** - Voice selection option

## Credits

- Built with Web Speech API
- Part of LVTranslator v2.0 Static Web Enhancements
- Client-side only, no backend required

---

**Last Updated**: November 21, 2025  
**Version**: 1.0.0  
**Status**: ✅ Complete

