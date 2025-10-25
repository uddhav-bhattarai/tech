/**
 * Comprehensive Admin Dashboard Component
 * Main administrative interface with role-based access control and sub-component integration
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import AdminUserManagement from './AdminUserManagement'
import AdminContentManagement from './AdminContentManagement'
import AdminDeviceManagement from './AdminDeviceManagement'
import AdminSystemMonitoring from './AdminSystemMonitoring'
import {
  ChartBarIcon,
  UsersIcon,
  DocumentTextIcon,
  DevicePhoneMobileIcon,
  ServerIcon,
  ShieldCheckIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  EyeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface DashboardStats {
  users: {
    total: number
    active: number
    newThisMonth: number
    growth: number
  }
  content: {
    articles: number
    published: number
    drafts: number
    pending: number
  }
  devices: {
    total: number
    active: number
    reviews: number
    comparisons: number
  }
  system: {
    uptime: string
    performance: number
    errors: number
    storage: number
  }
  activity: Array<{
    date: string
    users: number
    content: number
    devices: number
  }>
  recentActivity: Array<{
    id: string
    type: 'USER_SIGNUP' | 'CONTENT_PUBLISHED' | 'DEVICE_ADDED' | 'REVIEW_POSTED'
    description: string
    user: string
    timestamp: Date
  }>
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('7d')
  const [activeView, setActiveView] = useState<'overview' | 'users' | 'content' | 'devices' | 'system'>('overview')

  useEffect(() => {
    loadDashboardStats()
  }, [timeframe])

  const loadDashboardStats = async () => {
    try {
      setLoading(true)
      
      // In a real app, this would fetch from admin APIs
      const mockStats: DashboardStats = {
        users: {
          total: 1247,
          active: 892,
          newThisMonth: 156,
          growth: 12.5
        },
        content: {
          articles: 342,
          published: 298,
          drafts: 31,
          pending: 13
        },
        devices: {
          total: 89,
          active: 76,
          reviews: 234,
          comparisons: 156
        },
        system: {
          uptime: '99.9%',
          performance: 87,
          errors: 3,
          storage: 45
        },
        activity: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          users: Math.floor(Math.random() * 50) + 20,
          content: Math.floor(Math.random() * 20) + 5,
          devices: Math.floor(Math.random() * 5) + 1
        })),
        recentActivity: [
          {
            id: '1',
            type: 'USER_SIGNUP',
            description: 'New user registration',
            user: 'john.doe@example.com',
            timestamp: new Date(Date.now() - 5 * 60 * 1000)
          },
          {
            id: '2',
            type: 'CONTENT_PUBLISHED',
            description: 'Article published: "Latest iPhone Review"',
            user: 'editor@example.com',
            timestamp: new Date(Date.now() - 15 * 60 * 1000)
          },
          {
            id: '3',
            type: 'DEVICE_ADDED',
            description: 'New device added: Samsung Galaxy S24',
            user: 'admin@example.com',
            timestamp: new Date(Date.now() - 30 * 60 * 1000)
          },
          {
            id: '4',
            type: 'REVIEW_POSTED',
            description: 'User review posted for iPhone 15',
            user: 'user123@example.com',
            timestamp: new Date(Date.now() - 45 * 60 * 1000)
          }
        ]
      }
      
      setStats(mockStats)
    } catch (error) {
      console.error('Failed to load dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Check if user has admin permissions
  const hasAdminAccess = session?.user?.role?.name === 'ADMIN' || 
    session?.user?.role?.permissions?.some(p => p.name === 'admin:read')

  if (!session?.user || !hasAdminAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShieldCheckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500">You don&apos;t have permission to access the admin dashboard.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'USER_SIGNUP':
        return <UsersIcon className="h-5 w-5 text-blue-600" />
      case 'CONTENT_PUBLISHED':
        return <DocumentTextIcon className="h-5 w-5 text-green-600" />
      case 'DEVICE_ADDED':
        return <DevicePhoneMobileIcon className="h-5 w-5 text-purple-600" />
      case 'REVIEW_POSTED':
        return <EyeIcon className="h-5 w-5 text-orange-600" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-600" />
    }
  }

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Welcome back, {session.user.name || 'Admin'}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              
              <button 
                onClick={() => loadDashboardStats()}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: ChartBarIcon },
              { id: 'users', label: 'Users', icon: UsersIcon },
              { id: 'content', label: 'Content', icon: DocumentTextIcon },
              { id: 'devices', label: 'Devices', icon: DevicePhoneMobileIcon },
              { id: 'system', label: 'System', icon: ServerIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as 'overview' | 'users' | 'content' | 'devices' | 'system')}
                className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md ${
                  activeView === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Dashboard */}
        {activeView === 'overview' && stats && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Users */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <UsersIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {stats.users.total.toLocaleString()}
                          </div>
                          <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                            <ArrowTrendingUpIcon className="h-4 w-4 flex-shrink-0 self-center" />
                            <span className="sr-only">Increased by</span>
                            {stats.users.growth}%
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <span className="text-gray-600">{stats.users.active} active users</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DocumentTextIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Articles</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {stats.content.articles}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <span className="text-gray-600">{stats.content.published} published</span>
                  </div>
                </div>
              </div>

              {/* Devices */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DevicePhoneMobileIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Devices</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {stats.devices.total}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <span className="text-gray-600">{stats.devices.reviews} reviews</span>
                  </div>
                </div>
              </div>

              {/* System Health */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ServerIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">System Health</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {stats.system.uptime}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm flex items-center space-x-2">
                    {stats.system.errors > 0 && (
                      <>
                        <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                        <span className="text-red-600">{stats.system.errors} errors</span>
                      </>
                    )}
                    {stats.system.errors === 0 && (
                      <span className="text-green-600">All systems operational</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Activity Feed */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {stats.recentActivity.map((activity) => (
                    <div key={activity.id} className="px-6 py-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-900">{activity.description}</p>
                          <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
                            <span>{activity.user}</span>
                            <span>•</span>
                            <span>{formatTimeAgo(activity.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">System Summary</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Performance Score</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${stats.system.performance}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {stats.system.performance}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Storage Usage</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-orange-600 h-2 rounded-full" 
                            style={{ width: `${stats.system.storage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {stats.system.storage}%
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-semibold text-gray-900">
                            {stats.content.pending}
                          </div>
                          <div className="text-xs text-gray-500">Pending Reviews</div>
                        </div>
                        <div>
                          <div className="text-2xl font-semibold text-gray-900">
                            {stats.users.newThisMonth}
                          </div>
                          <div className="text-xs text-gray-500">New This Month</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Management */}
        {activeView === 'users' && <AdminUserManagement />}

        {/* Content Management */}
        {activeView === 'content' && <AdminContentManagement />}

        {/* Device Management */}
        {activeView === 'devices' && <AdminDeviceManagement />}

        {/* System Monitoring */}
        {activeView === 'system' && <AdminSystemMonitoring />}
      </div>
    </div>
  )
}