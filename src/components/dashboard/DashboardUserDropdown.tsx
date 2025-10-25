'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  Shield,
  Mail,
  Calendar,
  ExternalLink,
  Home,
  Crown,
  Heart,
  MessageSquare
} from 'lucide-react'

export default function DashboardUserDropdown() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  const isAdmin = user?.role?.name === 'ADMIN'

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 text-sm rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      >
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white font-medium text-sm">
            {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="text-left hidden sm:block">
          <p className="font-medium text-gray-900">
            {user?.name || user?.username || (isAdmin ? 'System Administrator' : 'User')}
          </p>
          <p className="text-xs text-gray-500 flex items-center">
            {isAdmin && <Crown className="w-3 h-3 mr-1 text-yellow-500" />}
            {user?.role?.name || 'USER'}
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-lg">
                  {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {user?.name || user?.username || (isAdmin ? 'System Administrator' : 'User')}
                </p>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Mail className="w-3 h-3 mr-1" />
                  <span className="truncate">{user?.email || 'user@example.com'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Shield className="w-3 h-3 mr-1" />
                  <span className="flex items-center">
                    {isAdmin && <Crown className="w-3 h-3 mr-1 text-yellow-500" />}
                    {user?.role?.name || 'USER'}
                  </span>
                  {user?.verified && (
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span>Member since {new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="py-1">
            {/* Go to Main Site */}
            <Link
              href="/"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors group"
              onClick={() => setIsOpen(false)}
            >
              <Home className="w-4 h-4 mr-3 text-gray-500 group-hover:text-blue-500" />
              <span className="flex-1">Go to Main Site</span>
              <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-blue-500" />
            </Link>

            <div className="border-t border-gray-100 my-1"></div>
            
            {/* User-specific menu items */}
            {!isAdmin && (
              <>
                <Link
                  href="/dashboard/reviews"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <MessageSquare className="w-4 h-4 mr-3 text-gray-500" />
                  My Reviews
                </Link>
                
                <Link
                  href="/dashboard/favorites"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Heart className="w-4 h-4 mr-3 text-gray-500" />
                  Favorites
                </Link>

                <div className="border-t border-gray-100 my-1"></div>
              </>
            )}

            <Link
              href={isAdmin ? "/admin/profile" : "/dashboard/profile"}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <User className="w-4 h-4 mr-3 text-gray-500" />
              View Profile
            </Link>
            
            <Link
              href={isAdmin ? "/admin/settings" : "/dashboard/settings"}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="w-4 h-4 mr-3 text-gray-500" />
              Account Settings
            </Link>

            <div className="border-t border-gray-100 my-1"></div>
            
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3 text-red-500" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}