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
  Battery,
  Monitor,
  Cpu,
  Smartphone,
  Wifi,
  Shield,
  Calendar,
  DollarSign,
  Ruler,
  Weight,
  Zap,
  Signal,
  Volume2,
  Eye,
  MessageCircle,
  ExternalLink,
  Edit,
  Trash2
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
  try {
    const device = await prisma.device.findUnique({
      where: { slug },
      include: {
        brand: true,
        images: {
          orderBy: { order: 'asc' }
        },
        videos: true,
        reviews: {
          include: {
            author: {
              select: { id: true, name: true, avatar: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        benchmarks: true,
        priceHistory: {
          orderBy: { date: 'desc' },
          take: 10
        },
        blogPosts: {
          where: { published: true },
          include: {
            author: {
              select: { id: true, name: true, avatar: true }
            }
          },
          orderBy: { publishedAt: 'desc' }
        }
      }
    })

    if (device) {
      // Increment view count
      await prisma.device.update({
        where: { id: device.id },
        data: { views: { increment: 1 } }
      })
    }

    return device
  } catch (error) {
    console.error('Error fetching device:', error)
    return null
  }
}

function SpecCard({ 
  icon: Icon, 
  title, 
  children 
}: { 
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode 
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function SpecRow({ label, value }: { label: string; value: string | number | undefined | null }) {
  if (!value) return null
  
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
      <span className="text-gray-600 text-sm">{label}</span>
      <span className="text-gray-900 text-sm font-medium">{value}</span>
    </div>
  )
}

function PriceCard({ device }: { device: any }) {
  const formatPrice = (price: any) => {
    if (!price) return 'N/A'
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: device.currency || 'NPR',
      minimumFractionDigits: 0,
    }).format(Number(price))
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">Pricing</h2>
      </div>
      
      <div className="space-y-3">
        {device.currentPrice && (
          <div>
            <p className="text-sm text-gray-600">Current Price</p>
            <p className="text-2xl font-bold text-green-600">{formatPrice(device.currentPrice)}</p>
          </div>
        )}
        
        {device.launchPrice && device.launchPrice !== device.currentPrice && (
          <div>
            <p className="text-sm text-gray-600">Launch Price</p>
            <p className="text-lg text-gray-500 line-through">{formatPrice(device.launchPrice)}</p>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">
            {device.releaseDate 
              ? `Released ${new Date(device.releaseDate).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long' 
                })}` 
              : 'Release date TBD'
            }
          </span>
        </div>
      </div>
    </div>
  )
}

function ImageGallery({ images }: { images: any[] }) {
  if (!images.length) {
    return (
      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
        <Smartphone className="h-16 w-16 text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
        <Image
          src={images[0].url}
          alt={images[0].alt || `${images[0].url} image`}
          width={600}
          height={600}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          priority
        />
      </div>
      
      {/* Thumbnail gallery */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.slice(0, 8).map((image, index) => (
            <div key={index} className="aspect-square rounded-md overflow-hidden bg-gray-100 cursor-pointer hover:opacity-80 transition-opacity">
              <Image
                src={image.url}
                alt={image.alt || `${image.url} thumbnail`}
                width={150}
                height={150}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DeviceHeader({ device }: { device: any }) {
  const formatRating = (rating: number) => {
    return rating?.toFixed(1) || 'N/A'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-blue-600 font-medium">{device.brand.name}</span>
            <span className="text-sm text-gray-400">•</span>
            <span className="text-sm text-gray-600 capitalize">{device.availability}</span>
          </div>
          
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            {device.name} {device.model}
          </h1>
          
          <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="font-medium">{formatRating(device.averageRating)}</span>
              <span>({device.totalReviews} reviews)</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{device.views.toLocaleString()} views</span>
            </div>
            
            {device.releaseDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(device.releaseDate).getFullYear()}</span>
              </div>
            )}
          </div>
          
          {/* Key features */}
          {device.specialFeatures && device.specialFeatures.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {device.specialFeatures.slice(0, 4).map((feature: string, index: number) => (
                <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                  {feature}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Heart className="h-4 w-4" />
            Save
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Share2 className="h-4 w-4" />
            Share
          </button>
          <Link 
            href={`/admin/devices/edit/${device.id}`}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Link>
        </div>
      </div>
    </div>
  )
}

export default async function DevicePage({ params }: DevicePageProps) {
  const { slug } = await params
  const device = await getDevice(slug)

  if (!device) {
    notFound()
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <DeviceHeader device={device} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Images and basic info */}
            <div className="space-y-6">
              <ImageGallery images={device.images} />
              <PriceCard device={device} />
            </div>
            
            {/* Middle column - Specifications */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Specifications</h2>
              
              {/* Display */}
              <SpecCard icon={Monitor} title="Display">
                <div>
                  <SpecRow label="Size" value={device.displaySize ? `${device.displaySize}"` : undefined} />
                  <SpecRow 
                    label="Resolution" 
                    value={device.displayResolution ? 
                      `${device.displayResolution.width} × ${device.displayResolution.height}` : 
                      undefined
                    } 
                  />
                  <SpecRow label="Technology" value={device.displayTechnology} />
                  <SpecRow label="Pixel Density" value={device.pixelDensity ? `${device.pixelDensity} PPI` : undefined} />
                  <SpecRow label="Refresh Rate" value={device.refreshRate ? `${device.refreshRate}Hz` : undefined} />
                  <SpecRow label="Peak Brightness" value={device.peakBrightness ? `${device.peakBrightness} nits` : undefined} />
                  <SpecRow label="Protection" value={device.protection} />
                </div>
              </SpecCard>
              
              {/* Performance */}
              <SpecCard icon={Cpu} title="Performance">
                <div>
                  <SpecRow label="Chipset" value={device.chipset} />
                  <SpecRow label="GPU" value={device.gpu} />
                  <SpecRow label="Process" value={device.manufacturingProcess} />
                  <SpecRow 
                    label="RAM Options" 
                    value={device.ramConfigurations?.length ? 
                      device.ramConfigurations.map((ram: number) => `${ram}GB`).join(', ') : 
                      undefined
                    } 
                  />
                  <SpecRow 
                    label="Storage Options" 
                    value={device.storageConfigurations?.length ? 
                      device.storageConfigurations.map((storage: number) => `${storage}GB`).join(', ') : 
                      undefined
                    } 
                  />
                  <SpecRow label="Expandable" value={device.expandableStorage ? 'Yes' : 'No'} />
                </div>
              </SpecCard>
              
              {/* Camera */}
              {device.mainCamera && (
                <SpecCard icon={Camera} title="Camera">
                  <div>
                    <SpecRow 
                      label="Main Camera" 
                      value={device.mainCamera.megapixels ? `${device.mainCamera.megapixels}MP` : undefined} 
                    />
                    <SpecRow 
                      label="Ultra-wide" 
                      value={device.ultraWideCamera?.megapixels ? `${device.ultraWideCamera.megapixels}MP` : undefined} 
                    />
                    <SpecRow 
                      label="Telephoto" 
                      value={device.telephotoCamera?.megapixels ? `${device.telephotoCamera.megapixels}MP` : undefined} 
                    />
                    <SpecRow 
                      label="Front Camera" 
                      value={device.frontCamera?.megapixels ? `${device.frontCamera.megapixels}MP` : undefined} 
                    />
                    {device.videoRecording?.maxResolution && (
                      <SpecRow label="Video Recording" value={device.videoRecording.maxResolution} />
                    )}
                  </div>
                </SpecCard>
              )}
              
              {/* Battery */}
              <SpecCard icon={Battery} title="Battery & Charging">
                <div>
                  <SpecRow label="Capacity" value={device.batteryCapacity ? `${device.batteryCapacity} mAh` : undefined} />
                  <SpecRow label="Wired Charging" value={device.wiredCharging ? `${device.wiredCharging}W` : undefined} />
                  <SpecRow label="Wireless Charging" value={device.wirelessCharging ? `${device.wirelessCharging}W` : undefined} />
                  <SpecRow label="Reverse Charging" value={device.reverseCharging ? 'Yes' : 'No'} />
                </div>
              </SpecCard>
            </div>
            
            {/* Right column - Additional info */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Additional Details</h2>
              
              {/* Build & Design */}
              <SpecCard icon={Ruler} title="Build & Design">
                <div>
                  {device.dimensions && (
                    <SpecRow 
                      label="Dimensions" 
                      value={`${device.dimensions.length} × ${device.dimensions.width} × ${device.dimensions.thickness} mm`} 
                    />
                  )}
                  <SpecRow label="Weight" value={device.weight ? `${device.weight}g` : undefined} />
                  <SpecRow label="Colors" value={device.colors?.join(', ')} />
                  <SpecRow label="Water Resistance" value={device.waterResistance} />
                </div>
              </SpecCard>
              
              {/* Connectivity */}
              <SpecCard icon={Signal} title="Connectivity">
                <div>
                  <SpecRow label="5G" value={device.networkSupport?.['5G'] ? 'Yes' : 'No'} />
                  <SpecRow label="WiFi" value={device.wifiStandards?.join(', ')} />
                  <SpecRow label="Bluetooth" value={device.bluetoothVersion} />
                  <SpecRow label="NFC" value={device.nfcSupport ? 'Yes' : 'No'} />
                  <SpecRow label="USB" value={device.usbConnector} />
                  <SpecRow label="Headphone Jack" value={device.headphoneJack ? 'Yes' : 'No'} />
                </div>
              </SpecCard>
              
              {/* Software */}
              <SpecCard icon={Shield} title="Software">
                <div>
                  <SpecRow label="OS" value={device.operatingSystem} />
                  <SpecRow label="Launch Version" value={device.osVersionAtLaunch} />
                  <SpecRow label="Custom UI" value={device.customUI} />
                </div>
              </SpecCard>
            </div>
          </div>
          
          {/* Blog Posts/Reviews Section */}
          {device.blogPosts && device.blogPosts.length > 0 && (
            <div className="mt-12 bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {device.blogPosts.map((post: any) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="group cursor-pointer">
                    <article>
                      <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden">
                        {post.featuredImage && (
                          <Image
                            src={post.featuredImage}
                            alt={post.title}
                            width={400}
                            height={225}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                      </div>
                      <div className="space-y-2">
                        <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                          {post.blogType}
                        </span>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{post.excerpt}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{post.author.name}</span>
                          <span>•</span>
                          <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          {/* Reviews Section */}
          {device.reviews && device.reviews.length > 0 && (
            <div className="mt-12 bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">User Reviews</h2>
              <div className="space-y-6">
                {device.reviews.slice(0, 5).map((review: any) => (
                  <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          {review.author.name && (
                            <span className="text-sm font-medium text-gray-600">
                              {review.author.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{review.author.name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm font-medium text-gray-600">
                          {review.rating}/5
                        </span>
                      </div>
                    </div>
                    {review.title && (
                      <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                    )}
                    <p className="text-gray-700 leading-relaxed">{review.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}