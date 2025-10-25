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
  ExternalLink,
  MessageCircle
} from 'lucide-react'

interface DevicePageProps {
  params: Promise<{ slug: string }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: DevicePageProps): Promise<Metadata> {
  const { slug } = await params
  
  const device = await prisma.device.findFirst({
    where: { slug },
    include: {
      brand: { select: { name: true } },
      images: { select: { url: true }, take: 1 }
    }
  })

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

export default async function DevicePage({ params }: DevicePageProps) {
  const { slug } = await params
  
  const device = await prisma.device.findFirst({
    where: { slug },
    include: {
      brand: true,
      images: {
        orderBy: { order: 'asc' }
      },
      videos: true,
      reviews: {
        include: {
          user: {
            select: { id: true, name: true, avatar: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      },
      benchmarks: true,
      priceHistory: {
        orderBy: { date: 'desc' },
        take: 10
      },
      _count: {
        select: {
          reviews: true,
          comparisons: true
        }
      }
    }
  })

  if (!device) {
    notFound()
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'NPR' ? 'USD' : currency,
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const averageRating = device.reviews.length > 0 
    ? device.reviews.reduce((sum, review) => sum + review.rating, 0) / device.reviews.length 
    : 0

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm mb-8 p-6">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Images */}
              <div className="lg:w-1/2">
                {device.images.length > 0 ? (
                  <div className="space-y-4">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={device.images[0].url}
                        alt={`${device.name} ${device.model}`}
                        width={600}
                        height={600}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {device.images.length > 1 && (
                      <div className="grid grid-cols-4 gap-2">
                        {device.images.slice(1, 5).map((image, index) => (
                          <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={image.url}
                              alt={`${device.name} ${device.model} image ${index + 2}`}
                              width={150}
                              height={150}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-square rounded-lg bg-gray-200 flex items-center justify-center">
                    <Smartphone className="w-24 h-24 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Device Info */}
              <div className="lg:w-1/2">
                <div className="space-y-4">
                  <div>
                    <p className="text-blue-600 font-medium">{device.brand.name}</p>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {device.name} {device.model}
                    </h1>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2">
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
                    <span className="text-gray-600">
                      {averageRating.toFixed(1)} ({device._count.reviews} reviews)
                    </span>
                  </div>

                  {/* Price */}
                  {device.currentPrice && (
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-bold text-green-600">
                          {formatPrice(device.currentPrice, device.currency)}
                        </span>
                        {device.launchPrice && device.launchPrice > device.currentPrice && (
                          <span className="text-lg text-gray-500 line-through">
                            {formatPrice(device.launchPrice, device.currency)}
                          </span>
                        )}
                      </div>
                      <div className="inline-flex px-2 py-1 bg-green-100 text-green-800 text-sm rounded">
                        {device.availability}
                      </div>
                    </div>
                  )}

                  {/* Key Specs */}
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    {device.displaySize && (
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-600">{device.displaySize}&quot; Display</span>
                      </div>
                    )}
                    {device.ramCapacity && (
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-600">{device.ramCapacity}GB RAM</span>
                      </div>
                    )}
                    {device.storageCapacity && (
                      <div className="flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-600">{device.storageCapacity}GB Storage</span>
                      </div>
                    )}
                    {device.batteryCapacity && (
                      <div className="flex items-center gap-2">
                        <Battery className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-600">{device.batteryCapacity}mAh</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 pt-6">
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Heart className="w-4 h-4" />
                      Add to Wishlist
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Specifications Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Display */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Monitor className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Display</h3>
              </div>
              <div className="space-y-3">
                {device.displaySize && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Size</span>
                    <span className="font-medium">{device.displaySize}&quot;</span>
                  </div>
                )}
                {device.displayTechnology && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Technology</span>
                    <span className="font-medium">{device.displayTechnology}</span>
                  </div>
                )}
                {device.refreshRate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Refresh Rate</span>
                    <span className="font-medium">{device.refreshRate}Hz</span>
                  </div>
                )}
                {device.peakBrightness && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Peak Brightness</span>
                    <span className="font-medium">{device.peakBrightness} nits</span>
                  </div>
                )}
              </div>
            </div>

            {/* Performance */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Cpu className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
              </div>
              <div className="space-y-3">
                {device.processorBrand && device.processorModel && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processor</span>
                    <span className="font-medium">{device.processorBrand} {device.processorModel}</span>
                  </div>
                )}
                {device.ramCapacity && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">RAM</span>
                    <span className="font-medium">{device.ramCapacity}GB</span>
                  </div>
                )}
                {device.storageCapacity && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Storage</span>
                    <span className="font-medium">{device.storageCapacity}GB</span>
                  </div>
                )}
                {device.gpu && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">GPU</span>
                    <span className="font-medium">{device.gpu}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Camera */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Camera className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Camera</h3>
              </div>
              <div className="space-y-3">
                {device.rearCameraMegapixels && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rear Camera</span>
                    <span className="font-medium">{device.rearCameraMegapixels}MP</span>
                  </div>
                )}
                {device.frontCameraMegapixels && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Front Camera</span>
                    <span className="font-medium">{device.frontCameraMegapixels}MP</span>
                  </div>
                )}
                {device.cameraFeatures.length > 0 && (
                  <div>
                    <span className="text-gray-600">Features</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {device.cameraFeatures.slice(0, 3).map((feature, index) => (
                        <span key={index} className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          {device.reviews.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">User Reviews</h3>
                </div>
                <button className="text-blue-600 hover:text-blue-800">View all reviews</button>
              </div>

              <div className="space-y-6">
                {device.reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {review.user.avatar ? (
                          <Image
                            src={review.user.avatar}
                            alt={review.user.name || 'User'}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 text-sm font-medium">
                              {review.user.name?.charAt(0) || 'U'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {review.user.name || 'Anonymous'}
                          </span>
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
                          <span className="text-gray-500 text-sm">
                            {formatDate(review.createdAt.toString())}
                          </span>
                        </div>
                        {review.title && (
                          <h4 className="font-medium text-gray-900 mb-1">{review.title}</h4>
                        )}
                        {review.content && (
                          <p className="text-gray-600 text-sm">{review.content}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Devices */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <Smartphone className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">More from {device.brand.name}</h3>
            </div>
            <p className="text-gray-600">Explore more devices from {device.brand.name}</p>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}