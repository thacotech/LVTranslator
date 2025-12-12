import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: {
        title: 'LVTranslator - Home',
        requiresAuth: false
      }
    },
    // Future routes can be added here with lazy loading
    {
      path: '/history',
      name: 'history',
      component: () => import('@/views/HistoryView.vue'),
      meta: {
        title: 'Translation History',
        requiresAuth: false
      }
    },
    {
      path: '/settings',
      name: 'settings', 
      component: () => import('@/views/SettingsView.vue'),
      meta: {
        title: 'Settings',
        requiresAuth: false
      }
    }
  ],
})

export default router
