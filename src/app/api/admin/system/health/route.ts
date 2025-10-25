/**
 * System Health and Performance Metrics API
 * GET /api/admin/system/health - Get system health status
 * GET /api/admin/system/metrics - Get detailed performance metrics
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PerformanceMonitor } from '@/lib/performance'
import { withPerformanceMiddleware } from '@/lib/performanceMiddleware'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/system/health
 * Get system health status
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
    const systemHealth = monitor.getSystemHealth()
    
    // Add database connection status
    let databaseConnection = false
    try {
      await prisma.$queryRaw`SELECT 1`
      databaseConnection = true
    } catch (error) {
      monitor.recordError(error as Error, 'Database health check')
    }

    return NextResponse.json({
      success: true,
      data: {
        ...systemHealth,
        databaseConnection
      }
    })
  } catch (error) {
    console.error('System health check failed:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get system health',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})