'use client'

import DashboardLayout from '@/components/layouts/DashboardLayout';
import AccessibleBlogEditor from '@/components/blog/AccessibleBlogEditor';
import { useSearchParams } from 'next/navigation';

export default function CreateBlogPage() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  
  return (
    <DashboardLayout>
      <AccessibleBlogEditor 
        mode={editId ? "edit" : "create"} 
        blogId={editId || undefined}
      />
    </DashboardLayout>
  );
}
