/**
 * Device Comparison Analytics Dashboard
 * Advanced analytics and visualizations for device comparisons
 */

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  ChartBarIcon,
  StarIcon,
  CurrencyDollarIcon,
  DevicePhoneMobileIcon,
  Battery100Icon,
  CameraIcon,
  CpuChipIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'

interface Device {
  id: string
  name: string
  brand: { name: string }
  currentPrice?: number
  averageRating?: number
  specifications: { category: string; name: string; value: string }[]
  features: { name: string; available: boolean }[]
}

interface ComparisonInsight {
  type: 'strength' | 'weakness' | 'opportunity' | 'recommendation'
  deviceId: string
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
}

const CATEGORY_CONFIGS = {
  price: {
    name: 'Price Value',
    icon: CurrencyDollarIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  performance: {
    name: 'Performance',
    icon: CpuChipIcon,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  battery: {
    name: 'Battery Life',
    icon: Battery100Icon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  camera: {
    name: 'Camera Quality',
    icon: CameraIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  },
  display: {
    name: 'Display',
    icon: DevicePhoneMobileIcon,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100'
  },
  rating: {
    name: 'User Rating',
    icon: StarIcon,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100'
  }
}

export default function DeviceComparisonAnalytics({ devices }: { devices: Device[] }) {
  const [insights, setInsights] = useState<ComparisonInsight[]>([])

  // Calculate device scores for each category
  const deviceScores = useMemo(() => {
    const scores: { [deviceId: string]: { [category: string]: number } } = {}

    devices.forEach(device => {
      scores[device.id] = {
        price: calculatePriceScore(device, devices),
        performance: calculatePerformanceScore(device),
        battery: calculateBatteryScore(device),
        camera: calculateCameraScore(device),
        display: calculateDisplayScore(device),
        rating: calculateRatingScore(device),
        overall: 0
      }

      // Calculate overall score as weighted average
      scores[device.id].overall = Math.round(
        (scores[device.id].price * 0.2 +
         scores[device.id].performance * 0.25 +
         scores[device.id].battery * 0.15 +
         scores[device.id].camera * 0.15 +
         scores[device.id].display * 0.15 +
         scores[device.id].rating * 0.1) 
      )
    })

    return scores
  }, [devices])

  // Calculate individual category scores
  function calculatePriceScore(device: Device, allDevices: Device[]): number {
    if (!device.currentPrice) return 50

    const prices = allDevices.map(d => d.currentPrice).filter(p => p) as number[]
    if (prices.length <= 1) return 100

    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    
    // Lower price = higher score
    return Math.round(((maxPrice - device.currentPrice) / (maxPrice - minPrice)) * 100)
  }

  function calculatePerformanceScore(device: Device): number {
    // Mock performance calculation based on specs
    const cpuSpecs = device.specifications.filter(s => 
      s.name.toLowerCase().includes('processor') || 
      s.name.toLowerCase().includes('cpu') ||
      s.name.toLowerCase().includes('chipset')
    )
    
    const ramSpecs = device.specifications.filter(s => 
      s.name.toLowerCase().includes('ram') || 
      s.name.toLowerCase().includes('memory')
    )

    let score = 60 // Base score
    
    if (cpuSpecs.length > 0) score += 20
    if (ramSpecs.length > 0) {
      const ram = parseInt(ramSpecs[0].value) || 4
      score += Math.min((ram / 16) * 20, 20)
    }

    return Math.min(Math.round(score), 100)
  }

  function calculateBatteryScore(device: Device): number {
    const batterySpec = device.specifications.find(s => 
      s.name.toLowerCase().includes('battery')
    )
    
    if (!batterySpec) return 50

    const capacity = parseInt(batterySpec.value.replace(/[^\d]/g, '')) || 3000
    
    // Score based on capacity ranges
    if (capacity >= 5000) return 100
    if (capacity >= 4500) return 90
    if (capacity >= 4000) return 80
    if (capacity >= 3500) return 70
    if (capacity >= 3000) return 60
    return 40
  }

  function calculateCameraScore(device: Device): number {
    const cameraSpecs = device.specifications.filter(s => 
      s.name.toLowerCase().includes('camera')
    )
    
    let score = 50 + (cameraSpecs.length * 10) // Base score + camera count bonus
    
    // Check for camera features
    const hasMacro = device.features.some(f => 
      f.name.toLowerCase().includes('macro') && f.available
    )
    const hasUltraWide = device.features.some(f => 
      f.name.toLowerCase().includes('ultra') && f.available
    )
    const hasNightMode = device.features.some(f => 
      f.name.toLowerCase().includes('night') && f.available
    )

    if (hasMacro) score += 10
    if (hasUltraWide) score += 10
    if (hasNightMode) score += 15

    return Math.min(Math.round(score), 100)
  }

  function calculateDisplayScore(device: Device): number {
    const displaySpecs = device.specifications.filter(s => 
      s.name.toLowerCase().includes('display') || 
      s.name.toLowerCase().includes('screen')
    )
    
    let score = 60 // Base score
    
    displaySpecs.forEach(spec => {
      if (spec.value.toLowerCase().includes('oled') || 
          spec.value.toLowerCase().includes('amoled')) {
        score += 20
      }
      if (spec.value.includes('120') && spec.value.includes('hz')) {
        score += 15
      }
      if (spec.value.includes('4k') || spec.value.includes('2k')) {
        score += 15
      }
    })

    return Math.min(Math.round(score), 100)
  }

  function calculateRatingScore(device: Device): number {
    if (!device.averageRating) return 50
    return Math.round((device.averageRating / 5) * 100)
  }

  // Generate insights and recommendations
  useEffect(() => {
    const newInsights: ComparisonInsight[] = []

    devices.forEach(device => {
      const scores = deviceScores[device.id]
      if (!scores) return

      // Identify strengths (scores > 80)
      Object.entries(scores).forEach(([category, score]) => {
        if (category !== 'overall' && score > 80) {
          newInsights.push({
            type: 'strength',
            deviceId: device.id,
            title: `Excellent ${CATEGORY_CONFIGS[category as keyof typeof CATEGORY_CONFIGS]?.name || category}`,
            description: `${device.name} excels in ${category} with a score of ${score}/100`,
            impact: score > 90 ? 'high' : 'medium'
          })
        }
      })

      // Identify weaknesses (scores < 40)
      Object.entries(scores).forEach(([category, score]) => {
        if (category !== 'overall' && score < 40) {
          newInsights.push({
            type: 'weakness',
            deviceId: device.id,
            title: `Limited ${CATEGORY_CONFIGS[category as keyof typeof CATEGORY_CONFIGS]?.name || category}`,
            description: `${device.name} could improve in ${category} (score: ${score}/100)`,
            impact: score < 25 ? 'high' : 'medium'
          })
        }
      })

      // Price-performance recommendations
      if (scores.price > 70 && scores.performance > 70) {
        newInsights.push({
          type: 'recommendation',
          deviceId: device.id,
          title: 'Great Value Choice',
          description: `${device.name} offers excellent price-to-performance ratio`,
          impact: 'high'
        })
      }
    })

    setInsights(newInsights.slice(0, 10)) // Limit to top 10 insights
  }, [devices, deviceScores])

  // Render score bar
  const renderScoreBar = (score: number, color: string = 'bg-blue-500') => (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className={`${color} h-2 rounded-full transition-all duration-300`}
        style={{ width: `${score}%` }}
      />
    </div>
  )

  // Render device score card
  const renderDeviceScoreCard = (device: Device, scores: { [category: string]: number }) => {
    const overallScore = scores.overall
    const isWinner = devices.every(d => deviceScores[d.id]?.overall <= overallScore)

    return (
      <div key={device.id} className={`relative p-6 rounded-lg border-2 ${
        isWinner ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-white'
      }`}>
        {isWinner && (
          <div className="absolute -top-2 -right-2">
            <TrophyIcon className="h-8 w-8 text-yellow-500" />
          </div>
        )}

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{device.name}</h3>
          <p className="text-sm text-gray-600">{device.brand.name}</p>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Score</span>
            <span className="text-2xl font-bold text-gray-900">{overallScore}/100</span>
          </div>
          {renderScoreBar(overallScore, isWinner ? 'bg-yellow-500' : 'bg-blue-500')}
        </div>

        <div className="space-y-3">
          {Object.entries(CATEGORY_CONFIGS).map(([key, config]) => {
            const score = scores[key] || 0
            return (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center">
                  <config.icon className={`h-4 w-4 ${config.color} mr-2`} />
                  <span className="text-sm text-gray-600">{config.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{score}</span>
                  <div className="w-16">
                    {renderScoreBar(score, config.color.replace('text-', 'bg-').replace('600', '500'))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {device.currentPrice && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Price</span>
              <span className="text-lg font-semibold text-green-600">
                ${device.currentPrice.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (devices.length === 0) {
    return (
      <div className="text-center py-8">
        <ChartBarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No devices to analyze</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Overall Comparison */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Comparison Analysis</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map(device => 
            renderDeviceScoreCard(device, deviceScores[device.id] || {})
          )}
        </div>
      </div>

      {/* Category Breakdown */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Category Analysis</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(CATEGORY_CONFIGS).map(([key, config]) => {
            const categoryScores = devices.map(device => ({
              device,
              score: deviceScores[device.id]?.[key] || 0
            })).sort((a, b) => b.score - a.score)

            const winner = categoryScores[0]

            return (
              <div key={key} className={`p-4 rounded-lg ${config.bgColor}`}>
                <div className="flex items-center mb-2">
                  <config.icon className={`h-5 w-5 ${config.color} mr-2`} />
                  <span className="text-sm font-medium text-gray-900">{config.name}</span>
                </div>
                
                <div className="text-lg font-bold text-gray-900 mb-1">
                  {winner.device.name}
                </div>
                <div className="text-sm text-gray-600">
                  Score: {winner.score}/100
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Key Insights</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, index) => {
              const device = devices.find(d => d.id === insight.deviceId)
              const iconMap = {
                strength: ArrowTrendingUpIcon,
                weakness: ArrowTrendingDownIcon,
                opportunity: StarIcon,
                recommendation: TrophyIcon
              }
              const IconComponent = iconMap[insight.type]
              
              const colorMap = {
                strength: 'text-green-600 bg-green-100',
                weakness: 'text-red-600 bg-red-100',
                opportunity: 'text-blue-600 bg-blue-100',
                recommendation: 'text-yellow-600 bg-yellow-100'
              }

              return (
                <div key={index} className="p-4 border rounded-lg bg-white">
                  <div className="flex items-start">
                    <div className={`p-2 rounded-lg ${colorMap[insight.type]} mr-3`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900">{insight.title}</h4>
                        <span className={`text-xs px-2 py-1 rounded ${
                          insight.impact === 'high' ? 'bg-red-100 text-red-800' :
                          insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {insight.impact} impact
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{insight.description}</p>
                      {device && (
                        <p className="text-xs text-gray-500 mt-1">
                          Device: {device.brand.name} {device.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Export Options */}
      <div className="text-center">
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Export Analysis Report
        </button>
      </div>
    </div>
  )
}