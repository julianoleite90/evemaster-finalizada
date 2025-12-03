import { apiLogger as logger } from "@/lib/utils/logger"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { enviarEmailCredenciaisUsuario } from "@/lib/email/resend"

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, full_name } = body as {
      email: string
      password: string
      full_name: string
    }

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: "Email, senha e nome são obrigatórios" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    // Verificar se é organizador
    const { data: organizer } = await supabase
      .from("organizers")
      .select("id, company_name")
      .eq("user_id", user.id)
      .single()

    if (!organizer) {
      return NextResponse.json(
        { error: "Apenas organizadores podem enviar credenciais" },
        { status: 403 }
      )
    }

    // Enviar email
    const result = await enviarEmailCredenciaisUsuario({
      email,
      nome: full_name,
      senha: password,
      organizadorNome: organizer.company_name || "Organização",
    })

    if (!result.success) {
      return NextResponse.json(
        { error: "Erro ao enviar email", details: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Email enviado com sucesso",
    })
  } catch (error: any) {
    logger.error("Erro ao enviar credenciais:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    )
  }
}

