"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Loader2, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function OrganizerLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Limpar email (remover espaços)
    const cleanEmail = email.trim().toLowerCase()
    
    if (!cleanEmail || !password) {
      toast.error("Preencha todos os campos")
      return
    }

    try {
      setLoading(true)
      const supabase = createClient()

      console.log("🔐 [LOGIN ORGANIZADOR] ========== INÍCIO LOGIN ==========")
      console.log("🔐 [LOGIN ORGANIZADOR] Email original:", email)
      console.log("🔐 [LOGIN ORGANIZADOR] Email limpo:", cleanEmail)
      console.log("🔐 [LOGIN ORGANIZADOR] Senha length:", password.length)
      console.log("🔐 [LOGIN ORGANIZADOR] Timestamp:", new Date().toISOString())
      
      // Verificar se há sessão ativa antes
      const { data: { session: existingSession } } = await supabase.auth.getSession()
      if (existingSession) {
        console.log("⚠️ [LOGIN ORGANIZADOR] Já existe sessão ativa:", {
          userId: existingSession.user.id,
          email: existingSession.user.email,
          expiresAt: new Date(existingSession.expires_at! * 1000).toISOString()
        })
        // Fazer logout da sessão anterior
        await supabase.auth.signOut()
        console.log("🔐 [LOGIN ORGANIZADOR] Sessão anterior removida")
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      })

      console.log("🔐 [LOGIN ORGANIZADOR] Resposta signIn:", { 
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
        console.error("🔐 [LOGIN ORGANIZADOR] DETALHES COMPLETOS DO ERRO:", {
          message: error.message,
          status: error.status,
          name: error.name,
          stack: error.stack,
          toString: error.toString()
        })
      }

      if (error) {
        console.error("❌ [LOGIN ORGANIZADOR] ERRO NO LOGIN:", {
          message: error.message,
          status: error.status,
          name: error.name,
          code: error.status
        })
        
        // Mensagens de erro mais específicas
        if (error.message.includes("Invalid login credentials") || 
            error.message.includes("Invalid") ||
            error.status === 400) {
          console.error("❌ [LOGIN ORGANIZADOR] Credenciais inválidas. Verifique:")
          console.error("  - Email usado:", cleanEmail)
          console.error("  - Email está correto?")
          console.error("  - Senha está correta?")
          console.error("  - Email está confirmado no Supabase?")
          console.error("  - Usuário existe no Supabase Auth?")
          
          toast.error("Email ou senha incorretos. Verifique suas credenciais ou redefina a senha.")
        } else if (error.message.includes("Email not confirmed") || error.message.includes("not confirmed")) {
          console.error("❌ [LOGIN ORGANIZADOR] Email não confirmado")
          toast.error("Email não confirmado. Verifique sua caixa de entrada e confirme o email.")
        } else if (error.message.includes("Failed to fetch") || 
                   error.message.includes("NetworkError") ||
                   error.message.includes("network")) {
          console.error("❌ [LOGIN ORGANIZADOR] Erro de conexão")
          toast.error("Erro de conexão. Verifique sua internet e tente novamente.")
        } else {
          console.error("❌ [LOGIN ORGANIZADOR] Erro desconhecido:", error)
          toast.error(error.message || "Erro ao fazer login. Tente novamente.")
        }
        setLoading(false)
        return
      }

      if (data.user) {
        console.log("✅ [LOGIN ORGANIZADOR] Usuário autenticado:", {
          id: data.user.id,
          email: data.user.email,
          role: data.user.user_metadata?.role
        })
        
        // Aguardar para garantir que o middleware criou o registro em users
        await new Promise(resolve => setTimeout(resolve, 1500))

        console.log("🔍 [LOGIN ORGANIZADOR] Verificando acesso de organizador...")
        console.log("🔍 [LOGIN ORGANIZADOR] User ID:", data.user.id)
        console.log("🔍 [LOGIN ORGANIZADOR] User Email:", data.user.email)
        console.log("🔍 [LOGIN ORGANIZADOR] Email Confirmado:", data.user.email_confirmed_at ? 'SIM' : 'NÃO')
        
        // Buscar dados do usuário primeiro para verificar role
        const { data: userData, error: userDataError } = await supabase
          .from("users")
          .select("role, full_name, id, email")
          .eq("id", data.user.id)
          .maybeSingle()

        console.log("🔍 [LOGIN ORGANIZADOR] Dados do usuário na tabela users:", { 
          userData,
          role: userData?.role,
          fullName: userData?.full_name,
          email: userData?.email,
          error: userDataError?.message,
          errorCode: userDataError?.code
        })
        
        // Se não encontrou na tabela users, pode ser problema
        if (!userData && !userDataError) {
          console.error("❌ [LOGIN ORGANIZADOR] Usuário não encontrado na tabela users!")
          console.error("  - Isso pode indicar que o registro não foi criado pelo middleware")
          console.error("  - User ID:", data.user.id)
        }

        // Verificar se é organizador principal (tem perfil próprio)
        let { data: organizer, error: organizerError } = await supabase
          .from("organizers")
          .select("id, user_id, company_name")
          .eq("user_id", data.user.id)
          .maybeSingle()

        console.log("🔍 [LOGIN ORGANIZADOR] Resultado busca organizador:", { 
          organizerId: organizer?.id,
          companyName: organizer?.company_name,
          error: organizerError?.message,
          errorCode: organizerError?.code
        })

        // Se encontrou organizador, permitir login imediatamente (independente do role)
        if (organizer) {
          console.log("✅ [LOGIN ORGANIZADOR] Usuário tem perfil de organizador. Permitindo login.")
          toast.success("Login realizado com sucesso!")
          window.location.href = "/dashboard/organizer"
          return
        }

        // Se não encontrou, verificar se é membro de uma organização
        console.log("🔍 [LOGIN ORGANIZADOR] Não é organizador principal. Verificando membership...")
        console.log("🔍 [LOGIN ORGANIZADOR] Buscando membership para user_id:", data.user.id)
        
        // Tentar buscar TODOS os memberships primeiro (para debug) - sem filtro is_active
        const { data: allMemberships, error: allMembershipsError } = await supabase
          .from("organization_users")
          .select("organizer_id, is_active, user_id, id, can_view, can_edit, can_create, can_delete")
          .eq("user_id", data.user.id)
        
        console.log("🔍 [LOGIN ORGANIZADOR] TODOS os memberships (sem filtro is_active):", { 
          count: allMemberships?.length || 0,
          memberships: allMemberships,
          error: allMembershipsError?.message,
          errorCode: allMembershipsError?.code,
          errorDetails: allMembershipsError
        })
        
        // Se RLS está bloqueando, isso é um problema crítico
        if (allMembershipsError && (allMembershipsError.code === 'PGRST301' || allMembershipsError.message?.includes('permission') || allMembershipsError.message?.includes('policy') || allMembershipsError.message?.includes('RLS'))) {
          console.error("❌ [LOGIN ORGANIZADOR] RLS ESTÁ BLOQUEANDO! Erro:", allMembershipsError)
          console.error("  - Isso indica que as políticas RLS não permitem que este usuário veja seus próprios dados")
          console.error("  - A política 'Organization users can view own data' deveria permitir quando user_id = auth.uid()")
          console.error("  - Verificar se auth.uid() está retornando o ID correto")
          console.error("  - User ID autenticado:", data.user.id)
        }
        
        // Buscar apenas os ativos (se RLS permitir)
        const { data: orgMembership, error: orgError } = await supabase
          .from("organization_users")
          .select("organizer_id, is_active, user_id, id, can_view, can_edit, can_create, can_delete")
          .eq("user_id", data.user.id)
          .eq("is_active", true)
          .maybeSingle()

        console.log("🔍 [LOGIN ORGANIZADOR] Resultado busca membership ATIVO:", { 
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
          console.log("✅ [LOGIN ORGANIZADOR] Usuário é membro de organização. Permitindo login.")
          console.log("  - Membership ID:", orgMembership.id)
          console.log("  - Organizer ID:", orgMembership.organizer_id)
          console.log("  - Is Active:", orgMembership.is_active)
          console.log("  - Permissions:", {
            can_view: orgMembership.can_view,
            can_edit: orgMembership.can_edit,
            can_create: orgMembership.can_create,
            can_delete: orgMembership.can_delete
          })
          toast.success("Login realizado com sucesso!")
          window.location.href = "/dashboard/organizer"
          return
        }
        
        // Se não encontrou membership ativo, mas encontrou inativo, informar
        if (!orgMembership && allMemberships && allMemberships.length > 0) {
          const inactiveMemberships = allMemberships.filter(m => !m.is_active)
          if (inactiveMemberships.length > 0) {
            console.error("❌ [LOGIN ORGANIZADOR] Usuário tem membership mas está INATIVO!")
            console.error("  - Membership IDs inativos:", inactiveMemberships.map(m => m.id))
            console.error("  - Organizer IDs:", inactiveMemberships.map(m => m.organizer_id))
            console.error("  - Isso pode ser a causa do problema!")
            console.error("  - O usuário precisa ter is_active = true na tabela organization_users")
            toast.error("Seu acesso à organização está inativo. Entre em contato com o administrador.")
            return
          }
        }

        // Se não é membro nem tem perfil, verificar role e tentar criar perfil
        console.log("🔍 [LOGIN ORGANIZADOR] Não é membro. Verificando role do usuário...")
        const userRole = userData?.role || data.user.user_metadata?.role
        console.log("🔍 [LOGIN ORGANIZADOR] Role final:", userRole)
        
        // Permitir criar perfil se role for ORGANIZADOR, ORGANIZER, ou ADMIN (admin pode ser organizador também)
        if (userRole && (
          userRole.toUpperCase() === "ORGANIZADOR" || 
          userRole.toUpperCase() === "ORGANIZER" ||
          userRole.toUpperCase() === "ADMIN"
        )) {
          const companyName = userData?.full_name || data.user.user_metadata?.full_name || "Organizador"
          console.log("🔍 [LOGIN ORGANIZADOR] Tentando criar perfil de organizador...")
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

          console.log("🔍 [LOGIN ORGANIZADOR] Resultado criação organizador:", { 
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
            console.error("❌ [LOGIN ORGANIZADOR] Erro ao criar perfil:", createError)
          }
        } else {
          console.log("⚠️ [LOGIN ORGANIZADOR] Role não permite criar perfil:", userRole)
        }

        // Se chegou aqui, não tem acesso
        console.error("❌ [LOGIN ORGANIZADOR] FALHA TOTAL - Usuário não tem acesso:")
        console.error("  - User ID:", data.user.id)
        console.error("  - User Email:", data.user.email)
        console.error("  - Não é organizador principal")
        console.error("  - Não é membro de organização")
        console.error("  - Role:", userRole)
        toast.error("Esta conta não possui perfil de organizador ou não é membro de nenhuma organização. Entre em contato com o suporte.")
        await supabase.auth.signOut()
        return

        console.log("✅ [LOGIN ORGANIZADOR] Login autorizado. Redirecionando...")
        toast.success("Login realizado com sucesso!")
        window.location.href = "/dashboard/organizer"
      } else {
        console.error("❌ [LOGIN ORGANIZADOR] data.user é null/undefined")
      }
    } catch (error: any) {
      console.error("❌ [LOGIN ORGANIZADOR] Erro capturado:", {
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

                <div>
                  <Button
                    type="submit"
                    disabled={loading}
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

