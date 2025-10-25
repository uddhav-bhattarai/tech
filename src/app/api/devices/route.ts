import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const deviceSchema = z.object({
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
  
  // Categories and tags
  categoryIds: z.array(z.string()).default([]),
  tagIds: z.array(z.string()).default([]),
  
  // Status
  availability: z.enum(["available", "discontinued", "upcoming"]).default("available"),
  isActive: z.boolean().default(true),
})

// GET /api/devices - List devices with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "12")
    const search = searchParams.get("search") || ""
    const brandId = searchParams.get("brandId")
    const categoryId = searchParams.get("categoryId")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const availability = searchParams.get("availability")
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"
    const includeBlogDescriptions = searchParams.get("includeBlogDescriptions") === "true"

    const skip = (page - 1) * limit

    const where = {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { model: { contains: search, mode: "insensitive" as const } },
          { brand: { name: { contains: search, mode: "insensitive" as const } } },
        ],
      }),
      ...(brandId && { brandId }),
      ...(categoryId && {
        categories: { some: { id: categoryId } },
      }),
      ...(availability && { availability }),
      ...(minPrice && { currentPrice: { gte: parseFloat(minPrice) } }),
      ...(maxPrice && { currentPrice: { lte: parseFloat(maxPrice) } }),
    }

    const orderBy = { [sortBy]: sortOrder }

    const baseInclude = {
      brand: true,
      categories: true,
      images: {
        orderBy: { order: "asc" as const },
        take: 1,
      },
      _count: {
        select: {
          reviews: true,
          comparisons: true,
        },
      },
    }

    // Add blog descriptions if requested
    const includeWithBlogs = includeBlogDescriptions ? {
      ...baseInclude,
      blogPosts: {
        where: {
          OR: [
            { blogType: "DESCRIPTION" },
            { blogType: "REVIEW" }
          ],
          status: "PUBLISHED"
        },
        select: {
          id: true,
          title: true,
          excerpt: true,
          blogType: true,
          slug: true
        },
        take: 3
      }
    } : baseInclude

    const [devices, total] = await Promise.all([
      prisma.device.findMany({
        where,
        include: includeWithBlogs,
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
    })
  } catch (error) {
    console.error("Error fetching devices:", error)
    return NextResponse.json(
      { error: "Failed to fetch devices" },
      { status: 500 }
    )
  }
}

// POST /api/devices - Create new device (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Check if user has admin permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    })

    const canCreateDevice = user?.role?.permissions.some(
      (p) => p.resource === "device" && p.action === "create"
    ) || user?.role?.name === "ADMIN" || user?.role?.name === "SUPER_ADMIN"

    if (!canCreateDevice) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const data = deviceSchema.parse(body)

    // Generate slug if not provided
    if (!data.slug) {
      const baseSlug = `${data.name}-${data.model}`.toLowerCase().replace(/[^a-z0-9]+/g, "-")
      let slug = baseSlug
      let counter = 1
      
      while (await prisma.device.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`
        counter++
      }
      
      data.slug = slug
    }

    // Separate categories and tags from the main data
    const { categoryIds, tagIds, ...deviceData } = data
    
    const device = await prisma.device.create({
      data: {
        ...deviceData,
        slug: data.slug!, // We ensure slug exists above
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

    return NextResponse.json(device, { status: 201 })
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