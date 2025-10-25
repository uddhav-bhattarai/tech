"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { 
  TrashIcon, 
  EyeIcon, 
  ShareIcon,
  PlusIcon,
  CalendarDaysIcon,
  DevicePhoneMobileIcon
} from "@heroicons/react/24/outline"
import { formatDistanceToNow } from "date-fns"

interface SavedComparison {
  id: string
  name: string
  description: string | null
  isPublic: boolean
  createdAt: string
  updatedAt: string
  user: {
    name: string | null
    image: string | null
  }
  devices: Array<{
    device: {
      id: string
      name: string
      slug: string
      brand: {
        name: string
        logo: string | null
      }
      images: Array<{
        url: string
        alt: string | null
      }>
    }
  }>
}

export default function SavedComparisons() {
  const { data: session } = useSession()
  const [comparisons, setComparisons] = useState<SavedComparison[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (session) {
      fetchComparisons()
    } else {
      setLoading(false)
    }
  }, [session])

  const fetchComparisons = async () => {
    try {
      const response = await fetch("/api/comparisons")
      if (response.ok) {
        const data = await response.json()
        setComparisons(data.comparisons || [])
      }
    } catch (error) {
      console.error("Error fetching comparisons:", error)
    } finally {
      setLoading(false)
    }
  }

  const deleteComparison = async (id: string) => {
    if (!confirm("Are you sure you want to delete this comparison?")) return

    try {
      setDeletingId(id)
      const response = await fetch(`/api/comparisons/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setComparisons(comparisons.filter(c => c.id !== id))
      } else {
        alert("Failed to delete comparison. Please try again.")
      }
    } catch (error) {
      console.error("Error deleting comparison:", error)
      alert("Failed to delete comparison. Please try again.")
    } finally {
      setDeletingId(null)
    }
  }

  const copyShareLink = async (comparison: SavedComparison) => {
    if (!comparison.isPublic) {
      alert("This comparison is private and cannot be shared.")
      return
    }

    const shareUrl = `${window.location.origin}/compare/${comparison.id}`
    
    try {
      await navigator.clipboard.writeText(shareUrl)
      alert("Share link copied to clipboard!")
    } catch (error) {
      console.error("Failed to copy link:", error)
      alert("Failed to copy link. Please try again.")
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <DevicePhoneMobileIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-2 text-lg font-semibold text-gray-900">Sign in required</h2>
          <p className="mt-1 text-sm text-gray-500">
            You need to sign in to view your saved comparisons.
          </p>
          <div className="mt-6">
            <Link
              href="/auth/signin"
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
              Loading your comparisons...
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between mb-8">
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold leading-7 text-gray-900 sm:truncate sm:text-4xl sm:tracking-tight">
                Saved Comparisons
              </h1>
              <p className="mt-1 text-lg text-gray-500">
                Manage and view your device comparisons
              </p>
            </div>
            
            <div className="mt-4 flex md:ml-4 md:mt-0">
              <Link
                href="/compare"
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                New Comparison
              </Link>
            </div>
          </div>

          {comparisons.length === 0 ? (
            <div className="text-center py-12">
              <DevicePhoneMobileIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No saved comparisons</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first device comparison.
              </p>
              <div className="mt-6">
                <Link
                  href="/compare"
                  className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                  Create Comparison
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {comparisons.map((comparison) => (
                <div key={comparison.id} className="bg-white shadow-sm rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {comparison.name}
                      </h3>
                      {comparison.description && (
                        <p className="text-sm text-gray-600 mb-4">
                          {comparison.description}
                        </p>
                      )}
                      
                      {/* Device Preview */}
                      <div className="flex flex-wrap items-center gap-4 mb-4">
                        {comparison.devices.map(({ device }) => (
                          <div key={device.id} className="flex items-center space-x-2">
                            {device.images[0] && (
                              <div className="relative w-8 h-8 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                <Image
                                  src={device.images[0].url}
                                  alt={device.images[0].alt || device.name}
                                  fill
                                  className="object-contain"
                                />
                              </div>
                            )}
                            <span className="text-sm text-gray-700">
                              {device.brand.name} {device.name}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <CalendarDaysIcon className="h-4 w-4 mr-1" />
                          Created {formatDistanceToNow(new Date(comparison.createdAt), { addSuffix: true })}
                        </div>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          comparison.isPublic 
                            ? "bg-green-100 text-green-800" 
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {comparison.isPublic ? "Public" : "Private"}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span>{comparison.devices.length} devices</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <Link
                        href={`/compare/${comparison.id}`}
                        className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </Link>
                      
                      {comparison.isPublic && (
                        <button
                          onClick={() => copyShareLink(comparison)}
                          className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          <ShareIcon className="h-4 w-4 mr-1" />
                          Share
                        </button>
                      )}
                      
                      <button
                        onClick={() => deleteComparison(comparison.id)}
                        disabled={deletingId === comparison.id}
                        className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-red-700 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        {deletingId === comparison.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}