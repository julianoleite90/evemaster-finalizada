import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { cpf } = await request.json()

    if (!cpf) {
      return NextResponse.json(
        { error: 'CPF é obrigatório' },
        { status: 400 }
      )
    }

    // Limpar CPF (remover caracteres não numéricos)
    const cleanCPF = cpf.replace(/\D/g, '')

    if (cleanCPF.length !== 11) {
      return NextResponse.json(
        { error: 'CPF inválido' },
        { status: 400 }
      )
    }

    // Usar cliente admin para bypass de RLS (verificação pública antes do login)
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ [VERIFICAR-CPF] Configuração do Supabase não encontrada')
      return NextResponse.json(
        { error: 'Erro de configuração do servidor' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Buscar usuário pelo CPF (usando admin para bypass de RLS)
    // Primeiro tenta busca exata
    let { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, cpf')
      .eq('cpf', cleanCPF)
      .maybeSingle()

    // Se não encontrou, tenta buscar removendo formatação do CPF no banco também
    if (!user && !error) {
      console.log('⚠️ [VERIFICAR-CPF] CPF não encontrado com busca exata, tentando busca com REPLACE...')
      
      // Buscar todos os usuários com CPF e comparar removendo formatação
      const { data: allUsers, error: allError } = await supabaseAdmin
        .from('users')
        .select('id, email, full_name, cpf')
        .not('cpf', 'is', null)
        .neq('cpf', '')

      if (!allError && allUsers) {
        // Procurar CPF que corresponde após remover formatação
        user = allUsers.find(u => {
          if (!u.cpf) return false
          const dbCPF = u.cpf.replace(/\D/g, '')
          return dbCPF === cleanCPF
        }) || null

        if (user) {
          console.log('✅ [VERIFICAR-CPF] Usuário encontrado com busca flexível:', {
            email: user.email,
            cpfNoBanco: user.cpf,
            cpfBuscado: cleanCPF
          })
        }
      }
    }

    if (error) {
      console.error('❌ [VERIFICAR-CPF] Erro ao buscar usuário:', {
        error: error.message,
        code: error.code,
        details: error.details,
        cpf: cleanCPF
      })
      return NextResponse.json(
        { error: 'Erro ao verificar CPF' },
        { status: 500 }
      )
    }

    if (user) {
      console.log('✅ [VERIFICAR-CPF] Usuário encontrado:', {
        email: user.email,
        name: user.full_name,
        cpfNoBanco: user.cpf,
        cpfLength: user.cpf?.length
      })
      return NextResponse.json({
        exists: true,
        email: user.email,
        name: user.full_name,
      })
    }

    console.log('⚠️ [VERIFICAR-CPF] CPF não encontrado no banco:', cleanCPF)
    return NextResponse.json({
      exists: false,
    })
  } catch (error: any) {
    console.error('❌ [VERIFICAR-CPF] Erro ao verificar CPF:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar CPF' },
      { status: 500 }
    )
  }
}

