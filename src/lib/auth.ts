import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import FacebookProvider from "next-auth/providers/facebook"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { Adapter } from "next-auth/adapters"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    // Only add Google provider if credentials are set
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    ] : []),
    // Only add Facebook provider if credentials are set
    ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET ? [
      FacebookProvider({
        clientId: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      })
    ] : []),
    // Only add GitHub provider if credentials are set
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET ? [
      GitHubProvider({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      })
    ] : []),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials")
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          },
          include: {
            role: {
              include: {
                permissions: true
              }
            }
          }
        })

        if (!user) {
          throw new Error("User not found")
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password || ""
        )

        if (!isPasswordValid) {
          throw new Error("Invalid password")
        }

        if (!user.isActive) {
          throw new Error("Account is deactivated")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username || undefined,
          avatar: user.avatar,
          role: user.role,
          verified: user.verified
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.role = user.role
        token.verified = user.verified
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.role = token.role as typeof session.user.role
        session.user.verified = token.verified as boolean
      }
      return session
    },
    async signIn({ account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: profile.email }
          })

          if (existingUser) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                name: profile.name || existingUser.name,
                avatar: profile.image || existingUser.avatar,
                verified: true,
                lastLogin: new Date()
              }
            })
          } else {
            const defaultRole = await prisma.role.findFirst({
              where: { name: "USER" }
            })

            if (!defaultRole) {
              throw new Error("Default user role not found")
            }

            await prisma.user.create({
              data: {
                email: profile.email,
                name: profile.name || "Anonymous",
                avatar: profile.image,
                verified: true,
                isActive: true,
                roleId: defaultRole.id,
                lastLogin: new Date()
              }
            })
          }
          return true
        } catch (error) {
          console.error("Error during OAuth sign-in:", error)
          return false
        }
      }

      if (account?.provider === "facebook" && profile?.email) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: profile.email }
          })

          if (existingUser) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                name: profile.name || existingUser.name,
                avatar: profile.image || existingUser.avatar,
                verified: true,
                lastLogin: new Date()
              }
            })
          } else {
            const defaultRole = await prisma.role.findFirst({
              where: { name: "USER" }
            })

            if (!defaultRole) {
              throw new Error("Default user role not found")
            }

            await prisma.user.create({
              data: {
                email: profile.email,
                name: profile.name || "Anonymous",
                avatar: profile.image,
                verified: true,
                isActive: true,
                roleId: defaultRole.id,
                lastLogin: new Date()
              }
            })
          }
          return true
        } catch (error) {
          console.error("Error during Facebook sign-in:", error)
          return false
        }
      }

      return true
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  }
}