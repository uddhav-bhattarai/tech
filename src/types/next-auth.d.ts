import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      username?: string
      role?: {
        id: string
        name: string
        permissions: Array<{
          id: string
          name: string
          resource: string
          action: string
        }>
      }
      verified?: boolean
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    username?: string
    role?: {
      id: string
      name: string
      permissions: Array<{
        id: string
        name: string
        resource: string
        action: string
      }>
    }
    verified?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string
    username?: string
    role?: {
      id: string
      name: string
      permissions: Array<{
        id: string
        name: string
        resource: string
        action: string
      }>
    }
    verified?: boolean
  }
}