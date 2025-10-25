/**
 * Advanced Search & Filter System
 * Comprehensive search functionality with full-text search, faceted filters,
 * advanced sorting, and optimized results for both content and devices
 */

'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { debounce } from 'lodash-es'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  FunnelIcon,
  Bars3BottomLeftIcon,
  ChevronDownIcon,
  CheckIcon,
  StarIcon,
  CurrencyDollarIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  TvIcon
} from '@heroicons/react/24/outline'

// Search types and interfaces
export type SearchType = 'all' | 'devices' | 'articles' | 'comparisons' | 'reviews'
export type SortOption = 'relevance' | 'date' | 'rating' | 'price' | 'popularity' | 'alphabetical'
export type SortDirection = 'asc' | 'desc'

interface SearchFilters {
  // General filters
  category?: string[]
  tags?: string[]
  dateRange?: { start: Date; end: Date }
  
  // Device-specific filters
  brand?: string[]
  priceRange?: { min: number; max: number }
  rating?: { min: number; max: number }
  deviceType?: string[]
  screenSize?: { min: number; max: number }
  storage?: string[]
  ram?: string[]
  
  // Content-specific filters
  author?: string[]
  contentType?: string[]
  readingTime?: { min: number; max: number }
  wordCount?: { min: number; max: number }
}

interface SearchParams {
  query: string
  type: SearchType
  filters: SearchFilters
  sort: SortOption
  direction: SortDirection
  page: number
  limit: number
}

interface SearchResult {
  id: string
  type: 'device' | 'article' | 'comparison' | 'review'
  title: string
  description: string
  url: string
  thumbnail?: string
  metadata: {
    author?: string
    date: string
    rating?: number
    price?: number
    brand?: string
    category?: string
    tags: string[]
    relevanceScore: number
    highlights: string[]
  }
}

interface SearchResponse {
  results: SearchResult[]
  total: number
  facets: {
    brands: { name: string; count: number }[]
    categories: { name: string; count: number }[]
    priceRanges: { range: string; count: number }[]
    ratings: { rating: number; count: number }[]
    contentTypes: { type: string; count: number }[]
    authors: { name: string; count: number }[]
  }
  suggestions: string[]
  searchTime: number
}

interface AdvancedSearchProps {
  onSearch?: (params: SearchParams) => void
  onResults?: (response: SearchResponse) => void
  initialQuery?: string
  initialType?: SearchType
  showFilters?: boolean
  className?: string
}

// Mock data for demonstration
const MOCK_BRANDS = [
  'Apple', 'Samsung', 'Google', 'OnePlus', 'Sony', 'LG', 'Xiaomi', 'Huawei',
  'Motorola', 'Nothing', 'Realme', 'Oppo', 'Vivo'
]

const MOCK_CATEGORIES = [
  'Smartphones', 'Tablets', 'Laptops', 'Smartwatches', 'Headphones',
  'Speakers', 'Cameras', 'Gaming', 'Smart Home', 'Accessories'
]

const MOCK_DEVICE_TYPES = [
  'Smartphone', 'Tablet', 'Laptop', 'Desktop', 'Smartwatch', 'Earbuds',
  'Headphones', 'Speaker', 'Camera', 'Monitor'
]

const PRICE_RANGES = [
  { label: 'Under $200', min: 0, max: 200 },
  { label: '$200 - $500', min: 200, max: 500 },
  { label: '$500 - $1000', min: 500, max: 1000 },
  { label: '$1000 - $2000', min: 1000, max: 2000 },
  { label: 'Over $2000', min: 2000, max: 10000 }
]

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'date', label: 'Newest First' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'price', label: 'Price' },
  { value: 'popularity', label: 'Most Popular' },
  { value: 'alphabetical', label: 'A-Z' }
]

