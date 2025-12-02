"use client"

import React from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  errorId: string | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  page?: string
  fallback?: React.ReactNode
}

/**
 * Error Boundary genérico para páginas do dashboard
 */
export class DashboardErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null, errorId: null }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("🚨 [DASHBOARD ERROR BOUNDARY] Erro capturado:", {
      page: this.props.page,
      message: error.message,
      name: error.name,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      url: typeof window !== "undefined" ? window.location.href : "N/A",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "N/A",
      timestamp: new Date().toISOString(),
    })

    this.setState({ errorInfo })

    // Salvar erro no localStorage
    if (typeof window !== "undefined") {
      try {
        const errors = JSON.parse(localStorage.getItem("dashboard_errors") || "[]")
        errors.push({
          page: this.props.page,
          message: error.message,
          stack: error.stack?.substring(0, 500),
          url: window.location.href,
          timestamp: new Date().toISOString(),
        })
        localStorage.setItem("dashboard_errors", JSON.stringify(errors.slice(-10)))
      } catch {
        // Ignorar erros de localStorage
      }

      // Enviar erro para o servidor
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorMessage: error.message,
          errorStack: error.stack,
          errorType: 'unknown',
          componentStack: errorInfo.componentStack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          page: this.props.page || 'dashboard',
          additionalData: {
            errorName: error.name,
            timestamp: new Date().toISOString(),
          },
        }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.errorId) {
            this.setState({ errorId: data.errorId })
          }
        })
        .catch(err => console.error('Falha ao enviar erro:', err))
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, errorId: null })
    if (typeof window !== "undefined") {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      // Usar fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { error, errorId } = this.state

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Ops! Algo deu errado
            </h1>

            <p className="text-gray-600 mb-6">
              Ocorreu um erro inesperado. Por favor, tente novamente ou recarregue a página.
            </p>

            {process.env.NODE_ENV === "development" && error && (
              <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm font-mono text-red-600 break-all">
                  {error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button
                onClick={this.handleRetry}
                className="w-full bg-[#156634] hover:bg-[#1a7a3e]"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>

              <Link href="/dashboard/organizer" className="w-full">
                <Button variant="outline" className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Voltar para o dashboard
                </Button>
              </Link>
            </div>

            <p className="text-xs text-gray-400 mt-6">
              {errorId 
                ? `Erro registrado. Código: ${errorId.substring(0, 8)}...`
                : "Se o problema persistir, entre em contato com o suporte."
              }
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default DashboardErrorBoundary

