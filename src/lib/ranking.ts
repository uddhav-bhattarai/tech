import { Decimal } from "@prisma/client/runtime/library"

// Device with all necessary data for ranking
export interface RankingDevice {
  id: string
  name: string
  slug: string
  model: string
  brand: {
    name: string
    logo: string | null
  }
  launchPrice: Decimal | null
  currentPrice: Decimal | null
  currency: string
  displaySize: number | null
  batteryCapacity: number | null
  ramConfigurations: number[]
  storageConfigurations: number[]
  operatingSystem: string | null
  chipset: string | null
  releaseDate: Date | null
  weight: number | null
  dimensions: Record<string, unknown> | null // JSON field containing thickness
  waterResistance: string | null
  wirelessCharging: number | null
  mainCamera: Record<string, unknown> | null // JSON field containing megapixels
  frontCamera: Record<string, unknown> | null // JSON field containing megapixels
  securityFeatures: string[]
  images: Array<{
    url: string
    alt: string | null
  }>
  reviews: Array<{
    rating: number
  }>
  _count: {
    reviews: number
  }
}

// Ranking weights configuration
export interface RankingWeights {
  performance: number      // 0-1, weight for performance score
  battery: number         // 0-1, weight for battery score
  camera: number          // 0-1, weight for camera score
  display: number         // 0-1, weight for display score
  build: number          // 0-1, weight for build quality score
  price: number          // 0-1, weight for price-performance ratio
  reviews: number        // 0-1, weight for user reviews
  recency: number        // 0-1, weight for release date recency
}

// Default ranking weights
export const DEFAULT_WEIGHTS: RankingWeights = {
  performance: 0.25,
  battery: 0.15,
  camera: 0.20,
  display: 0.15,
  build: 0.10,
  price: 0.10,
  reviews: 0.15,
  recency: 0.05,
}

