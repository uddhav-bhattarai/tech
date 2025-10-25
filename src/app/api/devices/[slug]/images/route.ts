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

const imageSchema = z.object({
  url: z.string().url("Valid URL is required"),
  alt: z.string().optional(),
  type: z.string().optional(), // front, back, side, angle, etc.
  order: z.number().default(0),
})

const imageUpdateSchema = imageSchema.partial()

const imageBulkSchema = z.object({
  images: z.array(imageSchema),
  operation: z.enum(["replace", "append"]).default("append"),
})

// GET /api/devices/[slug]/images - Get device images
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const limit = parseInt(searchParams.get("limit") || "50")

    const device = await prisma.device.findUnique({
      where: { slug, isActive: true },
      select: { id: true, name: true, model: true },
    })

    if (!device) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      )
    }

    const where = {
      deviceId: device.id,
      ...(type && { type }),
    }

    const images = await prisma.deviceImage.findMany({
      where,
      orderBy: { order: "asc" },
      take: limit,
    })

    // Group images by type
    const groupedImages = images.reduce((acc, img) => {
      const imgType = img.type || "general"
      if (!acc[imgType]) {
        acc[imgType] = []
      }
      acc[imgType].push(img)
      return acc
    }, {} as Record<string, typeof images>)

    return NextResponse.json({
      device: {
        id: device.id,
        name: device.name,
        model: device.model,
      },
      images: groupedImages,
      total: images.length,
    })
  } catch (error) {
    console.error("Error fetching images:", error)
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    )
  }
}

// POST /api/devices/[slug]/images - Add device images
export async function POST(
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

    const device = await prisma.device.findUnique({
      where: { slug, isActive: true },
      select: { id: true },
    })

    if (!device) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      )
    }

    // Support both single image and array of images
    const images = Array.isArray(body) ? body : [body]
    const validatedImages = images.map(img => imageSchema.parse(img))

    // Auto-assign order if not provided
    const maxOrder = await prisma.deviceImage.findFirst({
      where: { deviceId: device.id },
      orderBy: { order: "desc" },
      select: { order: true },
    })

    let nextOrder = (maxOrder?.order || 0) + 1

    const imagesWithOrder = validatedImages.map(img => ({
      ...img,
      order: img.order || nextOrder++,
    }))

    const createdImages = await prisma.deviceImage.createMany({
      data: imagesWithOrder.map(img => ({
        deviceId: device.id,
        ...img,
      })),
    })

    // Fetch created images
    const images_result = await prisma.deviceImage.findMany({
      where: {
        deviceId: device.id,
        url: { in: validatedImages.map(img => img.url) },
      },
      orderBy: { order: "asc" },
    })

    return NextResponse.json({
      message: `Created ${createdImages.count} images`,
      images: images_result,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error creating images:", error)
    return NextResponse.json(
      { error: "Failed to create images" },
      { status: 500 }
    )
  }
}

// PUT /api/devices/[slug]/images - Update device images
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
    const { operation, images, imageId, ...updateData } = body

    const device = await prisma.device.findUnique({
      where: { slug, isActive: true },
      select: { id: true },
    })

    if (!device) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      )
    }

    switch (operation) {
      case "replace_all":
        // Replace all images
        const bulkData = imageBulkSchema.parse({ images, operation: "replace" })
        
        await prisma.$transaction(async (tx) => {
          // Delete existing images
          await tx.deviceImage.deleteMany({
            where: { deviceId: device.id },
          })
          
          // Create new images
          await tx.deviceImage.createMany({
            data: bulkData.images.map((img, index) => ({
              deviceId: device.id,
              ...img,
              order: img.order || index,
            })),
          })
        })

        const newImages = await prisma.deviceImage.findMany({
          where: { deviceId: device.id },
          orderBy: { order: "asc" },
        })

        return NextResponse.json({
          message: `Replaced all images with ${bulkData.images.length} new images`,
          images: newImages,
        })

      case "update_single":
        // Update single image
        if (!imageId) {
          return NextResponse.json(
            { error: "Image ID required for update_single operation" },
            { status: 400 }
          )
        }

        const validatedUpdate = imageUpdateSchema.parse(updateData)
        
        const updatedImage = await prisma.deviceImage.update({
          where: { 
            id: imageId,
            deviceId: device.id,
          },
          data: validatedUpdate,
        })

        return NextResponse.json({
          message: "Image updated successfully",
          image: updatedImage,
        })

      case "reorder":
        // Reorder images
        const { imageOrders } = body // Array of { id, order }
        
        await prisma.$transaction(async (tx) => {
          for (const { id, order } of imageOrders) {
            await tx.deviceImage.update({
              where: { id, deviceId: device.id },
              data: { order },
            })
          }
        })

        const reorderedImages = await prisma.deviceImage.findMany({
          where: { deviceId: device.id },
          orderBy: { order: "asc" },
        })

        return NextResponse.json({
          message: `Reordered ${imageOrders.length} images`,
          images: reorderedImages,
        })

      case "bulk_update_by_type":
        // Bulk update by image type
        const { imageType, data: bulkUpdateData } = body
        const validatedBulkUpdate = imageUpdateSchema.parse(bulkUpdateData)
        
        const bulkUpdate = await prisma.deviceImage.updateMany({
          where: {
            deviceId: device.id,
            type: imageType,
          },
          data: validatedBulkUpdate,
        })

        return NextResponse.json({
          message: `Updated ${bulkUpdate.count} images of type "${imageType}"`,
          count: bulkUpdate.count,
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

    console.error("Error updating images:", error)
    return NextResponse.json(
      { error: "Failed to update images" },
      { status: 500 }
    )
  }
}

// DELETE /api/devices/[slug]/images - Delete device images
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
    if (!await hasPermission(session.user.id, "device", "update")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get("id")
    const imageType = searchParams.get("type")
    const deleteAll = searchParams.get("all") === "true"

    const device = await prisma.device.findUnique({
      where: { slug, isActive: true },
      select: { id: true },
    })

    if (!device) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      )
    }

    if (deleteAll) {
      // Delete all images for the device
      const deleted = await prisma.deviceImage.deleteMany({
        where: { deviceId: device.id },
      })

      return NextResponse.json({
        message: `Deleted all ${deleted.count} images`,
        count: deleted.count,
      })
    } else if (imageId) {
      // Delete specific image
      await prisma.deviceImage.delete({
        where: { 
          id: imageId,
          deviceId: device.id,
        },
      })

      return NextResponse.json({
        message: "Image deleted successfully",
        imageId,
      })
    } else if (imageType) {
      // Delete all images of a specific type
      const deleted = await prisma.deviceImage.deleteMany({
        where: { 
          deviceId: device.id,
          type: imageType,
        },
      })

      return NextResponse.json({
        message: `Deleted ${deleted.count} images of type "${imageType}"`,
        count: deleted.count,
        type: imageType,
      })
    } else {
      return NextResponse.json(
        { error: "Must specify either 'id', 'type', or 'all=true' parameter" },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Error deleting images:", error)
    return NextResponse.json(
      { error: "Failed to delete images" },
      { status: 500 }
    )
  }
}