/**
 * Ranking Analytics Dashboard
 * Advanced analytics for device rankings and trends
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { TrendingUpIcon, TrendingDownIcon, ChartBarIcon, DevicePhoneMobileIcon, StarIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'

interface RankingAnalytics {
  totalDevices: number
  averagePrice: number
  averageRating: number
  trendingUp: number
  trendingDown: number
  newReleases: number
  priceDistribution: { range: string; count: number; percentage: number }[]
  brandDistribution: { brand: string; count: number; marketShare: number }[]
  categoryTrends: { category: string; trend: 'up' | 'down' | 'stable'; change: number }[]
  topPerformers: { deviceId: string; name: string; brand: string; score: number; rank: number }[]
}

export default function RankingAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<RankingAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('7d')

  interface RankingData {
    device: {
      id: string
      name: string
      brand: { name: string }
      currentPrice: number | null
      launchPrice: number | null
      averageRating: number | null
    }
    score: number
  }

  const generateAnalytics = useCallback((rankings: RankingData[]): RankingAnalytics => {
    const devices = rankings.map(r => r.device)
    
    const totalDevices = devices.length
    const averagePrice = devices.reduce((sum, d) => sum + (d.currentPrice || d.launchPrice || 0), 0) / totalDevices
    const averageRating = devices.reduce((sum, d) => sum + (d.averageRating || 0), 0) / totalDevices
    
    // Price distribution
    const priceRanges = [
      { range: 'Under $200', min: 0, max: 200 },
      { range: '$200-$500', min: 200, max: 500 },
      { range: '$500-$800', min: 500, max: 800 },
      { range: '$800-$1200', min: 800, max: 1200 },
      { range: 'Over $1200', min: 1200, max: Infinity }
    ]
    
    const priceDistribution = priceRanges.map(range => {
      const count = devices.filter(d => {
        const price = d.currentPrice || d.launchPrice || 0
        return price >= range.min && price < range.max
      }).length
      
      return {
        range: range.range,
        count,
        percentage: (count / totalDevices) * 100
      }
    })
    
    // Brand distribution
    const brandCounts = devices.reduce((acc, device) => {
      const brand = device.brand.name
      acc[brand] = (acc[brand] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const brandDistribution = Object.entries(brandCounts)
      .map(([brand, count]) => ({
        brand,
        count,
        marketShare: (count / totalDevices) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
    
    // Category trends (mock data)
    const categoryTrends = [
      { category: 'Smartphones', trend: 'up' as const, change: 12.5 },
      { category: 'Tablets', trend: 'down' as const, change: -5.2 },
      { category: 'Laptops', trend: 'up' as const, change: 8.7 },
      { category: 'Smartwatches', trend: 'stable' as const, change: 1.2 },
      { category: 'Gaming', trend: 'up' as const, change: 15.3 }
    ]
    
    // Top performers
    const topPerformers = rankings.slice(0, 5).map((ranking, index) => ({
      deviceId: ranking.device.id,
      name: ranking.device.name,
      brand: ranking.device.brand.name,
      score: ranking.score,
      rank: index + 1
    }))
    
    return {
      totalDevices,
      averagePrice: Math.round(averagePrice),
      averageRating: parseFloat(averageRating.toFixed(1)),
      trendingUp: Math.floor(Math.random() * 20) + 10,
      trendingDown: Math.floor(Math.random() * 15) + 5,
      newReleases: Math.floor(Math.random() * 8) + 2,
      priceDistribution,
      brandDistribution,
      categoryTrends,
      topPerformers
    }
  }, [])

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      
      // Fetch rankings data
      const response = await fetch(`/api/rankings?limit=100`)
      const data = await response.json()
      
      if (data.rankings) {
        const mockAnalytics = generateAnalytics(data.rankings)
        setAnalytics(mockAnalytics)
      }
      
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [generateAnalytics])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  const generateAnalytics = (rankings: RankingData[]): RankingAnalytics => {
    const devices = rankings.map(r => r.device)
    
    const totalDevices = devices.length
    const averagePrice = devices.reduce((sum, d) => sum + (d.currentPrice || d.launchPrice || 0), 0) / totalDevices
    const averageRating = devices.reduce((sum, d) => sum + (d.averageRating || 0), 0) / totalDevices
    
    // Price distribution
    const priceRanges = [
      { range: 'Under $200', min: 0, max: 200 },
      { range: '$200-$500', min: 200, max: 500 },
      { range: '$500-$800', min: 500, max: 800 },
      { range: '$800-$1200', min: 800, max: 1200 },
      { range: 'Over $1200', min: 1200, max: Infinity }
    ]
    
    const priceDistribution = priceRanges.map(range => {
      const count = devices.filter(d => {
        const price = d.currentPrice || d.launchPrice || 0
        return price >= range.min && price < range.max
      }).length
      
      return {
        range: range.range,
        count,
        percentage: (count / totalDevices) * 100
      }
    })
    
    // Brand distribution
    const brandCounts = devices.reduce((acc, device) => {
      const brand = device.brand.name
      acc[brand] = (acc[brand] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const brandDistribution = Object.entries(brandCounts)
      .map(([brand, count]) => ({
        brand,
        count,
        marketShare: (count / totalDevices) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
    
    // Category trends (mock data)
    const categoryTrends = [
      { category: 'Smartphones', trend: 'up' as const, change: 12.5 },
      { category: 'Tablets', trend: 'down' as const, change: -5.2 },
      { category: 'Laptops', trend: 'up' as const, change: 8.7 },
      { category: 'Smartwatches', trend: 'stable' as const, change: 1.2 },
      { category: 'Gaming', trend: 'up' as const, change: 15.3 }
    ]
    
    // Top performers
    const topPerformers = rankings.slice(0, 5).map((ranking, index) => ({
      deviceId: ranking.device.id,
      name: ranking.device.name,
      brand: ranking.device.brand.name,
      score: ranking.score,
      rank: index + 1
    }))
    
    return {
      totalDevices,
      averagePrice: Math.round(averagePrice),
      averageRating: parseFloat(averageRating.toFixed(1)),
      trendingUp: Math.floor(Math.random() * 20) + 10,
      trendingDown: Math.floor(Math.random() * 15) + 5,
      newReleases: Math.floor(Math.random() * 8) + 2,
      priceDistribution,
      brandDistribution,
      categoryTrends,
      topPerformers
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow h-32"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
          <p className="text-gray-500">Unable to load ranking analytics at this time.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ranking Analytics</h1>
            <p className="mt-2 text-gray-600">Comprehensive insights into device rankings and market trends</p>
          </div>
          
          <div className="mt-4 sm:mt-0">
            <select 
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="1d">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <DevicePhoneMobileIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Devices</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalDevices}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Price</p>
                <p className="text-2xl font-bold text-gray-900">${analytics.averagePrice}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <StarIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.averageRating}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <TrendingUpIcon className="h-8 w-8 text-emerald-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Trending Up</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.trendingUp}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Price Distribution */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Distribution</h3>
            <div className="space-y-4">
              {analytics.priceDistribution.map((range) => (
                <div key={range.range} className="flex items-center">
                  <div className="w-20 text-sm text-gray-600 flex-shrink-0">{range.range}</div>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${range.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-sm text-gray-900 w-16 text-right">
                    {range.count} ({range.percentage.toFixed(1)}%)
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Brand Market Share */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Brand Market Share</h3>
            <div className="space-y-3">
              {analytics.brandDistribution.slice(0, 8).map((brand) => (
                <div key={brand.brand} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{brand.brand}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${brand.marketShare}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {brand.marketShare.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Trends */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Trends</h3>
            <div className="space-y-4">
              {analytics.categoryTrends.map((category) => (
                <div key={category.category} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{category.category}</span>
                  <div className="flex items-center space-x-2">
                    {category.trend === 'up' ? (
                      <TrendingUpIcon className="h-4 w-4 text-green-600" />
                    ) : category.trend === 'down' ? (
                      <TrendingDownIcon className="h-4 w-4 text-red-600" />
                    ) : (
                      <div className="h-4 w-4 bg-gray-400 rounded-full" />
                    )}
                    <span className={`text-sm font-medium ${
                      category.trend === 'up' ? 'text-green-600' : 
                      category.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {category.change > 0 ? '+' : ''}{category.change}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h3>
            <div className="space-y-4">
              {analytics.topPerformers.map((device) => (
                <div key={device.deviceId} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-yellow-800">#{device.rank}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{device.name}</p>
                      <p className="text-xs text-gray-500">{device.brand}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{device.score.toFixed(1)}</p>
                    <p className="text-xs text-gray-500">Score</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}