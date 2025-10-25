/**
 * Image Optimization Utilities
 * Handles image processing, resizing, and format optimization
 */

import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'

export interface ImageOptimizationOptions {
  quality?: number
  width?: number
  height?: number
  format?: 'webp' | 'jpeg' | 'png' | 'avif'
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
  progressive?: boolean
  lossless?: boolean
}

export interface OptimizedImageResult {
  buffer: Buffer
  format: string
  width: number
  height: number
  size: number
}

/**
 * Image optimization class
 */
export class ImageOptimizer {
  private static readonly DEFAULT_QUALITY = 80
  private static readonly DEFAULT_FORMAT = 'webp'
  private static readonly MAX_WIDTH = 2048
  private static readonly MAX_HEIGHT = 2048

  /**
   * Optimize image buffer
   */
  static async optimizeImage(
    inputBuffer: Buffer,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImageResult> {
    const {
      quality = this.DEFAULT_QUALITY,
      width,
      height,
      format = this.DEFAULT_FORMAT,
      fit = 'cover',
      progressive = true,
      lossless = false
    } = options

    let sharpInstance = sharp(inputBuffer)

    // Get original metadata
    const metadata = await sharpInstance.metadata()
    
    // Calculate dimensions while maintaining aspect ratio
    const targetWidth = width || Math.min(metadata.width || this.MAX_WIDTH, this.MAX_WIDTH)
    const targetHeight = height || Math.min(metadata.height || this.MAX_HEIGHT, this.MAX_HEIGHT)

    // Resize image
    sharpInstance = sharpInstance.resize({
      width: targetWidth,
      height: targetHeight,
      fit,
      withoutEnlargement: true
    })

    // Apply format-specific optimizations
    switch (format) {
      case 'webp':
        sharpInstance = sharpInstance.webp({
          quality,
          lossless
        })
        break
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({
          quality,
          progressive,
          mozjpeg: true
        })
        break
      case 'png':
        sharpInstance = sharpInstance.png({
          quality,
          progressive,
          compressionLevel: 9
        })
        break
      case 'avif':
        sharpInstance = sharpInstance.avif({
          quality,
          lossless
        })
        break
    }

    const optimizedBuffer = await sharpInstance.toBuffer({ resolveWithObject: true })

    return {
      buffer: optimizedBuffer.data,
      format,
      width: optimizedBuffer.info.width,
      height: optimizedBuffer.info.height,
      size: optimizedBuffer.data.length
    }
  }

  /**
   * Generate multiple sizes for responsive images
   */
  static async generateResponsiveImages(
    inputBuffer: Buffer,
    sizes: number[] = [640, 768, 1024, 1280, 1920],
    options: ImageOptimizationOptions = {}
  ): Promise<Record<number, OptimizedImageResult>> {
    const results: Record<number, OptimizedImageResult> = {}

    for (const size of sizes) {
      results[size] = await this.optimizeImage(inputBuffer, {
        ...options,
        width: size
      })
    }

    return results
  }

  /**
   * Create thumbnails
   */
  static async createThumbnail(
    inputBuffer: Buffer,
    size: number = 150,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImageResult> {
    return this.optimizeImage(inputBuffer, {
      ...options,
      width: size,
      height: size,
      fit: 'cover'
    })
  }

  /**
   * Validate image format
   */
  static async validateImage(inputBuffer: Buffer): Promise<{
    valid: boolean
    format?: string
    width?: number
    height?: number
    error?: string
  }> {
    try {
      const metadata = await sharp(inputBuffer).metadata()
      
      if (!metadata.format) {
        return { valid: false, error: 'Unknown image format' }
      }

      const supportedFormats = ['jpeg', 'png', 'webp', 'gif', 'svg', 'tiff', 'avif']
      if (!supportedFormats.includes(metadata.format)) {
        return { valid: false, error: `Unsupported format: ${metadata.format}` }
      }

      return {
        valid: true,
        format: metadata.format,
        width: metadata.width,
        height: metadata.height
      }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid image'
      }
    }
  }

  /**
   * Get image metadata
   */
  static async getImageMetadata(inputBuffer: Buffer): Promise<{
    format: string
    width: number
    height: number
    size: number
    hasAlpha: boolean
    colorSpace: string
  }> {
    const metadata = await sharp(inputBuffer).metadata()

    return {
      format: metadata.format || 'unknown',
      width: metadata.width || 0,
      height: metadata.height || 0,
      size: inputBuffer.length,
      hasAlpha: metadata.hasAlpha || false,
      colorSpace: metadata.space || 'unknown'
    }
  }

  /**
   * Save optimized image to disk
   */
  static async saveOptimizedImage(
    inputBuffer: Buffer,
    outputPath: string,
    options: ImageOptimizationOptions = {}
  ): Promise<void> {
    const optimized = await this.optimizeImage(inputBuffer, options)
    
    // Ensure directory exists
    const dir = path.dirname(outputPath)
    await fs.mkdir(dir, { recursive: true })
    
    await fs.writeFile(outputPath, optimized.buffer)
  }
}

/**
 * Image upload handler with optimization
 */
export class ImageUploadHandler {
  private static readonly UPLOAD_DIR = path.join(process.cwd(), 'public/uploads')
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

