import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

const unifiedContentSchema = z.object({
  type: z.enum(["traditional", "sectioned", "markdown"]),
  content: z.string().optional(),
  sections: z.array(z.object({
    id: z.string(),
    type: z.string(),
    title: z.string(),
    content: z.string(),
    order: z.number(),
    metadata: z.record(z.string(), z.unknown()).optional()
  })).optional(),
  frontmatter: z.record(z.string(), z.unknown()).optional()
})

const createBlogPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required").optional(),
  excerpt: z.string().optional(),
  
  // Unified content model
  contentType: z.enum(["TRADITIONAL", "SECTIONED", "MARKDOWN"]).default("TRADITIONAL"),
  contentData: unifiedContentSchema,
  
  // Legacy support
  content: z.string().optional(),
  sections: z.array(z.object({
    id: z.string(),
    type: z.string(),
    title: z.string(),
    content: z.string(),
    order: z.number()
  })).optional(),
  
  featuredImage: z.string().url().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  blogType: z.enum(["BLOG", "REVIEW", "DESCRIPTION"]).default("BLOG"),
  publishedAt: z.string().datetime().optional(),
  categoryIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  
  // Auto-save support
  isDraft: z.boolean().default(true),
  lastAutoSaved: z.string().datetime().optional()
})

// GET /api/blog - List blog posts with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status") as "DRAFT" | "PUBLISHED" | "ARCHIVED" | null
    const search = searchParams.get("search")
    const category = searchParams.get("category")
    const tag = searchParams.get("tag")
    const author = searchParams.get("author")
    const exclude = searchParams.get("exclude") // For excluding specific blog posts
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") as "asc" | "desc" || "desc"

    const session = await getServerSession(authOptions)
    
    // Build where clause based on permissions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where = {} as any
    
    // Non-authenticated users can only see published posts
    if (!session) {
      where.status = "PUBLISHED"
    } else if (session.user.role?.name !== "ADMIN") {
      // Regular users can see published posts and their own drafts
      where.OR = [
        { status: "PUBLISHED" },
        { 
          status: "DRAFT",
          authorId: session.user.id 
        }
      ]
    }
    // Admins can see all posts (no additional where clause needed)
    
    // Apply status filter if provided
    if (status && session?.user.role?.name === "ADMIN") {
      where.status = status
    }

    // Exclude specific posts (for related posts)
    if (exclude) {
      where.id = {
        not: exclude
      }
    }

    // Apply search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } }
      ]
    }

    // Apply category filter
    if (category) {
      where.categories = {
        some: {
          slug: category
        }
      }
    }

    // Apply tag filter
    if (tag) {
      where.tags = {
        some: {
          slug: tag
        }
      }
    }

    // Apply author filter
    if (author) {
      where.author = {
        username: author
      }
    }

    const skip = (page - 1) * limit

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder
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
          },
          _count: {
            select: {
              comments: true
            }
          }
        }
      }),
      prisma.blogPost.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    // For frontend consumption, return simplified format if no pagination requested
    if (searchParams.get("simple") === "true") {
      interface PostWithSections {
        sections?: string | null;
        views?: number | null;
      }
      
      const simplifiedPosts = posts.map(post => {
        const postWithSections = post as typeof post & PostWithSections;
        return {
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
          tags: post.tags
        };
      });

      return NextResponse.json(simplifiedPosts)
    }

    return NextResponse.json({
      posts,
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
    console.error("Error fetching blog posts:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/blog - Create a new blog post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    console.log("Session data:", JSON.stringify(session, null, 2))
    
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Validate user ID exists
    if (!session.user.id) {
      console.error("Session user ID is missing:", session.user)
      return NextResponse.json(
        { error: "User ID not found in session" },
        { status: 400 }
      )
    }

    // Check if user exists in database
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true }
    })
    
    if (!userExists) {
      console.error("User does not exist in database:", session.user.id)
      console.error("This usually means the session is stale after database reset.")
      console.error("User should sign out and sign in again.")
      return NextResponse.json(
        { 
          error: "User not found in database. Please sign out and sign in again.",
          code: "STALE_SESSION",
          details: "Your session contains a user ID that no longer exists in the database. This can happen after database resets or migrations."
        },
        { status: 401 }
      )
    }
    
    console.log("User found in database:", userExists.email, "Role:", userExists.role.name)

    // Check if user has permission to create blog posts
    const userRole = userExists.role.name
    if (!userRole || !["ADMIN", "EDITOR"].includes(userRole)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const body = await request.json()
    console.log('Received body:', JSON.stringify(body, null, 2))
    
    let validatedData
    try {
      validatedData = createBlogPostSchema.parse(body)
    } catch (error) {
      console.error('Validation error:', error)
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: error instanceof Error ? error.message : "Unknown validation error",
          received: body
        },
        { status: 400 }
      )
    }

    // Generate slug if not provided
    let slug = validatedData.slug
    if (!slug) {
      slug = validatedData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
      
      // Ensure slug is unique
      const existingPost = await prisma.blogPost.findUnique({
        where: { slug }
      })
      
      if (existingPost) {
        slug = `${slug}-${Date.now()}`
      }
    }

    // Generate excerpt if not provided
    let excerpt = validatedData.excerpt
    if (!excerpt) {
      // Extract first 160 characters from content, handling different content types
      let plainText = ""
      
      if (validatedData.contentData.type === "traditional" && validatedData.contentData.content) {
        plainText = validatedData.contentData.content.replace(/<[^>]*>/g, "")
      } else if (validatedData.contentData.type === "sectioned" && validatedData.contentData.sections) {
        plainText = validatedData.contentData.sections
          .map(s => s.content.replace(/<[^>]*>/g, ""))
          .join(" ")
      } else if (validatedData.contentData.type === "markdown" && validatedData.contentData.content) {
        plainText = validatedData.contentData.content.replace(/[#*_`~]/g, "")
      } else if (validatedData.content) {
        // Legacy fallback
        plainText = validatedData.content.replace(/<[^>]*>/g, "")
      }
      
      excerpt = plainText.substring(0, 160) + (plainText.length > 160 ? "..." : "")
    }

    const post = await prisma.blogPost.create({
      data: {
        title: validatedData.title,
        slug,
        excerpt,
        
        // Unified content model
        contentType: validatedData.contentType,
        contentData: validatedData.contentData as object, // Prisma JSON type
        
        // Legacy support for backward compatibility  
        content: validatedData.content || '',
        sections: validatedData.sections as object, // Prisma JSON type
        
        featuredImage: validatedData.featuredImage,
        status: validatedData.status,
        blogType: validatedData.blogType,
        publishedAt: validatedData.publishedAt ? new Date(validatedData.publishedAt) : 
                      validatedData.status === "PUBLISHED" ? new Date() : null,
        
        // Auto-save support
        isDraft: validatedData.isDraft,
        lastAutoSaved: validatedData.lastAutoSaved ? new Date(validatedData.lastAutoSaved) : null,
        
        authorId: session.user.id,
        metaTitle: validatedData.metaTitle,
        metaDescription: validatedData.metaDescription,
        categories: validatedData.categoryIds ? {
          connect: validatedData.categoryIds.map(id => ({ id }))
        } : undefined,
        tags: validatedData.tagIds ? {
          connect: validatedData.tagIds.map(id => ({ id }))
        } : undefined
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

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error creating blog post:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}