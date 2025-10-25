/**
 * Detailed Performance Metrics API
 * GET /api/admin/system/metrics - Get detailed performance metrics
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PerformanceMonitor, DatabasePerformanceTracker } from '@/lib/performance'
import { withPerformanceMiddleware } from '@/lib/performanceMiddleware'

/**
 * GET /api/admin/system/metrics
 * Get detailed performance metrics
 */
export const GET = withPerformanceMiddleware(async () => {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role?.name !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const monitor = PerformanceMonitor.getInstance()
    const systemMetrics = monitor.getSystemMetrics()
    const routeMetrics = monitor.getAllRouteMetrics()
    const queryMetrics = DatabasePerformanceTracker.getAllQueryMetrics()
    
    return NextResponse.json({
      success: true,
      data: {
        system: systemMetrics,
        routes: routeMetrics,
        database: queryMetrics,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Failed to get performance metrics:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get performance metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})