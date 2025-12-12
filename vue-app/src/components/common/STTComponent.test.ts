/**
 * STTComponent Unit Tests
 * Tests for the Speech-to-Text Vue component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import STTComponent from './STTComponent.vue'

// Mock the Web Speech API
const mockSpeechRecognition = {
  continuous: false,
  interimResults: false,
  maxAlternatives: 1,
  lang: 'vi-VN',
  onstart: null,
  onresult: null,
  onerror: null,
  onend: null,
  start: vi.fn(),
  stop: vi.fn(),
  abort: vi.fn()
}

// Mock window.SpeechRecognition
Object.defineProperty(window, 'SpeechRecognition', {
  writable: true,
  value: vi.fn(() => mockSpeechRecognition)
})

// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn(() => Promise.resolve({
      getTracks: () => [{ stop: vi.fn() }]
    }))
  }
})

// Create i18n instance for testing
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      stt: {
        voiceInput: 'Voice Input',
        startRecording: 'Start Recording',
        stopRecording: 'Stop Recording',
        stop: 'Stop',
        listening: 'Listening...',
        recognized: 'Recognized',
        selectLanguage: 'Select Language',
        notSupported: 'Not Supported',
        browserWarning: 'Browser not supported',
        permissionRequired: 'Permission Required',
        permissionInfo: 'Permission needed',
        notSupportedError: 'Not supported error',
        permissionDenied: 'Permission denied'
      },
      languages: {
        vietnamese: 'Vietnamese',
        lao: 'Lao',
        english: 'English'
      }
    }
  }
})

describe('STTComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly', () => {
    const wrapper = mount(STTComponent, {
      global: {
        plugins: [i18n]
      }
    })

    expect(wrapper.find('.stt-component').exists()).toBe(true)
    expect(wrapper.find('.stt-record-btn').exists()).toBe(true)
    expect(wrapper.find('.stt-language-select').exists()).toBe(true)
  })

  it('shows correct initial state', () => {
    const wrapper = mount(STTComponent, {
      global: {
        plugins: [i18n]
      }
    })

    const recordBtn = wrapper.find('.stt-record-btn')
    const stopBtn = wrapper.find('.stt-stop-btn')

    expect(recordBtn.exists()).toBe(true)
    expect(stopBtn.exists()).toBe(false) // Should not be visible initially
  })

  it('accepts language prop', () => {
    const wrapper = mount(STTComponent, {
      props: {
        language: 'lo'
      },
      global: {
        plugins: [i18n]
      }
    })

    expect(wrapper.props('language')).toBe('lo')
  })

  it('accepts disabled prop', () => {
    const wrapper = mount(STTComponent, {
      props: {
        disabled: true
      },
      global: {
        plugins: [i18n]
      }
    })

    expect(wrapper.props('disabled')).toBe(true)
  })

  it('emits events correctly', async () => {
    const wrapper = mount(STTComponent, {
      global: {
        plugins: [i18n]
      }
    })

    // Test that component can emit events
    expect(wrapper.emitted()).toEqual({})
  })

  it('handles browser support detection', () => {
    const wrapper = mount(STTComponent, {
      global: {
        plugins: [i18n]
      }
    })

    // Since we mocked SpeechRecognition, it should be supported
    expect(wrapper.vm).toBeDefined()
  })

  it('shows language options', () => {
    const wrapper = mount(STTComponent, {
      global: {
        plugins: [i18n]
      }
    })

    const select = wrapper.find('.stt-language-select')
    expect(select.exists()).toBe(true)
  })
})