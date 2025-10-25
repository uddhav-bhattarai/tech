'use client'

import React, { useEffect, useState } from 'react';
import BlogCard from '@/components/blog/BlogCard';

interface BlogSection {
  id: string;
  type: string;
  title: string;
  content: string;
  order: number;
}

interface BlogPost {
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
}

const RecentBlogPosts: React.FC = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentBlogs();
  }, []);

  const fetchRecentBlogs = async () => {
    try {
      const response = await fetch('/api/blog?simple=true&status=PUBLISHED&limit=3&sortBy=publishedAt&sortOrder=desc');
      if (response.ok) {
        const data = await response.json();
        setBlogs(data);
      } else {
        setError('Failed to load blog posts');
      }
    } catch (error) {
      console.error('Error fetching recent blogs:', error);
      setError('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <article key={i} className="card-accessible p-6 animate-pulse">
            <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </article>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          Unable to load blog posts
        </h3>
        <p className="text-slate-600">
          Please check back later for the latest tech insights.
        </p>
      </div>
    );
  }

  if (blogs.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          No blog posts yet
        </h3>
        <p className="text-slate-600">
          Check back soon for the latest tech insights and device reviews.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {blogs.map((blog) => (
        <BlogCard key={blog.id} blog={blog} />
      ))}
    </div>
  );
};

export default RecentBlogPosts;