/**
 * Enterprise Markdown Editor
 * Advanced Markdown editor with syntax highlighting, live preview, auto-completion,
 * collaborative editing, version control, and plugin architecture
 */

'use client'

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Editor } from '@monaco-editor/react'
import { marked } from 'marked'
import { debounce } from 'lodash-es'
import { UnifiedContent, ContentTransformer } from '@/lib/unified-content'
import { Button } from '@/components/ui/Button'
import { 
  EyeIcon, 
  EyeSlashIcon, 
  DocumentTextIcon,
  CloudArrowUpIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ClockIcon,
  UserGroupIcon,
  BookmarkIcon,
  MagnifyingGlassIcon,
  CogIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface MarkdownEditorProps {
  content: UnifiedContent
  onChange: (content: UnifiedContent) => void
  onSave?: (content: UnifiedContent, saveType: 'auto' | 'manual') => Promise<void>
  isLoading?: boolean
  enableLivePreview?: boolean
  enableCollaboration?: boolean
  enableAutoSave?: boolean
  className?: string
  blogPostId?: string
  userId?: string
  readOnly?: boolean
}

interface EditorStats {
  wordCount: number
  characterCount: number
  readingTime: number
  lastSaved: Date | null
  unsavedChanges: boolean
}

interface AutoCompleteItem {
  label: string
  kind: string
  detail?: string
  insertText: string
}

export default function EnterpriseMarkdownEditor({
  content,
  onChange,
  onSave,
  isLoading = false,
  enableLivePreview = true,
  enableCollaboration = false,
  enableAutoSave = true,
  className = '',
  blogPostId,
  userId,
  readOnly = false
}: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(enableLivePreview)
  const [splitView, setSplitView] = useState(true)
  const [stats, setStats] = useState<EditorStats>({
    wordCount: 0,
    characterCount: 0,
    readingTime: 0,
    lastSaved: null,
    unsavedChanges: false,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchReplace, setShowSearchReplace] = useState(false)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [collaborators, setCollaborators] = useState<any[]>([])
  const [showOutline, setShowOutline] = useState(false)
  const [outline, setOutline] = useState<any[]>([])

  const editorRef = useRef<any>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Get current markdown content
  const markdownContent = useMemo(() => {
    return ContentTransformer.toMarkdown(content)
  }, [content])

  // Calculate stats
  const calculateStats = useCallback((text: string) => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0)
    const wordsPerMinute = 200
    
    setStats(prev => ({
      ...prev,
      wordCount: words.length,
      characterCount: text.length,
      readingTime: Math.ceil(words.length / wordsPerMinute),
      unsavedChanges: true,
    }))
  }, [])

  // Debounced content change handler
  const debouncedOnChange = useMemo(
    () => debounce((newContent: string) => {
      const unifiedContent = ContentTransformer.fromMarkdown(newContent, {
        userId,
        title: content.metadata.title,
        description: content.metadata.description,
      })
      
      onChange(unifiedContent)
      calculateStats(newContent)
      
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
    }, 300),
    [onChange, calculateStats, enableAutoSave, onSave, userId, content.metadata, readOnly]
  )

  // Handle editor mount
  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor

    // Configure markdown language
    monaco.languages.setLanguageConfiguration('markdown', {
      wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
    })

    // Add auto-completion
    monaco.languages.registerCompletionItemProvider('markdown', {
      provideCompletionItems: (model: any, position: any) => {
        const suggestions: AutoCompleteItem[] = [
          {
            label: 'heading1',
            kind: monaco.languages.CompletionItemKind.Snippet,
            detail: 'Insert H1 heading',
            insertText: '# ${1:Heading}',
          },
          {
            label: 'heading2',
            kind: monaco.languages.CompletionItemKind.Snippet,
            detail: 'Insert H2 heading',
            insertText: '## ${1:Heading}',
          },
          {
            label: 'heading3',
            kind: monaco.languages.CompletionItemKind.Snippet,
            detail: 'Insert H3 heading',
            insertText: '### ${1:Heading}',
          },
          {
            label: 'link',
            kind: monaco.languages.CompletionItemKind.Snippet,
            detail: 'Insert link',
            insertText: '[${1:text}](${2:url})',
          },
          {
            label: 'image',
            kind: monaco.languages.CompletionItemKind.Snippet,
            detail: 'Insert image',
            insertText: '![${1:alt text}](${2:image url})',
          },
          {
            label: 'code-block',
            kind: monaco.languages.CompletionItemKind.Snippet,
            detail: 'Insert code block',
            insertText: '```${1:language}\\n${2:code}\\n```',
          },
          {
            label: 'table',
            kind: monaco.languages.CompletionItemKind.Snippet,
            detail: 'Insert table',
            insertText: '| ${1:Header 1} | ${2:Header 2} |\\n|-------------|-------------|\\n| ${3:Cell 1}   | ${4:Cell 2}   |',
          },
          {
            label: 'pros-cons',
            kind: monaco.languages.CompletionItemKind.Snippet,
            detail: 'Insert pros and cons block',
            insertText: '## Pros\\n\\n- ${1:Pro 1}\\n- ${2:Pro 2}\\n\\n## Cons\\n\\n- ${3:Con 1}\\n- ${4:Con 2}',
          },
          {
            label: 'device-specs',
            kind: monaco.languages.CompletionItemKind.Snippet,
            detail: 'Insert device specifications table',
            insertText: '## Specifications\\n\\n| Specification | Value |\\n|---------------|-------|\\n| ${1:Spec 1} | ${2:Value 1} |\\n| ${3:Spec 2} | ${4:Value 2} |',
          },
        ]

        return { suggestions }
      }
    })

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSave && !readOnly) {
        const currentContent = ContentTransformer.fromMarkdown(editor.getValue(), {
          userId,
          title: content.metadata.title,
        })
        onSave(currentContent, 'manual')
      }
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
      setShowSearchReplace(true)
    })

    // Set initial value
    editor.setValue(markdownContent)
  }, [onSave, readOnly, userId, content.metadata, markdownContent])

  // Generate outline from markdown
  const generateOutline = useCallback((text: string) => {
    const headings = text.match(/^#{1,6}\s+.+$/gm) || []
    const outlineItems = headings.map((heading, index) => {
      const level = heading.match(/^#+/)?.[0].length || 1
      const title = heading.replace(/^#+\s+/, '')
      return {
        id: index,
        level,
        title,
        line: text.substring(0, text.indexOf(heading)).split('\\n').length,
      }
    })
    setOutline(outlineItems)
  }, [])

  // Handle content change
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined && value !== markdownContent) {
      generateOutline(value)
      debouncedOnChange(value)
    }
  }, [markdownContent, generateOutline, debouncedOnChange])

  // Render HTML from markdown
  const htmlContent = useMemo(() => {
    try {
      return marked(markdownContent)
    } catch (error) {
      console.error('Markdown parsing error:', error)
      return '<p>Error rendering markdown</p>'
    }
  }, [markdownContent])

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
  const handleExportMarkdown = useCallback(() => {
    const blob = new Blob([markdownContent], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${content.metadata.title || 'document'}.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [markdownContent, content.metadata.title])

  const handleExportHTML = useCallback(() => {
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${content.metadata.title || 'document'}.html`
    a.click()
    URL.revokeObjectURL(url)
  }, [htmlContent, content.metadata.title])

  // Import handler
  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const importedContent = e.target?.result as string
        if (importedContent) {
          const unifiedContent = ContentTransformer.fromMarkdown(importedContent, {
            userId,
            title: file.name.replace(/\\.md$/, ''),
          })
          onChange(unifiedContent)
        }
      }
      reader.readAsText(file)
    }
    event.target.value = ''
  }, [onChange, userId])

  // Initialize stats on mount
  useEffect(() => {
    calculateStats(markdownContent)
    generateOutline(markdownContent)
  }, [markdownContent, calculateStats, generateOutline])

  return (
    <div className={cn('enterprise-markdown-editor', className)}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-white px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* View Controls */}
            <div className="flex items-center space-x-1 border-r pr-3">
              <Button
                variant={splitView ? 'primary' : 'outline'}
                size="sm"
                onClick={() => {
                  setSplitView(true)
                  setShowPreview(true)
                }}
              >
                <DocumentTextIcon className="h-4 w-4" />
                Split
              </Button>
              <Button
                variant={!splitView && !showPreview ? 'primary' : 'outline'}
                size="sm"
                onClick={() => {
                  setSplitView(false)
                  setShowPreview(false)
                }}
              >
                Edit
              </Button>
              <Button
                variant={!splitView && showPreview ? 'primary' : 'outline'}
                size="sm"
                onClick={() => {
                  setSplitView(false)
                  setShowPreview(true)
                }}
              >
                <EyeIcon className="h-4 w-4" />
                Preview
              </Button>
            </div>

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
                onClick={() => setShowSearchReplace(!showSearchReplace)}
              >
                <MagnifyingGlassIcon className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOutline(!showOutline)}
              >
                Outline
              </Button>
            </div>

            {/* Import/Export */}
            <div className="flex items-center space-x-1 border-r pr-3">
              <input
                type="file"
                accept=".md,.txt"
                onChange={handleImport}
                className="hidden"
                id="markdown-import"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('markdown-import')?.click()}
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
                    onClick={handleExportMarkdown}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    Markdown (.md)
                  </button>
                  <button
                    onClick={handleExportHTML}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    HTML (.html)
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

      {/* Main Editor Area */}
      <div className="flex flex-1 h-[600px] bg-gray-50">
        {/* Outline Sidebar */}
        {showOutline && (
          <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
            <h3 className="font-medium mb-3">Outline</h3>
            <div className="space-y-1">
              {outline.map((item) => (
                <button
                  key={item.id}
                  className={cn(
                    "block w-full text-left text-sm py-1 px-2 rounded hover:bg-gray-100",
                    `ml-${(item.level - 1) * 4}`
                  )}
                  onClick={() => {
                    editorRef.current?.revealLineInCenter(item.line)
                    editorRef.current?.setPosition({ lineNumber: item.line, column: 1 })
                    editorRef.current?.focus()
                  }}
                >
                  {item.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Editor */}
        {(!showPreview || splitView) && (
          <div className={cn("flex-1 relative", splitView && "border-r border-gray-200")}>
            {showSearchReplace && (
              <div className="absolute top-2 right-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full text-sm border border-gray-300 rounded px-2 py-1 mb-2"
                />
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">Find</Button>
                  <Button size="sm" variant="outline">Replace</Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setShowSearchReplace(false)}
                  >
                    ×
                  </Button>
                </div>
              </div>
            )}
            
            <Editor
              height="100%"
              defaultLanguage="markdown"
              value={markdownContent}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              loading={isLoading ? "Loading..." : undefined}
              options={{
                minimap: { enabled: false },
                wordWrap: 'on',
                lineNumbers: 'on',
                fontSize: 14,
                fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                readOnly,
                automaticLayout: true,
                scrollBeyondLastLine: false,
                renderWhitespace: 'selection',
                folding: true,
                foldingStrategy: 'indentation',
                showFoldingControls: 'always',
                suggest: {
                  showKeywords: true,
                  showSnippets: true,
                },
              }}
              theme="vs"
            />
          </div>
        )}

        {/* Preview */}
        {showPreview && (
          <div className="flex-1 bg-white p-6 overflow-y-auto">
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        )}
      </div>
    </div>
  )
}