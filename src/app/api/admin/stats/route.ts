import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if user has admin or editor role
    if (session.user.role?.name !== "ADMIN" && session.user.role?.name !== "EDITOR") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      )
    }

    // Fetch all statistics in parallel
    const [
      deviceStats,
      brandStats,
      userStats,
      blogStats,
      reviewStats,
    ] = await Promise.all([
      // Device statistics
      prisma.device.groupBy({
        by: ["availability"],
        _count: true,
      }),
      
      // Brand statistics
      prisma.brand.count(),
      
      // User statistics
      Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { verified: true } }),
      ]),
      
      // Blog post statistics
      prisma.blogPost.groupBy({
        by: ["status"],
        _count: true,
      }),
      
      // Review statistics
      Promise.all([
        prisma.review.count(),
        prisma.review.count({
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
      ]),
    ])

    // Process device statistics
    const deviceCounts = {
      total: 0,
      published: 0,
      draft: 0,
    }
    
    deviceStats.forEach((stat) => {
      deviceCounts.total += stat._count
      if (stat.availability === "available") {
        deviceCounts.published += stat._count
      } else if (stat.availability === "upcoming") {
        deviceCounts.draft += stat._count
      }
    })

    // Process blog post statistics
    const blogCounts = {
      total: 0,
      published: 0,
      draft: 0,
    }
    
    blogStats.forEach((stat) => {
      blogCounts.total += stat._count
      if (stat.status === "PUBLISHED") {
        blogCounts.published += stat._count
      } else if (stat.status === "DRAFT") {
        blogCounts.draft += stat._count
      }
    })

    // Compile response
    const stats = {
      devices: deviceCounts,
      brands: {
        total: brandStats,
      },
      users: {
        total: userStats[0],
        verified: userStats[1],
      },
      blogPosts: blogCounts,
      reviews: {
        total: reviewStats[0],
        thisMonth: reviewStats[1],
      },
      views: {
        total: 0, // We would implement this with analytics later
        thisMonth: 0,
      },
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("[ADMIN_STATS_GET]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}