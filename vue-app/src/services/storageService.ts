import type { 
  StorageService as IStorageService,
  StorageInfo,
  CacheEntry,
  CacheOptions
} from '@/types'

export class StorageService implements IStorageService {
  private storage: Storage
  private compressionEnabled: boolean
  private maxItems: number
  private maxAge: number
  private warningThreshold: number

  constructor() {
    this.storage = window.localStorage
    this.compressionEnabled = true
    this.maxItems = 50
    this.maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
    this.warningThreshold = 0.8 // 80% of quota
  }

  async save(key: string, data: any): Promise<void> {
    try {
      const dataToStore = {
        _compressed: false,
        value: data,
        _timestamp: Date.now()
      }

      // Compress if enabled and beneficial
      if (this.compressionEnabled && this.shouldCompress(data)) {
        const compressed = this.compressData(data)
        dataToStore._compressed = true
        dataToStore.value = compressed
      }

      this.storage.setItem(key, JSON.stringify(dataToStore))
      
      // Check quota after storing
      await this.checkQuota()
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded')
        // Try to free up space and retry
        await this.cleanup()
        try {
          this.storage.setItem(key, JSON.stringify(data))
        } catch (retryError) {
          console.error('Failed to store even after cleanup:', retryError)
          throw new Error('Storage quota exceeded and cleanup failed')
        }
      } else {
        console.error(`Error setting item ${key}:`, error)
        throw error
      }
    }
  }

  async load<T>(key: string): Promise<T | null> {
    try {
      const raw = this.storage.getItem(key)
      if (!raw) {
        return null
      }

      const data = JSON.parse(raw)

      // Check if data has compression metadata
      if (data._compressed && this.compressionEnabled) {
        return this.decompressData(data.value) as T
      }

      return (data._compressed ? data.value : data) as T
    } catch (error) {
      console.error(`Error getting item ${key}:`, error)
      return null
    }
  }

  async remove(key: string): Promise<void> {
    try {
      this.storage.removeItem(key)
    } catch (error) {
      console.error(`Error removing item ${key}:`, error)
      throw error
    }
  }

  async clear(): Promise<void> {
    try {
      this.storage.clear()
    } catch (error) {
      console.error('Error clearing storage:', error)
      throw error
    }
  }

  async getStorageInfo(): Promise<StorageInfo> {
    let totalSize = 0
    const items: Record<string, number> = {}

    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i)
      if (key) {
        const value = this.storage.getItem(key)
        if (value) {
          const size = new Blob([value]).size
          totalSize += size
          items[key] = size
        }
      }
    }

    // Estimate quota (5MB is typical for localStorage)
    const quota = 5 * 1024 * 1024
    const available = quota - totalSize

    return {
      used: totalSize,
      available: Math.max(0, available),
      quota: quota
    }
  }

  // Additional utility methods

  has(key: string): boolean {
    return this.storage.getItem(key) !== null
  }

  keys(): string[] {
    const keys: string[] = []
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i)
      if (key) {
        keys.push(key)
      }
    }
    return keys
  }

  async cleanup(options: { maxAge?: number; maxItems?: number; pattern?: RegExp } = {}): Promise<{
    removed: number
    freedSpace: number
    remainingItems: number
  }> {
    const {
      maxAge = this.maxAge,
      maxItems = this.maxItems,
      pattern = null
    } = options

    const now = Date.now()
    let removed = 0
    let freedSpace = 0

    // Get all items with timestamps
    const items: Array<{ key: string; timestamp: number; size: number }> = []
    
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i)
      if (!key) continue
      
      // Skip system keys
      if (key.startsWith('_')) {
        continue
      }

      // Filter by pattern if provided
      if (pattern && !key.match(pattern)) {
        continue
      }

      try {
        const raw = this.storage.getItem(key)
        if (raw) {
          const data = JSON.parse(raw)
          const timestamp = data._timestamp || 0
          const size = new Blob([raw]).size

          items.push({ key, timestamp, size })
        }
      } catch (error) {
        // Invalid data, mark for removal
        items.push({ key, timestamp: 0, size: 0 })
      }
    }

    // Sort by timestamp (oldest first)
    items.sort((a, b) => a.timestamp - b.timestamp)

    // Remove items older than maxAge
    for (const item of items) {
      if (item.timestamp && now - item.timestamp > maxAge) {
        freedSpace += item.size
        this.storage.removeItem(item.key)
        removed++
      }
    }

    // If still over maxItems, remove oldest items
    const remaining = items.filter(item => this.storage.getItem(item.key) !== null)
    if (remaining.length > maxItems) {
      const toRemove = remaining.slice(0, remaining.length - maxItems)
      for (const item of toRemove) {
        freedSpace += item.size
        this.storage.removeItem(item.key)
        removed++
      }
    }

    return {
      removed,
      freedSpace,
      remainingItems: this.storage.length
    }
  }

  private compressData(data: any): string {
    const json = typeof data === 'string' ? data : JSON.stringify(data)
    
    // Use LZ-String if available
    if (typeof (window as any).LZString !== 'undefined') {
      return (window as any).LZString.compressToUTF16(json)
    }

    // Fallback: simple run-length encoding for repetitive data
    return this.simpleCompress(json)
  }

  private decompressData(compressed: string): any {
    try {
      // Try LZ-String first
      if (typeof (window as any).LZString !== 'undefined') {
        const decompressed = (window as any).LZString.decompressFromUTF16(compressed)
        return JSON.parse(decompressed)
      }

      // Fallback: simple decompression
      const json = this.simpleDecompress(compressed)
      return JSON.parse(json)
    } catch (error) {
      console.error('Decompression error:', error)
      return null
    }
  }

  private simpleCompress(str: string): string {
    // Very basic run-length encoding
    return str.replace(/(.)\1+/g, (match, char) => {
      return match.length > 3 ? `${char}#${match.length}#` : match
    })
  }

  private simpleDecompress(str: string): string {
    return str.replace(/(.)\#(\d+)\#/g, (match, char, count) => {
      return char.repeat(parseInt(count))
    })
  }

  private shouldCompress(data: any): boolean {
    const json = typeof data === 'string' ? data : JSON.stringify(data)
    // Only compress if data is larger than 1KB
    return json.length > 1024
  }

  private async checkQuota(): Promise<boolean> {
    const storageInfo = await this.getStorageInfo()
    const usage = storageInfo.used / storageInfo.quota
    
    if (usage > this.warningThreshold) {
      console.warn(`localStorage usage at ${(usage * 100).toFixed(2)}%. Consider cleaning up old data.`)
      return false
    }
    
    return true
  }

  // Configuration methods
  setCompression(enabled: boolean): void {
    this.compressionEnabled = enabled
  }

  setMaxItems(max: number): void {
    this.maxItems = max
  }

  setMaxAge(days: number): void {
    this.maxAge = days * 24 * 60 * 60 * 1000
  }
}

// Composable for using the storage service
export function useStorageService(): StorageService {
  return new StorageService()
}