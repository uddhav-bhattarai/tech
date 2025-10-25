import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Enhanced utility functions for device management
async function generateUniqueSlug(baseName: string, validator: (slug: string) => Promise<boolean>): Promise<string> {
  const baseSlug = baseName.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  let slug = baseSlug
  let counter = 1
  
  while (!await validator(slug)) {
    slug = `${baseSlug}-${counter}`
    counter++
  }
  
  return slug
}

async function hasPermission(userId: string, resource: string, action: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          permissions: true,
        },
      },
    },
  })

  return user?.role?.permissions.some(
    (p) => p.resource === resource && p.action === action
  ) || user?.role?.name === "ADMIN" || user?.role?.name === "SUPER_ADMIN" || false
}

// Enhanced device schema with specifications support
const deviceSpecificationSchema = z.object({
  category: z.string().min(1),
  name: z.string().min(1),
  valueType: z.enum(["string", "number", "boolean", "json", "array"]),
  value: z.any(),
  displayName: z.string().optional(),
  unit: z.string().optional(),
  description: z.string().optional(),
  order: z.number().default(0),
  grouping: z.string().optional(),
  source: z.string().optional(),
  isVerified: z.boolean().default(false),
})

const deviceImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
  type: z.string().optional(),
  order: z.number().default(0),
})

const contentBlockUsageSchema = z.object({
  blockId: z.string(),
  customData: z.any().optional(),
  sectionId: z.string().optional(),
  order: z.number().default(0),
})

const enhancedDeviceSchema = z.object({
  // Basic information
  name: z.string().min(1, "Device name is required"),
  model: z.string().min(1, "Model is required"),
  brandId: z.string().min(1, "Brand is required"),
  slug: z.string().optional(),
  
  // Release and availability
  releaseDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  discontinuedDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  marketAvailability: z.record(z.string(), z.boolean()).optional(),
  
  // Pricing
  launchPrice: z.number().optional(),
  currentPrice: z.number().optional(),
  currency: z.string().default("NPR"),
  
  // Physical characteristics
  dimensions: z.object({
    length: z.number().optional(),
    width: z.number().optional(),
    thickness: z.number().optional(),
  }).optional(),
  weight: z.number().optional(),
  colors: z.array(z.string()).default([]),
  buildMaterials: z.object({
    frame: z.string().optional(),
    back: z.string().optional(),
    glass: z.string().optional(),
  }).optional(),
  waterResistance: z.string().optional(),
  
  // Display specifications
  displaySize: z.number().optional(),
  displayResolution: z.object({
    width: z.number().optional(),
    height: z.number().optional(),
  }).optional(),
  displayTechnology: z.string().optional(),
  pixelDensity: z.number().optional(),
  aspectRatio: z.string().optional(),
  refreshRate: z.number().optional(),
  touchSamplingRate: z.number().optional(),
  peakBrightness: z.number().optional(),
  hdrSupport: z.array(z.string()).default([]),
  protection: z.string().optional(),
  
  // Performance
  chipset: z.string().optional(),
  cpuDetails: z.object({
    cores: z.number().optional(),
    architecture: z.string().optional(),
    clockSpeed: z.number().optional(),
  }).optional(),
  gpu: z.string().optional(),
  manufacturingProcess: z.string().optional(),
  ramConfigurations: z.array(z.number()).default([]),
  storageConfigurations: z.array(z.number()).default([]),
  expandableStorage: z.boolean().default(false),
  maxExpandableStorage: z.number().optional(),
  
  // Camera system
  mainCamera: z.object({
    megapixels: z.number().optional(),
    aperture: z.string().optional(),
    sensorSize: z.string().optional(),
  }).optional(),
  ultraWideCamera: z.object({
    megapixels: z.number().optional(),
    aperture: z.string().optional(),
  }).optional(),
  telephotoCamera: z.object({
    megapixels: z.number().optional(),
    aperture: z.string().optional(),
    zoom: z.string().optional(),
  }).optional(),
  frontCamera: z.object({
    megapixels: z.number().optional(),
    aperture: z.string().optional(),
  }).optional(),
  videoRecording: z.object({
    maxResolution: z.string().optional(),
    maxFrameRate: z.number().optional(),
  }).optional(),
  cameraFeatures: z.array(z.string()).default([]),
  
  // Battery and charging
  batteryCapacity: z.number().optional(),
  wiredCharging: z.number().optional(),
  wirelessCharging: z.number().optional(),
  reverseCharging: z.boolean().default(false),
  chargingProtocols: z.array(z.string()).default([]),
  
  // Connectivity
  networkSupport: z.object({
    fiveG: z.array(z.string()).optional(),
    fourG: z.array(z.string()).optional(),
  }).optional(),
  wifiStandards: z.array(z.string()).default([]),
  bluetoothVersion: z.string().optional(),
  nfcSupport: z.boolean().default(false),
  gpsFeatures: z.array(z.string()).default([]),
  simConfiguration: z.string().optional(),
  usbConnector: z.string().optional(),
  headphoneJack: z.boolean().default(false),
  
  // Software
  operatingSystem: z.string().optional(),
  osVersionAtLaunch: z.string().optional(),
  customUI: z.string().optional(),
  securityFeatures: z.array(z.string()).default([]),
  
  // Enterprise features
  specifications: z.array(deviceSpecificationSchema).default([]),
  images: z.array(deviceImageSchema).default([]),
  contentBlocks: z.array(contentBlockUsageSchema).default([]),
  
  // Categories and tags
  categoryIds: z.array(z.string()).default([]),
  tagIds: z.array(z.string()).default([]),
  
  // SEO and metadata
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  
  // Status
  availability: z.enum(["available", "discontinued", "upcoming"]).default("available"),
  isActive: z.boolean().default(true),
})

