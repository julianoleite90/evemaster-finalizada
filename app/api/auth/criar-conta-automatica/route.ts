import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { email, nome, telefone, cpf, endereco, numero, complemento, bairro, cidade, estado, cep } = body as {
      email: string
      nome: string
      telefone?: string
      cpf?: string
      endereco?: string
      numero?: string
      complemento?: string
      bairro?: string
      cidade?: string
      estado?: string
      cep?: string
    }

    if (!email || !nome) {
      return NextResponse.json(
        { error: 'Email e nome são obrigatórios' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
      return NextResponse.json(
        { error: 'Configuração do Supabase não encontrada' },
        { status: 500 }
      )
    }

    // Usar service role key se disponível, senão usar anon key (menos poderoso)
    const supabaseKey = supabaseServiceKey || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseKey) {
      return NextResponse.json(
        { error: 'Chave do Supabase não configurada' },
        { status: 500 }
      )
    }

    // Criar cliente admin se tiver service role, senão usar cliente normal
    const supabaseAdmin = supabaseServiceKey 
      ? createAdminClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        })
      : null

    const supabase = await createClient()

    // Verificar se o usuário já existe na tabela users
    const { data: userData } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle()
    
    if (userData) {
      // Usuário já existe, atualizar dados se necessário
      console.log('📧 [API] Usuário já existe:', email)
      
      // Atualizar dados do usuário
      await supabase
        .from('users')
        .update({
          full_name: nome,
          phone: telefone?.replace(/\D/g, ''),
          cpf: cpf?.replace(/\D/g, '') || null,
          address: endereco,
          address_number: numero,
          address_complement: complemento,
          neighborhood: bairro,
          city: cidade,
          state: estado,
          zip_code: cep?.replace(/\D/g, '') || null,
        })
        .eq('id', userData.id)

      // Se tiver admin, atualizar metadados também
      if (supabaseAdmin) {
        try {
          await supabaseAdmin.auth.admin.updateUserById(
            userData.id,
            {
              user_metadata: {
                full_name: nome,
                phone: telefone,
                cpf: cpf?.replace(/\D/g, ''),
                address: endereco,
                address_number: numero,
                address_complement: complemento,
                neighborhood: bairro,
                city: cidade,
                state: estado,
                zip_code: cep?.replace(/\D/g, ''),
                role: 'ATLETA',
              },
            }
          )
        } catch (metaError) {
          console.warn('⚠️ [API] Erro ao atualizar metadados (não crítico):', metaError)
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Conta já existia, dados atualizados',
        userId: userData.id,
      })
    }

    // Criar novo usuário
    // Se tiver service role, usar admin API, senão usar signUp normal
    let newUser = null
    
    if (supabaseAdmin) {
      // Criar via admin API (sem senha, email confirmado)
      const { data: adminUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: nome,
          phone: telefone,
          cpf: cpf?.replace(/\D/g, ''),
          address: endereco,
          address_number: numero,
          address_complement: complemento,
          neighborhood: bairro,
          city: cidade,
          state: estado,
          zip_code: cep?.replace(/\D/g, ''),
          role: 'ATLETA',
        },
      })

      if (createError) {
        console.error('❌ [API] Erro ao criar usuário:', createError)
        return NextResponse.json(
          { error: 'Erro ao criar conta', details: createError.message },
          { status: 500 }
        )
      }

      newUser = adminUser.user
    } else {
      // Sem service role, usar signUp normal (vai precisar confirmar email)
      // Gerar senha aleatória temporária
      const tempPassword = Math.random().toString(36).slice(-12) + 'A1!'
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: tempPassword,
        options: {
          data: {
            full_name: nome,
            phone: telefone,
            cpf: cpf?.replace(/\D/g, ''),
            address: endereco,
            address_number: numero,
            address_complement: complemento,
            neighborhood: bairro,
            city: cidade,
            state: estado,
            zip_code: cep?.replace(/\D/g, ''),
            role: 'ATLETA',
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://evemaster.app'}/my-account`,
        },
      })

      if (signUpError) {
        console.error('❌ [API] Erro ao criar usuário:', signUpError)
        return NextResponse.json(
          { error: 'Erro ao criar conta', details: signUpError.message },
          { status: 500 }
        )
      }

      newUser = signUpData.user
    }

    if (!newUser) {
      return NextResponse.json(
        { error: 'Falha ao criar usuário' },
        { status: 500 }
      )
    }

    // Criar registro em public.users
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: newUser.id,
        email,
        full_name: nome,
        phone: telefone?.replace(/\D/g, ''),
        cpf: cpf?.replace(/\D/g, '') || null,
        role: 'ATLETA',
        address: endereco,
        address_number: numero,
        address_complement: complemento,
        neighborhood: bairro,
        city: cidade,
        state: estado,
        zip_code: cep?.replace(/\D/g, '') || null,
      })

    if (userError && !userError.message?.includes('duplicate')) {
      console.error('❌ [API] Erro ao criar registro em users:', userError)
    }

    console.log('✅ [API] Conta criada automaticamente para:', email)

    return NextResponse.json({
      success: true,
      message: 'Conta criada com sucesso',
      userId: newUser.id,
    })

  } catch (error: any) {
    console.error('❌ [API] Erro ao criar conta:', error)
    return NextResponse.json(
      { error: 'Erro ao processar requisição', details: error.message },
      { status: 500 }
    )
  }
}