// Filter components
function CategoryFilter({ 
  selected, 
  onChange, 
  categories 
}: { 
  selected: string[]
  onChange: (categories: string[]) => void
  categories: string[]
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-900">Category</label>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {categories.map(category => (
          <label key={category} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(category)}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange([...selected, category])
                } else {
                  onChange(selected.filter(c => c !== category))
                }
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{category}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function BrandFilter({ 
  selected, 
  onChange, 
  brands 
}: { 
  selected: string[]
  onChange: (brands: string[]) => void
  brands: string[]
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-900">Brand</label>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {brands.map(brand => (
          <label key={brand} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(brand)}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange([...selected, brand])
                } else {
                  onChange(selected.filter(b => b !== brand))
                }
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{brand}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function PriceRangeFilter({ 
  selected, 
  onChange 
}: { 
  selected?: { min: number; max: number }
  onChange: (range: { min: number; max: number } | undefined) => void
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-900">Price Range</label>
      <div className="space-y-1">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            name="priceRange"
            checked={!selected}
            onChange={() => onChange(undefined)}
            className="text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Any Price</span>
        </label>
        {PRICE_RANGES.map(range => (
          <label key={range.label} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="priceRange"
              checked={selected?.min === range.min && selected?.max === range.max}
              onChange={() => onChange({ min: range.min, max: range.max })}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{range.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function RatingFilter({ 
  selected, 
  onChange 
}: { 
  selected?: { min: number; max: number }
  onChange: (rating: { min: number; max: number } | undefined) => void
}) {
  const ratings = [5, 4, 3, 2, 1]
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-900">Rating</label>
      <div className="space-y-1">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            name="rating"
            checked={!selected}
            onChange={() => onChange(undefined)}
            className="text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Any Rating</span>
        </label>
        {ratings.map(rating => (
          <label key={rating} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="rating"
              checked={selected?.min === rating}
              onChange={() => onChange({ min: rating, max: 5 })}
              className="text-blue-600 focus:ring-blue-500"
            />
            <div className="flex items-center space-x-1">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <StarIcon
                    key={i}
                    className={cn(
                      'h-4 w-4',
                      i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-700">& Up</span>
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}

// Main search component
export default function AdvancedSearchSystem({
  onSearch,
  onResults,
  initialQuery = '',
  initialType = 'all',
  showFilters = true,
  className = ''
}: AdvancedSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Search state
  const [query, setQuery] = useState(initialQuery)
  const [searchType, setSearchType] = useState<SearchType>(initialType)
  const [filters, setFilters] = useState<SearchFilters>({})
  const [sort, setSort] = useState<SortOption>('relevance')
  const [direction, setDirection] = useState<SortDirection>('desc')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  
  // Results state
  const [results, setResults] = useState<SearchResult[]>([])
  const [total, setTotal] = useState(0)
  const [facets, setFacets] = useState<SearchResponse['facets']>({
    brands: [],
    categories: [],
    priceRanges: [],
    ratings: [],
    contentTypes: [],
    authors: []
  })
  const [isSearching, setIsSearching] = useState(false)
  const [searchTime, setSearchTime] = useState(0)

  // Initialize from URL params
  useEffect(() => {
    const urlQuery = searchParams.get('q') || ''
    const urlType = searchParams.get('type') as SearchType || 'all'
    const urlSort = searchParams.get('sort') as SortOption || 'relevance'
    
    setQuery(urlQuery)
    setSearchType(urlType)
    setSort(urlSort)
    
    if (urlQuery) {
      performSearch(urlQuery, urlType, {}, urlSort, 'desc')
    }
  }, [searchParams])

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce((searchQuery: string) => {
      if (searchQuery.trim()) {
        performSearch(searchQuery, searchType, filters, sort, direction)
      }
    }, 300),
    [searchType, filters, sort, direction]
  )

  // Perform search (mock implementation)
  const performSearch = useCallback(async (
    searchQuery: string,
    type: SearchType,
    searchFilters: SearchFilters,
    sortOption: SortOption,
    sortDirection: SortDirection
  ) => {
    setIsSearching(true)
    const startTime = Date.now()
    
    try {
      // Mock API call - in real implementation, this would call your search API
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Mock results generation
      const mockResults: SearchResult[] = Array.from({ length: 25 }, (_, i) => ({
        id: `result-${i}`,
        type: ['device', 'article', 'comparison', 'review'][Math.floor(Math.random() * 4)] as any,
        title: `${searchQuery} - Result ${i + 1}`,
        description: `This is a mock search result for "${searchQuery}". It demonstrates the search functionality with relevant content and metadata.`,
        url: `/result/${i + 1}`,
        thumbnail: `https://picsum.photos/400/300?random=${i}`,
        metadata: {
          author: ['John Doe', 'Jane Smith', 'Tech Reviewer'][Math.floor(Math.random() * 3)],
          date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
          rating: Math.floor(Math.random() * 5) + 1,
          price: Math.floor(Math.random() * 2000) + 100,
          brand: MOCK_BRANDS[Math.floor(Math.random() * MOCK_BRANDS.length)],
          category: MOCK_CATEGORIES[Math.floor(Math.random() * MOCK_CATEGORIES.length)],
          tags: ['tag1', 'tag2', 'tag3'].slice(0, Math.floor(Math.random() * 3) + 1),
          relevanceScore: Math.random(),
          highlights: [`Highlighting <mark>${searchQuery}</mark> in content`]
        }
      }))
      
      // Mock facets
      const mockFacets = {
        brands: MOCK_BRANDS.slice(0, 8).map(brand => ({ name: brand, count: Math.floor(Math.random() * 50) + 1 })),
        categories: MOCK_CATEGORIES.slice(0, 6).map(cat => ({ name: cat, count: Math.floor(Math.random() * 30) + 1 })),
        priceRanges: PRICE_RANGES.map(range => ({ range: range.label, count: Math.floor(Math.random() * 20) + 1 })),
        ratings: [5, 4, 3, 2, 1].map(rating => ({ rating, count: Math.floor(Math.random() * 40) + 1 })),
        contentTypes: ['Review', 'Comparison', 'News', 'Guide'].map(type => ({ type, count: Math.floor(Math.random() * 25) + 1 })),
        authors: ['John Doe', 'Jane Smith', 'Tech Reviewer'].map(name => ({ name, count: Math.floor(Math.random() * 15) + 1 }))
      }
      
      const response: SearchResponse = {
        results: mockResults,
        total: 250,
        facets: mockFacets,
        suggestions: [`${searchQuery} review`, `${searchQuery} specs`, `${searchQuery} comparison`],
        searchTime: Date.now() - startTime
      }
      
      setResults(response.results)
      setTotal(response.total)
      setFacets(response.facets)
      setSearchTime(response.searchTime)
      
      // Call callbacks
      onResults?.(response)
      onSearch?.({ query: searchQuery, type, filters: searchFilters, sort: sortOption, direction: sortDirection, page: 1, limit: 25 })
      
      // Update URL
      const params = new URLSearchParams()
      if (searchQuery) params.set('q', searchQuery)
      if (type !== 'all') params.set('type', type)
      if (sortOption !== 'relevance') params.set('sort', sortOption)
      
      router.replace(`?${params.toString()}`, { scroll: false })
      
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }, [onSearch, onResults, router])

  // Handle search input change
  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery)
    debouncedSearch(newQuery)
  }, [debouncedSearch])

  // Handle filter changes
  const handleFilterChange = useCallback((filterKey: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [filterKey]: value }
    setFilters(newFilters)
    
    if (query.trim()) {
      performSearch(query, searchType, newFilters, sort, direction)
    }
  }, [filters, query, searchType, sort, direction, performSearch])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({})
    if (query.trim()) {
      performSearch(query, searchType, {}, sort, direction)
    }
  }, [query, searchType, sort, direction, performSearch])

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0
    Object.values(filters).forEach(value => {
      if (Array.isArray(value) && value.length > 0) count++
      else if (value && typeof value === 'object' && !Array.isArray(value)) count++
    })
    return count
  }, [filters])

  return (
    <div className={cn('advanced-search-system', className)}>
      {/* Search Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        {/* Search Input */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search for devices, reviews, comparisons..."
            className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-lg"
          />
          {isSearching && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
            </div>
          )}
        </div>
        
        {/* Search Type Tabs */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-1">
            {[
              { value: 'all', label: 'All Results', icon: MagnifyingGlassIcon },
              { value: 'devices', label: 'Devices', icon: DevicePhoneMobileIcon },
              { value: 'articles', label: 'Articles', icon: Bars3BottomLeftIcon },
              { value: 'comparisons', label: 'Comparisons', icon: ComputerDesktopIcon },
              { value: 'reviews', label: 'Reviews', icon: StarIcon }
            ].map(type => (
              <button
                key={type.value}
                onClick={() => {
                  setSearchType(type.value as SearchType)
                  if (query.trim()) {
                    performSearch(query, type.value as SearchType, filters, sort, direction)
                  }
                }}
                className={cn(
                  'flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  searchType === type.value
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                )}
              >
                <type.icon className="h-4 w-4" />
                <span>{type.label}</span>
              </button>
            ))}
          </div>
          
          {showFilters && (
            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center space-x-2"
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          )}
        </div>
        
        {/* Sort Options */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {total > 0 ? `${total.toLocaleString()} results` : 'No results'} 
              {searchTime > 0 && ` (${searchTime}ms)`}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Sort by:</label>
            <select
              value={sort}
              onChange={(e) => {
                const newSort = e.target.value as SortOption
                setSort(newSort)
                if (query.trim()) {
                  performSearch(query, searchType, filters, newSort, direction)
                }
              }}
              className="text-sm border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Advanced Filters</h3>
            <div className="flex items-center space-x-2">
              {activeFilterCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                >
                  Clear All
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(false)}
              >
                <XMarkIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Category Filter */}
            <CategoryFilter
              selected={filters.category || []}
              onChange={(categories) => handleFilterChange('category', categories)}
              categories={MOCK_CATEGORIES}
            />
            
            {/* Brand Filter */}
            <BrandFilter
              selected={filters.brand || []}
              onChange={(brands) => handleFilterChange('brand', brands)}
              brands={MOCK_BRANDS}
            />
            
            {/* Price Range Filter */}
            <PriceRangeFilter
              selected={filters.priceRange}
              onChange={(range) => handleFilterChange('priceRange', range)}
            />
            
            {/* Rating Filter */}
            <RatingFilter
              selected={filters.rating}
              onChange={(rating) => handleFilterChange('rating', rating)}
            />
          </div>
        </div>
      )}
      
      {/* Search Results */}
      <div className="space-y-4">
        {results.map(result => (
          <div key={result.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex space-x-4">
              {result.thumbnail && (
                <div className="flex-shrink-0">
                  <img
                    src={result.thumbnail}
                    alt={result.title}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600">
                      <a href={result.url}>{result.title}</a>
                    </h3>
                    <p className="text-sm text-gray-600 mt-1" dangerouslySetInnerHTML={{ __html: result.description }} />
                  </div>
                  {result.metadata.rating && (
                    <div className="flex items-center space-x-1 ml-4">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={cn(
                              'h-4 w-4',
                              i < result.metadata.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">({result.metadata.rating})</span>
                    </div>
                  )}
                </div>
                
                {/* Metadata */}
                <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                  <span className="capitalize bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                    {result.type}
                  </span>
                  {result.metadata.author && <span>By {result.metadata.author}</span>}
                  {result.metadata.date && (
                    <span>{new Date(result.metadata.date).toLocaleDateString()}</span>
                  )}
                  {result.metadata.price && (
                    <span className="font-medium text-green-600">
                      ${result.metadata.price.toLocaleString()}
                    </span>
                  )}
                  {result.metadata.brand && <span>{result.metadata.brand}</span>}
                </div>
                
                {/* Tags */}
                {result.metadata.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {result.metadata.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {results.length === 0 && query && !isSearching && (
          <div className="text-center py-12">
            <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600">Try adjusting your search terms or filters</p>
          </div>
        )}
      </div>
    </div>
  )
}