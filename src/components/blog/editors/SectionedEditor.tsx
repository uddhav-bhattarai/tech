/**
 * Sectioned Editor
 * Section-based blog editing with drag-and-drop reordering
 */

'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { UnifiedContentData, SectionContent, BlogSection } from '@/types/content'
import { Button } from '@/components/ui/Button'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Bars3Icon } from '@heroicons/react/24/solid'
import RichTextEditor from '../RichTextEditor'

interface SectionedEditorProps {
  content: UnifiedContentData
  onChange: (content: UnifiedContentData) => void
  isLoading?: boolean
  className?: string
}

export default function SectionedEditor({
  content,
  onChange,
  isLoading = false,
  className = ''
}: SectionedEditorProps) {
  const [sections, setSections] = useState<BlogSection[]>([])
  
  // Initialize sections from content
  useEffect(() => {
    const extractSections = () => {
      if (content.type === 'sectioned') {
        return content.sections
      }
      
      // Convert other content types to sections
      if (content.type === 'traditional') {
        return [{
          id: 'section-1',
          type: 'custom' as const,
          title: 'Content',
          content: content.content,
          order: 1
        }]
      }
      
      if (content.type === 'markdown') {
        return [{
          id: 'section-1',
          type: 'custom' as const,
          title: 'Markdown Content',
          content: content.content,
          order: 1
        }]
      }
      
      return []
    }
    
    setSections(extractSections())
  }, [content])

  // Handle sections change
  const handleSectionsChange = useCallback((newSections: BlogSection[]) => {
    setSections(newSections)
    
    const sectionedContent: SectionContent = {
      type: 'sectioned',
      sections: newSections
    }
    onChange(sectionedContent)
  }, [onChange])

  // Add new section
  const addSection = useCallback(() => {
    const newSection: BlogSection = {
      id: `section-${Date.now()}`,
      type: 'custom',
      title: 'New Section',
      content: '<p>Enter your content here...</p>',
      order: sections.length + 1
    }
    
    handleSectionsChange([...sections, newSection])
  }, [sections, handleSectionsChange])

  // Update section
  const updateSection = useCallback((sectionId: string, updates: Partial<BlogSection>) => {
    const updatedSections = sections.map(section =>
      section.id === sectionId ? { ...section, ...updates } : section
    )
    handleSectionsChange(updatedSections)
  }, [sections, handleSectionsChange])

  // Delete section
  const deleteSection = useCallback((sectionId: string) => {
    const filteredSections = sections.filter(section => section.id !== sectionId)
      .map((section, index) => ({ ...section, order: index + 1 }))
    handleSectionsChange(filteredSections)
  }, [sections, handleSectionsChange])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50 rounded-md">
        <div className="text-gray-500">Loading sectioned editor...</div>
      </div>
    )
  }

  return (
    <div className={`sectioned-editor space-y-4 ${className}`}>
      {/* Section List */}
      <div className="space-y-4">
        {sections.sort((a, b) => a.order - b.order).map((section) => (
          <div key={section.id} className="bg-white border rounded-lg shadow-sm">
            {/* Section Header */}
            <div className="flex items-center justify-between p-3 border-b bg-gray-50">
              <div className="flex items-center gap-2">
                <Bars3Icon className="h-4 w-4 text-gray-400 cursor-grab" />
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => updateSection(section.id, { title: e.target.value })}
                  className="font-medium text-gray-900 bg-transparent border-none outline-none"
                />
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteSection(section.id)}
                className="text-red-600 hover:text-red-700"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>

            {/* Section Content */}
            <div className="p-3">
              <RichTextEditor
                content={section.content}
                onChange={(content) => updateSection(section.id, { content })}
                placeholder={`Write content for ${section.title}...`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Add Section Button */}
      <Button
        variant="outline"
        onClick={addSection}
        className="w-full"
      >
        <PlusIcon className="h-4 w-4 mr-2" />
        Add Section
      </Button>

      {/* Footer Info */}
      <div className="flex justify-between items-center text-sm text-gray-500 pt-4 border-t">
        <span>{sections.length} sections</span>
        <span>Sectioned Editor • Drag to reorder</span>
      </div>
    </div>
  )
}