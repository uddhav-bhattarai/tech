/**
 * Device Comparison Page
 * Comprehensive comparison interface with enhanced analytics
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import EnhancedDeviceComparison from '@/components/comparison/EnhancedDeviceComparison'

export default function ComparisonPage() {
  const searchParams = useSearchParams()
  const [initialDevices, setInitialDevices] = useState<string[]>([])
  const [comparisonData, setComparisonData] = useState(null)
  const [loading, setLoading] = useState(false)

  // Extract device IDs from URL parameters
  useEffect(() => {
    const devices = searchParams.get('devices')
    if (devices) {
      const deviceIds = devices.split(',').filter(id => id.trim())
      setInitialDevices(deviceIds)
      
      if (deviceIds.length >= 2) {
        loadComparison(deviceIds)
      }
    }
  }, [searchParams])

  // Load comparison data from API
  const loadComparison = async (deviceIds: string[]) => {
    setLoading(true)
    try {
      const response = await fetch('/api/comparisons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceIds,
          includeSpecs: true,
          includeFeatures: true,
          includeAnalysis: true,
          weightings: {
            price: 7,
            performance: 9,
            battery: 8,
            camera: 7,
            display: 6,
            design: 5
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        setComparisonData(data)
      }
    } catch (error) {
      console.error('Failed to load comparison:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-auto">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-4"></div>
              <span className="text-lg font-medium">Loading comparison...</span>
            </div>
          </div>
        </div>
      )}
      
      <EnhancedDeviceComparison 
        initialDevices={initialDevices}
        comparisonData={comparisonData}
      />
    </div>
  )
}