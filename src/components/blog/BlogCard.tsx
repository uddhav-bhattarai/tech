'use client'

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Eye, User, Calendar, Tag } from 'lucide-react';

interface BlogSection {
  id: string;
  type: string;
  title: string;
  content: string;
  order: number;
}

interface BlogCardProps {
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
  variant?: 'card' | 'list' | 'featured';
}

const BlogCard: React.FC<BlogCardProps> = ({ blog, variant = 'card' }) => {
  // Determine if this is a sectioned blog
  const isSectionedBlog = blog.sections && blog.sections.length > 0;
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getReadingTime = () => {
    if (isSectionedBlog && blog.sections) {
      const totalContent = blog.sections.reduce((acc, section) => acc + section.content.length, 0);
      return Math.ceil(totalContent / 200);
    }
    return Math.ceil((blog.content?.length || 0) / 200);
  };

  if (variant === 'featured') {
    return (
      <article className="relative bg-white rounded-2xl shadow-xl overflow-hidden group hover:shadow-2xl transition-shadow duration-300">
        {/* Featured Image */}
        <div className="relative h-64 md:h-80">
          {blog.featuredImage ? (
            <Image
              src={blog.featuredImage}
              alt={blog.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-6xl">📱</span>
            </div>
          )}
          
          {/* Blog Type Badge */}
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-black bg-opacity-70 text-white text-xs font-medium rounded-full">
              {isSectionedBlog ? '📄 Review' : '📝 Article'}
            </span>
          </div>

          {/* Categories */}
          <div className="absolute top-4 right-4">
            {blog.categories.slice(0, 1).map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full hover:bg-blue-700 transition-colors"
              >
                <Tag className="w-3 h-3" />
                {category.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
            <Link href={`/blog/${blog.slug}`}>
              {blog.title}
            </Link>
          </h2>

          {blog.excerpt && (
            <p className="text-slate-600 mb-4 line-clamp-3">
              {blog.excerpt}
            </p>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between text-sm text-slate-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{blog.author.name}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <time dateTime={blog.publishedAt}>
                  {formatDate(blog.publishedAt)}
                </time>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {blog.views && (
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{blog.views.toLocaleString()}</span>
                </div>
              )}

              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{getReadingTime()} min</span>
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (variant === 'list') {
    return (
      <article className="flex bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
        {/* Image */}
        <div className="relative w-48 h-32 flex-shrink-0">
          {blog.featuredImage ? (
            <Image
              src={blog.featuredImage}
              alt={blog.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
              <span className="text-2xl">📱</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              {/* Categories */}
              {blog.categories.length > 0 && (
                <div className="flex gap-2 mb-2">
                  {blog.categories.slice(0, 2).map((category) => (
                    <Link
                      key={category.slug}
                      href={`/category/${category.slug}`}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full hover:bg-blue-200 transition-colors"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}

              <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                <Link href={`/blog/${blog.slug}`}>
                  {blog.title}
                </Link>
              </h3>

              {blog.excerpt && (
                <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                  {blog.excerpt}
                </p>
              )}
            </div>

            {/* Blog Type Indicator */}
            <div className="ml-4">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">
                {isSectionedBlog ? '📄' : '📝'}
              </span>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{blog.author.name}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <time dateTime={blog.publishedAt}>
                {formatDate(blog.publishedAt)}
              </time>
            </div>

            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{getReadingTime()} min</span>
            </div>

            {blog.views && (
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{blog.views.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </article>
    );
  }

  // Default card variant
  return (
    <article className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 group">
      {/* Image */}
      <div className="relative h-48">
        {blog.featuredImage ? (
          <Image
            src={blog.featuredImage}
            alt={blog.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
            <span className="text-4xl">📱</span>
          </div>
        )}

        {/* Blog Type Badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-black bg-opacity-70 text-white text-xs font-medium rounded-full">
            {isSectionedBlog ? '📄 Review' : '📝 Article'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Categories */}
        {blog.categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {blog.categories.slice(0, 2).map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full hover:bg-blue-200 transition-colors"
              >
                {category.name}
              </Link>
            ))}
          </div>
        )}

        <h3 className="text-xl font-semibold text-slate-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
          <Link href={`/blog/${blog.slug}`}>
            {blog.title}
          </Link>
        </h3>

        {blog.excerpt && (
          <p className="text-slate-600 text-sm mb-4 line-clamp-3">
            {blog.excerpt}
          </p>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{blog.author.name}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <time dateTime={blog.publishedAt}>
                {formatDate(blog.publishedAt)}
              </time>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{getReadingTime()} min</span>
            </div>

            {blog.views && (
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{blog.views.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default BlogCard;