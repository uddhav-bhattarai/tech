'use client'

import DashboardLayout from '@/components/layouts/DashboardLayout';
import AdminBlogDashboard from '@/components/blog/AdminBlogDashboard';

export default function AdminBlogPage() {
  return (
    <DashboardLayout>
      <AdminBlogDashboard />
    </DashboardLayout>
  );
}