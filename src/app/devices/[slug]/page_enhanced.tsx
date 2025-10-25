'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  Smartphone, 
  Monitor, 
  Cpu, 
  Camera, 
  Battery, 
  Wifi,
  Shield,
  Zap,
  Volume2,
  Settings,
  DollarSign,
  CheckCircle,
  XCircle,
  Award,
  Play,
  Headphones
} from 'lucide-react'
import MainLayout from '@/components/layouts/MainLayout'

interface Device {
  id: string
  slug: string
  name: string
  brand: {
    id: string
    name: string
    logoUrl?: string
  }
  images: string[]
  description?: string
  launchDate?: Date
  price?: number
  specifications: {
    display?: {
      size?: string
      resolution?: string
      type?: string
      refreshRate?: string
      brightness?: string
      protection?: string
    }
    performance?: {
      processor?: string
      gpu?: string
      ram?: string
      storage?: string
      expandableStorage?: string
    }
    camera?: {
      rear?: string
      front?: string
      features?: string[]
      videoRecording?: string
    }
    battery?: {
      capacity?: number
      charging?: string
      wireless?: boolean
      fastCharging?: string
      lifespan?: string
    }
    connectivity?: {
      network?: string[]
      bluetooth?: string
      wifi?: string
      nfc?: boolean
      usb?: string
    }
    design?: {
      dimensions?: string
      weight?: string
      colors?: string[]
      materials?: string[]
      waterResistance?: string
    }
    software?: {
      os?: string
      version?: string
      updates?: string
      features?: string[]
    }
  }
  averageRating: number
  totalRatings: number
  reviews: Array<{
    id: string
    rating: number
    title?: string
    content?: string
    createdAt: Date
    user: {
      name?: string
      avatar?: string
    }
  }>
  _count: {
    reviews: number
  }
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const specificationIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  display: Monitor,
  performance: Cpu,
  camera: Camera,
  battery: Battery,
  connectivity: Wifi,
  design: Shield
}

