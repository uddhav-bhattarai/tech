/**
 * Device Ranking System
 * Sophisticated ranking algorithms with weighted scoring, category analysis,
 * trend tracking, and performance metrics
 */

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  ChartBarIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  StarIcon,
  CurrencyDollarIcon,
  FireIcon,
  ClockIcon,
  AdjustmentsHorizontalIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { StarIcon as SolidStarIcon } from '@heroicons/react/24/solid'

interface Device {
  id: string
  name: string
  model: string
  slug: string
  brand: {
    name: string
    logo?: string
  }
  currentPrice?: number
  averageRating?: number
  views?: number
  releaseDate?: Date
  categories: { name: string }[]
  specifications: { category: string; name: string; value: string }[]
  features: { name: string; available: boolean }[]
  trendScore?: number
  popularityRank?: number
  previousRank?: number
}

interface RankingCriteria {
  price: number // 0-10
  performance: number // 0-10
  popularity: number // 0-10
  ratings: number // 0-10
  newness: number // 0-10
  value: number // 0-10
  features: number // 0-10
}

interface RankingFilters {
  categories: string[]
  priceRange: [number, number]
  brands: string[]
  minRating: number
  releaseDateRange: string // 'all' | 'past-year' | 'past-month'
  sortBy: 'overall' | 'trending' | 'value' | 'popular' | 'newest'
  limit: number
}

interface TrendData {
  deviceId: string
  trend: 'up' | 'down' | 'stable'
  changePercent: number
  periodDays: number
}

const DEFAULT_CRITERIA: RankingCriteria = {
  price: 8,
  performance: 9,
  popularity: 7,
  ratings: 8,
  newness: 6,
  value: 8,
  features: 7
}

const CATEGORY_OPTIONS = [
  'Smartphones',
  'Laptops', 
  'Tablets',
  'Smartwatches',
  'Headphones',
  'Gaming',
  'Cameras'
]

const BRAND_OPTIONS = [
  'Apple',
  'Samsung',
  'Google',
  'OnePlus',
  'Xiaomi',
  'Sony',
  'Dell',
  'HP',
  'Lenovo'
]

