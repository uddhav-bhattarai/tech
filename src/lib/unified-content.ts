/**
 * Unified Content Storage System
 * 
 * This system provides a centralized way to manage content across different editors
 * (Markdown, WYSIWYG, Section-based) with version control, audit trails, and validation.
 */

import { z } from "zod"

// Core content types
export enum ContentType {
  TRADITIONAL = "TRADITIONAL", // HTML/Rich text content
  SECTIONED = "SECTIONED",     // Section-based structured content
  MARKDOWN = "MARKDOWN",       // Markdown content
}

// Content node types for unified AST
export enum NodeType {
  DOCUMENT = "document",
  HEADING = "heading",
  PARAGRAPH = "paragraph",
  TEXT = "text",
  BOLD = "bold",
  ITALIC = "italic",
  UNDERLINE = "underline",
  STRIKETHROUGH = "strikethrough",
  CODE = "code",
  CODE_BLOCK = "code_block",
  LINK = "link",
  IMAGE = "image",
  LIST = "list",
  LIST_ITEM = "list_item",
  TABLE = "table",
  TABLE_ROW = "table_row",
  TABLE_CELL = "table_cell",
  BLOCKQUOTE = "blockquote",
  HORIZONTAL_RULE = "horizontal_rule",
  BREAK = "break",
  // Section-based types
  SECTION = "section",
  SECTION_HEADER = "section_header",
  SECTION_CONTENT = "section_content",
  // Content blocks
  CONTENT_BLOCK = "content_block",
  // Custom types
  DEVICE_SPEC_TABLE = "device_spec_table",
  PROS_CONS = "pros_cons",
  RATING = "rating",
  COMPARISON_TABLE = "comparison_table",
}

// Unified content node schema
const baseNodeSchema = z.object({
  type: z.nativeEnum(NodeType),
  id: z.string().optional(),
  attrs: z.record(z.any()).optional(),
  marks: z.array(z.object({
    type: z.string(),
    attrs: z.record(z.any()).optional(),
  })).optional(),
})

// Recursive content node schema (for nested structures)
export const contentNodeSchema: z.ZodType<ContentNode> = baseNodeSchema.extend({
  content: z.lazy(() => z.array(contentNodeSchema).optional()),
  text: z.string().optional(),
})

export interface ContentNode {
  type: NodeType
  id?: string
  attrs?: Record<string, any>
  marks?: Array<{
    type: string
    attrs?: Record<string, any>
  }>
  content?: ContentNode[]
  text?: string
}

// Unified content document schema
export const unifiedContentSchema = z.object({
  version: z.string().default("1.0.0"),
  contentType: z.nativeEnum(ContentType),
  document: contentNodeSchema,
  metadata: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    wordCount: z.number().default(0),
    readingTime: z.number().default(0), // in minutes
    lastModified: z.string().datetime(),
    modifiedBy: z.string(),
    checksum: z.string().optional(),
  }),
  // Section-specific data
  sections: z.array(z.object({
    id: z.string(),
    type: z.string(),
    title: z.string(),
    order: z.number(),
    isRequired: z.boolean().default(false),
    isComplete: z.boolean().default(false),
    templateId: z.string().optional(),
    content: contentNodeSchema.optional(),
  })).optional(),
  // Content blocks used
  contentBlocks: z.array(z.object({
    blockId: z.string(),
    instanceId: z.string(),
    position: z.object({
      sectionId: z.string().optional(),
      nodeId: z.string().optional(),
      offset: z.number().optional(),
    }),
    customData: z.record(z.any()).optional(),
  })).optional(),
})

export interface UnifiedContent extends z.infer<typeof unifiedContentSchema> {}

