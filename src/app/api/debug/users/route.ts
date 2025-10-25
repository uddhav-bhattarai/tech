import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        verified: true,
        role: {
          select: {
            name: true,
            permissions: {
              select: {
                name: true,
                resource: true,
                action: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      count: users.length,
      users
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}