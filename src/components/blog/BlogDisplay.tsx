'use client'

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Eye, User, Calendar, Tag } from 'lucide-react';
import { MarkdownSectionParser } from '@/lib/markdownParser';

interface BlogSection {
  id: string;
  type: string;
  title: string;
  content: string;
  order: number;
}

interface BlogDisplayProps {
  blog: {
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    content?: string;
    sections?: BlogSection[];
    featuredImage?: string;
    author: {
      name: string;
      avatar?: string;
    };
    publishedAt: string;
    views?: number;
    categories: Array<{ name: string; slug: string }>;
    tags: Array<{ name: string; slug: string }>;
  };
  showMetadata?: boolean;
  showExcerpt?: boolean;
}

// Section type to emoji mapping
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

const BlogDisplay: React.FC<BlogDisplayProps> = ({ 
  blog, 
  showMetadata = true, 
  showExcerpt = true 
}) => {
  // Determine if this is a sectioned blog
  const isSectionedBlog = blog.sections && blog.sections.length > 0;
  
  // Sort sections by order
  const sortedSections = isSectionedBlog && blog.sections
    ? [...blog.sections].sort((a, b) => a.order - b.order)
    : [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <article className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Featured Image */}
      {blog.featuredImage && (
        <div className="relative w-full h-64 md:h-96">
          <Image
            src={blog.featuredImage}
            alt={blog.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      <div className="p-6 md:p-8">
        {/* Blog Header */}
        <header className="mb-8">
          {/* Categories */}
          {blog.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {blog.categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/category/${category.slug}`}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full hover:bg-blue-200 transition-colors"
                >
                  <Tag className="w-3 h-3" />
                  {category.name}
                </Link>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight">
            {blog.title}
          </h1>

          {/* Excerpt */}
          {showExcerpt && blog.excerpt && (
            <p className="text-xl text-slate-600 mb-6 leading-relaxed">
              {blog.excerpt}
            </p>
          )}

          {/* Metadata */}
          {showMetadata && (
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>By {blog.author.name}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <time dateTime={blog.publishedAt}>
                  {formatDate(blog.publishedAt)}
                </time>
              </div>

              {blog.views && (
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span>{blog.views.toLocaleString()} views</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{Math.ceil((blog.content?.length || 0) / 200)} min read</span>
              </div>
            </div>
          )}
        </header>

        {/* Blog Content */}
        <div className="prose prose-lg max-w-none text-slate-800">
          {isSectionedBlog ? (
            // Render sectioned blog
            <div className="space-y-8">
              {sortedSections.map((section) => (
                <section key={section.id} className="section-block">
                  {/* Section Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">
                      {sectionIcons[section.type] || '📄'}
                    </span>
                    <h2 className="text-2xl font-bold text-slate-900 border-l-4 border-blue-500 pl-4">
                      {section.title}
                    </h2>
                  </div>
                  
                  {/* Section Content */}
                  <div 
                    className="section-content prose prose-lg max-w-none text-slate-800"
                    dangerouslySetInnerHTML={{ __html: MarkdownSectionParser.markdownToHtml(section.content) }}
                  />
                </section>
              ))}
            </div>
          ) : (
            // Render traditional blog
            <div 
              className="traditional-content prose prose-lg max-w-none text-slate-800"
              dangerouslySetInnerHTML={{ __html: MarkdownSectionParser.markdownToHtml(blog.content || '') }}
            />
          )}
        </div>

        {/* Tags */}
        {blog.tags.length > 0 && (
          <footer className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-slate-700 mr-2">Tags:</span>
              {blog.tags.map((tag) => (
                <Link
                  key={tag.slug}
                  href={`/tag/${tag.slug}`}
                  className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full hover:bg-slate-200 transition-colors"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          </footer>
        )}
      </div>

      {/* Blog Type Indicator (for admin/debug) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="px-6 pb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
            {isSectionedBlog ? '📄 Sectioned Blog' : '📝 Traditional Blog'}
            {isSectionedBlog && (
              <span className="ml-1">({sortedSections.length} sections)</span>
            )}
          </div>
        </div>
      )}
    </article>
  );
};

export default BlogDisplay;