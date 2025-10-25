import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Device Rankings | TechBlog",
  description: "Discover the best mobile devices with our intelligent ranking system based on performance, camera quality, battery life, build quality, and value for money.",
  keywords: ["device rankings", "best phones", "smartphone rankings", "mobile device comparison", "tech rankings", "phone reviews"],
  openGraph: {
    title: "Device Rankings | TechBlog",
    description: "Intelligent device rankings based on comprehensive analysis of specifications, reviews, and value.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Device Rankings | TechBlog", 
    description: "Discover the best mobile devices with our intelligent ranking system.",
  },
}

export default function RankingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}