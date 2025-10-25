'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import UserDropdown from './UserDropdown'
import { 
  Bell, 
  Search, 
  Menu,
  Home
} from 'lucide-react'

interface AdminTopNavProps {
  onMenuClick?: () => void
  showMobileMenu?: boolean
}

export default function AdminTopNav({ onMenuClick, showMobileMenu = true }: AdminTopNavProps) {
  const pathname = usePathname()

  // Get page title from pathname
  const getPageTitle = () => {
    const segments = pathname.split('/').filter(Boolean)
    const lastSegment = segments[segments.length - 1]
    
    if (pathname === '/admin') return 'Dashboard'
    if (lastSegment === 'blog') return 'Blog Management'
    if (lastSegment === 'devices') return 'Device Management'
    if (lastSegment === 'users') return 'User Management'
    if (lastSegment === 'settings') return 'Settings'
    if (lastSegment === 'analytics') return 'Analytics'
    if (lastSegment === 'create') return 'Create New Post'
    
    // Capitalize first letter of segment
    return lastSegment ? lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1) : 'Admin Panel'
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
            >
              <Home className="w-4 h-4" />
            </Link>
            <span className="text-gray-400">/</span>
            <Link 
              href="/admin"
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
            >
              Admin
            </Link>
            {pathname !== '/admin' && (
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
          <UserDropdown />
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