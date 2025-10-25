/**
 * Unified Blog Editor Component
 * Seamless switching between Traditional, Sectioned, and Markdown editing modes
 */

'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { contentTransformer } from '@/lib/contentTransformer'
import { 
  UnifiedContentData, 
  EditorMode, 
  EditorState, 
  EditorConfig,
  UnifiedBlogPost,
  UnifiedEditorProps,
  ContentType
} from '@/types/content'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { DocumentTextIcon, Squares2X2Icon, CodeBracketIcon } from '@heroicons/react/24/outline'
import TraditionalEditor from './editors/TraditionalEditor'
import SectionedEditor from './editors/SectionedEditor'
import MarkdownEditor from './editors/MarkdownEditor'
import AutoSaveIndicator from './AutoSaveIndicator'
import ExportModal from './ExportModal'

const DEFAULT_CONFIG: EditorConfig = {
  allowModeSwitch: true,
  autoSaveInterval: 3000, // 3 seconds
  enableHistory: true,
  maxHistorySize: 100,
  enableLivePreview: true
}

export default function UnifiedBlogEditor({
  blogPost,
  mode: initialMode = 'traditional',
  config = {},
  onSave,
  onModeChange,
  onContentChange,
  className = ''
}: UnifiedEditorProps) {
  const editorConfig = { ...DEFAULT_CONFIG, ...config }
  const [editorState, setEditorState] = useState<EditorState>({
    mode: initialMode,
    content: blogPost?.contentData || {
      type: 'traditional',
      content: '',
      format: 'html'
    },
    draft: null,
    isLoading: false,
    isSaving: false,
    canSwitchMode: true,
    history: {
      canUndo: false,
      canRedo: false
    }
  })

  const [showExportModal, setShowExportModal] = useState(false)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const debouncedContent = useDebounce(editorState.content, 500)

  // Initialize content based on blog post
  useEffect(() => {
    if (blogPost) {
      setEditorState(prev => ({
        ...prev,
        content: blogPost.contentData,
        mode: getEditorModeFromContentType(blogPost.contentType)
      }))
    }
  }, [blogPost])

  // Handle content updates
  const handleContentUpdate = useCallback((newContent: UnifiedContentData) => {
    setEditorState(prev => ({
      ...prev,
      content: newContent,
      draft: {
        id: blogPost?.id || 'new-post',
        contentData: newContent,
        lastSaved: new Date(),
        isDirty: true,
        editorMode: prev.mode
      }
    }))

    onContentChange?.(newContent)
  }, [blogPost?.id, onContentChange])

  // Auto-save functionality
  const handleAutoSave = useCallback(async () => {
    if (!editorState.draft?.isDirty || editorState.isSaving) {
      return
    }

    setEditorState(prev => ({ ...prev, isSaving: true }))

    try {
      // Create auto-save draft
      const draftData: Partial<UnifiedBlogPost> = {
        id: blogPost?.id || 'new-post',
        contentType: getContentTypeFromMode(editorState.mode) as ContentType,
        contentData: editorState.content,
        isDraft: true,
        lastAutoSaved: new Date(),
        ...blogPost
      }

      // Auto-save to server
      if (onSave) {
        await onSave(draftData as UnifiedBlogPost)
      }

      setEditorState(prev => ({
        ...prev,
        isSaving: false,
        draft: prev.draft ? { ...prev.draft, isDirty: false, lastSaved: new Date() } : null
      }))
    } catch (error) {
      console.error('Auto-save failed:', error)
      setEditorState(prev => ({ ...prev, isSaving: false }))
    }
  }, [editorState.content, editorState.draft, editorState.isSaving, editorState.mode, blogPost, onSave])

  // Auto-save functionality
  useEffect(() => {
    if (debouncedContent && editorConfig.autoSaveInterval > 0) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }

      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave()
      }, editorConfig.autoSaveInterval)
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [debouncedContent, editorConfig.autoSaveInterval, handleAutoSave])

  // Handle mode switching
  const handleModeChange = useCallback(async (newMode: EditorMode) => {
    if (!editorConfig.allowModeSwitch || editorState.isSaving) {
      return
    }

    setEditorState(prev => ({ ...prev, isLoading: true, canSwitchMode: false }))

    try {
      // Transform content to new mode format
      const transformedContent = transformContentForMode(editorState.content, newMode)
      
      setEditorState(prev => ({
        ...prev,
        mode: newMode,
        content: transformedContent,
        isLoading: false,
        canSwitchMode: true
      }))

      onModeChange?.(newMode)
    } catch (error) {
      console.error('Failed to switch mode:', error)
      setEditorState(prev => ({ ...prev, isLoading: false, canSwitchMode: true }))
    }
  }, [editorState.content, editorState.isSaving, editorConfig.allowModeSwitch, onModeChange])

  // Manual save
  const handleSave = useCallback(async () => {
    if (editorState.isSaving) return

    setEditorState(prev => ({ ...prev, isSaving: true }))

    try {
      const postData: Partial<UnifiedBlogPost> = {
        id: blogPost?.id || 'new-post',
        contentType: getContentTypeFromMode(editorState.mode) as ContentType,
        contentData: editorState.content,
        isDraft: false,
        lastAutoSaved: new Date(),
        ...blogPost
      }

      if (onSave) {
        await onSave(postData as UnifiedBlogPost)
      }

      setEditorState(prev => ({
        ...prev,
        isSaving: false,
        draft: null
      }))
    } catch (error) {
      console.error('Save failed:', error)
      setEditorState(prev => ({ ...prev, isSaving: false }))
    }
  }, [editorState.content, editorState.isSaving, editorState.mode, blogPost, onSave])

  // Render appropriate editor
  const renderEditor = () => {
    const commonProps = {
      content: editorState.content,
      onChange: handleContentUpdate,
      isLoading: editorState.isLoading,
      className: 'min-h-[400px]'
    }

    switch (editorState.mode) {
      case 'traditional':
        return <TraditionalEditor {...commonProps} />
      case 'sectioned':
        return <SectionedEditor {...commonProps} />
      case 'markdown':
        return <MarkdownEditor {...commonProps} enableLivePreview={editorConfig.enableLivePreview} />
      default:
        return <div>Unsupported editor mode</div>
    }
  }

  return (
    <div className={`unified-blog-editor bg-white rounded-lg border shadow-sm ${className}`}>
      {/* Editor Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-4">
          {/* Mode Switcher */}
          <Tabs value={editorState.mode} onValueChange={(value) => handleModeChange(value as EditorMode)} className="w-auto">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger 
                value="traditional" 
                disabled={!editorState.canSwitchMode}
                className="flex items-center gap-2"
              >
                <DocumentTextIcon className="h-4 w-4" />
                Traditional
              </TabsTrigger>
              <TabsTrigger 
                value="sectioned"
                disabled={!editorState.canSwitchMode}
                className="flex items-center gap-2"
              >
                <Squares2X2Icon className="h-4 w-4" />
                Sectioned
              </TabsTrigger>
              <TabsTrigger 
                value="markdown"
                disabled={!editorState.canSwitchMode}
                className="flex items-center gap-2"
              >
                <CodeBracketIcon className="h-4 w-4" />
                Markdown
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Status Indicators */}
          <div className="flex items-center gap-2">
            <AutoSaveIndicator 
              isSaving={editorState.isSaving}
              lastSaved={editorState.draft?.lastSaved}
              isDirty={editorState.draft?.isDirty}
            />
            <Badge variant={editorState.mode === 'markdown' ? 'default' : 'secondary'}>
              {editorState.mode.charAt(0).toUpperCase() + editorState.mode.slice(1)} Mode
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExportModal(true)}
            disabled={editorState.isLoading}
          >
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoSave}
            disabled={editorState.isSaving || !editorState.draft?.isDirty}
          >
            Save Draft
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={editorState.isSaving}
          >
            {editorState.isSaving ? 'Saving...' : 'Publish'}
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="p-4">
        {renderEditor()}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          content={editorState.content}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  )
}

// Helper functions
function getEditorModeFromContentType(contentType: string): EditorMode {
  switch (contentType) {
    case 'TRADITIONAL': return 'traditional'
    case 'SECTIONED': return 'sectioned'
    case 'MARKDOWN': return 'markdown'
    default: return 'traditional'
  }
}

function getContentTypeFromMode(mode: EditorMode): string {
  switch (mode) {
    case 'traditional': return 'TRADITIONAL'
    case 'sectioned': return 'SECTIONED'
    case 'markdown': return 'MARKDOWN'
    default: return 'TRADITIONAL'
  }
}

function transformContentForMode(content: UnifiedContentData, targetMode: EditorMode): UnifiedContentData {
  switch (targetMode) {
    case 'traditional':
      return contentTransformer.toTraditional(content)
    case 'sectioned':
      return contentTransformer.toSectioned(content)
    case 'markdown':
      return contentTransformer.toMarkdown(content)
    default:
      return content
  }
}
