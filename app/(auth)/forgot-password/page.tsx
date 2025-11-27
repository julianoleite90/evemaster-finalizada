"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Mail, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast.error("Por favor, informe seu email")
      return
    }

    try {
      setLoading(true)
      const supabase = createClient()

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        toast.error(error.message || "Erro ao enviar email de recuperação")
        return
      }

      setEmailSent(true)
      toast.success("Email de recuperação enviado!")
    } catch (error: any) {
      console.error("Erro ao enviar email:", error)
      toast.error(error.message || "Erro ao enviar email. Tente novamente.")
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
          <div className="mb-8">
            <Link href="/" className="inline-block">
              <div className="relative w-32 h-32 mx-auto">
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

          {!emailSent ? (
            <>
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                  Esqueceu sua senha?
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Não se preocupe! Digite seu email e enviaremos instruções para redefinir sua senha.
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

                <div className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 text-base font-semibold bg-[#156634] hover:bg-[#125529] shadow-sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        Enviar instruções
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>

                  <Link href="/login">
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full h-12 text-base"
                    >
                      <ArrowLeft className="mr-2 h-5 w-5" />
                      Voltar para login
                    </Button>
                  </Link>
                </div>
              </form>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                  <CheckCircle2 className="h-8 w-8 text-[#156634]" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">
                  Email enviado!
                </h2>
                <p className="text-sm text-gray-600 mb-8">
                  Enviamos um link de recuperação para <strong>{email}</strong>. 
                  Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      setEmailSent(false)
                      setEmail("")
                    }}
                    className="w-full h-12 text-base font-semibold bg-[#156634] hover:bg-[#125529]"
                  >
                    Enviar novamente
                  </Button>
                  <Link href="/login">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12 text-base"
                    >
                      <ArrowLeft className="mr-2 h-5 w-5" />
                      Voltar para login
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-600">
            Não recebeu o email? Verifique sua pasta de spam ou{" "}
            <Link href="/support" className="text-[#156634] hover:text-[#125529] font-medium">
              entre em contato com o suporte
            </Link>
          </div>
        </div>
      </div>

      {/* Right side - Image/Illustration */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-[#156634] to-[#0d4a1f]">
          <div className="flex items-center justify-center h-full p-12">
            <div className="text-center text-white">
              <h3 className="text-4xl font-bold mb-4">Recupere seu acesso</h3>
              <p className="text-xl text-green-100">
                Siga as instruções enviadas por email para redefinir sua senha
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
