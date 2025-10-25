import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Basic stats for all users
    const [
      totalDevices,
      totalBlogPosts,
      publishedBlogs,
      totalComparisons,
      totalReviews
    ] = await Promise.all([
      prisma.device.count(),
      prisma.blogPost.count(),
      prisma.blogPost.count({ where: { status: "PUBLISHED" } }),
      prisma.comparison.count(),
      prisma.review.count()
    ])

    // User-specific stats
    const userStats = await Promise.all([
      prisma.blogPost.count({ 
        where: { authorId: session.user.id } 
      }),
      prisma.review.count({ 
        where: { userId: session.user.id } 
      }),
      prisma.comparison.count({ 
        where: { userId: session.user.id } 
      })
    ])

    // Recent activity (last 5 items user can see)
    const recentActivity = []

    // Recent blog posts
    const recentBlogs = await prisma.blogPost.findMany({
      where: session.user.role?.name === "ADMIN" 
        ? {} 
        : { 
            OR: [
              { status: "PUBLISHED" },
              { authorId: session.user.id }
            ]
          },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        author: {
          select: { name: true, username: true }
        }
      }
    })

    recentActivity.push(
      ...recentBlogs.map(blog => ({
        type: "blog",
        title: blog.title,
        status: blog.status as string,
        author: blog.author.name || blog.author.username || "Unknown",
        createdAt: blog.createdAt,
        link: `/blog/${blog.id}`
      }))
    )

    // Recent reviews
    const recentReviews = await prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 2,
      select: {
        id: true,
        title: true,
        rating: true,
        createdAt: true,
        device: {
          select: { name: true, slug: true }
        },
        user: {
          select: { name: true, username: true }
        }
      }
    })

    recentActivity.push(
      ...recentReviews.map(review => ({
        type: "review",
        title: review.title || `Review for ${review.device.name}`,
        rating: review.rating,
        device: review.device.name,
        author: review.user.name || review.user.username || "Unknown",
        createdAt: review.createdAt,
        link: `/devices/${review.device.slug}#reviews`
      }))
    )

    // Sort recent activity by date
    recentActivity.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const stats: {
      overview: {
        totalDevices: number;
        totalBlogPosts: number;
        publishedBlogs: number;
        totalComparisons: number;
        totalReviews: number;
      };
      userStats: {
        myBlogs: number;
        myReviews: number;
        myComparisons: number;
      };
      recentActivity: Array<{
        type: string;
        title: string;
        status?: string;
        rating?: number;
        device?: string;
        author: string;
        createdAt: Date;
        link: string;
      }>;
      adminStats?: {
        totalUsers: number;
        verifiedUsers: number;
        draftBlogs: number;
        pendingReviews: number;
      };
    } = {
      overview: {
        totalDevices,
        totalBlogPosts,
        publishedBlogs,
        totalComparisons,
        totalReviews
      },
      userStats: {
        myBlogs: userStats[0],
        myReviews: userStats[1],
        myComparisons: userStats[2]
      },
      recentActivity: recentActivity.slice(0, 5)
    }

    // Admin-only stats
    if (session.user.role?.name === "ADMIN") {
      const [
        totalUsers,
        verifiedUsers,
        draftBlogs,
        pendingReviews
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { verified: true } }),
        prisma.blogPost.count({ where: { status: "DRAFT" } }),
        prisma.review.count({ 
          where: { 
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          }
        })
      ])

      stats.adminStats = {
        totalUsers,
        verifiedUsers,
        draftBlogs,
        pendingReviews
      }
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}