'use client'

// import { Metadata } from "next"
import EnhancedDeviceComparison from "@/components/comparison/EnhancedDeviceComparison"
import MainLayout from "@/components/layouts/MainLayout"
import DashboardLayout from "@/components/layouts/DashboardLayout"
import { useAuth } from "@/hooks/useAuth"

// Note: Metadata moved to layout.tsx for this route since this is now a client component
/*
export const metadata: Metadata = {
  title: "Compare Devices | TechBlog",
  description: "Compare mobile devices side by side with detailed specifications, pricing, and features to make informed purchasing decisions.",
  keywords: ["device comparison", "mobile comparison", "smartphone compare", "tech specs", "phone specs"],
  openGraph: {
    title: "Compare Devices | TechBlog", 
    description: "Compare mobile devices side by side with detailed specifications and features.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Compare Devices | TechBlog",
    description: "Compare mobile devices side by side with detailed specifications and features.",
  },
}
*/

export default function ComparePage() {
  const { user } = useAuth();

  // Choose layout based on authentication status
  const Layout = user ? DashboardLayout : MainLayout;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <EnhancedDeviceComparison />
      </div>
    </Layout>
  )
}