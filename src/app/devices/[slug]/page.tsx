import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import MainLayout from '@/components/layouts/MainLayout'
import { 
  Star,
  Heart,
  Share2,
  Camera,
  Monitor,
  Cpu,
  Smartphone,
  MessageCircle
} from 'lucide-react'

// Type definitions for camera objects
interface CameraSpec {
  megapixels?: number
  aperture?: string
  sensor?: string
  features?: string[]
}

interface DevicePageProps {
  params: Promise<{ slug: string }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: DevicePageProps): Promise<Metadata> {
  const { slug } = await params
  const device = await getDevice(slug)

  if (!device) {
    return {
      title: 'Device Not Found',
      description: 'The requested device could not be found.'
    }
  }

  return {
    title: `${device.name} ${device.model} - Full Review & Specifications`,
    description: `Complete review of ${device.name} ${device.model}. Get detailed specifications, camera samples, performance benchmarks, and expert analysis.`,
    keywords: `${device.name}, ${device.model}, ${device.brand.name}, smartphone review, specifications, camera, performance`,
    openGraph: {
      title: `${device.name} ${device.model} Review`,
      description: `Complete specifications and review of the ${device.name} ${device.model}`,
      images: device.images.length > 0 ? [device.images[0].url] : [],
    },
  }
}

async function getDevice(slug: string) {
  return await prisma.device.findFirst({
    where: { slug },
    include: {
      brand: true,
      images: { orderBy: { order: 'asc' } },
      reviews: {
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5
      },
      _count: { select: { reviews: true, comparisons: true } }
    }
  })
}

export default async function DevicePage({ params }: DevicePageProps) {
  const { slug } = await params
  const device = await getDevice(slug)

  if (!device) {
    notFound()
  }

  const averageRating = device.reviews.length > 0 
    ? device.reviews.reduce((sum, review) => sum + review.rating, 0) / device.reviews.length 
    : 0

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb Navigation */}
          <nav className="flex mb-8" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
                  Home
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <Link href="/devices" className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2">
                    Devices
                  </Link>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                    {device.name} {device.model}
                  </span>
                </div>
              </li>
            </ol>
          </nav>

          {/* Hero Section */}
          <div className="bg-white rounded-lg shadow-sm mb-8 p-6">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Device Image */}
              <div className="lg:w-1/2">
                {device.images.length > 0 ? (
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={device.images[0].url}
                      alt={`${device.name} ${device.model}`}
                      width={600}
                      height={600}
                      className="w-full h-full object-cover"
                      priority
                    />
                  </div>
                ) : (
                  <div className="aspect-square rounded-lg bg-gray-200 flex items-center justify-center">
                    <Smartphone className="w-24 h-24 text-gray-400" />
                    <span className="ml-4 text-gray-500">No image available</span>
                  </div>
                )}
              </div>

              {/* Device Information */}
              <div className="lg:w-1/2">
                <div className="space-y-4">
                  <div>
                    <p className="text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded inline-block text-sm">
                      {device.brand.name}
                    </p>
                    <h1 className="text-3xl font-bold text-gray-900 mt-2">
                      {device.name} {device.model}
                    </h1>
                  </div>

                  {/* Rating and Reviews */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.floor(averageRating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-lg font-semibold text-gray-900">
                      {averageRating.toFixed(1)}
                    </span>
                    <div className="flex items-center text-gray-600">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      <span>{device._count.reviews} reviews</span>
                    </div>
                  </div>

                  {/* Pricing */}
                  {device.currentPrice && (
                    <div className="space-y-3">
                      <div className="flex items-baseline gap-4">
                        <span className="text-4xl font-bold text-green-600">
                          ${device.currentPrice.toLocaleString()}
                        </span>
                        <span className="text-gray-600">{device.currency || 'USD'}</span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      <Heart className="w-5 h-5" />
                      Add to Wishlist
                    </button>
                    
                    <button className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Specifications Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-8">
            {/* Display Specs */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-blue-100 rounded-lg p-2">
                  <Monitor className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Display</h3>
              </div>
              
              <div className="space-y-4">
                {device.displaySize && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Screen Size</span>
                    <span className="font-medium">{device.displaySize}&quot;</span>
                  </div>
                )}
                
                {device.displayTechnology && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Technology</span>
                    <span className="font-medium">{device.displayTechnology}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Performance Specs */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-purple-100 rounded-lg p-2">
                  <Cpu className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Performance</h3>
              </div>
              
              <div className="space-y-4">
                {device.ramConfigurations && device.ramConfigurations.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">RAM Options</span>
                    <span className="font-medium">{device.ramConfigurations.join(', ')}GB</span>
                  </div>
                )}
                
                {device.storageConfigurations && device.storageConfigurations.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Storage Options</span>
                    <span className="font-medium">{device.storageConfigurations.join(', ')}GB</span>
                  </div>
                )}
                
                {device.chipset && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Chipset</span>
                    <span className="font-medium">{device.chipset}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Camera Specs */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-green-100 rounded-lg p-2">
                  <Camera className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Camera</h3>
              </div>
              
              <div className="space-y-4">
                {device.mainCamera && typeof device.mainCamera === 'object' && (device.mainCamera as CameraSpec).megapixels && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Main Camera</span>
                    <span className="font-medium">{(device.mainCamera as CameraSpec).megapixels}MP</span>
                  </div>
                )}
                
                {device.frontCamera && typeof device.frontCamera === 'object' && (device.frontCamera as CameraSpec).megapixels && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Front Camera</span>
                    <span className="font-medium">{(device.frontCamera as CameraSpec).megapixels}MP</span>
                  </div>
                )}
                
                {device.ultraWideCamera && typeof device.ultraWideCamera === 'object' && (device.ultraWideCamera as CameraSpec).megapixels && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Ultra-Wide Camera</span>
                    <span className="font-medium">{(device.ultraWideCamera as CameraSpec).megapixels}MP</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Related Devices */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <Smartphone className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">More from {device.brand.name}</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Explore more devices from {device.brand.name} to find the perfect match for your needs.
            </p>
            <div className="flex gap-3">
              <Link 
                href={`/devices?brand=${device.brand.name.toLowerCase()}`}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Smartphone className="w-4 h-4" />
                Browse {device.brand.name} Devices
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}