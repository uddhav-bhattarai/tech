import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const brandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  slug: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
  website: z.string().url().optional(),
  country: z.string().optional(),
  founded: z.number().optional(),
})

// GET /api/brands - List all brands
export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      include: {
        _count: {
          select: {
            devices: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json({ brands })
  } catch (error) {
    console.error("Error fetching brands:", error)
    return NextResponse.json(
      { error: "Failed to fetch brands" },
      { status: 500 }
    )
  }
}

// POST /api/brands - Create new brand (admin only)
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

    const canCreateBrand = user?.role?.permissions.some(
      (p) => p.resource === "brand" && p.action === "create"
    ) || user?.role?.name === "ADMIN" || user?.role?.name === "SUPER_ADMIN"

    if (!canCreateBrand) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const data = brandSchema.parse(body)

    // Generate slug if not provided
    if (!data.slug) {
      const baseSlug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
      let slug = baseSlug
      let counter = 1
      
      while (await prisma.brand.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`
        counter++
      }
      
      data.slug = slug
    }

    const brand = await prisma.brand.create({
      data: {
        ...data,
        slug: data.slug,
      },
    })

    return NextResponse.json(brand, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error creating brand:", error)
    return NextResponse.json(
      { error: "Failed to create brand" },
      { status: 500 }
    )
  }
}