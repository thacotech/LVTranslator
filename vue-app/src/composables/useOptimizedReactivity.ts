import { ref, computed, watch, shallowRef, shallowReactive, readonly, markRaw, nextTick, unref, reactive, toRaw, toRef, toRefs, type Ref, type ComputedRef } from 'vue'

/**
 * Composable for optimized Vue reactivity patterns
 */

/**
 * Creates a debounced reactive reference
 */
export function useDebouncedRef<T>(initialValue: T, delay = 300): [Ref<T>, Ref<T>] {
  const immediate = ref(initialValue)
  const debounced = ref(initialValue)
  
  let timeoutId: number | null = null
  
  watch(immediate, (newValue) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = window.setTimeout(() => {
      debounced.value = newValue
      timeoutId = null
    }, delay)
  })
  
  return [immediate, debounced]
}

/**
 * Creates a throttled reactive reference
 */
export function useThrottledRef<T>(initialValue: T, delay = 100): [Ref<T>, Ref<T>] {
  const immediate = ref(initialValue)
  const throttled = ref(initialValue)
  
  let lastUpdate = 0
  let timeoutId: number | null = null
  
  watch(immediate, (newValue) => {
    const now = Date.now()
    const timeSinceLastUpdate = now - lastUpdate
    
    if (timeSinceLastUpdate >= delay) {
      throttled.value = newValue
      lastUpdate = now
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      timeoutId = window.setTimeout(() => {
        throttled.value = newValue
        lastUpdate = Date.now()
        timeoutId = null
      }, delay - timeSinceLastUpdate)
    }
  })
  
  return [immediate, throttled]
}

/**
 * Creates a shallow reactive object for better performance with large objects
 */
export function useShallowReactive<T extends object>(initialValue: T) {
  return shallowReactive(initialValue)
}

/**
 * Creates a shallow ref for objects that don't need deep reactivity
 */
export function useShallowRef<T>(initialValue: T) {
  return shallowRef(initialValue)
}

/**
 * Creates a computed property with caching optimization
 */
export function useCachedComputed<T>(
  getter: () => T,
  options: {
    cacheKey?: string
    ttl?: number // Time to live in milliseconds
  } = {}
): ComputedRef<T> {
  const { cacheKey, ttl = 5000 } = options
  
  if (cacheKey && ttl > 0) {
    let cachedValue: T
    let cacheTime = 0
    
    return computed(() => {
      const now = Date.now()
      
      if (now - cacheTime > ttl) {
        cachedValue = getter()
        cacheTime = now
      }
      
      return cachedValue
    })
  }
  
  return computed(getter)
}

/**
 * Creates a readonly reactive reference to prevent accidental mutations
 */
export function useReadonlyRef<T>(source: Ref<T>) {
  return readonly(source)
}

/**
 * Optimized watcher that only triggers when specific properties change
 */
export function useSelectiveWatch<T extends object>(
  source: Ref<T> | (() => T),
  selector: (value: T) => any,
  callback: (newValue: any, oldValue: any) => void,
  options?: { immediate?: boolean; deep?: boolean }
) {
  const selectedValue = computed(() => {
    const sourceValue = unref(source)
    return selector(sourceValue)
  })
  
  return watch(selectedValue, callback, options)
}

/**
 * Batches multiple reactive updates to prevent excessive re-renders
 */
export function useBatchedUpdates() {
  const pendingUpdates = new Set<() => void>()
  let isScheduled = false
  
  const scheduleUpdate = (updateFn: () => void) => {
    pendingUpdates.add(updateFn)
    
    if (!isScheduled) {
      isScheduled = true
      nextTick(() => {
        const updates = Array.from(pendingUpdates)
        pendingUpdates.clear()
        isScheduled = false
        
        updates.forEach(update => update())
      })
    }
  }
  
  return { scheduleUpdate }
}

/**
 * Creates a reactive reference with automatic cleanup
 */
export function useAutoCleanupRef<T>(
  initialValue: T,
  cleanup?: (value: T) => void
): Ref<T> {
  const refValue = ref(initialValue)
  
  if (cleanup) {
    watch(refValue, (newValue, oldValue) => {
      if (oldValue !== undefined && oldValue !== newValue) {
        cleanup(oldValue)
      }
    })
  }
  
  return refValue
}

