/**
 * Enterprise WYSIWYG Rich Text Editor
 * Word-like editor with advanced formatting, drag-and-drop, tables,
 * and real-time collaboration capabilities
 */

'use client'

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Editor } from '@tinymce/tinymce-react'
import { debounce } from 'lodash-es'
import { UnifiedContent, ContentTransformer } from '@/lib/unified-content'
import { Button } from '@/components/ui/Button'
import { 
  CloudArrowUpIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ClockIcon,
  UserGroupIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface WYSIWYGEditorProps {
  content: UnifiedContent
  onChange: (content: UnifiedContent) => void
  onSave?: (content: UnifiedContent, saveType: 'auto' | 'manual') => Promise<void>
  isLoading?: boolean
  enableAutoSave?: boolean
  enableCollaboration?: boolean
  className?: string
  userId?: string
  readOnly?: boolean
  theme?: 'light' | 'dark'
}

interface EditorStats {
  wordCount: number
  characterCount: number
  readingTime: number
  lastSaved: Date | null
  unsavedChanges: boolean
}

interface CustomPlugin {
  name: string
  url?: string
  init?: (editor: Editor) => void
}

interface Collaborator {
  id: string
  name: string
  email: string
  cursor?: { line: number; column: number }
  color: string
}

interface TinyMCEEditor {
  insertContent: (content: string) => void
  ui: {
    registry: {
      addButton: (name: string, config: {
        text: string
        tooltip: string
        onAction: () => void
      }) => void
    }
  }
  dom: {
    addStyle: (css: string) => void
  }
  addShortcut: (shortcut: string, description: string, callback: () => void) => void
}

interface FilePickerCallback {
  (url: string, meta?: { alt?: string; title?: string }): void
}

interface FilePickerMeta {
  filetype: 'image' | 'media' | 'file'
}

const CUSTOM_PLUGINS: CustomPlugin[] = [
  {
    name: 'device-specs',
    init: (editor) => {
      editor.ui.registry.addButton('devicespecs', {
        text: 'Device Specs',
        tooltip: 'Insert device specifications table',
        onAction: () => {
          editor.insertContent(`
            <table class="device-specs-table">
              <thead>
                <tr>
                  <th>Specification</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Display</td>
                  <td>[Enter display specs]</td>
                </tr>
                <tr>
                  <td>Processor</td>
                  <td>[Enter processor specs]</td>
                </tr>
                <tr>
                  <td>Memory</td>
                  <td>[Enter memory specs]</td>
                </tr>
              </tbody>
            </table>
          `)
        }
      })
    }
  },
  {
    name: 'pros-cons',
    init: (editor) => {
      editor.ui.registry.addButton('proscons', {
        text: 'Pros & Cons',
        tooltip: 'Insert pros and cons section',
        onAction: () => {
          editor.insertContent(`
            <div class="pros-cons-container">
              <div class="pros-section">
                <h3 style="color: #059669;">Pros</h3>
                <ul>
                  <li>Add positive point here</li>
                  <li>Add another positive point</li>
                </ul>
              </div>
              <div class="cons-section">
                <h3 style="color: #DC2626;">Cons</h3>
                <ul>
                  <li>Add negative point here</li>
                  <li>Add another negative point</li>
                </ul>
              </div>
            </div>
          `)
        }
      })
    }
  },
  {
    name: 'rating',
    init: (editor) => {
      editor.ui.registry.addButton('rating', {
        text: 'Rating',
        tooltip: 'Insert rating widget',
        onAction: () => {
          editor.insertContent(`
            <div class="rating-widget">
              <div class="rating-category">
                <span class="rating-label">Overall Rating:</span>
                <div class="rating-stars">
                  <span>★★★★☆</span>
                  <span class="rating-score">4.0/5</span>
                </div>
              </div>
              <div class="rating-category">
                <span class="rating-label">Design:</span>
                <div class="rating-stars">
                  <span>★★★★★</span>
                  <span class="rating-score">5.0/5</span>
                </div>
              </div>
              <div class="rating-category">
                <span class="rating-label">Performance:</span>
                <div class="rating-stars">
                  <span>★★★★☆</span>
                  <span class="rating-score">4.0/5</span>
                </div>
              </div>
            </div>
          `)
        }
      })
    }
  }
]

export default function EnterpriseWYSIWYGEditor({
  content,
  onChange,
  onSave,
  isLoading = false,
  enableAutoSave = true,
  enableCollaboration = false,
  className = '',
  userId,
  readOnly = false,
  theme = 'light'
}: WYSIWYGEditorProps) {
  const [stats, setStats] = useState<EditorStats>({
    wordCount: 0,
    characterCount: 0,
    readingTime: 0,
    lastSaved: null,
    unsavedChanges: false,
  })
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [collaborators] = useState<Collaborator[]>([])
  
  const editorRef = useRef<TinyMCEEditor | null>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Get HTML content from unified content
  const htmlContent = useMemo(() => {
    return ContentTransformer.toHTML(content)
  }, [content])

  // Calculate stats from editor content
  const calculateStats = useCallback((htmlText: string) => {
    // Strip HTML tags to get plain text
    const textContent = htmlText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    const words = textContent.split(' ').filter(word => word.length > 0)
    const wordsPerMinute = 200
    
    setStats(prev => ({
      ...prev,
      wordCount: words.length,
      characterCount: textContent.length,
      readingTime: Math.ceil(words.length / wordsPerMinute),
      unsavedChanges: true,
    }))
  }, [])

  // Debounced content change handler
  const debouncedOnChange = useMemo(
    () => debounce((newHtmlContent: string) => {
      const unifiedContent = ContentTransformer.fromHTML(newHtmlContent, {
        userId,
        title: content.metadata.title,
        description: content.metadata.description,
      })
      
      onChange(unifiedContent)
      calculateStats(newHtmlContent)
      
      // Auto-save if enabled
      if (enableAutoSave && onSave && !readOnly) {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current)
        }
        
        autoSaveTimeoutRef.current = setTimeout(async () => {
          setIsAutoSaving(true)
          try {
            await onSave(unifiedContent, 'auto')
            setStats(prev => ({ ...prev, lastSaved: new Date(), unsavedChanges: false }))
          } catch (error) {
            console.error('Auto-save failed:', error)
          } finally {
            setIsAutoSaving(false)
          }
        }, 2000)
      }
    }, 500),
    [onChange, calculateStats, enableAutoSave, onSave, userId, content.metadata, readOnly]
  )

  // Handle editor change
  const handleEditorChange = useCallback((newContent: string) => {
    if (newContent !== htmlContent) {
      debouncedOnChange(newContent)
    }
  }, [htmlContent, debouncedOnChange])

  // Manual save handler
  const handleManualSave = useCallback(async () => {
    if (onSave && !readOnly) {
      setIsAutoSaving(true)
      try {
        await onSave(content, 'manual')
        setStats(prev => ({ ...prev, lastSaved: new Date(), unsavedChanges: false }))
      } catch (error) {
        console.error('Manual save failed:', error)
      } finally {
        setIsAutoSaving(false)
      }
    }
  }, [onSave, content, readOnly])

  // Export handlers
  const handleExportHTML = useCallback(() => {
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${content.metadata.title || 'document'}.html`
    a.click()
    URL.revokeObjectURL(url)
  }, [htmlContent, content.metadata.title])

  const handleExportMarkdown = useCallback(() => {
    const markdownContent = ContentTransformer.toMarkdown(content)
    const blob = new Blob([markdownContent], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${content.metadata.title || 'document'}.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [content])

  // Import handler
  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const importedContent = e.target?.result as string
        if (importedContent) {
          let unifiedContent
          if (file.name.endsWith('.md')) {
            unifiedContent = ContentTransformer.fromMarkdown(importedContent, {
              userId,
              title: file.name.replace(/\\.md$/, ''),
            })
          } else {
            unifiedContent = ContentTransformer.fromHTML(importedContent, {
              userId,
              title: file.name.replace(/\\.[^.]+$/, ''),
            })
          }
          onChange(unifiedContent)
        }
      }
      reader.readAsText(file)
    }
    event.target.value = ''
  }, [onChange, userId])

  // Initialize editor with custom plugins
  const initializeEditor = useCallback((evt: Event, editor: TinyMCEEditor) => {
    editorRef.current = editor
    
    // Initialize custom plugins
    CUSTOM_PLUGINS.forEach(plugin => {
      if (plugin.init) {
        plugin.init(editor)
      }
    })

    // Add custom keyboard shortcuts
    editor.addShortcut('meta+s', 'Save document', () => {
      if (onSave && !readOnly) {
        handleManualSave()
      }
    })

    // Set up collaboration cursors if enabled
    if (enableCollaboration) {
      // This would integrate with collaboration service
      console.log('Collaboration enabled')
    }

    // Add custom styles
    editor.dom.addStyle(`
      .device-specs-table {
        width: 100%;
        border-collapse: collapse;
        margin: 1rem 0;
      }
      .device-specs-table th,
      .device-specs-table td {
        border: 1px solid #e5e7eb;
        padding: 0.75rem;
        text-align: left;
      }
      .device-specs-table th {
        background-color: #f3f4f6;
        font-weight: 600;
      }
      .pros-cons-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        margin: 1.5rem 0;
        padding: 1.5rem;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
      }
      .rating-widget {
        background: #f9fafb;
        padding: 1rem;
        border-radius: 0.5rem;
        margin: 1rem 0;
      }
      .rating-category {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 0.5rem 0;
      }
      .rating-label {
        font-weight: 600;
      }
      .rating-stars {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .rating-score {
        font-size: 0.875rem;
        color: #6b7280;
      }
    `)
  }, [onSave, readOnly, handleManualSave, enableCollaboration])

  // Initialize stats on mount
  useEffect(() => {
    calculateStats(htmlContent)
  }, [htmlContent, calculateStats])

  // TinyMCE configuration
  const editorConfig = useMemo(() => ({
    height: 600,
    menubar: true,
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'help', 'wordcount',
      'emoticons', 'template', 'codesample', 'autoresize'
    ],
    toolbar: [
      'undo redo | blocks | bold italic underline strikethrough |',
      'alignleft aligncenter alignright alignjustify |',
      'bullist numlist outdent indent | removeformat |',
      'link image media table | codesample |',
      'devicespecs proscons rating |',
      'searchreplace | preview fullscreen |',
      'help'
    ].join(' '),
    content_style: `
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
        font-size: 16px; 
        line-height: 1.6;
        max-width: 800px;
        margin: 0 auto;
        padding: 1rem;
      }
      .mce-content-body[data-mce-placeholder]:not(.mce-visualblocks)::before {
        color: #6b7280;
      }
    `,
    placeholder: 'Start writing your content here...',
    skin: theme === 'dark' ? 'oxide-dark' : 'oxide',
    content_css: theme === 'dark' ? 'dark' : 'default',
    branding: false,
    promotion: false,
    contextmenu: 'link linkchecker image table spellchecker',
    image_advtab: true,
    image_caption: true,
    image_title: true,
    file_picker_types: 'image',
    automatic_uploads: true,
    file_picker_callback: (callback: FilePickerCallback, value: string, meta: FilePickerMeta) => {
      if (meta.filetype === 'image') {
        const input = document.createElement('input')
        input.setAttribute('type', 'file')
        input.setAttribute('accept', 'image/*')
        input.onchange = function (this: HTMLInputElement) {
          const file = this.files?.[0]
          if (file) {
            const reader = new FileReader()
            reader.onload = () => {
              const dataUrl = reader.result as string
              callback(dataUrl, { alt: file.name })
            }
            reader.readAsDataURL(file)
          }
        }
        input.click()
      }
    },
    setup: initializeEditor,
    readonly: readOnly,
  }), [theme, initializeEditor, readOnly])

  return (
    <div className={cn('enterprise-wysiwyg-editor', className)}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-white px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Action Controls */}
            <div className="flex items-center space-x-1 border-r pr-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSave}
                disabled={readOnly || isAutoSaving}
              >
                {isAutoSaving ? (
                  <CloudArrowUpIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <CloudArrowUpIcon className="h-4 w-4" />
                )}
                Save
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                <EyeIcon className="h-4 w-4" />
                {showPreview ? 'Edit' : 'Preview'}
              </Button>
            </div>

            {/* Import/Export */}
            <div className="flex items-center space-x-1 border-r pr-3">
              <input
                type="file"
                accept=".html,.htm,.md,.txt"
                onChange={handleImport}
                className="hidden"
                id="wysiwyg-import"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('wysiwyg-import')?.click()}
                disabled={readOnly}
              >
                <ArrowUpTrayIcon className="h-4 w-4" />
                Import
              </Button>
              
              <div className="relative group">
                <Button variant="outline" size="sm">
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Export
                </Button>
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button
                    onClick={handleExportHTML}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    HTML (.html)
                  </button>
                  <button
                    onClick={handleExportMarkdown}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    Markdown (.md)
                  </button>
                </div>
              </div>
            </div>

            {/* Collaboration */}
            {enableCollaboration && (
              <div className="flex items-center space-x-1">
                <Button variant="outline" size="sm">
                  <UserGroupIcon className="h-4 w-4" />
                  {collaborators.length}
                </Button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>{stats.wordCount} words</span>
            <span>{stats.characterCount} characters</span>
            <span>{stats.readingTime} min read</span>
            {stats.lastSaved && (
              <span className="flex items-center space-x-1">
                <ClockIcon className="h-3 w-3" />
                <span>Saved {stats.lastSaved.toLocaleTimeString()}</span>
              </span>
            )}
            {stats.unsavedChanges && (
              <span className="text-orange-600">Unsaved changes</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Editor */}
      <div className="bg-gray-50">
        {showPreview ? (
          <div className="bg-white p-6">
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        ) : (
          <div className="bg-white">
            {isLoading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-gray-500">Loading editor...</div>
              </div>
            ) : (
              <Editor
                apiKey="your-tinymce-api-key" // Replace with your TinyMCE API key
                value={htmlContent}
                init={editorConfig}
                onEditorChange={handleEditorChange}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}