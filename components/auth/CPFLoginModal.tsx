"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, User, Mail, KeyRound, CheckCircle, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

interface CPFLoginModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cpf: string
  userData: {
    id: string
    maskedEmail: string
    fullName: string
  }
  onLoginSuccess: (user: any) => void
  onContinueWithoutLogin: () => void
}

type Step = 'confirm' | 'otp' | 'verifying' | 'success'

export function CPFLoginModal({
  open,
  onOpenChange,
  cpf,
  userData,
  onLoginSuccess,
  onContinueWithoutLogin,
}: CPFLoginModalProps) {
  const [step, setStep] = useState<Step>('confirm')
  const [loading, setLoading] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [maskedEmail, setMaskedEmail] = useState(userData.maskedEmail)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep('confirm')
      setOtp(['', '', '', '', '', ''])
      setMaskedEmail(userData.maskedEmail)
    }
  }, [open, userData.maskedEmail])

  // Auto-focus first OTP input when step changes to 'otp'
  useEffect(() => {
    if (step === 'otp' && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [step])

  // Auto-verify when all OTP digits are filled
  useEffect(() => {
    const otpValue = otp.join('')
    if (otpValue.length === 6 && step === 'otp') {
      handleVerifyOTP()
    }
  }, [otp])

  const handleSendOTP = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/auth/enviar-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar código')
      }

      setMaskedEmail(data.maskedEmail)
      setStep('otp')
      toast.success('Código enviado para seu email!')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar código')
    } finally {
      setLoading(false)
    }
  }

  const handleOTPChange = (index: number, value: string) => {
    // Apenas números
    const digit = value.replace(/\D/g, '').slice(-1)
    
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)

    // Auto-focus próximo campo
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleOTPPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    
    if (pastedData.length > 0) {
      const newOtp = [...otp]
      for (let i = 0; i < pastedData.length && i < 6; i++) {
        newOtp[i] = pastedData[i]
      }
      setOtp(newOtp)
      
      // Focus no último campo preenchido ou no próximo vazio
      const lastFilledIndex = Math.min(pastedData.length - 1, 5)
      inputRefs.current[lastFilledIndex]?.focus()
    }
  }

  const handleVerifyOTP = async () => {
    const otpValue = otp.join('')
    if (otpValue.length !== 6) {
      toast.error('Digite o código completo de 6 dígitos')
      return
    }

    try {
      setStep('verifying')
      setLoading(true)

      const response = await fetch('/api/auth/verificar-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf, otp: otpValue }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Código inválido')
      }

      // Atualizar sessão no cliente Supabase
      const supabase = createClient()
      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.accessToken,
          refresh_token: data.session.refreshToken,
        })
      }

      setStep('success')
      toast.success('Login realizado com sucesso!')

      // Aguardar um momento e chamar callback
      setTimeout(() => {
        onLoginSuccess(data.user)
        onOpenChange(false)
      }, 1500)

    } catch (error: any) {
      setStep('otp')
      setOtp(['', '', '', '', '', ''])
      toast.error(error.message || 'Código inválido ou expirado')
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleContinueWithoutLogin = () => {
    onContinueWithoutLogin()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <User className="h-5 w-5 text-[#156634]" />
            Conta Encontrada
          </DialogTitle>
          <DialogDescription>
            O CPF informado já possui uma conta cadastrada
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Step: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{userData.fullName}</p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {maskedEmail}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-600 text-center">
                <p>Deseja fazer login para preencher seus dados automaticamente?</p>
                <p className="text-xs text-gray-500 mt-1">
                  Você também poderá adicionar mais participantes facilmente.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="w-full bg-[#156634] hover:bg-[#1a7a3e]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando código...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Realizar Login
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleContinueWithoutLogin}
                  disabled={loading}
                  className="w-full"
                >
                  Continuar sem Login
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step: OTP Input */}
          {step === 'otp' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-sm text-gray-600">
                  Enviamos um código de 6 dígitos para
                </p>
                <p className="font-semibold text-gray-900">{maskedEmail}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-center block">Digite o código</Label>
                <div className="flex justify-center gap-2">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOTPChange(index, e.target.value)}
                      onKeyDown={(e) => handleOTPKeyDown(index, e)}
                      onPaste={index === 0 ? handleOTPPaste : undefined}
                      className="w-12 h-14 text-center text-2xl font-bold border-2 focus:border-[#156634] focus:ring-[#156634]"
                      disabled={loading}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.join('').length !== 6}
                  className="w-full bg-[#156634] hover:bg-[#1a7a3e]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    'Verificar Código'
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="text-sm"
                >
                  Reenviar código
                </Button>

                <Button
                  variant="outline"
                  onClick={handleContinueWithoutLogin}
                  disabled={loading}
                  className="w-full"
                >
                  Continuar sem Login
                </Button>
              </div>
            </div>
          )}

          {/* Step: Verifying */}
          {step === 'verifying' && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-[#156634] mx-auto mb-4" />
              <p className="text-gray-600">Verificando código...</p>
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <p className="text-lg font-semibold text-gray-900">Login realizado!</p>
              <p className="text-sm text-gray-600 mt-1">
                Seus dados serão preenchidos automaticamente...
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

