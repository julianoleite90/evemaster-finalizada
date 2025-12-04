"use client"

import { createContext, useContext, ReactNode } from "react"
import { useUserPermissions } from "@/hooks/use-user-permissions"
import { UserPermissions } from "@/lib/supabase/user-permissions"

interface PermissionContextType {
  permissions: UserPermissions | null
  loading: boolean
  isPrimary: boolean
  hasPermission: (permission: keyof UserPermissions) => boolean
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined)

export function PermissionProvider({ children }: { children: ReactNode }) {
  const {
    permissions,
    loading,
    isPrimary,
    canViewDashboard,
    canViewEvents,
    canCreateEvents,
    canEditEvents,
    canDeleteEvents,
    canViewRegistrations,
    canExportRegistrations,
    canEditRegistrations,
    canCancelRegistrations,
    canViewFinancial,
    canManageFinancial,
    canViewSettings,
    canEditSettings,
    canManageUsers,
    canViewAffiliates,
    canManageAffiliates,
    canViewReports,
    canExportReports,
  } = useUserPermissions()

  const hasPermission = (permission: keyof UserPermissions): boolean => {
    if (isPrimary) return true
    if (!permissions) return false

    // Mapear permissões granulares
    const permissionMap: Record<string, boolean> = {
      can_view_dashboard: canViewDashboard,
      can_view_events: canViewEvents,
      can_create_events: canCreateEvents,
      can_edit_events: canEditEvents,
      can_delete_events: canDeleteEvents,
      can_view_registrations: canViewRegistrations,
      can_export_registrations: canExportRegistrations,
      can_edit_registrations: canEditRegistrations,
      can_cancel_registrations: canCancelRegistrations,
      can_view_financial: canViewFinancial,
      can_manage_financial: canManageFinancial,
      can_view_settings: canViewSettings,
      can_edit_settings: canEditSettings,
      can_manage_users: canManageUsers,
      can_view_affiliates: canViewAffiliates,
      can_manage_affiliates: canManageAffiliates,
      can_view_reports: canViewReports,
      can_export_reports: canExportReports,
      // Permissões básicas
      can_view: permissions.can_view || false,
      can_edit: permissions.can_edit || false,
      can_create: permissions.can_create || false,
      can_delete: permissions.can_delete || false,
      is_primary: isPrimary,
    }

    return permissionMap[permission] || false
  }

  return (
    <PermissionContext.Provider
      value={{
        permissions,
        loading,
        isPrimary,
        hasPermission,
      }}
    >
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

