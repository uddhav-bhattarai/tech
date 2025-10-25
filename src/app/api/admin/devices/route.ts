/**
 * Admin Device Management API
 * GET /api/admin/devices - List all devices with admin features
 * POST /api/admin/devices - Create new device
 * PUT /api/admin/devices/[id] - Update device
 * DELETE /api/admin/devices/[id] - Delete device
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Device creation/update schema
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
    sensor: z.string().optional(),
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
    frameRates: z.array(z.number()).optional(),
    features: z.array(z.string()).optional(),
  }).optional(),
  
  // Battery and connectivity
  batteryCapacity: z.number().optional(),
  chargingSpeed: z.number().optional(),
  wirelessCharging: z.boolean().default(false),
  connectivity: z.object({
    wifi: z.string().optional(),
    bluetooth: z.string().optional(),
    nfc: z.boolean().optional(),
    usbType: z.string().optional(),
  }).optional(),
  
  // Software
  operatingSystem: z.string().optional(),
  osVersion: z.string().optional(),
  customUI: z.string().optional(),
  securityFeatures: z.array(z.string()).default([]),
  
  // Status and availability
  availability: z.string().default("available"),
  isActive: z.boolean().default(true),
})

/**
 * GET /api/admin/devices
 * List all devices with admin details
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role?.name !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const brandId = searchParams.get('brandId')
    const availability = searchParams.get('availability')
    const isActive = searchParams.get('isActive')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { brand: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }
    
    if (brandId) {
      where.brandId = brandId
    }
    
    if (availability) {
      where.availability = availability
    }
    
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    const [devices, total] = await Promise.all([
      prisma.device.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          brand: {
            select: { id: true, name: true, logo: true }
          },
          images: {
            select: { id: true, url: true, alt: true },
            take: 1
          },
          _count: {
            select: {
              reviews: true,
              comparisons: true
            }
          }
        }
      }),
      prisma.device.count({ where })
    ])

    return NextResponse.json({
      success: true,
      devices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Admin devices fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch devices' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/devices
 * Create new device
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role?.name !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = deviceSchema.parse(body)

    // Generate slug if not provided
    if (!validatedData.slug) {
      const baseSlug = `${validatedData.name}-${validatedData.model}`
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
      
      // Check for existing slug and add suffix if needed
      let slug = baseSlug
      let counter = 1
      while (await prisma.device.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`
        counter++
      }
      validatedData.slug = slug
    }

    // Check if slug is unique
    const existingDevice = await prisma.device.findUnique({
      where: { slug: validatedData.slug }
    })
    
    if (existingDevice) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 }
      )
    }

    // Verify brand exists
    const brand = await prisma.brand.findUnique({
      where: { id: validatedData.brandId }
    })
    
    if (!brand) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 400 }
      )
    }

    const device = await prisma.device.create({
      data: validatedData,
      include: {
        brand: {
          select: { id: true, name: true, logo: true }
        },
        images: {
          select: { id: true, url: true, alt: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Device created successfully',
      device
    })
  } catch (error) {
    console.error('Device creation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create device' },
      { status: 500 }
    )
  }
}