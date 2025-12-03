"use client"

import { ReactNode } from "react"
import { usePermissionContext } from "./PermissionProvider"
import { UserPermissions } from "@/lib/supabase/user-permissions"
import { Lock, AlertCircle } from "lucide-react"

type PermissionKey = keyof UserPermissions

interface PermissionGuardProps {
  /** Permissão necessária para visualizar o conteúdo */
  permission: PermissionKey
  /** Conteúdo a ser exibido se não tiver permissão */
  fallback?: ReactNode
  /** Conteúdo protegido */
  children: ReactNode
  /** Se true, mostra um indicador de bloqueio ao invés de esconder */
  showLocked?: boolean
  /** Mensagem personalizada para exibir quando bloqueado */
  lockedMessage?: string
}

/**
 * Componente para proteger elementos baseado em permissões granulares
 * 
 * @example
 * // Proteger botão de criar evento
 * <PermissionGuard permission="can_create_events">
 *   <Button>Criar Evento</Button>
 * </PermissionGuard>
 * 
 * @example
 * // Mostrar indicador de bloqueio
 * <PermissionGuard permission="can_view_financial" showLocked>
 *   <FinancialSection />
 * </PermissionGuard>
 */
export function PermissionGuard({ 
  permission, 
  fallback = null, 
  children,
  showLocked = false,
  lockedMessage = "Você não tem permissão para acessar este recurso"
}: PermissionGuardProps) {
  const { hasPermission, isPrimary, loading } = usePermissionContext()

  if (loading) {
    return null
  }

  // Organizador principal tem acesso a tudo
  if (isPrimary) {
    return <>{children}</>
  }

  // Verificar permissão específica
  if (!hasPermission(permission)) {
    if (showLocked) {
      return (
        <div className="relative">
          <div className="opacity-50 pointer-events-none select-none">
            {children}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 rounded-lg">
            <div className="text-center p-4">
              <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">{lockedMessage}</p>
            </div>
          </div>
        </div>
      )
    }
    return <>{fallback}</>
  }

  return <>{children}</>
}

interface RequirePermissionProps {
  /** Lista de permissões necessárias (todas devem ser verdadeiras) */
  permissions: PermissionKey[]
  /** Se true, apenas uma das permissões precisa ser verdadeira */
  any?: boolean
  /** Fallback quando não tem permissão */
  fallback?: ReactNode
  children: ReactNode
}

/**
 * Componente para verificar múltiplas permissões
 * 
 * @example
 * // Requer todas as permissões
 * <RequirePermission permissions={["can_edit_events", "can_delete_events"]}>
 *   <AdminPanel />
 * </RequirePermission>
 * 
 * @example
 * // Requer qualquer uma das permissões
 * <RequirePermission permissions={["can_view_events", "can_view_registrations"]} any>
 *   <SomeContent />
 * </RequirePermission>
 */
export function RequirePermission({ 
  permissions, 
  any = false, 
  fallback = null, 
  children 
}: RequirePermissionProps) {
  const { hasPermission, isPrimary, loading } = usePermissionContext()

  if (loading) {
    return null
  }

  if (isPrimary) {
    return <>{children}</>
  }

  const hasRequiredPermissions = any
    ? permissions.some(p => hasPermission(p))
    : permissions.every(p => hasPermission(p))

  if (!hasRequiredPermissions) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

interface PermissionMessageProps {
  /** Permissão que falta */
  permission?: PermissionKey
  /** Mensagem customizada */
  message?: string
  /** Variante visual */
  variant?: "inline" | "card" | "banner"
}

/**
 * Componente para exibir mensagem de falta de permissão
 */
export function PermissionMessage({ 
  permission, 
  message,
  variant = "inline" 
}: PermissionMessageProps) {
  const defaultMessages: Record<PermissionKey, string> = {
    can_view: "Você não tem permissão para visualizar este conteúdo",
    can_edit: "Você não tem permissão para editar",
    can_create: "Você não tem permissão para criar",
    can_delete: "Você não tem permissão para excluir",
    is_primary: "Apenas o organizador principal pode acessar",
    can_view_dashboard: "Você não tem acesso ao dashboard",
    can_view_events: "Você não tem acesso aos eventos",
    can_create_events: "Você não pode criar eventos",
    can_edit_events: "Você não pode editar eventos",
    can_delete_events: "Você não pode excluir eventos",
    can_view_registrations: "Você não tem acesso às inscrições",
    can_export_registrations: "Você não pode exportar inscrições",
    can_edit_registrations: "Você não pode editar inscrições",
    can_cancel_registrations: "Você não pode cancelar inscrições",
    can_view_financial: "Você não tem acesso ao financeiro",
    can_manage_financial: "Você não pode gerenciar o financeiro",
    can_view_settings: "Você não tem acesso às configurações",
    can_edit_settings: "Você não pode editar configurações",
    can_manage_users: "Você não pode gerenciar usuários",
    can_view_affiliates: "Você não tem acesso aos afiliados",
    can_manage_affiliates: "Você não pode gerenciar afiliados",
    can_view_reports: "Você não tem acesso aos relatórios",
    can_export_reports: "Você não pode exportar relatórios",
  }

  const displayMessage = message || (permission ? defaultMessages[permission] : "Sem permissão")

  if (variant === "card") {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
        <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
        <h3 className="font-semibold text-amber-800 mb-1">Acesso Restrito</h3>
        <p className="text-sm text-amber-700">{displayMessage}</p>
      </div>
    )
  }

  if (variant === "banner") {
    return (
      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
        <p className="text-sm text-amber-700">{displayMessage}</p>
      </div>
    )
  }

  return (
    <span className="text-sm text-amber-600 flex items-center gap-1">
      <Lock className="h-3 w-3" />
      {displayMessage}
    </span>
  )
}

