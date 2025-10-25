/**
 * Admin System Monitoring Component
 * System health, performance metrics, and logs monitoring
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  ServerIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowPathIcon,
  CpuChipIcon,
  CircleStackIcon
} from '@heroicons/react/24/outline'

interface SystemMetrics {
  server: {
    uptime: number
    cpu: number
    memory: {
      used: number
      total: number
      percentage: number
    }
    disk: {
      used: number
      total: number
      percentage: number
    }
  }
  database: {
    connections: number
    maxConnections: number
    avgQueryTime: number
    slowQueries: number
  }
  performance: {
    avgResponseTime: number
    requestsPerMinute: number
    errorRate: number
    uptime: number
  }
  cache: {
    hitRate: number
    missRate: number
    size: number
    maxSize: number
  }
}

interface SystemAlert {
  id: string
  type: 'error' | 'warning' | 'info'
  message: string
  timestamp: Date
  resolved: boolean
}

interface LogEntry {
  id: string
  level: 'error' | 'warn' | 'info' | 'debug'
  message: string
  timestamp: Date
  source: string
  metadata?: Record<string, unknown>
}

export default function AdminSystemMonitoring() {
  const { data: session } = useSession()
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [alerts, setAlerts] = useState<SystemAlert[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'logs'>('overview')
  const [autoRefresh, setAutoRefresh] = useState(true)

  const loadSystemMetrics = async () => {
    try {
      const response = await fetch('/api/admin/system/metrics')
      const data = await response.json()

      if (response.ok) {
        setMetrics(data.metrics)
      } else {
        setError(data.error || 'Failed to load system metrics')
      }
    } catch (error) {
      setError('Failed to load system metrics')
      console.error('Load metrics error:', error)
    }
  }

  const loadAlerts = async () => {
    try {
      const response = await fetch('/api/admin/system/alerts')
      const data = await response.json()

      if (response.ok) {
        setAlerts(data.alerts)
      } else {
        setError(data.error || 'Failed to load alerts')
      }
    } catch (error) {
      setError('Failed to load alerts')
      console.error('Load alerts error:', error)
    }
  }

  const loadLogs = async () => {
    try {
      const response = await fetch('/api/admin/system/logs?limit=100')
      const data = await response.json()

      if (response.ok) {
        setLogs(data.logs)
      } else {
        setError(data.error || 'Failed to load logs')
      }
    } catch (error) {
      setError('Failed to load logs')
      console.error('Load logs error:', error)
    }
  }

  const loadAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadSystemMetrics(),
        loadAlerts(),
        loadLogs()
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadSystemMetrics()
        loadAlerts()
      }, 30000) // Refresh every 30 seconds

      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusColor = (percentage: number, reverse = false) => {
    if (reverse) {
      if (percentage < 50) return 'text-green-600'
      if (percentage < 80) return 'text-yellow-600'
      return 'text-red-600'
    } else {
      if (percentage > 80) return 'text-green-600'
      if (percentage > 50) return 'text-yellow-600'
      return 'text-red-600'
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XMarkIcon className="h-5 w-5 text-red-500" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      default:
        return <CheckCircleIcon className="h-5 w-5 text-blue-500" />
    }
  }

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-600 bg-red-50'
      case 'warn':
        return 'text-yellow-600 bg-yellow-50'
      case 'info':
        return 'text-blue-600 bg-blue-50'
      case 'debug':
        return 'text-gray-600 bg-gray-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const formatTimestamp = (timestamp: Date | string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Check admin permissions
  const hasSystemAccess = session?.user?.role?.name === 'ADMIN' || 
    session?.user?.role?.permissions?.some(p => p.name === 'system:monitor')

  if (!hasSystemAccess) {
    return (
      <div className="text-center py-12">
        <ServerIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-500">You don&apos;t have permission to monitor system metrics.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Monitoring</h2>
          <p className="mt-1 text-sm text-gray-500">
            Monitor system health, performance metrics, and logs
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-600">Auto refresh</span>
          </label>
          
          <button
            onClick={() => loadAllData()}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <XMarkIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            System Overview
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'alerts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Alerts
            {alerts.filter(a => !a.resolved).length > 0 && (
              <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {alerts.filter(a => !a.resolved).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'logs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            System Logs
          </button>
        </nav>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
            Loading system data...
          </div>
        </div>
      ) : (
        <div>
          {/* Overview Tab */}
          {activeTab === 'overview' && metrics && (
            <div className="space-y-6">
              {/* Server Metrics */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Server Resources</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Uptime */}
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ClockIcon className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Uptime</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {formatUptime(metrics.server.uptime)}
                      </p>
                    </div>
                  </div>

                  {/* CPU Usage */}
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CpuChipIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">CPU Usage</p>
                      <p className={`text-xl font-semibold ${getStatusColor(metrics.server.cpu, true)}`}>
                        {metrics.server.cpu.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Memory Usage */}
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CircleStackIcon className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Memory</p>
                      <p className={`text-xl font-semibold ${getStatusColor(metrics.server.memory.percentage, true)}`}>
                        {metrics.server.memory.percentage.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatBytes(metrics.server.memory.used)} / {formatBytes(metrics.server.memory.total)}
                      </p>
                    </div>
                  </div>

                  {/* Disk Usage */}
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ServerIcon className="h-8 w-8 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Disk Space</p>
                      <p className={`text-xl font-semibold ${getStatusColor(metrics.server.disk.percentage, true)}`}>
                        {metrics.server.disk.percentage.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatBytes(metrics.server.disk.used)} / {formatBytes(metrics.server.disk.total)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Database & Performance */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Database Metrics */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Database</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Active Connections</span>
                      <span className="text-sm font-medium">
                        {metrics.database.connections} / {metrics.database.maxConnections}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Avg Query Time</span>
                      <span className="text-sm font-medium">{metrics.database.avgQueryTime}ms</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Slow Queries</span>
                      <span className={`text-sm font-medium ${
                        metrics.database.slowQueries > 10 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {metrics.database.slowQueries}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Performance</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Response Time</span>
                      <span className="text-sm font-medium">{metrics.performance.avgResponseTime}ms</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Requests/min</span>
                      <span className="text-sm font-medium">{metrics.performance.requestsPerMinute}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Error Rate</span>
                      <span className={`text-sm font-medium ${
                        metrics.performance.errorRate > 5 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {metrics.performance.errorRate.toFixed(2)}%
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Cache Hit Rate</span>
                      <span className={`text-sm font-medium ${getStatusColor(metrics.cache.hitRate)}`}>
                        {metrics.cache.hitRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              {alerts.length === 0 ? (
                <div className="p-12 text-center">
                  <CheckCircleIcon className="h-8 w-8 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-500">No active alerts</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-6 ${alert.resolved ? 'bg-gray-50' : ''}`}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          {getAlertIcon(alert.type)}
                        </div>
                        <div className="ml-3 flex-1">
                          <p className={`text-sm font-medium ${
                            alert.resolved ? 'text-gray-600' : 'text-gray-900'
                          }`}>
                            {alert.message}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            {formatTimestamp(alert.timestamp)}
                            {alert.resolved && (
                              <span className="ml-2 text-green-600">• Resolved</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              {logs.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-500">No logs available</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {logs.map((log) => (
                    <div key={log.id} className="p-4">
                      <div className="flex items-start space-x-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getLogLevelColor(log.level)
                        }`}>
                          {log.level.toUpperCase()}
                        </span>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-900">{log.message}</p>
                            <p className="text-xs text-gray-500">{formatTimestamp(log.timestamp)}</p>
                          </div>
                          
                          <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                            <span>Source: {log.source}</span>
                          </div>
                          
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <div className="mt-2 text-xs text-gray-500">
                              <pre className="font-mono bg-gray-100 p-2 rounded overflow-x-auto">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}