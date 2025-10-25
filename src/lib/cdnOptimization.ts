/**
 * CDN Configuration and Asset Optimization
 * Handles CDN integration, asset optimization, and delivery
 */

export interface CDNConfig {
  provider: 'cloudflare' | 'cloudinary' | 'aws' | 'vercel' | 'custom'
  baseUrl: string
  apiKey?: string
  apiSecret?: string
  cloudName?: string // For Cloudinary
  region?: string // For AWS
}

export interface AssetDeliveryOptions {
  quality?: number | 'auto'
  format?: 'auto' | 'webp' | 'jpeg' | 'png' | 'avif'
  width?: number
  height?: number
  crop?: 'scale' | 'fit' | 'crop' | 'thumb' | 'fill'
  gravity?: 'center' | 'face' | 'north' | 'south' | 'east' | 'west'
  progressive?: boolean
  secure?: boolean
}

/**
 * CDN Asset Manager
 */
export class CDNAssetManager {
  private config: CDNConfig

  constructor(config: CDNConfig) {
    this.config = config
  }

  /**
   * Generate optimized asset URL
   */
  generateAssetUrl(assetPath: string, options: AssetDeliveryOptions = {}): string {
    const {
      quality = 'auto',
      format = 'auto',
      width,
      height,
      crop = 'scale',
      gravity = 'center',
      progressive = true,
      secure = true
    } = options

    switch (this.config.provider) {
      case 'cloudinary':
        return this.generateCloudinaryUrl(assetPath, {
          quality,
          format,
          width,
          height,
          crop,
          gravity,
          progressive,
          secure
        })

      case 'vercel':
        return this.generateVercelUrl(assetPath, {
          quality,
          format,
          width,
          height
        })

      case 'cloudflare':
        return this.generateCloudflareUrl(assetPath, {
          quality,
          format,
          width,
          height,
          crop
        })

      case 'aws':
        return this.generateAWSUrl(assetPath, options)

      default:
        return this.generateCustomUrl(assetPath, options)
    }
  }

  /**
   * Generate Cloudinary URL
   */
  private generateCloudinaryUrl(
    assetPath: string,
    options: AssetDeliveryOptions
  ): string {
    const { cloudName } = this.config
    if (!cloudName) {
      throw new Error('Cloud name is required for Cloudinary')
    }

    const transformations: string[] = []

    // Quality
    if (options.quality && options.quality !== 'auto') {
      transformations.push(`q_${options.quality}`)
    } else if (options.quality === 'auto') {
      transformations.push('q_auto')
    }

    // Format
    if (options.format && options.format !== 'auto') {
      transformations.push(`f_${options.format}`)
    } else if (options.format === 'auto') {
      transformations.push('f_auto')
    }

    // Dimensions
    if (options.width && options.height) {
      transformations.push(`w_${options.width},h_${options.height},c_${options.crop}`)
      if (options.gravity) {
        transformations.push(`g_${options.gravity}`)
      }
    } else if (options.width) {
      transformations.push(`w_${options.width}`)
    } else if (options.height) {
      transformations.push(`h_${options.height}`)
    }

    // Progressive
    if (options.progressive) {
      transformations.push('fl_progressive')
    }

    const protocol = options.secure ? 'https' : 'http'
    const transformationString = transformations.length > 0 ? `/${transformations.join(',')}` : ''
    
    return `${protocol}://res.cloudinary.com/${cloudName}/image/upload${transformationString}/${assetPath}`
  }

  /**
   * Generate Vercel Image Optimization URL
   */
  private generateVercelUrl(
    assetPath: string,
    options: AssetDeliveryOptions
  ): string {
    const params = new URLSearchParams()

    if (options.width) {
      params.append('w', options.width.toString())
    }

    if (options.quality && options.quality !== 'auto') {
      params.append('q', options.quality.toString())
    }

    const queryString = params.toString()
    const separator = queryString ? '?' : ''

    return `${this.config.baseUrl}/_next/image${separator}${queryString}&url=${encodeURIComponent(assetPath)}`
  }

  /**
   * Generate Cloudflare Images URL
   */
  private generateCloudflareUrl(
    assetPath: string,
    options: AssetDeliveryOptions
  ): string {
    const transformations: string[] = []

    if (options.width) {
      transformations.push(`width=${options.width}`)
    }

    if (options.height) {
      transformations.push(`height=${options.height}`)
    }

    if (options.quality && options.quality !== 'auto') {
      transformations.push(`quality=${options.quality}`)
    }

    if (options.format && options.format !== 'auto') {
      transformations.push(`format=${options.format}`)
    }

    if (options.crop && options.crop !== 'scale') {
      transformations.push(`fit=${options.crop}`)
    }

    const transformationString = transformations.length > 0 ? `/${transformations.join(',')}` : ''
    
    return `${this.config.baseUrl}/cdn-cgi/image${transformationString}/${assetPath}`
  }

