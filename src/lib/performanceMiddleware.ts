/**
 * Performance Middleware for Next.js API Routes
 * Automatic performance tracking and metrics collection
 */

import { NextRequest, NextResponse } from 'next/server'
import { PerformanceMonitor } from '@/lib/performance'

/**
 * Middleware for Next.js API routes to track performance
 */
export function withPerformanceMiddleware(
  handler: (req: NextRequest, context?: { params: Record<string, string> }) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const monitor = PerformanceMonitor.getInstance()
    const route = new URL(req.url).pathname
    const method = req.method
    const requestId = `${method}:${route}:${Date.now()}`
    
    monitor.startRequest(requestId)
    
    try {
      const response = await handler(req, context)
      monitor.endRequest(requestId, response.status < 400)
      return response
    } catch (error) {
      monitor.endRequest(requestId, false)
      monitor.recordError(error as Error, `${method} ${route}`)
      throw error
    }
  }
}

/**
 * Performance tracking for server actions
 */
export function withServerActionTracking<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  actionName: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const monitor = PerformanceMonitor.getInstance()
    const requestId = `server-action:${actionName}:${Date.now()}`
    
    monitor.startRequest(requestId)
    
    try {
      const result = await fn(...args)
      monitor.endRequest(requestId, true)
      return result
    } catch (error) {
      monitor.endRequest(requestId, false)
      monitor.recordError(error as Error, `Server Action: ${actionName}`)
      throw error
    }
  }
}

/**
 * Database operation tracking wrapper
 */
export function withDatabaseTracking<T extends unknown[], R>(
  operation: (...args: T) => Promise<R>,
  operationName: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const { DatabasePerformanceTracker } = await import('@/lib/performance')
    const startTime = DatabasePerformanceTracker.startQuery()
    
    try {
      const result = await operation(...args)
      DatabasePerformanceTracker.endQuery(operationName, startTime)
      return result
    } catch (error) {
      DatabasePerformanceTracker.endQuery(`${operationName}:error`, startTime)
      throw error
    }
  }
}

/**
 * Cache operation tracking
 */
export function withCacheTracking<T extends unknown[], R>(
  operation: (...args: T) => Promise<R>,
  cacheKey: string,
  isHit: boolean = false
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const monitor = PerformanceMonitor.getInstance()
    const requestId = `cache:${isHit ? 'hit' : 'miss'}:${cacheKey}:${Date.now()}`
    
    monitor.startRequest(requestId)
    
    try {
      const result = await operation(...args)
      monitor.endRequest(requestId, true)
      return result
    } catch (error) {
      monitor.endRequest(requestId, false)
      monitor.recordError(error as Error, `Cache ${isHit ? 'hit' : 'miss'}: ${cacheKey}`)
      throw error
    }
  }
}

export default withPerformanceMiddleware