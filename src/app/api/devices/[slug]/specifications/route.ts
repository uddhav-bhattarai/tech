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

const specificationSchema = z.object({
  category: z.string().min(1, "Category is required"),
  name: z.string().min(1, "Name is required"),
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

const specificationUpdateSchema = specificationSchema.partial()

// GET /api/devices/[slug]/specifications - Get device specifications
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const grouping = searchParams.get("grouping")
    const verified = searchParams.get("verified")

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
      ...(category && { category }),
      ...(grouping && { grouping }),
      ...(verified !== null && { isVerified: verified === "true" }),
    }

    const specifications = await prisma.deviceSpecification.findMany({
      where,
      orderBy: [
        { category: "asc" },
        { order: "asc" },
        { name: "asc" },
      ],
    })

    // Group specifications by category
    const groupedSpecs = specifications.reduce((acc, spec) => {
      if (!acc[spec.category]) {
        acc[spec.category] = []
      }
      acc[spec.category].push(spec)
      return acc
    }, {} as Record<string, typeof specifications>)

    return NextResponse.json({
      device: {
        id: device.id,
        name: device.name,
        model: device.model,
      },
      specifications: groupedSpecs,
      total: specifications.length,
    })
  } catch (error) {
    console.error("Error fetching specifications:", error)
    return NextResponse.json(
      { error: "Failed to fetch specifications" },
      { status: 500 }
    )
  }
}

// POST /api/devices/[slug]/specifications - Add device specification
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

    // Support both single specification and array of specifications
    const specs = Array.isArray(body) ? body : [body]
    const validatedSpecs = specs.map(spec => specificationSchema.parse(spec))

    const createdSpecs = await prisma.deviceSpecification.createMany({
      data: validatedSpecs.map(spec => ({
        deviceId: device.id,
        ...spec,
      })),
    })

    // Fetch created specifications with full details
    const specifications = await prisma.deviceSpecification.findMany({
      where: {
        deviceId: device.id,
        category: { in: validatedSpecs.map(s => s.category) },
        name: { in: validatedSpecs.map(s => s.name) },
      },
      orderBy: [
        { category: "asc" },
        { order: "asc" },
        { name: "asc" },
      ],
    })

    return NextResponse.json({
      message: `Created ${createdSpecs.count} specifications`,
      specifications,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error creating specifications:", error)
    return NextResponse.json(
      { error: "Failed to create specifications" },
      { status: 500 }
    )
  }
}

// PUT /api/devices/[slug]/specifications - Update device specifications
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
    const { operation, specifications, specificationId, ...updateData } = body

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
        // Replace all specifications
        const validatedSpecs = specifications.map((spec: any) => specificationSchema.parse(spec))
        
        await prisma.$transaction(async (tx) => {
          // Delete existing
          await tx.deviceSpecification.deleteMany({
            where: { deviceId: device.id },
          })
          
          // Create new
          await tx.deviceSpecification.createMany({
            data: validatedSpecs.map((spec: any) => ({
              deviceId: device.id,
              ...spec,
            })),
          })
        })

        const newSpecs = await prisma.deviceSpecification.findMany({
          where: { deviceId: device.id },
          orderBy: [
            { category: "asc" },
            { order: "asc" },
            { name: "asc" },
          ],
        })

        return NextResponse.json({
          message: `Replaced all specifications with ${validatedSpecs.length} new specs`,
          specifications: newSpecs,
        })

      case "update_single":
        // Update single specification
        if (!specificationId) {
          return NextResponse.json(
            { error: "Specification ID required for update_single operation" },
            { status: 400 }
          )
        }

        const validatedUpdate = specificationUpdateSchema.parse(updateData)
        
        const updatedSpec = await prisma.deviceSpecification.update({
          where: { 
            id: specificationId,
            deviceId: device.id,
          },
          data: validatedUpdate,
        })

        return NextResponse.json({
          message: "Specification updated successfully",
          specification: updatedSpec,
        })

      case "bulk_update":
        // Bulk update by category or other criteria
        const { where: updateWhere, data: bulkUpdateData } = body
        const validatedBulkUpdate = specificationUpdateSchema.parse(bulkUpdateData)
        
        const bulkUpdate = await prisma.deviceSpecification.updateMany({
          where: {
            deviceId: device.id,
            ...updateWhere,
          },
          data: validatedBulkUpdate,
        })

        return NextResponse.json({
          message: `Updated ${bulkUpdate.count} specifications`,
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

    console.error("Error updating specifications:", error)
    return NextResponse.json(
      { error: "Failed to update specifications" },
      { status: 500 }
    )
  }
}

// DELETE /api/devices/[slug]/specifications - Delete device specifications
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
    const specificationId = searchParams.get("id")
    const category = searchParams.get("category")
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
      // Delete all specifications for the device
      const deleted = await prisma.deviceSpecification.deleteMany({
        where: { deviceId: device.id },
      })

      return NextResponse.json({
        message: `Deleted all ${deleted.count} specifications`,
        count: deleted.count,
      })
    } else if (specificationId) {
      // Delete specific specification
      await prisma.deviceSpecification.delete({
        where: { 
          id: specificationId,
          deviceId: device.id,
        },
      })

      return NextResponse.json({
        message: "Specification deleted successfully",
        specificationId,
      })
    } else if (category) {
      // Delete all specifications in a category
      const deleted = await prisma.deviceSpecification.deleteMany({
        where: { 
          deviceId: device.id,
          category,
        },
      })

      return NextResponse.json({
        message: `Deleted ${deleted.count} specifications in category "${category}"`,
        count: deleted.count,
        category,
      })
    } else {
      return NextResponse.json(
        { error: "Must specify either 'id', 'category', or 'all=true' parameter" },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Error deleting specifications:", error)
    return NextResponse.json(
      { error: "Failed to delete specifications" },
      { status: 500 }
    )
  }
}