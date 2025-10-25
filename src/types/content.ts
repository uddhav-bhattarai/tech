/**
 * Unified Content Model Types
 * Single source of truth for blog content representation
 */

// Content types supported by the unified model
export type ContentType = 'TRADITIONAL' | 'SECTIONED' | 'MARKDOWN'

// Blog types for classification
export type BlogType = 'BLOG' | 'REVIEW' | 'DESCRIPTION'

// Editor modes available to users
export type EditorMode = 'traditional' | 'sectioned' | 'markdown'

// Base content node interface
export interface ContentNode {
  id: string
  type: string
  content?: string
  attributes?: Record<string, unknown>
  children?: ContentNode[]
}

// Traditional rich text content structure
export interface TraditionalContent {
  type: 'traditional'
  content: string // HTML or rich text
  format: 'html' | 'richtext'
}

// Section-based content structure
export interface SectionContent {
  type: 'sectioned'
  sections: BlogSection[]
}

export interface BlogSection {
  id: string
  type: 'introduction' | 'overview' | 'design' | 'display' | 'performance' | 
        'camera' | 'battery' | 'software' | 'connectivity' | 'audio' | 
        'security' | 'comparison' | 'pros-cons' | 'verdict' | 'specifications' | 
        'pricing' | 'highlights' | 'accessories' | 'custom'
  title: string
  content: string // Rich text/HTML content
  order: number
  metadata?: {
    icon?: string
    color?: string
    collapsible?: boolean
    [key: string]: unknown
  }
}

// Markdown content structure
export interface MarkdownContent {
  type: 'markdown'
  content: string // Raw markdown
  frontmatter?: Record<string, unknown>
}

// Unified content data type (stored in database)
export type UnifiedContentData = TraditionalContent | SectionContent | MarkdownContent

// Content transformation interfaces
export interface ContentTransformer {
  fromTraditional(content: TraditionalContent): UnifiedContentData
  fromSectioned(content: SectionContent): UnifiedContentData
  fromMarkdown(content: MarkdownContent): UnifiedContentData
  toTraditional(data: UnifiedContentData): TraditionalContent
  toSectioned(data: UnifiedContentData): SectionContent
  toMarkdown(data: UnifiedContentData): MarkdownContent
}

// Auto-save and draft management
export interface DraftState {
  id: string
  contentData: UnifiedContentData
  lastSaved: Date
  isDirty: boolean
  editorMode: EditorMode
}

// Editor state management
export interface EditorState {
  mode: EditorMode
  content: UnifiedContentData
  draft: DraftState | null
  isLoading: boolean
  isSaving: boolean
  canSwitchMode: boolean
  history: {
    canUndo: boolean
    canRedo: boolean
  }
}

// Editor configuration
export interface EditorConfig {
  allowModeSwitch: boolean
  autoSaveInterval: number
  enableHistory: boolean
  maxHistorySize: number
  enableLivePreview: boolean
}

// Export formats
export type ExportFormat = 'markdown' | 'html' | 'docx' | 'pdf'

export interface ExportOptions {
  format: ExportFormat
  includeMetadata: boolean
  includeToc: boolean
  styling?: 'default' | 'minimal' | 'professional'
}

// Blog post with unified content
export interface UnifiedBlogPost {
  id: string
  title: string
  slug: string
  excerpt?: string
  contentType: ContentType
  contentData: UnifiedContentData
  
  // Cached formats for performance
  cachedMarkdown?: string
  cachedHtml?: string
  
  // Metadata
  featuredImage?: string
  metaTitle?: string
  metaDescription?: string
  keywords: string[]
  
  // Publishing
  status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED'
  publishedAt?: Date
  scheduledAt?: Date
  isDraft: boolean
  lastAutoSaved?: Date
  
  // Author and organization
  authorId: string
  categories: Array<{ id: string; name: string; slug: string }>
  tags: Array<{ id: string; name: string; slug: string }>
  
  // Engagement
  views: number
  likes: number
  shares: number
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
}

// API response types
export interface BlogPostResponse {
  blogPost: UnifiedBlogPost
  rendered?: {
    html?: string
    markdown?: string
    sections?: BlogSection[]
  }
}

export interface BlogPostListResponse {
  blogPosts: UnifiedBlogPost[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
}

// Editor component props
export interface UnifiedEditorProps {
  blogPost?: UnifiedBlogPost
  mode?: EditorMode
  config?: Partial<EditorConfig>
  onSave?: (blogPost: UnifiedBlogPost) => Promise<void>
  onModeChange?: (mode: EditorMode) => void
  onContentChange?: (content: UnifiedContentData) => void
  className?: string
}

// Validation schemas
export interface ContentValidation {
  isValid: boolean
  errors: Array<{
    field: string
    message: string
    type: 'required' | 'format' | 'length' | 'custom'
  }>
  warnings: Array<{
    field: string
    message: string
    type: 'performance' | 'seo' | 'accessibility' | 'content'
  }>
}

// Performance monitoring
export interface EditorMetrics {
  loadTime: number
  renderTime: number
  switchTime: number
  saveTime: number
  wordCount: number
  characterCount: number
  sectionCount?: number
}