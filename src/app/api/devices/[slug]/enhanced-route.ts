import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Enhanced utility functions
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

const deviceSpecificationSchema = z.object({
  id: z.string().optional(),
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
  id: z.string().optional(),
  url: z.string().url(),
  alt: z.string().optional(),
  type: z.string().optional(),
  order: z.number().default(0),
})

const contentBlockUsageSchema = z.object({
  id: z.string().optional(),
  blockId: z.string(),
  customData: z.any().optional(),
  sectionId: z.string().optional(),
  order: z.number().default(0),
})

const deviceUpdateSchema = z.object({
  // Basic information
  name: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  brandId: z.string().min(1).optional(),
  slug: z.string().optional(),
  
  // Release and availability
  releaseDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  discontinuedDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  marketAvailability: z.record(z.string(), z.boolean()).optional(),
  
  // Pricing
  launchPrice: z.number().optional(),
  currentPrice: z.number().optional(),
  currency: z.string().optional(),
  
  // Physical characteristics
  dimensions: z.object({
    length: z.number().optional(),
    width: z.number().optional(),
    thickness: z.number().optional(),
  }).optional(),
  weight: z.number().optional(),
  colors: z.array(z.string()).optional(),
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
  hdrSupport: z.array(z.string()).optional(),
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
  ramConfigurations: z.array(z.number()).optional(),
  storageConfigurations: z.array(z.number()).optional(),
  expandableStorage: z.boolean().optional(),
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
  cameraFeatures: z.array(z.string()).optional(),
  
  // Battery and charging
  batteryCapacity: z.number().optional(),
  wiredCharging: z.number().optional(),
  wirelessCharging: z.number().optional(),
  reverseCharging: z.boolean().optional(),
  chargingProtocols: z.array(z.string()).optional(),
  
  // Connectivity
  networkSupport: z.object({
    fiveG: z.array(z.string()).optional(),
    fourG: z.array(z.string()).optional(),
  }).optional(),
  wifiStandards: z.array(z.string()).optional(),
  bluetoothVersion: z.string().optional(),
  nfcSupport: z.boolean().optional(),
  gpsFeatures: z.array(z.string()).optional(),
  simConfiguration: z.string().optional(),
  usbConnector: z.string().optional(),
  headphoneJack: z.boolean().optional(),
  
  // Software
  operatingSystem: z.string().optional(),
  osVersionAtLaunch: z.string().optional(),
  customUI: z.string().optional(),
  securityFeatures: z.array(z.string()).optional(),
  
  // Enterprise features
  specifications: z.array(deviceSpecificationSchema).optional(),
  images: z.array(deviceImageSchema).optional(),
  contentBlocks: z.array(contentBlockUsageSchema).optional(),
  
  // Categories and tags
  categoryIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
  
  // SEO and metadata
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  
  // Status
  availability: z.enum(["available", "discontinued", "upcoming"]).optional(),
  isActive: z.boolean().optional(),
})

// GET /api/devices/[slug] - Get single device with comprehensive data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    
    const includeSpecs = searchParams.get("includeSpecs") !== "false"
    const includeImages = searchParams.get("includeImages") !== "false"
    const includeContentBlocks = searchParams.get("includeContentBlocks") !== "false"
    const includeSEO = searchParams.get("includeSEO") !== "false"
    const includeReviews = searchParams.get("includeReviews") !== "false"
    const includeBenchmarks = searchParams.get("includeBenchmarks") !== "false"
    const includePriceHistory = searchParams.get("includePriceHistory") !== "false"
    const includeBlogPosts = searchParams.get("includeBlogPosts") !== "false"
    const includeComparisons = searchParams.get("includeComparisons") !== "false"

    if (!slug) {
      return NextResponse.json(
        { error: "Device slug is required" },
        { status: 400 }
      )
    }

    // Build comprehensive include object
    const include = {
      brand: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          website: true,
          country: true,
          founded: true,
        },
      },
      categories: {
        select: {
          id: true,
          name: true,
          slug: true,
          color: true,
          icon: true,
        },
      },
      tags: {
        select: {
          id: true,
          name: true,
          slug: true,
          color: true,
        },
      },
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
      ...(includeReviews && {
        reviews: {
          take: 10,
          orderBy: { createdAt: "desc" as const },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      }),
      ...(includeBenchmarks && {
        benchmarks: {
          orderBy: { date: "desc" as const },
          take: 10,
        },
      }),
      ...(includePriceHistory && {
        priceHistory: {
          orderBy: { date: "desc" as const },
          take: 20,
        },
      }),
      ...(includeBlogPosts && {
        blogPosts: {
          where: {
            status: "PUBLISHED",
          },
          orderBy: { updatedAt: "desc" as const },
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            blogType: true,
            publishedAt: true,
            featuredImage: true,
            author: {
              select: {
                name: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      }),
      ...(includeComparisons && {
        comparisons: {
          take: 5,
          orderBy: { createdAt: "desc" as const },
          include: {
            comparison: {
              select: {
                id: true,
                name: true,
                isPublic: true,
                views: true,
                user: {
                  select: {
                    name: true,
                    username: true,
                  },
                },
              },
            },
          },
        },
      }),
      rankings: {
        orderBy: { calculatedAt: "desc" as const },
        take: 10,
      },
    }

    const device = await prisma.device.findUnique({
      where: { 
        slug,
        isActive: true,
      },
      include,
    })

    if (!device) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      )
    }

    // Increment view count
    await prisma.device.update({
      where: { id: device.id },
      data: { views: { increment: 1 } },
    })

    return NextResponse.json(device)
  } catch (error) {
    console.error("Error fetching device:", error)
    return NextResponse.json(
      { error: "Failed to fetch device" },
      { status: 500 }
    )
  }
}

