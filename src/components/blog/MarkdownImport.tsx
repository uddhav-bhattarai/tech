'use client'

import React, { useState } from 'react';
import { MarkdownSectionParser, ParsedSection } from '@/lib/markdownParser';
import { FileText, Eye, Download, Upload, AlertCircle, CheckCircle } from 'lucide-react';

interface MarkdownImportProps {
  onImport: (sections: ParsedSection[]) => void;
  onCancel: () => void;
}

const sectionIcons: Record<string, string> = {
  title_meta: '📝',
  hero: '🎯',
  overview: '📋',
  highlights: '⭐',
  pricing: '💰',
  design: '🎨',
  display: '📺',
  performance: '⚡',
  camera: '📸',
  battery: '🔋',
  pros_cons: '⚖️',
  comparison: '🔄',
  verdict: '🎯',
  specs_table: '📊',
  custom: '✨'
};

const MarkdownImport: React.FC<MarkdownImportProps> = ({ onImport, onCancel }) => {
  const [markdownInput, setMarkdownInput] = useState('');
  const [parsedSections, setParsedSections] = useState<ParsedSection[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<{
    wordCount: number;
    estimatedReadTime: number;
    hasImages: boolean;
    hasTables: boolean;
    hasCodeBlocks: boolean;
  } | null>(null);

  const handleParse = async () => {
    if (!markdownInput.trim()) {
      setError('Please enter some markdown content to parse.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = MarkdownSectionParser.parseMarkdown(markdownInput);
      setParsedSections(result.sections);
      setMetadata(result.metadata);
    } catch (err) {
      setError('Failed to parse markdown content. Please check your formatting.');
      console.error('Markdown parsing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportSections = () => {
    if (parsedSections.length > 0) {
      onImport(parsedSections);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/markdown') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setMarkdownInput(content);
      };
      reader.readAsText(file);
    } else {
      setError('Please select a valid markdown file (.md).');
    }
  };

  const sampleMarkdown = `# Samsung Galaxy S24 Ultra Review: The Ultimate Flagship

## Overview
The Samsung Galaxy S24 Ultra represents the pinnacle of Android smartphone technology, combining premium design with cutting-edge features.

## Key Highlights
- 6.8" QHD+ AMOLED display with 120Hz refresh rate
- Snapdragon 8 Gen 3 for Galaxy processor
- Quad camera system with 200MP main sensor
- S Pen integration for productivity
- 5000mAh battery with fast charging

## Pricing
| Variant | Price (NPR) |
|---------|-------------|
| 8GB + 128GB | 44,999 |
| 12GB + 256GB | 49,999 |
| 12GB + 512GB | 54,999 |

## Performance
The Snapdragon 8 Gen 3 for Galaxy delivers exceptional performance across all tasks. Gaming, multitasking, and professional applications run smoothly without any noticeable lag.

## Camera System
The 200MP main camera captures stunning detail in all lighting conditions. The versatile zoom system with 3x and 5x telephoto lenses provides professional photography capabilities.

## Pros and Cons
**✅ Pros:**
- Outstanding display quality
- Powerful performance
- Versatile camera system
- Premium build quality

**❌ Cons:**
- High price point
- Large size may not suit everyone
- No charger in the box

## Verdict
The Galaxy S24 Ultra is the best Android flagship for power users who want the ultimate smartphone experience. Despite the high price, it delivers exceptional value for professionals and tech enthusiasts.`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Import from Markdown
                </h2>
                <p className="text-sm text-slate-600">
                  Paste markdown content to automatically organize into blog sections
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Input Panel */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-slate-900">Markdown Input</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMarkdownInput(sampleMarkdown)}
                    className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Load Sample
                  </button>
                  <label className="text-xs px-3 py-1 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors cursor-pointer">
                    <Upload className="w-3 h-3 inline mr-1" />
                    Upload .md
                    <input
                      type="file"
                      accept=".md,.markdown"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm mb-3">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={handleParse}
                  disabled={isProcessing || !markdownInput.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  {isProcessing ? 'Processing...' : 'Parse & Preview'}
                </button>

                {parsedSections.length > 0 && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    {parsedSections.length} sections detected
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 p-4">
              <textarea
                value={markdownInput}
                onChange={(e) => setMarkdownInput(e.target.value)}
                placeholder="Paste your markdown content here..."
                className="w-full h-full resize-none border border-gray-300 rounded-lg p-3 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Preview Panel */}
          <div className="w-1/2 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-slate-900">Section Preview</h3>
              {metadata && (
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-600">
                  <span>📊 {parsedSections.length} sections</span>
                  <span>📝 {metadata.wordCount} words</span>
                  <span>⏱️ {metadata.estimatedReadTime} min read</span>
                  {metadata.hasImages && <span>🖼️ Images</span>}
                  {metadata.hasTables && <span>📋 Tables</span>}
                  {metadata.hasCodeBlocks && <span>💻 Code</span>}
                </div>
              )}
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              {parsedSections.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center">
                  <div>
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No sections detected</p>
                    <p className="text-sm text-gray-400">
                      Add some markdown content and click &ldquo;Parse &amp; Preview&rdquo;
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {parsedSections.map((section, index) => (
                    <div
                      key={section.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">
                          {sectionIcons[section.type] || '📄'}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-slate-900">
                              {section.title}
                            </h4>
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded">
                              {section.type.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            Section {index + 1} • Order: {section.order}
                          </p>
                        </div>
                      </div>
                      
                      <div 
                        className="prose prose-sm max-w-none text-slate-700"
                        dangerouslySetInnerHTML={{ 
                          __html: section.content.length > 200 
                            ? section.content.substring(0, 200) + '...' 
                            : section.content 
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            {parsedSections.length > 0 ? (
              `Ready to import ${parsedSections.length} sections into your blog editor`
            ) : (
              'Parse your markdown content to see the section preview'
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImportSections}
              disabled={parsedSections.length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-4 h-4" />
              Import Sections
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkdownImport;