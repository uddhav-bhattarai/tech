/**
 * Admin Page Header Component
 * Provides consistent headers for admin pages with breadcrumbs and actions
 */

'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface AdminPageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
}

export default function AdminPageHeader({ 
  title, 
  description, 
  breadcrumbs = [], 
  actions 
}: AdminPageHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-6">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link
                href="/admin"
                className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors"
              >
                <Home className="w-4 h-4 mr-1" />
                Admin
              </Link>
            </li>
            {breadcrumbs.map((item, index) => (
              <li key={index}>
                <div className="flex items-center">
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="ml-1 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors md:ml-2"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="ml-1 text-sm font-medium text-gray-900 md:ml-2">
                      {item.label}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Header Content */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="text-gray-600 mt-1">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center space-x-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}