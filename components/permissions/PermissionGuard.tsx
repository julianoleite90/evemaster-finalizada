"use client"

import { ReactNode } from "react"
import { usePermissionContext } from "./PermissionProvider"
import { UserPermissions } from "@/lib/supabase/user-permissions"

interface PermissionGuardProps {
  permission: keyof UserPermissions
  fallback?: ReactNode
  children: ReactNode
}

export function PermissionGuard({ permission, fallback = null, children }: PermissionGuardProps) {
  const { hasPermission, isPrimary, loading } = usePermissionContext()

  if (loading) {
    return null
  }

  if (isPrimary) {
    return <>{children}</>
  }

  if (!hasPermission(permission)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

export function RequirePermission({ 
  permission, 
  children 
}: { 
  permission: keyof UserPermissions
  children: ReactNode 
}) {
  return (
    <PermissionGuard permission={permission}>
      {children}
    </PermissionGuard>
  )
}

export function PermissionMessage({ 
  message = "Você não tem permissão para acessar este recurso." 
}: { 
  message?: string 
}) {
  return (
    <div className="flex items-center justify-center p-8">
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  )
}

