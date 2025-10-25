import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { 
  ContentTransformer, 
  ContentOperations,
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

const saveContentSchema = z.object({
  content: unifiedContentSchema,
  changeType: z.enum(["major", "minor", "patch", "auto-save"]).default("auto-save"),
  label: z.string().optional(),
  isDraft: z.boolean().default(true),
})

const restoreVersionSchema = z.object({
  versionId: z.string(),
  createBackup: z.boolean().default(true),
})

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

    // For now, use the existing blog post content until full migration
    let unifiedContent

    try {
      // Try to parse existing contentData as unified content
      if (blogPost.contentData && typeof blogPost.contentData === 'object') {
        unifiedContent = blogPost.contentData
      } else {
        // Convert legacy content to unified format
        if (blogPost.contentType === 'MARKDOWN' && blogPost.content) {
          unifiedContent = ContentTransformer.fromMarkdown(blogPost.content, {
            userId: session.user.id,
            title: blogPost.title,
            description: blogPost.excerpt,
          })
        } else if (blogPost.content) {
          unifiedContent = ContentTransformer.fromHTML(blogPost.content, {
            userId: session.user.id,
            title: blogPost.title,
            description: blogPost.excerpt,
          })
        } else {
          // Create empty content
          unifiedContent = {
            version: "1.0.0",
            contentType: blogPost.contentType as any,
            document: {
              type: "document" as any,
              content: [],
            },
            metadata: {
              wordCount: 0,
              readingTime: 0,
              lastModified: new Date().toISOString(),
              modifiedBy: session.user.id,
            },
          }
        }
      }
    } catch (error) {
      console.error("Error processing content:", error)
      return NextResponse.json(
        { error: "Failed to process content" },
        { status: 500 }
      )
    }

    // Convert to requested format
    let formattedContent = unifiedContent
    switch (format) {
      case "markdown":
        formattedContent = ContentTransformer.toMarkdown(unifiedContent)
        break
      case "html":
        formattedContent = ContentTransformer.toHTML(unifiedContent)
        break
      case "sections":
        formattedContent = ContentTransformer.toSections(unifiedContent)
        break
      case "unified":
      default:
        // Already in unified format
        break
    }

    // Get version history if requested
    let versions = []
    if (includeVersions) {
      versions = await prisma.contentVersion.findMany({
        where: { blogPostId },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      blogPost: {
        id: blogPost.id,
        title: blogPost.title,
        slug: blogPost.slug,
        contentType: blogPost.contentType,
        status: blogPost.status,
        isDraft: blogPost.isDraft,
        author: {
          id: blogPost.author.id,
          name: blogPost.author.name,
          username: blogPost.author.username,
        },
      },
      content: formattedContent,
      format,
      metadata: unifiedContent.metadata,
      versions,
    })
  } catch (error) {
    console.error("Error loading content:", error)
    return NextResponse.json(
      { error: "Failed to load content" },
      { status: 500 }
    )
  }
}

// PUT /api/content/[blogPostId] - Save content with versioning
export async function PUT(
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
    const body = await request.json()
    const { content, changeType, label, isDraft } = saveContentSchema.parse(body)

    // Check if user has permission to edit this blog post
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
    const canEdit = blogPost.authorId === session.user.id || 
                    await hasPermission(session.user.id, "blog", "update_all")

    if (!canEdit) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    // Validate content
    const validation = ContentTransformer.validateContent(content)
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        errors: validation.errors,
      }, { status: 400 })
    }

    // Update metadata
    content.metadata.lastModified = new Date().toISOString()
    content.metadata.modifiedBy = session.user.id
    content.metadata.checksum = ContentTransformer.generateChecksum(content)

    // Save with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create content version for audit trail
      let versionId = null
      if (changeType !== "auto-save") {
        const version = await tx.contentVersion.create({
          data: {
            blogPostId,
            version: `${Date.now()}`, // Simple versioning - could use semantic versioning
            label: label || `${changeType} update`,
            changeType,
            contentData: content as any,
            authorId: session.user.id,
          },
        })
        versionId = version.id
      }

      // Update blog post with new content
      const updatedPost = await tx.blogPost.update({
        where: { id: blogPostId },
        data: {
          contentData: content as any,
          contentType: content.contentType as any,
          isDraft,
          lastAutoSaved: new Date(),
          // Update cached formats
          cachedMarkdown: ContentTransformer.toMarkdown(content),
          cachedHtml: ContentTransformer.toHTML(content),
          // Update metadata
          ...(content.metadata.title && { title: content.metadata.title }),
          ...(content.metadata.description && { excerpt: content.metadata.description }),
        },
      })

      return { updatedPost, versionId }
    })

    return NextResponse.json({
      success: true,
      message: "Content saved successfully",
      blogPost: result.updatedPost,
      versionId: result.versionId,
      metadata: content.metadata,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error saving content:", error)
    return NextResponse.json(
      { error: "Failed to save content" },
      { status: 500 }
    )
  }
}

// POST /api/content/[blogPostId] - Restore version or perform content operations
export async function POST(
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
    const body = await request.json()
    const { operation } = body

    // Check if user has permission to edit this blog post
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
    const canEdit = blogPost.authorId === session.user.id || 
                    await hasPermission(session.user.id, "blog", "update_all")

    if (!canEdit) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    switch (operation) {
      case "restore_version":
        const { versionId, createBackup } = restoreVersionSchema.parse(body)
        
        // Get the version to restore
        const version = await prisma.contentVersion.findUnique({
          where: { id: versionId, blogPostId },
        })

        if (!version) {
          return NextResponse.json(
            { error: "Version not found" },
            { status: 404 }
          )
        }

        const result = await prisma.$transaction(async (tx) => {
          // Create backup of current version if requested
          let backupId = null
          if (createBackup) {
            const backup = await tx.contentVersion.create({
              data: {
                blogPostId,
                version: `backup-${Date.now()}`,
                label: "Auto-backup before restore",
                changeType: "auto-save",
                contentData: blogPost.contentData as any,
                authorId: session.user.id,
              },
            })
            backupId = backup.id
          }

          // Restore the content
          const updatedPost = await tx.blogPost.update({
            where: { id: blogPostId },
            data: {
              contentData: version.contentData,
              lastAutoSaved: new Date(),
              // Update cached formats
              cachedMarkdown: ContentTransformer.toMarkdown(version.contentData as any),
              cachedHtml: ContentTransformer.toHTML(version.contentData as any),
            },
          })

          return { updatedPost, backupId }
        })

        return NextResponse.json({
          success: true,
          message: "Version restored successfully",
          restoredVersionId: versionId,
          backupVersionId: result.backupId,
        })

      case "create_checkpoint":
        // Create a manual checkpoint version
        const { label: checkpointLabel } = body
        
        const checkpoint = await prisma.contentVersion.create({
          data: {
            blogPostId,
            version: `checkpoint-${Date.now()}`,
            label: checkpointLabel || "Manual checkpoint",
            changeType: "major",
            contentData: blogPost.contentData as any,
            authorId: session.user.id,
          },
        })

        return NextResponse.json({
          success: true,
          message: "Checkpoint created successfully",
          checkpointId: checkpoint.id,
        })

      default:
        return NextResponse.json(
          { error: "Invalid operation" },
          { status: 400 }
        )
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error performing content operation:", error)
    return NextResponse.json(
      { error: "Failed to perform operation" },
      { status: 500 }
    )
  }
}