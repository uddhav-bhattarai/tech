"use client"

import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import DashboardLayout from "@/components/layouts/DashboardLayout"

interface DashboardStats {
  overview: {
    totalDevices: number
    totalBlogPosts: number
    publishedBlogs: number
    totalComparisons: number
    totalReviews: number
  }
  userStats: {
    myBlogs: number
    myReviews: number
    myComparisons: number
  }
  recentActivity: Array<{
    type: string
    title: string
    status?: string
    rating?: number
    device?: string
    author: string
    createdAt: string
    link: string
  }>
  adminStats?: {
    totalUsers: number
    verifiedUsers: number
    draftBlogs: number
    pendingReviews: number
  }
}

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/signin")
    } else if (isAuthenticated && user?.role?.name === 'ADMIN') {
      // Redirect admin users to admin dashboard
      router.push("/admin")
    }
  }, [isLoading, isAuthenticated, user?.role?.name, router])

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats()
    }
  }, [isAuthenticated])

  const fetchStats = async () => {
    setStatsLoading(true)
    try {
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Welcome Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.name || user?.username}!
              </h1>
              <p className="text-gray-600 mt-1">Here&apos;s your personal dashboard</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Role</p>
              <p className="font-medium">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  user?.role?.name === 'ADMIN' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {user?.role?.name || "No role"}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-medium">
                {user?.verified ? (
                  <span className="text-green-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                ) : (
                  <span className="text-yellow-600">Unverified</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {statsLoading ? (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        ) : stats && (
          <>
            {/* Overview Stats */}
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Platform Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.overview.totalDevices}</div>
                  <div className="text-sm text-blue-600">Devices</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.overview.publishedBlogs}</div>
                  <div className="text-sm text-green-600">Published Blogs</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats.overview.totalReviews}</div>
                  <div className="text-sm text-purple-600">Reviews</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{stats.overview.totalComparisons}</div>
                  <div className="text-sm text-orange-600">Comparisons</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">{stats.overview.totalBlogPosts}</div>
                  <div className="text-sm text-gray-600">Total Blogs</div>
                </div>
              </div>
            </div>

            {/* User Stats */}
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Your Activity</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/admin/blog" className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <div className="text-2xl font-bold text-blue-600">{stats.userStats.myBlogs}</div>
                  <div className="text-sm text-blue-600">My Blog Posts</div>
                  <div className="text-xs text-blue-500 mt-1">Click to manage →</div>
                </Link>
                <Link href="/devices" className="block p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                  <div className="text-2xl font-bold text-purple-600">{stats.userStats.myReviews}</div>
                  <div className="text-sm text-purple-600">My Reviews</div>
                  <div className="text-xs text-purple-500 mt-1">View devices →</div>
                </Link>
                <Link href="/compare" className="block p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                  <div className="text-2xl font-bold text-orange-600">{stats.userStats.myComparisons}</div>
                  <div className="text-sm text-orange-600">My Comparisons</div>
                  <div className="text-xs text-orange-500 mt-1">Compare devices →</div>
                </Link>
              </div>
            </div>

            {/* Admin Stats */}
            {user?.role?.name === 'ADMIN' && stats.adminStats && (
              <div className="bg-white shadow rounded-lg p-6 mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Admin Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{stats.adminStats.totalUsers}</div>
                    <div className="text-sm text-red-600">Total Users</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.adminStats.verifiedUsers}</div>
                    <div className="text-sm text-green-600">Verified Users</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{stats.adminStats.draftBlogs}</div>
                    <div className="text-sm text-yellow-600">Draft Blogs</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats.adminStats.pendingReviews}</div>
                    <div className="text-sm text-blue-600">Recent Reviews</div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            {stats.recentActivity && stats.recentActivity.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6 mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
                <div className="space-y-3">
                  {stats.recentActivity.map((activity, index) => (
                    <Link key={index} href={activity.link} className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                              activity.type === 'blog' ? 'bg-green-500' : 'bg-purple-500'
                            }`}></span>
                            <h3 className="font-medium text-gray-900">{activity.title}</h3>
                            {activity.rating && (
                              <div className="ml-2 flex items-center">
                                <span className="text-yellow-400">★</span>
                                <span className="text-sm text-gray-600 ml-1">{activity.rating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <span>by {activity.author}</span>
                            {activity.device && <span className="ml-2">• {activity.device}</span>}
                            <span className="ml-2">• {new Date(activity.createdAt).toLocaleDateString()}</span>
                            {activity.status && (
                              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                                activity.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {activity.status}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-gray-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/devices"
              className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors group"
            >
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a1 1 0 001-1v-1a1 1 0 00-1-1H8a1 1 0 00-1 1v1a1 1 0 001 1z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8v10a2 2 0 01-2 2H10a2 2 0 01-2-2V7z" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="font-medium text-blue-900">Browse Devices</h4>
                <p className="text-sm text-blue-600">Explore mobile devices</p>
              </div>
              <div className="ml-auto text-blue-400 group-hover:text-blue-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            <Link
              href="/blog"
              className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors group"
            >
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-7 9l3-3 3 3m-3-3v12" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="font-medium text-green-900">Read Blog</h4>
                <p className="text-sm text-green-600">Latest tech articles</p>
              </div>
              <div className="ml-auto text-green-400 group-hover:text-green-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            <Link
              href="/compare"
              className="flex items-center p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors group"
            >
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="font-medium text-purple-900">Compare Devices</h4>
                <p className="text-sm text-purple-600">Side-by-side comparison</p>
              </div>
              <div className="ml-auto text-purple-400 group-hover:text-purple-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {user?.role?.name === 'ADMIN' && (
              <Link
                href="/admin"
                className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors group"
              >
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="font-medium text-red-900">Admin Panel</h4>
                  <p className="text-sm text-red-600">Manage content & users</p>
                </div>
                <div className="ml-auto text-red-400 group-hover:text-red-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}