"use client"

// Skip links component for keyboard navigation accessibility
import { useState, useEffect } from 'react'

interface SkipLinksProps {
  links?: Array<{
    href: string
    label: string
  }>
}

const defaultLinks = [
  { href: '#main-content', label: 'Skip to main content' },
  { href: '#main-navigation', label: 'Skip to navigation' },
  { href: '#search', label: 'Skip to search' },
  { href: '#footer', label: 'Skip to footer' }
]

export default function SkipLinks({ links = defaultLinks }: SkipLinksProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show skip links when user starts tabbing
      if (e.key === 'Tab') {
        setIsVisible(true)
      }
    }

    const handleClick = () => {
      // Hide skip links when user clicks
      setIsVisible(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('click', handleClick)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('click', handleClick)
    }
  }, [])

  return (
    <nav 
      className={`fixed top-0 left-0 w-full z-[100] ${isVisible ? 'block' : 'sr-only'}`}
      aria-label="Skip links navigation"
    >
      <ul className="flex flex-col gap-1 p-2">
        {links.map((link) => (
          <li key={link.href}>
            <a 
              href={link.href}
              className="skip-link"
              onFocus={() => setIsVisible(true)}
              onBlur={() => setIsVisible(false)}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}