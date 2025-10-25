import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { 
  ContentTransformer, 
  ContentOperations,
  ContentType,
  unifiedContentSchema 
} from "@/lib/unified-content"

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

// Schema for content save operations
const saveContentSchema = z.object({
  content: unifiedContentSchema,
  changeType: z.enum(["major", "minor", "patch", "auto-save"]).default("auto-save"),
  label: z.string().optional(),
  isDraft: z.boolean().default(true),
})

const transformContentSchema = z.object({
  sourceType: z.enum(["markdown", "html", "sections"]),
  targetType: z.enum(["markdown", "html", "sections", "unified"]),
  content: z.any(), // Raw content in source format
  metadata: z.record(z.any()).optional(),
})

// POST /api/content/transform - Transform content between formats
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { sourceType, targetType, content, metadata = {} } = transformContentSchema.parse(body)

    // Add user context to metadata
    metadata.userId = session.user.id
    metadata.timestamp = new Date().toISOString()

    let unifiedContent
    
    // Convert to unified format first
    switch (sourceType) {
      case "markdown":
        unifiedContent = ContentTransformer.fromMarkdown(content, metadata)
        break
      case "html":
        unifiedContent = ContentTransformer.fromHTML(content, metadata)
        break
      case "sections":
        unifiedContent = ContentTransformer.fromSections(content, metadata)
        break
      default:
        return NextResponse.json(
          { error: "Unsupported source type" },
          { status: 400 }
        )
    }

    // Convert to target format if different from unified
    let result = unifiedContent
    switch (targetType) {
      case "markdown":
        result = ContentTransformer.toMarkdown(unifiedContent)
        break
      case "html":
        result = ContentTransformer.toHTML(unifiedContent)
        break
      case "sections":
        result = ContentTransformer.toSections(unifiedContent)
        break
      case "unified":
        // Already in unified format
        break
      default:
        return NextResponse.json(
          { error: "Unsupported target type" },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      sourceType,
      targetType,
      result,
      metadata: unifiedContent.metadata,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error transforming content:", error)
    return NextResponse.json(
      { error: "Failed to transform content" },
      { status: 500 }
    )
  }
}

// PUT /api/content/validate - Validate content structure
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const content = body.content

    // Validate content structure
    const validation = ContentTransformer.validateContent(content)
    
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        isValid: false,
        errors: validation.errors,
      }, { status: 400 })
    }

    // Generate additional metadata
    const checksum = ContentTransformer.generateChecksum(content)
    
    return NextResponse.json({
      success: true,
      isValid: true,
      checksum,
      metadata: content.metadata,
      stats: {
        wordCount: content.metadata.wordCount,
        readingTime: content.metadata.readingTime,
        sectionsCount: content.sections?.length || 0,
        contentBlocksCount: content.contentBlocks?.length || 0,
      },
    })
  } catch (error) {
    console.error("Error validating content:", error)
    return NextResponse.json(
      { error: "Failed to validate content" },
      { status: 500 }
    )
  }
}

// GET /api/content/[blogPostId] - Get content with versions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ blogPostId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const { blogPostId } = await params
    const { searchParams } = new URL(request.url)
    const versionId = searchParams.get("version")
    const includeVersions = searchParams.get("includeVersions") === "true"
    const format = searchParams.get("format") || "unified" // unified, markdown, html, sections

    // Check if user has permission to view this blog post
    const blogPost = await prisma.blogPost.findUnique({
      where: { id: blogPostId },
      include: { author: true },
    })

    if (!blogPost) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      )
    }

    // Check permissions
    const canView = blogPost.authorId === session.user.id || 
                    await hasPermission(session.user.id, "blog", "read_all")

    if (!canView) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    // Load content
    const result = await ContentOperations.loadContent(blogPostId, versionId || undefined)
    
    if (!result.success || !result.content) {
      return NextResponse.json(
        { error: result.error || "Content not found" },
        { status: 404 }
      )
    }

    let formattedContent = result.content

    // Convert to requested format
    switch (format) {
      case "markdown":
        formattedContent = ContentTransformer.toMarkdown(result.content)
        break
      case "html":
        formattedContent = ContentTransformer.toHTML(result.content)
        break
      case "sections":
        formattedContent = ContentTransformer.toSections(result.content)
        break
      case "unified":
      default:
        // Already in unified format
        break
    }

    return NextResponse.json({
      success: true,
      blogPost: {
        id: blogPost.id,
        title: blogPost.title,
        slug: blogPost.slug,
        contentType: blogPost.contentType,
        author: {
          id: blogPost.author.id,
          name: blogPost.author.name,
          username: blogPost.author.username,
        },
      },
      content: formattedContent,
      format,
      metadata: result.content.metadata,
      ...(includeVersions && { versions: result.versions }),
    })
  } catch (error) {
    console.error("Error loading content:", error)
    return NextResponse.json(
      { error: "Failed to load content" },
      { status: 500 }
    )
  }
}