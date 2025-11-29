"use client"

import { ReactNode } from "react"
import { useUserPermissions } from "@/hooks/use-user-permissions"

interface PermissionGuardProps {
  permission: 'view' | 'edit' | 'create' | 'delete'
  fallback?: ReactNode
  children: ReactNode
}

export function PermissionGuard({ permission, fallback = null, children }: PermissionGuardProps) {
  const { canView, canEdit, canCreate, canDelete, isPrimary, loading } = useUserPermissions()

  if (loading) {
    return null // Ou um spinner
  }

  // Organizador principal tem todas as permissões
  if (isPrimary) {
    return <>{children}</>
  }

  // Verificar permissão específica
  let hasPermission = false
  switch (permission) {
    case 'view':
      hasPermission = canView
      break
    case 'edit':
      hasPermission = canEdit
      break
    case 'create':
      hasPermission = canCreate
      break
    case 'delete':
      hasPermission = canDelete
      break
  }

  if (!hasPermission) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
