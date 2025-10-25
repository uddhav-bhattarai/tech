/**
 * Accessible Blog Editor
 * Three-mode blog editor with AAA color contrast and proper accessibility
 */

'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Eye, FileText, LayoutGrid, Code2, Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { marked } from 'marked'
import TurndownService from 'turndown'
import { BlogType } from '@/types/content'

// Initialize turndown for HTML to markdown conversion
const turndownService = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced'
})

// Parse markdown into sections based on H1 headings
const parseMarkdownToSections = (markdownContent: string) => {
  const lines = markdownContent.split('\n')
  const parsedSections: Array<{ id: string; type: string; title: string; content: string }> = []
  let currentSection: { id: string; type: string; title: string; content: string } | null = null
  
  lines.forEach((line) => {
    // Check if line is H1 heading
    if (line.trim().startsWith('# ')) {
      // Save previous section if exists
      if (currentSection) {
        parsedSections.push(currentSection)
      }
      // Start new section
      currentSection = {
        id: `section-${parsedSections.length + 1}`,
        type: 'text',
        title: line.replace(/^# /, '').trim(),
        content: ''
      }
    } else if (currentSection) {
      // Add content to current section
      currentSection.content += line + '\n'
    } else {
      // Content before first H1 - create default section
      if (line.trim()) {
        if (!parsedSections.length || parsedSections[0].title !== 'Introduction') {
          parsedSections.unshift({
            id: 'section-intro',
            type: 'text',
            title: 'Introduction',
            content: line + '\n'
          })
        } else {
          parsedSections[0].content += line + '\n'
        }
      }
    }
  })
  
  // Add final section
  if (currentSection) {
    parsedSections.push(currentSection)
  }
  
  // Clean up content (remove trailing newlines)
  return parsedSections.map(section => ({
    ...section,
    content: section.content.trim()
  }))
}

// Convert sections back to markdown with better formatting
const sectionsToMarkdown = (sections: Array<{ id: string; type: string; title: string; content: string }>) => {
  return sections.map(section => {
    const title = section.title === 'Introduction' ? '' : `# ${section.title}\n\n`
    const content = htmlToMarkdown(section.content)
    return title + content
  }).filter(section => section.trim()).join('\n\n')
}

// Convert sections to traditional HTML
const sectionsToTraditional = (sections: Array<{ id: string; type: string; title: string; content: string }>) => {
  return sections.map(section => {
    const title = section.title === 'Introduction' ? '' : `<h1>${section.title}</h1>`
    const content = marked(section.content)
    return title + content
  }).join('')
}

// Parse traditional HTML back to sections (enhanced)
const traditionalToSections = (htmlContent: string) => {
  if (!htmlContent.trim()) return [{ id: 'section-intro', type: 'text', title: 'Introduction', content: '' }]
  
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = htmlContent
  
  const sections: Array<{ id: string; type: string; title: string; content: string }> = []
  let currentSection = { id: 'section-intro', type: 'text', title: 'Introduction', content: '' }
  let hasIntroContent = false
  
  Array.from(tempDiv.children).forEach((element) => {
    if (element.tagName === 'H1') {
      // Save previous section if it has content
      if (currentSection.content.trim()) {
        sections.push(currentSection)
      }
      // Start new section
      currentSection = {
        id: `section-${Date.now()}-${sections.length + 1}`,
        type: 'text',
        title: element.textContent || `Section ${sections.length + 1}`,
        content: ''
      }
      hasIntroContent = true
    } else {
      // Add content to current section
      if (currentSection.title === 'Introduction' && !hasIntroContent) {
        hasIntroContent = true
      }
      currentSection.content += element.outerHTML
    }
  })
  
  // Add final section if it has content
  if (currentSection.content.trim() || currentSection.title !== 'Introduction') {
    sections.push(currentSection)
  }
  
  return sections.length > 0 ? sections : [{
    id: 'section-intro',
    type: 'text', 
    title: 'Introduction',
    content: htmlContent
  }]
}

// Convert HTML content to markdown
const htmlToMarkdown = (htmlContent: string) => {
  try {
    return turndownService.turndown(htmlContent)
  } catch (error) {
    console.error('HTML to markdown conversion error:', error)
    return htmlContent
  }
}

type EditorMode = 'traditional' | 'sectioned' | 'markdown'

interface BlogData {
  title: string
  slug: string
  excerpt: string
  content: string
  featuredImage: string
  metaTitle: string
  metaDescription: string
  keywords: string[]
  status: string
  blogType: BlogType
}

interface AccessibleBlogEditorProps {
  mode: 'create' | 'edit'
  blogId?: string
}

export default function AccessibleBlogEditor({ mode, blogId }: AccessibleBlogEditorProps) {
  const [editorMode, setEditorMode] = useState<EditorMode>('traditional')
  const [blogData, setBlogData] = useState<BlogData>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    metaTitle: '',
    metaDescription: '',
    keywords: [],
    status: 'DRAFT',
    blogType: 'BLOG'
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [sections, setSections] = useState([
    { id: '1', type: 'text', title: 'Introduction', content: '' }
  ])
  const [markdownContent, setMarkdownContent] = useState('# Your Blog Title\n\nStart writing your content here...')
  const router = useRouter()
  const traditionalEditorRef = useRef<HTMLDivElement>(null)

  // Load existing blog data when in edit mode
  useEffect(() => {
    if (mode === 'edit' && blogId) {
      const loadBlogData = async () => {
        setIsLoading(true)
        try {
          const response = await fetch(`/api/admin/blogs/by-id/${blogId}`)
          if (response.ok) {
            const data = await response.json()
            
            // Transform the data to match BlogData interface
            setBlogData({
              title: data.title || '',
              slug: data.slug || '',
              excerpt: data.excerpt || '',
              content: data.content || '',
              featuredImage: data.featuredImage || '',
              metaTitle: data.metaTitle || '',
              metaDescription: data.metaDescription || '',
              keywords: data.keywords || [],
              status: data.status || 'DRAFT',
              blogType: data.blogType || 'BLOG'
            })

            // Set appropriate editor mode based on content type
            if (data.contentType === 'MARKDOWN') {
              setEditorMode('markdown')
              setMarkdownContent(data.content || '# Your Blog Title\n\nStart writing your content here...')
            } else if (data.contentType === 'SECTIONED') {
              setEditorMode('sectioned')
              if (data.contentData?.sections) {
                setSections(data.contentData.sections)
              }
            } else {
              setEditorMode('traditional')
            }
          } else {
            console.error('Failed to load blog data')
          }
        } catch (error) {
          console.error('Error loading blog data:', error)
        } finally {
          setIsLoading(false)
        }
      }

      loadBlogData()
    }
  }, [mode, blogId])

  // Sync sections when markdown content changes
  useEffect(() => {
    if (editorMode === 'markdown') {
      const parsedSections = parseMarkdownToSections(markdownContent)
      if (parsedSections.length > 0) {
        setSections(parsedSections)
        // Also update traditional content
        const traditionalContent = sectionsToTraditional(parsedSections)
        setBlogData(prev => ({ ...prev, content: traditionalContent }))
      }
    }
  }, [markdownContent, editorMode])

  // Sync markdown and traditional when sections change
  useEffect(() => {
    if (editorMode === 'sectioned') {
      const markdownContent = sectionsToMarkdown(sections)
      setMarkdownContent(markdownContent)
      const traditionalContent = sectionsToTraditional(sections)
      setBlogData(prev => ({ ...prev, content: traditionalContent }))
    }
  }, [sections, editorMode])

  // Sync sections when traditional content changes
  useEffect(() => {
    if (editorMode === 'traditional' && blogData.content) {
      const parsedSections = traditionalToSections(blogData.content)
      setSections(parsedSections)
      const markdownContent = sectionsToMarkdown(parsedSections)
      setMarkdownContent(markdownContent)
    }
  }, [blogData.content, editorMode])

  // Initialize traditional editor content (with debounce to prevent conflicts)
  useEffect(() => {
    if (traditionalEditorRef.current && editorMode === 'traditional') {
      const editor = traditionalEditorRef.current;
      
      // Only update if content is different and editor is not focused
      if (document.activeElement !== editor) {
        if (blogData.content && editor.innerHTML !== blogData.content) {
          const cursorPosition = getCursorPosition(editor);
          editor.innerHTML = blogData.content;
          setCursorPosition(editor, cursorPosition);
        } else if (!blogData.content && !editor.textContent?.trim()) {
          editor.innerHTML = '<p class="text-gray-600 italic">Start writing your blog post here... This editor provides a page-like writing experience similar to Google Docs or Microsoft Word.</p>';
        }
      }
    }
  }, [blogData.content, editorMode])

  // Helper functions for cursor position management
  const getCursorPosition = (element: HTMLDivElement): number => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      return preCaretRange.toString().length;
    }
    return 0;
  };

  const setCursorPosition = (element: HTMLDivElement, position: number) => {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let currentPosition = 0;
    let node;
    
    while ((node = walker.nextNode())) {
      const textNode = node as Text;
      const nodeLength = textNode.textContent?.length || 0;
      
      if (currentPosition + nodeLength >= position) {
        const range = document.createRange();
        const selection = window.getSelection();
        range.setStart(textNode, position - currentPosition);
        range.collapse(true);
        selection?.removeAllRanges();
        selection?.addRange(range);
        return;
      }
      currentPosition += nodeLength;
    }
  };

  const handleMetadataChange = useCallback((field: string, value: string | string[]) => {
    setBlogData(prev => ({
      ...prev,
      [field]: value
    }))

    // Auto-generate slug from title
    if (field === 'title' && typeof value === 'string' && !blogData.slug) {
      const generatedSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      
      setBlogData(prev => ({
        ...prev,
        slug: generatedSlug
      }))
    }
  }, [blogData.slug])

  const handleSave = async (publish = false) => {
    if (!blogData.title || !blogData.slug) {
      alert('Please fill in the title and slug fields')
      return
    }

    setIsSaving(true)
    
    try {
      let finalContent = ''
      let contentType = 'TRADITIONAL'
      let contentData = null

      // Prepare content based on editor mode
      if (editorMode === 'traditional') {
        finalContent = blogData.content || ''
        contentType = 'TRADITIONAL'
        contentData = {
          type: 'traditional',
          content: finalContent,
          format: 'html'
        }
      } else if (editorMode === 'sectioned') {
        contentType = 'SECTIONED'
        contentData = {
          type: 'sectioned',
          sections: sections.map(section => ({
            id: section.id,
            type: section.type,
            title: section.title,
            content: section.content,
            order: sections.indexOf(section),
            metadata: {}
          }))
        }
        finalContent = sections.map(s => `<h2>${s.title}</h2><p>${s.content}</p>`).join('')
      } else if (editorMode === 'markdown') {
        finalContent = markdownContent
        contentType = 'MARKDOWN'
        contentData = {
          type: 'markdown',
          content: markdownContent,
          format: 'markdown'
        }
      }

      const payload = {
        title: blogData.title,
        slug: blogData.slug,
        excerpt: blogData.excerpt && blogData.excerpt.length >= 10 
          ? blogData.excerpt 
          : `${blogData.title.substring(0, 100)}...`,
        content: finalContent,
        contentType: contentType,
        contentData: contentData,
        featuredImage: blogData.featuredImage || null,
        metaTitle: blogData.metaTitle || blogData.title,
        metaDescription: blogData.metaDescription || blogData.excerpt,
        keywords: Array.isArray(blogData.keywords) ? blogData.keywords : [],
        status: publish ? 'PUBLISHED' : 'DRAFT',
        blogType: blogData.blogType,
        publishedAt: publish ? new Date().toISOString() : undefined,
        isDraft: !publish
      }

      console.log('Sending payload:', payload)

      const apiUrl = mode === 'edit' && blogId ? `/api/admin/blogs/by-id/${blogId}` : '/api/blog'
      const method = mode === 'edit' && blogId ? 'PUT' : 'POST'

      const response = await fetch(apiUrl, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        await response.json()
        alert(publish ? 'Blog published successfully!' : 'Draft saved successfully!')
        
        // Redirect to blog list or edit page
        router.push('/admin/blog')
      } else {
        const errorData = await response.json()
        console.error('API Error Details:', errorData)
        throw new Error(errorData.message || errorData.error || 'Failed to save blog post')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert(`Failed to save blog post: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const addSection = () => {
    const newSection = {
      id: Date.now().toString(),
      type: 'text',
      title: 'New Section',
      content: ''
    }
    setSections([...sections, newSection])
  }

  const updateSection = (id: string, field: string, value: string) => {
    setSections(sections.map(section => 
      section.id === id ? { ...section, [field]: value } : section
    ))
  }

  const removeSection = (id: string) => {
    if (sections.length > 1) {
      setSections(sections.filter(section => section.id !== id))
    }
  }

  // Markdown rendering function
  const renderMarkdown = (content: string) => {
    try {
      return { __html: marked(content) }
    } catch (error) {
      console.error('Markdown parsing error:', error)
      return { __html: '<p class="text-red-600">Error parsing markdown</p>' }
    }
  }

  // Text formatting functions
  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value)
  }

  const insertText = (text: string) => {
    document.execCommand('insertHTML', false, text)
  }

  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault()
          formatText('bold')
          break
        case 'i':
          e.preventDefault()
          formatText('italic')
          break
        case 'u':
          e.preventDefault()
          formatText('underline')
          break
        case 's':
          e.preventDefault()
          handleSave(false)
          break
      }
    }
  }

  const renderTraditionalEditor = () => (
    <div className="space-y-4">
      <div className="bg-white border-2 border-gray-300 rounded-lg shadow-sm">
        <div className="border-b border-gray-200 p-3 bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {/* Font Size */}
            <select 
              className="px-2 py-1 border border-gray-400 rounded text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onChange={(e) => formatText('fontSize', e.target.value)}
            >
              <option value="1">Small</option>
              <option value="3" selected>Normal</option>
              <option value="4">Medium</option>
              <option value="5">Large</option>
              <option value="6">X-Large</option>
            </select>
            
            <div className="w-px h-6 bg-gray-400 mx-1"></div>
            
            {/* Basic Formatting */}
            <Button 
              variant="outline" 
              size="sm" 
              className="text-gray-800 border-gray-400 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-500 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => formatText('bold')}
              title="Bold (Ctrl+B)"
            >
              <b>B</b>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-gray-800 border-gray-400 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-500 italic focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => formatText('italic')}
              title="Italic (Ctrl+I)"
            >
              <i>I</i>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-gray-800 border-gray-400 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-500 underline focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => formatText('underline')}
              title="Underline (Ctrl+U)"
            >
              <u>U</u>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-gray-800 border-gray-400 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => formatText('strikeThrough')}
              title="Strikethrough"
            >
              <s>S</s>
            </Button>
            
            <div className="w-px h-6 bg-gray-400 mx-1"></div>
            
            {/* Text Color */}
            <input
              type="color"
              className="w-8 h-6 border border-gray-400 rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => formatText('foreColor', e.target.value)}
              title="Text Color"
            />
            <input
              type="color"
              className="w-8 h-6 border border-gray-400 rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => formatText('backColor', e.target.value)}
              title="Highlight Color"
              defaultValue="#ffff00"
            />
            
            <div className="w-px h-6 bg-gray-400 mx-1"></div>
            
            {/* Headings */}
            <Button 
              variant="outline" 
              size="sm" 
              className="text-gray-800 border-gray-400 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-500 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => formatText('formatBlock', 'h1')}
              title="Heading 1"
            >
              H1
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-gray-800 border-gray-400 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-500 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => formatText('formatBlock', 'h2')}
              title="Heading 2"
            >
              H2
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-gray-800 border-gray-400 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-500 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => formatText('formatBlock', 'h3')}
              title="Heading 3"
            >
              H3
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-gray-800 border-gray-400 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => formatText('formatBlock', 'p')}
              title="Paragraph"
            >
              P
            </Button>
            
            <div className="w-px h-6 bg-gray-400 mx-1"></div>
            
            {/* Alignment */}
            <Button 
              variant="outline" 
              size="sm" 
              className="text-gray-800 border-gray-400 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => formatText('justifyLeft')}
              title="Align Left"
            >
              ⟵
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-gray-800 border-gray-400 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => formatText('justifyCenter')}
              title="Align Center"
            >
              ⟄
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-gray-800 border-gray-400 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => formatText('justifyRight')}
              title="Align Right"
            >
              ⟶
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-gray-800 border-gray-400 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => formatText('justifyFull')}
              title="Justify"
            >
              ⟷
            </Button>
            
            <div className="w-px h-6 bg-gray-400 mx-1"></div>
            
            {/* Lists */}
            <Button 
              variant="outline" 
              size="sm" 
              className="text-gray-800 border-gray-400 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => formatText('insertUnorderedList')}
              title="Bullet List"
            >
              • List
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-gray-800 border-gray-400 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => formatText('insertOrderedList')}
              title="Numbered List"
            >
              1. List
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-gray-800 border-gray-400 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => formatText('outdent')}
              title="Decrease Indent"
            >
              ⟨
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-gray-800 border-gray-400 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => formatText('indent')}
              title="Increase Indent"
            >
              ⟩
            </Button>
            
            <div className="w-px h-6 bg-gray-400 mx-1"></div>
            
            {/* Insert Elements */}
            <Button 
              variant="outline" 
              size="sm" 
              className="text-gray-800 border-gray-400 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => {
                const url = prompt('Enter URL:')
                if (url) {
                  const text = prompt('Enter link text:') || url
                  insertText(`<a href="${url}" class="text-blue-700 hover:text-blue-900 underline">${text}</a>`)
                }
              }}
              title="Insert Link"
            >
              🔗 Link
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-gray-800 border-gray-400 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => {
                const url = prompt('Enter image URL:')
                if (url) {
                  const alt = prompt('Enter image description (for accessibility):') || 'Image'
                  insertText(`<img src="${url}" alt="${alt}" class="max-w-full h-auto rounded-lg shadow-sm" />`)
                }
              }}
              title="Insert Image"
            >
              🖼️ Image
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-gray-800 border-gray-400 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => insertText('<blockquote class="border-l-4 border-gray-400 pl-4 italic text-gray-800 my-4">Quote text here</blockquote>')}
              title="Insert Quote"
            >
              💬 Quote
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-gray-800 border-gray-400 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => insertText('<hr class="my-8 border-gray-400" />')}
              title="Insert Horizontal Line"
            >
              ➖ Line
            </Button>
          </div>
        </div>
        <div className="p-6">
          {isPreviewMode ? (
            <div 
              className="min-h-[500px] prose prose-lg max-w-none text-gray-900 leading-relaxed"
              style={{ 
                lineHeight: '1.8',
                fontSize: '16px',
                color: '#111827',
                fontFamily: '"Inter", "Georgia", serif'
              }}
              dangerouslySetInnerHTML={{ __html: blogData.content || '<p class="text-gray-600 italic">No content to preview</p>' }}
            />
          ) : (
            <div 
              ref={traditionalEditorRef}
              contentEditable
              className="min-h-[500px] prose prose-lg max-w-none focus:outline-none text-gray-900 leading-relaxed focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded-lg p-2"
              style={{ 
                lineHeight: '1.8',
                fontSize: '16px',
                color: '#111827',
                fontFamily: '"Inter", "Georgia", serif'
              }}
              onKeyDown={handleKeyDown}
              onInput={(e) => {
                const target = e.currentTarget as HTMLDivElement;
                setBlogData(prev => ({ ...prev, content: target.innerHTML }));
              }}
              onFocus={(e) => {
                const target = e.currentTarget as HTMLDivElement;
                if (target.textContent?.includes('Start writing your blog post here')) {
                  target.innerHTML = '<p><br></p>';
                  // Set cursor to the beginning of the paragraph
                  const range = document.createRange();
                  const selection = window.getSelection();
                  if (target.firstChild?.firstChild) {
                    range.setStart(target.firstChild.firstChild, 0);
                  } else {
                    range.setStart(target, 0);
                  }
                  range.collapse(true);
                  selection?.removeAllRanges();
                  selection?.addRange(range);
                }
              }}
              onBlur={(e) => {
                const target = e.currentTarget as HTMLDivElement;
                if (!target.textContent?.trim()) {
                  target.innerHTML = '<p class="text-gray-600 italic">Start writing your blog post here... This editor provides a page-like writing experience similar to Google Docs or Microsoft Word.</p>';
                  setBlogData(prev => ({ ...prev, content: '' }));
                }
              }}
              suppressContentEditableWarning={true}
            />
          )}
        </div>
      </div>
    </div>
  )

  const renderSectionFormattingToolbar = (sectionId: string) => (
    <div className="border-b border-gray-200 p-3 bg-gray-50">
      <div className="flex flex-wrap gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => formatSectionText(sectionId, 'bold')}
          className="h-8 px-2 text-xs font-semibold hover:bg-gray-200"
          title="Bold"
        >
          <Bold className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => formatSectionText(sectionId, 'italic')}
          className="h-8 px-2 text-xs font-semibold hover:bg-gray-200"
          title="Italic"
        >
          <Italic className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => formatSectionText(sectionId, 'underline')}
          className="h-8 px-2 text-xs font-semibold hover:bg-gray-200"
          title="Underline"
        >
          <Underline className="h-3 w-3" />
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => formatSectionText(sectionId, 'insertOrderedList')}
          className="h-8 px-2 text-xs font-semibold hover:bg-gray-200"
          title="Numbered List"
        >
          <List className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => formatSectionText(sectionId, 'insertUnorderedList')}
          className="h-8 px-2 text-xs font-semibold hover:bg-gray-200"
          title="Bullet List"
        >
          <ListOrdered className="h-3 w-3" />
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => formatSectionText(sectionId, 'justifyLeft')}
          className="h-8 px-2 text-xs font-semibold hover:bg-gray-200"
          title="Align Left"
        >
          <AlignLeft className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => formatSectionText(sectionId, 'justifyCenter')}
          className="h-8 px-2 text-xs font-semibold hover:bg-gray-200"
          title="Align Center"
        >
          <AlignCenter className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => formatSectionText(sectionId, 'justifyRight')}
          className="h-8 px-2 text-xs font-semibold hover:bg-gray-200"
          title="Align Right"
        >
          <AlignRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )

  const formatSectionText = (sectionId: string, command: string) => {
    const sectionElement = document.querySelector(`[data-section-id="${sectionId}"]`) as HTMLDivElement;
    if (sectionElement) {
      sectionElement.focus();
      document.execCommand(command, false, '');
      
      // Update the section content
      const updatedContent = sectionElement.innerHTML;
      updateSection(sectionId, 'content', updatedContent);
    }
  }

  const renderSectionedEditor = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Blog Sections</h3>
        <Button onClick={addSection} className="bg-blue-600 hover:bg-blue-700 text-white">
          + Add Section
        </Button>
      </div>
      
      {sections.map((section, index) => (
        <div key={section.id} className="bg-white border-2 border-gray-300 rounded-lg shadow-sm">
          <div className="border-b border-gray-200 p-4 bg-gray-50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                Section {index + 1}
              </span>
              <input
                type="text"
                value={section.title}
                onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                className="text-lg font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0"
                placeholder="Section title..."
              />
            </div>
            {sections.length > 1 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => removeSection(section.id)}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Remove
              </Button>
            )}
          </div>
          
          {renderSectionFormattingToolbar(section.id)}
          
          <div className="p-6">
            <div
              contentEditable
              data-section-id={section.id}
              className="w-full min-h-48 p-4 border-2 border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none prose prose-lg max-w-none"
              style={{ 
                fontSize: '16px',
                lineHeight: '1.6',
                fontFamily: '"Inter", sans-serif'
              }}
              onInput={(e) => {
                const target = e.currentTarget as HTMLDivElement;
                updateSection(section.id, 'content', target.innerHTML);
              }}
              onFocus={(e) => {
                const target = e.currentTarget as HTMLDivElement;
                if (target.innerHTML.includes('Write the content for this section')) {
                  target.innerHTML = '';
                }
              }}
              onBlur={(e) => {
                const target = e.currentTarget as HTMLDivElement;
                if (!target.innerHTML.trim() || target.innerHTML.trim() === '<br>') {
                  target.innerHTML = '<p class="text-gray-500 italic">Write the content for this section...</p>';
                  updateSection(section.id, 'content', '');
                }
              }}
              suppressContentEditableWarning={true}
              dangerouslySetInnerHTML={
                section.content ? 
                  { __html: section.content } : 
                  { __html: '<p class="text-gray-500 italic">Write the content for this section...</p>' }
              }
            />
          </div>
        </div>
      ))}
    </div>
  )

  const renderMarkdownEditor = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-3">Markdown Editor</label>
        <div className="bg-white border-2 border-gray-300 rounded-lg shadow-sm">
          <div className="border-b border-gray-200 p-3 bg-gray-50">
            <div className="flex gap-2 text-sm text-gray-600">
              <span className="bg-gray-200 px-2 py-1 rounded"># Heading</span>
              <span className="bg-gray-200 px-2 py-1 rounded">**Bold**</span>
              <span className="bg-gray-200 px-2 py-1 rounded">*Italic*</span>
              <span className="bg-gray-200 px-2 py-1 rounded">[Link](url)</span>
            </div>
          </div>
          <textarea
            value={markdownContent}
            onChange={(e) => setMarkdownContent(e.target.value)}
            className="w-full h-[500px] p-6 text-gray-900 bg-white focus:outline-none resize-none font-mono"
            style={{ 
              fontSize: '14px',
              lineHeight: '1.6',
              fontFamily: '"Fira Code", "Monaco", monospace'
            }}
            placeholder="# Your Blog Title

## Introduction

Write your content in **markdown** format. This editor provides syntax highlighting and live preview."
          />
        </div>
      </div>
      
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-3">Live Preview</label>
        <div className="bg-white border-2 border-gray-300 rounded-lg shadow-sm">
          <div 
            className="p-6 h-[560px] overflow-y-auto prose prose-lg max-w-none text-gray-900"
            dangerouslySetInnerHTML={renderMarkdown(markdownContent)}
          />
        </div>
      </div>
    </div>
  )

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

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className="text-gray-700 border-gray-300 hover:bg-gray-100"
              >
                <Eye className="h-4 w-4 mr-2" />
                {isPreviewMode ? 'Edit' : 'Preview'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSave(false)}
                disabled={isSaving}
                className="text-gray-700 border-gray-300 hover:bg-gray-100"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Draft'}
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={() => handleSave(true)}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
              >
                Publish
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-600">Loading blog data...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Editor Section */}
          <div className="lg:col-span-3">
            
            {/* Blog Metadata */}
            <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 mb-6">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Blog Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={blogData.title}
                      onChange={(e) => handleMetadataChange('title', e.target.value)}
                      placeholder="Enter your blog post title..."
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      style={{ fontSize: '16px' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      URL Slug
                    </label>
                    <input
                      type="text"
                      value={blogData.slug}
                      onChange={(e) => handleMetadataChange('slug', e.target.value)}
                      placeholder="url-friendly-slug"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      style={{ fontSize: '16px' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Excerpt
                    </label>
                    <textarea
                      value={blogData.excerpt}
                      onChange={(e) => handleMetadataChange('excerpt', e.target.value)}
                      placeholder="Brief description of your blog post..."
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      style={{ fontSize: '16px', lineHeight: '1.5' }}
                    />
                  </div>
                </div>
              </div>

              {/* Editor Mode Tabs */}
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Editing Mode</h3>
                <Tabs value={editorMode} onValueChange={(mode) => setEditorMode(mode as EditorMode)}>
                  <TabsList className="grid w-full grid-cols-3 bg-white border-2 border-gray-300 rounded-lg p-1">
                    <TabsTrigger 
                      value="traditional"
                      className="flex items-center gap-2 px-4 py-3 text-gray-700 font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-all"
                    >
                      <FileText className="h-4 w-4" />
                      Traditional
                      <span className="text-xs opacity-75">(Word-like)</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="sectioned"
                      className="flex items-center gap-2 px-4 py-3 text-gray-700 font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-all"
                    >
                      <LayoutGrid className="h-4 w-4" />
                      Sectioned
                      <span className="text-xs opacity-75">(Blocks)</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="markdown"
                      className="flex items-center gap-2 px-4 py-3 text-gray-700 font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-all"
                    >
                      <Code2 className="h-4 w-4" />
                      Markdown
                      <span className="text-xs opacity-75">(Code)</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Editor Content */}
              <div className="p-6">
                {editorMode === 'traditional' && renderTraditionalEditor()}
                {editorMode === 'sectioned' && renderSectionedEditor()}
                {editorMode === 'markdown' && renderMarkdownEditor()}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              
              {/* Publishing Status */}
              <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Publishing</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Status
                    </label>
                    <select
                      value={blogData.status}
                      onChange={(e) => handleMetadataChange('status', e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ fontSize: '16px' }}
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Blog Type
                    </label>
                    <select
                      value={blogData.blogType}
                      onChange={(e) => handleMetadataChange('blogType', e.target.value as BlogType)}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ fontSize: '16px' }}
                    >
                      <option value="BLOG">Blog</option>
                      <option value="REVIEW">Review</option>
                      <option value="DESCRIPTION">Description</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SEO Settings */}
              <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">SEO Settings</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Meta Title
                    </label>
                    <input
                      type="text"
                      value={blogData.metaTitle}
                      onChange={(e) => handleMetadataChange('metaTitle', e.target.value)}
                      placeholder="SEO title..."
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ fontSize: '14px' }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Meta Description
                    </label>
                    <textarea
                      value={blogData.metaDescription}
                      onChange={(e) => handleMetadataChange('metaDescription', e.target.value)}
                      placeholder="SEO description..."
                      rows={3}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      style={{ fontSize: '14px' }}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
        )}
      </div>
    </div>
  )
}