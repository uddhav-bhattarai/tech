/**
 * Enterprise Section-Based Editor
 * Template-driven editor with predefined structures, drag-and-drop reordering,
 * and dynamic content blocks for structured content creation
 */

'use client'

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { UnifiedContent, ContentTransformer, ContentNode } from '@/lib/unified-content'
import { Button } from '@/components/ui/Button'
import { 
  PlusIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  Bars3Icon,
  PencilSquareIcon,
  EyeIcon,
  CloudArrowUpIcon,
  ArrowDownTrayIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface SectionEditorProps {
  content: UnifiedContent
  onChange: (content: UnifiedContent) => void
  onSave?: (content: UnifiedContent, saveType: 'auto' | 'manual') => Promise<void>
  isLoading?: boolean
  enableAutoSave?: boolean
  className?: string
  userId?: string
  readOnly?: boolean
  theme?: 'light' | 'dark'
}

interface SectionTemplate {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  defaultContent: ContentNode[]
  category: 'intro' | 'specs' | 'review' | 'media' | 'comparison' | 'conclusion' | 'custom'
}

interface EditableSection {
  id: string
  templateId: string
  title: string
  content: ContentNode[]
  isCollapsed: boolean
  metadata?: {
    order: number
    visibility: 'public' | 'draft' | 'private'
    tags: string[]
  }
}

interface SectionStats {
  totalSections: number
  wordsPerSection: Record<string, number>
  totalWords: number
  estimatedReadTime: number
  lastModified: Date | null
}

// Predefined section templates
const SECTION_TEMPLATES: SectionTemplate[] = [
  {
    id: 'intro',
    name: 'Introduction',
    description: 'Opening paragraph with overview and key points',
    icon: <PencilSquareIcon className="h-5 w-5" />,
    category: 'intro',
    defaultContent: [
      {
        type: 'paragraph',
        content: 'Write your introduction here. This section should provide an overview and hook readers with key points.',
        metadata: { placeholder: true }
      }
    ]
  },
  {
    id: 'device-overview',
    name: 'Device Overview',
    description: 'Key specifications and first impressions',
    icon: <DocumentDuplicateIcon className="h-5 w-5" />,
    category: 'specs',
    defaultContent: [
      {
        type: 'heading',
        content: 'Device Overview',
        metadata: { level: 2 }
      },
      {
        type: 'paragraph',
        content: 'Brief overview of the device and what makes it unique.'
      },
      {
        type: 'table',
        content: 'Key Specifications',
        metadata: {
          headers: ['Specification', 'Details'],
          rows: [
            ['Display', 'Enter display details'],
            ['Processor', 'Enter processor details'],
            ['Memory', 'Enter memory details'],
            ['Storage', 'Enter storage details'],
            ['Camera', 'Enter camera details']
          ]
        }
      }
    ]
  },
  {
    id: 'design-build',
    name: 'Design & Build Quality',
    description: 'Physical design, materials, and build assessment',
    icon: <PencilSquareIcon className="h-5 w-5" />,
    category: 'review',
    defaultContent: [
      {
        type: 'heading',
        content: 'Design & Build Quality',
        metadata: { level: 2 }
      },
      {
        type: 'paragraph',
        content: 'Describe the physical design, materials used, and overall build quality.'
      },
      {
        type: 'list',
        content: 'Key Design Points',
        metadata: {
          ordered: false,
          items: [
            'Material quality and finish',
            'Ergonomics and comfort',
            'Button placement and tactile feedback',
            'Port selection and placement'
          ]
        }
      }
    ]
  },
  {
    id: 'performance',
    name: 'Performance Analysis',
    description: 'Benchmarks, real-world usage, and performance metrics',
    icon: <ArrowUpIcon className="h-5 w-5" />,
    category: 'review',
    defaultContent: [
      {
        type: 'heading',
        content: 'Performance Analysis',
        metadata: { level: 2 }
      },
      {
        type: 'paragraph',
        content: 'Detailed analysis of performance in various scenarios.'
      },
      {
        type: 'heading',
        content: 'Benchmark Results',
        metadata: { level: 3 }
      },
      {
        type: 'table',
        content: 'Performance Metrics',
        metadata: {
          headers: ['Test', 'Score', 'Comparison'],
          rows: [
            ['CPU Single-Core', 'Enter score', 'vs Competition'],
            ['CPU Multi-Core', 'Enter score', 'vs Competition'],
            ['GPU Performance', 'Enter score', 'vs Competition'],
            ['Memory Speed', 'Enter score', 'vs Competition']
          ]
        }
      }
    ]
  },
  {
    id: 'pros-cons',
    name: 'Pros & Cons',
    description: 'Balanced assessment of strengths and weaknesses',
    icon: <Bars3Icon className="h-5 w-5" />,
    category: 'review',
    defaultContent: [
      {
        type: 'heading',
        content: 'Pros & Cons',
        metadata: { level: 2 }
      },
      {
        type: 'heading',
        content: 'Pros',
        metadata: { level: 3, style: { color: '#059669' } }
      },
      {
        type: 'list',
        content: 'Positive aspects',
        metadata: {
          ordered: false,
          items: [
            'Add positive point here',
            'Add another positive point',
            'Add third positive point'
          ]
        }
      },
      {
        type: 'heading',
        content: 'Cons',
        metadata: { level: 3, style: { color: '#DC2626' } }
      },
      {
        type: 'list',
        content: 'Areas for improvement',
        metadata: {
          ordered: false,
          items: [
            'Add negative point here',
            'Add another negative point',
            'Add third negative point'
          ]
        }
      }
    ]
  },
  {
    id: 'conclusion',
    name: 'Final Verdict',
    description: 'Summary, recommendation, and rating',
    icon: <EyeIcon className="h-5 w-5" />,
    category: 'conclusion',
    defaultContent: [
      {
        type: 'heading',
        content: 'Final Verdict',
        metadata: { level: 2 }
      },
      {
        type: 'paragraph',
        content: 'Summarize your overall assessment and provide a clear recommendation.'
      },
      {
        type: 'heading',
        content: 'Rating Breakdown',
        metadata: { level: 3 }
      },
      {
        type: 'table',
        content: 'Final Ratings',
        metadata: {
          headers: ['Category', 'Rating', 'Notes'],
          rows: [
            ['Design', '★★★★☆', 'Well-built with premium feel'],
            ['Performance', '★★★★★', 'Excellent in all scenarios'],
            ['Value', '★★★☆☆', 'Competitive pricing'],
            ['Overall', '★★★★☆', 'Highly recommended']
          ]
        }
      }
    ]
  }
]

// Sortable section component
function SortableSection({ 
  section, 
  onUpdate, 
  onDelete, 
  onDuplicate,
  readOnly = false 
}: {
  section: EditableSection
  onUpdate: (sectionId: string, updates: Partial<EditableSection>) => void
  onDelete: (sectionId: string) => void
  onDuplicate: (sectionId: string) => void
  readOnly?: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [localTitle, setLocalTitle] = useState(section.title)
  const [localContent, setLocalContent] = useState('')

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Convert content nodes to editable text
  const contentText = useMemo(() => {
    return section.content.map(node => {
      switch (node.type) {
        case 'paragraph':
          return node.content
        case 'heading':
          return `${'#'.repeat(node.metadata?.level || 1)} ${node.content}`
        case 'list':
          return node.metadata?.items?.map(item => `- ${item}`).join('\n') || ''
        case 'table':
          return `Table: ${node.content}`
        default:
          return String(node.content || '')
      }
    }).join('\n\n')
  }, [section.content])

  useEffect(() => {
    setLocalContent(contentText)
  }, [contentText])

  const handleSave = useCallback(() => {
    // Convert text back to content nodes
    const lines = localContent.split('\n').filter(line => line.trim())
    const newContent: ContentNode[] = []
    
    lines.forEach(line => {
      const trimmed = line.trim()
      if (!trimmed) return

      if (trimmed.startsWith('#')) {
        const level = trimmed.match(/^#+/)?.[0].length || 1
        const content = trimmed.replace(/^#+\s*/, '')
        newContent.push({
          type: 'heading',
          content,
          metadata: { level }
        })
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        // Find or create list node
        const listContent = trimmed.replace(/^[*-]\s*/, '')
        const existingList = newContent[newContent.length - 1]
        
        if (existingList && existingList.type === 'list') {
          existingList.metadata!.items!.push(listContent)
        } else {
          newContent.push({
            type: 'list',
            content: 'List',
            metadata: {
              ordered: false,
              items: [listContent]
            }
          })
        }
      } else if (trimmed.startsWith('Table:')) {
        newContent.push({
          type: 'table',
          content: trimmed.replace('Table: ', ''),
          metadata: {
            headers: ['Column 1', 'Column 2'],
            rows: [['Data 1', 'Data 2']]
          }
        })
      } else {
        newContent.push({
          type: 'paragraph',
          content: trimmed
        })
      }
    })

    onUpdate(section.id, { 
      title: localTitle,
      content: newContent 
    })
    setIsEditing(false)
  }, [section.id, localTitle, localContent, onUpdate])

  const handleCancel = useCallback(() => {
    setLocalTitle(section.title)
    setLocalContent(contentText)
    setIsEditing(false)
  }, [section.title, contentText])

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-white rounded-lg border border-gray-200 shadow-sm',
        isDragging && 'shadow-lg ring-2 ring-blue-500 ring-opacity-50'
      )}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          {!readOnly && (
            <button
              {...attributes}
              {...listeners}
              className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
          )}
          
          {isEditing ? (
            <input
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              className="font-medium text-lg bg-transparent border-b border-blue-500 focus:outline-none"
              placeholder="Section title"
            />
          ) : (
            <h3 className="font-medium text-lg text-gray-900">{section.title}</h3>
          )}
        </div>

        <div className="flex items-center space-x-1">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save
              </Button>
            </>
          ) : (
            <>
              {!readOnly && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDuplicate(section.id)}
                  >
                    <DocumentDuplicateIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(section.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              <button
                onClick={() => onUpdate(section.id, { isCollapsed: !section.isCollapsed })}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                {section.isCollapsed ? (
                  <ArrowDownIcon className="h-4 w-4" />
                ) : (
                  <ArrowUpIcon className="h-4 w-4" />
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Section Content */}
      {!section.isCollapsed && (
        <div className="p-4">
          {isEditing ? (
            <textarea
              value={localContent}
              onChange={(e) => setLocalContent(e.target.value)}
              className="w-full h-64 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              placeholder="Enter section content..."
            />
          ) : (
            <div className="prose max-w-none">
              {section.content.map((node, index) => (
                <div key={index} className="mb-4">
                  {node.type === 'heading' && (
                    <div 
                      className={cn(
                        'font-bold',
                        node.metadata?.level === 1 && 'text-2xl',
                        node.metadata?.level === 2 && 'text-xl',
                        node.metadata?.level === 3 && 'text-lg'
                      )}
                      style={node.metadata?.style}
                    >
                      {node.content}
                    </div>
                  )}
                  {node.type === 'paragraph' && (
                    <p className="text-gray-700 leading-relaxed">{node.content}</p>
                  )}
                  {node.type === 'list' && (
                    <ul className="list-disc list-inside space-y-1">
                      {node.metadata?.items?.map((item, itemIndex) => (
                        <li key={itemIndex} className="text-gray-700">{item}</li>
                      ))}
                    </ul>
                  )}
                  {node.type === 'table' && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border border-gray-300">
                        <thead>
                          <tr className="bg-gray-50">
                            {node.metadata?.headers?.map((header, headerIndex) => (
                              <th 
                                key={headerIndex}
                                className="px-3 py-2 border border-gray-300 text-left font-medium"
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {node.metadata?.rows?.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {row.map((cell, cellIndex) => (
                                <td 
                                  key={cellIndex}
                                  className="px-3 py-2 border border-gray-300"
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function EnterpriseSectionEditor({
  content,
  onChange,
  onSave,
  isLoading = false,
  enableAutoSave = true,
  className = '',
  userId,
  readOnly = false,
  theme = 'light'
}: SectionEditorProps) {
  const [sections, setSections] = useState<EditableSection[]>([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [stats, setStats] = useState<SectionStats>({
    totalSections: 0,
    wordsPerSection: {},
    totalWords: 0,
    estimatedReadTime: 0,
    lastModified: null
  })
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Convert unified content to sections
  const convertToSections = useCallback((unifiedContent: UnifiedContent): EditableSection[] => {
    const contentSections: EditableSection[] = []
    let currentSection: EditableSection | null = null
    
    unifiedContent.content.forEach((node, index) => {
      if (node.type === 'heading' && node.metadata?.level === 2) {
        // Start new section
        if (currentSection) {
          contentSections.push(currentSection)
        }
        
        currentSection = {
          id: `section-${index}`,
          templateId: 'custom',
          title: String(node.content),
          content: [],
          isCollapsed: false,
          metadata: {
            order: contentSections.length,
            visibility: 'public',
            tags: []
          }
        }
      } else {
        // Add to current section or create default section
        if (!currentSection) {
          currentSection = {
            id: 'section-0',
            templateId: 'custom',
            title: 'Introduction',
            content: [],
            isCollapsed: false,
            metadata: {
              order: 0,
              visibility: 'public',
              tags: []
            }
          }
        }
        
        currentSection.content.push(node)
      }
    })
    
    if (currentSection) {
      contentSections.push(currentSection)
    }
    
    return contentSections.length > 0 ? contentSections : [{
      id: 'section-default',
      templateId: 'intro',
      title: 'Getting Started',
      content: [{
        type: 'paragraph',
        content: 'Start writing your content here...'
      }],
      isCollapsed: false,
      metadata: {
        order: 0,
        visibility: 'public',
        tags: []
      }
    }]
  }, [])

  // Convert sections back to unified content
  const convertFromSections = useCallback((sectionList: EditableSection[]): UnifiedContent => {
    const allContent: ContentNode[] = []
    
    sectionList.forEach(section => {
      // Add section heading
      allContent.push({
        type: 'heading',
        content: section.title,
        metadata: { level: 2 }
      })
      
      // Add section content
      allContent.push(...section.content)
    })
    
    return {
      version: '1.0',
      content: allContent,
      metadata: {
        ...content.metadata,
        updatedAt: new Date().toISOString(),
        userId: userId || content.metadata.userId
      }
    }
  }, [content.metadata, userId])

  // Initialize sections from content
  useEffect(() => {
    const initialSections = convertToSections(content)
    setSections(initialSections)
  }, [content, convertToSections])

  // Calculate stats
  const calculateStats = useCallback((sectionList: EditableSection[]) => {
    const wordsPerSection: Record<string, number> = {}
    let totalWords = 0
    
    sectionList.forEach(section => {
      const sectionText = section.content.map(node => String(node.content || '')).join(' ')
      const words = sectionText.split(/\s+/).filter(word => word.length > 0)
      wordsPerSection[section.id] = words.length
      totalWords += words.length
    })
    
    setStats({
      totalSections: sectionList.length,
      wordsPerSection,
      totalWords,
      estimatedReadTime: Math.ceil(totalWords / 200),
      lastModified: new Date()
    })
  }, [])

  // Handle section updates
  const handleSectionUpdate = useCallback((sectionId: string, updates: Partial<EditableSection>) => {
    setSections(prev => {
      const updated = prev.map(section => 
        section.id === sectionId ? { ...section, ...updates } : section
      )
      
      const newContent = convertFromSections(updated)
      onChange(newContent)
      calculateStats(updated)
      
      // Auto-save if enabled
      if (enableAutoSave && onSave && !readOnly) {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current)
        }
        
        autoSaveTimeoutRef.current = setTimeout(async () => {
          setIsAutoSaving(true)
          try {
            await onSave(newContent, 'auto')
          } catch (error) {
            console.error('Auto-save failed:', error)
          } finally {
            setIsAutoSaving(false)
          }
        }, 2000)
      }
      
      return updated
    })
  }, [convertFromSections, onChange, calculateStats, enableAutoSave, onSave, readOnly])

  // Handle section deletion
  const handleSectionDelete = useCallback((sectionId: string) => {
    setSections(prev => {
      const filtered = prev.filter(section => section.id !== sectionId)
      const newContent = convertFromSections(filtered)
      onChange(newContent)
      calculateStats(filtered)
      return filtered
    })
  }, [convertFromSections, onChange, calculateStats])

  // Handle section duplication
  const handleSectionDuplicate = useCallback((sectionId: string) => {
    setSections(prev => {
      const section = prev.find(s => s.id === sectionId)
      if (!section) return prev
      
      const duplicate: EditableSection = {
        ...section,
        id: `${section.id}-copy-${Date.now()}`,
        title: `${section.title} (Copy)`
      }
      
      const sectionIndex = prev.findIndex(s => s.id === sectionId)
      const updated = [
        ...prev.slice(0, sectionIndex + 1),
        duplicate,
        ...prev.slice(sectionIndex + 1)
      ]
      
      const newContent = convertFromSections(updated)
      onChange(newContent)
      calculateStats(updated)
      return updated
    })
  }, [convertFromSections, onChange, calculateStats])

  // Add new section from template
  const handleAddSection = useCallback((template: SectionTemplate) => {
    const newSection: EditableSection = {
      id: `section-${Date.now()}`,
      templateId: template.id,
      title: template.name,
      content: [...template.defaultContent],
      isCollapsed: false,
      metadata: {
        order: sections.length,
        visibility: 'public',
        tags: []
      }
    }
    
    setSections(prev => {
      const updated = [...prev, newSection]
      const newContent = convertFromSections(updated)
      onChange(newContent)
      calculateStats(updated)
      return updated
    })
    
    setShowTemplates(false)
  }, [sections.length, convertFromSections, onChange, calculateStats])

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      setSections(prev => {
        const oldIndex = prev.findIndex(section => section.id === active.id)
        const newIndex = prev.findIndex(section => section.id === over.id)
        
        const reordered = [...prev]
        const [moved] = reordered.splice(oldIndex, 1)
        reordered.splice(newIndex, 0, moved)
        
        const newContent = convertFromSections(reordered)
        onChange(newContent)
        
        return reordered
      })
    }
  }, [convertFromSections, onChange])

  // Manual save
  const handleManualSave = useCallback(async () => {
    if (onSave && !readOnly) {
      setIsAutoSaving(true)
      try {
        await onSave(content, 'manual')
      } catch (error) {
        console.error('Manual save failed:', error)
      } finally {
        setIsAutoSaving(false)
      }
    }
  }, [onSave, content, readOnly])

  // Export handlers
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

  const handleExportHTML = useCallback(() => {
    const htmlContent = ContentTransformer.toHTML(content)
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${content.metadata.title || 'document'}.html`
    a.click()
    URL.revokeObjectURL(url)
  }, [content])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading section editor...</div>
      </div>
    )
  }

  return (
    <div className={cn('enterprise-section-editor', className, theme === 'dark' && 'dark')}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {!readOnly && (
              <>
                <Button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="flex items-center space-x-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Add Section</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleManualSave}
                  disabled={isAutoSaving}
                >
                  {isAutoSaving ? (
                    <CloudArrowUpIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <CloudArrowUpIcon className="h-4 w-4" />
                  )}
                  Save
                </Button>
              </>
            )}
            
            <div className="relative group">
              <Button variant="outline">
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
          
          {/* Stats */}
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>{stats.totalSections} sections</span>
            <span>{stats.totalWords} words</span>
            <span>{stats.estimatedReadTime} min read</span>
            {stats.lastModified && (
              <span className="flex items-center space-x-1">
                <ClockIcon className="h-3 w-3" />
                <span>Modified {stats.lastModified.toLocaleTimeString()}</span>
              </span>
            )}
          </div>
        </div>
        
        {/* Template Selector */}
        {showTemplates && !readOnly && (
          <div className="mt-3 border-t pt-3">
            <h4 className="font-medium text-sm text-gray-700 mb-2">Choose a section template:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {SECTION_TEMPLATES.map(template => (
                <button
                  key={template.id}
                  onClick={() => handleAddSection(template)}
                  className="p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition-colors"
                >
                  <div className="flex items-center space-x-2 mb-1">
                    {template.icon}
                    <span className="font-medium text-sm">{template.name}</span>
                  </div>
                  <p className="text-xs text-gray-600">{template.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Sections */}
      <div className="p-4 bg-gray-50 min-h-screen">
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4 max-w-4xl mx-auto">
              {sections.map(section => (
                <SortableSection
                  key={section.id}
                  section={section}
                  onUpdate={handleSectionUpdate}
                  onDelete={handleSectionDelete}
                  onDuplicate={handleSectionDuplicate}
                  readOnly={readOnly}
                />
              ))}
              
              {sections.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-500 mb-4">No sections yet</div>
                  {!readOnly && (
                    <Button onClick={() => setShowTemplates(true)}>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Your First Section
                    </Button>
                  )}
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}