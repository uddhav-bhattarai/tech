/**
 * Export Modal
 * Export blog content in different formats
 */

'use client'

import React, { useState, useCallback } from 'react'
import { UnifiedContentData, ExportFormat } from '@/types/content'
import { contentTransformer } from '@/lib/contentTransformer'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  XMarkIcon, 
  DocumentTextIcon, 
  CodeBracketIcon,
  DocumentArrowDownIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface ExportModalProps {
  content: UnifiedContentData
  onClose: () => void
}

export default function ExportModal({ content, onClose }: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('markdown')
  const [isExporting, setIsExporting] = useState(false)
  const [exportedContent, setExportedContent] = useState<string>('')
  
  const formats: Array<{ 
    value: ExportFormat; 
    label: string; 
    icon: React.ComponentType<{ className?: string }>; 
    description: string 
  }> = [
    {
      value: 'markdown',
      label: 'Markdown',
      icon: CodeBracketIcon,
      description: 'Export as .md file'
    },
    {
      value: 'html',
      label: 'HTML',
      icon: DocumentTextIcon,
      description: 'Export as .html file'
    }
  ]

  // Generate export content
  const generateExport = useCallback(async (format: ExportFormat) => {
    setIsExporting(true)
    
    try {
      let exported = ''
      
      switch (format) {
        case 'markdown':
          const markdownContent = contentTransformer.toMarkdown(content)
          exported = markdownContent.content
          break
          
        case 'html':
          const htmlContent = contentTransformer.toTraditional(content)
          exported = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blog Export</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
    h1, h2, h3 { color: #1e293b; }
    img { max-width: 100%; height: auto; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
    th { background-color: #f8fafc; }
  </style>
</head>
<body>
  ${htmlContent.content}
</body>
</html>`
          break
          
        default:
          exported = 'Unsupported format'
      }
      
      setExportedContent(exported)
    } catch (error) {
      console.error('Export failed:', error)
      setExportedContent('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }, [content])

  // Handle format selection
  const handleFormatSelect = useCallback((format: ExportFormat) => {
    setSelectedFormat(format)
    generateExport(format)
  }, [generateExport])

  // Download export
  const handleDownload = useCallback(() => {
    if (!exportedContent) return
    
    const extension = selectedFormat === 'html' ? 'html' : 'md'
    const mimeType = selectedFormat === 'html' ? 'text/html' : 'text/markdown'
    
    const blob = new Blob([exportedContent], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `blog-export.${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [exportedContent, selectedFormat])

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!exportedContent) return
    
    try {
      await navigator.clipboard.writeText(exportedContent)
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }, [exportedContent])

  // Initialize with markdown export
  React.useEffect(() => {
    generateExport('markdown')
  }, [generateExport])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Export Content</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <XMarkIcon className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex h-96">
          {/* Format Selection */}
          <div className="w-64 border-r bg-gray-50 p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Export Format</h3>
            <div className="space-y-2">
              {formats.map((format) => {
                const Icon = format.icon
                return (
                  <button
                    key={format.value}
                    onClick={() => handleFormatSelect(format.value)}
                    className={cn(
                      'w-full p-3 text-left rounded-md border transition-colors',
                      selectedFormat === format.value
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:bg-gray-100'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{format.label}</span>
                      {selectedFormat === format.value && (
                        <Badge variant="default" className="ml-auto">
                          Selected
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">{format.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Export Preview */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
              <span className="text-sm font-medium text-gray-700">
                Preview ({selectedFormat.toUpperCase()})
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!exportedContent}
                >
                  <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
                  Copy
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleDownload}
                  disabled={!exportedContent}
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {isExporting ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500">Generating export...</div>
                </div>
              ) : (
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded border">
                  {exportedContent}
                </pre>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            Content will be exported in {selectedFormat.toUpperCase()} format
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}