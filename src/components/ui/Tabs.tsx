/**
 * Simple Tabs Component
 * Basic tabs implementation for editor mode switching
 */

'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface TabsProps {
  value: string
  onValueChange: (value: string) => void
  className?: string
  children: React.ReactNode
}

interface TabsListProps {
  className?: string
  children: React.ReactNode
}

interface TabsTriggerProps {
  value: string
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

export function Tabs({ value, onValueChange, className = '', children }: TabsProps) {
  return (
    <div className={cn('tabs', className)} data-value={value}>
      {React.Children.map(children, child => 
        React.isValidElement(child) 
          ? React.cloneElement(child as React.ReactElement<Record<string, unknown>>, { 
              currentValue: value, 
              onValueChange 
            })
          : child
      )}
    </div>
  )
}

export function TabsList({ className = '', children, ...props }: TabsListProps & { currentValue?: string; onValueChange?: (value: string) => void }) {
  return (
    <div 
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
        className
      )}
      role="tablist"
    >
      {React.Children.map(children, child => 
        React.isValidElement(child) 
          ? React.cloneElement(child as React.ReactElement<Record<string, unknown>>, { 
              currentValue: props.currentValue, 
              onValueChange: props.onValueChange 
            })
          : child
      )}
    </div>
  )
}

export function TabsTrigger({ 
  value, 
  disabled = false, 
  className = '', 
  children,
  ...props 
}: TabsTriggerProps & { currentValue?: string; onValueChange?: (value: string) => void }) {
  const isActive = props.currentValue === value
  
  return (
    <button
      type="button"
      role="tab"
      disabled={disabled}
      onClick={() => !disabled && props.onValueChange?.(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        isActive 
          ? 'bg-background text-foreground shadow-sm' 
          : 'hover:bg-background/50 hover:text-foreground',
        className
      )}
      data-state={isActive ? 'active' : 'inactive'}
    >
      {children}
    </button>
  )
}