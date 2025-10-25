/**
 * Unified Admin Blog Editor
 * Complete admin interface with Traditional, Sectioned, and Markdown editing modes
 */

'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Eye, Upload, FileText, LayoutGrid, Code2, Loader2 } from 'lucide-react'
import { UnifiedContentData, EditorMode, UnifiedBlogPost } from '@/types/content'
import Image from 'next/image'
import UnifiedBlogEditor from './UnifiedBlogEditor'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface UnifiedAdminBlogEditorProps {
  initialData?: Partial<UnifiedBlogPost>
  mode: 'create' | 'edit'
  slug?: string
}

const defaultBlogData: Partial<UnifiedBlogPost> = {
  title: '',
  slug: '',
  excerpt: '',
  contentType: 'TRADITIONAL',
  contentData: {
    type: 'traditional',
    content: '<p>Start writing your blog post...</p>',
    format: 'html'
  },
  featuredImage: '',
  metaTitle: '',
  metaDescription: '',
  keywords: [],
  status: 'DRAFT',
  isDraft: true,
  categories: [],
  tags: []
}

export default function UnifiedAdminBlogEditor({
  initialData,
  mode,
  slug
}: UnifiedAdminBlogEditorProps) {
  const [blogData, setBlogData] = useState<Partial<UnifiedBlogPost>>(initialData || defaultBlogData)
  const [editorMode, setEditorMode] = useState<EditorMode>('traditional')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const router = useRouter()

  // Initialize editor mode based on content type
  useEffect(() => {
    if (blogData?.contentType) {
      switch (blogData.contentType) {
        case 'TRADITIONAL':
          setEditorMode('traditional')
          break
        case 'SECTIONED':
          setEditorMode('sectioned')
          break
        case 'MARKDOWN':
          setEditorMode('markdown')
          break
      }
    }
  }, [blogData?.contentType])

  // Transform legacy blog data to unified format
  const transformLegacyData = useCallback((blogData: Record<string, unknown> | null): Partial<UnifiedBlogPost> => {
    if (!blogData) return defaultBlogData;
    
    // If it already has contentType and contentData, return as is
    if (blogData.contentType && blogData.contentData) {
      return blogData as Partial<UnifiedBlogPost>;
    }
    
    // Transform legacy format to unified format
    let contentType: 'TRADITIONAL' | 'SECTIONED' | 'MARKDOWN' = 'TRADITIONAL';
    let contentData: UnifiedContentData = {
      type: 'traditional',
      content: (typeof blogData.content === 'string' ? blogData.content : '') || '<p>Start writing your blog post...</p>',
      format: 'html'
    };
    
    // Detect content type based on existing data
    if (blogData.sections && Array.isArray(blogData.sections)) {
      contentType = 'SECTIONED';
      contentData = {
        type: 'sectioned',
        sections: blogData.sections
      };
    } else if (blogData.content && typeof blogData.content === 'string') {
      // Check if content looks like markdown
      if (blogData.content.includes('# ') || blogData.content.includes('## ') || blogData.content.includes('**')) {
        contentType = 'MARKDOWN';
        contentData = {
          type: 'markdown',
          content: blogData.content
        };
      }
    }
    
    return {
      ...blogData,
      contentType,
      contentData,
      categories: Array.isArray(blogData.categories) ? blogData.categories : [],
      tags: Array.isArray(blogData.tags) ? blogData.tags : [],
      keywords: Array.isArray(blogData.keywords) ? blogData.keywords : []
    } as Partial<UnifiedBlogPost>;
  }, []);

  // Fetch blog data function
  const fetchBlogData = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/blogs/${slug}`)
      if (response.ok) {
        const data = await response.json()
        const transformedData = transformLegacyData(data.blog)
        setBlogData(transformedData)
      } else {
        setError('Failed to load blog data')
        setBlogData(defaultBlogData) // Fallback to default data
      }
    } catch (err) {
      console.error('Error fetching blog:', err)
      setError('Failed to load blog data')
      setBlogData(defaultBlogData) // Fallback to default data
    } finally {
      setIsLoading(false)
    }
  }, [slug, transformLegacyData])

  // Fetch existing blog data for edit mode
  useEffect(() => {
    if (mode === 'edit' && slug && !initialData) {
      fetchBlogData()
    }
  }, [mode, slug, initialData, fetchBlogData])

  // Handle blog metadata changes
  const handleMetadataChange = useCallback((field: string, value: string | string[]) => {
    setBlogData(prev => ({
      ...prev,
      [field]: value
    }))

    // Auto-generate slug from title
    if (field === 'title' && typeof value === 'string') {
      setBlogData(prev => {
        if (!prev.slug) {
          const generatedSlug = value
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()
          
          return {
            ...prev,
            slug: generatedSlug
          }
        }
        return prev
      })
    }
  }, [])

  // Handle content changes from unified editor
  const handleContentChange = useCallback((content: UnifiedContentData) => {
    setBlogData(prev => ({
      ...prev,
      contentData: content,
      contentType: content.type === 'traditional' ? 'TRADITIONAL' : 
                   content.type === 'sectioned' ? 'SECTIONED' : 'MARKDOWN'
    }))
  }, [])

  // Handle editor mode changes
  const handleModeChange = useCallback((newMode: EditorMode) => {
    setEditorMode(newMode)
  }, [])

  // Handle save/publish
  const handleSave = useCallback(async (publish = false) => {
    if (!blogData?.title || !blogData?.contentData) {
      setError('Title and content are required')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const payload = {
        ...blogData,
        status: publish ? 'PUBLISHED' : 'DRAFT',
        publishedAt: publish ? new Date().toISOString() : undefined,
        isDraft: !publish
      }

      const url = mode === 'create' ? '/api/blog' : `/api/blog/${slug}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const result = await response.json()
        if (mode === 'create') {
          router.push(`/admin/blog/create?id=${result.blog.id}`)
        } else {
          router.push('/admin/blog')
        }
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to save blog post')
      }
    } catch (err) {
      console.error('Save error:', err)
      setError('Failed to save blog post')
    } finally {
      setIsSaving(false)
    }
  }, [blogData, mode, slug, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading blog editor...</p>
        </div>
      </div>
    )
  }

  // Ensure blogData is never undefined
  if (!blogData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Error: Blog data not available</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b-2 border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {mode === 'create' ? 'Create New Blog Post' : 'Edit Blog Post'}
                </h1>
                {blogData.title && (
                  <p className="text-sm text-gray-600 mt-1">{blogData.title}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge 
                variant={editorMode === 'markdown' ? 'default' : 'secondary'}
                className="text-gray-700 bg-gray-100"
              >
                {editorMode === 'traditional' && <FileText className="h-3 w-3 mr-1" />}
                {editorMode === 'sectioned' && <LayoutGrid className="h-3 w-3 mr-1" />}
                {editorMode === 'markdown' && <Code2 className="h-3 w-3 mr-1" />}
                {editorMode.charAt(0).toUpperCase() + editorMode.slice(1)}
              </Badge>

              {/* Action Buttons */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
                className="text-gray-700 hover:text-gray-900 border-gray-300 hover:border-gray-400"
              >
                <Eye className="h-4 w-4 mr-2" />
                {previewMode ? 'Edit' : 'Preview'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSave(false)}
                disabled={isSaving}
                className="text-gray-700 hover:text-gray-900 border-gray-300 hover:border-gray-400 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Draft'}
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={() => handleSave(true)}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700 disabled:bg-gray-300 disabled:border-gray-300 disabled:text-gray-500"
              >
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Publish
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Editor Section */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm">
              {/* Blog Metadata */}
              <div className="p-6 border-b border-gray-200">
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={blogData.title || ''}
                      onChange={(e) => handleMetadataChange('title', e.target.value)}
                      placeholder="Enter blog post title..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Slug
                    </label>
                    <input
                      type="text"
                      value={blogData.slug || ''}
                      onChange={(e) => handleMetadataChange('slug', e.target.value)}
                      placeholder="url-friendly-slug"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Excerpt */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Excerpt
                    </label>
                    <textarea
                      value={blogData.excerpt || ''}
                      onChange={(e) => handleMetadataChange('excerpt', e.target.value)}
                      placeholder="Brief description of the blog post..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Unified Editor */}
              <div className="p-0">
                <UnifiedBlogEditor
                  blogPost={blogData as UnifiedBlogPost}
                  mode={editorMode}
                  onContentChange={handleContentChange}
                  onModeChange={handleModeChange}
                  onSave={async (post) => {
                    setBlogData(post)
                  }}
                  config={{
                    allowModeSwitch: true,
                    autoSaveInterval: 5000,
                    enableLivePreview: true
                  }}
                  className="border-none shadow-none"
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              
              {/* Featured Image */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Featured Image</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={blogData.featuredImage || ''}
                    onChange={(e) => handleMetadataChange('featuredImage', e.target.value)}
                    placeholder="Image URL..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-gray-700 hover:text-gray-900 border-gray-300 hover:border-gray-400"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image
                  </Button>
                  {blogData.featuredImage && (
                    <div className="mt-3">
                      <Image
                        src={blogData.featuredImage}
                        alt="Featured"
                        width={200}
                        height={128}
                        className="w-full h-32 object-cover rounded-md"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* SEO Settings */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">SEO Settings</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meta Title
                    </label>
                    <input
                      type="text"
                      value={blogData.metaTitle || ''}
                      onChange={(e) => handleMetadataChange('metaTitle', e.target.value)}
                      placeholder="SEO title..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meta Description
                    </label>
                    <textarea
                      value={blogData.metaDescription || ''}
                      onChange={(e) => handleMetadataChange('metaDescription', e.target.value)}
                      placeholder="SEO description..."
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Keywords
                    </label>
                    <input
                      type="text"
                      value={blogData.keywords?.join(', ') || ''}
                      onChange={(e) => handleMetadataChange('keywords', e.target.value.split(',').map(k => k.trim()))}
                      placeholder="keyword1, keyword2, keyword3"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Publishing Options */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Publishing</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={blogData.status || 'DRAFT'}
                      onChange={(e) => handleMetadataChange('status', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Publish Date
                    </label>
                    <input
                      type="datetime-local"
                      value={blogData.publishedAt ? new Date(blogData.publishedAt).toISOString().slice(0, 16) : ''}
                      onChange={(e) => handleMetadataChange('publishedAt', e.target.value ? new Date(e.target.value).toISOString() : '')}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}