export default function DeviceDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [device, setDevice] = useState<Device | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    if (!slug) return

    const fetchDevice = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/devices/${slug}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Device not found')
          } else {
            setError('Failed to load device')
          }
          return
        }
        
        const data = await response.json()
        setDevice(data.device)
      } catch (err) {
        setError('Failed to load device')
        console.error('Error fetching device:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDevice()
  }, [slug])

  const nextImage = () => {
    if (device && device.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % device.images.length)
    }
  }

  const prevImage = () => {
    if (device && device.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + device.images.length) % device.images.length)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    )
  }

  if (error || !device) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{error || 'Device not found'}</h1>
            <p className="text-gray-600">The device you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#0a0a0a]">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#1a1a1a]">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Image Gallery */}
              <div className="space-y-6">
                <div className="relative aspect-square bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] rounded-3xl p-8 overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                  
                  {device.images && device.images.length > 0 ? (
                    <>
                      <Image
                        src={device.images[currentImageIndex]}
                        alt={device.name}
                        fill
                        className="object-contain p-8 transition-transform duration-700 group-hover:scale-105"
                        priority
                      />
                      
                      {device.images.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-110"
                          >
                            <ChevronLeft size={24} />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-110"
                          >
                            <ChevronRight size={24} />
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Smartphone className="w-32 h-32 text-white/20" />
                    </div>
                  )}
                </div>
                
                {/* Thumbnails */}
                {device.images && device.images.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto">
                    {device.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 transition-all duration-300 ${
                          index === currentImageIndex 
                            ? 'ring-2 ring-blue-500 scale-110' 
                            : 'hover:scale-105 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`${device.name} ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Device Info */}
              <div className="space-y-8">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    {device.brand?.logoUrl && (
                      <Image
                        src={device.brand.logoUrl}
                        alt={device.brand.name}
                        width={32}
                        height={32}
                        className="rounded-lg"
                      />
                    )}
                    <span className="text-blue-400 font-semibold text-lg">{device.brand?.name}</span>
                  </div>
                  
                  <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
                    {device.name}
                  </h1>
                  
                  {device.description && (
                    <p className="text-xl text-white/70 mb-8 leading-relaxed">
                      {device.description}
                    </p>
                  )}
                </div>

                {/* Expert Score */}
                <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Award className="w-8 h-8 text-yellow-400" />
                    <span className="text-xl font-bold text-yellow-400">Expert Score</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={24}
                          className={i < Math.round(device.averageRating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}
                        />
                      ))}
                    </div>
                    <span className="text-2xl font-bold text-yellow-400">
                      {(device.averageRating || 0).toFixed(1)}/5
                    </span>
                    <span className="text-white/60">
                      ({device.totalRatings} reviews)
                    </span>
                  </div>
                </div>

                {/* Price */}
                {device.price && (
                  <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <DollarSign className="w-6 h-6 text-green-400" />
                      <span className="text-lg font-semibold text-green-400">Price</span>
                    </div>
                    <div className="text-3xl font-bold text-white">
                      ${device.price.toLocaleString()}
                    </div>
                  </div>
                )}

                {/* Key Features Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {device.specifications?.display?.size && (
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
                      <Monitor className="w-6 h-6 text-blue-400 mb-2" />
                      <div className="text-sm text-white/60 mb-1">Display</div>
                      <div className="font-semibold text-white">{device.specifications.display.size}</div>
                    </div>
                  )}
                  
                  {device.specifications?.performance?.processor && (
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
                      <Cpu className="w-6 h-6 text-green-400 mb-2" />
                      <div className="text-sm text-white/60 mb-1">Processor</div>
                      <div className="font-semibold text-white text-sm">{device.specifications.performance.processor}</div>
                    </div>
                  )}
                  
                  {device.specifications?.camera?.rear && (
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
                      <Camera className="w-6 h-6 text-purple-400 mb-2" />
                      <div className="text-sm text-white/60 mb-1">Camera</div>
                      <div className="font-semibold text-white text-sm">{device.specifications.camera.rear}</div>
                    </div>
                  )}
                  
                  {device.specifications?.battery?.capacity && (
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
                      <Battery className="w-6 h-6 text-red-400 mb-2" />
                      <div className="text-sm text-white/60 mb-1">Battery</div>
                      <div className="font-semibold text-white">{device.specifications.battery.capacity}mAh</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Specifications Table */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-3 mb-8">
            <Settings className="w-8 h-8 text-blue-400" />
            <h2 className="text-4xl font-bold text-white">Key Specifications</h2>
          </div>
          
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-6 text-lg font-semibold text-blue-400">Feature</th>
                    <th className="text-left p-6 text-lg font-semibold text-blue-400">Specification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {device.specifications?.display?.size && (
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-6 font-medium text-white/80">Display</td>
                      <td className="p-6 text-white">
                        {[
                          device.specifications.display.size,
                          device.specifications.display.resolution,
                          device.specifications.display.type,
                          device.specifications.display.refreshRate && `${device.specifications.display.refreshRate} refresh rate`
                        ].filter(Boolean).join(', ')}
                      </td>
                    </tr>
                  )}
                  {device.specifications?.performance?.processor && (
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-6 font-medium text-white/80">Processor</td>
                      <td className="p-6 text-white">{device.specifications.performance.processor}</td>
                    </tr>
                  )}
                  {device.specifications?.performance?.ram && (
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-6 font-medium text-white/80">RAM + Storage</td>
                      <td className="p-6 text-white">
                        {[device.specifications.performance.ram, device.specifications.performance.storage].filter(Boolean).join(' + ')}
                      </td>
                    </tr>
                  )}
                  {device.specifications?.camera?.rear && (
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-6 font-medium text-white/80">Rear Camera</td>
                      <td className="p-6 text-white">{device.specifications.camera.rear}</td>
                    </tr>
                  )}
                  {device.specifications?.camera?.front && (
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-6 font-medium text-white/80">Front Camera</td>
                      <td className="p-6 text-white">{device.specifications.camera.front}</td>
                    </tr>
                  )}
                  {device.specifications?.battery?.capacity && (
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-6 font-medium text-white/80">Battery</td>
                      <td className="p-6 text-white">
                        {[
                          `${device.specifications.battery.capacity}mAh`,
                          device.specifications.battery.fastCharging && `${device.specifications.battery.fastCharging} fast charging`
                        ].filter(Boolean).join(' + ')}
                      </td>
                    </tr>
                  )}
                  {device.specifications?.connectivity && (
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-6 font-medium text-white/80">Connectivity</td>
                      <td className="p-6 text-white">
                        {[
                          device.specifications.connectivity.wifi,
                          device.specifications.connectivity.bluetooth,
                          device.specifications.connectivity.nfc && 'NFC',
                          device.specifications.connectivity.usb
                        ].filter(Boolean).join(', ')}
                      </td>
                    </tr>
                  )}
                  {device.specifications?.design?.dimensions && (
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-6 font-medium text-white/80">Dimensions/Weight</td>
                      <td className="p-6 text-white">
                        {[device.specifications.design.dimensions, device.specifications.design.weight].filter(Boolean).join(' / ')}
                      </td>
                    </tr>
                  )}
                  {device.specifications?.design?.materials && (
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-6 font-medium text-white/80">Build</td>
                      <td className="p-6 text-white">
                        {[
                          Array.isArray(device.specifications.design.materials) 
                            ? device.specifications.design.materials.join(', ')
                            : device.specifications.design.materials,
                          device.specifications.design.waterResistance
                        ].filter(Boolean).join(', ')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Design & Display Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-3 mb-8">
            <Monitor className="w-8 h-8 text-blue-400" />
            <h2 className="text-4xl font-bold text-white">Design & Display</h2>
          </div>
          
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8">
            <div className="prose prose-lg prose-invert max-w-none">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-semibold text-white mb-4">Build Quality</h3>
                  <ul className="space-y-3 text-white/70">
                    {device.specifications?.design?.materials && (
                      <li>• Premium materials: {Array.isArray(device.specifications.design.materials) 
                        ? device.specifications.design.materials.join(', ')
                        : device.specifications.design.materials}
                      </li>
                    )}
                    {device.specifications?.design?.colors && device.specifications.design.colors.length > 0 && (
                      <li>• Available colors: {device.specifications.design.colors.join(', ')}</li>
                    )}
                    {device.specifications?.design?.waterResistance && (
                      <li>• Water resistance: {device.specifications.design.waterResistance}</li>
                    )}
                    {device.specifications?.design?.dimensions && (
                      <li>• Compact dimensions: {device.specifications.design.dimensions}</li>
                    )}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-2xl font-semibold text-white mb-4">Display Features</h3>
                  <ul className="space-y-3 text-white/70">
                    {device.specifications?.display?.size && (
                      <li>• Screen size: {device.specifications.display.size}</li>
                    )}
                    {device.specifications?.display?.resolution && (
                      <li>• Resolution: {device.specifications.display.resolution}</li>
                    )}
                    {device.specifications?.display?.type && (
                      <li>• Display technology: {device.specifications.display.type}</li>
                    )}
                    {device.specifications?.display?.refreshRate && (
                      <li>• Refresh rate: {device.specifications.display.refreshRate}</li>
                    )}
                    {device.specifications?.display?.brightness && (
                      <li>• Peak brightness: {device.specifications.display.brightness}</li>
                    )}
                    {device.specifications?.display?.protection && (
                      <li>• Protection: {device.specifications.display.protection}</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance & Hardware Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-3 mb-8">
            <Cpu className="w-8 h-8 text-green-400" />
            <h2 className="text-4xl font-bold text-white">Performance & Hardware</h2>
          </div>
          
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-semibold text-white mb-4">Processing Power</h3>
                <ul className="space-y-3 text-white/70">
                  {device.specifications?.performance?.processor && (
                    <li>• Chipset: {device.specifications.performance.processor}</li>
                  )}
                  {device.specifications?.performance?.gpu && (
                    <li>• Graphics: {device.specifications.performance.gpu}</li>
                  )}
                  {device.specifications?.performance?.ram && (
                    <li>• Memory: {device.specifications.performance.ram}</li>
                  )}
                  {device.specifications?.performance?.storage && (
                    <li>• Storage: {device.specifications.performance.storage}</li>
                  )}
                  {device.specifications?.performance?.expandableStorage && (
                    <li>• Expandable storage: {device.specifications.performance.expandableStorage}</li>
                  )}
                </ul>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold text-white mb-4">Performance Insights</h3>
                <div className="space-y-4 text-white/70">
                  <p>• Excellent multitasking capabilities with smooth performance across demanding applications</p>
                  <p>• Gaming performance optimized for high-end mobile games at maximum settings</p>
                  <p>• Efficient thermal management ensures sustained performance during extended usage</p>
                  <p>• Fast app loading and responsive user interface throughout the experience</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Camera Features Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-3 mb-8">
            <Camera className="w-8 h-8 text-purple-400" />
            <h2 className="text-4xl font-bold text-white">Camera Features</h2>
          </div>
          
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-semibold text-white mb-4">Camera Setup</h3>
                <ul className="space-y-3 text-white/70">
                  {device.specifications?.camera?.rear && (
                    <li>• Main camera: {device.specifications.camera.rear}</li>
                  )}
                  {device.specifications?.camera?.front && (
                    <li>• Front camera: {device.specifications.camera.front}</li>
                  )}
                  {device.specifications?.camera?.videoRecording && (
                    <li>• Video recording: {device.specifications.camera.videoRecording}</li>
                  )}
                  {device.specifications?.camera?.features && device.specifications.camera.features.length > 0 && (
                    <li>• Features: {device.specifications.camera.features.join(', ')}</li>
                  )}
                </ul>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold text-white mb-4">Photography Experience</h3>
                <div className="space-y-4 text-white/70">
                  <p>• Outstanding daylight photography with excellent detail and color accuracy</p>
                  <p>• Advanced night mode delivers impressive low-light performance</p>
                  <p>• Professional-grade video recording with superior stabilization</p>
                  <p>• AI-enhanced photography features for optimal results in various scenarios</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Battery & Charging Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-3 mb-8">
            <Battery className="w-8 h-8 text-red-400" />
            <h2 className="text-4xl font-bold text-white">Battery & Charging</h2>
          </div>
          
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-semibold text-white mb-4">Battery Specifications</h3>
                <ul className="space-y-3 text-white/70">
                  {device.specifications?.battery?.capacity && (
                    <li>• Capacity: {device.specifications.battery.capacity}mAh</li>
                  )}
                  {device.specifications?.battery?.fastCharging && (
                    <li>• Fast charging: {device.specifications.battery.fastCharging}</li>
                  )}
                  {device.specifications?.battery?.wireless && (
                    <li>• Wireless charging: Supported</li>
                  )}
                  {device.specifications?.battery?.lifespan && (
                    <li>• Battery life: {device.specifications.battery.lifespan}</li>
                  )}
                </ul>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold text-white mb-4">Real-world Performance</h3>
                <div className="space-y-4 text-white/70">
                  <p>• All-day battery life with moderate to heavy usage patterns</p>
                  <p>• Rapid charging capabilities get you back to full power quickly</p>
                  <p>• Intelligent power management optimizes battery longevity</p>
                  <p>• Reliable performance even during intensive gaming sessions</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Audio & Connectivity Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-3 mb-8">
            <Headphones className="w-8 h-8 text-indigo-400" />
            <h2 className="text-4xl font-bold text-white">Audio & Connectivity</h2>
          </div>
          
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-semibold text-white mb-4">Connectivity Features</h3>
                <ul className="space-y-3 text-white/70">
                  {device.specifications?.connectivity?.wifi && (
                    <li>• WiFi: {device.specifications.connectivity.wifi}</li>
                  )}
                  {device.specifications?.connectivity?.bluetooth && (
                    <li>• Bluetooth: {device.specifications.connectivity.bluetooth}</li>
                  )}
                  {device.specifications?.connectivity?.nfc && (
                    <li>• NFC: Supported</li>
                  )}
                  {device.specifications?.connectivity?.usb && (
                    <li>• USB: {device.specifications.connectivity.usb}</li>
                  )}
                  {device.specifications?.connectivity?.network && device.specifications.connectivity.network.length > 0 && (
                    <li>• Network: {device.specifications.connectivity.network.join(', ')}</li>
                  )}
                </ul>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold text-white mb-4">Audio Experience</h3>
                <div className="space-y-4 text-white/70">
                  <p>• High-quality stereo speakers with enhanced audio processing</p>
                  <p>• Premium audio experience for music, videos, and gaming</p>
                  <p>• Advanced connectivity ensures seamless pairing with accessories</p>
                  <p>• Crystal-clear call quality with noise cancellation technology</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Software & Features Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-3 mb-8">
            <Settings className="w-8 h-8 text-cyan-400" />
            <h2 className="text-4xl font-bold text-white">Software & Features</h2>
          </div>
          
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-semibold text-white mb-4">Software Details</h3>
                <ul className="space-y-3 text-white/70">
                  {device.specifications?.software?.os && (
                    <li>• Operating System: {device.specifications.software.os}</li>
                  )}
                  {device.specifications?.software?.version && (
                    <li>• OS Version: {device.specifications.software.version}</li>
                  )}
                  {device.specifications?.software?.updates && (
                    <li>• Update Support: {device.specifications.software.updates}</li>
                  )}
                  {device.specifications?.software?.features && device.specifications.software.features.length > 0 && (
                    <li>• Special Features: {device.specifications.software.features.join(', ')}</li>
                  )}
                </ul>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold text-white mb-4">User Experience</h3>
                <div className="space-y-4 text-white/70">
                  <p>• Intuitive and responsive user interface with modern design language</p>
                  <p>• Regular security updates and feature enhancements</p>
                  <p>• Advanced privacy controls and security features</p>
                  <p>• Seamless integration with popular apps and services</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pros & Cons Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-4xl font-bold text-white mb-12 text-center">Pros & Cons</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Pros */}
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle className="w-8 h-8 text-green-400" />
                <h3 className="text-2xl font-bold text-green-400">Pros</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-white/80">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Premium build quality with attention to detail</span>
                </li>
                <li className="flex items-start gap-3 text-white/80">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Excellent display with vibrant colors and smooth performance</span>
                </li>
                <li className="flex items-start gap-3 text-white/80">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Powerful performance for demanding applications</span>
                </li>
                <li className="flex items-start gap-3 text-white/80">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Long-lasting battery with fast charging capabilities</span>
                </li>
                <li className="flex items-start gap-3 text-white/80">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Advanced camera system with excellent image quality</span>
                </li>
              </ul>
            </div>
            
            {/* Cons */}
            <div className="bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/20 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <XCircle className="w-8 h-8 text-red-400" />
                <h3 className="text-2xl font-bold text-red-400">Cons</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-white/80">
                  <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <span>Premium pricing may limit accessibility for budget-conscious users</span>
                </li>
                <li className="flex items-start gap-3 text-white/80">
                  <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <span>No expandable storage option in some variants</span>
                </li>
                <li className="flex items-start gap-3 text-white/80">
                  <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <span>Learning curve for users switching from other platforms</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Price & Availability Section */}
        {device.price && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex items-center gap-3 mb-8">
              <DollarSign className="w-8 h-8 text-green-400" />
              <h2 className="text-4xl font-bold text-white">Price & Availability</h2>
            </div>
            
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-4 text-lg font-semibold text-green-400">Variant</th>
                      <th className="text-left p-4 text-lg font-semibold text-green-400">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-medium text-white/80">Base Model</td>
                      <td className="p-4 text-2xl font-bold text-white">${device.price.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                <p className="text-green-400 font-semibold">✓ Currently Available</p>
                <p className="text-white/70 mt-2">In stock and ready to ship. Check with local retailers for current availability and regional pricing.</p>
              </div>
            </div>
          </div>
        )}

        {/* Verdict Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-3 mb-8">
            <Award className="w-8 h-8 text-yellow-400" />
            <h2 className="text-4xl font-bold text-white">Final Verdict</h2>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={32}
                      className={i < Math.round(device.averageRating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}
                    />
                  ))}
                </div>
                <span className="text-3xl font-bold text-yellow-400">
                  {(device.averageRating || 0).toFixed(1)}/5
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Highly Recommended</h3>
            </div>
            
            <div className="prose prose-lg prose-invert max-w-none text-center">
              <p className="text-xl text-white/80 leading-relaxed mb-6">
                The {device.name} stands out as an exceptional device that delivers premium performance 
                across all categories. With its {device.specifications?.performance?.processor || 'powerful processor'}, 
                {device.specifications?.display?.size || 'stunning display'}, and 
                {device.specifications?.camera?.rear || 'advanced camera system'}, 
                it's perfectly suited for both professional users and tech enthusiasts.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6 mt-8 text-left">
                <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
                  <h4 className="font-semibold text-blue-400 mb-3">Best For:</h4>
                  <ul className="space-y-2 text-white/70">
                    <li>• Professional users</li>
                    <li>• Content creators</li>
                    <li>• Tech enthusiasts</li>
                    <li>• Power users</li>
                  </ul>
                </div>
                
                <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
                  <h4 className="font-semibold text-green-400 mb-3">Key Strengths:</h4>
                  <ul className="space-y-2 text-white/70">
                    <li>• Premium build quality</li>
                    <li>• Excellent performance</li>
                    <li>• Outstanding display</li>
                    <li>• Long battery life</li>
                  </ul>
                </div>
                
                <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
                  <h4 className="font-semibold text-purple-400 mb-3">Value Proposition:</h4>
                  <ul className="space-y-2 text-white/70">
                    <li>• Competitive pricing</li>
                    <li>• Future-proof specs</li>
                    <li>• Strong ecosystem</li>
                    <li>• Reliable support</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-4xl font-bold text-white mb-12 text-center">
            User Reviews ({device._count?.reviews || 0})
          </h2>
          
          <div className="space-y-8">
            {device.reviews && device.reviews.length > 0 ? (
              device.reviews.map((review) => (
                <div key={review.id} className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {(review.user.name || "U").charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-white text-lg">
                          {review.user.name || "Anonymous"}
                        </h4>
                        <span className="text-sm text-white/60">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={18}
                            className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}
                          />
                        ))}
                        <span className="font-semibold text-white ml-2">{review.rating}/5</span>
                      </div>
                    </div>
                  </div>
                  
                  {review.title && (
                    <h5 className="font-semibold text-white text-xl mb-3">{review.title}</h5>
                  )}
                  
                  {review.content && (
                    <p className="text-white/70 leading-relaxed">{review.content}</p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-12 max-w-md mx-auto">
                  <Star className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <p className="text-xl text-white/60 mb-6">No reviews yet</p>
                  <p className="text-white/40 mb-8">Be the first to review this device and help others make informed decisions.</p>
                  <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105">
                    Write a Review
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}