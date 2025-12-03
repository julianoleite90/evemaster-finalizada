import { apiLogger as logger } from "@/lib/utils/logger"
import { NextRequest, NextResponse } from "next/server"

// Secret key do reCAPTCHA v2
// IMPORTANTE: Configure no .env.local (não é NEXT_PUBLIC_)
// RECAPTCHA_SECRET_KEY=sua_secret_key_aqui
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || ""

interface RecaptchaResponse {
  success: boolean
  challenge_ts?: string
  hostname?: string
  "error-codes"?: string[]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body as { token: string }

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token reCAPTCHA não fornecido" },
        { status: 400 }
      )
    }

    if (!RECAPTCHA_SECRET_KEY) {
      logger.warn("⚠️ reCAPTCHA: RECAPTCHA_SECRET_KEY não configurada")
      // Em desenvolvimento sem chave, permitir passagem
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json({ success: true, message: "reCAPTCHA bypassed (dev mode)" })
      }
      return NextResponse.json(
        { success: false, error: "reCAPTCHA não configurado no servidor" },
        { status: 500 }
      )
    }

    // Verificar token com a API do Google
    const verifyUrl = "https://www.google.com/recaptcha/api/siteverify"
    const response = await fetch(verifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${RECAPTCHA_SECRET_KEY}&response=${token}`,
    })

    const data: RecaptchaResponse = await response.json()

    if (data.success) {
      return NextResponse.json({
        success: true,
        hostname: data.hostname,
        timestamp: data.challenge_ts,
      })
    } else {
      logger.error("❌ reCAPTCHA verification failed:", data["error-codes"])
      return NextResponse.json(
        {
          success: false,
          error: "Verificação reCAPTCHA falhou",
          codes: data["error-codes"],
        },
        { status: 400 }
      )
    }
  } catch (error: any) {
    logger.error("❌ Erro ao verificar reCAPTCHA:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao verificar reCAPTCHA" },
      { status: 500 }
    )
  }
}

