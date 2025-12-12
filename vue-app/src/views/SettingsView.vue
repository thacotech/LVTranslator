<template>
  <div class="settings-view">
    <div class="settings-header">
      <h1>{{ $t('settings.title') }}</h1>
      <p>{{ $t('settings.description') }}</p>
    </div>
    
    <Suspense>
      <template #default>
        <SettingsModal :open="true" :is-embedded="true" />
      </template>
      <template #fallback>
        <div class="loading-container">
          <a-spin size="large" :tip="$t('common.loading')" />
        </div>
      </template>
    </Suspense>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { Spin as ASpin } from 'ant-design-vue'

// Lazy load the SettingsModal component
const SettingsModal = defineAsyncComponent(() => 
  import('@/components/common/SettingsModal.vue')
)
</script>

<style scoped>
.settings-view {
  padding: 24px;
}

.settings-header {
  margin-bottom: 24px;
}

.settings-header h1 {
  margin-bottom: 8px;
  color: var(--text-color);
}

.settings-header p {
  color: var(--text-color-secondary);
  margin-bottom: 0;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}
</style>