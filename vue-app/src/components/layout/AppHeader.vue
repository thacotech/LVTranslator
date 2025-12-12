<template>
  <a-layout-header class="app-header" role="banner">
    <div class="header-content">
      <!-- Logo and Title -->
      <div class="header-left">
        <div class="logo-section">
          <h1 class="app-title">
            {{ $t('app.title') }}
          </h1>
          <span class="app-subtitle">
            {{ $t('app.subtitle') }}
          </span>
        </div>
      </div>

      <!-- Navigation Menu (Desktop) -->
      <nav class="header-center" id="navigation" role="navigation" aria-label="Main navigation">
        <a-menu
          v-model:selectedKeys="selectedMenuKeys"
          mode="horizontal"
          class="main-nav"
          :theme="settingsStore.isDarkMode ? 'dark' : 'light'"
        >
          <a-menu-item key="translate" @click="navigateTo('/')">
            <template #icon>
              <TranslationOutlined />
            </template>
            {{ $t('nav.translate') }}
          </a-menu-item>
          <a-menu-item key="history" @click="navigateTo('/history')">
            <template #icon>
              <HistoryOutlined />
            </template>
            {{ $t('nav.history') }}
          </a-menu-item>
          <a-menu-item key="settings" @click="navigateTo('/settings')">
            <template #icon>
              <SettingOutlined />
            </template>
            {{ $t('nav.settings') }}
          </a-menu-item>
        </a-menu>
      </nav>

      <!-- Controls Section -->
      <div class="header-right">
        <!-- Language Selector -->
        <a-dropdown :trigger="['click']" placement="bottomRight">
          <a-button 
            type="text" 
            class="language-selector"
            :aria-label="$t('accessibility.changeLanguage')"
            :title="$t('accessibility.changeLanguage')"
          >
            <template #icon>
              <GlobalOutlined />
            </template>
            {{ getCurrentLanguageLabel() }}
            <DownOutlined />
          </a-button>
          <template #overlay>
            <a-menu @click="handleLanguageChange">
              <a-menu-item 
                key="en" 
                :class="{ active: locale === 'en' }"
              >
                <span class="language-option">
                  🇺🇸 {{ $t('language.english') }}
                </span>
              </a-menu-item>
              <a-menu-item 
                key="vi" 
                :class="{ active: locale === 'vi' }"
              >
                <span class="language-option">
                  🇻🇳 {{ $t('language.vietnamese') }}
                </span>
              </a-menu-item>
              <a-menu-item 
                key="lo" 
                :class="{ active: locale === 'lo' }"
              >
                <span class="language-option">
                  🇱🇦 {{ $t('language.lao') }}
                </span>
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>

        <!-- Theme Toggle -->
        <a-button
          type="text"
          class="theme-toggle"
          @click="toggleTheme"
          :title="$t(settingsStore.isDarkMode ? 'theme.switchToLight' : 'theme.switchToDark')"
          :aria-label="$t(settingsStore.isDarkMode ? 'theme.switchToLight' : 'theme.switchToDark')"
        >
          <template #icon>
            <BulbFilled v-if="settingsStore.isDarkMode" />
            <BulbOutlined v-else />
          </template>
        </a-button>

        <!-- Mobile Menu Toggle -->
        <a-button
          type="text"
          class="mobile-menu-toggle"
          @click="toggleMobileMenu"
          :class="{ active: mobileMenuVisible }"
          :aria-label="$t('accessibility.toggleMobileMenu')"
          :aria-expanded="mobileMenuVisible"
          aria-controls="mobile-navigation"
        >
          <template #icon>
            <MenuOutlined />
          </template>
        </a-button>
      </div>
    </div>

    <!-- Mobile Navigation Menu -->
    <nav 
      id="mobile-navigation"
      class="mobile-nav"
      :class="{ visible: mobileMenuVisible }"
      role="navigation"
      aria-label="Mobile navigation"
      :aria-hidden="!mobileMenuVisible"
    >
      <a-menu
        v-model:selectedKeys="selectedMenuKeys"
        mode="vertical"
        :theme="settingsStore.isDarkMode ? 'dark' : 'light'"
        @click="closeMobileMenu"
      >
        <a-menu-item key="translate" @click="navigateTo('/')">
          <template #icon>
            <TranslationOutlined />
          </template>
          {{ $t('nav.translate') }}
        </a-menu-item>
        <a-menu-item key="history" @click="navigateTo('/history')">
          <template #icon>
            <HistoryOutlined />
          </template>
          {{ $t('nav.history') }}
        </a-menu-item>
        <a-menu-item key="settings" @click="navigateTo('/settings')">
          <template #icon>
            <SettingOutlined />
          </template>
          {{ $t('nav.settings') }}
        </a-menu-item>
      </a-menu>
    </nav>
  </a-layout-header>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, shallowRef, markRaw } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  Layout as ALayout,
  Menu as AMenu,
  Button as AButton,
  Dropdown as ADropdown
} from 'ant-design-vue'
import {
  TranslationOutlined,
  HistoryOutlined,
  SettingOutlined,
  GlobalOutlined,
  DownOutlined,
  BulbOutlined,
  BulbFilled,
  MenuOutlined
} from '@ant-design/icons-vue'
import { useSettingsStore } from '@/stores/settings'
import { useCachedComputed, useMemoizedFunction, useSelectiveWatch } from '@/composables/useOptimizedReactivity'
import type { Language } from '@/types'