export default function DeviceRankingSystem() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [rankingCriteria, setRankingCriteria] = useState<RankingCriteria>(DEFAULT_CRITERIA)
  const [filters, setFilters] = useState<RankingFilters>({
    categories: [],
    priceRange: [0, 5000],
    brands: [],
    minRating: 0,
    releaseDateRange: 'all',
    sortBy: 'overall',
    limit: 50
  })
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [activeView, setActiveView] = useState<'rankings' | 'trends' | 'analytics'>('rankings')

  // Load devices and ranking data
  useEffect(() => {
    loadRankingData()
  }, [filters])

  const loadRankingData = async () => {
    setLoading(true)
    try {
      // Mock API call - in real app would fetch from /api/rankings
      const mockDevices: Device[] = Array.from({ length: 25 }, (_, i) => ({
        id: `device_${i + 1}`,
        name: `Device ${i + 1}`,
        model: `Model ${String.fromCharCode(65 + i)}`,
        slug: `device-${i + 1}`,
        brand: {
          name: BRAND_OPTIONS[i % BRAND_OPTIONS.length],
          logo: undefined
        },
        currentPrice: Math.floor(Math.random() * 2000) + 200,
        averageRating: Math.random() * 2 + 3, // 3-5 rating
        views: Math.floor(Math.random() * 10000) + 1000,
        releaseDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        categories: [{ name: CATEGORY_OPTIONS[Math.floor(Math.random() * CATEGORY_OPTIONS.length)] }],
        specifications: [
          { category: 'Performance', name: 'Processor', value: `${Math.random() * 3 + 1.5}GHz` },
          { category: 'Display', name: 'Screen Size', value: `${Math.random() * 2 + 5}"` },
          { category: 'Battery', name: 'Capacity', value: `${Math.floor(Math.random() * 2000) + 3000}mAh` }
        ],
        features: [
          { name: 'Wireless Charging', available: Math.random() > 0.5 },
          { name: 'Water Resistance', available: Math.random() > 0.3 },
          { name: '5G Support', available: Math.random() > 0.4 }
        ],
        trendScore: Math.random() * 100,
        previousRank: i + Math.floor(Math.random() * 10) - 5
      }))

      setDevices(mockDevices)
      
      // Generate trend data
      setTrendData(mockDevices.map(device => ({
        deviceId: device.id,
        trend: Math.random() > 0.33 ? (Math.random() > 0.5 ? 'up' : 'down') : 'stable',
        changePercent: Math.random() * 20 - 10,
        periodDays: 7
      })))
      
    } catch (error) {
      console.error('Failed to load ranking data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate device scores based on criteria
  const calculateDeviceScore = useMemo(() => {
    return (device: Device): number => {
      let score = 0
      let totalWeight = 0

      // Price score (lower is better)
      if (device.currentPrice && rankingCriteria.price > 0) {
        const priceScore = Math.max(0, 100 - (device.currentPrice / 50)) // Scale price
        score += priceScore * rankingCriteria.price
        totalWeight += rankingCriteria.price
      }

      // Performance score (mock calculation)
      if (rankingCriteria.performance > 0) {
        const performanceScore = Math.random() * 40 + 60 // 60-100
        score += performanceScore * rankingCriteria.performance
        totalWeight += rankingCriteria.performance
      }

      // Popularity score (based on views)
      if (device.views && rankingCriteria.popularity > 0) {
        const popularityScore = Math.min(100, (device.views / 100))
        score += popularityScore * rankingCriteria.popularity
        totalWeight += rankingCriteria.popularity
      }

      // Rating score
      if (device.averageRating && rankingCriteria.ratings > 0) {
        const ratingScore = (device.averageRating / 5) * 100
        score += ratingScore * rankingCriteria.ratings
        totalWeight += rankingCriteria.ratings
      }

      // Newness score
      if (device.releaseDate && rankingCriteria.newness > 0) {
        const daysSinceRelease = (Date.now() - device.releaseDate.getTime()) / (1000 * 60 * 60 * 24)
        const newnessScore = Math.max(0, 100 - (daysSinceRelease / 10)) // Decay over time
        score += newnessScore * rankingCriteria.newness
        totalWeight += rankingCriteria.newness
      }

      // Value score (rating vs price)
      if (device.currentPrice && device.averageRating && rankingCriteria.value > 0) {
        const valueScore = (device.averageRating * 1000) / device.currentPrice
        score += Math.min(100, valueScore * 20) * rankingCriteria.value
        totalWeight += rankingCriteria.value
      }

      // Features score
      if (rankingCriteria.features > 0) {
        const availableFeatures = device.features.filter(f => f.available).length
        const featureScore = (availableFeatures / device.features.length) * 100
        score += featureScore * rankingCriteria.features
        totalWeight += rankingCriteria.features
      }

      return totalWeight > 0 ? score / totalWeight : 0
    }
  }, [rankingCriteria])

  // Ranked devices with scores
  const rankedDevices = useMemo(() => {
    const scored = devices.map(device => ({
      ...device,
      score: calculateDeviceScore(device),
      rank: 0
    }))

    // Apply filters
    const filtered = scored.filter(device => {
      if (filters.categories.length && !device.categories.some(cat => filters.categories.includes(cat.name))) {
        return false
      }
      if (filters.brands.length && !filters.brands.includes(device.brand.name)) {
        return false
      }
      if (device.currentPrice && (device.currentPrice < filters.priceRange[0] || device.currentPrice > filters.priceRange[1])) {
        return false
      }
      if (device.averageRating && device.averageRating < filters.minRating) {
        return false
      }
      return true
    })

    // Sort by criteria
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'trending':
          return (b.trendScore || 0) - (a.trendScore || 0)
        case 'value':
          const valueA = a.averageRating && a.currentPrice ? (a.averageRating * 1000) / a.currentPrice : 0
          const valueB = b.averageRating && b.currentPrice ? (b.averageRating * 1000) / b.currentPrice : 0
          return valueB - valueA
        case 'popular':
          return (b.views || 0) - (a.views || 0)
        case 'newest':
          return (b.releaseDate?.getTime() || 0) - (a.releaseDate?.getTime() || 0)
        default:
          return b.score - a.score
      }
    })

    // Assign ranks
    filtered.forEach((device, index) => {
      device.rank = index + 1
    })

    return filtered.slice(0, filters.limit)
  }, [devices, filters, calculateDeviceScore])

  // Render ranking criteria controls
  const renderCriteriaControls = () => (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Ranking Criteria</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(rankingCriteria).map(([key, value]) => (
          <div key={key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 capitalize">
              {key} ({value})
            </label>
            <input
              type="range"
              min="0"
              max="10"
              value={value}
              onChange={(e) => setRankingCriteria(prev => ({
                ...prev,
                [key]: parseInt(e.target.value)
              }))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0</span>
              <span>10</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // Render device ranking card
  const renderDeviceCard = (device: Device & { score: number; rank: number }) => {
    const trend = trendData.find(t => t.deviceId === device.id)
    const rankChange = device.previousRank ? device.rank - device.previousRank : 0

    return (
      <div key={device.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
        {/* Rank and Trend */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className={`text-2xl font-bold w-12 h-12 rounded-full flex items-center justify-center ${
              device.rank <= 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {device.rank}
            </div>
            
            {device.rank <= 3 && (
              <TrophyIcon className="h-6 w-6 text-yellow-500 ml-2" />
            )}
            
            {rankChange !== 0 && (
              <div className={`ml-3 flex items-center ${
                rankChange > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {rankChange > 0 ? (
                  <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                )}
                <span className="text-sm font-medium">{Math.abs(rankChange)}</span>
              </div>
            )}
          </div>

          <div className="text-right">
            <div className="text-lg font-semibold text-gray-900">
              {device.score.toFixed(1)}
            </div>
            <div className="text-sm text-gray-500">Score</div>
          </div>
        </div>

        {/* Device Info */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{device.name}</h3>
          <p className="text-gray-600">{device.brand.name} • {device.model}</p>
          <div className="flex items-center mt-1">
            {device.categories.map(cat => (
              <span key={cat.name} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                {cat.name}
              </span>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          {device.currentPrice && (
            <div>
              <div className="text-gray-500">Price</div>
              <div className="font-semibold text-green-600">
                ${device.currentPrice.toLocaleString()}
              </div>
            </div>
          )}

          {device.averageRating && (
            <div>
              <div className="text-gray-500">Rating</div>
              <div className="flex items-center">
                <SolidStarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                <span className="font-semibold">{device.averageRating.toFixed(1)}</span>
              </div>
            </div>
          )}

          {device.views && (
            <div>
              <div className="text-gray-500">Views</div>
              <div className="font-semibold">{device.views.toLocaleString()}</div>
            </div>
          )}

          {trend && (
            <div>
              <div className="text-gray-500">Trending</div>
              <div className={`flex items-center font-semibold ${
                trend.trend === 'up' ? 'text-green-600' : 
                trend.trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {trend.trend === 'up' ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                ) : trend.trend === 'down' ? (
                  <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                ) : (
                  <div className="w-4 h-1 bg-gray-400 rounded mr-1" />
                )}
                <span>{trend.changePercent > 0 ? '+' : ''}{trend.changePercent.toFixed(1)}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            View Details
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <TrophyIcon className="h-8 w-8 mr-3 text-yellow-500" />
                Device Rankings
              </h1>
              <p className="text-gray-600 mt-2">
                Comprehensive device rankings with advanced analytics and trend tracking
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  showFilters ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filters
              </button>
              
              <button className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
                Customize
              </button>
            </div>
          </div>

          {/* View Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="flex space-x-8">
              {[
                { id: 'rankings', label: 'Rankings', icon: ChartBarIcon },
                { id: 'trends', label: 'Trends', icon: ArrowTrendingUpIcon },
                { id: 'analytics', label: 'Analytics', icon: StarIcon }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id as 'rankings' | 'trends' | 'analytics')}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeView === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Ranking Criteria */}
        {renderCriteriaControls()}

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categories
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {CATEGORY_OPTIONS.map(category => (
                    <label key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(category)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({ ...prev, categories: [...prev.categories, category] }))
                          } else {
                            setFilters(prev => ({ ...prev, categories: prev.categories.filter(c => c !== category) }))
                          }
                        }}
                        className="rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Brand Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brands
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {BRAND_OPTIONS.map(brand => (
                    <label key={brand} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.brands.includes(brand)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({ ...prev, brands: [...prev.brands, brand] }))
                          } else {
                            setFilters(prev => ({ ...prev, brands: prev.brands.filter(b => b !== brand) }))
                          }
                        }}
                        className="rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{brand}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="5000"
                    value={filters.priceRange[1]}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      priceRange: [prev.priceRange[0], parseInt(e.target.value)] 
                    }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>${filters.priceRange[0]}</span>
                    <span>${filters.priceRange[1]}</span>
                  </div>
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as 'overall' | 'trending' | 'value' | 'popular' | 'newest' }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="overall">Overall Score</option>
                  <option value="trending">Trending</option>
                  <option value="value">Best Value</option>
                  <option value="popular">Most Popular</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Rankings Grid */}
        {activeView === 'rankings' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Top {rankedDevices.length} Devices
              </h2>
              <span className="text-sm text-gray-600">
                Updated {new Date().toLocaleDateString()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rankedDevices.map(renderDeviceCard)}
            </div>
          </div>
        )}

        {/* Trending View */}
        {activeView === 'trends' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Trending Devices</h2>
              <p className="text-gray-600">
                Devices with the highest momentum and recent interest
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rankedDevices
                .filter(device => {
                  const trend = trendData.find(t => t.deviceId === device.id)
                  return trend && trend.trend === 'up'
                })
                .slice(0, 12)
                .map(renderDeviceCard)}
            </div>
          </div>
        )}

        {/* Analytics View */}
        {activeView === 'analytics' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Market Analytics</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <FireIcon className="h-8 w-8 text-red-500 mr-3" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {trendData.filter(t => t.trend === 'up').length}
                    </div>
                    <div className="text-sm text-gray-600">Trending Up</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-8 w-8 text-green-500 mr-3" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      ${Math.round(devices.reduce((sum, d) => sum + (d.currentPrice || 0), 0) / devices.length)}
                    </div>
                    <div className="text-sm text-gray-600">Avg Price</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <StarIcon className="h-8 w-8 text-yellow-500 mr-3" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {(devices.reduce((sum, d) => sum + (d.averageRating || 0), 0) / devices.length).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Avg Rating</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <ClockIcon className="h-8 w-8 text-blue-500 mr-3" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {devices.filter(d => {
                        if (!d.releaseDate) return false
                        const daysSince = (Date.now() - d.releaseDate.getTime()) / (1000 * 60 * 60 * 24)
                        return daysSince <= 90
                      }).length}
                    </div>
                    <div className="text-sm text-gray-600">Recent Releases</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-600 mb-4">More detailed analytics coming soon</p>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Request Custom Analytics
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}