"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, User, Mail, KeyRound, CheckCircle, X, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

interface CPFLoginInlineProps {
  cpf: string
  userData: {
    id: string
    maskedEmail: string
    fullName: string
  }
  onLoginSuccess: (user: any) => void
  onClose: () => void
}

type Step = 'confirm' | 'otp' | 'verifying' | 'success'

export function CPFLoginInline({
  cpf,
  userData,
  onLoginSuccess,
  onClose,
}: CPFLoginInlineProps) {
  const [step, setStep] = useState<Step>('confirm')
  const [loading, setLoading] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [maskedEmail, setMaskedEmail] = useState(userData.maskedEmail)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Auto-focus first OTP input when step changes to 'otp'
  useEffect(() => {
    if (step === 'otp' && inputRefs.current[0]) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    }
  }, [step])

  // Auto-verify when all OTP digits are filled
  useEffect(() => {
    const otpValue = otp.join('')
    if (otpValue.length === 6 && step === 'otp' && !loading) {
      handleVerifyOTP()
    }
  }, [otp, step])

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
    const digit = value.replace(/\D/g, '').slice(-1)
    
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)

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
      
      const lastFilledIndex = Math.min(pastedData.length - 1, 5)
      inputRefs.current[lastFilledIndex]?.focus()
    }
  }

  const handleVerifyOTP = async () => {
    const otpValue = otp.join('')
    if (otpValue.length !== 6) return

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

      // Atualizar sessão no cliente Supabase se houver
      if (data.session) {
        const supabase = createClient()
        await supabase.auth.setSession({
          access_token: data.session.accessToken,
          refresh_token: data.session.refreshToken,
        })
      }

      setStep('success')
      toast.success('Login realizado!')

      // Chamar callback imediatamente
      setTimeout(() => {
        onLoginSuccess(data.user)
      }, 500)

    } catch (error: any) {
      setStep('otp')
      setOtp(['', '', '', '', '', ''])
      toast.error(error.message || 'Código inválido ou expirado')
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-3 bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden animate-in slide-in-from-top-2 duration-300">
      {/* Barra verde lateral */}
      <div className="flex">
        <div className="w-1 bg-[#156634] flex-shrink-0" />
        
        <div className="flex-1 p-3 sm:p-4 min-w-0">
          {/* Step: Confirm */}
          {step === 'confirm' && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{userData.fullName}</p>
                  <p className="text-xs text-gray-500">Conta encontrada • Fazer login?</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-12 sm:ml-0">
                <Button
                  onClick={handleSendOTP}
                  disabled={loading}
                  size="sm"
                  className="bg-[#156634] hover:bg-[#1a7a3e] text-xs h-8 px-4"
                >
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Entrar'}
                </Button>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step: OTP Input */}
          {step === 'otp' && (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs sm:text-sm text-gray-600 flex-1">
                  Código enviado para <strong className="break-all">{maskedEmail}</strong>
                </p>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <div className="flex gap-1 sm:gap-1.5 justify-center sm:justify-start">
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
                      className="w-10 h-11 sm:w-9 sm:h-10 text-center text-lg font-semibold border border-gray-300 rounded focus:border-[#156634] focus:ring-1 focus:ring-[#156634] p-0"
                      disabled={loading}
                    />
                  ))}
                </div>
                <button
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="text-xs text-[#156634] hover:underline text-center sm:text-left"
                >
                  Reenviar código
                </button>
              </div>
            </div>
          )}

          {/* Step: Verifying */}
          {step === 'verifying' && (
            <div className="flex items-center gap-3 py-1">
              <Loader2 className="h-5 w-5 animate-spin text-[#156634]" />
              <span className="text-sm text-gray-600">Verificando...</span>
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <div className="flex items-center gap-3 py-2 bg-green-50 -m-3 sm:-m-4 p-3 sm:p-4">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800">Login realizado!</p>
                <p className="text-xs text-green-600">Seus dados foram preenchidos automaticamente</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

