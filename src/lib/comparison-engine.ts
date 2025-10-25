/**
 * Device Comparison Scoring Engine
 * Advanced algorithms for device comparison and ranking
 */

export interface ScoringCriteria {
  price: number // Weight 0-10
  performance: number // Weight 0-10
  battery: number // Weight 0-10
  camera: number // Weight 0-10
  display: number // Weight 0-10
  design: number // Weight 0-10
  features: number // Weight 0-10
}

export interface DeviceScore {
  deviceId: string
  deviceName: string
  overallScore: number
  categoryScores: {
    price: number
    performance: number
    battery: number
    camera: number
    display: number
    design: number
    features: number
  }
  rank: number
  strengths: string[]
  weaknesses: string[]
}

export interface ComparisonAnalysis {
  winner: DeviceScore
  bestValue: DeviceScore
  categoryWinners: {
    [category: string]: DeviceScore
  }
  recommendations: {
    gaming: DeviceScore
    photography: DeviceScore
    battery: DeviceScore
    budget: DeviceScore
  }
  summary: string
}

export class DeviceScoringEngine {
  private criteria: ScoringCriteria
  private devices: any[]

  constructor(criteria: ScoringCriteria, devices: any[]) {
    this.criteria = criteria
    this.devices = devices
  }

  // Calculate price score (lower price = higher score)
  calculatePriceScore(device: any, allDevices: any[]): number {
    const prices = allDevices.map(d => d.currentPrice || d.launchPrice || 0).filter(p => p > 0)
    if (prices.length === 0) return 50

    const devicePrice = device.currentPrice || device.launchPrice || 0
    if (devicePrice === 0) return 0

    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    
    if (minPrice === maxPrice) return 100

    // Inverse scoring - lower price gets higher score
    const normalizedPrice = (devicePrice - minPrice) / (maxPrice - minPrice)
    return Math.round((1 - normalizedPrice) * 100)
  }

  // Calculate performance score based on specifications
  calculatePerformanceScore(device: any): number {
    let score = 0
    let factors = 0

    // CPU performance (based on specs)
    const cpuSpec = device.specifications?.find((s: any) => 
      s.name.toLowerCase().includes('processor') || 
      s.name.toLowerCase().includes('cpu') ||
      s.name.toLowerCase().includes('chipset')
    )
    if (cpuSpec) {
      score += this.parsePerformanceValue(cpuSpec.value) * 0.4
      factors += 0.4
    }

    // RAM
    const ramSpec = device.specifications?.find((s: any) => 
      s.name.toLowerCase().includes('ram') ||
      s.name.toLowerCase().includes('memory')
    )
    if (ramSpec) {
      const ramSize = parseInt(ramSpec.value) || 4
      score += Math.min((ramSize / 16) * 100, 100) * 0.3
      factors += 0.3
    }

    // Storage speed (SSD vs HDD, etc.)
    const storageSpec = device.specifications?.find((s: any) => 
      s.name.toLowerCase().includes('storage')
    )
    if (storageSpec) {
      const isSSD = storageSpec.value.toLowerCase().includes('ssd')
      score += (isSSD ? 80 : 40) * 0.3
      factors += 0.3
    }

    return factors > 0 ? Math.round(score / factors) : 50
  }

  // Calculate battery score
  calculateBatteryScore(device: any): number {
    const batterySpec = device.specifications?.find((s: any) => 
      s.name.toLowerCase().includes('battery')
    )
    
    if (!batterySpec) return 50

    const capacity = parseInt(batterySpec.value.replace(/[^\d]/g, '')) || 0
    if (capacity === 0) return 50

    // Score based on typical ranges
    if (capacity >= 4500) return 100
    if (capacity >= 4000) return 85
    if (capacity >= 3500) return 70
    if (capacity >= 3000) return 55
    if (capacity >= 2500) return 40
    return 25
  }

