"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { getUserPermissions, UserPermissions } from "@/lib/supabase/user-permissions"
import { getOrganizerAccess } from "@/lib/supabase/organizer-access"

interface OrganizerAccess {
  organizerId: string
  isPrimary: boolean
}

interface PermissionContextType {
  permissions: UserPermissions | null
  access: OrganizerAccess | null
  loading: boolean
  userId: string | null
  refreshPermissions: () => Promise<void>
  
  // Atalhos para permissões básicas
  canView: boolean
  canEdit: boolean
  canCreate: boolean
  canDelete: boolean
  isPrimary: boolean
  
  // Atalhos para permissões granulares
  canViewDashboard: boolean
  canViewEvents: boolean
  canCreateEvents: boolean
  canEditEvents: boolean
  canDeleteEvents: boolean
  canViewRegistrations: boolean
  canExportRegistrations: boolean
  canEditRegistrations: boolean
  canCancelRegistrations: boolean
  canViewFinancial: boolean
  canManageFinancial: boolean
  canViewSettings: boolean
  canEditSettings: boolean
  canManageUsers: boolean
  canViewAffiliates: boolean
  canManageAffiliates: boolean
  canViewReports: boolean
  canExportReports: boolean
  
  // Função helper para verificar permissão específica
  hasPermission: (permission: keyof UserPermissions) => boolean
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined)

interface PermissionProviderProps {
  children: ReactNode
}

export function PermissionProvider({ children }: PermissionProviderProps) {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [access, setAccess] = useState<OrganizerAccess | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setPermissions(null)
        setAccess(null)
        setUserId(null)
        return
      }

      setUserId(user.id)

      // Buscar acesso e permissões em paralelo
      const [userAccess, userPermissions] = await Promise.all([
        getOrganizerAccess(supabase, user.id),
        getUserPermissions(supabase, user.id)
      ])

      setAccess(userAccess)
      setPermissions(userPermissions)
    } catch (error) {
      console.error("Erro ao buscar permissões:", error)
      setPermissions(null)
      setAccess(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPermissions()
  }, [fetchPermissions])

  const hasPermission = useCallback((permission: keyof UserPermissions): boolean => {
    if (!permissions) return false
    if (permissions.is_primary) return true
    return !!permissions[permission]
  }, [permissions])

  const value: PermissionContextType = {
    permissions,
    access,
    loading,
    userId,
    refreshPermissions: fetchPermissions,
    
    // Permissões básicas
    canView: permissions?.can_view || false,
    canEdit: permissions?.can_edit || false,
    canCreate: permissions?.can_create || false,
    canDelete: permissions?.can_delete || false,
    isPrimary: permissions?.is_primary || false,
    
    // Permissões granulares
    canViewDashboard: hasPermission('can_view_dashboard'),
    canViewEvents: hasPermission('can_view_events'),
    canCreateEvents: hasPermission('can_create_events'),
    canEditEvents: hasPermission('can_edit_events'),
    canDeleteEvents: hasPermission('can_delete_events'),
    canViewRegistrations: hasPermission('can_view_registrations'),
    canExportRegistrations: hasPermission('can_export_registrations'),
    canEditRegistrations: hasPermission('can_edit_registrations'),
    canCancelRegistrations: hasPermission('can_cancel_registrations'),
    canViewFinancial: hasPermission('can_view_financial'),
    canManageFinancial: hasPermission('can_manage_financial'),
    canViewSettings: hasPermission('can_view_settings'),
    canEditSettings: hasPermission('can_edit_settings'),
    canManageUsers: hasPermission('can_manage_users'),
    canViewAffiliates: hasPermission('can_view_affiliates'),
    canManageAffiliates: hasPermission('can_manage_affiliates'),
    canViewReports: hasPermission('can_view_reports'),
    canExportReports: hasPermission('can_export_reports'),
    
    hasPermission,
  }

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  )
}

export function usePermissionContext() {
  const context = useContext(PermissionContext)
  if (context === undefined) {
    throw new Error("usePermissionContext must be used within a PermissionProvider")
  }
  return context
}

