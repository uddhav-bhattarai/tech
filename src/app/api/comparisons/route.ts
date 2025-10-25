import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

const createComparisonSchema = z.object({
  name: z.string().min(3, "Comparison name must be at least 3 characters"),
  description: z.string().optional(),
  deviceIds: z.array(z.string()).min(2, "At least 2 devices are required").max(5, "Maximum 5 devices allowed"),
  isPublic: z.boolean().default(false),
})

// GET /api/comparisons - List comparisons with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search")
    const isPublic = searchParams.get("public")
    const userId = searchParams.get("userId")
    
    const session = await getServerSession(authOptions)
    
    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}
    
    // Non-authenticated users can only see public comparisons
    if (!session) {
      where.isPublic = true
    } else if (session.user.role?.name !== "ADMIN") {
      // Regular users can see public comparisons and their own
      where.OR = [
        { isPublic: true },
        { userId: session.user.id }
      ]
    }
    // Admins can see all comparisons
    
    // Apply filters
    if (isPublic === "true") {
      where.isPublic = true
    } else if (isPublic === "false" && session) {
      where.isPublic = false
    }
    
    if (userId && (session?.user.id === userId || session?.user.role?.name === "ADMIN")) {
      where.userId = userId
    }
    
    if (search) {
      where.OR = [
        ...(where.OR || []),
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ]
    }

    const skip = (page - 1) * limit

    const [comparisons, total] = await Promise.all([
      prisma.comparison.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc"
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true
            }
          },
          devices: {
            include: {
              device: {
                include: {
                  brand: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                      logo: true
                    }
                  },
                  images: {
                    where: {
                      type: "main"
                    },
                    take: 1,
                    select: {
                      url: true,
                      alt: true
                    }
                  }
                }
              }
            },
            orderBy: {
              order: "asc"
            }
          }
        }
      }),
      prisma.comparison.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    return NextResponse.json({
      comparisons,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev
      }
    })
  } catch (error) {
    console.error("Error fetching comparisons:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/comparisons - Create a new comparison
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createComparisonSchema.parse(body)

    // Verify all devices exist
    const devices = await prisma.device.findMany({
      where: {
        id: {
          in: validatedData.deviceIds
        }
      },
      select: {
        id: true,
        name: true
      }
    })

    if (devices.length !== validatedData.deviceIds.length) {
      return NextResponse.json(
        { error: "One or more devices not found" },
        { status: 400 }
      )
    }

    // Create comparison with devices
    const comparison = await prisma.comparison.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        userId: session.user.id,
        isPublic: validatedData.isPublic,
        devices: {
          create: validatedData.deviceIds.map((deviceId, index) => ({
            deviceId,
            order: index + 1
          }))
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true
          }
        },
        devices: {
          include: {
            device: {
              include: {
                brand: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    logo: true
                  }
                },
                images: {
                  where: {
                    type: "main"
                  },
                  take: 1,
                  select: {
                    url: true,
                    alt: true
                  }
                }
              }
            }
          },
          orderBy: {
            order: "asc"
          }
        }
      }
    })

    return NextResponse.json(comparison, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error creating comparison:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}