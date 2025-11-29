"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Loader2, Mail, Lock, ArrowRight, Eye, EyeOff, Shield } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function AdminLoginPage() {
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
        } else if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
          toast.error("Erro de conexão. Verifique sua internet e tente novamente.")
        } else {
          toast.error(error.message || "Erro ao fazer login")
        }
        return
      }

      if (data.user) {
        await new Promise(resolve => setTimeout(resolve, 1500))

        // Verificar se é admin
        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle()

        const userRole = userData?.role?.toUpperCase() || data.user.user_metadata?.role?.toUpperCase()

        if (userRole !== "ADMIN") {
          toast.error("Acesso negado. Esta área é apenas para administradores.")
          await supabase.auth.signOut()
          return
        }

        toast.success("Login realizado com sucesso!")
        window.location.href = "/dashboard/admin"
      }
    } catch (error: any) {
      console.error("❌ [LOGIN ADMIN] Erro capturado:", {
        message: error?.message,
        name: error?.name
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
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
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
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-12 w-12 text-[#156634]" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Login Administrador
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Acesso restrito ao painel administrativo
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
                  placeholder="admin@evemaster.app"
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

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-[#156634]"
            >
              ← Voltar para login geral
            </Link>
          </div>
        </div>
      </div>

      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-[#156634] to-[#0d4a1f]">
          <div className="flex items-center justify-center h-full p-12">
            <div className="text-center text-white">
              <Shield className="h-16 w-16 mx-auto mb-4" />
              <h3 className="text-4xl font-bold mb-4">Painel Administrativo</h3>
              <p className="text-xl text-green-100">
                Gerencie toda a plataforma de eventos esportivos
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


