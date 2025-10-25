/**
 * Admin Brand Management API
 * GET /api/admin/brands - List all brands
 * POST /api/admin/brands - Create new brand
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const brandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  slug: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
  website: z.string().optional(),
  country: z.string().optional(),
  founded: z.number().optional(),
})

/**
 * GET /api/admin/brands
 * List all brands with admin details
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role?.name !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const where = search ? {
      name: { contains: search, mode: 'insensitive' as const }
    } : {}

    const brands = await prisma.brand.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            devices: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      brands
    })
  } catch (error) {
    console.error('Admin brands fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch brands' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/brands
 * Create new brand
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role?.name !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = brandSchema.parse(body)

    // Generate slug if not provided
    if (!validatedData.slug) {
      const baseSlug = validatedData.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
      
      let slug = baseSlug
      let counter = 1
      while (await prisma.brand.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`
        counter++
      }
      validatedData.slug = slug
    }

    // Check if slug is unique
    const existingBrand = await prisma.brand.findUnique({
      where: { slug: validatedData.slug }
    })
    
    if (existingBrand) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 }
      )
    }

    const brand = await prisma.brand.create({
      data: validatedData
    })

    return NextResponse.json({
      success: true,
      message: 'Brand created successfully',
      brand
    })
  } catch (error) {
    console.error('Brand creation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create brand' },
      { status: 500 }
    )
  }
}