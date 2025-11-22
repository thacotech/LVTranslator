/**
 * TTS Integration
 * Integrates TTS functionality into the main application
 * Requirements: 1.1, 1.2, 1.8, 1.10
 */

import TTSService from '../src/services/TTSService.js';
import TTSComponent from '../src/components/TTSComponent.js';

/**
 * Initialize and integrate TTS into the application
 */
export async function initializeTTS() {
  // Check if TTS is supported
  if (!TTSService.isSupported()) {
    console.warn('Text-to-Speech is not supported in this browser');
    // Hide TTS controls if not supported
    const ttsContainer = document.querySelector('.tts-container');
    if (ttsContainer) {
      ttsContainer.style.display = 'none';
    }
    return null;
  }

  // Create TTS service
  const ttsService = new TTSService();
  
  // Initialize TTS service (load voices)
  await ttsService.init();

  // Find TTS container in the output panel
  const ttsContainer = document.querySelector('.tts-container');
  if (!ttsContainer) {
    console.error('TTS container not found in DOM');
    return null;
  }

  // Create TTS component
  const ttsComponent = new TTSComponent(ttsService, ttsContainer);

  console.log('TTS initialized successfully');

  return {
    service: ttsService,
    component: ttsComponent
  };
}

/**
 * Add TTS container to output panel if not exists
 */
export function addTTSContainerToDOM() {
  // Find output panel
  const outputPanel = document.querySelector('#outputPanel') || 
                      document.querySelector('.output-panel') ||
                      document.querySelector('.translation-output');

  if (!outputPanel) {
    console.error('Output panel not found');
    return;
  }

  // Check if TTS container already exists
  if (document.querySelector('.tts-container')) {
    console.log('TTS container already exists');
    return;
  }

  // Create TTS container
  const ttsContainer = document.createElement('div');
  ttsContainer.className = 'tts-container';
  
  // Insert after output textarea
  const outputTextarea = outputPanel.querySelector('#outputText') ||
                         outputPanel.querySelector('textarea');
  
  if (outputTextarea && outputTextarea.parentNode) {
    outputTextarea.parentNode.insertBefore(
      ttsContainer,
      outputTextarea.nextSibling
    );
  } else {
    // Append to output panel
    outputPanel.appendChild(ttsContainer);
  }

  console.log('TTS container added to DOM');
}

/**
 * Setup TTS keyboard shortcuts
 * Alt+P: Play TTS
 */
export function setupTTSKeyboardShortcuts(ttsComponent) {
  // Already handled in TTSComponent, but can add more shortcuts here if needed
  console.log('TTS keyboard shortcuts active (Alt+P to play)');
}

// Export for use in main app
export default {
  initializeTTS,
  addTTSContainerToDOM,
  setupTTSKeyboardShortcuts
};

