import Navigation from '@/components/Navigation'
import RecentBlogPosts from '@/components/blog/RecentBlogPosts'
import Link from 'next/link'  
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TechHub - Mobile Device Reviews & Tech Blog Platform',
  description: 'Discover, compare, and review the latest mobile devices. Read expert tech blog posts, detailed device specifications, and comprehensive comparisons.',
  keywords: ['mobile devices', 'smartphone reviews', 'tech blog', 'device comparison', 'technology news'],
  openGraph: {
    title: 'TechHub - Mobile Device Reviews & Tech Blog Platform',
    description: 'Your ultimate destination for mobile device reviews and tech insights',
    url: 'https://techhub.com',
    siteName: 'TechHub',
    type: 'website',
  },
}

export default function Home() {
  return (
    <>
      <Navigation />
      
      {/* Hero Section */}
      <main id="main-content" className="bg-aaa-light text-aaa-high">
        <section 
          className="relative py-20 px-4 sm:px-6 lg:px-8"
          aria-labelledby="hero-heading"
        >
          <div className="max-w-7xl mx-auto text-center">
            <h1 
              id="hero-heading" 
              className="text-4xl font-bold tracking-tight text-aaa-high sm:text-6xl mb-6"
            >
              Discover the Best Mobile Devices
            </h1>
            <p className="text-xl text-aaa-medium max-w-2xl mx-auto mb-8">
              Compare specifications, read expert reviews, and make informed decisions about your next tech purchase.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/devices"
                className="interactive-primary px-8 py-3 text-lg rounded-lg"
                aria-describedby="browse-devices-desc"
              >
                Browse Devices
              </Link>
              <span id="browse-devices-desc" className="sr-only">
                Explore our comprehensive database of mobile devices with detailed specifications and reviews
              </span>
              
              <Link
                href="/compare"
                className="interactive-secondary px-8 py-3 text-lg rounded-lg"
                aria-describedby="compare-devices-desc"
              >
                Compare Devices
              </Link>
              <span id="compare-devices-desc" className="sr-only">
                Side-by-side comparison tool for mobile devices to help you choose the best option
              </span>
            </div>
          </div>
        </section>

        {/* Featured Sections */}
        <section 
          className="py-16 px-4 sm:px-6 lg:px-8 bg-aaa-light-subtle"
          aria-labelledby="features-heading"
        >
          <div className="max-w-7xl mx-auto">
            <h2 
              id="features-heading" 
              className="text-3xl font-bold text-center text-aaa-high mb-12"
            >
              Why Choose TechHub?
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <article className="card-accessible text-center p-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-700 rounded-full flex items-center justify-center">
                  <svg 
                    className="w-8 h-8 text-gray-50" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-aaa-high mb-3">
                  Comprehensive Database
                </h3>
                <p className="text-aaa-medium">
                  Access detailed specifications, images, and reviews for thousands of mobile devices from all major brands.
                </p>
              </article>

              {/* Feature 2 */}
              <article className="card-accessible text-center p-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-700 rounded-full flex items-center justify-center">
                  <svg 
                    className="w-8 h-8 text-gray-50" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 00-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-aaa-high mb-3">
                  Smart Comparisons
                </h3>
                <p className="text-aaa-medium">
                  Our intelligent comparison tool helps you understand the differences between devices to make the best choice.
                </p>
              </article>

              {/* Feature 3 */}
              <article className="card-accessible text-center p-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-purple-700 rounded-full flex items-center justify-center">
                  <svg 
                    className="w-8 h-8 text-gray-50" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-aaa-high mb-3">
                  Expert Reviews
                </h3>
                <p className="text-aaa-medium">
                  Read in-depth reviews and tech articles written by experts who know mobile technology inside and out.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section 
          className="py-16 px-4 sm:px-6 lg:px-8 bg-aaa-light"
          aria-labelledby="cta-heading"
        >
          <div className="max-w-4xl mx-auto text-center">
            <h2 
              id="cta-heading" 
              className="text-3xl font-bold text-aaa-high mb-4"
            >
              Ready to Find Your Perfect Device?
            </h2>
            <p className="text-xl text-aaa-medium mb-8">
              Join thousands of users who trust TechHub for their mobile device research.
            </p>
            <Link
              href="/devices"
              className="interactive-primary px-8 py-4 text-lg rounded-lg inline-block"
              aria-describedby="start-browsing-desc"
            >
              Start Browsing Now
            </Link>
            <span id="start-browsing-desc" className="sr-only">
              Begin exploring our extensive mobile device database with filtering and search capabilities
            </span>
          </div>
        </section>

        {/* Latest Blog Posts */}
        <section 
          className="py-16 px-4 sm:px-6 lg:px-8 bg-white"
          aria-labelledby="blog-heading"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 
                id="blog-heading" 
                className="text-3xl font-bold text-aaa-high mb-4"
              >
                Latest Tech Insights
              </h2>
              <p className="text-xl text-aaa-medium max-w-2xl mx-auto">
                Stay updated with the latest device reviews, tech news, and expert analysis.
              </p>
            </div>

            {/* Blog posts loaded dynamically */}
            <div className="mb-8">
              <RecentBlogPosts />
            </div>

            <div className="text-center">
              <Link
                href="/blog"
                className="interactive-secondary px-8 py-3 text-lg rounded-lg inline-block"
                aria-describedby="view-all-posts-desc"
              >
                View All Posts
              </Link>
              <span id="view-all-posts-desc" className="sr-only">
                Browse our complete archive of tech articles, device reviews, and industry insights
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer 
        id="footer" 
        className="bg-aaa-dark text-aaa-high py-12 px-4 sm:px-6 lg:px-8"
        role="contentinfo"
        aria-labelledby="footer-heading"
      >
        <div className="max-w-7xl mx-auto">
          <div className="sr-only">
            <h2 id="footer-heading">Footer</h2>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-50 mb-4">TechHub</h3>
              <p className="text-gray-300 text-sm">
                Your trusted source for mobile device reviews, comparisons, and tech insights.
              </p>
            </div>

            {/* Quick Links */}
            <nav aria-labelledby="footer-navigation">
              <h3 id="footer-navigation" className="text-lg font-semibold text-gray-50 mb-4">Navigate</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/devices" className="text-gray-300 hover:text-gray-50 text-sm link-primary">
                    All Devices
                  </Link>
                </li>
                <li>
                  <Link href="/compare" className="text-gray-300 hover:text-gray-50 text-sm link-primary">
                    Compare
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-gray-300 hover:text-gray-50 text-sm link-primary">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-gray-300 hover:text-gray-50 text-sm link-primary">
                    About Us
                  </Link>
                </li>
              </ul>
            </nav>

            {/* Categories */}
            <nav aria-labelledby="footer-categories">
              <h3 id="footer-categories" className="text-lg font-semibold text-gray-50 mb-4">Categories</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/devices?category=smartphones" className="text-gray-300 hover:text-gray-50 text-sm link-primary">
                    Smartphones
                  </Link>
                </li>
                <li>
                  <Link href="/devices?category=tablets" className="text-gray-300 hover:text-gray-50 text-sm link-primary">
                    Tablets
                  </Link>
                </li>
                <li>
                  <Link href="/devices?category=wearables" className="text-gray-300 hover:text-gray-50 text-sm link-primary">
                    Wearables
                  </Link>
                </li>
                <li>
                  <Link href="/devices?category=accessories" className="text-gray-300 hover:text-gray-50 text-sm link-primary">
                    Accessories
                  </Link>
                </li>
              </ul>
            </nav>

            {/* Support */}
            <nav aria-labelledby="footer-support">
              <h3 id="footer-support" className="text-lg font-semibold text-gray-50 mb-4">Support</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/contact" className="text-gray-300 hover:text-gray-50 text-sm link-primary">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-gray-300 hover:text-gray-50 text-sm link-primary">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-gray-300 hover:text-gray-50 text-sm link-primary">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/accessibility" className="text-gray-300 hover:text-gray-50 text-sm link-primary">
                    Accessibility
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          <div className="border-t border-gray-700 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2024 TechHub. All rights reserved. Made with accessibility in mind.
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}