// Ranking score breakdown
export interface DeviceScore {
  deviceId: string
  totalScore: number
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

/**
 * Calculate performance score based on RAM and chipset
 */
function calculatePerformanceScore(device: RankingDevice): number {
  let score = 0
  
  // RAM score (max 50 points)
  const maxRAM = Math.max(...device.ramConfigurations)
  if (maxRAM >= 16) score += 50
  else if (maxRAM >= 12) score += 40
  else if (maxRAM >= 8) score += 30
  else if (maxRAM >= 6) score += 20
  else if (maxRAM >= 4) score += 10
  
  // Chipset score (max 50 points) - simplified scoring
  if (device.chipset) {
    const chipset = device.chipset.toLowerCase()
    if (chipset.includes('snapdragon 8') || chipset.includes('a17') || chipset.includes('a16')) {
      score += 50
    } else if (chipset.includes('snapdragon 7') || chipset.includes('a15') || chipset.includes('a14')) {
      score += 40
    } else if (chipset.includes('snapdragon 6') || chipset.includes('dimensity 9')) {
      score += 30
    } else if (chipset.includes('dimensity 8') || chipset.includes('exynos')) {
      score += 25
    } else {
      score += 15
    }
  }
  
  return Math.min(score, 100)
}

/**
 * Calculate battery score based on capacity
 */
function calculateBatteryScore(device: RankingDevice): number {
  if (!device.batteryCapacity) return 0
  
  const capacity = device.batteryCapacity
  if (capacity >= 5000) return 100
  if (capacity >= 4500) return 85
  if (capacity >= 4000) return 70
  if (capacity >= 3500) return 55
  if (capacity >= 3000) return 40
  if (capacity >= 2500) return 25
  return 10
}

/**
 * Calculate camera score based on resolution and features
 */
function calculateCameraScore(device: RankingDevice): number {
  let score = 0
  
  // Main camera score (max 70 points)
  if (device.mainCamera && typeof device.mainCamera === 'object') {
    const mainCamMegapixels = device.mainCamera.megapixels as number
    if (mainCamMegapixels) {
      if (mainCamMegapixels >= 200) score += 70
      else if (mainCamMegapixels >= 108) score += 60
      else if (mainCamMegapixels >= 64) score += 50
      else if (mainCamMegapixels >= 48) score += 40
      else if (mainCamMegapixels >= 24) score += 30
      else score += 20
    }
  }
  
  // Front camera score (max 30 points)
  if (device.frontCamera && typeof device.frontCamera === 'object') {
    const frontCamMegapixels = device.frontCamera.megapixels as number
    if (frontCamMegapixels) {
      if (frontCamMegapixels >= 50) score += 30
      else if (frontCamMegapixels >= 32) score += 25
      else if (frontCamMegapixels >= 24) score += 20
      else if (frontCamMegapixels >= 16) score += 15
      else if (frontCamMegapixels >= 8) score += 10
      else score += 5
    }
  }
  
  return Math.min(score, 100)
}

/**
 * Calculate display score based on size
 */
function calculateDisplayScore(device: RankingDevice): number {
  if (!device.displaySize) return 50 // neutral score for unknown
  
  const size = Number(device.displaySize)
  if (size >= 6.7) return 95
  if (size >= 6.5) return 90
  if (size >= 6.3) return 85
  if (size >= 6.1) return 80
  if (size >= 5.8) return 75
  if (size >= 5.5) return 70
  if (size >= 5.0) return 65
  return 50
}

/**
 * Calculate build quality score based on features
 */
function calculateBuildScore(device: RankingDevice): number {
  let score = 50 // base score
  
  // Water resistance bonus
  if (device.waterResistance?.includes('IP68')) score += 20
  else if (device.waterResistance?.includes('IP67')) score += 15
  else if (device.waterResistance?.includes('IP')) score += 10
  
  // Weight consideration (lighter is generally better for phones)
  if (device.weight) {
    if (device.weight <= 150) score += 15
    else if (device.weight <= 180) score += 10
    else if (device.weight <= 200) score += 5
    // heavier phones get no bonus
  }
  
  // Security features
  const hasFingerprint = device.securityFeatures.some(f => f.toLowerCase().includes('fingerprint'))
  const hasFaceUnlock = device.securityFeatures.some(f => f.toLowerCase().includes('face'))
  if (hasFingerprint) score += 5
  if (hasFaceUnlock) score += 5
  if (device.wirelessCharging && device.wirelessCharging > 0) score += 5
  
  return Math.min(score, 100)
}

/**
 * Calculate price-performance ratio score
 */
function calculatePriceScore(device: RankingDevice): number {
  const price = device.currentPrice || device.launchPrice
  if (!price) return 0
  
  const priceNum = Number(price)
  let priceCategory = 0
  
  // Convert NPR to USD for consistent scoring
  const usdPrice = device.currency === 'NPR' ? priceNum / 130 : priceNum
  
  // Price scoring (inverse - lower price gets higher score)
  if (usdPrice <= 200) priceCategory = 100
  else if (usdPrice <= 400) priceCategory = 85
  else if (usdPrice <= 600) priceCategory = 70
  else if (usdPrice <= 800) priceCategory = 55
  else if (usdPrice <= 1000) priceCategory = 40
  else if (usdPrice <= 1200) priceCategory = 25
  else priceCategory = 10
  
  return priceCategory
}

/**
 * Calculate reviews score based on ratings and count
 */
function calculateReviewsScore(device: RankingDevice): number {
  if (device._count.reviews === 0) return 50 // neutral score for no reviews
  
  // Calculate average rating
  const totalRating = device.reviews.reduce((sum, review) => sum + review.rating, 0)
  const averageRating = totalRating / device.reviews.length
  
  // Review count bonus (more reviews = more confidence)
  const countBonus = Math.min(device._count.reviews * 0.5, 15) // max 15 point bonus
  
  // Base score from average rating (1-5 scale converted to 0-100)
  const ratingScore = (averageRating - 1) * 25 // 1=0, 5=100
  
  return Math.min(ratingScore + countBonus, 100)
}

/**
 * Calculate recency score based on release date
 */
function calculateRecencyScore(device: RankingDevice): number {
  if (!device.releaseDate) return 25 // neutral score for unknown date
  
  const now = new Date()
  const releaseDate = new Date(device.releaseDate)
  const monthsDiff = (now.getTime() - releaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  
  // Newer devices get higher scores
  if (monthsDiff <= 3) return 100
  if (monthsDiff <= 6) return 90
  if (monthsDiff <= 12) return 80
  if (monthsDiff <= 18) return 70
  if (monthsDiff <= 24) return 60
  if (monthsDiff <= 36) return 45
  if (monthsDiff <= 48) return 30
  return 15
}

/**
 * Calculate overall device score using weighted components
 */
export function calculateDeviceScore(
  device: RankingDevice, 
  weights: RankingWeights = DEFAULT_WEIGHTS
): Omit<DeviceScore, 'rank'> {
  const breakdown = {
    performance: calculatePerformanceScore(device),
    battery: calculateBatteryScore(device),
    camera: calculateCameraScore(device),
    display: calculateDisplayScore(device),
    build: calculateBuildScore(device),
    price: calculatePriceScore(device),
    reviews: calculateReviewsScore(device),
    recency: calculateRecencyScore(device),
  }
  
  const totalScore = 
    breakdown.performance * weights.performance +
    breakdown.battery * weights.battery +
    breakdown.camera * weights.camera +
    breakdown.display * weights.display +
    breakdown.build * weights.build +
    breakdown.price * weights.price +
    breakdown.reviews * weights.reviews +
    breakdown.recency * weights.recency
  
  return {
    deviceId: device.id,
    totalScore: Math.round(totalScore * 100) / 100, // Round to 2 decimal places
    breakdown,
  }
}

/**
 * Calculate rankings for multiple devices
 */
export function calculateDeviceRankings(
  devices: RankingDevice[],
  weights: RankingWeights = DEFAULT_WEIGHTS
): DeviceScore[] {
  // Calculate scores for all devices
  const scored = devices.map(device => calculateDeviceScore(device, weights))
  
  // Sort by total score (descending)
  scored.sort((a, b) => b.totalScore - a.totalScore)
  
  // Add rank positions
  return scored.map((score, index) => ({
    ...score,
    rank: index + 1,
  }))
}

/**
 * Predefined weight configurations for different use cases
 */
export const RANKING_PRESETS: Record<string, RankingWeights> = {
  balanced: DEFAULT_WEIGHTS,
  gaming: {
    performance: 0.40,
    battery: 0.20,
    camera: 0.10,
    display: 0.15,
    build: 0.05,
    price: 0.05,
    reviews: 0.10,
    recency: 0.05,
  },
  photography: {
    performance: 0.15,
    battery: 0.10,
    camera: 0.45,
    display: 0.15,
    build: 0.05,
    price: 0.05,
    reviews: 0.15,
    recency: 0.05,
  },
  budget: {
    performance: 0.20,
    battery: 0.15,
    camera: 0.15,
    display: 0.10,
    build: 0.10,
    price: 0.40,
    reviews: 0.15,
    recency: 0.05,
  },
  enterprise: {
    performance: 0.25,
    battery: 0.25,
    camera: 0.05,
    display: 0.10,
    build: 0.20,
    price: 0.10,
    reviews: 0.10,
    recency: 0.05,
  },
}