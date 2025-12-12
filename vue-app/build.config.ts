/**
 * Build Configuration for LVTranslator Vue.js Application
 * 
 * This file contains build-specific configurations and utilities
 * for different environments and deployment scenarios.
 */

import type { BuildOptions, UserConfig } from 'vite'

// Build environment types
export type BuildEnvironment = 'development' | 'staging' | 'production'

// Build configuration interface
export interface BuildConfig {
  environment: BuildEnvironment
  sourcemap: boolean
  minify: boolean | 'terser' | 'esbuild'
  target: string | string[]
  chunkSizeWarningLimit: number
  enableCompression: boolean
  enableAnalyzer: boolean
  dropConsole: boolean
  dropDebugger: boolean
}

// Environment-specific build configurations
export const buildConfigs: Record<BuildEnvironment, BuildConfig> = {
  development: {
    environment: 'development',
    sourcemap: true,
    minify: false,
    target: 'modules',
    chunkSizeWarningLimit: 1000,
    enableCompression: false,
    enableAnalyzer: false,
    dropConsole: false,
    dropDebugger: false
  },
  
  staging: {
    environment: 'staging',
    sourcemap: true,
    minify: 'terser',
    target: 'es2020',
    chunkSizeWarningLimit: 750,
    enableCompression: true,
    enableAnalyzer: true,
    dropConsole: false,
    dropDebugger: true
  },
  
  production: {
    environment: 'production',
    sourcemap: false,
    minify: 'terser',
    target: 'esnext',
    chunkSizeWarningLimit: 500,
    enableCompression: true,
    enableAnalyzer: true,
    dropConsole: true,
    dropDebugger: true
  }
}

// Get build configuration for environment
export function getBuildConfig(environment: BuildEnvironment): BuildConfig {
  return buildConfigs[environment] || buildConfigs.production
}

// Generate Vite build options
export function generateBuildOptions(config: BuildConfig): BuildOptions {
  return {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: config.sourcemap,
    minify: config.minify,
    target: config.target,
    chunkSizeWarningLimit: config.chunkSizeWarningLimit,
    cssCodeSplit: true,
    reportCompressedSize: config.environment === 'production',
    manifest: config.environment === 'production',
    
    // Terser options for production builds
    ...(config.minify === 'terser' && {
      terserOptions: {
        compress: {
          drop_console: config.dropConsole,
          drop_debugger: config.dropDebugger,
          pure_funcs: config.dropConsole ? ['console.log', 'console.info', 'console.debug'] : [],
          passes: config.environment === 'production' ? 2 : 1
        },
        mangle: {
          safari10: true
        },
        format: {
          comments: false
        }
      }
    }),
    
    rollupOptions: {
      output: {
        // Manual chunks for optimal code splitting
        manualChunks: (id: string) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // Vue ecosystem
            if (id.includes('vue/') && !id.includes('vue-router') && !id.includes('vue-i18n')) {
              return 'vendor-vue-core'
            }
            if (id.includes('vue-router') || id.includes('pinia')) {
              return 'vendor-vue-ecosystem'
            }
            
            // Ant Design Vue
            if (id.includes('ant-design-vue')) {
              if (id.includes('/form/') || id.includes('/input/') || id.includes('/select/')) {
                return 'vendor-antd-forms'
              }
              if (id.includes('/table/') || id.includes('/list/') || id.includes('/tree/')) {
                return 'vendor-antd-data'
              }
              if (id.includes('/modal/') || id.includes('/drawer/') || id.includes('/notification/')) {
                return 'vendor-antd-feedback'
              }
              return 'vendor-antd-core'
            }
            
            if (id.includes('@ant-design/icons-vue')) {
              return 'vendor-antd-icons'
            }
            
            // i18n
            if (id.includes('vue-i18n') || id.includes('@intlify')) {
              return 'vendor-i18n'
            }
            
            // File processing libraries
            if (id.includes('mammoth') || id.includes('pdfjs-dist')) {
              return 'vendor-file-processing'
            }
            
            // Utilities
            if (id.includes('dompurify')) {
              return 'vendor-security'
            }
            if (id.includes('lz-string')) {
              return 'vendor-compression'
            }
            if (id.includes('fast-check')) {
              return 'vendor-testing'
            }
            
            return 'vendor-misc'
          }
          
          // Application chunks
          if (id.includes('/src/components/')) {
            if (id.includes('/components/translation/')) {
              return 'components-translation'
            }
            if (id.includes('/components/file/')) {
              return 'components-file'
            }
            if (id.includes('/components/history/')) {
              return 'components-history'
            }
            if (id.includes('/components/layout/')) {
              return 'components-layout'
            }
            if (id.includes('/components/common/')) {
              return 'components-common'
            }
          }
          
          if (id.includes('/src/services/')) {
            if (id.includes('translationService') || id.includes('fileProcessorService')) {
              return 'services-core'
            }
            return 'services-utils'
          }
          
          if (id.includes('/src/stores/')) {
            return 'stores'
          }
          
          if (id.includes('/src/composables/')) {
            return 'composables'
          }
          
          if (id.includes('/src/utils/')) {
            return 'utils'
          }
        },
        
        // Optimize file naming
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          if (facadeModuleId) {
            if (facadeModuleId.includes('/views/')) {
              const viewName = facadeModuleId.split('/views/')[1].split('.')[0].toLowerCase()
              return `views/${viewName}-[hash].js`
            }
          }
          return 'chunks/[name]-[hash].js'
        },
        
        assetFileNames: (assetInfo) => {
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name || '')) {
            return 'images/[name]-[hash][extname]'
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name || '')) {
            return 'fonts/[name]-[hash][extname]'
          }
          if (/\.css$/i.test(assetInfo.name || '')) {
            return 'styles/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },
        
        entryFileNames: 'js/[name]-[hash].js'
      },
      
      // Tree shaking configuration
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false
      }
    }
  }
}

