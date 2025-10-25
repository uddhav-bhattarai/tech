"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import MainLayout from "@/components/layouts/MainLayout"
import DashboardLayout from "@/components/layouts/DashboardLayout"
import { announceToScreenReader } from "@/lib/accessibility"
import { useAuth } from "@/hooks/useAuth"

interface Device {
  id: string
  name: string
  model: string
  slug: string
  currentPrice?: number
  currency: string
  brand: {
    id: string
    name: string
    logo?: string
  }
  images: Array<{
    id: string
    url: string
    alt?: string
    type?: string
  }>
  averageRating?: number
  _count: {
    reviews: number
    comparisons: number
  }
  availability: string
}

interface Brand {
  id: string
  name: string
  _count: {
    devices: number
  }
}

export default function DevicesPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBrand, setSelectedBrand] = useState("")
  const [priceRange, setPriceRange] = useState({ min: "", max: "" })
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState("desc")

  // Choose layout based on authentication status
  const Layout = user ? DashboardLayout : MainLayout;

  useEffect(() => {
    fetchBrands()
  }, [])

  const fetchBrands = async () => {
    try {
      const response = await fetch("/api/brands")
      const data = await response.json()
      setBrands(data.brands || [])
    } catch (error) {
      console.error("Failed to fetch brands:", error)
    }
  }

  const fetchDevices = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "12",
        ...(searchQuery && { search: searchQuery }),
        ...(selectedBrand && { brandId: selectedBrand }),
        ...(priceRange.min && { minPrice: priceRange.min }),
        ...(priceRange.max && { maxPrice: priceRange.max }),
        sortBy,
        sortOrder,
      })

      const response = await fetch(`/api/devices?${params}`)
      const data = await response.json()
      
      setDevices(data.devices || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error("Failed to fetch devices:", error)
      setDevices([])
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, searchQuery, selectedBrand, priceRange, sortBy, sortOrder])

  useEffect(() => {
    fetchDevices()
  }, [fetchDevices])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchDevices()
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency === "NPR" ? "USD" : currency,
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <Layout>
      <main id="main-content" className="min-h-screen bg-aaa-light-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-aaa-high mb-2">
              Mobile Devices
            </h1>
            <p className="text-aaa-medium">
              Explore {devices.length > 0 ? `${devices.length} of our` : 'our'} curated mobile devices with detailed specifications and reviews.
            </p>
          </header>
          
          {/* Search and Filters */}
          <section 
            className="card-accessible p-6 mb-6" 
            aria-labelledby="filters-heading"
          >
            <h2 id="filters-heading" className="text-xl font-semibold text-aaa-high mb-4">
              Search and Filter Options
            </h2>
            
            <form 
              onSubmit={handleSearch} 
              className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
              role="search"
              aria-label="Device search and filtering"
            >
              <div className="form-field">
                <label 
                  htmlFor="search-input"
                  className="block text-sm font-medium text-aaa-high mb-2"
                >
                  Search Devices
                </label>
                <input
                  id="search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, model, or brand..."
                  className="form-input w-full"
                  aria-describedby="search-help"
                />
                <div id="search-help" className="sr-only">
                  Enter device name, model, or brand to filter results. Press Enter or click Search to apply.
                </div>
              </div>
              
              <div className="form-field">
                <label 
                  htmlFor="brand-filter"
                  className="block text-sm font-medium text-aaa-high mb-2"
                >
                  Brand
                </label>
                <select
                  id="brand-filter"
                  value={selectedBrand}
                  onChange={(e) => {
                    setSelectedBrand(e.target.value)
                    announceToScreenReader(
                      e.target.value 
                        ? `Brand filter changed to ${brands.find(b => b.id === e.target.value)?.name}`
                        : 'Brand filter cleared'
                    )
                  }}
                  className="form-input w-full"
                  aria-describedby="brand-help"
                >
                  <option value="">All Brands</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name} ({brand._count.devices} devices)
                    </option>
                  ))}
                </select>
                <div id="brand-help" className="sr-only">
                  Filter devices by specific brand. Shows device count for each brand.
                </div>
              </div>
              
              <div className="form-field">
                <label 
                  htmlFor="min-price"
                  className="block text-sm font-medium text-aaa-high mb-2"
                >
                  Minimum Price
                </label>
                <input
                  id="min-price"
                  type="number"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  placeholder="Min price"
                  className="form-input w-full"
                  aria-describedby="min-price-help"
                  min="0"
                />
                <div id="min-price-help" className="sr-only">
                  Set minimum price filter. Enter amount in USD.
                </div>
              </div>
              
              <div className="form-field">
                <label 
                  htmlFor="max-price"
                  className="block text-sm font-medium text-aaa-high mb-2"
                >
                  Maximum Price
                </label>
                <input
                  id="max-price"
                  type="number"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  placeholder="Max price"
                  className="form-input w-full"
                  aria-describedby="max-price-help"
                  min="0"
                />
                <div id="max-price-help" className="sr-only">
                  Set maximum price filter. Enter amount in USD.
                </div>
              </div>

              <div className="md:col-span-4">
                <button
                  type="submit"
                  className="interactive-primary px-6 py-2 rounded-lg"
                  aria-describedby="search-button-help"
                >
                  Apply Filters
                </button>
                <div id="search-button-help" className="sr-only">
                  Apply current search and filter settings to device results
                </div>
              </div>
            </form>
            
            {/* Sort Controls */}
            <div className="flex flex-wrap gap-4 items-center justify-between border-t border-gray-300 pt-4">
              <div className="flex gap-4">
                <div>
                  <label 
                    htmlFor="sort-by"
                    className="block text-sm font-medium text-aaa-high mb-1"
                  >
                    Sort by
                  </label>
                  <select
                    id="sort-by"
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value)
                      announceToScreenReader(`Sorting changed to ${e.target.selectedOptions[0].text}`)
                    }}
                    className="form-input"
                    aria-describedby="sort-by-help"
                  >
                    <option value="createdAt">Date Added</option>
                    <option value="name">Name</option>
                    <option value="currentPrice">Price</option>
                    <option value="averageRating">Rating</option>
                  </select>
                  <div id="sort-by-help" className="sr-only">
                    Choose how to sort device results
                  </div>
                </div>
                
                <div>
                  <label 
                    htmlFor="sort-order"
                    className="block text-sm font-medium text-aaa-high mb-1"
                  >
                    Order
                  </label>
                  <select
                    id="sort-order"
                    value={sortOrder}
                    onChange={(e) => {
                      setSortOrder(e.target.value)
                      announceToScreenReader(`Sort order changed to ${e.target.value === 'desc' ? 'descending' : 'ascending'}`)
                    }}
                    className="form-input"
                    aria-describedby="sort-order-help"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                  <div id="sort-order-help" className="sr-only">
                    Choose ascending or descending sort order
                  </div>
                </div>
              </div>

              <div className="text-sm text-aaa-medium">
                {isLoading ? (
                  <span aria-live="polite">Loading devices...</span>
                ) : (
                  <span aria-live="polite" aria-atomic="true">
                    Showing {devices.length} device{devices.length !== 1 ? 's' : ''}
                    {searchQuery && ` for "${searchQuery}"`}
                  </span>
                )}
              </div>
            </div>
          </section>
          
          {/* Device Results */}
          <section aria-labelledby="results-heading">
            <div className="sr-only">
              <h2 id="results-heading">Device Results</h2>
            </div>
            
            {/* Loading State */}
            {isLoading ? (
              <div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                aria-label="Loading devices"
              >
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="card-accessible animate-pulse" aria-hidden="true">
                    <div className="bg-gray-300 aspect-square rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-2/3 mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Device Grid */}
                {devices.length > 0 ? (
                  <div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    role="list"
                    aria-label={`${devices.length} devices found`}
                  >
                    {devices.map((device) => (
                      <article 
                        key={device.id}
                        className="card-accessible hover:shadow-lg transition-all duration-200"
                        role="listitem"
                      >
                        <Link
                          href={`/devices/${device.slug}`}
                          className="block focus-visible:focus h-full"
                          aria-describedby={`device-${device.id}-details`}
                        >
                          <div className="aspect-square relative bg-gray-100 rounded-t-lg overflow-hidden">
                            {device.images.length > 0 ? (
                              <Image
                                src={device.images[0].url}
                                alt={device.images[0].alt || `${device.brand.name} ${device.name} ${device.model} product image`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full text-aaa-medium">
                                <svg 
                                  className="w-16 h-16" 
                                  fill="currentColor" 
                                  viewBox="0 0 20 20"
                                  aria-hidden="true"
                                >
                                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                                <span className="sr-only">No image available</span>
                              </div>
                            )}
                            
                            {/* Status Badges */}
                            {device.availability === "upcoming" && (
                              <div className="absolute top-2 left-2">
                                <span className="badge-primary">
                                  Upcoming
                                </span>
                              </div>
                            )}
                            
                            {device.availability === "discontinued" && (
                              <div className="absolute top-2 left-2">
                                <span className="badge-danger">
                                  Discontinued
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm text-aaa-medium font-medium">
                                {device.brand.name}
                              </span>
                            </div>
                            
                            <h3 className="font-semibold text-aaa-high mb-2 leading-tight">
                              {device.name} {device.model}
                            </h3>
                            
                            <div 
                              id={`device-${device.id}-details`}
                              className="flex items-center justify-between mt-3"
                            >
                              <div>
                                {device.currentPrice ? (
                                  <p className="text-lg font-bold text-aaa-high">
                                    {formatPrice(device.currentPrice, device.currency)}
                                  </p>
                                ) : (
                                  <p className="text-sm text-aaa-medium">
                                    Price not available
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-1">
                                {device.averageRating ? (
                                  <>
                                    <span className="text-yellow-600" aria-hidden="true">★</span>
                                    <span className="text-sm text-aaa-medium font-medium">
                                      {device.averageRating.toFixed(1)}
                                    </span>
                                    <span className="sr-only">
                                      Average rating {device.averageRating.toFixed(1)} out of 5 stars
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-sm text-aaa-medium">
                                    Not rated
                                  </span>
                                )}
                                <span className="text-xs text-aaa-low ml-1">
                                  ({device._count.reviews} review{device._count.reviews !== 1 ? 's' : ''})
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div 
                    className="text-center py-12 card-accessible"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 text-aaa-low">
                      <svg fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-aaa-high mb-2">
                      No devices found
                    </h3>
                    <p className="text-aaa-medium">
                      Try adjusting your search criteria or filters to find more devices.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery("")
                        setSelectedBrand("")
                        setPriceRange({ min: "", max: "" })
                        setCurrentPage(1)
                      }}
                      className="interactive-secondary mt-4"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <nav 
                    className="mt-12 flex justify-center"
                    aria-label="Device results pagination"
                    role="navigation"
                  >
                    <div className="flex items-center gap-2">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => {
                          setCurrentPage(currentPage - 1)
                          announceToScreenReader(`Moving to page ${currentPage - 1}`)
                        }}
                        className="interactive-secondary disabled px-4 py-2 text-sm"
                        aria-label="Go to previous page"
                      >
                        Previous
                      </button>
                      
                      <div className="flex gap-1" role="list" aria-label="Page numbers">
                        {[...Array(Math.min(7, totalPages))].map((_, i) => {
                          const page = Math.max(1, Math.min(
                            currentPage - 3 + i, 
                            totalPages - 6 + i
                          ))
                          const isCurrentPage = currentPage === page
                          
                          return (
                            <button
                              key={page}
                              onClick={() => {
                                setCurrentPage(page)
                                announceToScreenReader(`Page ${page} selected`)
                              }}
                              className={`px-3 py-2 text-sm rounded-md font-medium transition-colors ${
                                isCurrentPage
                                  ? "interactive-primary"
                                  : "interactive-secondary"
                              }`}
                              aria-current={isCurrentPage ? "page" : undefined}
                              aria-label={`${isCurrentPage ? 'Current page, ' : ''}Page ${page}`}
                            >
                              {page}
                            </button>
                          )
                        })}
                      </div>
                      
                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => {
                          setCurrentPage(currentPage + 1)
                          announceToScreenReader(`Moving to page ${currentPage + 1}`)
                        }}
                        className="interactive-secondary disabled px-4 py-2 text-sm"
                        aria-label="Go to next page"
                      >
                        Next
                      </button>
                    </div>
                    
                    <div className="ml-4 text-sm text-aaa-medium self-center">
                      Page {currentPage} of {totalPages}
                    </div>
                  </nav>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </Layout>
  )
}