'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Save, ArrowLeft, Edit3 } from 'lucide-react'
import Link from 'next/link'

interface Brand {
  id: string
  name: string
  slug: string
}

interface Device {
  id: string
  name: string
  model: string
  slug: string
  brandId: string
  releaseDate: string | null
  launchPrice: number | null
  currentPrice: number | null
  currency: string
  availability: string
  isActive: boolean
  displaySize: number | null
  displayTechnology: string | null
  displayResolution: {
    width: number | null
    height: number | null
  } | null
  refreshRate: number | null
  chipset: string | null
  batteryCapacity: number | null
  chargingSpeed: number | null
  wirelessCharging: boolean
  operatingSystem: string | null
  osVersion: string | null
  dimensions: {
    length: number | null
    width: number | null
    thickness: number | null
  } | null
  weight: number | null
  colors: string[]
  waterResistance: string | null
  mainCamera: {
    megapixels: number | null
    aperture: string | null
  } | null
  frontCamera: {
    megapixels: number | null
    aperture: string | null
  } | null
  ramConfigurations: number[]
  storageConfigurations: number[]
}

const EditDevicePage: React.FC<{ params: { id: string } }> = ({ params }) => {
  const router = useRouter()
  const [device, setDevice] = useState<Device | null>(null)
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deviceResponse, brandsResponse] = await Promise.all([
          fetch(`/api/admin/devices/${params.id}`),
          fetch('/api/brands')
        ])

        const deviceData = await deviceResponse.json()
        const brandsData = await brandsResponse.json()

        if (deviceData.success) {
          setDevice(deviceData.device)
        } else {
          setError('Device not found')
        }

        if (brandsData.success) {
          setBrands(brandsData.brands || [])
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
        setError('Failed to load device data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id])

  const handleInputChange = (field: string, value: unknown) => {
    setDevice(prev => prev ? ({
      ...prev,
      [field]: value
    }) : null)
  }

  const handleNestedChange = (parent: string, field: string, value: unknown) => {
    setDevice(prev => prev ? ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof Device] as Record<string, unknown> || {}),
        [field]: value
      }
    }) : null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!device) return

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/devices/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(device)
      })

      const result = await response.json()

      if (result.success) {
        router.push('/admin/devices')
      } else {
        setError(result.error || 'Failed to update device')
      }
    } catch (error) {
      console.error('Device update error:', error)
      setError('Failed to update device')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-lg text-slate-800 mt-4">Loading device...</p>
        </div>
      </div>
    )
  }

  if (!device) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-8">
        <div className="text-center py-12">
          <p className="text-lg text-red-500">{error || 'Device not found'}</p>
          <Link href="/admin/devices" className="text-blue-600 hover:underline mt-4 inline-block">
            Back to Devices
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-8">
      <AdminPageHeader
        title={`Edit ${device.name}`}
        description="Update device information"
        icon={<Edit3 className="w-8 h-8" />}
        actions={
          <div className="flex gap-3">
            <Link
              href="/admin/devices"
              className="inline-flex items-center gap-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
            <button
              type="submit"
              form="device-form"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Updating...' : 'Update Device'}
            </button>
          </div>
        }
      />

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form id="device-form" onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Device Name *
              </label>
              <input
                type="text"
                required
                value={device.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model *
              </label>
              <input
                type="text"
                required
                value={device.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand *
              </label>
              <select
                required
                value={device.brandId}
                onChange={(e) => handleInputChange('brandId', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Brand</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL Slug
              </label>
              <input
                type="text"
                value={device.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Release Date
              </label>
              <input
                type="date"
                value={device.releaseDate || ''}
                onChange={(e) => handleInputChange('releaseDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={device.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Pricing & Availability</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Launch Price
              </label>
              <input
                type="number"
                value={device.launchPrice || ''}
                onChange={(e) => handleInputChange('launchPrice', e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Price
              </label>
              <input
                type="number"
                value={device.currentPrice || ''}
                onChange={(e) => handleInputChange('currentPrice', e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                value={device.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="NPR">NPR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="INR">INR</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Availability
              </label>
              <select
                value={device.availability}
                onChange={(e) => handleInputChange('availability', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="available">Available</option>
                <option value="discontinued">Discontinued</option>
                <option value="upcoming">Upcoming</option>
              </select>
            </div>
          </div>
        </div>

        {/* Display Specifications */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Display Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Size (inches)
              </label>
              <input
                type="number"
                step="0.1"
                value={device.displaySize || ''}
                onChange={(e) => handleInputChange('displaySize', e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Technology
              </label>
              <input
                type="text"
                value={device.displayTechnology || ''}
                onChange={(e) => handleInputChange('displayTechnology', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refresh Rate (Hz)
              </label>
              <input
                type="number"
                value={device.refreshRate || ''}
                onChange={(e) => handleInputChange('refreshRate', e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resolution Width
              </label>
              <input
                type="number"
                value={device.displayResolution?.width || ''}
                onChange={(e) => handleNestedChange('displayResolution', 'width', e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resolution Height
              </label>
              <input
                type="number"
                value={device.displayResolution?.height || ''}
                onChange={(e) => handleNestedChange('displayResolution', 'height', e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Updating Device...' : 'Update Device'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default EditDevicePage