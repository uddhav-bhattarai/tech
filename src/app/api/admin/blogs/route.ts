import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PostStatus } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true }
    })

    if (!user || user.role?.name !== 'ADMIN') {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: {
      status?: PostStatus;
      OR?: Array<{
        title?: { contains: string; mode: 'insensitive' };
        slug?: { contains: string; mode: 'insensitive' };
      }>;
    } = {}
    
    if (status && status !== 'all') {
      where.status = status.toUpperCase() as PostStatus
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } }
      ]
    }

    const blogs = await prisma.blogPost.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        categories: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            comments: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    const totalBlogs = await prisma.blogPost.count({ where })

    return NextResponse.json({
      blogs,
      pagination: {
        page,
        limit,
        total: totalBlogs,
        pages: Math.ceil(totalBlogs / limit)
      }
    })
  } catch (error) {
    console.error("[ADMIN_BLOGS_GET]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true }
    })

    if (!user || user.role?.name !== 'ADMIN') {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      title,
      slug,
      excerpt,
      content,
      sections,
      featuredImage,
      metaTitle,
      metaDescription,
      keywords,
      status,
      publishedAt,
      categoryIds,
      tagIds
    } = body

    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: "Title, slug, and content are required" },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existingBlog = await prisma.blogPost.findUnique({
      where: { slug }
    })

    if (existingBlog) {
      return NextResponse.json(
        { error: "A blog post with this slug already exists" },
        { status: 400 }
      )
    }

    // Create blog post
    const blog = await prisma.blogPost.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        ...(sections && { sections }),
        featuredImage,
        metaTitle,
        metaDescription,
        keywords: keywords || [],
        status: status || 'DRAFT',
        publishedAt: status === 'PUBLISHED' ? publishedAt || new Date() : null,
        authorId: session.user.id,
        categories: categoryIds ? {
          connect: categoryIds.map((id: string) => ({ id }))
        } : undefined,
        tags: tagIds ? {
          connect: tagIds.map((id: string) => ({ id }))
        } : undefined
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        categories: true,
        tags: true
      }
    })

    return NextResponse.json({
      message: "Blog post created successfully",
      blog
    })
  } catch (error) {
    console.error("[ADMIN_BLOGS_POST]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}