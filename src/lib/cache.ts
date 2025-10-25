/**
 * Redis Cache Configuration and Utilities
 * Provides caching strategies for improved performance
 */

import Redis from 'ioredis'
import { unstable_cache } from 'next/cache'

// Redis client configuration
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  lazyConnect: true,
})

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
  WEEK: 604800, // 7 days
} as const

// Cache key prefixes
export const CACHE_KEYS = {
  DEVICE: 'device',
  DEVICES_LIST: 'devices:list',
  DEVICE_COMPARISON: 'device:comparison',
  DEVICE_RANKINGS: 'device:rankings',
  BLOG_POST: 'blog:post',
  BLOG_POSTS_LIST: 'blog:list',
  USER_PROFILE: 'user:profile',
  SEARCH_RESULTS: 'search',
  CATEGORIES: 'categories',
  BRANDS: 'brands',
  ANALYTICS: 'analytics',
  SYSTEM_METRICS: 'system:metrics',
} as const

/**
 * Generic cache wrapper with automatic serialization
 */
export class CacheManager {
  private static instance: CacheManager
  private client: Redis

  private constructor() {
    this.client = redis
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  /**
   * Set cache with automatic serialization
   */
  async set<T>(key: string, value: T, ttl: number = CACHE_TTL.MEDIUM): Promise<void> {
    try {
      const serialized = JSON.stringify(value)
      await this.client.setex(key, ttl, serialized)
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  /**
   * Get cache with automatic deserialization
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.client.get(key)
      if (!cached) return null
      return JSON.parse(cached) as T
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  /**
   * Delete cache entry
   */
  async del(key: string): Promise<void> {
    try {
      await this.client.del(key)
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }

  /**
   * Delete multiple cache entries by pattern
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern)
      if (keys.length > 0) {
        await this.client.del(...keys)
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error)
    }
  }

  /**
   * Check if cache key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const exists = await this.client.exists(key)
      return exists === 1
    } catch (error) {
      console.error('Cache exists error:', error)
      return false
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<Record<string, unknown>> {
    try {
      const info = await this.client.info('memory')
      const dbSize = await this.client.dbsize()
      
      return {
        dbSize,
        memoryInfo: info
      }
    } catch (error) {
      console.error('Cache stats error:', error)
      return {}
    }
  }

  /**
   * Flush all cache
   */
  async flushAll(): Promise<void> {
    try {
      await this.client.flushall()
    } catch (error) {
      console.error('Cache flush error:', error)
    }
  }
}

/**
 * Cache-or-fetch pattern for database queries
 */
export async function cacheOrFetch<T>(
  cacheKey: string,
  fetchFunction: () => Promise<T>,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<T> {
  const cache = CacheManager.getInstance()
  
  // Try to get from cache first
  const cached = await cache.get<T>(cacheKey)
  if (cached !== null) {
    return cached
  }

  // Fetch from source
  const data = await fetchFunction()
  
  // Cache the result
  await cache.set(cacheKey, data, ttl)
  
  return data
}

/**
 * Next.js cache wrapper for API routes
 */
export function createCachedFunction<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  keyGenerator: (...args: T) => string,
  options: {
    revalidate?: number
    tags?: string[]
  } = {}
) {
  return unstable_cache(
    fn,
    undefined,
    {
      revalidate: options.revalidate || 3600, // 1 hour default
      tags: options.tags || [],
    }
  )
}

/**
 * Invalidate cache by tags (for Next.js cache)
 */
export function invalidateCacheByTags(tags: string[]) {
  // This would be implemented with Next.js revalidateTag function
  // revalidateTag is only available in app directory
  console.log('Invalidating cache for tags:', tags)
}

/**
 * Cache key builders
 */
export const buildCacheKey = {
  device: (slug: string) => `${CACHE_KEYS.DEVICE}:${slug}`,
  
  devicesList: (filters: Record<string, unknown> = {}) => {
    const filterString = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|')
    return `${CACHE_KEYS.DEVICES_LIST}:${filterString}`
  },
  
  deviceComparison: (deviceIds: string[]) => 
    `${CACHE_KEYS.DEVICE_COMPARISON}:${deviceIds.sort().join(':')}`,
  
  deviceRankings: (category?: string, brand?: string) =>
    `${CACHE_KEYS.DEVICE_RANKINGS}:${category || 'all'}:${brand || 'all'}`,
  
  blogPost: (slug: string) => `${CACHE_KEYS.BLOG_POST}:${slug}`,
  
  blogPostsList: (filters: Record<string, unknown> = {}) => {
    const filterString = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|')
    return `${CACHE_KEYS.BLOG_POSTS_LIST}:${filterString}`
  },
  
  userProfile: (userId: string) => `${CACHE_KEYS.USER_PROFILE}:${userId}`,
  
  searchResults: (query: string, filters: Record<string, unknown> = {}) => {
    const filterString = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|')
    return `${CACHE_KEYS.SEARCH_RESULTS}:${query}:${filterString}`
  },
  
  analytics: (type: string, period: string) => 
    `${CACHE_KEYS.ANALYTICS}:${type}:${period}`,
  
  systemMetrics: () => CACHE_KEYS.SYSTEM_METRICS,
}

/**
 * Cache warming functions
 */
export const cacheWarmers = {
  async warmPopularDevices() {
    // Implementation would fetch and cache most viewed/rated devices
    console.log('Warming popular devices cache...')
  },
  
  async warmRecentBlogPosts() {
    // Implementation would fetch and cache recent blog posts
    console.log('Warming recent blog posts cache...')
  },
  
  async warmCategories() {
    // Implementation would fetch and cache all categories
    console.log('Warming categories cache...')
  },
}

export default CacheManager