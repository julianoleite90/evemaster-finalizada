import { NextRequest, NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, full_name, phone } = body as {
      email: string
      password: string
      full_name: string
      phone?: string
    }

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: "Email, senha e nome são obrigatórios", details: "Preencha todos os campos obrigatórios" },
        { status: 400 }
      )
    }

    // Validar senha
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Senha muito curta", details: "A senha deve ter no mínimo 6 caracteres" },
        { status: 400 }
      )
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Email inválido", details: "Digite um email válido" },
        { status: 400 }
      )
    }

    // Verificar se o usuário está autenticado e é organizador
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    // Verificar se é organizador
    const { data: organizer } = await supabase
      .from("organizers")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!organizer) {
      return NextResponse.json(
        { error: "Apenas organizadores podem criar usuários" },
        { status: 403 }
      )
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Configuração do Supabase não encontrada" },
        { status: 500 }
      )
    }

    // Criar cliente admin
    const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verificar se o usuário já existe
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", email)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json(
        { error: "Usuário já existe com este email" },
        { status: 400 }
      )
    }

    // Criar usuário no Auth
    const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: {
        full_name,
        phone: phone?.replace(/\D/g, '') || null,
        role: 'ORGANIZADOR',
      }
    })

    if (createError || !authUser.user) {
      console.error("Erro ao criar usuário no Auth:", createError)
      
      // Mensagens de erro mais específicas
      let errorMessage = "Erro ao criar usuário"
      if (createError?.message?.includes("already registered") || createError?.message?.includes("already exists")) {
        errorMessage = "Este email já está cadastrado"
      } else if (createError?.message?.includes("password")) {
        errorMessage = "A senha não atende aos requisitos mínimos"
      } else if (createError?.message?.includes("email")) {
        errorMessage = "Email inválido"
      } else {
        errorMessage = createError?.message || "Erro ao criar usuário no sistema de autenticação"
      }
      
      return NextResponse.json(
        { error: errorMessage, details: createError?.message },
        { status: 500 }
      )
    }

    // Criar registro na tabela users
    const { error: userError } = await supabase
      .from("users")
      .insert({
        id: authUser.user.id,
        email,
        full_name,
        phone: phone?.replace(/\D/g, '') || null,
        role: 'ORGANIZADOR', // Usuários criados por organizadores são organizadores
        is_active: true,
      })

    if (userError) {
      console.error("Erro ao criar registro em users:", userError)
      // Tentar deletar o usuário do Auth se falhar
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json(
        { error: "Erro ao criar registro do usuário", details: userError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authUser.user.id,
        email: authUser.user.email,
        full_name,
      }
    })
  } catch (error: any) {
    console.error("Erro ao criar usuário:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    )
  }
}

