"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { 
  FunnelIcon,
  ChartBarIcon,
  InformationCircleIcon,
  StarIcon,
  DevicePhoneMobileIcon
} from "@heroicons/react/24/outline"
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid"

interface DeviceRanking {
  device: {
    id: string
    name: string
    slug: string
    model: string
    brand: {
      name: string
      logo: string | null
    }
    launchPrice: number | null
    currentPrice: number | null
    currency: string
    displaySize: number | null
    batteryCapacity: number | null
    ramConfigurations: number[]
    storageConfigurations: number[]
    operatingSystem: string | null
    chipset: string | null
    releaseDate: string | null
    weight: number | null
    waterResistance: string | null
    wirelessCharging: number | null
    mainCamera: Record<string, unknown> | null
    frontCamera: Record<string, unknown> | null
    securityFeatures: string[]
    images: Array<{
      url: string
      alt: string | null
    }>
    reviewCount: number
    averageRating: number | null
  }
  score: number
  breakdown: {
    performance: number
    battery: number
    camera: number
    display: number
    build: number
    price: number
    reviews: number
    recency: number
  }
  rank: number
}

interface RankingsData {
  rankings: DeviceRanking[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  filters: {
    category: string
    brand: string | null
    minPrice: number | null
    maxPrice: number | null
    preset: string
    weights: Record<string, number>
  }
  metadata: {
    availableBrands: Array<{ name: string }>
    priceRange: {
      min: number
      max: number
    }
    availablePresets: string[]
    totalDevices: number
  }
}

interface RankingsTableProps {
  initialData?: RankingsData
}

export default function RankingsTable({ initialData }: RankingsTableProps) {
  const [data, setData] = useState<RankingsData | null>(initialData || null)
  const [loading, setLoading] = useState(!initialData)
  const [selectedPreset, setSelectedPreset] = useState("balanced")
  const [selectedBrand, setSelectedBrand] = useState<string>("")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000])
  const [showFilters, setShowFilters] = useState(false)
  const [showScoreBreakdown, setShowScoreBreakdown] = useState<string | null>(null)

  const fetchRankings = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        preset: selectedPreset,
        limit: "20",
        offset: "0",
      })
      
      if (selectedBrand) {
        params.set("brand", selectedBrand)
      }
      
      if (priceRange[0] > 0) {
        params.set("minPrice", priceRange[0].toString())
      }
      
      if (priceRange[1] < 2000) {
        params.set("maxPrice", priceRange[1].toString())
      }

      const response = await fetch(`/api/rankings?${params}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error("Error fetching rankings:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRankings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPreset, selectedBrand, priceRange])

  const formatPrice = (price: number | null, currency: string) => {
    if (!price) return "N/A"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency === "NPR" ? "USD" : currency,
    }).format(currency === "NPR" ? price / 130 : price)
  }

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-100 text-yellow-800 border-yellow-300"
    if (rank === 2) return "bg-gray-100 text-gray-800 border-gray-300"
    if (rank === 3) return "bg-orange-100 text-orange-800 border-orange-300"
    if (rank <= 5) return "bg-blue-100 text-blue-800 border-blue-300"
    return "bg-gray-50 text-gray-600 border-gray-200"
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-blue-600"
    if (score >= 70) return "text-yellow-600"
    if (score >= 60) return "text-orange-600"
    return "text-red-600"
  }

  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-gray-400">No reviews</span>
    
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<StarIconSolid key={i} className="h-4 w-4 text-yellow-400" />)
    }
    
    if (hasHalfStar) {
      stars.push(<StarIconSolid key="half" className="h-4 w-4 text-yellow-400 opacity-50" />)
    }
    
    const remainingStars = 5 - Math.ceil(rating)
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<StarIcon key={`empty-${i}`} className="h-4 w-4 text-gray-300" />)
    }
    
    return (
      <div className="flex items-center">
        <div className="flex">{stars}</div>
        <span className="ml-1 text-sm text-gray-600">({rating.toFixed(1)})</span>
      </div>
    )
  }

  if (!data && loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
              Loading device rankings...
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <DevicePhoneMobileIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-2 text-lg font-semibold text-gray-900">No rankings available</h2>
          <p className="mt-1 text-sm text-gray-500">
            Unable to load device rankings. Please try again later.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="md:flex md:items-center md:justify-between mb-8">
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold leading-7 text-gray-900 sm:truncate sm:text-4xl sm:tracking-tight">
                Device Rankings
              </h1>
              <p className="mt-1 text-lg text-gray-500">
                Intelligent scoring based on specifications, reviews, and value
              </p>
            </div>
            
            <div className="mt-4 flex md:ml-4 md:mt-0">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <FunnelIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                Filters
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Ranking Preset */}
                <div>
                  <label htmlFor="preset" className="block text-sm font-medium text-gray-700 mb-2">
                    Ranking Focus
                  </label>
                  <select
                    id="preset"
                    value={selectedPreset}
                    onChange={(e) => setSelectedPreset(e.target.value)}
                    className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  >
                    <option value="balanced">Balanced</option>
                    <option value="gaming">Gaming Performance</option>
                    <option value="photography">Photography</option>
                    <option value="budget">Budget Value</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>

                {/* Brand Filter */}
                <div>
                  <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
                    Brand
                  </label>
                  <select
                    id="brand"
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  >
                    <option value="">All Brands</option>
                    {data.metadata.availableBrands.map((brand) => (
                      <option key={brand.name} value={brand.name}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range (USD)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min={0}
                      max={priceRange[1]}
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      placeholder="Min"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="number"
                      min={priceRange[0]}
                      max={5000}
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rankings Table */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Top {data.rankings.length} Devices
                  </h3>
                  <span className="text-sm text-gray-500">
                    ({data.metadata.totalDevices} total devices)
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <InformationCircleIcon className="h-4 w-4" />
                  <span>Click rank for score breakdown</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Rank
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Device
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Score
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Price
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Key Specs
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Rating
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {data.rankings.map((ranking) => (
                      <tr key={ranking.device.id} className="hover:bg-gray-50">
                        <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <button
                            onClick={() => setShowScoreBreakdown(
                              showScoreBreakdown === ranking.device.id ? null : ranking.device.id
                            )}
                            className={`inline-flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold text-sm transition-colors hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${getRankBadgeColor(ranking.rank)}`}
                            aria-label={`Rank ${ranking.rank}, click for score breakdown`}
                          >
                            {ranking.rank}
                          </button>
                        </td>
                        <td className="px-3 py-4 text-sm">
                          <div className="flex items-center space-x-3">
                            {ranking.device.images[0] && (
                              <div className="relative w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                <Image
                                  src={ranking.device.images[0].url}
                                  alt={ranking.device.images[0].alt || ranking.device.name}
                                  fill
                                  className="object-contain"
                                />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">
                                <Link
                                  href={`/devices/${ranking.device.slug}`}
                                  className="hover:text-blue-600"
                                >
                                  {ranking.device.name}
                                </Link>
                              </div>
                              <div className="text-gray-500">{ranking.device.brand.name}</div>
                              <div className="text-xs text-gray-400">{ranking.device.model}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <span className={`text-lg font-bold ${getScoreColor(ranking.score)}`}>
                              {ranking.score.toFixed(1)}
                            </span>
                            <button
                              onClick={() => setShowScoreBreakdown(
                                showScoreBreakdown === ranking.device.id ? null : ranking.device.id
                              )}
                              className="text-gray-400 hover:text-gray-600"
                              aria-label="View score breakdown"
                            >
                              <ChartBarIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-900">
                          <div>
                            <div className="font-medium">
                              {formatPrice(ranking.device.currentPrice || ranking.device.launchPrice, ranking.device.currency)}
                            </div>
                            {ranking.device.currentPrice && ranking.device.launchPrice && ranking.device.currentPrice !== ranking.device.launchPrice && (
                              <div className="text-xs text-gray-500 line-through">
                                {formatPrice(ranking.device.launchPrice, ranking.device.currency)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-700">
                          <div className="space-y-1">
                            {ranking.device.displaySize && (
                              <div>{ranking.device.displaySize}&quot; display</div>
                            )}
                            {ranking.device.ramConfigurations.length > 0 && (
                              <div>{Math.max(...ranking.device.ramConfigurations)}GB RAM</div>
                            )}
                            {ranking.device.batteryCapacity && (
                              <div>{ranking.device.batteryCapacity} mAh</div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-4 text-sm">
                          {renderStars(ranking.device.averageRating)}
                          <div className="text-xs text-gray-500 mt-1">
                            {ranking.device.reviewCount} review{ranking.device.reviewCount !== 1 ? 's' : ''}
                          </div>
                        </td>
                        <td className="relative py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link
                            href={`/devices/${ranking.device.slug}`}
                            className="text-blue-600 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Score Breakdown Modal/Overlay */}
          {showScoreBreakdown && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  {(() => {
                    const device = data.rankings.find(r => r.device.id === showScoreBreakdown)
                    if (!device) return null
                    
                    return (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            {device.device.images[0] && (
                              <div className="relative w-12 h-12 bg-gray-100 rounded-md overflow-hidden">
                                <Image
                                  src={device.device.images[0].url}
                                  alt={device.device.images[0].alt || device.device.name}
                                  fill
                                  className="object-contain"
                                />
                              </div>
                            )}
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                {device.device.name}
                              </h3>
                              <p className="text-sm text-gray-500">Score Breakdown</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="text-2xl font-bold text-blue-600">
                                {device.score.toFixed(1)}
                              </div>
                              <div className="text-sm text-gray-500">Overall Score</div>
                            </div>
                            <button
                              onClick={() => setShowScoreBreakdown(null)}
                              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full p-2"
                              aria-label="Close score breakdown"
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {Object.entries(device.breakdown).map(([category, score]) => (
                            <div key={category} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700 capitalize">
                                  {category}
                                </span>
                                <span className={`text-sm font-bold ${getScoreColor(score)}`}>
                                  {score.toFixed(1)}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    score >= 90 ? 'bg-green-500' :
                                    score >= 80 ? 'bg-blue-500' :
                                    score >= 70 ? 'bg-yellow-500' :
                                    score >= 60 ? 'bg-orange-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}