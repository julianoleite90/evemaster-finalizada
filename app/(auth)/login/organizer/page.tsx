"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { authLogger as logger } from "@/lib/utils/logger"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Loader2, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { ReCaptchaComponent, ReCaptchaRef } from "@/components/auth/ReCaptcha"

export default function OrganizerLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null)
  const recaptchaRef = useRef<ReCaptchaRef>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Limpar email (remover espaços)
    const cleanEmail = email.trim().toLowerCase()
    
    if (!cleanEmail || !password) {
      toast.error("Preencha todos os campos")
      return
    }

    // Verificar reCAPTCHA (se configurado)
    const captchaToken = recaptchaToken || recaptchaRef.current?.getToken()
    if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && !captchaToken) {
      toast.error("Complete o reCAPTCHA para continuar")
      return
    }

    try {
      setLoading(true)

      // Verificar reCAPTCHA no servidor (se configurado)
      if (captchaToken) {
        const recaptchaResponse = await fetch("/api/auth/verify-recaptcha", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: captchaToken }),
        })
        
        const recaptchaResult = await recaptchaResponse.json()
        if (!recaptchaResult.success) {
          toast.error("Verificação reCAPTCHA falhou. Tente novamente.")
          recaptchaRef.current?.reset()
          setRecaptchaToken(null)
          setLoading(false)
          return
        }
      }

      const supabase = createClient()

      logger.log("🔐 [LOGIN ORGANIZADOR] ========== INÍCIO LOGIN ==========")
      logger.log("🔐 [LOGIN ORGANIZADOR] Email original:", email)
      logger.log("🔐 [LOGIN ORGANIZADOR] Email limpo:", cleanEmail)
      logger.log("🔐 [LOGIN ORGANIZADOR] Senha length:", password.length)
      logger.log("🔐 [LOGIN ORGANIZADOR] Timestamp:", new Date().toISOString())
      
      // Verificar se há sessão ativa antes
      const { data: { session: existingSession } } = await supabase.auth.getSession()
      if (existingSession) {
        logger.log("⚠️ [LOGIN ORGANIZADOR] Já existe sessão ativa:", {
          userId: existingSession.user.id,
          email: existingSession.user.email,
          expiresAt: new Date(existingSession.expires_at! * 1000).toISOString()
        })
        // Fazer logout da sessão anterior
        await supabase.auth.signOut()
        logger.log("🔐 [LOGIN ORGANIZADOR] Sessão anterior removida")
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      })

      logger.log("🔐 [LOGIN ORGANIZADOR] Resposta signIn:", { 
        hasUser: !!data?.user, 
        userId: data?.user?.id,
        userEmail: data?.user?.email,
        userConfirmed: data?.user?.email_confirmed_at ? 'SIM' : 'NÃO',
        error: error?.message,
        errorCode: error?.status,
        errorName: error?.name
      })
      
      // Log detalhado do erro se houver
      if (error) {
        logger.error("🔐 [LOGIN ORGANIZADOR] DETALHES COMPLETOS DO ERRO:", {
          message: error.message,
          status: error.status,
          name: error.name,
          stack: error.stack,
          toString: error.toString()
        })
      }

      if (error) {
        logger.error("❌ [LOGIN ORGANIZADOR] ERRO NO LOGIN:", {
          message: error.message,
          status: error.status,
          name: error.name,
          code: error.status
        })
        
        // Mensagens de erro mais específicas
        if (error.message.includes("Invalid login credentials") || 
            error.message.includes("Invalid") ||
            error.status === 400) {
          logger.error("❌ [LOGIN ORGANIZADOR] Credenciais inválidas. Verifique:")
          logger.error("  - Email usado:", cleanEmail)
          logger.error("  - Email está correto?")
          logger.error("  - Senha está correta?")
          logger.error("  - Email está confirmado no Supabase?")
          logger.error("  - Usuário existe no Supabase Auth?")
          
          toast.error("Email ou senha incorretos. Verifique suas credenciais ou redefina a senha.")
        } else if (error.message.includes("Email not confirmed") || error.message.includes("not confirmed")) {
          logger.error("❌ [LOGIN ORGANIZADOR] Email não confirmado")
          toast.error("Email não confirmado. Verifique sua caixa de entrada e confirme o email.")
        } else if (error.message.includes("Failed to fetch") || 
                   error.message.includes("NetworkError") ||
                   error.message.includes("network")) {
          logger.error("❌ [LOGIN ORGANIZADOR] Erro de conexão")
          toast.error("Erro de conexão. Verifique sua internet e tente novamente.")
        } else {
          logger.error("❌ [LOGIN ORGANIZADOR] Erro desconhecido:", error)
          toast.error(error.message || "Erro ao fazer login. Tente novamente.")
        }
        setLoading(false)
        return
      }

      if (data.user) {
        logger.log("✅ [LOGIN ORGANIZADOR] Usuário autenticado:", {
          id: data.user.id,
          email: data.user.email,
          role: data.user.user_metadata?.role
        })
        
        // Aguardar para garantir que o middleware criou o registro em users
        await new Promise(resolve => setTimeout(resolve, 1500))

        logger.log("🔍 [LOGIN ORGANIZADOR] Verificando acesso de organizador...")
        logger.log("🔍 [LOGIN ORGANIZADOR] User ID:", data.user.id)
        logger.log("🔍 [LOGIN ORGANIZADOR] User Email:", data.user.email)
        logger.log("🔍 [LOGIN ORGANIZADOR] Email Confirmado:", data.user.email_confirmed_at ? 'SIM' : 'NÃO')
        
        // Buscar dados do usuário primeiro para verificar role
        const { data: userData, error: userDataError } = await supabase
          .from("users")
          .select("role, full_name, id, email")
          .eq("id", data.user.id)
          .maybeSingle()

        logger.log("🔍 [LOGIN ORGANIZADOR] Dados do usuário na tabela users:", { 
          userData,
          role: userData?.role,
          fullName: userData?.full_name,
          email: userData?.email,
          error: userDataError?.message,
          errorCode: userDataError?.code
        })
        
        // Se não encontrou na tabela users, pode ser problema
        if (!userData && !userDataError) {
          logger.error("❌ [LOGIN ORGANIZADOR] Usuário não encontrado na tabela users!")
          logger.error("  - Isso pode indicar que o registro não foi criado pelo middleware")
          logger.error("  - User ID:", data.user.id)
        }

        // Verificar se é organizador principal (tem perfil próprio)
        let { data: organizer, error: organizerError } = await supabase
          .from("organizers")
          .select("id, user_id, company_name")
          .eq("user_id", data.user.id)
          .maybeSingle()

        logger.log("🔍 [LOGIN ORGANIZADOR] Resultado busca organizador:", { 
          organizerId: organizer?.id,
          companyName: organizer?.company_name,
          error: organizerError?.message,
          errorCode: organizerError?.code
        })

        // Se encontrou organizador, permitir login imediatamente (independente do role)
        if (organizer) {
          logger.log("✅ [LOGIN ORGANIZADOR] Usuário tem perfil de organizador. Permitindo login.")
          toast.success("Login realizado com sucesso!")
          window.location.href = "/dashboard/organizer"
          return
        }

        // Se não encontrou, verificar se é membro de uma organização
        logger.log("🔍 [LOGIN ORGANIZADOR] Não é organizador principal. Verificando membership...")
        logger.log("🔍 [LOGIN ORGANIZADOR] Buscando membership para user_id:", data.user.id)
        
        // Tentar buscar TODOS os memberships primeiro (para debug) - sem filtro is_active
        const { data: allMemberships, error: allMembershipsError } = await supabase
          .from("organization_users")
          .select("organizer_id, is_active, user_id, id, can_view, can_edit, can_create, can_delete")
          .eq("user_id", data.user.id)
        
        logger.log("🔍 [LOGIN ORGANIZADOR] TODOS os memberships (sem filtro is_active):", { 
          count: allMemberships?.length || 0,
          memberships: allMemberships,
          error: allMembershipsError?.message,
          errorCode: allMembershipsError?.code,
          errorDetails: allMembershipsError
        })
        
        // Se RLS está bloqueando, isso é um problema crítico
        if (allMembershipsError && (allMembershipsError.code === 'PGRST301' || allMembershipsError.message?.includes('permission') || allMembershipsError.message?.includes('policy') || allMembershipsError.message?.includes('RLS'))) {
          logger.error("❌ [LOGIN ORGANIZADOR] RLS ESTÁ BLOQUEANDO! Erro:", allMembershipsError)
          logger.error("  - Isso indica que as políticas RLS não permitem que este usuário veja seus próprios dados")
          logger.error("  - A política 'Organization users can view own data' deveria permitir quando user_id = auth.uid()")
          logger.error("  - Verificar se auth.uid() está retornando o ID correto")
          logger.error("  - User ID autenticado:", data.user.id)
        }
        
        // Buscar apenas os ativos (se RLS permitir)
        const { data: orgMembership, error: orgError } = await supabase
          .from("organization_users")
          .select("organizer_id, is_active, user_id, id, can_view, can_edit, can_create, can_delete")
          .eq("user_id", data.user.id)
          .eq("is_active", true)
          .maybeSingle()

        logger.log("🔍 [LOGIN ORGANIZADOR] Resultado busca membership ATIVO:", { 
          membership: orgMembership,
          organizerId: orgMembership?.organizer_id,
          isActive: orgMembership?.is_active,
          userId: orgMembership?.user_id,
          canView: orgMembership?.can_view,
          error: orgError?.message,
          errorCode: orgError?.code,
          errorDetails: orgError
        })
        
        // Se encontrou membership ativo, permitir login
        if (orgMembership) {
          logger.log("✅ [LOGIN ORGANIZADOR] Usuário é membro de organização. Permitindo login.")
          logger.log("  - Membership ID:", orgMembership.id)
          logger.log("  - Organizer ID:", orgMembership.organizer_id)
          logger.log("  - Is Active:", orgMembership.is_active)
          logger.log("  - Permissions:", {
            can_view: orgMembership.can_view,
            can_edit: orgMembership.can_edit,
            can_create: orgMembership.can_create,
            can_delete: orgMembership.can_delete
          })
          toast.success("Login realizado com sucesso!")
          window.location.href = "/dashboard/organizer"
          return
        }
        
        // Se RLS bloqueou ou não encontrou, tentar via API (bypass RLS)
        if ((orgError && (orgError.code === 'PGRST301' || orgError?.message?.includes('permission') || orgError?.message?.includes('policy') || orgError?.message?.includes('RLS'))) || (!orgMembership && !allMembershipsError && allMemberships && allMemberships.length === 0)) {
          logger.warn("⚠️ [LOGIN ORGANIZADOR] Tentando verificar via API (bypass RLS)...")
          
          try {
            const debugResponse = await fetch('/api/debug/user-info', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: cleanEmail })
            })
            
            if (debugResponse.ok) {
              const debugData = await debugResponse.json()
              logger.log("🔍 [LOGIN ORGANIZADOR] Dados do debug API:", debugData)
              
              // Se encontrou membership via API, usar esses dados
              if (debugData.organizationMemberships?.found && debugData.organizationMemberships.memberships?.length > 0) {
                const activeMembershipFromAPI = debugData.organizationMemberships.memberships.find((m: any) => m.is_active)
                const anyMembershipFromAPI = debugData.organizationMemberships.memberships[0]
                
                if (activeMembershipFromAPI) {
                  logger.log("✅ [LOGIN ORGANIZADOR] Membership ATIVO encontrado via API (bypass RLS):", activeMembershipFromAPI)
                  toast.success("Login realizado com sucesso!")
                  window.location.href = "/dashboard/organizer"
                  return
                } else if (anyMembershipFromAPI) {
                  logger.warn("⚠️ [LOGIN ORGANIZADOR] Membership encontrado mas está INATIVO via API:", anyMembershipFromAPI)
                  logger.warn("  - Isso pode ser a causa do problema!")
                  logger.warn("  - Membership ID:", anyMembershipFromAPI.id)
                  logger.warn("  - Organizer ID:", anyMembershipFromAPI.organizer_id)
                  logger.warn("  - Is Active:", anyMembershipFromAPI.is_active)
                  
                  // Mesmo inativo, se o usuário tem role de ADMIN ou ORGANIZADOR, permitir login
                  const userRole = debugData.usersTable?.users?.[0]?.role
                  if (userRole === 'ADMIN' || userRole === 'ORGANIZADOR' || userRole === 'ORGANIZER') {
                    logger.log("✅ [LOGIN ORGANIZADOR] Usuário tem role adequado. Permitindo login mesmo com membership inativo.")
                    toast.success("Login realizado com sucesso!")
                    window.location.href = "/dashboard/organizer"
                    return
                  }
                }
              }
            }
          } catch (apiError) {
            logger.error("❌ [LOGIN ORGANIZADOR] Erro ao chamar API de debug:", apiError)
          }
        }
        
        // Se não encontrou membership ativo, mas encontrou inativo, informar
        if (!orgMembership && allMemberships && allMemberships.length > 0) {
          const inactiveMemberships = allMemberships.filter(m => !m.is_active)
          if (inactiveMemberships.length > 0) {
            logger.error("❌ [LOGIN ORGANIZADOR] Usuário tem membership mas está INATIVO!")
            logger.error("  - Membership IDs inativos:", inactiveMemberships.map(m => m.id))
            logger.error("  - Organizer IDs:", inactiveMemberships.map(m => m.organizer_id))
            logger.error("  - Isso pode ser a causa do problema!")
            logger.error("  - O usuário precisa ter is_active = true na tabela organization_users")
            toast.error("Seu acesso à organização está inativo. Entre em contato com o administrador.")
            return
          }
        }

        // Se não é membro nem tem perfil, verificar role e tentar criar perfil
        logger.log("🔍 [LOGIN ORGANIZADOR] Não é membro. Verificando role do usuário...")
        const userRole = userData?.role || data.user.user_metadata?.role
        logger.log("🔍 [LOGIN ORGANIZADOR] Role final:", userRole)
        
        // Permitir criar perfil se role for ORGANIZADOR, ORGANIZER, ou ADMIN (admin pode ser organizador também)
        if (userRole && (
          userRole.toUpperCase() === "ORGANIZADOR" || 
          userRole.toUpperCase() === "ORGANIZER" ||
          userRole.toUpperCase() === "ADMIN"
        )) {
          const companyName = userData?.full_name || data.user.user_metadata?.full_name || "Organizador"
          logger.log("🔍 [LOGIN ORGANIZADOR] Tentando criar perfil de organizador...")
          const { data: newOrganizer, error: createError } = await supabase
            .from("organizers")
            .insert({
              user_id: data.user.id,
              company_name: companyName,
              legal_responsible: companyName,
              status: "approved",
              is_active: true,
            })
            .select("id, user_id, company_name")
            .single()

          logger.log("🔍 [LOGIN ORGANIZADOR] Resultado criação organizador:", { 
            newOrganizerId: newOrganizer?.id,
            error: createError?.message,
            errorCode: createError?.code,
            errorDetails: createError
          })

          if (newOrganizer && !createError) {
            // newOrganizer já tem id, user_id, company_name do select acima
            organizer = newOrganizer
            toast.success("Perfil de organizador criado automaticamente!")
            window.location.href = "/dashboard/organizer"
            return
          } else {
            logger.error("❌ [LOGIN ORGANIZADOR] Erro ao criar perfil:", createError)
          }
        } else {
          logger.log("⚠️ [LOGIN ORGANIZADOR] Role não permite criar perfil:", userRole)
        }

        // Se chegou aqui, não tem acesso
        logger.error("❌ [LOGIN ORGANIZADOR] FALHA TOTAL - Usuário não tem acesso:")
        logger.error("  - User ID:", data.user.id)
        logger.error("  - User Email:", data.user.email)
        logger.error("  - Não é organizador principal")
        logger.error("  - Não é membro de organização")
        logger.error("  - Role:", userRole)
        toast.error("Esta conta não possui perfil de organizador ou não é membro de nenhuma organização. Entre em contato com o suporte.")
        await supabase.auth.signOut()
        return

        logger.log("✅ [LOGIN ORGANIZADOR] Login autorizado. Redirecionando...")
        toast.success("Login realizado com sucesso!")
        window.location.href = "/dashboard/organizer"
      } else {
        logger.error("❌ [LOGIN ORGANIZADOR] data.user é null/undefined")
      }
    } catch (error: any) {
      logger.error("❌ [LOGIN ORGANIZADOR] Erro capturado:", {
        message: error?.message,
        name: error?.name,
        stack: error?.stack
      })

      // Tratar erros de rede especificamente
      if (error?.message?.includes("Failed to fetch") || 
          error?.message?.includes("NetworkError") ||
          error?.name === "TypeError" ||
          error?.message?.includes("fetch")) {
        toast.error("Erro de conexão com o servidor. Verifique sua internet e tente novamente.")
      } else {
        toast.error(error?.message || "Erro ao fazer login. Tente novamente.")
      }
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen flex">
      <div className="flex-[0.4] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-12 xl:px-16">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-8 flex justify-center">
            <Link href="/" className="inline-block">
              <div className="relative w-48 h-48">
                <Image
                  src="/images/logo/logo.png"
                  alt="Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </Link>
          </div>

          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Login Organizador
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Acesse seu painel de organizador
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 text-base"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Senha
                    </Label>
                    <Link
                      href="/forgot-password"
                      className="text-sm font-medium text-[#156634] hover:text-[#125529]"
                    >
                      Esqueceu a senha?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 text-base"
                      placeholder="Sua senha"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* reCAPTCHA */}
                <div className="flex justify-center">
                  <ReCaptchaComponent
                    ref={recaptchaRef}
                    onChange={setRecaptchaToken}
                    onExpired={() => setRecaptchaToken(null)}
                    theme="light"
                  />
                </div>

                <div>
                  <Button
                    type="submit"
                    disabled={loading || (!!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && !recaptchaToken)}
                    className="w-full h-12 text-base font-semibold bg-[#156634] hover:bg-[#125529] shadow-sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      <>
                        Entrar
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </div>
              </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Não tem uma conta?{" "}
            <Link
              href="/register"
              className="font-semibold text-[#156634] hover:text-[#125529]"
            >
              Criar conta gratuita
            </Link>
          </div>
        </div>
      </div>

      <div className="hidden lg:block relative w-0 flex-[0.6]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#156634] to-[#0d4a1f]">
          {/* Imagem de fundo com opacidade */}
          <div 
            className="absolute inset-0 bg-center bg-no-repeat opacity-50"
            style={{
              backgroundImage: 'url(/images/organizador-banner.png)',
              backgroundSize: 'cover'
            }}
          />
          {/* Overlay verde com opacidade reduzida */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#156634]/50 to-[#0d4a1f]/50" />
          <div className="relative flex items-center justify-center h-full p-12 z-10">
            <div className="text-center text-white">
              <h3 className="text-4xl font-bold mb-4">Painel do Organizador</h3>
              <p className="text-xl text-green-100">
                Gerencie seus eventos esportivos de forma completa e profissional
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

