import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

const updateBlogPostSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").optional(),
  slug: z.string().min(3, "Slug must be at least 3 characters").optional(),
  excerpt: z.string().min(10, "Excerpt must be at least 10 characters").optional(),
  content: z.string().min(50, "Content must be at least 50 characters").optional(),
  featuredImage: z.string().url().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  publishedAt: z.string().datetime().optional().nullable(),
  categoryIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
})

// GET /api/blog/[slug] - Get a single blog post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json(
        { error: "Blog post slug is required" },
        { status: 400 }
      )
    }

    const session = await getServerSession(authOptions)
    
    const post = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true
          }
        },
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true
          }
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        comments: {
          where: {
            parentId: null // Only get root comments
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
            replies: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                    avatar: true
                  }
                }
              },
              orderBy: {
                createdAt: "asc"
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          },
          take: 20 // Limit initial comments load
        },
        _count: {
          select: {
            comments: true
          }
        }
      }
    })

    if (!post) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      )
    }

    // Check if user has permission to view this post
    if (post.status !== "PUBLISHED") {
      if (!session) {
        return NextResponse.json(
          { error: "Blog post not found" },
          { status: 404 }
        )
      }

      // Only allow author or admin to view unpublished posts
      const userRole = session.user.role?.name
      if (post.authorId !== session.user.id && userRole !== "ADMIN") {
        return NextResponse.json(
          { error: "Blog post not found" },
          { status: 404 }
        )
      }
    }

    // Update view count (consider implementing proper analytics later)
    if (post.status === "PUBLISHED") {
      await prisma.blogPost.update({
        where: { id: post.id },
        data: {
          views: {
            increment: 1
          }
        }
      })
    }

    // Format response for frontend consumption
    interface PostWithSections {
      sections?: string | null;
      views?: number | null;
    }
    
    const postWithSections = post as typeof post & PostWithSections;
    const formattedPost = {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      sections: postWithSections.sections ? JSON.parse(postWithSections.sections) : null,
      featuredImage: post.featuredImage,
      author: {
        name: post.author.name || post.author.username || "Unknown Author",
        avatar: post.author.avatar
      },
      publishedAt: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
      views: postWithSections.views || 0,
      categories: post.categories,
      tags: post.tags,
      comments: post.comments,
      _count: post._count
    };

    return NextResponse.json(formattedPost)
  } catch (error) {
    console.error("Error fetching blog post:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT /api/blog/[slug] - Update a blog post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    if (!slug) {
      return NextResponse.json(
        { error: "Blog post slug is required" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updateBlogPostSchema.parse(body)

    // Check if post exists and user has permission
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        author: true
      }
    })

    if (!existingPost) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      )
    }

    // Check permissions
    const userRole = session.user.role?.name
    const isAuthor = existingPost.authorId === session.user.id
    const canEdit = isAuthor || userRole === "ADMIN"

    if (!canEdit) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    // If slug is being changed, ensure it's unique
    if (validatedData.slug && validatedData.slug !== existingPost.slug) {
      const slugExists = await prisma.blogPost.findUnique({
        where: { slug: validatedData.slug }
      })
      
      if (slugExists) {
        return NextResponse.json(
          { error: "Slug already exists" },
          { status: 409 }
        )
      }
    }

    // Handle status change logic
    const updateData = { ...validatedData }
    
    // If status is changing to PUBLISHED and no publishedAt date, set it now
    if (validatedData.status === "PUBLISHED" && !existingPost.publishedAt) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (updateData as any).publishedAt = new Date()
    }
    
    // If publishedAt is provided as a string, convert to Date
    if (validatedData.publishedAt) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (updateData as any).publishedAt = new Date(validatedData.publishedAt)
    }

    // Handle category and tag connections
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const connectData = {} as any
    
    if (validatedData.categoryIds) {
      connectData.categories = {
        set: [], // Clear existing
        connect: validatedData.categoryIds.map(id => ({ id }))
      }
      delete updateData.categoryIds
    }
    
    if (validatedData.tagIds) {
      connectData.tags = {
        set: [], // Clear existing
        connect: validatedData.tagIds.map(id => ({ id }))
      }
      delete updateData.tagIds
    }

    const updatedPost = await prisma.blogPost.update({
      where: { slug },
      data: {
        ...updateData,
        ...connectData,
        updatedAt: new Date()
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true
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
        }
      }
    })

    return NextResponse.json(updatedPost)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error updating blog post:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/blog/[slug] - Delete a blog post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    if (!slug) {
      return NextResponse.json(
        { error: "Blog post slug is required" },
        { status: 400 }
      )
    }

    // Check if post exists and user has permission
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        author: true
      }
    })

    if (!existingPost) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      )
    }

    // Check permissions
    const userRole = session.user.role?.name
    const isAuthor = existingPost.authorId === session.user.id
    const canDelete = isAuthor || userRole === "ADMIN"

    if (!canDelete) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    // Delete the blog post (this will cascade delete comments due to schema)
    await prisma.blogPost.delete({
      where: { slug }
    })

    return NextResponse.json(
      { message: "Blog post deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting blog post:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}