// Content version for audit trail
export const contentVersionSchema = z.object({
  id: z.string(),
  version: z.string(),
  label: z.string().optional(),
  changeType: z.enum(["major", "minor", "patch", "auto-save"]),
  content: unifiedContentSchema,
  authorId: z.string(),
  createdAt: z.string().datetime(),
  diffSummary: z.object({
    added: z.number().default(0),
    removed: z.number().default(0),
    modified: z.number().default(0),
    sections: z.array(z.string()).optional(),
  }).optional(),
  parentVersionId: z.string().optional(),
})

export interface ContentVersion extends z.infer<typeof contentVersionSchema> {}

// Content transformation utilities
export class ContentTransformer {
  /**
   * Convert Markdown to unified content format
   */
  static fromMarkdown(markdown: string, metadata: any = {}): UnifiedContent {
    // This would use a markdown parser like remark/unified
    // For now, providing the structure
    const document: ContentNode = {
      type: NodeType.DOCUMENT,
      content: [
        {
          type: NodeType.PARAGRAPH,
          content: [
            {
              type: NodeType.TEXT,
              text: markdown, // Simplified - would need actual parsing
            }
          ]
        }
      ]
    }

    return {
      version: "1.0.0",
      contentType: ContentType.MARKDOWN,
      document,
      metadata: {
        wordCount: this.countWords(markdown),
        readingTime: this.calculateReadingTime(markdown),
        lastModified: new Date().toISOString(),
        modifiedBy: metadata.userId || "system",
        ...metadata,
      },
    }
  }

  /**
   * Convert HTML to unified content format
   */
  static fromHTML(html: string, metadata: any = {}): UnifiedContent {
    // This would use an HTML parser like jsdom or cheerio
    // For now, providing the structure
    const document: ContentNode = {
      type: NodeType.DOCUMENT,
      content: [
        {
          type: NodeType.PARAGRAPH,
          content: [
            {
              type: NodeType.TEXT,
              text: html, // Simplified - would need actual parsing
            }
          ]
        }
      ]
    }

    return {
      version: "1.0.0",
      contentType: ContentType.TRADITIONAL,
      document,
      metadata: {
        wordCount: this.countWords(this.htmlToText(html)),
        readingTime: this.calculateReadingTime(this.htmlToText(html)),
        lastModified: new Date().toISOString(),
        modifiedBy: metadata.userId || "system",
        ...metadata,
      },
    }
  }

  /**
   * Convert sectioned content to unified format
   */
  static fromSections(sections: any[], metadata: any = {}): UnifiedContent {
    const document: ContentNode = {
      type: NodeType.DOCUMENT,
      content: sections.map(section => ({
        type: NodeType.SECTION,
        id: section.id,
        attrs: {
          title: section.title,
          type: section.type,
          order: section.order,
        },
        content: [
          {
            type: NodeType.SECTION_HEADER,
            content: [
              {
                type: NodeType.TEXT,
                text: section.title,
              }
            ]
          },
          {
            type: NodeType.SECTION_CONTENT,
            content: section.content || [],
          }
        ]
      }))
    }

    const totalText = sections.map(s => this.extractTextFromNodes(s.content || [])).join(" ")

    return {
      version: "1.0.0",
      contentType: ContentType.SECTIONED,
      document,
      metadata: {
        wordCount: this.countWords(totalText),
        readingTime: this.calculateReadingTime(totalText),
        lastModified: new Date().toISOString(),
        modifiedBy: metadata.userId || "system",
        ...metadata,
      },
      sections: sections.map(section => ({
        id: section.id,
        type: section.type,
        title: section.title,
        order: section.order,
        isRequired: section.isRequired || false,
        isComplete: section.isComplete || false,
        templateId: section.templateId,
        content: section.content,
      })),
    }
  }

  /**
   * Convert unified content to Markdown
   */
  static toMarkdown(content: UnifiedContent): string {
    return this.nodeToMarkdown(content.document)
  }

  /**
   * Convert unified content to HTML
   */
  static toHTML(content: UnifiedContent): string {
    return this.nodeToHTML(content.document)
  }

