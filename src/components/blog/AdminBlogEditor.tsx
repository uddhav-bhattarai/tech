'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Save, Eye, Trash2, Upload, Tag, Calendar } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import { MarkdownSectionParser } from '@/lib/markdownParser';

interface BlogEditorProps {
  initialData?: {
    title?: string;
    slug?: string;
    content?: string;
    excerpt?: string;
    featuredImage?: string;
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    status?: string;
    publishedAt?: string;
  };
  mode: 'create' | 'edit';
  slug?: string;
}

const defaultBlog = {
  title: '',
  slug: '',
  content: '',
  excerpt: '',
  featuredImage: '',
  metaTitle: '',
  metaDescription: '',
  keywords: [] as string[],
  status: 'DRAFT',
  publishedAt: '',
};

const AdminBlogEditor: React.FC<BlogEditorProps> = ({ initialData, mode, slug }) => {
  const [blog, setBlog] = useState(initialData || defaultBlog);
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchBlogData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/blogs/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setBlog({
          title: data.blog.title || '',
          slug: data.blog.slug || '',
          content: data.blog.content || '',
          excerpt: data.blog.excerpt || '',
          featuredImage: data.blog.featuredImage || '',
          metaTitle: data.blog.metaTitle || '',
          metaDescription: data.blog.metaDescription || '',
          keywords: data.blog.keywords || [],
          status: data.blog.status || 'DRAFT',
          publishedAt: data.blog.publishedAt || ''
        });
      } else {
        setError('Failed to load blog data');
      }
    } catch (err) {
      console.error('Error fetching blog:', err);
      setError('Failed to load blog data');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (mode === 'edit' && slug && !initialData) {
      fetchBlogData();
    }
  }, [mode, slug, initialData, fetchBlogData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'keywords') {
      setBlog({ ...blog, [name]: value.split(',').map(k => k.trim()) });
    } else if (name === 'title' && !blog.slug) {
      // Auto-generate slug from title
      const generatedSlug = value.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setBlog({ ...blog, [name]: value, slug: generatedSlug });
    } else {
      setBlog({ ...blog, [name]: value });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const blogData = {
        ...blog,
        newSlug: blog.slug,
        publishedAt: blog.status === 'PUBLISHED' ? blog.publishedAt || new Date().toISOString() : null
      };

      const url = mode === 'create' ? '/api/admin/blogs' : `/api/admin/blogs/${slug}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(blogData),
      });

      if (response.ok) {
        router.push('/admin/blog');
        router.refresh();
      } else {
        const errorData = await response.json();
        setError(errorData.error || `Failed to ${mode} blog post`);
      }
    } catch (err) {
      console.error(`Error ${mode}ing blog:`, err);
      setError(`Failed to ${mode} blog post`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/admin/blogs/${slug}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/admin/blog');
        router.refresh();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete blog post');
      }
    } catch (err) {
      console.error('Error deleting blog:', err);
      setError('Failed to delete blog post');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => router.back()} 
            className="inline-flex items-center gap-2 text-slate-800 hover:text-blue-700 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" /> 
            Back to Blog Management
          </button>
          
          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={() => setPreview(!preview)} 
              className="inline-flex items-center gap-2 bg-slate-200 text-slate-900 px-6 py-2 rounded-xl font-semibold border border-slate-400 hover:bg-slate-300 transition-all"
            >
              <Eye className="w-4 h-4" /> 
              {preview ? 'Hide Preview' : 'Preview'}
            </button>
            
            {mode === 'edit' && (
              <button 
                type="button" 
                onClick={handleDelete}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-6 py-2 rounded-xl font-medium border border-red-300 hover:bg-red-200 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" /> 
                Delete
              </button>
            )}
            
            <button 
              onClick={handleSave} 
              disabled={saving || !blog.title || !blog.slug} 
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-2 rounded-xl font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" /> 
              {saving ? 'Saving...' : (mode === 'create' ? 'Create Post' : 'Update Post')}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        <div className={preview ? "grid grid-cols-1 lg:grid-cols-2 gap-8" : ""}>
          {/* Editor */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">
              {mode === 'create' ? 'Create New Blog Post' : 'Edit Blog Post'}
            </h1>

            <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              {/* Basic Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Title *
                  </label>
                  <input 
                    type="text" 
                    name="title" 
                    value={blog.title} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 bg-white placeholder-slate-500" 
                    required 
                    placeholder="Enter blog title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Slug *
                  </label>
                  <input 
                    type="text" 
                    name="slug" 
                    value={blog.slug} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 bg-white placeholder-slate-500" 
                    required 
                    placeholder="blog-post-url"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Excerpt
                </label>
                <textarea 
                  name="excerpt" 
                  value={blog.excerpt} 
                  onChange={handleChange} 
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 bg-white placeholder-slate-500" 
                  placeholder="Brief description of the blog post"
                />
              </div>

              {/* Featured Image */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Featured Image URL
                </label>
                <div className="flex gap-3">
                  <input 
                    type="url" 
                    name="featuredImage" 
                    value={blog.featuredImage} 
                    onChange={handleChange} 
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 bg-white placeholder-slate-500" 
                    placeholder="https://example.com/image.jpg"
                  />
                  <button 
                    type="button"
                    className="inline-flex items-center gap-2 bg-slate-200 text-slate-900 px-4 py-3 rounded-xl font-semibold border border-slate-400 hover:bg-slate-300 transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    Upload
                  </button>
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Content * (Rich Text Editor)
                </label>
                <RichTextEditor
                  content={blog.content || ''}
                  onChange={(content) => setBlog({ ...blog, content })}
                  placeholder="Start writing your blog post with advanced formatting..."
                />
                <div className="text-xs text-slate-800 mt-2">
                  Use the toolbar above for formatting: bold, italic, headers, lists, links, images, and more.
                </div>
              </div>

              {/* SEO Section */}
              <div className="border-t pt-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  SEO & Metadata
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Meta Title
                    </label>
                    <input 
                      type="text" 
                      name="metaTitle" 
                      value={blog.metaTitle} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 bg-white placeholder-slate-500" 
                      placeholder="SEO title for search engines"
                      maxLength={60}
                    />
                    <div className="text-xs text-slate-800 mt-1">
                      {(blog.metaTitle || '').length}/60 characters
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Meta Description
                    </label>
                    <input 
                      type="text" 
                      name="metaDescription" 
                      value={blog.metaDescription} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 bg-white placeholder-slate-500" 
                      placeholder="SEO description for search engines"
                      maxLength={160}
                    />
                    <div className="text-xs text-slate-800 mt-1">
                      {(blog.metaDescription || '').length}/160 characters
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Keywords
                  </label>
                  <input 
                    type="text" 
                    name="keywords" 
                    value={Array.isArray(blog.keywords) ? blog.keywords.join(', ') : blog.keywords} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 bg-white placeholder-slate-500" 
                    placeholder="technology, mobile, review, samsung (comma separated)"
                  />
                </div>
              </div>

              {/* Publishing Options */}
              <div className="border-t pt-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Publishing Options
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Status
                    </label>
                    <select 
                      name="status" 
                      value={blog.status} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 bg-white"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="SCHEDULED">Scheduled</option>
                    </select>
                  </div>
                  
                  {blog.status === 'PUBLISHED' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Publish Date
                      </label>
                      <input 
                        type="datetime-local" 
                        name="publishedAt" 
                        value={blog.publishedAt ? new Date(blog.publishedAt).toISOString().slice(0, 16) : ''} 
                        onChange={handleChange} 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 bg-white" 
                      />
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Preview */}
          {preview && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Preview</h2>
              
              {blog.featuredImage && (
                <div className="mb-6">
                  <Image 
                    src={blog.featuredImage} 
                    alt={blog.title || 'Featured image'} 
                    width={800}
                    height={400}
                    className="w-full h-64 object-cover rounded-xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div className="prose max-w-none">
                <h1 className="text-4xl font-bold text-slate-900 mb-4">{blog.title || 'Untitled'}</h1>
                {blog.excerpt && (
                  <p className="text-xl text-slate-700 mb-6 italic">{blog.excerpt}</p>
                )}
                <div 
                  className="text-slate-900 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: MarkdownSectionParser.markdownToHtml(blog.content || '') || '<p class="text-slate-600">Start writing your content...</p>' }}
                />
              </div>
              
              {/* SEO Preview */}
              <div className="mt-8 p-4 bg-slate-100 rounded-xl">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">SEO Preview</h3>
                <div className="space-y-2">
                  <div className="text-blue-700 text-lg font-medium">
                    {blog.metaTitle || blog.title || 'Blog Title'}
                  </div>
                  <div className="text-green-700 text-sm">
                    yourdomain.com/blog/{blog.slug || 'blog-slug'}
                  </div>
                  <div className="text-slate-800 text-sm">
                    {blog.metaDescription || blog.excerpt || 'Blog description will appear here...'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBlogEditor;
