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
  const [loadingTempPassword, setLoadingTempPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [tempPasswordSent, setTempPasswordSent] = useState(false)

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

        toast.success("Login realizado com sucesso!")

        // Login geral sempre redireciona para área de membros
        // Organizadores, afiliados e admins devem usar suas páginas específicas de login
        window.location.href = "/my-account"
      }
    } catch (error: any) {
      console.error("Erro ao fazer login:", error)
      toast.error(error.message || "Erro ao fazer login. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleSendTempPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast.error("Digite seu email")
      return
    }

    try {
      setLoadingTempPassword(true)

      // Chamar API para enviar senha temporária
      const response = await fetch('/api/auth/enviar-senha-temporaria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || "Erro ao enviar senha temporária")
        return
      }

      setTempPasswordSent(true)
      toast.success("Senha temporária enviada! Verifique seu email.")
    } catch (error: any) {
      console.error("Erro ao enviar senha temporária:", error)
      toast.error("Erro ao enviar senha temporária. Tente novamente.")
    } finally {
      setLoadingTempPassword(false)
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
              Acesse sua área de membros
            </p>
          </div>

          {!tempPasswordSent ? (
            <>
              {/* Primeiro passo: Email e botão para receber senha */}
              <form onSubmit={handleSendTempPassword} className="space-y-6">
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
                  <Button
                    type="submit"
                    disabled={loadingTempPassword || !email}
                    className="w-full h-12 text-base font-semibold bg-[#156634] hover:bg-[#125529] shadow-sm"
                  >
                    {loadingTempPassword ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-5 w-5" />
                        Receber senha no email
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-center text-gray-500">
                  Digite seu email e clique em &quot;Receber senha no email&quot; para receber uma senha temporária
                </p>
              </form>
            </>
          ) : (
            <>
              {/* Segundo passo: Mostrar mensagem de sucesso e input de senha */}
              <div className="space-y-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <Mail className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    Senha temporária enviada!
                  </h3>
                  <p className="text-sm text-green-700 mb-4">
                    Enviamos uma senha temporária para <strong>{email}</strong>
                  </p>
                  <p className="text-xs text-green-600">
                    Verifique seu email e insira a senha abaixo para fazer login
                  </p>
                </div>
              </div>

              {/* Form com Senha */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="email-display" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email-display"
                      name="email-display"
                      type="email"
                      disabled
                      value={email}
                      className="pl-10 h-12 text-base bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Senha Temporária
                  </Label>
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
                      placeholder="Digite a senha recebida por email"
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

              <div className="mt-4 text-center">
                <Button
                  onClick={() => {
                    setTempPasswordSent(false)
                    setEmail("")
                    setPassword("")
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Usar outro email
                </Button>
              </div>
            </>
          )}

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
