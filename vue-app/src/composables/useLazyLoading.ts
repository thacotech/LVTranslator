import { ref, onMounted, nextTick } from 'vue'

/**
 * Composable for managing lazy loading states and performance
 */
export function useLazyLoading() {
  const isLoading = ref(false)
  const loadingError = ref<string | null>(null)
  const loadStartTime = ref<number>(0)
  const loadDuration = ref<number>(0)

  /**
   * Start tracking loading performance
   */
  function startLoading() {
    isLoading.value = true
    loadingError.value = null
    loadStartTime.value = performance.now()
  }

  /**
   * Complete loading and calculate duration
   */
  function completeLoading() {
    loadDuration.value = performance.now() - loadStartTime.value
    isLoading.value = false
  }

  /**
   * Handle loading error
   */
  function handleLoadingError(error: Error) {
    loadingError.value = error.message
    isLoading.value = false
    console.error('Lazy loading error:', error)
  }

  /**
   * Preload a component for better UX
   */
  async function preloadComponent(componentLoader: () => Promise<any>) {
    try {
      startLoading()
      await componentLoader()
      completeLoading()
    } catch (error) {
      handleLoadingError(error as Error)
    }
  }

  /**
   * Check if component should be lazy loaded based on viewport
   */
  function shouldLazyLoad(element: HTMLElement | null): boolean {
    if (!element) return false
    
    const rect = element.getBoundingClientRect()
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight
    
    // Load if element is within viewport or close to it (200px buffer)
    return rect.top <= viewportHeight + 200
  }

  /**
   * Create intersection observer for lazy loading
   */
  function createLazyLoadObserver(
    callback: (entries: IntersectionObserverEntry[]) => void,
    options: IntersectionObserverInit = {}
  ): IntersectionObserver {
    const defaultOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '200px',
      threshold: 0.1,
      ...options
    }

    return new IntersectionObserver(callback, defaultOptions)
  }

  /**
   * Measure component loading performance
   */
  function measureLoadingPerformance(componentName: string) {
    const startTime = performance.now()
    
    return {
      complete: () => {
        const duration = performance.now() - startTime
        console.log(`Component ${componentName} loaded in ${duration.toFixed(2)}ms`)
        
        // Report to performance monitoring if available
        if (window.performance && window.performance.mark) {
          window.performance.mark(`component-${componentName}-loaded`)
          window.performance.measure(
            `component-${componentName}-load-time`,
            `component-${componentName}-start`,
            `component-${componentName}-loaded`
          )
        }
        
        return duration
      },
      start: () => {
        if (window.performance && window.performance.mark) {
          window.performance.mark(`component-${componentName}-start`)
        }
      }
    }
  }

  return {
    isLoading,
    loadingError,
    loadDuration,
    startLoading,
    completeLoading,
    handleLoadingError,
    preloadComponent,
    shouldLazyLoad,
    createLazyLoadObserver,
    measureLoadingPerformance
  }
}

/**
 * Composable for managing component visibility and lazy loading
 */
export function useComponentVisibility() {
  const isVisible = ref(false)
  const element = ref<HTMLElement | null>(null)
  const observer = ref<IntersectionObserver | null>(null)

  onMounted(() => {
    if (element.value) {
      observer.value = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            isVisible.value = entry.isIntersecting
          })
        },
        {
          root: null,
          rootMargin: '100px',
          threshold: 0.1
        }
      )

      observer.value.observe(element.value)
    }
  })

  function cleanup() {
    if (observer.value) {
      observer.value.disconnect()
      observer.value = null
    }
  }

  return {
    isVisible,
    element,
    cleanup
  }
}