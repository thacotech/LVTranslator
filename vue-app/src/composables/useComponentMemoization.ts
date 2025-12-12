import { defineComponent, ref, computed, watchEffect, shallowRef, type PropType, type VNode } from 'vue'

/**
 * Composable for component memoization and optimization
 */

/**
 * Creates a memoized component wrapper that only re-renders when specific props change
 */
export function useMemoizedComponent<T extends Record<string, any>>(
  component: any,
  propKeys: (keyof T)[],
  options: {
    shallow?: boolean
    compareFunction?: (a: any, b: any) => boolean
  } = {}
) {
  const { shallow = false, compareFunction } = options
  
  return defineComponent({
    name: `Memoized${component.name || 'Component'}`,
    props: component.props,
    setup(props, { slots, emit, attrs }) {
      const memoizedProps = shallow ? shallowRef({}) : ref({})
      const shouldUpdate = ref(true)
      
      // Custom comparison function or default shallow comparison
      const compare = compareFunction || ((a: any, b: any) => {
        if (typeof a !== typeof b) return false
        if (a === b) return true
        
        if (Array.isArray(a) && Array.isArray(b)) {
          return a.length === b.length && a.every((item, index) => item === b[index])
        }
        
        if (typeof a === 'object' && a !== null && b !== null) {
          const keysA = Object.keys(a)
          const keysB = Object.keys(b)
          return keysA.length === keysB.length && 
                 keysA.every(key => compare(a[key], b[key]))
        }
        
        return false
      })
      
      // Watch for prop changes
      watchEffect(() => {
        const currentProps = propKeys.reduce((acc, key) => {
          acc[key] = props[key as string]
          return acc
        }, {} as any)
        
        if (!compare(memoizedProps.value, currentProps)) {
          memoizedProps.value = currentProps
          shouldUpdate.value = true
        } else {
          shouldUpdate.value = false
        }
      })
      
      return () => {
        if (!shouldUpdate.value) {
          return null // Skip re-render
        }
        
        return h(component, { ...props, ...attrs }, slots)
      }
    }
  })
}

/**
 * Creates a stable reference for objects to prevent unnecessary re-renders
 */
export function useStableObject<T extends Record<string, any>>(
  factory: () => T,
  deps: any[] = []
): T {
  const stableRef = shallowRef<T>()
  const depsRef = shallowRef(deps)
  
  const result = computed(() => {
    // Check if dependencies changed
    const currentDeps = deps
    const prevDeps = depsRef.value
    
    const depsChanged = !prevDeps || 
      currentDeps.length !== prevDeps.length ||
      currentDeps.some((dep, index) => dep !== prevDeps[index])
    
    if (depsChanged || !stableRef.value) {
      stableRef.value = factory()
      depsRef.value = currentDeps
    }
    
    return stableRef.value
  })
  
  return result.value
}

/**
 * Creates a memoized event handler to prevent child re-renders
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: any[] = []
): T {
  const callbackRef = shallowRef<T>(callback)
  const depsRef = shallowRef(deps)
  
  const stableCallback = computed(() => {
    const currentDeps = deps
    const prevDeps = depsRef.value
    
    const depsChanged = !prevDeps || 
      currentDeps.length !== prevDeps.length ||
      currentDeps.some((dep, index) => dep !== prevDeps[index])
    
    if (depsChanged) {
      callbackRef.value = callback
      depsRef.value = currentDeps
    }
    
    return callbackRef.value
  })
  
  return stableCallback.value
}

/**
 * Optimizes list rendering by providing stable keys and memoized items
 */
export function useOptimizedList<T>(
  items: T[],
  keyExtractor: (item: T, index: number) => string | number,
  options: {
    chunkSize?: number
    virtualScrolling?: boolean
    memoizeItems?: boolean
  } = {}
) {
  const { chunkSize = 50, virtualScrolling = false, memoizeItems = true } = options
  
  const memoizedItems = memoizeItems ? shallowRef<Map<string | number, T>>(new Map()) : null
  const visibleRange = ref({ start: 0, end: chunkSize })
  
  const optimizedItems = computed(() => {
    const result = items.map((item, index) => {
      const key = keyExtractor(item, index)
      
      if (memoizedItems) {
        // Use memoized version if available and unchanged
        const memoized = memoizedItems.value.get(key)
        if (memoized && Object.is(memoized, item)) {
          return { key, item: memoized, index }
        }
        
        // Update memoized cache
        memoizedItems.value.set(key, item)
      }
      
      return { key, item, index }
    })
    
    // Apply virtual scrolling if enabled
    if (virtualScrolling) {
      return result.slice(visibleRange.value.start, visibleRange.value.end)
    }
    
    return result
  })
  
  const updateVisibleRange = (start: number, end: number) => {
    visibleRange.value = { start, end }
  }
  
  return {
    optimizedItems,
    updateVisibleRange,
    totalCount: computed(() => items.length)
  }
}

/**
 * Prevents unnecessary re-renders by comparing component props
 */
export function useShallowEqual<T extends Record<string, any>>(
  props: T,
  prevProps?: T
): boolean {
  if (!prevProps) return false
  
  const keys1 = Object.keys(props)
  const keys2 = Object.keys(prevProps)
  
  if (keys1.length !== keys2.length) return false
  
  return keys1.every(key => props[key] === prevProps[key])
}

/**
 * Creates a render function that skips re-rendering when props haven't changed
 */
export function createMemoizedRender<T extends Record<string, any>>(
  renderFn: (props: T) => VNode,
  compareFn?: (prevProps: T, nextProps: T) => boolean
) {
  let lastProps: T | null = null
  let lastResult: VNode | null = null
  
  return (props: T): VNode => {
    const shouldUpdate = !lastProps || 
      (compareFn ? !compareFn(lastProps, props) : !useShallowEqual(props, lastProps))
    
    if (shouldUpdate) {
      lastResult = renderFn(props)
      lastProps = { ...props }
    }
    
    return lastResult!
  }
}

/**
 * Performance monitoring for component renders
 */
export function useRenderPerformance(componentName: string) {
  const renderCount = ref(0)
  const totalRenderTime = ref(0)
  const lastRenderTime = ref(0)
  
  const trackRender = () => {
    const start = performance.now()
    
    return {
      complete: () => {
        const duration = performance.now() - start
        renderCount.value++
        totalRenderTime.value += duration
        lastRenderTime.value = duration
        
        if (duration > 16) { // Warn about slow renders (>16ms)
          console.warn(`Slow render in ${componentName}: ${duration.toFixed(2)}ms`)
        }
        
        return duration
      }
    }
  }
  
  const getStats = () => ({
    renderCount: renderCount.value,
    totalRenderTime: totalRenderTime.value,
    averageRenderTime: renderCount.value > 0 ? totalRenderTime.value / renderCount.value : 0,
    lastRenderTime: lastRenderTime.value
  })
  
  return {
    trackRender,
    getStats,
    renderCount: computed(() => renderCount.value),
    averageRenderTime: computed(() => 
      renderCount.value > 0 ? totalRenderTime.value / renderCount.value : 0
    )
  }
}