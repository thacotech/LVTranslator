import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

export interface AriaLiveRegion {
  id: string
  element: HTMLElement
  priority: 'polite' | 'assertive'
}

export function useScreenReader() {
  const { t } = useI18n()
  
  const liveRegions = ref<Map<string, AriaLiveRegion>>(new Map())
  const announcements = ref<string[]>([])

  function createLiveRegion(id: string, priority: 'polite' | 'assertive' = 'polite'): HTMLElement {
    // Check if region already exists
    const existing = liveRegions.value.get(id)
    if (existing) {
      return existing.element
    }

    const element = document.createElement('div')
    element.id = `aria-live-${id}`
    element.setAttribute('aria-live', priority)
    element.setAttribute('aria-atomic', 'true')
    element.className = 'sr-only'
    
    // Position off-screen but accessible to screen readers
    element.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `
    
    document.body.appendChild(element)
    
    const region: AriaLiveRegion = { id, element, priority }
    liveRegions.value.set(id, region)
    
    return element
  }

  function announce(message: string, priority: 'polite' | 'assertive' = 'polite', regionId = 'default') {
    if (!message.trim()) return

    const region = liveRegions.value.get(regionId) || createLiveRegion(regionId, priority)
    
    // Clear previous content first
    region.element.textContent = ''
    
    // Use setTimeout to ensure screen readers pick up the change
    setTimeout(() => {
      region.element.textContent = message
      announcements.value.push(message)
      
      // Keep only last 10 announcements for debugging
      if (announcements.value.length > 10) {
        announcements.value = announcements.value.slice(-10)
      }
    }, 100)
  }

  function announceTranslationStart(sourceLanguage: string, targetLanguage: string) {
    const message = t('accessibility.translationStarted', {
      from: sourceLanguage,
      to: targetLanguage
    })
    announce(message, 'polite', 'translation')
  }

  function announceTranslationComplete(translatedText: string, confidence?: number) {
    let message = t('accessibility.translationCompleted')
    
    if (confidence !== undefined) {
      message += ` ${t('accessibility.confidenceLevel', { level: Math.round(confidence * 100) })}`
    }
    
    announce(message, 'polite', 'translation')
  }

  function announceTranslationError(error: string) {
    const message = t('accessibility.translationFailed', { error })
    announce(message, 'assertive', 'translation')
  }

  function announceFileUpload(fileName: string, fileSize: string) {
    const message = t('accessibility.fileUploaded', { name: fileName, size: fileSize })
    announce(message, 'polite', 'file')
  }

  function announceFileProcessing(fileName: string) {
    const message = t('accessibility.fileProcessing', { name: fileName })
    announce(message, 'polite', 'file')
  }

  function announceFileProcessed(fileName: string, textLength: number) {
    const message = t('accessibility.fileProcessed', { 
      name: fileName, 
      characters: textLength 
    })
    announce(message, 'polite', 'file')
  }

  function announceNavigationChange(pageName: string) {
    const message = t('accessibility.navigatedTo', { page: pageName })
    announce(message, 'polite', 'navigation')
  }

  function announceSettingChange(setting: string, value: string) {
    const message = t('accessibility.settingChanged', { setting, value })
    announce(message, 'polite', 'settings')
  }

  function announceHistoryAction(action: string, count?: number) {
    let message = t(`accessibility.history.${action}`)
    
    if (count !== undefined) {
      message = t(`accessibility.history.${action}WithCount`, { count })
    }
    
    announce(message, 'polite', 'history')
  }

  function announceValidationError(field: string, error: string) {
    const message = t('accessibility.validationError', { field, error })
    announce(message, 'assertive', 'validation')
  }

  function announceKeyboardShortcut(shortcut: string, action: string) {
    const message = t('accessibility.shortcutActivated', { shortcut, action })
    announce(message, 'polite', 'shortcuts')
  }

  function setAriaLabel(element: HTMLElement, labelKey: string, params?: Record<string, any>) {
    const label = params ? t(labelKey, params) : t(labelKey)
    element.setAttribute('aria-label', label)
  }

  function setAriaDescription(element: HTMLElement, descriptionKey: string, params?: Record<string, any>) {
    const description = params ? t(descriptionKey, params) : t(descriptionKey)
    element.setAttribute('aria-describedby', description)
  }

  function setAriaExpanded(element: HTMLElement, expanded: boolean) {
    element.setAttribute('aria-expanded', expanded.toString())
  }

  function setAriaPressed(element: HTMLElement, pressed: boolean) {
    element.setAttribute('aria-pressed', pressed.toString())
  }

  function setAriaSelected(element: HTMLElement, selected: boolean) {
    element.setAttribute('aria-selected', selected.toString())
  }

  function setAriaChecked(element: HTMLElement, checked: boolean | 'mixed') {
    element.setAttribute('aria-checked', checked.toString())
  }

  function setAriaDisabled(element: HTMLElement, disabled: boolean) {
    element.setAttribute('aria-disabled', disabled.toString())
  }

  function setAriaHidden(element: HTMLElement, hidden: boolean) {
    if (hidden) {
      element.setAttribute('aria-hidden', 'true')
    } else {
      element.removeAttribute('aria-hidden')
    }
  }

  function setAriaInvalid(element: HTMLElement, invalid: boolean) {
    element.setAttribute('aria-invalid', invalid.toString())
  }

  function setAriaRequired(element: HTMLElement, required: boolean) {
    element.setAttribute('aria-required', required.toString())
  }

  function setAriaLive(element: HTMLElement, priority: 'off' | 'polite' | 'assertive') {
    element.setAttribute('aria-live', priority)
  }

  function setAriaAtomic(element: HTMLElement, atomic: boolean) {
    element.setAttribute('aria-atomic', atomic.toString())
  }

  function setAriaRelevant(element: HTMLElement, relevant: string) {
    element.setAttribute('aria-relevant', relevant)
  }

  function setRole(element: HTMLElement, role: string) {
    element.setAttribute('role', role)
  }

  function setTabIndex(element: HTMLElement, index: number) {
    element.setAttribute('tabindex', index.toString())
  }

  function createAriaDescribedBy(elementId: string, descriptionText: string): string {
    const descriptionId = `${elementId}-description`
    
    // Check if description element already exists
    let descriptionElement = document.getElementById(descriptionId)
    
    if (!descriptionElement) {
      descriptionElement = document.createElement('div')
      descriptionElement.id = descriptionId
      descriptionElement.className = 'sr-only'
      document.body.appendChild(descriptionElement)
    }
    
    descriptionElement.textContent = descriptionText
    
    return descriptionId
  }

  function removeAriaDescribedBy(descriptionId: string) {
    const element = document.getElementById(descriptionId)
    if (element) {
      document.body.removeChild(element)
    }
  }

  function focusAndAnnounce(element: HTMLElement, message?: string) {
    element.focus()
    
    if (message) {
      // Delay announcement to ensure focus is set first
      setTimeout(() => {
        announce(message, 'polite')
      }, 100)
    }
  }

  function createLandmark(element: HTMLElement, role: string, label?: string) {
    setRole(element, role)
    
    if (label) {
      element.setAttribute('aria-label', label)
    }
  }

  function createHeadingStructure(element: HTMLElement, level: number, text: string) {
    element.setAttribute('role', 'heading')
    element.setAttribute('aria-level', level.toString())
    element.textContent = text
  }

  function cleanupLiveRegions() {
    liveRegions.value.forEach(region => {
      if (region.element.parentNode) {
        document.body.removeChild(region.element)
      }
    })
    liveRegions.value.clear()
  }

  // Initialize default live regions
  onMounted(() => {
    createLiveRegion('default', 'polite')
    createLiveRegion('translation', 'polite')
    createLiveRegion('file', 'polite')
    createLiveRegion('navigation', 'polite')
    createLiveRegion('settings', 'polite')
    createLiveRegion('history', 'polite')
    createLiveRegion('validation', 'assertive')
    createLiveRegion('shortcuts', 'polite')
  })

  onUnmounted(() => {
    cleanupLiveRegions()
  })

  return {
    // Live regions and announcements
    announce,
    announceTranslationStart,
    announceTranslationComplete,
    announceTranslationError,
    announceFileUpload,
    announceFileProcessing,
    announceFileProcessed,
    announceNavigationChange,
    announceSettingChange,
    announceHistoryAction,
    announceValidationError,
    announceKeyboardShortcut,
    
    // ARIA attributes
    setAriaLabel,
    setAriaDescription,
    setAriaExpanded,
    setAriaPressed,
    setAriaSelected,
    setAriaChecked,
    setAriaDisabled,
    setAriaHidden,
    setAriaInvalid,
    setAriaRequired,
    setAriaLive,
    setAriaAtomic,
    setAriaRelevant,
    setRole,
    setTabIndex,
    
    // Utility functions
    createAriaDescribedBy,
    removeAriaDescribedBy,
    focusAndAnnounce,
    createLandmark,
    createHeadingStructure,
    
    // State
    announcements,
    liveRegions
  }
}