  /**
   * Generate AWS CloudFront URL
   */
  private generateAWSUrl(
    assetPath: string,
    options: AssetDeliveryOptions
  ): string {
    // AWS CloudFront with Lambda@Edge for image optimization
    const params = new URLSearchParams()

    if (options.width) {
      params.append('w', options.width.toString())
    }

    if (options.height) {
      params.append('h', options.height.toString())
    }

    if (options.quality && options.quality !== 'auto') {
      params.append('q', options.quality.toString())
    }

    if (options.format && options.format !== 'auto') {
      params.append('f', options.format)
    }

    const queryString = params.toString()
    const separator = queryString ? '?' : ''

    return `${this.config.baseUrl}/${assetPath}${separator}${queryString}`
  }

  /**
   * Generate custom CDN URL
   */
  private generateCustomUrl(
    assetPath: string,
    options: AssetDeliveryOptions
  ): string {
    const params = new URLSearchParams()

    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    const queryString = params.toString()
    const separator = queryString ? '?' : ''

    return `${this.config.baseUrl}/${assetPath}${separator}${queryString}`
  }

  /**
   * Generate responsive image srcset
   */
  generateResponsiveSrcSet(
    assetPath: string,
    sizes: number[] = [640, 768, 1024, 1280, 1920],
    options: AssetDeliveryOptions = {}
  ): string {
    return sizes
      .map(size => {
        const url = this.generateAssetUrl(assetPath, {
          ...options,
          width: size
        })
        return `${url} ${size}w`
      })
      .join(', ')
  }

  /**
   * Generate picture element sources for modern formats
   */
  generatePictureSources(
    assetPath: string,
    sizes: number[] = [640, 768, 1024, 1280, 1920],
    options: AssetDeliveryOptions = {}
  ): Array<{ format: string; srcset: string; type: string }> {
    const formats: Array<{ format: AssetDeliveryOptions['format']; type: string }> = [
      { format: 'avif', type: 'image/avif' },
      { format: 'webp', type: 'image/webp' }
    ]

    return formats.map(({ format, type }) => ({
      format: format!,
      srcset: this.generateResponsiveSrcSet(assetPath, sizes, {
        ...options,
        format
      }),
      type
    }))
  }
}

/**
 * Static asset optimization
 */
export class StaticAssetOptimizer {
  private cdnManager: CDNAssetManager

  constructor(cdnManager: CDNAssetManager) {
    this.cdnManager = cdnManager
  }

  /**
   * Generate optimized image component props
   */
  generateImageProps(
    src: string,
    alt: string,
    options: {
      width?: number
      height?: number
      priority?: boolean
      quality?: number
      sizes?: string
      className?: string
    } = {}
  ) {
    const {
      width = 800,
      height,
      priority = false,
      quality = 75,
      sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
      className
    } = options

    const optimizedSrc = this.cdnManager.generateAssetUrl(src, {
      width,
      height,
      quality,
      format: 'auto'
    })

    const srcSet = this.cdnManager.generateResponsiveSrcSet(src, undefined, {
      quality,
      format: 'auto'
    })

    return {
      src: optimizedSrc,
      srcSet,
      alt,
      width,
      height,
      priority,
      sizes,
      className,
      loading: priority ? 'eager' : 'lazy' as const,
      decoding: 'async' as const
    }
  }

  /**
   * Preload critical images
   */
  generatePreloadLinks(
    images: Array<{
      src: string
      width?: number
      height?: number
      format?: AssetDeliveryOptions['format']
    }>
  ): Array<{
    rel: string
    as: string
    href: string
    type?: string
    imagesrcset?: string
    imagesizes?: string
  }> {
    return images.map(({ src, width, height, format = 'auto' }) => {
      const href = this.cdnManager.generateAssetUrl(src, {
        width,
        height,
        format,
        quality: 75
      })

      const link: {
        rel: string
        as: string
        href: string
        type?: string
        imagesrcset?: string
        imagesizes?: string
      } = {
        rel: 'preload',
        as: 'image',
        href
      }

      if (format === 'webp') {
        link.type = 'image/webp'
      } else if (format === 'avif') {
        link.type = 'image/avif'
      }

      if (width) {
        link.imagesrcset = this.cdnManager.generateResponsiveSrcSet(src, [640, 768, 1024], {
          format,
          quality: 75
        })
        link.imagesizes = '(max-width: 768px) 100vw, 50vw'
      }

      return link
    })
  }
}

/**
 * Default CDN configurations
 */
export const defaultCDNConfigs: Record<string, CDNConfig> = {
  vercel: {
    provider: 'vercel',
    baseUrl: process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'
  },
  cloudinary: {
    provider: 'cloudinary',
    baseUrl: 'https://res.cloudinary.com',
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  },
  cloudflare: {
    provider: 'cloudflare',
    baseUrl: process.env.CLOUDFLARE_IMAGES_URL || ''
  }
}

/**
 * Create CDN manager instance
 */
export function createCDNManager(provider: keyof typeof defaultCDNConfigs = 'vercel'): CDNAssetManager {
  const config = defaultCDNConfigs[provider]
  if (!config) {
    throw new Error(`Unknown CDN provider: ${provider}`)
  }
  return new CDNAssetManager(config)
}

export default CDNAssetManager