  /**
   * Convert unified content to sectioned format
   */
  static toSections(content: UnifiedContent): any[] {
    if (content.sections) {
      return content.sections
    }

    // Extract sections from document if not explicitly defined
    const sections: any[] = []
    if (content.document.content) {
      content.document.content.forEach((node, index) => {
        if (node.type === NodeType.SECTION) {
          sections.push({
            id: node.id || `section-${index}`,
            type: node.attrs?.type || "content",
            title: node.attrs?.title || `Section ${index + 1}`,
            order: node.attrs?.order || index,
            content: node.content,
          })
        }
      })
    }

    return sections
  }

  /**
   * Create diff between two content versions
   */
  static createDiff(oldContent: UnifiedContent, newContent: UnifiedContent): any {
    // This would implement a proper diff algorithm
    // For now, providing basic structure
    return {
      added: 0,
      removed: 0,
      modified: 0,
      changes: [],
    }
  }

  /**
   * Validate content structure
   */
  static validateContent(content: any): { isValid: boolean; errors: string[] } {
    try {
      unifiedContentSchema.parse(content)
      return { isValid: true, errors: [] }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`),
        }
      }
      return { isValid: false, errors: ["Unknown validation error"] }
    }
  }

  /**
   * Generate content checksum for integrity verification
   */
  static generateChecksum(content: UnifiedContent): string {
    // This would use a proper hashing algorithm like SHA-256
    // For now, providing a simple implementation
    const contentString = JSON.stringify(content.document)
    return btoa(contentString).slice(0, 32)
  }

  // Helper methods
  private static nodeToMarkdown(node: ContentNode): string {
    // Implement node to markdown conversion
    return ""
  }

  private static nodeToHTML(node: ContentNode): string {
    // Implement node to HTML conversion
    return ""
  }

  private static countWords(text: string): number {
    return text.trim().split(/\s+/).length
  }

  private static calculateReadingTime(text: string): number {
    const wordsPerMinute = 200
    const wordCount = this.countWords(text)
    return Math.ceil(wordCount / wordsPerMinute)
  }

  private static htmlToText(html: string): string {
    // Basic HTML to text conversion - would need proper implementation
    return html.replace(/<[^>]*>/g, "")
  }

  private static extractTextFromNodes(nodes: ContentNode[]): string {
    return nodes.map(node => {
      if (node.text) return node.text
      if (node.content) return this.extractTextFromNodes(node.content)
      return ""
    }).join(" ")
  }
}

// Content operations for database management
export class ContentOperations {
  /**
   * Save content with automatic versioning
   */
  static async saveContent(
    blogPostId: string,
    content: UnifiedContent,
    userId: string,
    changeType: "major" | "minor" | "patch" | "auto-save" = "auto-save",
    label?: string
  ): Promise<{ success: boolean; versionId?: string; error?: string }> {
    try {
      // This would integrate with Prisma to save content
      // For now, providing the structure
      
      // Validate content
      const validation = ContentTransformer.validateContent(content)
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join(", ") }
      }

      // Generate checksum
      const checksum = ContentTransformer.generateChecksum(content)
      content.metadata.checksum = checksum

      // Save to database (pseudo-code)
      // const version = await prisma.contentVersion.create({...})
      
      return { success: true, versionId: "mock-version-id" }
    } catch (error) {
      return { success: false, error: "Failed to save content" }
    }
  }

  /**
   * Load content with version history
   */
  static async loadContent(blogPostId: string, versionId?: string): Promise<{
    success: boolean
    content?: UnifiedContent
    versions?: ContentVersion[]
    error?: string
  }> {
    try {
      // This would load from database
      // For now, providing mock structure
      return { success: true, content: undefined, versions: [] }
    } catch (error) {
      return { success: false, error: "Failed to load content" }
    }
  }

  /**
   * Restore content to specific version
   */
  static async restoreVersion(
    blogPostId: string,
    versionId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // This would restore from database
      return { success: true }
    } catch (error) {
      return { success: false, error: "Failed to restore version" }
    }
  }
}