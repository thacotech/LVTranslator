import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue({
      // Enable script setup and other optimizations
      script: {
        defineModel: true,
        propsDestructure: true
      }
    })
  ],
  
  // Base public path
  base: './',

  // Build configuration
  build: {
    target: 'es2015',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    }
  },

  // Dev server configuration
  server: {
    port: 3000,
    open: true,
    cors: true,
    hmr: {
      overlay: true
    }
  },
  
  // Optimization configuration
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'vue-i18n',
      'ant-design-vue'
    ]
  },

  // Preview server configuration
  preview: {
    port: 4173,
    open: true
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@views': resolve(__dirname, 'src/views'),
      '@stores': resolve(__dirname, 'src/stores'),
      '@services': resolve(__dirname, 'src/services'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@types': resolve(__dirname, 'src/types'),
      '@locales': resolve(__dirname, 'src/locales')
    }
  },

  // CSS configuration
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      less: {
        modifyVars: {
          // Ant Design Vue theme customization
          'primary-color': '#667eea',
          'link-color': '#667eea',
          'success-color': '#28a745',
          'warning-color': '#ffc107',
          'error-color': '#dc3545',
          'font-size-base': '16px',
          'border-radius-base': '8px'
        },
        javascriptEnabled: true
      }
    }
  },

  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },

  // Test configuration
  test: {
    globals: true,
    environment: 'jsdom'
  }
})