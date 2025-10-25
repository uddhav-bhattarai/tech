/**
 * Traditional Rich Text Editor
 * TipTap-based rich text editing with formatting controls
 */

'use client'

import React, { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import { UnifiedContentData, TraditionalContent } from '@/types/content'
import EditorToolbar from './EditorToolbar'

interface TraditionalEditorProps {
  content: UnifiedContentData
  onChange: (content: UnifiedContentData) => void
  isLoading?: boolean
  className?: string
}

export default function TraditionalEditor({
  content,
  onChange,
  isLoading = false,
  className = ''
}: TraditionalEditorProps) {
  const editor = useEditor({
    immediatelyRender: false, // Fix SSR hydration issues
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg'
        }
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline'
        }
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-slate-300 w-full'
        }
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-slate-300 bg-slate-50 px-4 py-2 text-left font-medium'
        }
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-slate-300 px-4 py-2'
        }
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      Highlight.configure({
        HTMLAttributes: {
          class: 'bg-yellow-200 px-1 py-0.5 rounded'
        }
      })
    ],
    content: getHtmlContent(content),
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const updatedContent: TraditionalContent = {
        type: 'traditional',
        content: html,
        format: 'html'
      }
      onChange(updatedContent)
    },
    editorProps: {
      attributes: {
        class: `prose prose-slate max-w-none min-h-[400px] px-4 py-3 rounded-md border border-slate-200 focus:border-slate-900 focus:outline-none ${className}`
      }
    }
  })

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content) {
      const htmlContent = getHtmlContent(content)
      if (editor.getHTML() !== htmlContent) {
        editor.commands.setContent(htmlContent)
      }
    }
  }, [editor, content])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50 rounded-md">
        <div className="text-gray-500">Loading editor...</div>
      </div>
    )
  }

  return (
    <div className="traditional-editor space-y-4">
      {/* Editor Toolbar */}
      {editor && (
        <EditorToolbar 
          editor={editor}
          className="sticky top-0 z-10 bg-white border-b border-slate-200 pb-2"
        />
      )}
      
      {/* Editor Content */}
      <div className="editor-content">
        <EditorContent 
          editor={editor}
          className="min-h-[400px]"
        />
      </div>
      
      {/* Word Count */}
      {editor && (
        <div className="flex justify-between items-center text-sm text-slate-500 pt-2 border-t">
          <span>
            {editor.storage.characterCount?.words() || 0} words, {editor.storage.characterCount?.characters() || 0} characters
          </span>
          <span className="text-xs">
            Traditional Editor • HTML Format
          </span>
        </div>
      )}
    </div>
  )
}

// Helper function to extract HTML content from unified content
function getHtmlContent(content: UnifiedContentData): string {
  switch (content.type) {
    case 'traditional':
      return content.content
    case 'sectioned':
      // Convert sections to HTML for display
      return content.sections
        .sort((a, b) => a.order - b.order)
        .map(section => `<h2>${section.title}</h2>${section.content}`)
        .join('\n')
    case 'markdown':
      // For now, return as-is (would need markdown parsing)
      return `<pre><code>${content.content}</code></pre>`
    default:
      return ''
  }
}