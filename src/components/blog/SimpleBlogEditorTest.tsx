/**
 * Simple Blog Editor Test Component
 * Test component to verify tabs and editor functionality
 */

'use client'

import React, { useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { DocumentTextIcon, Squares2X2Icon, CodeBracketIcon } from '@heroicons/react/24/outline'

export default function SimpleBlogEditorTest() {
  const [currentMode, setCurrentMode] = useState('traditional')

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Editor Mode Test</h2>
      
      {/* Mode Switcher */}
      <div className="mb-6">
        <Tabs value={currentMode} onValueChange={setCurrentMode} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger 
              value="traditional" 
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              <DocumentTextIcon className="h-4 w-4" />
              Traditional
            </TabsTrigger>
            <TabsTrigger 
              value="sectioned"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              <Squares2X2Icon className="h-4 w-4" />
              Sectioned
            </TabsTrigger>
            <TabsTrigger 
              value="markdown"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              <CodeBracketIcon className="h-4 w-4" />
              Markdown
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Current Mode Display */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800 font-medium">
          Current Mode: <span className="font-bold">{currentMode}</span>
        </p>
      </div>

      {/* Test Editor Area */}
      <div className="mt-6 border border-gray-300 rounded-lg p-4 min-h-[300px] bg-white">
        {currentMode === 'traditional' && (
          <div className="prose max-w-none">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Traditional Editor (MS Word-like)</h3>
            <textarea
              className="w-full h-64 p-4 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Start typing your blog post content here..."
            />
          </div>
        )}
        
        {currentMode === 'sectioned' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sectioned Editor (Block-based)</h3>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <p className="text-gray-700">Section 1: Text Block</p>
                <textarea
                  className="w-full mt-2 p-3 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter section content..."
                  rows={4}
                />
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                + Add Section
              </button>
            </div>
          </div>
        )}
        
        {currentMode === 'markdown' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Markdown Editor</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Markdown Input</label>
                <textarea
                  className="w-full h-64 p-4 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none"
                  placeholder="# Your Title

## Section

Write your content in **markdown** format..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Live Preview</label>
                <div className="h-64 p-4 border border-gray-300 rounded-md bg-gray-50 overflow-y-auto prose prose-sm max-w-none">
                  <h1>Your Title</h1>
                  <h2>Section</h2>
                  <p>Write your content in <strong>markdown</strong> format...</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}