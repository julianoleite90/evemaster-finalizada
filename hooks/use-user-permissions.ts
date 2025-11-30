import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { getUserPermissions, UserPermissions } from "@/lib/supabase/user-permissions"

export function useUserPermissions() {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setLoading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setPermissions(null)
          setLoading(false)
          return
        }

        const userPermissions = await getUserPermissions(supabase, user.id)
        setPermissions(userPermissions)
      } catch (error) {
        console.error("Erro ao buscar permissões:", error)
        setPermissions(null)
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [])

  return {
    permissions,
    loading,
    canView: permissions?.can_view || false,
    canEdit: permissions?.can_edit || false,
    canCreate: permissions?.can_create || false,
    canDelete: permissions?.can_delete || false,
    isPrimary: permissions?.is_primary || false,
    // Permissões granulares
    canViewDashboard: permissions?.can_view_dashboard || false,
    canViewEvents: permissions?.can_view_events || false,
    canCreateEvents: permissions?.can_create_events || false,
    canEditEvents: permissions?.can_edit_events || false,
    canDeleteEvents: permissions?.can_delete_events || false,
    canViewRegistrations: permissions?.can_view_registrations || false,
    canExportRegistrations: permissions?.can_export_registrations || false,
    canEditRegistrations: permissions?.can_edit_registrations || false,
    canCancelRegistrations: permissions?.can_cancel_registrations || false,
    canViewFinancial: permissions?.can_view_financial || false,
    canManageFinancial: permissions?.can_manage_financial || false,
    canViewSettings: permissions?.can_view_settings || false,
    canEditSettings: permissions?.can_edit_settings || false,
    canManageUsers: permissions?.can_manage_users || false,
    canViewAffiliates: permissions?.can_view_affiliates || false,
    canManageAffiliates: permissions?.can_manage_affiliates || false,
    canViewReports: permissions?.can_view_reports || false,
    canExportReports: permissions?.can_export_reports || false,
  }
}

