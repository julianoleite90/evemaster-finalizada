import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, name, password } = body

    if (!token || !name || !password) {
      return NextResponse.json(
        { error: 'Token, nome e senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Criar cliente admin para operações de autenticação
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuração do Supabase não encontrada' },
        { status: 500 }
      )
    }
    
    const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Buscar clube pelo token
    const { data: club, error: clubError } = await supabase
      .from('running_clubs')
      .select('*')
      .eq('token', token)
      .single()

    if (clubError || !club) {
      return NextResponse.json(
        { error: 'Convite inválido ou não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se já foi aceito
    if (club.status === 'accepted') {
      return NextResponse.json(
        { error: 'Este convite já foi aceito' },
        { status: 400 }
      )
    }

    // Verificar se expirou
    if (club.expires_at && new Date(club.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Este convite expirou' },
        { status: 400 }
      )
    }

    // Verificar se o usuário já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', club.email)
      .maybeSingle()

    let userId: string

    if (existingUser) {
      // Usuário já existe, apenas atualizar senha se necessário
      userId = existingUser.id
      
      // Atualizar senha no auth usando cliente admin
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password }
      )

      if (updateError) {
        console.error('Erro ao atualizar senha:', updateError)
        return NextResponse.json(
          { error: 'Erro ao atualizar senha do usuário', details: updateError.message },
          { status: 500 }
        )
      }
    } else {
      // Criar novo usuário usando cliente admin
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: club.email,
        password,
        email_confirm: true,
      })

      if (createError || !newUser.user) {
        console.error('Erro ao criar usuário:', createError)
        return NextResponse.json(
          { error: 'Erro ao criar conta de usuário' },
          { status: 500 }
        )
      }

      userId = newUser.user.id

      // Criar registro na tabela users
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: club.email,
          full_name: name,
        })

      if (userError) {
        console.error('Erro ao criar registro de usuário:', userError)
        // Não falhar, o usuário já foi criado no auth
      }
    }

    // Atualizar clube
    const { error: updateClubError } = await supabase
      .from('running_clubs')
      .update({
        name,
        user_id: userId,
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', club.id)

    if (updateClubError) {
      console.error('Erro ao atualizar clube:', updateClubError)
      return NextResponse.json(
        { error: 'Erro ao aceitar convite' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Convite aceito com sucesso',
      club_id: club.id,
    })
  } catch (error: any) {
    console.error('Erro ao aceitar convite:', error)
    return NextResponse.json(
      { error: 'Erro ao processar convite', details: error.message },
      { status: 500 }
    )
  }
}