  // Calculate camera score
  calculateCameraScore(device: any): number {
    let score = 50 // Base score
    
    // Main camera megapixels
    const cameraSpec = device.specifications?.find((s: any) => 
      s.name.toLowerCase().includes('camera') &&
      s.name.toLowerCase().includes('main')
    )
    
    if (cameraSpec) {
      const megapixels = parseInt(cameraSpec.value.replace(/[^\d]/g, '')) || 0
      score += Math.min((megapixels / 108) * 40, 40) // Scale to 108MP max
    }

    // Multiple cameras bonus
    const cameraCount = device.specifications?.filter((s: any) => 
      s.name.toLowerCase().includes('camera')
    ).length || 1

    score += Math.min(cameraCount * 5, 20)

    // Special features
    const hasOIS = device.features?.some((f: any) => 
      f.name.toLowerCase().includes('stabilization') && f.available
    )
    const hasNightMode = device.features?.some((f: any) => 
      f.name.toLowerCase().includes('night') && f.available
    )
    
    if (hasOIS) score += 15
    if (hasNightMode) score += 10

    return Math.min(Math.round(score), 100)
  }

  // Calculate display score
  calculateDisplayScore(device: any): number {
    let score = 50

    // Screen size
    const sizeSpec = device.specifications?.find((s: any) => 
      s.name.toLowerCase().includes('screen') &&
      s.name.toLowerCase().includes('size')
    )
    if (sizeSpec) {
      const size = parseFloat(sizeSpec.value.replace(/[^\d.]/g, '')) || 0
      score += Math.min((size / 7) * 20, 20) // Scale to 7" max
    }

    // Resolution
    const resolutionSpec = device.specifications?.find((s: any) => 
      s.name.toLowerCase().includes('resolution')
    )
    if (resolutionSpec) {
      const res = resolutionSpec.value.toLowerCase()
      if (res.includes('4k')) score += 30
      else if (res.includes('2k') || res.includes('1440')) score += 20
      else if (res.includes('fhd') || res.includes('1080')) score += 15
      else if (res.includes('hd') || res.includes('720')) score += 10
    }

    // High refresh rate
    const refreshSpec = device.specifications?.find((s: any) => 
      s.name.toLowerCase().includes('refresh')
    )
    if (refreshSpec) {
      const rate = parseInt(refreshSpec.value.replace(/[^\d]/g, '')) || 60
      if (rate >= 120) score += 15
      else if (rate >= 90) score += 10
    }

    return Math.min(Math.round(score), 100)
  }

  // Calculate design score
  calculateDesignScore(device: any): number {
    let score = 60 // Base design score

    // Build quality materials
    const buildSpec = device.specifications?.find((s: any) => 
      s.name.toLowerCase().includes('build') ||
      s.name.toLowerCase().includes('material')
    )
    if (buildSpec) {
      const build = buildSpec.value.toLowerCase()
      if (build.includes('premium') || build.includes('glass') || build.includes('metal')) {
        score += 20
      }
    }

    // Water resistance
    const waterResistant = device.features?.some((f: any) => 
      f.name.toLowerCase().includes('water') && f.available
    )
    if (waterResistant) score += 15

    // Aesthetic features
    const aestheticFeatures = device.features?.filter((f: any) => 
      (f.name.toLowerCase().includes('color') || 
       f.name.toLowerCase().includes('finish')) && f.available
    ).length || 0

    score += Math.min(aestheticFeatures * 5, 15)

    return Math.min(Math.round(score), 100)
  }

  // Calculate features score
  calculateFeaturesScore(device: any): number {
    const availableFeatures = device.features?.filter((f: any) => f.available) || []
    const totalFeatures = device.features?.length || 1

    const availabilityScore = (availableFeatures.length / totalFeatures) * 60

    // Bonus for premium features
    const premiumFeatures = [
      'wireless charging',
      'fast charging',
      '5g support',
      'face recognition',
      'fingerprint scanner',
      'nfc'
    ]

    let premiumBonus = 0
    premiumFeatures.forEach(feature => {
      if (availableFeatures.some((f: any) => 
        f.name.toLowerCase().includes(feature)
      )) {
        premiumBonus += 6
      }
    })

    return Math.min(Math.round(availabilityScore + premiumBonus), 100)
  }

  // Parse performance value from specifications
  private parsePerformanceValue(value: string): number {
    const val = value.toLowerCase()
    
    // CPU frequency based scoring
    if (val.includes('ghz')) {
      const freq = parseFloat(val.replace(/[^\d.]/g, ''))
      return Math.min((freq / 3.5) * 100, 100) // Scale to 3.5GHz max
    }
    
    // Benchmark score based scoring
    const numberMatch = val.match(/\d+/)
    if (numberMatch) {
      const score = parseInt(numberMatch[0])
      return Math.min((score / 1000000) * 100, 100) // Scale for benchmark scores
    }
    
    return 50 // Default middle score
  }

