import { useSession } from "next-auth/react"
import { useMemo } from "react"

export function useAuth() {
  const { data: session, status } = useSession()

  const user = useMemo(() => {
    if (!session?.user) return null
    return session.user
  }, [session])

  const isLoading = status === "loading"
  const isAuthenticated = status === "authenticated"

  const hasPermission = useMemo(() => {
    return (resource: string, action: string) => {
      if (!user?.role?.permissions) return false
      
      return user.role.permissions.some(permission => 
        permission.resource === resource && permission.action === action
      )
    }
  }, [user])

  const hasRole = useMemo(() => {
    return (roleName: string) => {
      return user?.role?.name === roleName
    }
  }, [user])

  const isAdmin = useMemo(() => {
    return hasRole("ADMIN") || hasRole("SUPER_ADMIN")
  }, [hasRole])

  const canCreateContent = useMemo(() => {
    return hasPermission("content", "create") || isAdmin
  }, [hasPermission, isAdmin])

  const canModerateContent = useMemo(() => {
    return hasPermission("content", "moderate") || isAdmin
  }, [hasPermission, isAdmin])

  return {
    user,
    isLoading,
    isAuthenticated,
    hasPermission,
    hasRole,
    isAdmin,
    canCreateContent,
    canModerateContent,
  }
}