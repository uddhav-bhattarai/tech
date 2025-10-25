import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { calculateDeviceRankings, RANKING_PRESETS, DEFAULT_WEIGHTS, type RankingWeights } from "@/lib/ranking"
import { type Prisma } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const category = searchParams.get("category") || "smartphone"
    const brand = searchParams.get("brand")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const preset = searchParams.get("preset") || "balanced"
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")
    
    // Custom weights (if provided)
    const customWeights = {
      performance: parseFloat(searchParams.get("w_performance") || ""),
      battery: parseFloat(searchParams.get("w_battery") || ""),
      camera: parseFloat(searchParams.get("w_camera") || ""),
      display: parseFloat(searchParams.get("w_display") || ""),
      build: parseFloat(searchParams.get("w_build") || ""),
      price: parseFloat(searchParams.get("w_price") || ""),
      reviews: parseFloat(searchParams.get("w_reviews") || ""),
      recency: parseFloat(searchParams.get("w_recency") || ""),
    }
    
    // Determine weights to use
    let weights: RankingWeights
    const hasCustomWeights = Object.values(customWeights).some(w => !isNaN(w))
    
    if (hasCustomWeights) {
      // Use custom weights, falling back to defaults for missing values
      weights = {
        performance: isNaN(customWeights.performance) ? DEFAULT_WEIGHTS.performance : customWeights.performance,
        battery: isNaN(customWeights.battery) ? DEFAULT_WEIGHTS.battery : customWeights.battery,
        camera: isNaN(customWeights.camera) ? DEFAULT_WEIGHTS.camera : customWeights.camera,
        display: isNaN(customWeights.display) ? DEFAULT_WEIGHTS.display : customWeights.display,
        build: isNaN(customWeights.build) ? DEFAULT_WEIGHTS.build : customWeights.build,
        price: isNaN(customWeights.price) ? DEFAULT_WEIGHTS.price : customWeights.price,
        reviews: isNaN(customWeights.reviews) ? DEFAULT_WEIGHTS.reviews : customWeights.reviews,
        recency: isNaN(customWeights.recency) ? DEFAULT_WEIGHTS.recency : customWeights.recency,
      }
      
      // Normalize weights to ensure they sum to 1
      const total = Object.values(weights).reduce((sum, w) => sum + w, 0)
      if (total > 0) {
        Object.keys(weights).forEach(key => {
          weights[key as keyof RankingWeights] /= total
        })
      }
    } else {
      // Use preset weights
      weights = RANKING_PRESETS[preset] || DEFAULT_WEIGHTS
    }

    // Build device filter conditions
    const whereConditions: Prisma.DeviceWhereInput = {
      isActive: true,
    }

    if (brand) {
      whereConditions.brand = {
        name: {
          equals: brand,
          mode: "insensitive",
        }
      }
    }

    if (minPrice || maxPrice) {
      const priceFilter: Prisma.DecimalFilter = {}
      if (minPrice) priceFilter.gte = parseFloat(minPrice)
      if (maxPrice) priceFilter.lte = parseFloat(maxPrice)
      
      whereConditions.OR = [
        { currentPrice: priceFilter },
        { 
          AND: [
            { currentPrice: null },
            { launchPrice: priceFilter }
          ]
        }
      ]
    }

    // Fetch devices with all necessary data
    const devices = await prisma.device.findMany({
      where: whereConditions,
      include: {
        brand: {
          select: {
            name: true,
            logo: true,
          },
        },
        images: {
          select: {
            url: true,
            alt: true,
          },
          orderBy: { order: "asc" },
          take: 1,
        },
        reviews: {
          select: {
            rating: true,
          },
          where: {
            isApproved: true,
          },
        },
        _count: {
          select: {
            reviews: {
              where: {
                isApproved: true,
              },
            },
          },
        },
      },
      orderBy: [
        { isActive: "desc" },
        { createdAt: "desc" },
      ],
    })

    // Transform devices to match RankingDevice interface
    const rankingDevices = devices.map(device => ({
      id: device.id,
      name: device.name,
      slug: device.slug,
      model: device.model,
      brand: device.brand,
      launchPrice: device.launchPrice,
      currentPrice: device.currentPrice,
      currency: device.currency,
      displaySize: device.displaySize,
      batteryCapacity: device.batteryCapacity,
      ramConfigurations: device.ramConfigurations,
      storageConfigurations: device.storageConfigurations,
      operatingSystem: device.operatingSystem,
      chipset: device.chipset,
      releaseDate: device.releaseDate,
      weight: device.weight,
      dimensions: device.dimensions as Record<string, unknown> | null,
      waterResistance: device.waterResistance,
      wirelessCharging: device.wirelessCharging,
      mainCamera: device.mainCamera as Record<string, unknown> | null,
      frontCamera: device.frontCamera as Record<string, unknown> | null,
      securityFeatures: device.securityFeatures,
      images: device.images,
      reviews: device.reviews,
      _count: device._count,
    }))

    // Calculate rankings
    const rankings = calculateDeviceRankings(rankingDevices, weights)
    
    // Apply pagination to rankings
    const paginatedRankings = rankings.slice(offset, offset + limit)
    
    // Format response with device details
    const rankedDevices = paginatedRankings.map(ranking => {
      const device = devices.find(d => d.id === ranking.deviceId)!
      return {
        device: {
          id: device.id,
          name: device.name,
          slug: device.slug,
          model: device.model,
          brand: device.brand,
          launchPrice: device.launchPrice,
          currentPrice: device.currentPrice,
          currency: device.currency,
          displaySize: device.displaySize,
          batteryCapacity: device.batteryCapacity,
          ramConfigurations: device.ramConfigurations,
          storageConfigurations: device.storageConfigurations,
          operatingSystem: device.operatingSystem,
          chipset: device.chipset,
          releaseDate: device.releaseDate,
          weight: device.weight,
          waterResistance: device.waterResistance,
          wirelessCharging: device.wirelessCharging,
          mainCamera: device.mainCamera,
          frontCamera: device.frontCamera,
          securityFeatures: device.securityFeatures,
          images: device.images,
          reviewCount: device._count.reviews,
          averageRating: device.reviews.length > 0 
            ? device.reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / device.reviews.length
            : null,
        },
        score: ranking.totalScore,
        breakdown: ranking.breakdown,
        rank: ranking.rank,
      }
    })

    // Get available brands for filtering
    const availableBrands = await prisma.brand.findMany({
      where: {
        devices: {
          some: {
            isActive: true,
          },
        },
      },
      select: {
        name: true,
      },
      orderBy: { name: "asc" },
    })

    // Get price range
    const priceStats = await prisma.device.aggregate({
      where: whereConditions,
      _min: {
        currentPrice: true,
        launchPrice: true,
      },
      _max: {
        currentPrice: true,
        launchPrice: true,
      },
    })

    return NextResponse.json({
      rankings: rankedDevices,
      pagination: {
        total: rankings.length,
        limit,
        offset,
        hasMore: offset + limit < rankings.length,
      },
      filters: {
        category,
        brand,
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
        preset: hasCustomWeights ? "custom" : preset,
        weights,
      },
      metadata: {
        availableBrands: availableBrands.map(b => ({
          name: b.name,
        })),
        priceRange: {
          min: Math.min(
            Number(priceStats._min.currentPrice || Infinity),
            Number(priceStats._min.launchPrice || Infinity)
          ),
          max: Math.max(
            Number(priceStats._max.currentPrice || 0),
            Number(priceStats._max.launchPrice || 0)
          ),
        },
        availablePresets: Object.keys(RANKING_PRESETS),
        totalDevices: devices.length,
      },
    })
  } catch (error) {
    console.error("Error calculating rankings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}