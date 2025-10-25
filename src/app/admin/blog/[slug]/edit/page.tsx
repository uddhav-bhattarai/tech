'use client'

import DashboardLayout from '@/components/layouts/DashboardLayout';
import UnifiedAdminBlogEditor from '@/components/blog/UnifiedAdminBlogEditor';
import { useParams } from 'next/navigation';

export default function EditBlogPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  return (
    <DashboardLayout>
      <UnifiedAdminBlogEditor mode="edit" slug={slug} />
    </DashboardLayout>
  );
}
