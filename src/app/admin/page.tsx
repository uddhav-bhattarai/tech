"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import Link from "next/link"
import DashboardLayout from "@/components/layouts/DashboardLayout"
import AdminPageHeader from "@/components/admin/AdminPageHeader"
import { 
  Smartphone, 
  Users, 
  FileText, 
  BarChart3, 
  Eye,
  MessageSquare,
  Building2
} from "lucide-react"

interface DashboardStats {
  devices: {
    total: number
    published: number
    draft: number
  }
  brands: {
    total: number
  }
  users: {
    total: number
    verified: number
  }
  blogPosts: {
    total: number
    published: number
    draft: number
  }
  reviews: {
    total: number
    thisMonth: number
  }
  views: {
    total: number
    thisMonth: number
  }
}

export default function AdminDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isStatsLoading, setIsStatsLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/signin")
      return
    }
    
    if (!isLoading && isAuthenticated && user?.role?.name !== 'ADMIN') {
      // Non-admin users get redirected to regular dashboard
      router.push("/dashboard")
      return
    }

    if (isAuthenticated && user?.role?.name === 'ADMIN') {
      fetchStats()
    }
  }, [isLoading, isAuthenticated, user?.role?.name, router])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    } finally {
      setIsStatsLoading(false)
    }
  }

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Don't render anything if not authenticated or not admin (will redirect)
  if (!isAuthenticated || user?.role?.name !== 'ADMIN') {
    return null
  }

  const statCards = [
    {
      title: "Total Devices",
      value: stats?.devices.total || 0,
      subtitle: `${stats?.devices.published || 0} published`,
      icon: Smartphone,
      color: "blue",
      href: "/admin/devices",
    },
    {
      title: "Brands",
      value: stats?.brands.total || 0,
      subtitle: "Device manufacturers",
      icon: Building2,
      color: "green",
      href: "/admin/brands",
    },
    {
      title: "Users",
      value: stats?.users.total || 0,
      subtitle: `${stats?.users.verified || 0} verified`,
      icon: Users,
      color: "purple",
      href: "/admin/users",
    },
    {
      title: "Blog Posts",
      value: stats?.blogPosts.total || 0,
      subtitle: `${stats?.blogPosts.published || 0} published`,
      icon: FileText,
      color: "orange",
      href: "/admin/blog",
    },
    {
      title: "Reviews",
      value: stats?.reviews.total || 0,
      subtitle: `${stats?.reviews.thisMonth || 0} this month`,
      icon: MessageSquare,
      color: "pink",
      href: "/admin/reviews",
    },
    {
      title: "Page Views",
      value: stats?.views.total || 0,
      subtitle: `${stats?.views.thisMonth || 0} this month`,
      icon: Eye,
      color: "indigo",
      href: "/admin/analytics",
    },
  ]

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: "bg-blue-50 text-blue-700 border-blue-200",
      green: "bg-green-50 text-green-700 border-green-200",
      purple: "bg-purple-50 text-purple-700 border-purple-200",
      orange: "bg-orange-50 text-orange-700 border-orange-200",
      pink: "bg-pink-50 text-pink-700 border-pink-200",
      indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    }
    return colors[color] || colors.blue
  }

  const getIconColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: "text-blue-500",
      green: "text-green-500",
      purple: "text-purple-500",
      orange: "text-orange-500",
      pink: "text-pink-500",
      indigo: "text-indigo-500",
    }
    return colors[color] || colors.blue
  }

  return (
    <DashboardLayout>
      <AdminPageHeader 
        title={`Welcome back, ${user?.name || user?.username}!`}
        description="Here's what's happening with your tech blog platform today"
        actions={
          <Link
            href="/admin/blog/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Create Blog Post
          </Link>
        }
      />
      <div className="p-6">{/* Stats Grid */}
        {isStatsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <Link
                key={card.title}
                href={card.href}
                className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {card.value.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">{card.subtitle}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${getColorClasses(card.color)}`}>
                    <Icon className={`w-6 h-6 ${getIconColorClasses(card.color)}`} />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/devices/create"
            className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Smartphone className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Add Device</p>
              <p className="text-sm text-gray-600">Add new mobile device</p>
            </div>
          </Link>
          
          <Link
            href="/admin/blog/create"
            className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <FileText className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">New Post</p>
              <p className="text-sm text-gray-600">Create blog post</p>
            </div>
          </Link>
          
          <Link
            href="/admin/brands/create"
            className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <Building2 className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Add Brand</p>
              <p className="text-sm text-gray-600">Add device brand</p>
            </div>
          </Link>
          
          <Link
            href="/admin/analytics"
            className="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <BarChart3 className="w-8 h-8 text-orange-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Analytics</p>
              <p className="text-sm text-gray-600">View site metrics</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <span className="text-gray-900">New device review submitted</span>
            </div>
            <span className="text-sm text-gray-500">2 hours ago</span>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <span className="text-gray-900">Blog post published</span>
            </div>
            <span className="text-sm text-gray-500">5 hours ago</span>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
              <span className="text-gray-900">New user registered</span>
            </div>
            <span className="text-sm text-gray-500">1 day ago</span>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
              <span className="text-gray-900">Device database updated</span>
            </div>
            <span className="text-sm text-gray-500">2 days ago</span>
          </div>
        </div>
      </div>
      </div>
    </DashboardLayout>
  )
}