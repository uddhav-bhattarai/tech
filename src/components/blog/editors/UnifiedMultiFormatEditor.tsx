/**
 * Unified Multi-Format Editor
 * Seamlessly switch between Markdown, WYSIWYG, and Section-based editors
 * with real-time synchronization and collaboration features
 */

'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { UnifiedContent, ContentTransformer } from '@/lib/unified-content'
import { useSyncEngine, EditorType, FormatSwitcher } from '@/lib/sync-engine'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

// Import all editor components
import EnterpriseMarkdownEditor from './EnterpriseMarkdownEditor'
import EnterpriseWYSIWYGEditor from './EnterpriseWYSIWYGEditor'
import EnterpriseSectionEditor from './EnterpriseSectionEditor'

import {
  DocumentTextIcon,
  PencilSquareIcon,
  Squares2X2Icon,
  ArrowPathIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserGroupIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

interface UnifiedEditorProps {
  content: UnifiedContent
  onChange: (content: UnifiedContent) => void
  onSave?: (content: UnifiedContent, saveType: 'auto' | 'manual') => Promise<void>
  isLoading?: boolean
  userId?: string
  sessionId?: string
  websocketUrl?: string
  enableAutoSave?: boolean
  enableCollaboration?: boolean
  enablePreview?: boolean
  readOnly?: boolean
  theme?: 'light' | 'dark'
  className?: string
  defaultEditor?: EditorType
}

interface EditorTab {
  id: EditorType
  name: string
  icon: React.ReactNode
  description: string
}

const EDITOR_TABS: EditorTab[] = [
  {
    id: 'markdown',
    name: 'Markdown',
    icon: <DocumentTextIcon className="h-5 w-5" />,
    description: 'Raw markdown with syntax highlighting and live preview'
  },
  {
    id: 'wysiwyg',
    name: 'Rich Text',
    icon: <PencilSquareIcon className="h-5 w-5" />,
    description: 'Word-like editor with visual formatting'
  },
  {
    id: 'section',
    name: 'Sections',
    icon: <Squares2X2Icon className="h-5 w-5" />,
    description: 'Template-driven structured content editor'
  }
]

export default function UnifiedMultiFormatEditor({
  content: initialContent,
  onChange,
  onSave,
  isLoading = false,
  userId = 'anonymous',
  sessionId = 'default',
  websocketUrl = 'ws://localhost:3001',
  enableAutoSave = true,
  enableCollaboration = false,
  enablePreview = true,
  readOnly = false,
  theme = 'light',
  className = '',
  defaultEditor = 'markdown'
}: UnifiedEditorProps) {
  const [activeEditor, setActiveEditor] = useState<EditorType>(defaultEditor)
  const [showPreview, setShowPreview] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  
  // Sync engine configuration
  const syncConfig = useMemo(() => ({
    websocketUrl,
    sessionId,
    userId,
    userName: 'User', // Would come from auth context
    userEmail: 'user@example.com', // Would come from auth context
    enableCollaboration,
    enableCursors: enableCollaboration,
    enablePresence: enableCollaboration
  }), [websocketUrl, sessionId, userId, enableCollaboration])

  // Initialize sync engine
  const {
    status: syncStatus,
    collaborators,
    syncedContent,
    hasConflicts,
    sendContentChange,
    sendFormatSwitch,
    resolveConflict
  } = useSyncEngine(syncConfig, initialContent)

  // Handle format switching with transformation
  const handleEditorSwitch = useCallback(async (newEditor: EditorType) => {
    if (newEditor === activeEditor || readOnly) return
    
    setIsTransitioning(true)
    
    try {
      // Transform content for the target editor format
      const transformedContent = FormatSwitcher.switchTo(
        syncedContent,
        newEditor,
        activeEditor
      )
      
      // Send format switch to collaborators
      sendFormatSwitch(newEditor, transformedContent)
      
      // Update local state
      setActiveEditor(newEditor)
      onChange(transformedContent)
      
    } catch (error) {
      console.error('Failed to switch editor format:', error)
    } finally {
      setIsTransitioning(false)
    }
  }, [activeEditor, syncedContent, sendFormatSwitch, onChange, readOnly])

  // Handle content changes from any editor
  const handleContentChange = useCallback((newContent: UnifiedContent) => {
    onChange(newContent)
    sendContentChange(newContent, activeEditor)
  }, [onChange, sendContentChange, activeEditor])

  // Handle conflict resolution
  const handleConflictResolve = useCallback((resolution: 'local' | 'remote' | 'merged') => {
    let resolvedContent: UnifiedContent
    
    switch (resolution) {
      case 'local':
        resolvedContent = syncedContent
        break
      case 'remote':
        // In a real implementation, we'd have the remote content
        resolvedContent = syncedContent
        break
      case 'merged':
        // In a real implementation, we'd merge the content
        resolvedContent = {
          ...syncedContent,
          metadata: {
            ...syncedContent.metadata,
            lastModified: new Date().toISOString()
          }
        }
        break
      default:
        resolvedContent = syncedContent
    }
    
    resolveConflict(resolvedContent)
    onChange(resolvedContent)
  }, [syncedContent, resolveConflict, onChange])

  // Sync status indicator
  const getSyncStatusInfo = useCallback(() => {
    switch (syncStatus) {
      case 'connected':
        return { 
          icon: <CheckCircleIcon className="h-4 w-4 text-green-500" />,
          text: 'Connected',
          color: 'text-green-600'
        }
      case 'connecting':
        return {
          icon: <ArrowPathIcon className="h-4 w-4 text-yellow-500 animate-spin" />,
          text: 'Connecting...',
          color: 'text-yellow-600'
        }
      case 'disconnected':
        return {
          icon: <ExclamationTriangleIcon className="h-4 w-4 text-gray-400" />,
          text: 'Offline',
          color: 'text-gray-600'
        }
      case 'error':
        return {
          icon: <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />,
          text: 'Error',
          color: 'text-red-600'
        }
      default:
        return {
          icon: <ExclamationTriangleIcon className="h-4 w-4 text-gray-400" />,
          text: 'Unknown',
          color: 'text-gray-600'
        }
    }
  }, [syncStatus])

  // Render the current editor
  const renderActiveEditor = useCallback(() => {
    const editorProps = {
      content: syncedContent,
      onChange: handleContentChange,
      onSave,
      isLoading,
      enableAutoSave,
      userId,
      readOnly,
      theme,
      className: 'h-full'
    }

    if (isTransitioning) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center space-x-3">
            <ArrowPathIcon className="h-6 w-6 animate-spin text-blue-500" />
            <span className="text-gray-600">Switching editor format...</span>
          </div>
        </div>
      )
    }

    switch (activeEditor) {
      case 'markdown':
        return <EnterpriseMarkdownEditor {...editorProps} />
      case 'wysiwyg':
        return <EnterpriseWYSIWYGEditor {...editorProps} />
      case 'section':
        return <EnterpriseSectionEditor {...editorProps} />
      default:
        return <EnterpriseMarkdownEditor {...editorProps} />
    }
  }, [
    activeEditor,
    syncedContent,
    handleContentChange,
    onSave,
    isLoading,
    enableAutoSave,
    userId,
    readOnly,
    theme,
    isTransitioning
  ])

  // Render preview mode
  const renderPreview = useCallback(() => {
    const htmlContent = ContentTransformer.toHTML(syncedContent)
    
    return (
      <div className="bg-white p-8 prose prose-lg max-w-none">
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
      </div>
    )
  }, [syncedContent])

  const statusInfo = getSyncStatusInfo()

  return (
    <div className={cn('unified-multi-format-editor', className, theme === 'dark' && 'dark')}>
      {/* Header with tabs and status */}
      <div className="border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-1">
            {/* Editor Tabs */}
            {EDITOR_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleEditorSwitch(tab.id)}
                disabled={readOnly || isTransitioning}
                className={cn(
                  'flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  activeEditor === tab.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
                  (readOnly || isTransitioning) && 'opacity-50 cursor-not-allowed'
                )}
                title={tab.description}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
            
            {/* Preview Toggle */}
            {enablePreview && (
              <div className="ml-4 border-l pl-4">
                <Button
                  variant={showPreview ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <EyeIcon className="h-4 w-4" />
                  {showPreview ? 'Edit' : 'Preview'}
                </Button>
              </div>
            )}
          </div>
          
          {/* Status and Collaboration Info */}
          <div className="flex items-center space-x-4">
            {/* Collaboration Status */}
            {enableCollaboration && (
              <div className="flex items-center space-x-2">
                <UserGroupIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {collaborators.length} collaborator{collaborators.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            
            {/* Sync Status */}
            <div className={cn('flex items-center space-x-2', statusInfo.color)}>
              {statusInfo.icon}
              <span className="text-sm">{statusInfo.text}</span>
            </div>
            
            {/* Save Status */}
            {onSave && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSave(syncedContent, 'manual')}
                disabled={readOnly}
              >
                <CloudArrowUpIcon className="h-4 w-4" />
                Save
              </Button>
            )}
          </div>
        </div>
        
        {/* Conflict Resolution Bar */}
        {hasConflicts && (
          <div className="bg-yellow-50 border-t border-yellow-200 px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  Conflicting changes detected from another collaborator
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleConflictResolve('local')}
                >
                  Keep Mine
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleConflictResolve('remote')}
                >
                  Use Theirs
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleConflictResolve('merged')}
                >
                  Merge
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Editor Content */}
      <div className="flex-1 overflow-hidden">
        {showPreview ? renderPreview() : renderActiveEditor()}
      </div>
    </div>
  )
}