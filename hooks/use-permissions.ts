"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { getUserPermissions, UserPermissions } from "@/lib/supabase/user-permissions"

export function usePermissions() {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
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
  }
}