  /**
   * Process uploaded image
   */
  static async processUpload(
    file: File,
    options: {
      generateResponsive?: boolean
      createThumbnail?: boolean
      optimization?: ImageOptimizationOptions
    } = {}
  ): Promise<{
    original: OptimizedImageResult & { url: string }
    responsive?: Record<number, OptimizedImageResult & { url: string }>
    thumbnail?: OptimizedImageResult & { url: string }
  }> {
    const { generateResponsive = true, createThumbnail = true, optimization = {} } = options

    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`)
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Validate image
    const validation = await ImageOptimizer.validateImage(buffer)
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid image')
    }

    const timestamp = Date.now()
    const baseName = `${timestamp}-${file.name.replace(/\.[^/.]+$/, '')}`

    // Create upload directory
    await fs.mkdir(this.UPLOAD_DIR, { recursive: true })

    // Process original image
    const originalOptimized = await ImageOptimizer.optimizeImage(buffer, optimization)
    const originalFileName = `${baseName}.${optimization.format || 'webp'}`
    const originalPath = path.join(this.UPLOAD_DIR, originalFileName)
    await fs.writeFile(originalPath, originalOptimized.buffer)

    const result: {
      original: OptimizedImageResult & { url: string }
      responsive?: Record<number, OptimizedImageResult & { url: string }>
      thumbnail?: OptimizedImageResult & { url: string }
    } = {
      original: {
        ...originalOptimized,
        url: `/uploads/${originalFileName}`
      }
    }

    // Generate responsive images
    if (generateResponsive) {
      const responsiveImages = await ImageOptimizer.generateResponsiveImages(buffer, undefined, optimization)
      result.responsive = {}

      for (const [size, optimized] of Object.entries(responsiveImages)) {
        const responsiveFileName = `${baseName}-${size}w.${optimization.format || 'webp'}`
        const responsivePath = path.join(this.UPLOAD_DIR, responsiveFileName)
        await fs.writeFile(responsivePath, optimized.buffer)

        result.responsive[parseInt(size)] = {
          ...optimized,
          url: `/uploads/${responsiveFileName}`
        }
      }
    }

    // Generate thumbnail
    if (createThumbnail) {
      const thumbnail = await ImageOptimizer.createThumbnail(buffer, 150, optimization)
      const thumbnailFileName = `${baseName}-thumb.${optimization.format || 'webp'}`
      const thumbnailPath = path.join(this.UPLOAD_DIR, thumbnailFileName)
      await fs.writeFile(thumbnailPath, thumbnail.buffer)

      result.thumbnail = {
        ...thumbnail,
        url: `/uploads/${thumbnailFileName}`
      }
    }

    return result
  }
}

export default ImageOptimizer