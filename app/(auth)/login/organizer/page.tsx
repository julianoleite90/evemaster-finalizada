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
    
    if (!email || !password) {
      toast.error("Preencha todos os campos")
      return
    }

    try {
      setLoading(true)
      const supabase = createClient()

      console.log("🔐 [LOGIN ORGANIZADOR] Iniciando login com email:", email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log("🔐 [LOGIN ORGANIZADOR] Resposta signIn:", { 
        hasUser: !!data?.user, 
        userId: data?.user?.id,
        userEmail: data?.user?.email,
        error: error?.message,
        errorCode: error?.status
      })

      if (error) {
        console.error("❌ [LOGIN ORGANIZADOR] ERRO NO LOGIN:", {
          message: error.message,
          status: error.status,
          name: error.name
        })
        
        // Mensagens de erro mais específicas
        if (error.message.includes("Invalid login credentials") || error.message.includes("email") || error.message.includes("password")) {
          console.error("❌ [LOGIN ORGANIZADOR] Credenciais inválidas. Verifique:")
          console.error("  - Email está correto?")
          console.error("  - Senha está correta?")
          console.error("  - Email está confirmado no Supabase?")
          toast.error("Email ou senha incorretos. Verifique suas credenciais ou redefina a senha.")
        } else if (error.message.includes("Email not confirmed")) {
          console.error("❌ [LOGIN ORGANIZADOR] Email não confirmado")
          toast.error("Email não confirmado. Verifique sua caixa de entrada e confirme o email.")
        } else {
          console.error("❌ [LOGIN ORGANIZADOR] Erro desconhecido:", error)
          toast.error(error.message || "Erro ao fazer login. Tente novamente.")
        }
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

        console.log("🔍 [LOGIN ORGANIZADOR] Verificando se é organizador principal...")
        // Verificar se é organizador principal (tem perfil próprio)
        let { data: organizer, error: organizerError } = await supabase
          .from("organizers")
          .select("id")
          .eq("user_id", data.user.id)
          .maybeSingle()

        console.log("🔍 [LOGIN ORGANIZADOR] Resultado busca organizador:", { 
          organizerId: organizer?.id,
          error: organizerError?.message,
          errorCode: organizerError?.code
        })

        // Se não encontrou, verificar se é membro de uma organização
        if (!organizer) {
          console.log("🔍 [LOGIN ORGANIZADOR] Não é organizador principal. Verificando membership...")
          const { data: orgMembership, error: orgError } = await supabase
            .from("organization_users")
            .select("organizer_id, is_active")
            .eq("user_id", data.user.id)
            .eq("is_active", true)
            .maybeSingle()

          console.log("🔍 [LOGIN ORGANIZADOR] Resultado busca membership:", { 
            membership: orgMembership,
            organizerId: orgMembership?.organizer_id,
            isActive: orgMembership?.is_active,
            error: orgError?.message,
            errorCode: orgError?.code
          })

          if (orgMembership) {
            console.log("✅ [LOGIN ORGANIZADOR] Usuário é membro de organização. Permitindo login.")
            // Usuário é membro de uma organização, permitir login
            toast.success("Login realizado com sucesso!")
            window.location.href = "/dashboard/organizer"
            return
          }

          console.log("🔍 [LOGIN ORGANIZADOR] Não é membro. Verificando role do usuário...")
          // Se não é membro, tentar criar perfil de organizador automaticamente
          const { data: userData, error: userDataError } = await supabase
            .from("users")
            .select("role, full_name")
            .eq("id", data.user.id)
            .maybeSingle()

          console.log("🔍 [LOGIN ORGANIZADOR] Dados do usuário na tabela users:", { 
            userData,
            role: userData?.role,
            fullName: userData?.full_name,
            error: userDataError?.message,
            errorCode: userDataError?.code
          })

          const userRole = userData?.role || data.user.user_metadata?.role
          console.log("🔍 [LOGIN ORGANIZADOR] Role final:", userRole)
          
          if (userRole && (userRole.toUpperCase() === "ORGANIZADOR" || userRole.toUpperCase() === "ORGANIZER")) {
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
              .select("id")
              .single()

            console.log("🔍 [LOGIN ORGANIZADOR] Resultado criação organizador:", { 
              newOrganizerId: newOrganizer?.id,
              error: createError?.message,
              errorCode: createError?.code,
              errorDetails: createError
            })

            if (newOrganizer && !createError) {
              organizer = newOrganizer
              toast.success("Perfil de organizador criado automaticamente!")
            } else {
              console.error("❌ [LOGIN ORGANIZADOR] Erro ao criar perfil:", createError)
            }
          } else {
            console.log("⚠️ [LOGIN ORGANIZADOR] Role não permite criar perfil:", userRole)
          }
        }

        if (!organizer) {
          // Buscar userData novamente para o log de erro
          const { data: userDataForLog } = await supabase
            .from("users")
            .select("role, full_name")
            .eq("id", data.user.id)
            .maybeSingle()
          
          console.error("❌ [LOGIN ORGANIZADOR] FALHA TOTAL - Usuário não tem acesso:")
          console.error("  - User ID:", data.user.id)
          console.error("  - User Email:", data.user.email)
          console.error("  - Não é organizador principal")
          console.error("  - Não é membro de organização")
          console.error("  - Role:", userDataForLog?.role || data.user.user_metadata?.role)
          toast.error("Esta conta não possui perfil de organizador ou não é membro de nenhuma organização. Entre em contato com o suporte.")
          await supabase.auth.signOut()
          return
        }

        console.log("✅ [LOGIN ORGANIZADOR] Login autorizado. Redirecionando...")
        toast.success("Login realizado com sucesso!")
        window.location.href = "/dashboard/organizer"
      } else {
        console.error("❌ [LOGIN ORGANIZADOR] data.user é null/undefined")
      }
    } catch (error: any) {
      console.error("Erro ao fazer login:", error)
      toast.error(error.message || "Erro ao fazer login. Tente novamente.")
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

