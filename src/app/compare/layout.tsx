import { Metadata } from "next"

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

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}