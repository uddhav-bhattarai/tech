import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    const comparison = await prisma.comparison.findUnique({
      where: { id },
      include: {
        devices: {
          orderBy: { order: "asc" },
          include: {
            device: {
              include: {
                brand: {
                  select: {
                    id: true,
                    name: true,
                    logo: true,
                  },
                },
                images: {
                  select: {
                    url: true,
                    alt: true,
                  },
                  orderBy: { order: "asc" },
                },
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            avatar: true,
          },
        },
      },
    })

    if (!comparison) {
      return NextResponse.json(
        { error: "Comparison not found" },
        { status: 404 }
      )
    }

    // Check if user has access to this comparison
    if (!comparison.isPublic) {
      if (!session || session.user.id !== comparison.userId) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        )
      }
    }

    // Increment view count
    await prisma.comparison.update({
      where: { id },
      data: { views: { increment: 1 } },
    })

    return NextResponse.json({ comparison })
  } catch (error) {
    console.error("Error fetching comparison:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const { id } = await params

    // Check if comparison exists and user owns it
    const comparison = await prisma.comparison.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!comparison) {
      return NextResponse.json(
        { error: "Comparison not found" },
        { status: 404 }
      )
    }

    if (comparison.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    // Delete the comparison (cascade will handle comparisonDevices)
    await prisma.comparison.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting comparison:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}