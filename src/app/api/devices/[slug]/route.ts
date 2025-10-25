import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json(
        { error: "Device slug is required" },
        { status: 400 }
      )
    }

    const device = await prisma.device.findUnique({
      where: { slug },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            logo: true,
            website: true,
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
          },
        },
        images: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            url: true,
            alt: true,
            type: true,
          },
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            reviews: true,
            comparisons: true,
          },
        },
      },
    })

    if (!device) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      )
    }

    // Calculate average rating
    const averageRating = await prisma.review.aggregate({
      where: { deviceId: device.id },
      _avg: { rating: true },
    })

    // Transform device data to match frontend expectations
    const transformedDevice = {
      ...device,
      brand: device.brand ? {
        ...device.brand,
        logoUrl: device.brand.logo, // Transform logo to logoUrl for frontend compatibility
      } : undefined,
      images: device.images?.map(img => img.url) || [], // Transform images array to just URLs
      averageRating: averageRating._avg.rating || 0,
      totalRatings: device._count?.reviews || 0,
      specifications: {
        display: {
          size: device.displaySize ? `${device.displaySize}"` : undefined,
          resolution: device.displayResolution && typeof device.displayResolution === 'object' && 
            'width' in device.displayResolution && 'height' in device.displayResolution ? 
            `${device.displayResolution.width}x${device.displayResolution.height}` : undefined,
          type: device.displayTechnology || undefined,
          refreshRate: device.refreshRate || undefined,
          brightness: device.peakBrightness || undefined,
          protection: device.protection || undefined,
        },
        performance: {
          processor: device.chipset || undefined,
          gpu: device.gpu || undefined,
          ram: device.ramConfigurations?.length ? 
            device.ramConfigurations.map(ram => `${ram}GB`).join(', ') : undefined,
          storage: device.storageConfigurations?.length ? 
            device.storageConfigurations.map(storage => `${storage}GB`).join(', ') : undefined,
          expandableStorage: device.expandableStorage || undefined,
        },
        camera: {
          rear: device.mainCamera && typeof device.mainCamera === 'object' && 
            'megapixels' in device.mainCamera ? 
            `${device.mainCamera.megapixels}MP` : undefined,
          front: device.frontCamera && typeof device.frontCamera === 'object' && 
            'megapixels' in device.frontCamera ? 
            `${device.frontCamera.megapixels}MP` : undefined,
          videoRecording: device.videoRecording && typeof device.videoRecording === 'object' ? 
            Object.values(device.videoRecording).join(', ') : undefined,
          features: device.cameraFeatures || [],
        },
        battery: {
          capacity: device.batteryCapacity || undefined,
          fastCharging: device.wiredCharging ? 
            `${device.wiredCharging}W` : undefined,
          wireless: device.wirelessCharging ? true : false,
          lifespan: device.batteryLife && typeof device.batteryLife === 'object' ? 
            Object.values(device.batteryLife).join(', ') : undefined,
        },
        connectivity: {
          network: device.networkSupport && typeof device.networkSupport === 'object' ? 
            Object.values(device.networkSupport) : [],
          wifi: device.wifiStandards?.join(', ') || undefined,
          bluetooth: device.bluetoothVersion || undefined,
          nfc: device.nfcSupport || false,
          usb: device.usbConnector || undefined,
        },
        design: {
          dimensions: device.dimensions && typeof device.dimensions === 'object' && 
            'length' in device.dimensions && 'width' in device.dimensions && 'thickness' in device.dimensions ? 
            `${device.dimensions.length}x${device.dimensions.width}x${device.dimensions.thickness}mm` : undefined,
          weight: device.weight || undefined,
          colors: device.colors || [],
          materials: device.buildMaterials && typeof device.buildMaterials === 'object' ? 
            Object.values(device.buildMaterials) : [],
          waterResistance: device.waterResistance || undefined,
        },
        software: {
          os: device.operatingSystem || undefined,
          version: device.osVersionAtLaunch || undefined,
          updates: device.updateSupport && typeof device.updateSupport === 'object' ? 
            Object.values(device.updateSupport).join(', ') : undefined,
          features: device.specialFeatures || [],
        },
      },
    }

    return NextResponse.json({
      device: transformedDevice,
    })
  } catch (error) {
    console.error("[DEVICE_GET]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()

    if (!slug) {
      return NextResponse.json(
        { error: "Device slug is required" },
        { status: 400 }
      )
    }

    // Check if device exists
    const existingDevice = await prisma.device.findUnique({
      where: { slug },
    })

    if (!existingDevice) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      )
    }

    // Update device
    const updatedDevice = await prisma.device.update({
      where: { slug },
      data: {
        ...body,
        updatedAt: new Date(),
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            logo: true,
            website: true,
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
          },
        },
        images: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            url: true,
            alt: true,
            type: true,
          },
        },
        _count: {
          select: {
            reviews: true,
            comparisons: true,
          },
        },
      },
    })

    return NextResponse.json({
      device: updatedDevice,
    })
  } catch (error) {
    console.error("[DEVICE_PUT]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json(
        { error: "Device slug is required" },
        { status: 400 }
      )
    }

    // Check if device exists
    const existingDevice = await prisma.device.findUnique({
      where: { slug },
    })

    if (!existingDevice) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      )
    }

    // Delete device (this will cascade delete related records based on schema)
    await prisma.device.delete({
      where: { slug },
    })

    return NextResponse.json({
      message: "Device deleted successfully",
    })
  } catch (error) {
    console.error("[DEVICE_DELETE]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}