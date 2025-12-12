# LVTranslator Vue.js User Guide

## Welcome to LVTranslator v2.0

LVTranslator is a modern, AI-powered translation application that helps you translate between Vietnamese, Lao, and English languages. This new Vue.js version brings enhanced performance, better user experience, and many new features while maintaining all the functionality you love.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Basic Translation](#basic-translation)
3. [File Upload & Processing](#file-upload--processing)
4. [Translation History](#translation-history)
5. [Settings & Customization](#settings--customization)
6. [Advanced Features](#advanced-features)
7. [Accessibility Features](#accessibility-features)
8. [Keyboard Shortcuts](#keyboard-shortcuts)
9. [Troubleshooting](#troubleshooting)

## Getting Started

### First Launch

When you first open LVTranslator, you'll see:

1. **Privacy Policy Modal**: Read and accept the privacy policy to continue
2. **Main Interface**: Clean, modern interface with translation panels
3. **Language Selector**: Choose your preferred interface language (English, Vietnamese, or Lao)
4. **Theme Toggle**: Switch between light and dark modes

### Interface Overview

The application consists of several main areas:

- **Header**: Language selector, theme toggle, and navigation
- **Translation Panel**: Input and output areas for text translation
- **Control Buttons**: Translate, clear, copy, and language swap buttons
- **File Upload Section**: Upload documents for translation
- **History Panel**: Access your translation history
- **Settings**: Customize your experience

## Basic Translation

### Text Translation

1. **Select Languages**:
   - Choose source language from the left dropdown
   - Choose target language from the right dropdown
   - Supported languages: Vietnamese, Lao, English

2. **Enter Text**:
   - Type or paste text in the input area (left panel)
   - Character limit: 5,000 characters
   - Real-time character counter shows remaining characters

3. **Translate**:
   - Click the "Translate" button
   - Or use keyboard shortcut: `Ctrl + Enter`
   - Translation appears in the output area (right panel)

4. **Copy Results**:
   - Click "Copy Translation" button
   - Or use keyboard shortcut: `Ctrl + C` (when output is focused)

### Language Switching

- **Swap Languages**: Click the ⇄ button between panels to swap source and target languages
- **Auto-Detection**: The system can automatically detect the source language
- **Smart Switching**: When you select a language that matches the current target, languages automatically swap

### Enhanced Features

- **Real-time Validation**: Input validation with helpful error messages
- **Progress Indicators**: Visual feedback during translation
- **Error Recovery**: Automatic retry options for failed translations
- **Caching**: Repeated translations are served instantly from cache

## File Upload & Processing

### Supported File Types

- **Microsoft Word**: `.docx` files
- **PDF Documents**: `.pdf` files  
- **Images**: `.jpg`, `.jpeg`, `.png` files (with OCR text extraction)

### Upload Process

1. **Select File**:
   - Click "Choose File" button in the file upload section
   - Or drag and drop files directly onto the upload area
   - File size limit: 10MB per file

2. **File Processing**:
   - File information displays (name, size, type)
   - Text extraction begins automatically
   - Progress indicator shows processing status

3. **Review Extracted Text**:
   - Extracted text appears in a preview area
   - Review and edit if necessary
   - Text formatting is preserved where possible

4. **Translate Document**:
   - Click "Translate Extracted Text" button
   - Translation appears in a separate results area
   - Copy translated text using the dedicated copy button

### File Processing Features

- **Smart Text Extraction**: Advanced algorithms for accurate text extraction
- **Format Preservation**: Maintains paragraph structure and formatting
- **OCR for Images**: Optical Character Recognition for image files
- **Error Handling**: Clear error messages for unsupported or corrupted files

## Translation History

### Accessing History

- Click the "Translation History" button to open the history panel
- History automatically saves all your translations
- Maximum 50 recent translations stored locally

### History Features

1. **View Translations**:
   - See source and target text with language indicators
   - Timestamps show when translations were made
   - Preview shows first 50 characters of each text

2. **Reuse Translations**:
   - Click on any history item to load it back into the main interface
   - Click the ↩️ button for quick reuse
   - Languages automatically switch to match the historical translation

3. **Manage History**:
   - Delete individual items using the 🗑️ button
   - Clear all history with "Clear All" button
   - Confirmation dialogs prevent accidental deletion

### History Organization

- **Chronological Order**: Most recent translations appear first
- **Language Pairs**: Clear indicators show translation direction
- **Smart Grouping**: Similar translations are grouped together
- **Search & Filter**: Find specific translations quickly (coming soon)

## Settings & Customization

### Theme Settings

1. **Dark/Light Mode**:
   - Toggle between dark and light themes
   - System theme detection (follows your OS setting)
   - Smooth transitions between themes

2. **Font Settings**:
   - Adjust font size (Small, Medium, Large)
   - Automatic Lao font (Phetsarath OT) for Lao text
   - High contrast options for better readability

### Language Settings

1. **Interface Language**:
   - Choose between English, Vietnamese, or Lao interface
   - All UI elements translate to selected language
   - Language preference saved automatically

2. **Translation Preferences**:
   - Set default source and target languages
   - Auto-detection preferences
   - Translation quality settings

### Advanced Settings

1. **Performance**:
   - Enable/disable caching
   - Adjust animation preferences
   - Memory usage optimization

2. **Accessibility**:
   - Screen reader compatibility
   - Keyboard navigation preferences
   - Focus indicator settings

## Advanced Features

### Text-to-Speech (TTS)

1. **Enable TTS**:
   - TTS buttons appear next to text areas when available
   - Click the speaker icon to hear text pronunciation
   - Supports multiple voices and languages

2. **Voice Settings**:
   - Adjust speech rate and pitch
   - Select different voices for each language
   - Volume control

### Speech-to-Text (STT)

1. **Voice Input**:
   - Click the microphone icon to start voice input
   - Speak clearly in the selected source language
   - Real-time transcription appears in the input area

2. **STT Settings**:
   - Microphone sensitivity adjustment
   - Language-specific recognition settings
   - Noise cancellation options

### Batch Processing

1. **Multiple Translations**:
   - Queue multiple translation requests
   - Process files in batch mode
   - Export results in various formats

## Accessibility Features

### Keyboard Navigation

- **Tab Navigation**: Navigate through all interactive elements
- **Focus Indicators**: Clear visual focus indicators
- **Skip Links**: Jump to main content areas quickly

### Screen Reader Support

- **ARIA Labels**: Comprehensive labeling for screen readers
- **Live Regions**: Dynamic content announcements
- **Semantic Structure**: Proper heading hierarchy and landmarks

### Visual Accessibility

- **High Contrast**: Enhanced contrast ratios for better visibility
- **Font Scaling**: Adjustable font sizes
- **Color Independence**: Information not conveyed by color alone

## Keyboard Shortcuts

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Enter` | Translate text |
| `Ctrl + L` | Clear all text |
| `Ctrl + C` | Copy translation (when output focused) |
| `Ctrl + Shift + S` | Swap languages |
| `Ctrl + H` | Toggle history panel |
| `Ctrl + ,` | Open settings |
| `Ctrl + /` | Show keyboard shortcuts help |

### Navigation Shortcuts

| Shortcut | Action |
|----------|--------|
| `Tab` | Navigate forward |
| `Shift + Tab` | Navigate backward |
| `Enter` | Activate focused element |
| `Escape` | Close modals/panels |
| `Alt + 1` | Focus input area |
| `Alt + 2` | Focus output area |

### Accessibility Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt + S` | Skip to main content |
| `Alt + N` | Skip to navigation |
| `Alt + H` | Go to help |
| `F6` | Cycle through page regions |

## Troubleshooting

### Common Issues

#### Translation Not Working

**Problem**: Translation button doesn't work or shows errors

**Solutions**:
1. Check your internet connection
2. Verify API key configuration (for developers)
3. Try refreshing the page
4. Check if text exceeds character limit
5. Ensure source and target languages are different

#### File Upload Issues

**Problem**: Files won't upload or process correctly

**Solutions**:
1. Check file size (must be under 10MB)
2. Verify file format is supported (.docx, .pdf, .jpg, .png)
3. Try a different file
4. Clear browser cache
5. Disable browser extensions temporarily

#### Performance Issues

**Problem**: Application runs slowly or freezes

**Solutions**:
1. Close other browser tabs
2. Clear browser cache and cookies
3. Disable unnecessary browser extensions
4. Try using a different browser
5. Restart your browser

#### History Not Saving

**Problem**: Translation history doesn't save or load

**Solutions**:
1. Check if localStorage is enabled in your browser
2. Clear browser data and try again
3. Ensure you're not in private/incognito mode
4. Check available storage space
5. Try a different browser

### Browser Compatibility

**Recommended Browsers**:
- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

**Known Issues**:
- Some features may not work in Internet Explorer
- Voice features require microphone permissions
- File upload requires modern browser APIs

### Getting Help

#### Self-Help Resources

1. **Check Console**: Open browser developer tools (F12) and check for error messages
2. **Clear Data**: Try clearing browser cache and localStorage
3. **Update Browser**: Ensure you're using the latest browser version
4. **Disable Extensions**: Temporarily disable browser extensions

#### Contact Support

If you continue experiencing issues:

1. **GitHub Issues**: Report bugs at the project repository
2. **Email Support**: Contact the developer directly
3. **Community Forum**: Ask questions in the community
4. **Documentation**: Check the latest documentation

### Tips for Best Experience

1. **Regular Updates**: Keep your browser updated
2. **Stable Connection**: Use a stable internet connection for best results
3. **Proper Lighting**: Ensure good lighting when using camera features
4. **Clear Audio**: Use a good microphone for voice input
5. **Regular Cleanup**: Periodically clear old history and cache

## Conclusion

LVTranslator v2.0 provides a powerful, accessible, and user-friendly translation experience. With its modern Vue.js architecture, comprehensive features, and focus on accessibility, it's designed to meet all your translation needs efficiently.

For the latest updates, features, and support, visit our project repository or contact our support team.

**Happy Translating!** 🌐