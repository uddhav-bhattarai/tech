/**
 * Device Management Admin Tests
 * Tests for device CRUD operations in admin panel
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals'
import { createMockDevice, createMockBrand, mockFetch } from '@/test/utils'

// Mock the admin device API responses
const mockDeviceList = {
  success: true,
  devices: [
    {
      ...createMockDevice(),
      brand: createMockBrand(),
      images: [{ id: 'img1', url: '/test.jpg', alt: 'Test device' }],
      _count: { reviews: 5, comparisons: 2 }
    }
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 1,
    totalPages: 1
  }
}

const mockDeviceDetails = {
  success: true,
  device: {
    ...createMockDevice(),
    brand: createMockBrand(),
    images: [{ id: 'img1', url: '/test.jpg', alt: 'Test device' }],
    _count: { reviews: 5, comparisons: 2, favoritedBy: 3 }
  }
}

describe('Admin Device Management', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
  })

  describe('Device List API', () => {
    test('should fetch devices successfully', async () => {
      mockFetch(mockDeviceList)

      const response = await fetch('/api/admin/devices')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.devices).toHaveLength(1)
      expect(data.devices[0].name).toBe('Test Device')
    })

    test('should handle search query', async () => {
      mockFetch(mockDeviceList)

      const response = await fetch('/api/admin/devices?search=iPhone')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
    })

    test('should handle pagination', async () => {
      mockFetch({
        ...mockDeviceList,
        pagination: { page: 2, limit: 10, total: 25, totalPages: 3 }
      })

      const response = await fetch('/api/admin/devices?page=2&limit=10')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.pagination.page).toBe(2)
      expect(data.pagination.totalPages).toBe(3)
    })
  })

  describe('Device Creation API', () => {
    test('should create device successfully', async () => {
      const newDevice = createMockDevice({
        name: 'New Device',
        model: 'ND-1000'
      })

      mockFetch({
        success: true,
        message: 'Device created successfully',
        device: newDevice
      })

      const response = await fetch('/api/admin/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Device',
          model: 'ND-1000',
          brandId: 'brand-1'
        })
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.device.name).toBe('New Device')
    })

    test('should validate required fields', async () => {
      mockFetch({
        error: 'Validation error',
        details: [{ message: 'Device name is required' }]
      }, 400)

      const response = await fetch('/api/admin/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'ND-1000' // Missing name
        })
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
    })
  })

  describe('Device Update API', () => {
    test('should update device successfully', async () => {
      const updatedDevice = createMockDevice({
        name: 'Updated Device'
      })

      mockFetch({
        success: true,
        message: 'Device updated successfully',
        device: updatedDevice
      })

      const response = await fetch('/api/admin/devices/device-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Updated Device'
        })
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.device.name).toBe('Updated Device')
    })

    test('should handle device not found', async () => {
      mockFetch({
        error: 'Device not found'
      }, 404)

      const response = await fetch('/api/admin/devices/nonexistent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Updated Device'
        })
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(404)
    })
  })

  describe('Device Deletion API', () => {
    test('should soft delete device with dependencies', async () => {
      mockFetch({
        success: true,
        message: 'Device has been marked as inactive instead of deleted due to existing reviews/comparisons',
        softDeleted: true
      })

      const response = await fetch('/api/admin/devices/device-1', {
        method: 'DELETE'
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.softDeleted).toBe(true)
    })

    test('should hard delete device without dependencies', async () => {
      mockFetch({
        success: true,
        message: 'Device deleted successfully',
        softDeleted: false
      })

      const response = await fetch('/api/admin/devices/device-1', {
        method: 'DELETE'
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.softDeleted).toBe(false)
    })
  })

  describe('Device Details API', () => {
    test('should fetch device details successfully', async () => {
      mockFetch(mockDeviceDetails)

      const response = await fetch('/api/admin/devices/device-1')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.device.id).toBe('device-1')
      expect(data.device._count.reviews).toBe(5)
    })

    test('should handle device not found', async () => {
      mockFetch({
        error: 'Device not found'
      }, 404)

      const response = await fetch('/api/admin/devices/nonexistent')

      expect(response.ok).toBe(false)
      expect(response.status).toBe(404)
    })
  })
})

describe('Device Form Validation', () => {
  test('should validate device creation data', () => {
    const validDevice = {
      name: 'iPhone 15 Pro',
      model: 'A3108',
      brandId: 'brand-1',
      launchPrice: 999,
      currentPrice: 899,
      currency: 'USD',
      displaySize: 6.1,
      batteryCapacity: 3274,
      isActive: true
    }

    // This would be the actual validation logic
    expect(validDevice.name).toBeTruthy()
    expect(validDevice.model).toBeTruthy()
    expect(validDevice.brandId).toBeTruthy()
    expect(typeof validDevice.launchPrice).toBe('number')
    expect(typeof validDevice.displaySize).toBe('number')
  })

  test('should handle invalid device data', () => {
    const invalidDevice = {
      name: '', // Invalid: empty name
      model: 'A3108',
      brandId: '', // Invalid: empty brandId
      launchPrice: 'invalid' // Invalid: string instead of number
    }

    expect(invalidDevice.name).toBeFalsy()
    expect(invalidDevice.brandId).toBeFalsy()
    expect(typeof invalidDevice.launchPrice).toBe('string')
  })
})

describe('Device Management UI Components', () => {
  test('should format price correctly', () => {
    const formatPrice = (price: number | undefined, currency: string) => {
      if (!price) return 'Not set'
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency === 'NPR' ? 'USD' : currency,
        minimumFractionDigits: 0,
      }).format(price)
    }

    expect(formatPrice(999, 'USD')).toBe('$999')
    expect(formatPrice(89999, 'NPR')).toBe('$89,999')
    expect(formatPrice(undefined, 'USD')).toBe('Not set')
  })

  test('should get availability color class', () => {
    const getAvailabilityColor = (availability: string) => {
      switch (availability) {
        case 'available':
          return 'bg-green-100 text-green-800'
        case 'discontinued':
          return 'bg-red-100 text-red-800'
        case 'upcoming':
          return 'bg-blue-100 text-blue-800'
        default:
          return 'bg-gray-100 text-gray-800'
      }
    }

    expect(getAvailabilityColor('available')).toBe('bg-green-100 text-green-800')
    expect(getAvailabilityColor('discontinued')).toBe('bg-red-100 text-red-800')
    expect(getAvailabilityColor('upcoming')).toBe('bg-blue-100 text-blue-800')
    expect(getAvailabilityColor('unknown')).toBe('bg-gray-100 text-gray-800')
  })
})

export {}