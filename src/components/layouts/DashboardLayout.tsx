'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from 'next-auth/react'
import DashboardTopNav from '@/components/dashboard/DashboardTopNav'
import { 
  LayoutDashboard, 
  FileText, 
  Smartphone, 
  BarChart3, 
  Settings, 
  Users,
  LogOut,
  X,
  MessageSquare,
  Heart,
  TrendingUp,
  User,
  BookOpen,
  GitCompare
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavigationItem {
  name: string
  href: string
  icon?: React.ComponentType<{className?: string}>
  children?: Omit<NavigationItem, 'children'>[]
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Navigation items based on user role
  const getNavigationItems = (): NavigationItem[] => {
    const baseNavigation = [
      { name: 'Dashboard', href: user?.role?.name === 'ADMIN' ? '/admin' : '/dashboard', icon: LayoutDashboard },
      { name: 'Devices', href: '/devices', icon: Smartphone },
      { name: 'Blog', href: '/blog', icon: BookOpen },
      { name: 'Compare', href: '/compare', icon: GitCompare },
      { name: 'Rankings', href: '/rankings', icon: TrendingUp },
    ]

    // Add admin-specific items
    if (user?.role?.name === 'ADMIN') {
      return [
        ...baseNavigation,
        { 
          name: 'Content Management', 
          href: '/admin/blog', 
          icon: FileText,
          children: [
            { name: 'All Posts', href: '/admin/blog' },
            { name: 'Create Post', href: '/admin/blog/create' },
            { name: 'Sectioned Editor', href: '/admin/blog/create-sectioned' },
          ]
        },
        { 
          name: 'Device Management', 
          href: '/admin/devices', 
          icon: Settings,
          children: [
            { name: 'All Devices', href: '/admin/devices' },
            { name: 'Add Device', href: '/admin/devices/create' },
          ]
        },
        { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'Settings', href: '/admin/settings', icon: Settings },
      ]
    }

    // Add user-specific items
    return [
      ...baseNavigation,
      { 
        name: 'My Content', 
        href: '/dashboard/reviews', 
        icon: MessageSquare,
        children: [
          { name: 'My Reviews', href: '/dashboard/reviews' },
          { name: 'My Comparisons', href: '/dashboard/comparisons' },
        ]
      },
      { name: 'Favorites', href: '/dashboard/favorites', icon: Heart },
      { name: 'Profile', href: '/dashboard/profile', icon: User },
    ]
  }

  const navigation = getNavigationItems()

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative flex flex-col w-64 bg-white border-r border-gray-200 shadow-lg">
            {/* Mobile sidebar header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <Link href={user?.role?.name === 'ADMIN' ? '/admin' : '/dashboard'} className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">
                    {user?.role?.name === 'ADMIN' ? 'A' : 'D'}
                  </span>
                </div>
                <span className="ml-3 text-xl font-semibold text-gray-900">
                  {user?.role?.name === 'ADMIN' ? 'Admin Panel' : 'Dashboard'}
                </span>
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || 
                  (pathname.startsWith(item.href + '/') && item.href !== '/admin' && item.href !== '/dashboard') ||
                  (item.children && item.children.some(child => pathname === child.href || pathname.startsWith(child.href + '/')))
                
                return (
                  <div key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        isActive
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50',
                        'group flex items-center px-3 py-2 text-sm font-medium border-l-4 transition-colors duration-200'
                      )}
                    >
                      {item.icon && (
                        <item.icon
                          className={cn(
                            isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500',
                            'mr-3 h-5 w-5 transition-colors duration-200'
                          )}
                          aria-hidden="true"
                        />
                      )}
                      {item.name}
                    </Link>
                    {/* Submenu items */}
                    {item.children && (
                      <div className="ml-6 mt-1 space-y-1">
                        {item.children.map((child) => {
                          const isChildActive = pathname === child.href || pathname.startsWith(child.href + '/')
                          return (
                            <Link
                              key={child.name}
                              href={child.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={cn(
                                isChildActive
                                  ? 'text-blue-700 bg-blue-50'
                                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
                                'block px-3 py-1 text-xs font-medium rounded transition-colors duration-200'
                              )}
                            >
                              {child.name}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </nav>

            {/* Mobile User Section */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {(user?.name || 'User').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {user?.name || user?.username || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <button 
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 bg-white border-r border-gray-200 shadow-sm">
          {/* Logo/Brand */}
          <div className="flex items-center flex-shrink-0 px-6 pb-4">
            <Link href={user?.role?.name === 'ADMIN' ? '/admin' : '/dashboard'} className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">
                  {user?.role?.name === 'ADMIN' ? 'A' : 'D'}
                </span>
              </div>
              <span className="ml-3 text-xl font-semibold text-gray-900">
                {user?.role?.name === 'ADMIN' ? 'Admin Panel' : 'Dashboard'}
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 pb-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (pathname.startsWith(item.href + '/') && item.href !== '/admin' && item.href !== '/dashboard') ||
                (item.children && item.children.some(child => pathname === child.href || pathname.startsWith(child.href + '/')))
              
              return (
                <div key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      isActive
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50',
                      'group flex items-center px-3 py-2 text-sm font-medium border-l-4 transition-colors duration-200'
                    )}
                  >
                    {item.icon && (
                      <item.icon
                        className={cn(
                          isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500',
                          'mr-3 h-5 w-5 transition-colors duration-200'
                        )}
                        aria-hidden="true"
                      />
                    )}
                    {item.name}
                  </Link>
                  {/* Submenu items */}
                  {item.children && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.children.map((child) => {
                        const isChildActive = pathname === child.href || pathname.startsWith(child.href + '/')
                        return (
                          <Link
                            key={child.name}
                            href={child.href}
                            className={cn(
                              isChildActive
                                ? 'text-blue-700 bg-blue-50'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
                              'block px-3 py-1 text-xs font-medium rounded transition-colors duration-200'
                            )}
                          >
                            {child.name}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* User Section */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {(user?.name || 'User').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {user?.name || user?.username || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <button 
                onClick={() => signOut({ callbackUrl: '/' })}
                className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Navigation */}
        <DashboardTopNav 
          onMenuClick={() => setIsMobileMenuOpen(true)}
          showMobileMenu={true}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}