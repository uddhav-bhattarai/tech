import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { UserRole, UserStatus, Prisma } from '@prisma/client'

// Validation schemas
const UserCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  username: z.string().min(3).max(30).optional(),
  password: z.string().min(8).max(100),
  role: z.enum(['ADMIN', 'MODERATOR', 'EDITOR', 'REVIEWER', 'USER']).default('USER'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING']).default('ACTIVE'),
  bio: z.string().max(500).optional(),
  website: z.string().url().optional(),
  location: z.string().max(100).optional(),
  social: z.object({
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    github: z.string().optional()
  }).optional()
})

const UserQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(['ADMIN', 'MODERATOR', 'EDITOR', 'REVIEWER', 'USER']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING']).optional(),
  sortBy: z.enum(['createdAt', 'lastLogin', 'name', 'email']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  dateRange: z.object({
    start: z.string().optional(),
    end: z.string().optional()
  }).optional()
})

// Get current user session and check permissions
async function getCurrentUser(requiredPermissions?: string[]) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  // Check permissions if required
  if (requiredPermissions && requiredPermissions.length > 0) {
    const userPermissions = session.user.permissions || []
    const hasPermission = requiredPermissions.some(permission => 
      userPermissions.includes(permission) || userPermissions.includes('admin:write')
    )
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions')
    }
  }

  return session.user
}

// Get all users with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    await getCurrentUser(['users:view', 'admin:read'])
    const { searchParams } = new URL(request.url)
    
    const query = UserQuerySchema.parse({
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
      search: searchParams.get('search') || undefined,
      role: (searchParams.get('role') as UserRole) || undefined,
      status: (searchParams.get('status') as UserStatus) || undefined,
      sortBy: (searchParams.get('sortBy') as 'createdAt' | 'lastLogin' | 'name' | 'email') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      dateRange: searchParams.get('dateStart') && searchParams.get('dateEnd') ? {
        start: searchParams.get('dateStart')!,
        end: searchParams.get('dateEnd')!
      } : undefined
    })

    const skip = (query.page - 1) * query.limit

    // Build where conditions
    const where: Prisma.UserWhereInput = {}

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { username: { contains: query.search, mode: 'insensitive' } }
      ]
    }

    if (query.role) {
      where.role = { name: query.role }
    }

    if (query.status) {
      where.isActive = query.status === 'ACTIVE'
    }

    if (query.dateRange) {
      where.createdAt = {
        gte: new Date(query.dateRange.start),
        lte: new Date(query.dateRange.end)
      }
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          avatar: true,
          isActive: true,
          verified: true,
          createdAt: true,
          lastLogin: true,
          totalViews: true,
          role: {
            select: {
              id: true,
              name: true,
              permissions: {
                select: {
                  name: true,
                  description: true
                }
              }
            }
          },
          _count: {
            select: {
              articles: { where: { isPublished: true } }
            }
          }
        },
        orderBy: { [query.sortBy]: query.sortOrder },
        skip,
        take: query.limit
      }),

      prisma.user.count({ where })
    ])

    // Format user data
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      isActive: user.isActive,
      verified: user.verified,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      totalViews: user.totalViews || 0,
      role: {
        name: user.role?.name || 'USER',
        permissions: user.role?.permissions.map(p => p.name) || []
      },
      stats: {
        articlesPublished: user._count.articles
      }
    }))

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
        hasNext: skip + query.limit < total,
        hasPrev: query.page > 1
      },
      filters: query
    })

  } catch (error) {
    console.error('Users API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.format() },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// Create new user
export async function POST(request: NextRequest) {
  try {
    await getCurrentUser(['users:manage', 'admin:write'])
    const body = await request.json()
    
    const data = UserCreateSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          ...(data.username ? [{ username: data.username }] : [])
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12)

    // Get role
    const role = await prisma.role.findFirst({
      where: { name: data.role }
    })

    if (!role) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      )
    }

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        username: data.username,
        password: hashedPassword,
        isActive: data.status === 'ACTIVE',
        verified: true, // Admin-created users are verified
        roleId: role.id
      },
      include: {
        role: {
          select: {
            name: true,
            permissions: {
              select: { name: true }
            }
          }
        }
      }
    })

    return NextResponse.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        username: newUser.username,
        role: newUser.role?.name,
        isActive: newUser.isActive,
        verified: newUser.verified,
        createdAt: newUser.createdAt
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Create user error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid user data', details: error.format() },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}