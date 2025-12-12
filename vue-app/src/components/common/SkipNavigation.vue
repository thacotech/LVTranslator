<template>
  <div class="skip-navigation">
    <a 
      href="#main-content"
      class="skip-link"
      @click="skipToContent"
      @keydown.enter="skipToContent"
    >
      {{ $t('accessibility.skipToContent') }}
    </a>
    <a 
      href="#navigation"
      class="skip-link"
      @click="skipToNavigation"
      @keydown.enter="skipToNavigation"
    >
      {{ $t('accessibility.skipToNavigation') }}
    </a>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useKeyboardNavigation } from '@/composables/useKeyboardNavigation'

const { t } = useI18n()
const { announceToScreenReader } = useKeyboardNavigation()

function skipToContent(event?: Event) {
  event?.preventDefault()
  
  const mainContent = document.querySelector('#main-content, main, [role="main"], .main-content') as HTMLElement
  if (mainContent) {
    mainContent.focus()
    mainContent.scrollIntoView({ behavior: 'smooth' })
    announceToScreenReader(t('accessibility.skippedToContent'))
  }
}

function skipToNavigation(event?: Event) {
  event?.preventDefault()
  
  const navigation = document.querySelector('#navigation, nav, [role="navigation"], .main-nav') as HTMLElement
  if (navigation) {
    navigation.focus()
    navigation.scrollIntoView({ behavior: 'smooth' })
    announceToScreenReader(t('accessibility.skippedToNavigation'))
  }
}
</script>

<style scoped>
.skip-navigation {
  position: absolute;
  top: -100px;
  left: 0;
  z-index: 9999;
}

.skip-link {
  position: absolute;
  top: 0;
  left: 0;
  background: var(--color-primary);
  color: white;
  padding: 8px 16px;
  text-decoration: none;
  font-weight: 600;
  border-radius: 0 0 4px 0;
  transform: translateY(-100%);
  transition: transform 0.3s ease;
  z-index: 10000;
}

.skip-link:focus {
  transform: translateY(0);
  outline: 2px solid var(--color-warning);
  outline-offset: 2px;
}

.skip-link:hover {
  background: var(--color-primary-dark);
  text-decoration: underline;
}

.skip-link + .skip-link {
  left: 140px; /* Offset for multiple skip links */
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .skip-link {
    border: 2px solid white;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .skip-link {
    transition: none;
  }
}
</style>