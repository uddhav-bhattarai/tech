/**
 * Unified Blog Editor Test Page
 * Test the multi-mode blog editor functionality
 */

'use client'

import React, { useState } from 'react'
import UnifiedBlogEditor from '@/components/blog/UnifiedBlogEditor'
import { UnifiedContentData, EditorMode, UnifiedBlogPost } from '@/types/content'

export default function UnifiedEditorTest() {
  const [savedContent, setSavedContent] = useState<UnifiedContentData | null>(null)
  
  // Test blog post data
  const testBlogPost: Partial<UnifiedBlogPost> = {
    id: 'test-post',
    title: 'Test Blog Post',
    slug: 'test-blog-post',
    excerpt: 'This is a test blog post for the unified editor',
    contentType: 'MARKDOWN',
    contentData: {
      type: 'markdown',
      content: `# Test Blog Post

This is a **test blog post** to demonstrate the unified editor functionality.

## Features Tested

- ✅ Mode switching between Traditional, Sectioned, and Markdown
- ✅ Real-time content transformation
- ✅ Auto-save functionality
- ✅ Export capabilities

## Sample Content

Here's some *sample content* with:

1. **Bold text**
2. *Italic text*
3. \`inline code\`
4. [Links](https://example.com)

\`\`\`javascript
// Code blocks
function example() {
  return "Hello, world!";
}
\`\`\`

> Blockquotes work too!

### Conclusion

The unified editor allows seamless switching between different content formats while preserving data integrity.`
    },
    isDraft: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const handleSave = async (blogPost: UnifiedBlogPost) => {
    console.log('Saving blog post:', blogPost)
    setSavedContent(blogPost.contentData)
    
    // Here you would normally send to API
    // await fetch('/api/blog', { method: 'POST', body: JSON.stringify(blogPost) })
  }

  const handleModeChange = (mode: EditorMode) => {
    console.log('Mode changed to:', mode)
  }

  const handleContentChange = (content: UnifiedContentData) => {
    console.log('Content changed:', content.type, content)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Unified Blog Editor Test
          </h1>
          <p className="text-gray-600">
            Test the seamless multi-mode blog editor with Traditional, Sectioned, and Markdown support.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Editor */}
          <div className="lg:col-span-2">
            <UnifiedBlogEditor
              blogPost={testBlogPost as UnifiedBlogPost}
              mode="markdown"
              onSave={handleSave}
              onModeChange={handleModeChange}
              onContentChange={handleContentChange}
              config={{
                allowModeSwitch: true,
                autoSaveInterval: 5000,
                enableLivePreview: true
              }}
            />
          </div>

          {/* Debug Panel */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Debug Info</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Original Content</h4>
                  <div className="bg-white rounded border p-3 text-xs">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(testBlogPost.contentData, null, 2)}
                    </pre>
                  </div>
                </div>

                {savedContent && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Last Saved</h4>
                    <div className="bg-white rounded border p-3 text-xs">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(savedContent, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Test Instructions</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Switch between editor modes using the tabs</li>
                <li>• Edit content and watch auto-save indicator</li>
                <li>• Try the export functionality</li>
                <li>• Check the debug panel for data flow</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}