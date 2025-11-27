"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
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

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Email ou senha incorretos")
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("Por favor, confirme seu email antes de fazer login")
        } else {
          toast.error(error.message || "Erro ao fazer login")
        }
        return
      }

      if (data.user) {
        // Aguardar para garantir que o middleware criou o registro em users
        await new Promise(resolve => setTimeout(resolve, 1500))

        // Verificar metadados do auth primeiro (mais confiável que users table)
        const userMetadata = data.user.user_metadata
        const metadataRole = userMetadata?.role?.toUpperCase()
        
        console.log("=== DEBUG LOGIN ===")
        console.log("User ID:", data.user.id)
        console.log("User metadata:", userMetadata)
        console.log("Metadata role:", metadataRole)

        // Função para verificar perfis com retry
        const checkProfiles = async (maxRetries = 3) => {
          for (let i = 0; i < maxRetries; i++) {
            const [organizerResult, affiliateResult, userResult] = await Promise.all([
              supabase
                .from("organizers")
                .select("id")
                .eq("user_id", data.user.id)
                .maybeSingle(),
              supabase
                .from("affiliates")
                .select("id")
                .eq("user_id", data.user.id)
                .maybeSingle(),
              supabase
                .from("users")
                .select("role")
                .eq("id", data.user.id)
                .maybeSingle()
            ])

            const hasOrganizerProfile = organizerResult.data && !organizerResult.error
            const hasAffiliateProfile = affiliateResult.data && !affiliateResult.error
            const userRole = userResult.data?.role?.toUpperCase()

            console.log(`Attempt ${i + 1}:`)
            console.log("- Has organizer profile:", hasOrganizerProfile)
            console.log("- Has affiliate profile:", hasAffiliateProfile)
            console.log("- User role from DB:", userRole)

            if (hasOrganizerProfile) {
              return { type: "organizer", profile: true }
            }

            if (hasAffiliateProfile) {
              return { type: "affiliate", profile: true }
            }

            // Se encontrou role mas não tem perfil, retornar o role
            if (userRole && (userRole === "ORGANIZADOR" || userRole === "ORGANIZER")) {
              return { type: "organizer", profile: false, role: userRole }
            }

            if (userRole && (userRole === "AFILIADO" || userRole === "AFFILIATE")) {
              return { type: "affiliate", profile: false, role: userRole }
            }

            if (userRole === "ADMIN") {
              return { type: "admin", profile: false, role: userRole }
            }

            // Se não encontrou nada e ainda tem tentativas, aguardar
            if (i < maxRetries - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000))
            }
          }

          return null
        }

        const profileCheck = await checkProfiles()

        toast.success("Login realizado com sucesso!")

        // Determinar destino do redirecionamento
        let destino = "/my-account"

        if (profileCheck) {
          if (profileCheck.type === "organizer") {
            destino = "/dashboard/organizer"
          } else if (profileCheck.type === "affiliate") {
            destino = "/dashboard/affiliate"
          } else if (profileCheck.type === "admin") {
            destino = "/dashboard/admin"
          }
        } else if (metadataRole) {
          // Baseado no role dos metadados
          if (metadataRole === "ORGANIZADOR" || metadataRole === "ORGANIZER") {
            destino = "/dashboard/organizer"
          } else if (metadataRole === "AFILIADO" || metadataRole === "AFFILIATE") {
            destino = "/dashboard/affiliate"
          } else if (metadataRole === "ADMIN") {
            destino = "/dashboard/admin"
          }
        }

        console.log("Redirecting to:", destino)
        
        // Usar window.location para garantir redirecionamento
        window.location.href = destino
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
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <Link href="/" className="inline-block">
              <div className="relative w-48 h-48">
                <Image
                  src="/images/logo/logo.png"
                  alt="Logo"
                  fill
                  className="object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = "none"
                  }}
                />
              </div>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Bem-vindo de volta
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Não tem uma conta?{" "}
              <Link
                href="/register"
                className="font-semibold text-[#156634] hover:text-[#125529]"
              >
                Criar conta gratuita
              </Link>
            </p>
          </div>

          {/* Form */}
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

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Ao continuar, você concorda com nossos{" "}
            <Link href="/terms" className="text-[#156634] hover:text-[#125529] font-medium">
              Termos de Serviço
            </Link>{" "}
            e{" "}
            <Link href="/privacy" className="text-[#156634] hover:text-[#125529] font-medium">
              Política de Privacidade
            </Link>
          </div>
        </div>
      </div>

      {/* Right side - Image/Illustration */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-[#156634] to-[#0d4a1f]">
          <div className="flex items-center justify-center h-full p-12">
            <div className="text-center text-white">
              <h3 className="text-4xl font-bold mb-4">Gerencie seus eventos</h3>
              <p className="text-xl text-green-100">
                Plataforma completa para organizadores de eventos esportivos
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