// PUT /api/devices/[slug] - Update device with comprehensive features
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
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

    const { slug } = await params
    const body = await request.json()
    const data = deviceUpdateSchema.parse(body)

    // Find existing device
    const existingDevice = await prisma.device.findUnique({
      where: { slug, isActive: true },
      include: {
        specifications: true,
        images: true,
        contentBlockUsages: true,
      },
    })

    if (!existingDevice) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      )
    }

    // Validate brand if provided
    if (data.brandId) {
      const brand = await prisma.brand.findUnique({ where: { id: data.brandId } })
      if (!brand) {
        return NextResponse.json(
          { error: "Invalid brand ID" },
          { status: 400 }
        )
      }
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

    // Update device with transaction
    const updatedDevice = await prisma.$transaction(async (tx) => {
      // Update main device record
      const device = await tx.device.update({
        where: { id: existingDevice.id },
        data: {
          ...deviceData,
          ...(categoryIds && {
            categories: {
              set: [], // Clear existing
              connect: categoryIds.map(id => ({ id })),
            },
          }),
          ...(tagIds && {
            tags: {
              set: [], // Clear existing
              connect: tagIds.map(id => ({ id })),
            },
          }),
        },
      })

      // Update specifications if provided
      if (specifications) {
        // Delete existing specifications
        await tx.deviceSpecification.deleteMany({
          where: { deviceId: device.id },
        })
        
        // Create new specifications
        if (specifications.length > 0) {
          await tx.deviceSpecification.createMany({
            data: specifications.map(spec => {
              const { id, ...specData } = spec // Remove id if present
              return {
                deviceId: device.id,
                ...specData,
              }
            }),
          })
        }
      }

      // Update images if provided
      if (images) {
        // Delete existing images
        await tx.deviceImage.deleteMany({
          where: { deviceId: device.id },
        })
        
        // Create new images
        if (images.length > 0) {
          await tx.deviceImage.createMany({
            data: images.map(img => {
              const { id, ...imgData } = img // Remove id if present
              return {
                deviceId: device.id,
                ...imgData,
              }
            }),
          })
        }
      }

      // Update content blocks if provided
      if (contentBlocks) {
        // Delete existing content block usages
        await tx.contentBlockUsage.deleteMany({
          where: { deviceId: device.id },
        })
        
        // Create new content block usages
        if (contentBlocks.length > 0) {
          await tx.contentBlockUsage.createMany({
            data: contentBlocks.map(cb => {
              const { id, ...cbData } = cb // Remove id if present
              return {
                deviceId: device.id,
                ...cbData,
              }
            }),
          })
        }
      }

      // Update SEO analysis if metadata changed
      if (data.metaTitle || data.metaDescription || data.keywords) {
        await tx.sEOAnalysis.upsert({
          where: { deviceId: device.id },
          update: {
            title: data.metaTitle,
            metaDescription: data.metaDescription,
            keywords: data.keywords,
            analyzedAt: new Date(),
          },
          create: {
            deviceId: device.id,
            score: 0,
            titleScore: 0,
            metaScore: 0,
            contentScore: 0,
            keywordScore: 0,
            structureScore: 0,
            title: data.metaTitle || `${device.name} ${device.model} Review`,
            metaDescription: data.metaDescription || `Comprehensive review of ${device.name} ${device.model}`,
            keywords: data.keywords || [],
            recommendations: [],
          },
        })
      }

      return device
    })

    // Fetch updated device with all relations
    const completeDevice = await prisma.device.findUnique({
      where: { id: updatedDevice.id },
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

    return NextResponse.json(completeDevice)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error updating device:", error)
    return NextResponse.json(
      { error: "Failed to update device" },
      { status: 500 }
    )
  }
}

// DELETE /api/devices/[slug] - Soft delete device
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Check permissions
    if (!await hasPermission(session.user.id, "device", "delete")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get("hard") === "true"

    const device = await prisma.device.findUnique({
      where: { slug, isActive: true },
    })

    if (!device) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      )
    }

    if (hardDelete) {
      // Hard delete with cascade
      await prisma.$transaction(async (tx) => {
        // Delete related records first
        await tx.deviceSpecification.deleteMany({ where: { deviceId: device.id } })
        await tx.deviceImage.deleteMany({ where: { deviceId: device.id } })
        await tx.contentBlockUsage.deleteMany({ where: { deviceId: device.id } })
        await tx.sEOAnalysis.deleteMany({ where: { deviceId: device.id } })
        
        // Delete the device
        await tx.device.delete({ where: { id: device.id } })
      })

      return NextResponse.json({ 
        message: "Device permanently deleted",
        deviceId: device.id 
      })
    } else {
      // Soft delete
      const softDeletedDevice = await prisma.device.update({
        where: { id: device.id },
        data: { isActive: false },
      })

      return NextResponse.json({ 
        message: "Device soft deleted",
        device: softDeletedDevice 
      })
    }
  } catch (error) {
    console.error("Error deleting device:", error)
    return NextResponse.json(
      { error: "Failed to delete device" },
      { status: 500 }
    )
  }
}