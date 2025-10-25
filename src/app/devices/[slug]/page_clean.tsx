import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import MainLayout from '@/components/layouts/MainLayout'
import { 
  Star,
  Heart,
  Share2,
  Camera,
  Battery,
  Monitor,
  Cpu,
  Smartphone,
  Wifi,
  MessageCircle
} from 'lucide-react'

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
                <a href="/" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
                  Home
                </a>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <a href="/devices" className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2">
                    Devices
                  </a>
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
                
                {/* Additional Images */}
                {device.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2 mt-4">
                    {device.images.slice(1, 5).map((image, index) => (
                      <div key={index} className="aspect-square rounded overflow-hidden bg-gray-100">
                        <Image
                          src={image.url}
                          alt={`${device.name} ${device.model} view ${index + 2}`}
                          width={150}
                          height={150}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
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
                    {device.availability && (
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-2 ${
                        device.availability === 'available' 
                          ? 'bg-green-100 text-green-800'
                          : device.availability === 'discontinued'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {device.availability}
                      </span>
                    )}
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
                      
                      {device.launchPrice && device.launchPrice > device.currentPrice && (
                        <div className="flex flex-col">
                          <span className="text-lg text-gray-500 line-through">
                            ${device.launchPrice.toLocaleString()}
                          </span>
                          <span className="text-sm text-green-600 font-medium">
                            Save ${(device.launchPrice - device.currentPrice).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Key Specs Quick View */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <h3 className="font-semibold text-gray-900 mb-2">Quick Specs</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {device.displaySize && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Display:</span>
                          <span className="font-medium">{device.displaySize}"</span>
                        </div>
                      )}
                      {device.ramCapacity && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">RAM:</span>
                          <span className="font-medium">{device.ramCapacity}GB</span>
                        </div>
                      )}
                      {device.storageCapacity && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Storage:</span>
                          <span className="font-medium">{device.storageCapacity}GB</span>
                        </div>
                      )}
                      {device.rearCameraMegapixels && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Camera:</span>
                          <span className="font-medium">{device.rearCameraMegapixels}MP</span>
                        </div>
                      )}
                    </div>
                  </div>

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
                    <span className="font-medium">{device.displaySize}"</span>
                  </div>
                )}
                
                {device.displayTechnology && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Technology</span>
                    <span className="font-medium">{device.displayTechnology}</span>
                  </div>
                )}
                
                {device.refreshRate && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Refresh Rate</span>
                    <span className="font-medium">{device.refreshRate}Hz</span>
                  </div>
                )}

                {device.screenResolution && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Resolution</span>
                    <span className="font-medium">{device.screenResolution}</span>
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
                {device.processorBrand && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Processor</span>
                    <span className="font-medium">{device.processorBrand} {device.processorModel}</span>
                  </div>
                )}
                
                {device.ramCapacity && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">RAM</span>
                    <span className="font-medium">{device.ramCapacity}GB</span>
                  </div>
                )}
                
                {device.storageCapacity && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Storage</span>
                    <span className="font-medium">{device.storageCapacity}GB</span>
                  </div>
                )}

                {device.operatingSystem && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">OS</span>
                    <span className="font-medium">{device.operatingSystem} {device.osVersion}</span>
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
                {device.rearCameraMegapixels && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Rear Camera</span>
                    <span className="font-medium">{device.rearCameraMegapixels}MP</span>
                  </div>
                )}
                
                {device.frontCameraMegapixels && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Front Camera</span>
                    <span className="font-medium">{device.frontCameraMegapixels}MP</span>
                  </div>
                )}

                {device.videoRecording && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Video Recording</span>
                    <span className="font-medium">{device.videoRecording}</span>
                  </div>
                )}

                {device.cameraFeatures && device.cameraFeatures.length > 0 && (
                  <div>
                    <span className="text-gray-600 block mb-1">Features</span>
                    <div className="flex flex-wrap gap-1">
                      {device.cameraFeatures.slice(0, 3).map((feature, index) => (
                        <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Battery */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-red-100 rounded-lg p-2">
                  <Battery className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Battery</h3>
              </div>
              
              <div className="space-y-4">
                {device.batteryCapacity && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Capacity</span>
                    <span className="font-medium">{device.batteryCapacity}mAh</span>
                  </div>
                )}

                {device.chargingSpeed && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Fast Charging</span>
                    <span className="font-medium">{device.chargingSpeed}W</span>
                  </div>
                )}

                {device.chargingType && device.chargingType.length > 0 && (
                  <div>
                    <span className="text-gray-600 block mb-1">Charging</span>
                    <div className="flex flex-wrap gap-1">
                      {device.chargingType.map((type, index) => (
                        <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Connectivity */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-cyan-100 rounded-lg p-2">
                  <Wifi className="w-6 h-6 text-cyan-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Connectivity</h3>
              </div>
              
              <div className="space-y-4">
                {device.networkSupport && device.networkSupport.length > 0 && (
                  <div>
                    <span className="text-gray-600 block mb-1">Network</span>
                    <div className="flex flex-wrap gap-1">
                      {device.networkSupport.slice(0, 3).map((network, index) => (
                        <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {network}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {device.bluetoothVersion && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Bluetooth</span>
                    <span className="font-medium">{device.bluetoothVersion}</span>
                  </div>
                )}

                {device.wifiStandards && device.wifiStandards.length > 0 && (
                  <div>
                    <span className="text-gray-600 block mb-1">Wi-Fi</span>
                    <div className="flex flex-wrap gap-1">
                      {device.wifiStandards.slice(0, 3).map((wifi, index) => (
                        <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {wifi}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* User Reviews Section */}
          {device.reviews.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">User Reviews</h2>
                <span className="text-gray-600">({device._count.reviews} total)</span>
              </div>

              <div className="space-y-6">
                {device.reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {review.user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {review.user.name || 'Anonymous User'}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < review.rating
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-600">
                                {review.rating}/5
                              </span>
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {review.title && (
                          <h5 className="font-medium text-gray-900 mb-2">{review.title}</h5>
                        )}
                        
                        {review.content && (
                          <p className="text-gray-700 leading-relaxed">{review.content}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {device._count.reviews > 5 && (
                <div className="text-center mt-6">
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    View All Reviews ({device._count.reviews})
                  </button>
                </div>
              )}
            </div>
          )}

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
              <a 
                href={`/devices?brand=${device.brand.name.toLowerCase()}`}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Smartphone className="w-4 h-4" />
                Browse {device.brand.name} Devices
              </a>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}