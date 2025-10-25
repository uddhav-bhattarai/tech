/**
 * AutoSaveIndicator Component
 * Shows auto-save status and last saved time
 */

import React from 'react'
import { CheckCircleIcon, ArrowPathIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface AutoSaveIndicatorProps {
  isSaving: boolean
  lastSaved?: Date
  isDirty?: boolean
  className?: string
}

export default function AutoSaveIndicator({
  isSaving,
  lastSaved,
  isDirty = false,
  className = ''
}: AutoSaveIndicatorProps) {
  const getStatus = () => {
    if (isSaving) {
      return {
        icon: ArrowPathIcon,
        text: 'Saving...',
        color: 'text-blue-600',
        animate: 'animate-spin'
      }
    }
    
    if (isDirty) {
      return {
        icon: ExclamationCircleIcon,
        text: 'Unsaved changes',
        color: 'text-yellow-600',
        animate: ''
      }
    }
    
    if (lastSaved) {
      const timeDiff = Date.now() - lastSaved.getTime()
      const minutes = Math.floor(timeDiff / 60000)
      const timeText = minutes < 1 ? 'just now' : minutes === 1 ? '1 min ago' : `${minutes} mins ago`
      
      return {
        icon: CheckCircleIcon,
        text: `Saved ${timeText}`,
        color: 'text-green-600',
        animate: ''
      }
    }
    
    return {
      icon: ExclamationCircleIcon,
      text: 'Not saved',
      color: 'text-gray-400',
      animate: ''
    }
  }

  const status = getStatus()
  const Icon = status.icon

  return (
    <div className={cn('flex items-center gap-1 text-sm', className)}>
      <Icon className={cn('h-4 w-4', status.color, status.animate)} />
      <span className={cn('text-sm', status.color)}>
        {status.text}
      </span>
    </div>
  )
}