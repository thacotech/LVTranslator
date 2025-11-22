/**
 * Translation Memory Integration
 * Integrates Translation Memory into the main application
 * Requirements: 3.1, 3.2, 3.7, 3.8
 */

import TranslationMemoryService from '../src/services/TranslationMemoryService.js';
import TranslationMemoryComponent from '../src/components/TranslationMemoryComponent.js';

/**
 * Initialize Translation Memory
 */
export function initializeTranslationMemory() {
  // Create service
  const memoryService = new TranslationMemoryService();

  // Find or create container
  let memoryContainer = document.querySelector('.memory-container');
  if (!memoryContainer) {
    memoryContainer = document.createElement('div');
    memoryContainer.className = 'memory-container';
    memoryContainer.style.display = 'none';
    document.body.appendChild(memoryContainer);
  }

  // Create component
  const memoryComponent = new TranslationMemoryComponent(memoryService, memoryContainer);

  // Add button to toggle memory panel
  addMemoryToggleButton(memoryComponent);

  // Setup autocomplete suggestions
  setupAutocompleteSuggestions(memoryService);

  console.log('Translation Memory initialized');

  return {
    service: memoryService,
    component: memoryComponent
  };
}

/**
 * Add toggle button for Memory panel
 */
function addMemoryToggleButton(memoryComponent) {
  // Find a suitable place to add button (e.g., toolbar)
  const toolbar = document.querySelector('.toolbar') || 
                  document.querySelector('.controls') ||
                  document.querySelector('.header');

  if (!toolbar) {
    console.warn('No suitable place found for Memory button');
    return;
  }

  const btn = document.createElement('button');
  btn.className = 'btn btn-memory';
  btn.innerHTML = `
    <span class="icon">📝</span>
    <span class="label">Memory</span>
  `;
  btn.title = 'Translation Memory (Ctrl+M)';
  btn.addEventListener('click', () => memoryComponent.toggle());

  toolbar.appendChild(btn);
}

/**
 * Setup autocomplete suggestions from memory
 */
function setupAutocompleteSuggestions(memoryService) {
  const inputField = document.getElementById('inputText');
  if (!inputField) return;

  let suggestionBox = null;

  inputField.addEventListener('input', (e) => {
    const text = e.target.value;
    const sourceLang = document.getElementById('sourceLangSelector')?.value || 'vi';

    // Get suggestions
    const suggestions = memoryService.getSuggestions(text, sourceLang);

    if (suggestions.length > 0) {
      showSuggestions(suggestions, inputField);
    } else {
      hideSuggestions();
    }
  });

  function showSuggestions(suggestions, inputField) {
    // Remove existing suggestion box
    hideSuggestions();

    // Create suggestion box
    suggestionBox = document.createElement('div');
    suggestionBox.className = 'memory-suggestions';
    suggestionBox.innerHTML = suggestions.map(item => `
      <div class="memory-suggestion-item" data-id="${item.id}">
        <div class="memory-suggestion-text">${item.sourceText}</div>
        <div class="memory-suggestion-translation">${item.translatedText}</div>
      </div>
    `).join('');

    // Position below input field
    const rect = inputField.getBoundingClientRect();
    suggestionBox.style.position = 'absolute';
    suggestionBox.style.top = `${rect.bottom + window.scrollY}px`;
    suggestionBox.style.left = `${rect.left + window.scrollX}px`;
    suggestionBox.style.width = `${rect.width}px`;

    document.body.appendChild(suggestionBox);

    // Add click handlers
    suggestionBox.querySelectorAll('.memory-suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        const memoryItem = memoryService.getItem(id);
        if (memoryItem) {
          inputField.value = memoryItem.sourceText;
          inputField.dispatchEvent(new Event('input', { bubbles: true }));
          memoryService.useItem(id);
        }
        hideSuggestions();
      });
    });
  }

  function hideSuggestions() {
    if (suggestionBox) {
      suggestionBox.remove();
      suggestionBox = null;
    }
  }

  // Hide suggestions on blur or click outside
  document.addEventListener('click', (e) => {
    if (e.target !== inputField && !suggestionBox?.contains(e.target)) {
      hideSuggestions();
    }
  });
}

/**
 * Add "Save to Memory" button near translation output
 */
export function addSaveToMemoryButton(memoryService) {
  const outputPanel = document.querySelector('#outputPanel') ||
                      document.querySelector('.output-panel');

  if (!outputPanel) return;

  const btn = document.createElement('button');
  btn.className = 'btn btn-save-memory';
  btn.innerHTML = `
    <span class="icon">💾</span>
    <span class="label">Save to Memory</span>
  `;
  btn.title = 'Save this translation to Memory (Ctrl+S)';
  
  btn.addEventListener('click', () => {
    const inputText = document.getElementById('inputText')?.value;
    const outputText = document.getElementById('outputText')?.value;
    const sourceLang = document.getElementById('sourceLangSelector')?.value || 'vi';
    const targetLang = document.getElementById('targetLangSelector')?.value || 'lo';

    if (!inputText || !outputText) {
      alert('Please complete a translation first');
      return;
    }

    try {
      memoryService.addItem({
        sourceText: inputText,
        translatedText: outputText,
        sourceLang,
        targetLang,
        category: 'General'
      });

      // Show success message
      if (window.showToast) {
        window.showToast('Saved to Translation Memory', 'success');
      } else {
        alert('Saved to Translation Memory');
      }
    } catch (error) {
      if (window.showToast) {
        window.showToast(error.message, 'error');
      } else {
        alert(error.message);
      }
    }
  });

  outputPanel.appendChild(btn);

  // Keyboard shortcut (Ctrl+S)
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      btn.click();
    }
  });
}

export default {
  initializeTranslationMemory,
  addSaveToMemoryButton
};