  // Calculate overall device score
  calculateDeviceScore(device: any, allDevices: any[]): DeviceScore {
    const categoryScores = {
      price: this.calculatePriceScore(device, allDevices),
      performance: this.calculatePerformanceScore(device),
      battery: this.calculateBatteryScore(device),
      camera: this.calculateCameraScore(device),
      display: this.calculateDisplayScore(device),
      design: this.calculateDesignScore(device),
      features: this.calculateFeaturesScore(device)
    }

    // Calculate weighted overall score
    const totalWeight = Object.values(this.criteria).reduce((sum, weight) => sum + weight, 0)
    const weightedScore = (
      categoryScores.price * this.criteria.price +
      categoryScores.performance * this.criteria.performance +
      categoryScores.battery * this.criteria.battery +
      categoryScores.camera * this.criteria.camera +
      categoryScores.display * this.criteria.display +
      categoryScores.design * this.criteria.design +
      categoryScores.features * this.criteria.features
    ) / totalWeight

    // Identify strengths and weaknesses
    const strengths: string[] = []
    const weaknesses: string[] = []

    Object.entries(categoryScores).forEach(([category, score]) => {
      if (score >= 80) strengths.push(`Excellent ${category}`)
      else if (score <= 40) weaknesses.push(`Limited ${category}`)
    })

    return {
      deviceId: device.id,
      deviceName: device.name,
      overallScore: Math.round(weightedScore),
      categoryScores,
      rank: 0, // Will be set during ranking
      strengths: strengths.slice(0, 3),
      weaknesses: weaknesses.slice(0, 2)
    }
  }

  // Generate full comparison analysis
  generateAnalysis(): ComparisonAnalysis {
    // Calculate scores for all devices
    const deviceScores = this.devices.map(device => 
      this.calculateDeviceScore(device, this.devices)
    ).sort((a, b) => b.overallScore - a.overallScore)

    // Assign ranks
    deviceScores.forEach((score, index) => {
      score.rank = index + 1
    })

    const winner = deviceScores[0]
    
    // Find best value (highest score per dollar)
    const bestValue = deviceScores
      .filter(score => {
        const device = this.devices.find(d => d.id === score.deviceId)
        return device && (device.currentPrice || device.launchPrice)
      })
      .sort((a, b) => {
        const deviceA = this.devices.find(d => d.id === a.deviceId)
        const deviceB = this.devices.find(d => d.id === b.deviceId)
        const priceA = deviceA.currentPrice || deviceA.launchPrice || 1
        const priceB = deviceB.currentPrice || deviceB.launchPrice || 1
        return (b.overallScore / priceB * 1000) - (a.overallScore / priceA * 1000)
      })[0] || winner

    // Find category winners
    const categoryWinners: { [category: string]: DeviceScore } = {}
    const categories = ['price', 'performance', 'battery', 'camera', 'display', 'design', 'features']
    
    categories.forEach(category => {
      categoryWinners[category] = deviceScores.sort((a, b) => 
        b.categoryScores[category as keyof typeof b.categoryScores] - 
        a.categoryScores[category as keyof typeof a.categoryScores]
      )[0]
    })

    // Generate recommendations
    const recommendations = {
      gaming: deviceScores.sort((a, b) => 
        (b.categoryScores.performance + b.categoryScores.display) - 
        (a.categoryScores.performance + a.categoryScores.display)
      )[0],
      photography: categoryWinners.camera,
      battery: categoryWinners.battery,
      budget: bestValue
    }

    // Generate summary
    const scoreDifference = deviceScores[0].overallScore - (deviceScores[1]?.overallScore || 0)
    const isCloseRace = scoreDifference <= 5
    
    const summary = `${winner.deviceName} emerges as the ${isCloseRace ? 'narrow' : 'clear'} winner with an overall score of ${winner.overallScore}/100. ${
      isCloseRace 
        ? `It's a tight race with only ${scoreDifference} points separating the top contenders.`
        : `It leads by a significant margin of ${scoreDifference} points.`
    } The comparison reveals distinct strengths across different categories, making each device suitable for specific user needs.`

    return {
      winner,
      bestValue,
      categoryWinners,
      recommendations,
      summary
    }
  }
}