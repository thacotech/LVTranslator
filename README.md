# LVTranslator

<div align="center">

**A modern, AI-powered Vietnamese ↔ Lao translation web application**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-active-success.svg)]()

[Features](#features) • [Demo](#demo) • [Installation](#installation) • [Usage](#usage) • [API Configuration](#api-configuration) • [Contributing](#contributing)

</div>

---

## 📖 Overview

LVTranslator is a comprehensive web-based translation tool designed specifically for Vietnamese and Lao language pairs. Built with modern web technologies and powered by Google's Gemini AI, it provides accurate, context-aware translations with a beautiful, user-friendly interface.

The application features proper Lao script rendering using the **Phetsarath OT** font, ensuring accurate display of Lao characters across all platforms.

## ✨ Features

### 🌐 Translation Capabilities
- **Bidirectional Translation**: Seamlessly translate between Vietnamese and Lao in both directions
- **AI-Powered**: Utilizes Google Gemini API for accurate, context-aware translations
- **Multiple Input Methods**:
  - Direct text input via textarea
  - Document upload support (`.docx` files)
  - PDF file text extraction (`.pdf` files)
  - Image text recognition via OCR (`.jpg`, `.png`, `.jpeg`, `.gif`, `.webp`)

### 🎨 User Interface
- **Modern Design**: Clean, responsive interface with smooth animations
- **Dark/Light Mode**: Toggle between themes for comfortable viewing in any lighting
- **Multilingual Interface**: Switch between Vietnamese, Lao, and English UI languages
- **Mobile Responsive**: Fully optimized for desktop, tablet, and mobile devices
- **Accessibility**: Keyboard navigation and screen reader support

### 📝 Advanced Features
- **Translation History**: Automatic saving of translation history with timestamps
- **Copy to Clipboard**: One-click copying of translated text
- **Swap Languages**: Quick button to reverse translation direction
- **Character Counter**: Real-time character count for input text
- **File Information Display**: Shows uploaded file name, size, and format
- **Clear Functions**: Easy clearing of input, output, and history

### 🔤 Font Support
- **Phetsarath OT Font**: Custom Lao font integration for proper script rendering
- **Cross-browser Compatibility**: Consistent display across all modern browsers
- **Fallback Support**: Graceful degradation for unsupported browsers

## 🚀 Demo

Simply open `index.html` in any modern web browser to start using the application. No server setup required!

## 📁 Project Structure

```
LVTranslator/
├── front/
│   └── Phetsarath OT.ttf          # Lao language font file
├── index.html                      # Main application file (SPA)
├── README.md                       # Documentation (this file)
└── LICENSE                         # License file
```

### File Descriptions

- **`front/Phetsarath OT.ttf`**: Custom TrueType font for proper Lao language display. This font ensures accurate rendering of Lao characters, diacritics, and special symbols.
  
- **`index.html`**: Single-page application containing all HTML, CSS, and JavaScript. Includes:
  - Complete UI markup
  - Responsive CSS styling with CSS variables for theming
  - JavaScript classes for translation logic and history management
  - API integration with Google Gemini
  - File handling for DOCX, PDF, and image uploads

## 🛠️ Installation

### Prerequisites

- A modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Internet connection (required for API calls)
- Google Gemini API key (for translation functionality)

### Quick Start

1. **Clone or Download** the repository:
   ```bash
   git clone https://github.com/yourusername/LVTranslator.git
   cd LVTranslator
   ```

2. **Open the application**:
   - Simply double-click `index.html`, or
   - Right-click `index.html` → Open with → Your preferred browser

3. **Configure API Key** (see [API Configuration](#api-configuration))

That's it! No build process, no dependencies to install.

### Optional: Serve Locally

For development or testing with a local server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (with http-server)
npx http-server -p 8000

# Using PHP
php -S localhost:8000
```

Then navigate to `http://localhost:8000` in your browser.

## 📚 Usage

### Basic Translation

1. **Select Language Direction**:
   - Choose source language (Vietnamese or Lao)
   - Choose target language (Lao or Vietnamese)
   - Or use the swap button (⇄) to reverse direction

2. **Enter Text**:
   - Type or paste text in the input area
   - Character count updates automatically

3. **Translate**:
   - Click the "Translate" button
   - View translation in the output area
   - Copy translated text with one click

### File Upload Translation

#### Document Files (.docx)
1. Click the file upload icon
2. Select a `.docx` file
3. Text is automatically extracted
4. Click translate to get the translation

#### PDF Files (.pdf)
1. Click the file upload icon
2. Select a `.pdf` file
3. Text is extracted from all pages
4. Click translate to process

#### Image Files (.jpg, .png, etc.)
1. Click the file upload icon
2. Select an image file
3. OCR extracts text from the image
4. Click translate to convert

### Using Translation History

- All translations are automatically saved
- Access history from the history panel
- Click any history item to load it
- Clear history with the clear button
- History persists across browser sessions

### Changing Theme

- Click the theme toggle button (☀️/🌙)
- Switches between light and dark modes
- Preference is saved automatically

### Switching Interface Language

- Click the language dropdown
- Select: Vietnamese (VI), Lao (LO), or English (EN)
- Interface updates immediately
- Setting is preserved on reload

## 🔑 API Configuration

LVTranslator uses Google's Gemini API for translations. You'll need to configure your API key:

### Getting an API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### Setting the API Key

Open `index.html` and locate this line (around line 2900):

```javascript
const API_KEY = "YOUR_API_KEY_HERE";
```

Replace `YOUR_API_KEY_HERE` with your actual API key:

```javascript
const API_KEY = "AIzaSyC...your_actual_key_here";
```

### API Rate Limits

- Free tier: 60 requests per minute
- Keep this in mind when translating large documents
- The app includes basic error handling for rate limits

## 🎨 Customization

### Changing Colors

Edit CSS variables in the `:root` selector (lines 16-98):

```css
:root {
  --primary-hue: 230;        /* Change primary color hue */
  --secondary-hue: 280;      /* Change secondary color hue */
  /* ... more variables */
}
```

### Modifying Layout

All styles are embedded in the `<style>` section. The design uses:
- CSS Grid and Flexbox for layout
- CSS Custom Properties for theming
- Media queries for responsive design

### Adding New Languages

To add a new interface language:

1. Locate the `translations` object in JavaScript
2. Add your language code and translations
3. Update the language selector dropdown

## 🧪 Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Fully Supported |
| Firefox | 88+ | ✅ Fully Supported |
| Safari | 14+ | ✅ Fully Supported |
| Edge | 90+ | ✅ Fully Supported |
| Opera | 76+ | ✅ Fully Supported |
| IE 11 | - | ❌ Not Supported |

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Reporting Bugs

1. Check if the bug has already been reported
2. Open a new issue with detailed information:
   - Browser and version
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable

### Suggesting Features

- Open an issue with the `enhancement` label
- Describe the feature and its benefits
- Discuss implementation approaches

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/AmazingFeature`
3. Make your changes
4. Test thoroughly
5. Commit with clear messages: `git commit -m 'Add some AmazingFeature'`
6. Push to the branch: `git push origin feature/AmazingFeature`
7. Open a Pull Request

### Development Guidelines

- Maintain the existing code style
- Comment complex logic
- Test on multiple browsers
- Keep the single-file structure (don't split into multiple files)
- Ensure responsive design works

## 📄 License

This project uses the **Phetsarath OT** font. Please verify the font license before redistribution or commercial use.

The application code is available under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for powering the translation engine
- **Phetsarath OT Font** creators for Lao script support
- **Mammoth.js** for DOCX parsing
- **PDF.js** by Mozilla for PDF text extraction
- All contributors who help improve this project

## 📞 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/LVTranslator/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/LVTranslator/discussions)

## 🔄 Changelog

### Version 1.0.0 (Current)
- ✨ Initial release
- 🌐 Vietnamese ↔ Lao translation
- 📄 File upload support (DOCX, PDF, Images)
- 🎨 Dark/light theme
- 📝 Translation history
- 🌍 Multilingual interface (VI/LO/EN)

---

<div align="center">

**Made with ❤️ for the Vietnamese and Lao communities**

⭐ Star this repo if you find it helpful!

</div>
