'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import DashboardUserDropdown from './DashboardUserDropdown'
import { 
  Bell, 
  Search, 
  Menu,
  Home
} from 'lucide-react'

interface DashboardTopNavProps {
  onMenuClick?: () => void
  showMobileMenu?: boolean
}

export default function DashboardTopNav({ onMenuClick, showMobileMenu = true }: DashboardTopNavProps) {
  const pathname = usePathname()
  const { user } = useAuth()

  // Get page title from pathname
  const getPageTitle = () => {
    const segments = pathname.split('/').filter(Boolean)
    const lastSegment = segments[segments.length - 1]
    
    if (pathname === '/dashboard') return 'Dashboard'
    if (pathname === '/admin') return 'Admin Dashboard'
    if (lastSegment === 'blog') return 'Blog'
    if (lastSegment === 'devices') return 'Devices'
    if (lastSegment === 'users') return 'Users'
    if (lastSegment === 'settings') return 'Settings'
    if (lastSegment === 'analytics') return 'Analytics'
    if (lastSegment === 'compare') return 'Compare Devices'
    if (lastSegment === 'rankings') return 'Rankings'
    if (lastSegment === 'reviews') return 'My Reviews'
    if (lastSegment === 'favorites') return 'Favorites'
    if (lastSegment === 'profile') return 'Profile'
    if (lastSegment === 'create') return 'Create New Post'
    
    // Capitalize first letter of segment
    return lastSegment ? lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1) : 'Dashboard'
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side - Mobile menu + Breadcrumbs */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          {showMobileMenu && (
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Breadcrumbs / Page Title */}
          <div className="flex items-center space-x-2">
            <Link 
              href="/"
              className="text-gray-500 hover:text-gray-700 transition-colors"
              title="Go to main website"
            >
              <Home className="w-4 h-4" />
            </Link>
            <span className="text-gray-400">/</span>
            <Link 
              href={user?.role?.name === 'ADMIN' ? '/admin' : '/dashboard'}
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
            >
              {user?.role?.name === 'ADMIN' ? 'Admin' : 'Dashboard'}
            </Link>
            {((pathname !== '/admin' && pathname !== '/dashboard') || 
              (pathname === '/dashboard' && user?.role?.name !== 'ADMIN') ||
              (pathname === '/admin' && user?.role?.name === 'ADMIN')) && (
              <>
                <span className="text-gray-400">/</span>
                <span className="text-sm font-medium text-gray-900">
                  {getPageTitle()}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Center - Search bar (hidden on small screens) */}
        <div className="hidden md:flex flex-1 justify-center px-4">
          <div className="relative max-w-lg w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search posts, devices, users..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
            />
          </div>
        </div>

        {/* Right side - Notifications + User dropdown */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
            <Bell className="w-5 h-5" />
            {/* Notification badge */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Dropdown */}
          <DashboardUserDropdown />
        </div>
      </div>

      {/* Mobile search bar */}
      <div className="md:hidden px-4 pb-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
          />
        </div>
      </div>
    </header>
  )
}