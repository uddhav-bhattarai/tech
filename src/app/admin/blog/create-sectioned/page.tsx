'use client'

import DashboardLayout from '@/components/layouts/DashboardLayout';
import SectionedBlogEditor from '@/components/blog/SectionedBlogEditor';

export default function CreateSectionedBlogPage() {
  return (
    <DashboardLayout>
      <SectionedBlogEditor mode="create" />
    </DashboardLayout>
  );
}