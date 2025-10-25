import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const blog = await prisma.blogPost.findUnique({
      where: { slug },
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

    if (!blog) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ blog })
  } catch (error) {
    console.error("[ADMIN_BLOG_GET]", error)
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

    const { slug } = await params
    const body = await request.json()

    const {
      title,
      newSlug,
      excerpt,
      content,
      featuredImage,
      metaTitle,
      metaDescription,
      keywords,
      status,
      publishedAt,
      categoryIds,
      tagIds
    } = body

    // Check if blog exists
    const existingBlog = await prisma.blogPost.findUnique({
      where: { slug }
    })

    if (!existingBlog) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      )
    }

    // If slug is being changed, check if new slug already exists
    if (newSlug && newSlug !== slug) {
      const slugExists = await prisma.blogPost.findUnique({
        where: { slug: newSlug }
      })

      if (slugExists) {
        return NextResponse.json(
          { error: "A blog post with this slug already exists" },
          { status: 400 }
        )
      }
    }

    // Update blog post
    const blog = await prisma.blogPost.update({
      where: { slug },
      data: {
        title,
        slug: newSlug || slug,
        excerpt,
        content,
        featuredImage,
        metaTitle,
        metaDescription,
        keywords: keywords || [],
        status: status || 'DRAFT',
        publishedAt: status === 'PUBLISHED' ? publishedAt || new Date() : null,
        categories: categoryIds ? {
          set: [],
          connect: categoryIds.map((id: string) => ({ id }))
        } : undefined,
        tags: tagIds ? {
          set: [],
          connect: tagIds.map((id: string) => ({ id }))
        } : undefined,
        updatedAt: new Date()
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
      message: "Blog post updated successfully",
      blog
    })
  } catch (error) {
    console.error("[ADMIN_BLOG_PUT]", error)
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

    const { slug } = await params

    // Check if blog exists
    const existingBlog = await prisma.blogPost.findUnique({
      where: { slug }
    })

    if (!existingBlog) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      )
    }

    // Delete blog post
    await prisma.blogPost.delete({
      where: { slug }
    })

    return NextResponse.json({
      message: "Blog post deleted successfully"
    })
  } catch (error) {
    console.error("[ADMIN_BLOG_DELETE]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}