/**
 * Creates a memoized function with reactive dependencies
 */
export function useMemoizedFunction<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  deps: Ref<any>[]
): (...args: TArgs) => TReturn {
  let cachedResult: TReturn
  let cachedArgs: TArgs
  let lastDepsValues: any[]
  
  return (...args: TArgs): TReturn => {
    const currentDepsValues = deps.map(dep => dep.value)
    
    // Check if dependencies or arguments changed
    const depsChanged = !lastDepsValues || 
      lastDepsValues.some((val, index) => val !== currentDepsValues[index])
    const argsChanged = !cachedArgs || 
      args.some((arg, index) => arg !== cachedArgs[index])
    
    if (depsChanged || argsChanged) {
      cachedResult = fn(...args)
      cachedArgs = args
      lastDepsValues = currentDepsValues
    }
    
    return cachedResult
  }
}

/**
 * Creates a reactive reference that only updates when the value actually changes
 */
export function useStableRef<T>(
  initialValue: T,
  compareFn?: (a: T, b: T) => boolean
): Ref<T> {
  const refValue = ref(initialValue)
  const compare = compareFn || ((a, b) => a === b)
  
  return computed({
    get: () => refValue.value,
    set: (newValue) => {
      if (!compare(refValue.value, newValue)) {
        refValue.value = newValue
      }
    }
  }) as Ref<T>
}

/**
 * Creates a reactive object with optimized property access
 */
export function useOptimizedReactive<T extends Record<string, any>>(
  initialValue: T,
  options: {
    shallowKeys?: (keyof T)[]
    readonlyKeys?: (keyof T)[]
    computedKeys?: Record<keyof T, () => any>
  } = {}
) {
  const { shallowKeys = [], readonlyKeys = [], computedKeys = {} } = options
  
  const reactiveObj = reactive({} as T)
  
  // Initialize regular reactive properties
  Object.keys(initialValue).forEach(key => {
    if (!shallowKeys.includes(key) && !readonlyKeys.includes(key) && !computedKeys[key]) {
      reactiveObj[key] = initialValue[key]
    }
  })
  
  // Add shallow reactive properties
  shallowKeys.forEach(key => {
    if (initialValue[key] !== undefined) {
      reactiveObj[key] = shallowRef(initialValue[key]).value
    }
  })
  
  // Add readonly properties
  readonlyKeys.forEach(key => {
    if (initialValue[key] !== undefined) {
      Object.defineProperty(reactiveObj, key, {
        value: readonly(ref(initialValue[key])).value,
        writable: false,
        enumerable: true,
        configurable: false
      })
    }
  })
  
  // Add computed properties
  Object.entries(computedKeys).forEach(([key, getter]) => {
    Object.defineProperty(reactiveObj, key, {
      get: computed(getter).value,
      enumerable: true,
      configurable: false
    })
  })
  
  return reactiveObj
}

/**
 * Performance monitoring for reactive operations
 */
export function useReactivityPerformance() {
  const metrics = ref({
    computedEvaluations: 0,
    watcherTriggers: 0,
    rerenders: 0
  })
  
  const trackComputed = <T>(name: string, computedFn: () => T) => {
    return computed(() => {
      const start = performance.now()
      const result = computedFn()
      const duration = performance.now() - start
      
      metrics.value.computedEvaluations++
      
      if (duration > 10) { // Log slow computations
        console.warn(`Slow computed property "${name}": ${duration.toFixed(2)}ms`)
      }
      
      return result
    })
  }
  
  const trackWatcher = <T>(
    name: string,
    source: Ref<T> | (() => T),
    callback: (newValue: T, oldValue: T) => void,
    options?: any
  ) => {
    return watch(source, (newValue, oldValue) => {
      const start = performance.now()
      callback(newValue, oldValue)
      const duration = performance.now() - start
      
      metrics.value.watcherTriggers++
      
      if (duration > 5) { // Log slow watchers
        console.warn(`Slow watcher "${name}": ${duration.toFixed(2)}ms`)
      }
    }, options)
  }
  
  return {
    metrics: readonly(metrics),
    trackComputed,
    trackWatcher
  }
}

// Re-export reactive utilities
export { markRaw, nextTick, unref, toRaw, toRef, toRefs } from 'vue'