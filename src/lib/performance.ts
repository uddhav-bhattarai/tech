/**
 * Performance Monitoring and Metrics Collection
 * Tracks system performance, API response times, and resource usage
 */

import { performance } from 'perf_hooks'

// Performance metrics storage
const performanceMetrics = new Map<string, number[]>()
const activeRequests = new Map<string, number>()

export interface PerformanceMetrics {
  responseTime: {
    avg: number
    min: number
    max: number
    p95: number
    p99: number
  }
  requestCount: number
  errorCount: number
  errorRate: number
  memoryUsage: NodeJS.MemoryUsage
  cpuUsage: number
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  uptime: number
  version: string
  environment: string
  lastCheck: Date
  metrics: PerformanceMetrics
  alerts: SystemAlert[]
}

export interface SystemAlert {
  id: string
  type: 'error' | 'warning' | 'info'
  message: string
  timestamp: Date
  resolved: boolean
  threshold?: number
  currentValue?: number
}

/**
 * Performance monitoring class
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private startTime: number
  private requestCount: number = 0
  private errorCount: number = 0
  private alerts: SystemAlert[] = []
  
  private constructor() {
    this.startTime = Date.now()
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * Start timing a request
   */
  startRequest(requestId: string): void {
    activeRequests.set(requestId, performance.now())
    this.requestCount++
  }

  /**
   * End timing a request and record metrics
   */
  endRequest(requestId: string, success: boolean = true): number {
    const startTime = activeRequests.get(requestId)
    if (!startTime) return 0

    const duration = performance.now() - startTime
    activeRequests.delete(requestId)

    // Record response time
    const route = requestId.split(':')[0] || 'unknown'
    if (!performanceMetrics.has(route)) {
      performanceMetrics.set(route, [])
    }
    performanceMetrics.get(route)!.push(duration)

    // Keep only last 1000 entries per route
    const metrics = performanceMetrics.get(route)!
    if (metrics.length > 1000) {
      metrics.shift()
    }

    if (!success) {
      this.errorCount++
    }

    return duration
  }

  /**
   * Record an error
   */
  recordError(error: Error, context?: string): void {
    this.errorCount++
    this.addAlert({
      id: `error-${Date.now()}`,
      type: 'error',
      message: `${context ? context + ': ' : ''}${error.message}`,
      timestamp: new Date(),
      resolved: false
    })
  }

  /**
   * Add system alert
   */
  addAlert(alert: SystemAlert): void {
    this.alerts.push(alert)
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts.shift()
    }
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
    }
  }

  /**
   * Get performance metrics for a specific route
   */
  getRouteMetrics(route: string): PerformanceMetrics['responseTime'] | null {
    const metrics = performanceMetrics.get(route)
    if (!metrics || metrics.length === 0) return null

    const sorted = [...metrics].sort((a, b) => a - b)
    const avg = metrics.reduce((sum, time) => sum + time, 0) / metrics.length
    const min = sorted[0]
    const max = sorted[sorted.length - 1]
    const p95 = sorted[Math.floor(sorted.length * 0.95)]
    const p99 = sorted[Math.floor(sorted.length * 0.99)]

    return { avg, min, max, p95, p99 }
  }

  /**
   * Get overall system metrics
   */
  getSystemMetrics(): PerformanceMetrics {
    // Aggregate metrics from all routes
    const allMetrics: number[] = []
    performanceMetrics.forEach(routeMetrics => {
      allMetrics.push(...routeMetrics)
    })

    let responseTime = {
      avg: 0,
      min: 0,
      max: 0,
      p95: 0,
      p99: 0
    }

    if (allMetrics.length > 0) {
      const sorted = [...allMetrics].sort((a, b) => a - b)
      responseTime = {
        avg: allMetrics.reduce((sum, time) => sum + time, 0) / allMetrics.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)]
      }
    }

    const errorRate = this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0

    return {
      responseTime,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      errorRate,
      memoryUsage: process.memoryUsage(),
      cpuUsage: this.getCpuUsage()
    }
  }

  /**
   * Get system health status
   */
  getSystemHealth(): SystemHealth {
    const metrics = this.getSystemMetrics()
    const uptime = (Date.now() - this.startTime) / 1000
    
    // Determine health status based on metrics
    let status: SystemHealth['status'] = 'healthy'
    
    if (metrics.errorRate > 5 || metrics.responseTime.avg > 2000) {
      status = 'degraded'
    }
    
    if (metrics.errorRate > 15 || metrics.responseTime.avg > 5000) {
      status = 'unhealthy'
    }

    // Check for performance alerts
    this.checkPerformanceAlerts(metrics)

    return {
      status,
      uptime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      lastCheck: new Date(),
      metrics,
      alerts: this.alerts.filter(a => !a.resolved)
    }
  }

  /**
   * Check for performance issues and create alerts
   */
  private checkPerformanceAlerts(metrics: PerformanceMetrics): void {
    // High response time alert
    if (metrics.responseTime.avg > 1000) {
      this.addAlert({
        id: `response-time-${Date.now()}`,
        type: 'warning',
        message: `High average response time: ${metrics.responseTime.avg.toFixed(2)}ms`,
        timestamp: new Date(),
        resolved: false,
        threshold: 1000,
        currentValue: metrics.responseTime.avg
      })
    }

    // High error rate alert
    if (metrics.errorRate > 2) {
      this.addAlert({
        id: `error-rate-${Date.now()}`,
        type: 'error',
        message: `High error rate: ${metrics.errorRate.toFixed(2)}%`,
        timestamp: new Date(),
        resolved: false,
        threshold: 2,
        currentValue: metrics.errorRate
      })
    }

    // High memory usage alert
    const memoryUsageMB = metrics.memoryUsage.heapUsed / 1024 / 1024
    if (memoryUsageMB > 512) { // 512MB threshold
      this.addAlert({
        id: `memory-usage-${Date.now()}`,
        type: 'warning',
        message: `High memory usage: ${memoryUsageMB.toFixed(2)}MB`,
        timestamp: new Date(),
        resolved: false,
        threshold: 512,
        currentValue: memoryUsageMB
      })
    }
  }

  /**
   * Get CPU usage (simplified)
   */
  private getCpuUsage(): number {
    // This is a simplified implementation
    // In production, you might want to use a more sophisticated method
    const usage = process.cpuUsage()
    return ((usage.user + usage.system) / 1000 / 1000) * 100
  }

  /**
   * Reset metrics
   */
  reset(): void {
    performanceMetrics.clear()
    activeRequests.clear()
    this.requestCount = 0
    this.errorCount = 0
    this.alerts = []
  }

  /**
   * Get all route metrics
   */
  getAllRouteMetrics(): Record<string, PerformanceMetrics['responseTime']> {
    const result: Record<string, PerformanceMetrics['responseTime']> = {}
    
    performanceMetrics.forEach((metrics, route) => {
      const routeMetrics = this.getRouteMetrics(route)
      if (routeMetrics) {
        result[route] = routeMetrics
      }
    })

    return result
  }
}

