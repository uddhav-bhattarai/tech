// Accessibility utilities for WCAG 2.1 AAA compliance

/**
 * Generates unique IDs for form elements and ARIA labels
 */
let idCounter = 0
export const generateId = (prefix = 'id'): string => {
  return `${prefix}-${++idCounter}`
}

/**
 * Focus trap utility for modals and dropdowns
 */
export const focusableElementsSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"]):not([disabled])',
  'details',
  'summary',
].join(', ')

export const trapFocus = (element: HTMLElement) => {
  const focusableElements = element.querySelectorAll(focusableElementsSelector) as NodeListOf<HTMLElement>
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }
  }

  element.addEventListener('keydown', handleTabKey)
  
  // Focus first element
  firstElement?.focus()

  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleTabKey)
  }
}

/**
 * Screen reader announcements
 */
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  // Clean up after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Color contrast utilities - WCAG AAA requires 7:1 for normal text, 4.5:1 for large text
 */
export const colors = {
  // AAA compliant color combinations
  primary: {
    50: '#eff6ff',   // Light background
    100: '#dbeafe',  // Very light
    200: '#bfdbfe',  // Light
    300: '#93c5fd',  // Medium light
    400: '#60a5fa',  // Medium
    500: '#3b82f6',  // Base (fails AAA on white)
    600: '#2563eb',  // Dark (AAA on white backgrounds)
    700: '#1d4ed8',  // Darker (AAA on light backgrounds)
    800: '#1e40af',  // Very dark (AAA on any light background)
    900: '#1e3a8a',  // Darkest (AAA on any background)
  },
  gray: {
    50: '#f9fafb',   // Lightest
    100: '#f3f4f6',  // Very light
    200: '#e5e7eb',  // Light
    300: '#d1d5db',  // Medium light
    400: '#9ca3af',  // Medium (fails AAA)
    500: '#6b7280',  // Medium dark (AAA on light backgrounds)
    600: '#4b5563',  // Dark (AAA on white)
    700: '#374151',  // Darker (AAA on any light)
    800: '#1f2937',  // Very dark (AAA compliant)
    900: '#111827',  // Darkest (AAA compliant)
  },
  green: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',  // Fails AAA on white
    600: '#16a34a',  // AAA on white backgrounds
    700: '#15803d',  // AAA on light backgrounds
    800: '#166534',  // AAA compliant
    900: '#14532d',  // AAA compliant
  },
  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',  // Fails AAA on white
    600: '#dc2626',  // AAA on white backgrounds
    700: '#b91c1c',  // AAA on light backgrounds
    800: '#991b1b',  // AAA compliant
    900: '#7f1d1d',  // AAA compliant
  },
  yellow: {
    50: '#fefce8',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',  // Better contrast than default yellow
    500: '#f59e0b',  // Fails AAA on white
    600: '#d97706',  // AAA on white backgrounds  
    700: '#b45309',  // AAA on light backgrounds
    800: '#92400e',  // AAA compliant
    900: '#78350f',  // AAA compliant
  }
}

/**
 * Get AAA compliant color combinations
 */
export const getContrastColor = (backgroundColor: 'light' | 'dark' = 'light', emphasis: 'high' | 'medium' | 'low' = 'high') => {
  if (backgroundColor === 'light') {
    switch (emphasis) {
      case 'high': return colors.gray[900]    // Highest contrast
      case 'medium': return colors.gray[700]  // Medium contrast (AAA)
      case 'low': return colors.gray[600]     // Lower contrast (AA)
      default: return colors.gray[900]
    }
  } else {
    switch (emphasis) {
      case 'high': return colors.gray[50]     // Highest contrast
      case 'medium': return colors.gray[200]  // Medium contrast
      case 'low': return colors.gray[300]     // Lower contrast
      default: return colors.gray[50]
    }
  }
}

/**
 * ARIA live region manager
 */
class LiveRegionManager {
  private static instance: LiveRegionManager
  private politeRegion: HTMLElement | null = null
  private assertiveRegion: HTMLElement | null = null

  static getInstance(): LiveRegionManager {
    if (!LiveRegionManager.instance) {
      LiveRegionManager.instance = new LiveRegionManager()
    }
    return LiveRegionManager.instance
  }

  private ensureRegions() {
    if (!this.politeRegion) {
      this.politeRegion = document.createElement('div')
      this.politeRegion.setAttribute('aria-live', 'polite')
      this.politeRegion.setAttribute('aria-atomic', 'true')
      this.politeRegion.className = 'sr-only'
      document.body.appendChild(this.politeRegion)
    }

    if (!this.assertiveRegion) {
      this.assertiveRegion = document.createElement('div')
      this.assertiveRegion.setAttribute('aria-live', 'assertive')
      this.assertiveRegion.setAttribute('aria-atomic', 'true')
      this.assertiveRegion.className = 'sr-only'
      document.body.appendChild(this.assertiveRegion)
    }
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    this.ensureRegions()
    
    const region = priority === 'assertive' ? this.assertiveRegion : this.politeRegion
    if (region) {
      region.textContent = message
      
      // Clear after announcement
      setTimeout(() => {
        region.textContent = ''
      }, 1000)
    }
  }
}

export const liveRegionManager = LiveRegionManager.getInstance()

/**
 * Keyboard navigation utilities
 */
export const keyboardNavigation = {
  KEYS: {
    ENTER: 'Enter',
    SPACE: ' ',
    ESCAPE: 'Escape',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    TAB: 'Tab',
    HOME: 'Home',
    END: 'End',
  },

  isActivationKey: (key: string) => {
    return key === keyboardNavigation.KEYS.ENTER || key === keyboardNavigation.KEYS.SPACE
  },

  isNavigationKey: (key: string) => {
    return [
      keyboardNavigation.KEYS.ARROW_UP,
      keyboardNavigation.KEYS.ARROW_DOWN,
      keyboardNavigation.KEYS.ARROW_LEFT,
      keyboardNavigation.KEYS.ARROW_RIGHT,
      keyboardNavigation.KEYS.HOME,
      keyboardNavigation.KEYS.END,
    ].includes(key)
  }
}

/**
 * Form validation with accessibility
 */
export const createAccessibleInput = (inputElement: HTMLInputElement, errorElement?: HTMLElement) => {
  const inputId = inputElement.id || generateId('input')
  const errorId = `${inputId}-error`
  
  inputElement.id = inputId
  
  if (errorElement) {
    errorElement.id = errorId
    inputElement.setAttribute('aria-describedby', errorId)
  }

  const setError = (message: string) => {
    inputElement.setAttribute('aria-invalid', 'true')
    if (errorElement) {
      errorElement.textContent = message
      errorElement.setAttribute('role', 'alert')
    }
    liveRegionManager.announce(message, 'assertive')
  }

  const clearError = () => {
    inputElement.setAttribute('aria-invalid', 'false')
    if (errorElement) {
      errorElement.textContent = ''
      errorElement.removeAttribute('role')
    }
  }

  return { setError, clearError }
}