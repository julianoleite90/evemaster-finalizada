"use client"

import { forwardRef, useCallback, useImperativeHandle, useRef } from "react"
import ReCAPTCHA from "react-google-recaptcha"

// Site key do reCAPTCHA v2 checkbox
// IMPORTANTE: Configure sua chave no .env.local
// NEXT_PUBLIC_RECAPTCHA_SITE_KEY=sua_chave_aqui
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""

export interface ReCaptchaRef {
  getToken: () => string | null
  reset: () => void
}

interface ReCaptchaProps {
  onChange?: (token: string | null) => void
  onExpired?: () => void
  onError?: () => void
  size?: "normal" | "compact"
  theme?: "light" | "dark"
  className?: string
}

export const ReCaptchaComponent = forwardRef<ReCaptchaRef, ReCaptchaProps>(
  ({ onChange, onExpired, onError, size = "normal", theme = "light", className }, ref) => {
    const recaptchaRef = useRef<ReCAPTCHA>(null)

    useImperativeHandle(ref, () => ({
      getToken: () => recaptchaRef.current?.getValue() || null,
      reset: () => recaptchaRef.current?.reset(),
    }))

    const handleChange = useCallback(
      (token: string | null) => {
        onChange?.(token)
      },
      [onChange]
    )

    const handleExpired = useCallback(() => {
      onChange?.(null)
      onExpired?.()
    }, [onChange, onExpired])

    const handleError = useCallback(() => {
      onChange?.(null)
      onError?.()
    }, [onChange, onError])

    // Se não tem chave configurada, não renderizar
    if (!RECAPTCHA_SITE_KEY) {
      console.warn("⚠️ reCAPTCHA: NEXT_PUBLIC_RECAPTCHA_SITE_KEY não configurada")
      return null
    }

    return (
      <div className={className}>
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={RECAPTCHA_SITE_KEY}
          onChange={handleChange}
          onExpired={handleExpired}
          onErrored={handleError}
          size={size}
          theme={theme}
        />
      </div>
    )
  }
)

ReCaptchaComponent.displayName = "ReCaptchaComponent"

// Hook para facilitar o uso do reCAPTCHA
export function useReCaptcha() {
  const recaptchaRef = useRef<ReCaptchaRef>(null)

  const getToken = useCallback(() => {
    return recaptchaRef.current?.getToken() || null
  }, [])

  const reset = useCallback(() => {
    recaptchaRef.current?.reset()
  }, [])

  const isConfigured = !!RECAPTCHA_SITE_KEY

  return {
    recaptchaRef,
    getToken,
    reset,
    isConfigured,
  }
}

export default ReCaptchaComponent

