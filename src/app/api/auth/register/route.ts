import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, username } = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(username ? [{ username }] : [])
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or username already exists" },
        { status: 400 }
      )
    }

    // Get or create default user role
    let userRole = await prisma.role.findFirst({
      where: { name: "USER" }
    })

    if (!userRole) {
      // Create default role if it doesn't exist
      const newRole = await prisma.role.create({
        data: {
          name: "USER",
          description: "Standard user role"
        }
      })
      
      // Create basic permissions
      const readPermission = await prisma.permission.create({
        data: {
          name: "READ_CONTENT",
          description: "Can read blog posts and device information",
          resource: "content",
          action: "read"
        }
      })

      const commentPermission = await prisma.permission.create({
        data: {
          name: "CREATE_COMMENT",
          description: "Can create comments and reviews",
          resource: "comment",
          action: "create"
        }
      })

      // Assign permissions to role
      await prisma.role.update({
        where: { id: newRole.id },
        data: {
          permissions: {
            connect: [
              { id: readPermission.id },
              { id: commentPermission.id }
            ]
          }
        }
      })

      userRole = newRole
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        username,
        roleId: userRole.id,
        verified: false,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        verified: true,
        createdAt: true,
      }
    })

    return NextResponse.json({
      message: "User created successfully",
      user
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}