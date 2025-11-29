"use client"

import { ReactNode } from "react"
import { usePermissions } from "@/hooks/use-permissions"

interface PermissionGuardProps {
  permission: 'view' | 'edit' | 'create' | 'delete'
  fallback?: ReactNode
  children: ReactNode
}

/**
 * Componente que renderiza children apenas se o usuário tiver a permissão especificada
 */
export function PermissionGuard({ permission, fallback = null, children }: PermissionGuardProps) {
  const { canView, canEdit, canCreate, canDelete, isPrimary } = usePermissions()

  // Organizador principal sempre tem todas as permissões
  if (isPrimary) {
    return <>{children}</>
  }

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

/**
 * Hook para obter se um campo deve estar desabilitado
 */
export function useFieldDisabled() {
  const { canEdit, isPrimary } = usePermissions()
  return !canEdit && !isPrimary
}

