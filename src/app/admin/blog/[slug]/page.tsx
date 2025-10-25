'use client'

import DashboardLayout from '@/components/layouts/DashboardLayout';
import AdminBlogEditor from '@/components/blog/AdminBlogEditor';
import { useParams } from 'next/navigation';

export default function ViewBlogPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  return (
    <DashboardLayout>
      <AdminBlogEditor mode="edit" slug={slug} />
    </DashboardLayout>
  );
}