const deviceUpdateSchema = enhancedDeviceSchema.partial()

// GET /api/devices - List devices with comprehensive filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "12"), 100) // Max 100 items per page
    const search = searchParams.get("search") || ""
    const brandId = searchParams.get("brandId")
    const categoryId = searchParams.get("categoryId")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const availability = searchParams.get("availability")
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"
    const includeBlogDescriptions = searchParams.get("includeBlogDescriptions") === "true"
    const includeSpecs = searchParams.get("includeSpecs") === "true"
    const includeImages = searchParams.get("includeImages") === "true"
    const includeContentBlocks = searchParams.get("includeContentBlocks") === "true"
    const includeSEO = searchParams.get("includeSEO") === "true"

    const skip = (page - 1) * limit

    // Build comprehensive where clause
    const where = {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { model: { contains: search, mode: "insensitive" as const } },
          { brand: { name: { contains: search, mode: "insensitive" as const } } },
          { chipset: { contains: search, mode: "insensitive" as const } },
          { operatingSystem: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(brandId && { brandId }),
      ...(categoryId && {
        categories: {
          some: { id: categoryId },
        },
      }),
      ...(minPrice && { currentPrice: { gte: parseFloat(minPrice) } }),
      ...(maxPrice && { currentPrice: { lte: parseFloat(maxPrice) } }),
      ...(availability && { availability }),
    }

    // Build comprehensive include based on request parameters
    const baseInclude = {
      brand: true,
      categories: true,
      tags: true,
      priceHistory: {
        take: 5,
        orderBy: { date: "desc" as const },
      },
      benchmarks: true,
      reviews: {
        take: 5,
        orderBy: { createdAt: "desc" as const },
        include: {
          user: {
            select: { name: true, avatar: true, username: true },
          },
        },
      },
    }

    const includeWithEnhancements = {
      ...baseInclude,
      ...(includeSpecs && {
        specifications: {
          orderBy: [
            { category: "asc" as const },
            { order: "asc" as const },
            { name: "asc" as const },
          ],
        },
      }),
      ...(includeImages && {
        images: {
          orderBy: { order: "asc" as const },
        },
      }),
      ...(includeContentBlocks && {
        contentBlockUsages: {
          include: {
            block: true,
          },
          orderBy: { order: "asc" as const },
        },
      }),
      ...(includeSEO && {
        seoAnalysis: true,
      }),
      ...(includeBlogDescriptions && {
        blogPosts: {
          where: {
            blogType: "DESCRIPTION",
            status: "PUBLISHED",
          },
          take: 1,
          orderBy: { updatedAt: "desc" as const },
        },
      }),
    }

    // Build order by clause
    const orderByMap: Record<string, any> = {
      createdAt: { createdAt: sortOrder },
      updatedAt: { updatedAt: sortOrder },
      name: { name: sortOrder },
      releaseDate: { releaseDate: sortOrder },
      currentPrice: { currentPrice: sortOrder },
      averageRating: { averageRating: sortOrder },
      totalReviews: { totalReviews: sortOrder },
      views: { views: sortOrder },
    }

    const orderBy = orderByMap[sortBy] || { createdAt: sortOrder }

    const [devices, total] = await Promise.all([
      prisma.device.findMany({
        where,
        include: includeWithEnhancements,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.device.count({ where }),
    ])

    return NextResponse.json({
      devices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      filters: {
        search,
        brandId,
        categoryId,
        minPrice,
        maxPrice,
        availability,
        sortBy,
        sortOrder,
      },
    })
  } catch (error) {
    console.error("Error fetching devices:", error)
    return NextResponse.json(
      { error: "Failed to fetch devices" },
      { status: 500 }
    )
  }
}

// POST /api/devices - Create comprehensive device with all features
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Check permissions
    if (!await hasPermission(session.user.id, "device", "create")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const data = enhancedDeviceSchema.parse(body)

    // Generate unique slug
    if (!data.slug) {
      data.slug = await generateUniqueSlug(
        `${data.name}-${data.model}`,
        async (slug: string) => {
          const existing = await prisma.device.findUnique({ where: { slug } })
          return !existing
        }
      )
    }

    // Validate brand exists
    const brand = await prisma.brand.findUnique({ where: { id: data.brandId } })
    if (!brand) {
      return NextResponse.json(
        { error: "Invalid brand ID" },
        { status: 400 }
      )
    }

    // Separate related data
    const { 
      categoryIds, 
      tagIds, 
      specifications, 
      images, 
      contentBlocks,
      ...deviceData 
    } = data

    // Create device with transaction for data integrity
    const device = await prisma.$transaction(async (tx) => {
      // Create the main device record
      const newDevice = await tx.device.create({
        data: {
          ...deviceData,
          slug: data.slug!,
          categories: categoryIds.length > 0 ? {
            connect: categoryIds.map(id => ({ id }))
          } : undefined,
          tags: tagIds.length > 0 ? {
            connect: tagIds.map(id => ({ id }))
          } : undefined,
        },
        include: {
          brand: true,
          categories: true,
          tags: true,
        },
      })

      // Create device specifications
      if (specifications.length > 0) {
        await tx.deviceSpecification.createMany({
          data: specifications.map(spec => ({
            deviceId: newDevice.id,
            ...spec,
          })),
        })
      }

      // Create device images
      if (images.length > 0) {
        await tx.deviceImage.createMany({
          data: images.map(img => ({
            deviceId: newDevice.id,
            ...img,
          })),
        })
      }

      // Create content block usages
      if (contentBlocks.length > 0) {
        await tx.contentBlockUsage.createMany({
          data: contentBlocks.map(cb => ({
            deviceId: newDevice.id,
            ...cb,
          })),
        })
      }

      // Initialize SEO analysis
      await tx.sEOAnalysis.create({
        data: {
          deviceId: newDevice.id,
          score: 0,
          titleScore: 0,
          metaScore: 0,
          contentScore: 0,
          keywordScore: 0,
          structureScore: 0,
          title: data.metaTitle || `${data.name} ${data.model} Review`,
          metaDescription: data.metaDescription || `Comprehensive review of ${data.name} ${data.model} with specifications, performance analysis, and user feedback.`,
          keywords: data.keywords,
          recommendations: [],
        },
      })

      return newDevice
    })

    // Fetch the complete device with all relations
    const completeDevice = await prisma.device.findUnique({
      where: { id: device.id },
      include: {
        brand: true,
        categories: true,
        tags: true,
        specifications: {
          orderBy: [
            { category: "asc" },
            { order: "asc" },
            { name: "asc" },
          ],
        },
        images: {
          orderBy: { order: "asc" },
        },
        contentBlockUsages: {
          include: {
            block: true,
          },
          orderBy: { order: "asc" },
        },
        seoAnalysis: true,
      },
    })

    return NextResponse.json(completeDevice, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error creating device:", error)
    return NextResponse.json(
      { error: "Failed to create device" },
      { status: 500 }
    )
  }
}

// PUT /api/devices - Bulk operations (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Check permissions
    if (!await hasPermission(session.user.id, "device", "update")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { operation, deviceIds, data: updateData } = body

    switch (operation) {
      case "bulk_update":
        const validatedData = deviceUpdateSchema.parse(updateData)
        const updatedDevices = await prisma.device.updateMany({
          where: { id: { in: deviceIds } },
          data: validatedData,
        })
        
        return NextResponse.json({ 
          message: `Updated ${updatedDevices.count} devices`,
          count: updatedDevices.count 
        })

      case "bulk_delete":
        const deletedDevices = await prisma.device.updateMany({
          where: { id: { in: deviceIds } },
          data: { isActive: false },
        })
        
        return NextResponse.json({ 
          message: `Deleted ${deletedDevices.count} devices`,
          count: deletedDevices.count 
        })

      case "bulk_restore":
        const restoredDevices = await prisma.device.updateMany({
          where: { id: { in: deviceIds } },
          data: { isActive: true },
        })
        
        return NextResponse.json({ 
          message: `Restored ${restoredDevices.count} devices`,
          count: restoredDevices.count 
        })

      default:
        return NextResponse.json(
          { error: "Invalid operation" },
          { status: 400 }
        )
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error performing bulk operation:", error)
    return NextResponse.json(
      { error: "Failed to perform bulk operation" },
      { status: 500 }
    )
  }
}