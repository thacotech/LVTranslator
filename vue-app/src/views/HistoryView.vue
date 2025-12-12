<template>
  <div class="history-view">
    <div class="history-header">
      <h1>{{ $t('history.title') }}</h1>
      <p>{{ $t('history.description') }}</p>
    </div>
    
    <Suspense>
      <template #default>
        <TranslationHistory />
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

// Lazy load the TranslationHistory component
const TranslationHistory = defineAsyncComponent(() => 
  import('@/components/history/TranslationHistory.vue')
)
</script>

<style scoped>
.history-view {
  padding: 24px;
}

.history-header {
  margin-bottom: 24px;
}

.history-header h1 {
  margin-bottom: 8px;
  color: var(--text-color);
}

.history-header p {
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