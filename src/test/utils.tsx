/**
 * Test Utilities and Helpers
 * Reusable testing functions and mock data
 */

import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { User, BlogPost, Device, Brand, Category } from '@prisma/client'

// Test data factories
export const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'user-1',
  email: 'test@example.com',
  username: 'testuser',
  name: 'Test User',
  image: null,
  roleId: 'role-1',
  isActive: true,
  verified: true,
  bio: null,
  location: null,
  website: null,
  socialLinks: null,
  preferences: null,
  lastLogin: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

export const createMockBlogPost = (overrides?: Partial<BlogPost>): BlogPost => ({
  id: 'post-1',
  title: 'Test Blog Post',
  slug: 'test-blog-post',
  excerpt: 'This is a test blog post excerpt',
  content: 'This is the test blog post content',
  featuredImage: null,
  status: 'PUBLISHED',
  type: 'GENERAL',
  authorId: 'user-1',
  publishedAt: new Date(),
  seoTitle: null,
  seoDescription: null,
  seoKeywords: null,
  readingTime: 5,
  views: 100,
  likes: 10,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

export const createMockDevice = (overrides?: Partial<Device>): Device => ({
  id: 'device-1',
  name: 'Test Device',
  slug: 'test-device',
  description: 'This is a test device',
  specifications: { cpu: 'Test CPU', ram: '8GB' },
  images: ['image1.jpg'],
  brandId: 'brand-1',
  categoryId: 'category-1',
  pricing: {
    msrp: 999,
    currency: 'USD',
    availability: 'in-stock'
  },
  availability: 'IN_STOCK',
  isActive: true,
  rating: 4.5,
  reviewCount: 25,
  releaseDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

export const createMockBrand = (overrides?: Partial<Brand>): Brand => ({
  id: 'brand-1',
  name: 'Test Brand',
  slug: 'test-brand',
  description: 'This is a test brand',
  logo: null,
  website: 'https://testbrand.com',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

export const createMockCategory = (overrides?: Partial<Category>): Category => ({
  id: 'category-1',
  name: 'Test Category',
  slug: 'test-category',
  description: 'This is a test category',
  icon: null,
  parentId: null,
  isActive: true,
  sortOrder: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

// Mock API responses
export const createMockApiResponse = <T>(data: T, success: boolean = true) => ({
  success,
  data,
  error: success ? null : 'Mock error',
  message: success ? 'Success' : 'Error occurred'
})

// Custom render function with providers
interface CustomRenderOptions extends RenderOptions {
  preloadedState?: object
}

export const customRender = (
  ui: ReactElement,
  options?: CustomRenderOptions
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    // Add providers here if needed (Redux, Theme, etc.)
    return <>{children}</>
  }

  return render(ui, { wrapper: Wrapper, ...options })
}

// Mock fetch responses
export const mockFetch = (response: object, status: number = 200) => {
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => response,
    text: async () => JSON.stringify(response)
  })
}

// Mock Next.js router
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
  back: jest.fn(),
  prefetch: jest.fn(),
  beforePopState: jest.fn(),
  pathname: '/',
  route: '/',
  asPath: '/',
  query: {},
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn()
  }
}

// Mock session data
export const mockSession = {
  user: {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    username: 'testuser',
    role: {
      id: 'role-1',
      name: 'USER',
      permissions: []
    },
    verified: true
  },
  expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
}

// Test database setup/teardown helpers
export const setupTestDatabase = async () => {
  // Mock database setup
  console.log('Setting up test database...')
}

export const teardownTestDatabase = async () => {
  // Mock database teardown
  console.log('Tearing down test database...')
}

// Wait for async operations
export const waitFor = (ms: number) => 
  new Promise(resolve => setTimeout(resolve, ms))

// Mock performance monitoring
export const mockPerformanceMonitor = {
  startRequest: jest.fn(),
  endRequest: jest.fn(),
  recordError: jest.fn(),
  getSystemHealth: jest.fn(() => ({
    status: 'healthy',
    uptime: 3600,
    version: '1.0.0',
    environment: 'test',
    lastCheck: new Date(),
    metrics: {
      responseTime: { avg: 100, min: 50, max: 200, p95: 180, p99: 195 },
      requestCount: 100,
      errorCount: 5,
      errorRate: 5,
      memoryUsage: process.memoryUsage(),
      cpuUsage: 25
    },
    alerts: []
  }))
}

// Accessibility testing helpers
export const checkA11y = async (container: HTMLElement) => {
  // Mock accessibility checking
  const issues: string[] = []
  
  // Check for alt text on images
  const images = container.querySelectorAll('img')
  images.forEach((img, index) => {
    if (!img.alt) {
      issues.push(`Image at index ${index} is missing alt text`)
    }
  })
  
  // Check for proper heading hierarchy
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
  let lastLevel = 0
  headings.forEach((heading, index) => {
    const currentLevel = parseInt(heading.tagName[1])
    if (index === 0 && currentLevel !== 1) {
      issues.push('First heading should be h1')
    } else if (currentLevel > lastLevel + 1) {
      issues.push(`Heading level jump from h${lastLevel} to h${currentLevel}`)
    }
    lastLevel = currentLevel
  })
  
  return issues
}

// Performance testing helpers
export const measureRenderTime = async (renderFn: () => void) => {
  const start = performance.now()
  renderFn()
  const end = performance.now()
  return end - start
}

// Mock file upload
export const createMockFile = (
  name: string,
  content: string,
  type: string = 'text/plain'
) => {
  const blob = new Blob([content], { type })
  return new File([blob], name, { type })
}

export * from '@testing-library/react'
export { userEvent } from '@testing-library/user-event'