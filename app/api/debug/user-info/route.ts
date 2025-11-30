import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { logError, logInfo } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Rota de debug para verificar informações de um usuário
 * Uso: POST /api/debug/user-info com { email: "email@example.com" }
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

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

    logInfo('Verificando informações do usuário', { email })

    // 1. Buscar no Supabase Auth
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    const authUser = authUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

    // 2. Buscar na tabela users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .ilike('email', email)

    // 3. Buscar na tabela organizers
    const { data: organizers, error: organizersError } = await supabaseAdmin
      .from('organizers')
      .select('*')
      .eq('user_id', authUser?.id || '')

    // 4. Buscar na tabela organization_users
    const { data: orgMemberships, error: orgError } = await supabaseAdmin
      .from('organization_users')
      .select('*')
      .eq('user_id', authUser?.id || '')

    const result = {
      email,
      timestamp: new Date().toISOString(),
      auth: {
        found: !!authUser,
        user: authUser ? {
          id: authUser.id,
          email: authUser.email,
          emailConfirmed: !!authUser.email_confirmed_at,
          confirmedAt: authUser.email_confirmed_at,
          createdAt: authUser.created_at,
          lastSignIn: authUser.last_sign_in_at,
          metadata: authUser.user_metadata,
          appMetadata: authUser.app_metadata,
        } : null,
        error: authError?.message,
        totalUsers: authUsers?.users?.length || 0,
      },
      usersTable: {
        found: (users?.length || 0) > 0,
        count: users?.length || 0,
        users: users?.map(u => ({
          id: u.id,
          email: u.email,
          full_name: u.full_name,
          role: u.role,
          created_at: u.created_at,
          updated_at: u.updated_at,
        })) || [],
        error: usersError?.message,
      },
      organizers: {
        found: (organizers?.length || 0) > 0,
        count: organizers?.length || 0,
        organizers: organizers || [],
        error: organizersError?.message,
      },
      organizationMemberships: {
        found: (orgMemberships?.length || 0) > 0,
        count: orgMemberships?.length || 0,
        memberships: orgMemberships || [],
        error: orgError?.message,
      },
    }

    logInfo('Informações do usuário coletadas', { 
      email, 
      hasAuthUser: !!authUser,
      usersCount: users?.length || 0,
      organizersCount: organizers?.length || 0
    })

    return NextResponse.json(result)

  } catch (error: any) {
    logError(error, 'Erro ao buscar informações do usuário', {
      route: '/api/debug/user-info',
      method: 'POST',
    })
    return NextResponse.json(
      { error: 'Erro ao buscar informações', details: error.message },
      { status: 500 }
    )
  }
}

