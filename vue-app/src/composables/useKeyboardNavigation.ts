import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  metaKey?: boolean
  action: () => void
  description: string
  category: string
}

export function useKeyboardNavigation() {
  const router = useRouter()
  const { t } = useI18n()
  
  const shortcuts = ref<KeyboardShortcut[]>([])
  const focusableElements = ref<HTMLElement[]>([])
  const currentFocusIndex = ref(-1)
  const isShortcutHelpVisible = ref(false)

  // Default keyboard shortcuts
  const defaultShortcuts: KeyboardShortcut[] = [
    // Navigation shortcuts
    {
      key: '1',
      altKey: true,
      action: () => router.push('/'),
      description: 'Navigate to Translation',
      category: 'Navigation'
    },
    {
      key: '2',
      altKey: true,
      action: () => router.push('/history'),
      description: 'Navigate to History',
      category: 'Navigation'
    },
    {
      key: '3',
      altKey: true,
      action: () => router.push('/settings'),
      description: 'Navigate to Settings',
      category: 'Navigation'
    },
    // Translation shortcuts
    {
      key: 'Enter',
      ctrlKey: true,
      action: () => {
        const event = new CustomEvent('keyboard-translate')
        document.dispatchEvent(event)
      },
      description: 'Translate text',
      category: 'Translation'
    },
    {
      key: 'l',
      ctrlKey: true,
      action: () => {
        const event = new CustomEvent('keyboard-swap-languages')
        document.dispatchEvent(event)
      },
      description: 'Swap languages',
      category: 'Translation'
    },
    {
      key: 'c',
      ctrlKey: true,
      shiftKey: true,
      action: () => {
        const event = new CustomEvent('keyboard-copy-translation')
        document.dispatchEvent(event)
      },
      description: 'Copy translation',
      category: 'Translation'
    },
    // File operations
    {
      key: 'o',
      ctrlKey: true,
      action: () => {
        const event = new CustomEvent('keyboard-open-file')
        document.dispatchEvent(event)
      },
      description: 'Open file',
      category: 'File'
    },
    // Accessibility shortcuts
    {
      key: 'h',
      altKey: true,
      action: () => toggleShortcutHelp(),
      description: 'Show keyboard shortcuts help',
      category: 'Accessibility'
    },
    {
      key: 'Escape',
      action: () => {
        // Close modals, dropdowns, etc.
        const event = new CustomEvent('keyboard-escape')
        document.dispatchEvent(event)
        isShortcutHelpVisible.value = false
      },
      description: 'Close dialogs/modals',
      category: 'Accessibility'
    },
    // Focus navigation
    {
      key: 'Tab',
      shiftKey: true,
      action: () => focusPrevious(),
      description: 'Focus previous element',
      category: 'Focus'
    },
    {
      key: 'Tab',
      action: () => focusNext(),
      description: 'Focus next element',
      category: 'Focus'
    }
  ]

  function registerShortcut(shortcut: KeyboardShortcut) {
    shortcuts.value.push(shortcut)
  }

  function unregisterShortcut(key: string, modifiers?: Partial<Pick<KeyboardShortcut, 'ctrlKey' | 'altKey' | 'shiftKey' | 'metaKey'>>) {
    shortcuts.value = shortcuts.value.filter(shortcut => {
      if (shortcut.key !== key) return true
      
      if (modifiers) {
        return !(
          (modifiers.ctrlKey === undefined || shortcut.ctrlKey === modifiers.ctrlKey) &&
          (modifiers.altKey === undefined || shortcut.altKey === modifiers.altKey) &&
          (modifiers.shiftKey === undefined || shortcut.shiftKey === modifiers.shiftKey) &&
          (modifiers.metaKey === undefined || shortcut.metaKey === modifiers.metaKey)
        )
      }
      
      return false
    })
  }

  function handleKeyDown(event: KeyboardEvent) {
    // Skip if user is typing in an input field (unless it's a specific shortcut)
    const target = event.target as HTMLElement
    const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true'
    
    // Find matching shortcut
    const matchingShortcut = shortcuts.value.find(shortcut => {
      return (
        shortcut.key === event.key &&
        (shortcut.ctrlKey === undefined || shortcut.ctrlKey === event.ctrlKey) &&
        (shortcut.altKey === undefined || shortcut.altKey === event.altKey) &&
        (shortcut.shiftKey === undefined || shortcut.shiftKey === event.shiftKey) &&
        (shortcut.metaKey === undefined || shortcut.metaKey === event.metaKey)
      )
    })

    if (matchingShortcut) {
      // Allow certain shortcuts even in input fields
      const allowedInInputs = ['Enter', 'Escape', 'Tab']
      const isCtrlShortcut = event.ctrlKey || event.altKey || event.metaKey
      
      if (!isInputField || allowedInInputs.includes(event.key) || isCtrlShortcut) {
        event.preventDefault()
        matchingShortcut.action()
      }
    }
  }

  function updateFocusableElements() {
    const selectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="link"]:not([disabled])',
      '.ant-btn:not(.ant-btn-disabled)',
      '.ant-input:not(.ant-input-disabled)',
      '.ant-select:not(.ant-select-disabled)'
    ].join(', ')

    const elements = Array.from(document.querySelectorAll(selectors)) as HTMLElement[]
    
    // Filter out hidden elements
    focusableElements.value = elements.filter(element => {
      const style = window.getComputedStyle(element)
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        element.offsetParent !== null &&
        !element.hasAttribute('aria-hidden')
      )
    })
  }

  function focusNext() {
    updateFocusableElements()
    if (focusableElements.value.length === 0) return

    currentFocusIndex.value = (currentFocusIndex.value + 1) % focusableElements.value.length
    focusableElements.value[currentFocusIndex.value]?.focus()
  }

  function focusPrevious() {
    updateFocusableElements()
    if (focusableElements.value.length === 0) return

    currentFocusIndex.value = currentFocusIndex.value <= 0 
      ? focusableElements.value.length - 1 
      : currentFocusIndex.value - 1
    focusableElements.value[currentFocusIndex.value]?.focus()
  }

  function focusElement(selector: string) {
    const element = document.querySelector(selector) as HTMLElement
    if (element) {
      element.focus()
      return true
    }
    return false
  }

  function focusFirstElement() {
    updateFocusableElements()
    if (focusableElements.value.length > 0) {
      currentFocusIndex.value = 0
      focusableElements.value[0].focus()
    }
  }

  function focusLastElement() {
    updateFocusableElements()
    if (focusableElements.value.length > 0) {
      currentFocusIndex.value = focusableElements.value.length - 1
      focusableElements.value[currentFocusIndex.value].focus()
    }
  }

  function trapFocus(containerSelector: string) {
    const container = document.querySelector(containerSelector) as HTMLElement
    if (!container) return

    const focusableInContainer = container.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>

    if (focusableInContainer.length === 0) return

    const firstElement = focusableInContainer[0]
    const lastElement = focusableInContainer[focusableInContainer.length - 1]

    function handleTabKey(event: KeyboardEvent) {
      if (event.key !== 'Tab') return

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)
    
    // Focus first element
    firstElement.focus()

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }

  function toggleShortcutHelp() {
    isShortcutHelpVisible.value = !isShortcutHelpVisible.value
    
    if (isShortcutHelpVisible.value) {
      nextTick(() => {
        const helpModal = document.querySelector('.keyboard-shortcuts-modal')
        if (helpModal) {
          trapFocus('.keyboard-shortcuts-modal')
        }
      })
    }
  }

  function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    
    document.body.appendChild(announcement)
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  function setPageTitle(title: string) {
    document.title = `${title} - ${t('app.title')}`
    announceToScreenReader(`${t('accessibility.navigatedTo')} ${title}`)
  }

  function skipToContent() {
    const mainContent = document.querySelector('main, [role="main"], .main-content') as HTMLElement
    if (mainContent) {
      mainContent.focus()
      mainContent.scrollIntoView()
    }
  }

  // Initialize shortcuts
  onMounted(() => {
    shortcuts.value = [...defaultShortcuts]
    document.addEventListener('keydown', handleKeyDown)
    updateFocusableElements()
    
    // Update focusable elements when DOM changes
    const observer = new MutationObserver(() => {
      updateFocusableElements()
    })
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled', 'tabindex', 'aria-hidden']
    })

    // Cleanup observer on unmount
    onUnmounted(() => {
      observer.disconnect()
    })
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })

  return {
    shortcuts,
    isShortcutHelpVisible,
    registerShortcut,
    unregisterShortcut,
    focusNext,
    focusPrevious,
    focusElement,
    focusFirstElement,
    focusLastElement,
    trapFocus,
    toggleShortcutHelp,
    announceToScreenReader,
    setPageTitle,
    skipToContent,
    updateFocusableElements
  }
}