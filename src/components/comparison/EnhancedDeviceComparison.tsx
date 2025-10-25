"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { 
  PlusIcon, 
  XMarkIcon, 
  MagnifyingGlassIcon,
  StarIcon,
  DevicePhoneMobileIcon,
  BoltIcon,
  Battery0Icon,
  ArrowsRightLeftIcon
} from "@heroicons/react/24/outline"
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid"

interface Device {
  id: string
  name: string
  slug: string
  model: string
  brand: {
    id: string
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
  images: Array<{
    url: string
    alt: string | null
  }>
  // Additional fields for enhanced display
  description?: string
  rating?: number
  keyFeatures?: string[]
  pros?: string[]
  cons?: string[]
}

interface BlogDescription {
  id: string
  title: string
  excerpt: string
  content: string
  blogType: 'BLOG' | 'REVIEW' | 'DESCRIPTION'
  rating?: number
  deviceId?: string
}

interface EnhancedComparisonProps {
  initialDevices?: Device[]
}

export default function EnhancedDeviceComparison({ initialDevices = [] }: EnhancedComparisonProps) {
  const [devices, setDevices] = useState<Device[]>(initialDevices)
  const [deviceBlogs, setDeviceBlogs] = useState<Record<string, BlogDescription[]>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Device[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(!initialDevices.length)
  const [selectedView, setSelectedView] = useState<'specs' | 'detailed'>('detailed')

  const maxDevices = 3 // Reduced for better detailed view
  const canAddMore = devices.length < maxDevices

  // Search devices with blog descriptions
  const searchDevices = useCallback(async () => {
    try {
      setIsSearching(true)
      const response = await fetch(`/api/devices?search=${encodeURIComponent(searchQuery)}&limit=10&includeBlogDescriptions=true`)
      
      if (response.ok) {
        const data = await response.json()
        // Filter out devices already in comparison
        const filtered = data.devices.filter((device: Device) => 
          !devices.some(d => d.id === device.id)
        )
        setSearchResults(filtered)
      }
    } catch (error) {
      console.error("Error searching devices:", error)
    } finally {
      setIsSearching(false)
    }
  }, [searchQuery, devices])

  // Fetch blog descriptions for devices
  const fetchDeviceBlogs = async (deviceIds: string[]) => {
    try {
      const blogPromises = deviceIds.map(async (deviceId) => {
        const response = await fetch(`/api/blog?deviceId=${deviceId}&blogType=DESCRIPTION&blogType=REVIEW&limit=3`)
        if (response.ok) {
          const data = await response.json()
          return { deviceId, blogs: data.posts || [] }
        }
        return { deviceId, blogs: [] }
      })

      const results = await Promise.all(blogPromises)
      const blogMap = results.reduce((acc, { deviceId, blogs }) => {
        acc[deviceId] = blogs
        return acc
      }, {} as Record<string, BlogDescription[]>)

      setDeviceBlogs(prev => ({ ...prev, ...blogMap }))
    } catch (error) {
      console.error("Error fetching device blogs:", error)
    }
  }

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchDevices()
    } else {
      setSearchResults([])
    }
  }, [searchQuery, devices, searchDevices])

  useEffect(() => {
    if (devices.length > 0) {
      fetchDeviceBlogs(devices.map(d => d.id))
    }
  }, [devices])

  const addDevice = (device: Device) => {
    if (devices.length < maxDevices && !devices.some(d => d.id === device.id)) {
      setDevices([...devices, device])
      setSearchQuery("")
      setSearchResults([])
      
      if (devices.length === 0) {
        setShowSearch(false)
      }
    }
  }

  const removeDevice = (deviceId: string) => {
    setDevices(devices.filter(d => d.id !== deviceId))
    if (devices.length === 1) {
      setShowSearch(true)
    }
  }

  const formatPrice = (price: number | null, currency: string) => {
    if (!price) return "N/A"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency === "NPR" ? "USD" : currency,
    }).format(currency === "NPR" ? price / 130 : price)
  }

  const renderStarRating = (rating: number | undefined) => {
    if (!rating) return null
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= rating ? (
          <StarIconSolid key={i} className="h-4 w-4 text-yellow-400" />
        ) : (
          <StarIcon key={i} className="h-4 w-4 text-gray-300" />
        )
      )
    }
    return (
      <div className="flex items-center space-x-1">
        {stars}
        <span className="text-sm text-gray-600 ml-2">{rating}/5</span>
      </div>
    )
  }

  const renderDeviceCard = (device: Device) => {
    const blogs = deviceBlogs[device.id] || []
    const reviewBlog = blogs.find(b => b.blogType === 'REVIEW')
    const descriptionBlog = blogs.find(b => b.blogType === 'DESCRIPTION')

    return (
      <div key={device.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Device Header */}
        <div className="relative">
          {device.images[0] && (
            <div className="relative w-full h-48 bg-gray-50">
              <Image
                src={device.images[0].url}
                alt={device.images[0].alt || device.name}
                fill
                className="object-contain p-4"
              />
            </div>
          )}
          <button
            onClick={() => removeDevice(device.id)}
            className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm rounded-full p-2 text-gray-400 hover:text-red-500 hover:bg-white transition-all"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Device Info */}
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              <Link href={`/devices/${device.slug}`} className="hover:text-blue-600">
                {device.name}
              </Link>
            </h3>
            <p className="text-sm text-gray-500">{device.brand.name} • {device.model}</p>
            {reviewBlog?.rating && renderStarRating(reviewBlog.rating)}
          </div>

          {/* Price */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Current Price</span>
              <span className="text-lg font-semibold text-green-600">
                {formatPrice(device.currentPrice || device.launchPrice, device.currency)}
              </span>
            </div>
            {device.launchPrice && device.currentPrice && device.launchPrice !== device.currentPrice && (
              <div className="text-sm text-gray-400 line-through">
                Launch: {formatPrice(device.launchPrice, device.currency)}
              </div>
            )}
          </div>

          {/* Quick Specs */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <DevicePhoneMobileIcon className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Display</span>
              </div>
              <span className="font-medium">
                {device.displaySize ? `${device.displaySize}"` : "N/A"}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <BoltIcon className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Processor</span>
              </div>
              <span className="font-medium text-right max-w-32 truncate">
                {device.chipset || "N/A"}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Battery0Icon className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Battery</span>
              </div>
              <span className="font-medium">
                {device.batteryCapacity ? `${device.batteryCapacity} mAh` : "N/A"}
              </span>
            </div>
          </div>

          {/* Blog Descriptions */}
          {(descriptionBlog || reviewBlog) && (
            <div className="space-y-3">
              {descriptionBlog && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                    {descriptionBlog.excerpt}
                  </p>
                  <Link 
                    href={`/blog/${descriptionBlog.id}`}
                    className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center mt-1"
                  >
                    Read more →
                  </Link>
                </div>
              )}

              {reviewBlog && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Review</h4>
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                    {reviewBlog.excerpt}
                  </p>
                  <Link 
                    href={`/blog/${reviewBlog.id}`}
                    className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center mt-1"
                  >
                    Read full review →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
        <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between mb-8">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                Device Comparison
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Compare devices side by side with detailed specifications and reviews
              </p>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search Section */}
          {(showSearch || canAddMore) && (
            <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full rounded-md border-0 py-3 pl-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  placeholder="Search for devices to compare (e.g., iPhone 16, Samsung Galaxy S24)..."
                />
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-4 max-h-80 overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {searchResults.map((device) => (
                      <button
                        key={device.id}
                        onClick={() => addDevice(device)}
                        className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-left transition-colors"
                      >
                        {device.images[0] && (
                          <div className="relative w-16 h-16 mr-4 bg-white rounded-md overflow-hidden flex-shrink-0">
                            <Image
                              src={device.images[0].url}
                              alt={device.images[0].alt || device.name}
                              fill
                              className="object-contain p-1"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {device.brand.name} {device.name}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {device.model}
                          </p>
                          <p className="text-sm font-medium text-green-600">
                            {formatPrice(device.currentPrice || device.launchPrice, device.currency)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isSearching && (
                <div className="mt-4 text-center text-gray-500">
                  <div className="inline-flex items-center">
                    <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full mr-2"></div>
                    Searching devices...
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Comparison Display */}
          {devices.length > 0 && (
            <>
              {/* View Toggle */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">View:</span>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setSelectedView('detailed')}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        selectedView === 'detailed'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Detailed Cards
                    </button>
                    <button
                      onClick={() => setSelectedView('specs')}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        selectedView === 'specs'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Spec Table
                    </button>
                  </div>
                </div>

                {canAddMore && (
                  <button
                    onClick={() => setShowSearch(true)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Device
                  </button>
                )}
              </div>

              {/* Detailed Cards View */}
              {selectedView === 'detailed' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {devices.map((device) => renderDeviceCard(device))}
                </div>
              )}

              {/* Spec Table View */}
              {selectedView === 'specs' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="sticky left-0 z-20 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Specification
                          </th>
                          {devices.map((device) => (
                            <th key={device.id} scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 min-w-64">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  {device.images[0] && (
                                    <div className="relative w-10 h-10 bg-white rounded-md overflow-hidden flex-shrink-0">
                                      <Image
                                        src={device.images[0].url}
                                        alt={device.images[0].alt || device.name}
                                        fill
                                        className="object-contain"
                                      />
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      <Link href={`/devices/${device.slug}`} className="hover:text-blue-600">
                                        {device.name}
                                      </Link>
                                    </div>
                                    <div className="text-sm text-gray-500">{device.brand.name}</div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeDevice(device.id)}
                                  className="text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-full p-1"
                                >
                                  <XMarkIcon className="h-5 w-5" />
                                </button>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {devices.length === 0 && (
            <div className="text-center py-12">
              <ArrowsRightLeftIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No devices selected</h3>
              <p className="mt-1 text-sm text-gray-500">
                Search and add devices above to start comparing their specifications.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}