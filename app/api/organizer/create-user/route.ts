import { NextRequest, NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    console.log("🔧 [CREATE USER API] Iniciando criação de usuário...")
    const body = await request.json()
    const { email, password, full_name, phone } = body as {
      email: string
      password: string
      full_name: string
      phone?: string
    }

    console.log("🔧 [CREATE USER API] Dados recebidos:", { 
      email, 
      hasPassword: !!password, 
      passwordLength: password?.length,
      full_name,
      phone 
    })

    if (!email || !password || !full_name) {
      console.error("❌ [CREATE USER API] Campos obrigatórios faltando")
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

    console.log("🔧 [CREATE USER API] Verificando autenticação:", {
      hasUser: !!user,
      userId: user?.id,
      error: authError?.message
    })

    if (authError || !user) {
      console.error("❌ [CREATE USER API] Não autorizado")
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    // Verificar se é organizador
    const { data: organizer, error: organizerError } = await supabase
      .from("organizers")
      .select("id")
      .eq("user_id", user.id)
      .single()

    console.log("🔧 [CREATE USER API] Verificando se é organizador:", {
      organizerId: organizer?.id,
      error: organizerError?.message
    })

    if (!organizer) {
      console.error("❌ [CREATE USER API] Usuário não é organizador")
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

    // Verificar se o usuário já existe na tabela users
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", email)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json(
        { error: "Usuário já existe com este email", details: "Este email já está cadastrado no sistema" },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe no auth mas foi deletado da tabela users
    // Se existir, deletar do auth para permitir recriação
    try {
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
      const existingAuthUser = authUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
      
      if (existingAuthUser) {
        console.log("Usuário encontrado no auth mas não na tabela users. Deletando do auth para permitir recriação...")
        // Deletar do auth para permitir criar novamente
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(existingAuthUser.id)
        if (deleteError) {
          console.error("Erro ao deletar usuário do auth:", deleteError)
          return NextResponse.json(
            { error: "Email já cadastrado no sistema de autenticação", details: "Este email já possui uma conta. Entre em contato com o suporte para reativar." },
            { status: 400 }
          )
        }
        console.log("Usuário deletado do auth com sucesso. Prosseguindo com criação...")
      }
    } catch (authCheckError) {
      console.error("Erro ao verificar/deletar usuário no auth:", authCheckError)
      // Continuar mesmo se houver erro na verificação do auth
    }

    // Criar usuário no Auth
    console.log("🔧 [CREATE USER API] Criando usuário no Auth...")
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

    console.log("🔧 [CREATE USER API] Resultado criação Auth:", {
      hasUser: !!authUser?.user,
      userId: authUser?.user?.id,
      error: createError?.message,
      errorCode: createError?.status,
      errorName: createError?.name
    })

    if (createError || !authUser.user) {
      console.error("❌ [CREATE USER API] ERRO AO CRIAR NO AUTH:", createError)
      
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
    console.log("🔧 [CREATE USER API] Criando registro na tabela users...")
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

    console.log("🔧 [CREATE USER API] Resultado inserção em users:", {
      error: userError?.message,
      errorCode: userError?.code,
      errorDetails: userError
    })

    if (userError) {
      console.error("❌ [CREATE USER API] ERRO AO CRIAR EM USERS:", userError)
      // Tentar deletar o usuário do Auth se falhar
      console.log("🔧 [CREATE USER API] Tentando deletar usuário do Auth...")
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      if (deleteError) {
        console.error("❌ [CREATE USER API] Erro ao deletar do Auth:", deleteError)
      }
      return NextResponse.json(
        { error: "Erro ao criar registro do usuário", details: userError.message },
        { status: 500 }
      )
    }

    console.log("✅ [CREATE USER API] Usuário criado com sucesso:", {
      id: authUser.user.id,
      email: authUser.user.email
    })

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

