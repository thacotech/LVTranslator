import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

import App from './App.vue'
import router from './router'
import { configureNotifications } from '@/services/notificationService'
import { performanceMonitor, trackComponentLoad } from '@/utils/performanceMonitor'

// Import i18n messages
import en from '@/locales/en.json'
import vi from '@/locales/vi.json'
import lo from '@/locales/lo.json'

// Language detection function
function detectBrowserLanguage(): string {
  const browserLang = navigator.language || navigator.languages?.[0] || 'en'
  
  // Map browser language codes to our supported languages
  if (browserLang.startsWith('vi')) return 'vi'
  if (browserLang.startsWith('lo')) return 'lo'
  if (browserLang.startsWith('en')) return 'en'
  
  // Default fallback
  return 'en'
}

// Get initial locale with priority: localStorage > browser detection > fallback
function getInitialLocale(): string {
  const savedLanguage = localStorage.getItem('interfaceLanguage')
  if (savedLanguage && ['en', 'vi', 'lo'].includes(savedLanguage)) {
    return savedLanguage
  }
  
  return detectBrowserLanguage()
}

// Create i18n instance with enhanced configuration
const i18n = createI18n({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: 'en',
  globalInjection: true,
  messages: {
    en,
    vi,
    lo,
  },
  // Pluralization rules for different languages
  pluralRules: {
    'vi': (choice: number) => {
      // Vietnamese doesn't have plural forms like English
      return choice === 0 ? 0 : 1
    },
    'lo': (choice: number) => {
      // Lao doesn't have plural forms like English
      return choice === 0 ? 0 : 1
    },
    'en': (choice: number) => {
      // English plural rules: 0 = zero, 1 = one, 2 = other
      if (choice === 0) return 0
      if (choice === 1) return 1
      return 2
    }
  },
  // Number and date formatting
  numberFormats: {
    'en': {
      currency: {
        style: 'currency',
        currency: 'USD'
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    },
    'vi': {
      currency: {
        style: 'currency',
        currency: 'VND'
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    },
    'lo': {
      currency: {
        style: 'currency',
        currency: 'LAK'
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    }
  },
  datetimeFormats: {
    'en': {
      short: {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      },
      long: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric'
      }
    },
    'vi': {
      short: {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      },
      long: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric'
      }
    },
    'lo': {
      short: {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      },
      long: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric'
      }
    }
  }
})

// Create Pinia store
const pinia = createPinia()

// Create Vue app
const app = createApp(App)

// Use plugins
app.use(pinia)
app.use(router)
app.use(i18n)
app.use(Antd)

// Configure notifications
configureNotifications()

// Track app initialization
const appLoadTracker = trackComponentLoad('app-initialization')

// Mount app
app.mount('#app')

// Complete app load tracking
appLoadTracker()

// Performance monitoring available but not logging to console
// Use performanceMonitor.getPerformanceSummary() in dev tools if needed