/**
 * Middleware for automatic performance tracking
 */
export function withPerformanceTracking<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  routeName?: string
): T {
  return (async (...args: unknown[]) => {
    const monitor = PerformanceMonitor.getInstance()
    const requestId = `${routeName || fn.name}:${Date.now()}`
    
    monitor.startRequest(requestId)
    
    try {
      const result = await fn(...args)
      monitor.endRequest(requestId, true)
      return result
    } catch (error) {
      monitor.endRequest(requestId, false)
      monitor.recordError(error as Error, routeName)
      throw error
    }
  }) as T
}

/**
 * Performance decorator for class methods
 */
export function performanceTrack(routeName?: string) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = withPerformanceTracking(originalMethod, routeName || `${(target as { constructor: { name: string } }).constructor.name}.${propertyKey}`)

    return descriptor
  }
}

/**
 * Database query performance tracking
 */
export class DatabasePerformanceTracker {
  private static queryMetrics = new Map<string, number[]>()

  static startQuery(): number {
    return performance.now()
  }

  static endQuery(queryId: string, startTime: number): void {
    const duration = performance.now() - startTime
    
    if (!this.queryMetrics.has(queryId)) {
      this.queryMetrics.set(queryId, [])
    }
    
    this.queryMetrics.get(queryId)!.push(duration)
    
    // Keep only last 100 entries per query type
    const metrics = this.queryMetrics.get(queryId)!
    if (metrics.length > 100) {
      metrics.shift()
    }

    // Alert on slow queries
    if (duration > 1000) { // 1 second threshold
      PerformanceMonitor.getInstance().addAlert({
        id: `slow-query-${Date.now()}`,
        type: 'warning',
        message: `Slow database query: ${queryId} took ${duration.toFixed(2)}ms`,
        timestamp: new Date(),
        resolved: false,
        threshold: 1000,
        currentValue: duration
      })
    }
  }

  static getQueryMetrics(queryId: string): { avg: number; count: number } | null {
    const metrics = this.queryMetrics.get(queryId)
    if (!metrics || metrics.length === 0) return null

    const avg = metrics.reduce((sum, time) => sum + time, 0) / metrics.length
    return { avg, count: metrics.length }
  }

  static getAllQueryMetrics(): Record<string, { avg: number; count: number }> {
    const result: Record<string, { avg: number; count: number }> = {}
    
    this.queryMetrics.forEach((metrics, queryId) => {
      const queryMetrics = this.getQueryMetrics(queryId)
      if (queryMetrics) {
        result[queryId] = queryMetrics
      }
    })

    return result
  }
}

export default PerformanceMonitor