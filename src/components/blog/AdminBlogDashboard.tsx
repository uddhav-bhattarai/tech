'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Pencil, Trash2, Plus, Eye, Search, Filter, ChevronDown } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  publishedAt?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  author?: { name?: string };
}

const AdminBlogDashboard: React.FC = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch blogs from API
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/blogs');
        const data = await res.json();
        setBlogs(data.blogs || []);
      } catch (err) {
        console.error('Failed to fetch blogs:', err);
        setError('Failed to load blogs');
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const filteredBlogs = blogs.filter(blog =>
    blog.title.toLowerCase().includes(search.toLowerCase()) ||
    blog.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Blog Management</h1>
        <div className="flex gap-3">
          <Link href="/admin/blog/create" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all">
            <Plus className="w-5 h-5" />
            New Blog
          </Link>
          <Link href="/admin/blog/create-sectioned" className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-all">
            <Plus className="w-5 h-5" />
            Sectioned Blog
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-4 mb-6">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search blogs by title or slug..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Search className="absolute right-3 top-2.5 text-gray-400" />
        </div>
        <button className="inline-flex items-center gap-2 bg-slate-200 text-slate-900 px-4 py-2 rounded-lg font-semibold border border-slate-400 hover:bg-slate-300">
          <Filter className="w-4 h-4" />
          Filter
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
      {loading ? (
        <div className="text-center py-12 text-lg text-slate-800">Loading blogs...</div>
      ) : error ? (
        <div className="text-center py-12 text-lg text-red-500">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-xl shadow">
            <thead>
              <tr className="bg-slate-200 text-slate-900">
                <th className="py-3 px-6 text-left">Title</th>
                <th className="py-3 px-6 text-left">Slug</th>
                <th className="py-3 px-6 text-left">Status</th>
                <th className="py-3 px-6 text-left">Published</th>
                <th className="py-3 px-6 text-left">SEO Title</th>
                <th className="py-3 px-6 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBlogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-800">No blogs found.</td>
                </tr>
              ) : (
                filteredBlogs.map(blog => (
                  <tr key={blog.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-6 font-semibold text-slate-900">
                      <Link href={`/admin/blog/${blog.slug}`} className="hover:underline text-blue-600">{blog.title}</Link>
                    </td>
                    <td className="py-3 px-6 text-slate-800">{blog.slug}</td>
                    <td className="py-3 px-6 text-slate-800">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${blog.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : blog.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-100 text-slate-800'}`}>{blog.status}</span>
                    </td>
                    <td className="py-3 px-6 text-slate-800">{blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString() : '-'}</td>
                    <td className="py-3 px-6 text-slate-800">{blog.metaTitle || '-'}</td>
                    <td className="py-3 px-6 flex gap-2">
                      <Link href={`/admin/blog/${blog.slug}`} className="inline-flex items-center gap-1 px-3 py-1 bg-slate-200 text-slate-900 rounded hover:bg-slate-300 font-medium">
                        <Eye className="w-4 h-4" /> View
                      </Link>
                      <Link href={`/admin/blog/create?id=${blog.id}`} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                        <Pencil className="w-4 h-4" /> Edit
                      </Link>
                      <button className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminBlogDashboard;