const router = useRouter()
const route = useRoute()
const { t, locale } = useI18n()
const settingsStore = useSettingsStore()

// Component state - optimized
const selectedMenuKeys = shallowRef<string[]>([])
const mobileMenuVisible = ref(false)

// Memoized language label function for better performance
const getCurrentLanguageLabel = useCachedComputed(() => {
  switch (locale.value) {
    case 'en':
      return '🇺🇸 EN'
    case 'vi':
      return '🇻🇳 VI'
    case 'lo':
      return '🇱🇦 LO'
    default:
      return '🇺🇸 EN'
  }
}, { cacheKey: 'language-label', ttl: 5000 })

// Methods
function navigateTo(path: string) {
  router.push(path)
  closeMobileMenu()
}

function handleLanguageChange({ key }: { key: string }) {
  const newLanguage = key as Language
  settingsStore.setLanguage(newLanguage)
  locale.value = newLanguage
  
  // Save to localStorage for persistence
  localStorage.setItem('interfaceLanguage', newLanguage)
}

function toggleTheme() {
  settingsStore.toggleTheme()
}

function toggleMobileMenu() {
  mobileMenuVisible.value = !mobileMenuVisible.value
}

function closeMobileMenu() {
  mobileMenuVisible.value = false
}

// Memoized menu key update function
const updateSelectedMenuKey = useMemoizedFunction(
  (path: string) => {
    if (path === '/') {
      return ['translate']
    } else if (path.startsWith('/history')) {
      return ['history']
    } else if (path.startsWith('/settings')) {
      return ['settings']
    } else {
      return []
    }
  },
  [ref(route.path)]
)

// Optimized route watching - only update when path actually changes
useSelectiveWatch(
  () => route,
  (r) => r.path,
  (path) => {
    selectedMenuKeys.value = updateSelectedMenuKey(path)
  }
)

// Close mobile menu when clicking outside
function handleClickOutside(event: Event) {
  const target = event.target as HTMLElement
  const mobileNav = document.querySelector('.mobile-nav')
  const mobileToggle = document.querySelector('.mobile-menu-toggle')
  
  if (
    mobileMenuVisible.value &&
    mobileNav &&
    !mobileNav.contains(target) &&
    mobileToggle &&
    !mobileToggle.contains(target)
  ) {
    closeMobileMenu()
  }
}

// Lifecycle hooks
onMounted(() => {
  selectedMenuKeys.value = updateSelectedMenuKey(route.path)
  document.addEventListener('click', handleClickOutside)
})

// Cleanup
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.app-header {
  background: var(--header-bg);
  border-bottom: 1px solid var(--border-color);
  padding: 0;
  height: 64px;
  line-height: 64px;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.header-left {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
}

.logo-section {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 64px;
  line-height: 1.2;
}

.app-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: var(--primary-color);
  line-height: 1.2;
}

.app-subtitle {
  font-size: 12px;
  color: var(--text-color-secondary);
  line-height: 1;
  margin-top: -2px;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  max-width: 600px;
}

.main-nav {
  border-bottom: none;
  background: transparent;
  line-height: 62px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.language-selector,
.theme-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 40px;
  border-radius: 6px;
  transition: all 0.3s;
}

.language-selector:hover,
.theme-toggle:hover {
  background: var(--hover-bg);
}

.language-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mobile-menu-toggle {
  display: none;
  height: 40px;
  width: 40px;
  border-radius: 6px;
}

.mobile-nav {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--header-bg);
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-100%);
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 999;
}

.mobile-nav.visible {
  transform: translateY(0);
  opacity: 1;
}

/* Dark mode styles */
.dark-mode .app-header {
  background: var(--header-bg-dark);
  border-bottom-color: var(--border-color-dark);
}

.dark-mode .app-title {
  color: var(--primary-color-dark);
}

.dark-mode .language-selector:hover,
.dark-mode .theme-toggle:hover {
  background: var(--hover-bg-dark);
}

.dark-mode .mobile-nav {
  background: var(--header-bg-dark);
  border-bottom-color: var(--border-color-dark);
}

/* Responsive styles */
@media (max-width: 768px) {
  .header-content {
    padding: 0 16px;
  }
  
  .header-center {
    display: none;
  }
  
  .mobile-menu-toggle {
    display: flex;
  }
  
  .mobile-nav {
    display: block;
  }
  
  .app-title {
    font-size: 18px;
  }
  
  .app-subtitle {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .header-content {
    padding: 0 12px;
  }
  
  .app-title {
    font-size: 16px;
  }
  
  .app-subtitle {
    display: none;
  }
  
  .language-selector span:not(.language-option) {
    display: none;
  }
}

/* Active menu item styles */
:deep(.ant-menu-item-selected) {
  background-color: var(--primary-color-light) !important;
}

:deep(.ant-menu-item-selected::after) {
  border-bottom-color: var(--primary-color) !important;
}

/* Language dropdown active item */
.language-option.active {
  font-weight: 600;
  color: var(--primary-color);
}
</style>