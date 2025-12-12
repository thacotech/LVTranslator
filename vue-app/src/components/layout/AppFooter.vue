<template>
  <footer class="site-footer">
    © {{ currentYear }}
    <span>{{ $t('footer.allRightsReserved') }}</span>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const currentYear = computed(() => new Date().getFullYear())
</script>

<style scoped>
.site-footer {
  text-align: center;
  padding: 24px 0 10px 0;
  color: var(--color-text-secondary);
  font-size: 1rem;
  background: none;
  margin-top: var(--spacing-2xl);
}

body.dark-mode .site-footer {
  color: var(--color-primary);
}
</style>
