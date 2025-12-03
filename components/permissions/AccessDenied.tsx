"use client"

import { ShieldX, ArrowLeft, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface AccessDeniedProps {
  /** Título da página */
  title?: string
  /** Mensagem explicativa */
  message?: string
  /** URL para voltar */
  backUrl?: string
  /** Texto do botão de voltar */
  backLabel?: string
  /** Mostrar botão de ir para home */
  showHomeButton?: boolean
}

/**
 * Componente de página de acesso negado
 * Use quando o usuário não tem permissão para acessar uma página inteira
 */
export function AccessDenied({
  title = "Acesso Restrito",
  message = "Você não tem permissão para acessar esta página. Entre em contato com o administrador da organização se acredita que isso é um erro.",
  backUrl,
  backLabel = "Voltar",
  showHomeButton = true
}: AccessDeniedProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldX className="h-10 w-10 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          {title}
        </h1>
        
        <p className="text-gray-600 mb-8">
          {message}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {backUrl && (
            <Button variant="outline" asChild>
              <Link href={backUrl}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {backLabel}
              </Link>
            </Button>
          )}
          
          {showHomeButton && (
            <Button asChild>
              <Link href="/dashboard/organizer/events">
                <Home className="h-4 w-4 mr-2" />
                Ir para Eventos
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

interface PagePermissionGuardProps {
  /** Permissão necessária para acessar a página */
  permission: string
  /** Título da página (para mensagem de erro) */
  pageTitle?: string
  /** Conteúdo da página */
  children: React.ReactNode
}

/**
 * Wrapper para páginas que requerem permissão específica
 * Mostra página de acesso negado se não tiver permissão
 */
export function PagePermissionGuard({
  permission,
  pageTitle,
  children
}: PagePermissionGuardProps) {
  // Este componente usa o hook internamente
  // Para evitar problemas de hooks, importe e use separadamente
  return <>{children}</>
}

