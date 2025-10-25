'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/layouts/AdminLayout'
import { 
  Users, 
  FileText, 
  Eye, 
  Smartphone, 
  TrendingUp, 
  Calendar,
  BarChart3,
  PieChart
} from 'lucide-react'

interface AnalyticsData {
  totalUsers: number
  totalBlogs: number
  totalDevices: number
  totalViews: number
  monthlyUsers: number
  monthlyBlogs: number
  topDevices: Array<{ name: string; views: number }>
  topBlogs: Array<{ title: string; views: number; slug: string }>
  userGrowth: Array<{ month: string; users: number }>
  blogTypes: Array<{ type: string; count: number }>
}

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  changeType = 'positive' 
}: {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
}) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {change && (
          <p className={`text-sm mt-1 ${
            changeType === 'positive' ? 'text-green-600' : 
            changeType === 'negative' ? 'text-red-600' : 'text-gray-500'
          }`}>
            {change}
          </p>
        )}
      </div>
      <div className="p-3 bg-blue-50 rounded-full">
        <Icon className="h-6 w-6 text-blue-600" />
      </div>
    </div>
  </div>
)

export default function AdminAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalUsers: 0,
    totalBlogs: 0,
    totalDevices: 0,
    totalViews: 0,
    monthlyUsers: 0,
    monthlyBlogs: 0,
    topDevices: [],
    topBlogs: [],
    userGrowth: [],
    blogTypes: []
  })

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  const fetchAnalyticsData = async () => {
    setIsLoading(true)
    try {
      // Mock data for now - replace with actual API calls
      const mockData: AnalyticsData = {
        totalUsers: 1247,
        totalBlogs: 89,
        totalDevices: 156,
        totalViews: 45630,
        monthlyUsers: 234,
        monthlyBlogs: 12,
        topDevices: [
          { name: 'iPhone 15 Pro', views: 5420 },
          { name: 'Samsung Galaxy S24', views: 4130 },
          { name: 'Google Pixel 8', views: 3850 },
          { name: 'OnePlus 12', views: 2940 },
          { name: 'Xiaomi 14', views: 2650 }
        ],
        topBlogs: [
          { title: 'iPhone 15 Pro Review', views: 8420, slug: 'iphone-15-pro-review' },
          { title: 'Best Android Phones 2024', views: 6130, slug: 'best-android-phones-2024' },
          { title: 'Camera Comparison Guide', views: 5850, slug: 'camera-comparison-guide' },
          { title: 'Budget Phone Recommendations', views: 4940, slug: 'budget-phone-recommendations' }
        ],
        userGrowth: [
          { month: 'Jan', users: 850 },
          { month: 'Feb', users: 920 },
          { month: 'Mar', users: 1050 },
          { month: 'Apr', users: 1180 },
          { month: 'May', users: 1247 }
        ],
        blogTypes: [
          { type: 'REVIEW', count: 45 },
          { type: 'DESCRIPTION', count: 28 },
          { type: 'BLOG', count: 16 }
        ]
      }
      
      setAnalyticsData(mockData)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <div className="flex items-center gap-2">
            <label htmlFor="timeRange" className="text-sm font-medium text-gray-700">
              Time Range:
            </label>
            <select
              id="timeRange"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d' | '1y')}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={formatNumber(analyticsData.totalUsers)}
            icon={Users}
            change={`+${analyticsData.monthlyUsers} this month`}
            changeType="positive"
          />
          <StatCard
            title="Total Blogs"
            value={formatNumber(analyticsData.totalBlogs)}
            icon={FileText}
            change={`+${analyticsData.monthlyBlogs} this month`}
            changeType="positive"
          />
          <StatCard
            title="Total Devices"
            value={formatNumber(analyticsData.totalDevices)}
            icon={Smartphone}
            change="Updated daily"
            changeType="neutral"
          />
          <StatCard
            title="Total Views"
            value={formatNumber(analyticsData.totalViews)}
            icon={Eye}
            change="+12.5% vs last month"
            changeType="positive"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">User Growth</h2>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {analyticsData.userGrowth.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.month}</span>
                  <div className="flex-1 mx-4 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(item.users / Math.max(...analyticsData.userGrowth.map(g => g.users))) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{formatNumber(item.users)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Blog Types Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Blog Types</h2>
              <PieChart className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {analyticsData.blogTypes.map((item, index) => {
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-orange-500']
                const total = analyticsData.blogTypes.reduce((sum, b) => sum + b.count, 0)
                const percentage = Math.round((item.count / total) * 100)
                
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                      <span className="text-sm text-gray-600">{item.type}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-900">{item.count}</span>
                      <span className="text-xs text-gray-500 ml-1">({percentage}%)</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Top Content Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Devices */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Top Devices</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {analyticsData.topDevices.map((device, index) => (
                <div key={index} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <span className="text-sm font-medium text-gray-900">{device.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">{formatNumber(device.views)}</span>
                    <span className="text-xs text-gray-500 ml-1">views</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Blogs */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Top Blog Posts</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {analyticsData.topBlogs.map((blog, index) => (
                <div key={index} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{blog.title}</p>
                      <p className="text-xs text-gray-500 truncate">/blog/{blog.slug}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">{formatNumber(blog.views)}</span>
                    <span className="text-xs text-gray-500 ml-1">views</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">New blog post published: &quot;Best Phones Under $500&quot;</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">15 new user registrations</p>
                  <p className="text-xs text-gray-500">6 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Smartphone className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Added device: &quot;iPhone 16 Pro Max&quot;</p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Monthly traffic increased by 25%</p>
                  <p className="text-xs text-gray-500">3 days ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}