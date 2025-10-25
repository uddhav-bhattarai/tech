"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { 
  PlusIcon, 
  XMarkIcon, 
  MagnifyingGlassIcon,
  ShareIcon,
  BookmarkIcon,
  ArrowsRightLeftIcon 
} from "@heroicons/react/24/outline"

interface Device {
  id: string
  name: string
  slug: string
  model: string
  brand: {
    id: string
    name: string
    logo: string | null
  }
  launchPrice: number | null
  currentPrice: number | null
  currency: string
  displaySize: number | null
  batteryCapacity: number | null
  ramConfigurations: number[]
  storageConfigurations: number[]
  operatingSystem: string | null
  chipset: string | null
  releaseDate: string | null
  images: Array<{
    url: string
    alt: string | null
  }>
}

interface ComparisonProps {
  initialDevices?: Device[]
}

export default function DeviceComparison({ initialDevices = [] }: ComparisonProps) {
  const { data: session } = useSession()
  const [devices, setDevices] = useState<Device[]>(initialDevices)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Device[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(!initialDevices.length)
  const [comparisonName, setComparisonName] = useState("")
  const [saving, setSaving] = useState(false)

  const maxDevices = 5
  const canAddMore = devices.length < maxDevices

  const searchDevices = async () => {
    try {
      setIsSearching(true)
      const response = await fetch(`/api/devices?search=${encodeURIComponent(searchQuery)}&limit=10`)
      
      if (response.ok) {
        const data = await response.json()
        // Filter out devices already in comparison
        const filtered = data.devices.filter((device: Device) => 
          !devices.some(d => d.id === device.id)
        )
        setSearchResults(filtered)
      }
    } catch (error) {
      console.error("Error searching devices:", error)
    } finally {
      setIsSearching(false)
    }
  }

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchDevices()
    } else {
      setSearchResults([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, devices])

  const addDevice = (device: Device) => {
    if (devices.length < maxDevices && !devices.some(d => d.id === device.id)) {
      setDevices([...devices, device])
      setSearchQuery("")
      setSearchResults([])
      
      if (devices.length === 0) {
        setShowSearch(false)
      }
    }
  }

  const removeDevice = (deviceId: string) => {
    setDevices(devices.filter(d => d.id !== deviceId))
    if (devices.length === 1) {
      setShowSearch(true)
    }
  }

  const saveComparison = async () => {
    if (!session || devices.length < 2) return

    try {
      setSaving(true)
      const response = await fetch("/api/comparisons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: comparisonName || `${devices[0]?.name} vs ${devices[1]?.name}${devices.length > 2 ? ` +${devices.length - 2} more` : ""}`,
          description: `Comparison of ${devices.map(d => d.name).join(", ")}`,
          deviceIds: devices.map(d => d.id),
          isPublic: true,
        }),
      })

      if (response.ok) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const comparison = await response.json()
        // Could redirect to saved comparison page or show success message
        alert("Comparison saved successfully!")
      }
    } catch (error) {
      console.error("Error saving comparison:", error)
      alert("Failed to save comparison. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const formatPrice = (price: number | null, currency: string) => {
    if (!price) return "N/A"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency === "NPR" ? "USD" : currency,
    }).format(currency === "NPR" ? price / 130 : price) // Rough NPR to USD conversion
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    })
  }

  const formatStorage = (configurations: number[]) => {
    if (!configurations?.length) return "N/A"
    return configurations.map(size => `${size}GB`).join(", ")
  }

  const formatRAM = (configurations: number[]) => {
    if (!configurations?.length) return "N/A"
    return configurations.map(size => `${size}GB`).join(", ")
  }

  // Comparison specifications to display
  const comparisonSpecs = [
    {
      category: "Basic Info",
      specs: [
        { label: "Brand", key: "brand", render: (device: Device) => device.brand.name },
        { label: "Model", key: "model", render: (device: Device) => device.model },
        { label: "Release Date", key: "releaseDate", render: (device: Device) => formatDate(device.releaseDate) },
        { label: "Operating System", key: "operatingSystem", render: (device: Device) => device.operatingSystem || "N/A" },
      ]
    },
    {
      category: "Display & Performance",
      specs: [
        { label: "Display Size", key: "displaySize", render: (device: Device) => device.displaySize ? `${device.displaySize}"` : "N/A" },
        { label: "Processor", key: "chipset", render: (device: Device) => device.chipset || "N/A" },
        { label: "RAM Options", key: "ramConfigurations", render: (device: Device) => formatRAM(device.ramConfigurations) },
        { label: "Storage Options", key: "storageConfigurations", render: (device: Device) => formatStorage(device.storageConfigurations) },
      ]
    },
    {
      category: "Battery & Pricing",
      specs: [
        { label: "Battery Capacity", key: "batteryCapacity", render: (device: Device) => device.batteryCapacity ? `${device.batteryCapacity} mAh` : "N/A" },
        { label: "Launch Price", key: "launchPrice", render: (device: Device) => formatPrice(device.launchPrice, device.currency) },
        { label: "Current Price", key: "currentPrice", render: (device: Device) => formatPrice(device.currentPrice, device.currency) },
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
        <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between mb-8">
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold leading-7 text-gray-900 sm:truncate sm:text-4xl sm:tracking-tight">
                Device Comparison
              </h1>
              <p className="mt-1 text-lg text-gray-500">
                Compare up to {maxDevices} devices side by side
              </p>
            </div>
            
            {devices.length >= 2 && session && (
              <div className="mt-4 flex md:ml-4 md:mt-0 space-x-3">
                <input
                  type="text"
                  placeholder="Comparison name (optional)"
                  value={comparisonName}
                  onChange={(e) => setComparisonName(e.target.value)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                <button
                  onClick={saveComparison}
                  disabled={saving}
                  className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  <BookmarkIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                  {saving ? "Saving..." : "Save Comparison"}
                </button>
              </div>
            )}
          </div>

          {/* Device Search */}
          {(showSearch || devices.length === 0) && canAddMore && (
            <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Add Devices to Compare</h2>
                {devices.length > 0 && (
                  <button
                    onClick={() => setShowSearch(false)}
                    className="text-gray-400 hover:text-gray-500"
                    aria-label="Close search"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
              
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  placeholder="Search for devices to compare..."
                  aria-label="Search for devices"
                />
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-4 max-h-60 overflow-y-auto">
                  <div className="grid grid-cols-1 gap-3">
                    {searchResults.map((device) => (
                      <button
                        key={device.id}
                        onClick={() => addDevice(device)}
                        className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-left transition-colors"
                        aria-label={`Add ${device.name} to comparison`}
                      >
                        {device.images[0] && (
                          <div className="relative w-12 h-12 mr-3 bg-white rounded-md overflow-hidden flex-shrink-0">
                            <Image
                              src={device.images[0].url}
                              alt={device.images[0].alt || device.name}
                              fill
                              className="object-contain"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {device.brand.name} {device.name}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {device.model}
                          </p>
                        </div>
                        <div className="text-sm text-gray-900 font-medium">
                          {formatPrice(device.currentPrice || device.launchPrice, device.currency)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isSearching && (
                <div className="mt-4 text-center text-gray-500">
                  <div className="inline-flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Searching...
                  </div>
                </div>
              )}
            </div>
          )}
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {devices.length === 0 ? (
            <div className="text-center py-12">
              <ArrowsRightLeftIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No devices to compare</h3>
              <p className="mt-1 text-sm text-gray-500">
                Search and add devices above to start comparing.
              </p>
            </div>
          ) : devices.length === 1 ? (
            <div className="text-center py-12">
              <ArrowsRightLeftIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">Add more devices</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add at least one more device to start comparing.
              </p>
            </div>
          ) : (
            <>
              {/* Add more devices button */}
              {canAddMore && !showSearch && (
                <div className="mb-6">
                  <button
                    onClick={() => setShowSearch(true)}
                    className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                    Add Another Device ({devices.length}/{maxDevices})
                  </button>
                </div>
              )}

              {/* Comparison Table */}
              <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-300">
                    {/* Device Headers */}
                    <thead>
                      <tr className="bg-gray-50">
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 sticky left-0 bg-gray-50 z-10">
                          Specification
                        </th>
                        {devices.map((device) => (
                          <th key={device.id} scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 min-w-64">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                {device.images[0] && (
                                  <div className="relative w-10 h-10 bg-white rounded-md overflow-hidden flex-shrink-0">
                                    <Image
                                      src={device.images[0].url}
                                      alt={device.images[0].alt || device.name}
                                      fill
                                      className="object-contain"
                                    />
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium text-gray-900">
                                    <Link
                                      href={`/devices/${device.slug}`}
                                      className="hover:text-blue-600"
                                      target="_blank"
                                    >
                                      {device.name}
                                    </Link>
                                  </div>
                                  <div className="text-sm text-gray-500">{device.brand.name}</div>
                                </div>
                              </div>
                              <button
                                onClick={() => removeDevice(device.id)}
                                className="text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-full p-1"
                                aria-label={`Remove ${device.name} from comparison`}
                              >
                                <XMarkIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>

                    {/* Specification Rows */}
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {comparisonSpecs.map((category) => (
                        <>
                          {/* Category Header */}
                          <tr key={`${category.category}-header`} className="bg-gray-100">
                            <td 
                              colSpan={devices.length + 1} 
                              className="px-4 py-3 text-sm font-semibold text-gray-900 sm:pl-6 sticky left-0 bg-gray-100 z-10"
                            >
                              {category.category}
                            </td>
                          </tr>
                          
                          {/* Specification Rows */}
                          {category.specs.map((spec) => (
                            <tr key={spec.key} className="hover:bg-gray-50">
                              <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 sticky left-0 bg-white hover:bg-gray-50 z-10 border-r border-gray-200">
                                {spec.label}
                              </td>
                              {devices.map((device) => (
                                <td key={`${device.id}-${spec.key}`} className="px-3 py-4 text-sm text-gray-900">
                                  {spec.render(device)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap gap-4">
                <Link
                  href="/compare/saved"
                  className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <BookmarkIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                  View Saved Comparisons
                </Link>
                
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <ShareIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                  Print / Export
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}