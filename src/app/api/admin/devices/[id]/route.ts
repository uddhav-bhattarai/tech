/**
 * Individual Device Admin API
 * GET /api/admin/devices/[id] - Get single device details
 * PUT /api/admin/devices/[id] - Update device
 * DELETE /api/admin/devices/[id] - Delete device
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Device update schema (partial)
const deviceUpdateSchema = z.object({
  name: z.string().min(1, "Device name is required").optional(),
  model: z.string().min(1, "Model is required").optional(),
  brandId: z.string().min(1, "Brand is required").optional(),
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
  wirelessCharging: z.boolean().optional(),
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
  securityFeatures: z.array(z.string()).optional(),
  
  // Status and availability
  availability: z.string().optional(),
  isActive: z.boolean().optional(),
}).partial()

/**
 * GET /api/admin/devices/[id]
 * Get single device details for editing
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role?.name !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const device = await prisma.device.findUnique({
      where: { id: params.id },
      include: {
        brand: {
          select: { id: true, name: true, logo: true, slug: true }
        },
        images: {
          select: { id: true, url: true, alt: true, type: true }
        },
        reviews: {
          select: { id: true, rating: true, createdAt: true },
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            reviews: true,
            comparisons: true,
            favoritedBy: true
          }
        }
      }
    })

    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      device
    })
  } catch (error) {
    console.error('Device fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch device' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/devices/[id]
 * Update device
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role?.name !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = deviceUpdateSchema.parse(body)

    // Check if device exists
    const existingDevice = await prisma.device.findUnique({
      where: { id: params.id }
    })
    
    if (!existingDevice) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      )
    }

    // Check slug uniqueness if slug is being updated
    if (validatedData.slug && validatedData.slug !== existingDevice.slug) {
      const slugExists = await prisma.device.findFirst({
        where: { 
          slug: validatedData.slug,
          id: { not: params.id }
        }
      })
      
      if (slugExists) {
        return NextResponse.json(
          { error: 'Slug already exists' },
          { status: 400 }
        )
      }
    }

    // Verify brand exists if brandId is being updated
    if (validatedData.brandId) {
      const brand = await prisma.brand.findUnique({
        where: { id: validatedData.brandId }
      })
      
      if (!brand) {
        return NextResponse.json(
          { error: 'Brand not found' },
          { status: 400 }
        )
      }
    }

    const updatedDevice = await prisma.device.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        brand: {
          select: { id: true, name: true, logo: true }
        },
        images: {
          select: { id: true, url: true, alt: true }
        },
        _count: {
          select: {
            reviews: true,
            comparisons: true,
            favoritedBy: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Device updated successfully',
      device: updatedDevice
    })
  } catch (error) {
    console.error('Device update error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update device' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/devices/[id]
 * Delete device
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role?.name !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if device exists
    const existingDevice = await prisma.device.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            reviews: true,
            comparisons: true,
            favoritedBy: true
          }
        }
      }
    })
    
    if (!existingDevice) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      )
    }

    // Check if device has dependencies (reviews, comparisons, etc.)
    const hasReviews = existingDevice._count.reviews > 0
    const hasComparisons = existingDevice._count.comparisons > 0
    const hasFavorites = existingDevice._count.favoritedBy > 0

    if (hasReviews || hasComparisons || hasFavorites) {
      // Instead of hard delete, soft delete by setting isActive to false
      const updatedDevice = await prisma.device.update({
        where: { id: params.id },
        data: { 
          isActive: false,
          availability: 'discontinued'
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Device has been marked as inactive instead of deleted due to existing reviews/comparisons',
        device: updatedDevice,
        softDeleted: true
      })
    }

    // If no dependencies, perform hard delete
    await prisma.$transaction(async (tx) => {
      // Delete related images first
      await tx.deviceImage.deleteMany({
        where: { deviceId: params.id }
      })

      // Delete the device
      await tx.device.delete({
        where: { id: params.id }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Device deleted successfully',
      softDeleted: false
    })
  } catch (error) {
    console.error('Device deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete device' },
      { status: 500 }
    )
  }
}