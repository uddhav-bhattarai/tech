/**
 * Markdown Editor with Live Preview
 * Real-time markdown editing with syntax highlighting and preview
 */

'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { marked } from 'marked'
import { UnifiedContentData, MarkdownContent } from '@/types/content'
import { Button } from '@/components/ui/Button'
import { EyeIcon, EyeSlashIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface MarkdownEditorProps {
  content: UnifiedContentData
  onChange: (content: UnifiedContentData) => void
  isLoading?: boolean
  enableLivePreview?: boolean
  className?: string
}

export default function MarkdownEditor({
  content,
  onChange,
  isLoading = false,
  enableLivePreview = true,
  className = ''
}: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(enableLivePreview)
  const [isEditing, setIsEditing] = useState(true)

  // Get markdown content from unified content
  const getMarkdownContent = useCallback((): string => {
    if (content.type === 'markdown') {
      return content.content
    }
    
    // Convert other types to markdown (simplified)
    if (content.type === 'traditional') {
      // Would need proper HTML-to-markdown conversion
      return content.content
    }
    
    if (content.type === 'sectioned') {
      return content.sections
        .sort((a, b) => a.order - b.order)
        .map(section => `## ${section.title}\n\n${section.content}\n`)
        .join('\n')
    }
    
    return ''
  }, [content])

  const markdownContent = getMarkdownContent()

  // Generate HTML preview from markdown
  const htmlPreview = useMemo(() => {
    try {
      return marked(markdownContent)
    } catch (error) {
      console.error('Markdown parsing error:', error)
      return '<p>Error parsing markdown</p>'
    }
  }, [markdownContent])

  // Handle markdown content changes
  const handleContentChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMarkdown = event.target.value
    const updatedContent: MarkdownContent = {
      type: 'markdown',
      content: newMarkdown
    }
    onChange(updatedContent)
  }, [onChange])

  // Toggle preview mode
  const togglePreview = useCallback(() => {
    setShowPreview(prev => !prev)
  }, [])

  // Toggle editing mode
  const toggleEditing = useCallback(() => {
    setIsEditing(prev => !prev)
  }, [])

  // Calculate stats
  const stats = useMemo(() => {
    const words = markdownContent.trim().split(/\s+/).length
    const characters = markdownContent.length
    const lines = markdownContent.split('\n').length
    const headings = (markdownContent.match(/^#{1,6}\s/gm) || []).length
    
    return { words, characters, lines, headings }
  }, [markdownContent])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50 rounded-md">
        <div className="text-gray-500">Loading markdown editor...</div>
      </div>
    )
  }

  return (
    <div className={cn('markdown-editor bg-white rounded-lg border', className)}>
      {/* Editor Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <DocumentTextIcon className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Markdown Editor</span>
        </div>
        
        <div className="flex items-center gap-2">
          {enableLivePreview && (
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePreview}
              title={showPreview ? 'Hide Preview' : 'Show Preview'}
            >
              {showPreview ? (
                <EyeSlashIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleEditing}
            title={isEditing ? 'Preview Only' : 'Edit Mode'}
          >
            {isEditing ? 'Preview' : 'Edit'}
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex h-96">
        {/* Markdown Input */}
        {isEditing && (
          <div className={cn('flex-1 flex flex-col', showPreview ? 'border-r' : '')}>
            <div className="flex-1 relative">
              <textarea
                value={markdownContent}
                onChange={handleContentChange}
                placeholder="Write your markdown content here..."
                className="w-full h-full p-4 font-mono text-sm resize-none border-none outline-none focus:ring-0"
                spellCheck={false}
              />
            </div>
            
            {/* Editor Footer */}
            <div className="flex justify-between items-center p-2 bg-gray-50 text-xs text-gray-500 border-t">
              <span>
                {stats.words} words • {stats.characters} characters • {stats.lines} lines
              </span>
              <span>
                {stats.headings} headings • Markdown format
              </span>
            </div>
          </div>
        )}

        {/* Live Preview */}
        {showPreview && (
          <div className={cn('flex-1 flex flex-col', isEditing ? 'max-w-1/2' : '')}>
            <div className="flex-1 overflow-y-auto p-4">
              <div 
                className="prose prose-slate max-w-none"
                dangerouslySetInnerHTML={{ __html: htmlPreview }}
              />
            </div>
            
            {/* Preview Footer */}
            <div className="flex justify-between items-center p-2 bg-gray-50 text-xs text-gray-500 border-t">
              <span>Live Preview</span>
              <span>Rendered from markdown</span>
            </div>
          </div>
        )}
      </div>

      {/* Markdown Shortcuts Help */}
      <div className="p-3 bg-gray-50 border-t">
        <div className="text-xs text-gray-600">
          <strong>Quick shortcuts:</strong> 
          <span className="ml-2">
            **bold** • *italic* • `code` • [link](url) • ![image](url) • ## heading • - list item
          </span>
        </div>
      </div>
    </div>
  )
}