/**
 * Editor Toolbar
 * Rich text editing toolbar for TipTap editor
 */

'use client'

import React from 'react'
import { Editor } from '@tiptap/react'
import { 
  BoldIcon, 
  ItalicIcon, 
  UnderlineIcon as StrikethroughIcon,
  ListBulletIcon,
  NumberedListIcon,
  LinkIcon,
  PhotoIcon,
  TableCellsIcon,
  CodeBracketIcon,
  PaintBrushIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface EditorToolbarProps {
  editor: Editor
  className?: string
}

export default function EditorToolbar({ editor, className = '' }: EditorToolbarProps) {
  const addImage = () => {
    const url = window.prompt('Enter image URL:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const addLink = () => {
    const url = window.prompt('Enter link URL:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  const setHighlight = () => {
    editor.chain().focus().toggleHighlight().run()
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-1 p-2 border border-slate-200 rounded-md bg-slate-50', className)}>
      {/* Text Formatting */}
      <div className="flex items-center gap-1 border-r border-slate-300 pr-2">
        <Button
          variant={editor.isActive('bold') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <BoldIcon className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('italic') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <ItalicIcon className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('strike') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <StrikethroughIcon className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('highlight') ? 'default' : 'ghost'}
          size="sm"
          onClick={setHighlight}
          title="Highlight"
        >
          <PaintBrushIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Headings */}
      <div className="flex items-center gap-1 border-r border-slate-300 pr-2">
        {[1, 2, 3].map(level => (
          <Button
            key={level}
            variant={editor.isActive('heading', { level }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run()}
            title={`Heading ${level}`}
          >
            H{level}
          </Button>
        ))}
      </div>

      {/* Lists */}
      <div className="flex items-center gap-1 border-r border-slate-300 pr-2">
        <Button
          variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          <ListBulletIcon className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
        >
          <NumberedListIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Insert Elements */}
      <div className="flex items-center gap-1 border-r border-slate-300 pr-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={addLink}
          title="Add Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={addImage}
          title="Add Image"
        >
          <PhotoIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={addTable}
          title="Add Table"
        >
          <TableCellsIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Code */}
      <div className="flex items-center gap-1">
        <Button
          variant={editor.isActive('code') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Inline Code"
        >
          <CodeBracketIcon className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('codeBlock') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code Block"
        >
          <CodeBracketIcon className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}