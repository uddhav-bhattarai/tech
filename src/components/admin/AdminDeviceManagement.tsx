/**
 * Admin Device Management Component
 * Comprehensive device inventory and specification management
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import {
  DevicePhoneMobileIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  StarIcon,
  ChartBarIcon,
  CalendarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface Device {
  id: string
  name: string
  slug: string
  brand: {
    name: string
    slug: string
  }
  category: {
    name: string
    slug: string
  }
  model: string
  releaseDate?: Date
  price?: number
  currency?: string
  images: string[]
  status: 'ACTIVE' | 'DISCONTINUED' | 'UPCOMING'
  averageRating?: number
  reviewCount: number
  comparisonCount: number
  viewCount: number
  createdAt: Date
  updatedAt: Date
  specifications: Record<string, unknown>
  tags: string[]
}

interface DeviceFilters {
  search: string
  brand: string
  category: string
  status: string
  priceRange: string
  dateRange: string
}

export default function AdminDeviceManagement() {
  const { data: session } = useSession()
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDevices, setSelectedDevices] = useState<string[]>([])
  
  const [filters, setFilters] = useState<DeviceFilters>({
    search: '',
    brand: 'all',
    category: 'all',
    status: 'all',
    priceRange: 'all',
    dateRange: 'all'
  })
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  const [stats, setStats] = useState({
    totalDevices: 0,
    activeDevices: 0,
    upcomingDevices: 0,
    totalReviews: 0,
    totalComparisons: 0,
    avgRating: 0
  })

  // Load devices function
  const loadDevices = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.brand !== 'all' && { brand: filters.brand }),
        ...(filters.category !== 'all' && { category: filters.category }),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.priceRange !== 'all' && { priceRange: filters.priceRange })
      })

      const response = await fetch(`/api/admin/devices?${params}`)
      const data = await response.json()

      if (response.ok) {
        setDevices(data.devices)
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        }))
      } else {
        setError(data.error || 'Failed to load devices')
      }
    } catch (error) {
      setError('Failed to load devices')
      console.error('Load devices error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load stats function
  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/devices/stats')
      const data = await response.json()

      if (response.ok) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Load stats error:', error)
    }
  }

  useEffect(() => {
    loadDevices()
    loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page])

  const handleStatusChange = async (deviceId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        await loadDevices()
        await loadStats()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update device status')
      }
    } catch (error) {
      setError('Failed to update device status')
      console.error('Status change error:', error)
    }
  }

  const handleBulkAction = async (action: 'activate' | 'discontinue' | 'delete') => {
    if (selectedDevices.length === 0) return

    const confirmMessage = action === 'delete' 
      ? `Are you sure you want to delete ${selectedDevices.length} devices? This action cannot be undone.`
      : `Are you sure you want to ${action} ${selectedDevices.length} devices?`

    if (!confirm(confirmMessage)) return

    try {
      const response = await fetch('/api/admin/devices/bulk', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deviceIds: selectedDevices,
          action
        })
      })

      if (response.ok) {
        setSelectedDevices([])
        await loadDevices()
        await loadStats()
      } else {
        const data = await response.json()
        setError(data.error || `Failed to ${action} devices`)
      }
    } catch (error) {
      setError(`Failed to ${action} devices`)
      console.error('Bulk action error:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      DISCONTINUED: 'bg-gray-100 text-gray-800',
      UPCOMING: 'bg-blue-100 text-blue-800'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        statusStyles[status] || statusStyles.ACTIVE
      }`}>
        {status}
      </span>
    )
  }

  const formatPrice = (price?: number, currency = 'USD') => {
    if (!price) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(price)
  }

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`
    return views.toString()
  }

  const renderRating = (rating?: number) => {
    if (!rating) return <span className="text-gray-400">No rating</span>
    
    return (
      <div className="flex items-center">
        <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
        <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    )
  }

  // Check admin permissions
  const hasDeviceAccess = session?.user?.role?.name === 'ADMIN' || 
    session?.user?.role?.permissions?.some(p => p.name === 'devices:manage')

  if (!hasDeviceAccess) {
    return (
      <div className="text-center py-12">
        <DevicePhoneMobileIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-500">You don&apos;t have permission to manage devices.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Device Management</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage device inventory, specifications, and reviews
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0">
          <Link
            href="/admin/devices/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Device
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DevicePhoneMobileIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Devices</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalDevices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeDevices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Upcoming</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.upcomingDevices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <EyeIcon className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Reviews</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalReviews}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Comparisons</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalComparisons}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <StarIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Rating</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.avgRating.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Devices
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search by name, model..."
              />
            </div>
          </div>

          {/* Brand Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand
            </label>
            <select
              value={filters.brand}
              onChange={(e) => setFilters(prev => ({ ...prev, brand: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Brands</option>
              <option value="apple">Apple</option>
              <option value="samsung">Samsung</option>
              <option value="google">Google</option>
              <option value="oneplus">OnePlus</option>
              <option value="xiaomi">Xiaomi</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="smartphones">Smartphones</option>
              <option value="tablets">Tablets</option>
              <option value="laptops">Laptops</option>
              <option value="wearables">Wearables</option>
              <option value="audio">Audio</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="DISCONTINUED">Discontinued</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Release Date
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Time</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="older">Older</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedDevices.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm text-blue-700">
                {selectedDevices.length} device{selectedDevices.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleBulkAction('activate')}
                className="text-sm font-medium text-green-600 hover:text-green-800"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('discontinue')}
                className="text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                Discontinue
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="text-sm font-medium text-red-600 hover:text-red-800"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedDevices([])}
                className="text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Devices Grid */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
              Loading devices...
            </div>
          </div>
        ) : devices.length === 0 ? (
          <div className="p-12 text-center">
            <DevicePhoneMobileIcon className="h-8 w-8 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No devices found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
            {devices.map((device) => (
              <div
                key={device.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={selectedDevices.includes(device.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDevices(prev => [...prev, device.id])
                      } else {
                        setSelectedDevices(prev => prev.filter(id => id !== device.id))
                      }
                    }}
                    className="absolute top-2 left-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded z-10"
                  />
                  
                  {device.images.length > 0 ? (
                    <Image
                      src={device.images[0]}
                      alt={device.name}
                      width={300}
                      height={200}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                      <DevicePhoneMobileIcon className="h-16 w-16 text-gray-400" />
                    </div>
                  )}

                  <div className="absolute top-2 right-2">
                    {getStatusBadge(device.status)}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {device.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {device.brand.name} • {device.category.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    {renderRating(device.averageRating)}
                    <span className="text-sm font-medium text-gray-900">
                      {formatPrice(device.price, device.currency)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>{device.reviewCount} reviews</span>
                    <span>{formatViews(device.viewCount)} views</span>
                  </div>

                  {device.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {device.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {tag}
                        </span>
                      ))}
                      {device.tags.length > 2 && (
                        <span className="text-xs text-gray-500">
                          +{device.tags.length - 2} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/devices/${device.slug}`}
                        className="text-green-600 hover:text-green-900"
                        title="View device"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/admin/devices/${device.id}/edit`}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit device"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => {/* Delete device */}}
                        className="text-red-600 hover:text-red-900"
                        title="Delete device"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <select
                      value={device.status}
                      onChange={(e) => handleStatusChange(device.id, e.target.value)}
                      className="text-xs border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="UPCOMING">Upcoming</option>
                      <option value="DISCONTINUED">Discontinued</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}