// Performance optimization utilities
export const performanceOptimizations = {
  // Preload critical resources
  generatePreloadLinks: (chunks: string[]) => {
    return chunks.map(chunk => `<link rel="preload" href="${chunk}" as="script">`)
  },
  
  // Generate resource hints
  generateResourceHints: () => {
    return [
      '<link rel="dns-prefetch" href="//generativelanguage.googleapis.com">',
      '<link rel="preconnect" href="https://generativelanguage.googleapis.com" crossorigin>'
    ]
  },
  
  // Critical CSS extraction
  extractCriticalCSS: (html: string) => {
    // Implementation would extract above-the-fold CSS
    return html
  }
}

// Bundle analysis utilities
export const bundleAnalysis = {
  // Analyze chunk sizes
  analyzeChunkSizes: (bundle: Record<string, any>) => {
    const analysis = {
      totalSize: 0,
      chunks: [] as Array<{ name: string; size: number; type: string }>
    }
    
    Object.entries(bundle).forEach(([fileName, chunk]) => {
      if (chunk.type === 'chunk') {
        const size = Buffer.byteLength(chunk.code, 'utf8')
        analysis.totalSize += size
        analysis.chunks.push({
          name: fileName,
          size,
          type: chunk.type
        })
      }
    })
    
    return analysis
  },
  
  // Generate size report
  generateSizeReport: (analysis: any) => {
    const report = {
      totalSizeKB: Math.round(analysis.totalSize / 1024),
      largestChunks: analysis.chunks
        .sort((a: any, b: any) => b.size - a.size)
        .slice(0, 10)
        .map((chunk: any) => ({
          ...chunk,
          sizeKB: Math.round(chunk.size / 1024)
        }))
    }
    
    return report
  }
}

// Environment-specific optimizations
export const environmentOptimizations = {
  development: {
    enableHMR: true,
    enableSourcemaps: true,
    enableLinting: true,
    enableTypeChecking: true
  },
  
  staging: {
    enableHMR: false,
    enableSourcemaps: true,
    enableLinting: true,
    enableTypeChecking: true,
    enableCompression: true,
    enableAnalytics: true
  },
  
  production: {
    enableHMR: false,
    enableSourcemaps: false,
    enableLinting: false,
    enableTypeChecking: true,
    enableCompression: true,
    enableAnalytics: true,
    enableCDN: true,
    enableCaching: true
  }
}

export default {
  buildConfigs,
  getBuildConfig,
  generateBuildOptions,
  performanceOptimizations,
  bundleAnalysis,
  environmentOptimizations
}