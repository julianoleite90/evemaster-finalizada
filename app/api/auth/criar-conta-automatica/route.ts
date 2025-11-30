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

    console.log('📝 [API] Recebido criar-conta-automatica:', {
      email,
      nome,
      cpf: cpf || 'NÃO FORNECIDO',
      cpfLength: cpf?.replace(/\D/g, '').length || 0
    })

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
    
    // Se tiver admin, verificar também no auth
    let authUserId: string | null = null
    if (supabaseAdmin) {
      try {
        const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
        const existingAuthUser = authUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
        if (existingAuthUser) {
          authUserId = existingAuthUser.id
          console.log('📧 [API] Email encontrado no auth:', email, 'userId:', authUserId)
        }
      } catch (authCheckError) {
        console.warn('⚠️ [API] Erro ao verificar auth (não crítico):', authCheckError)
      }
    }
    
    if (userData) {
      // Usuário já existe, atualizar dados se necessário
      console.log('📧 [API] Usuário já existe:', email, 'userId:', userData.id)
      
      // Limpar CPF antes de salvar
      const cleanCPF = cpf?.replace(/\D/g, '') || null
      const cleanCPFValid = cleanCPF && cleanCPF.length === 11 ? cleanCPF : null
      
      console.log('💾 [API] Salvando CPF:', {
        cpfOriginal: cpf,
        cleanCPF,
        cleanCPFValid,
        willSave: !!cleanCPFValid
      })
      
      // Atualizar dados do usuário (usar upsert para garantir que sempre salve)
      const { error: updateError } = await supabase
        .from('users')
        .upsert({
          id: userData.id,
          email: email,
          full_name: nome,
          phone: telefone?.replace(/\D/g, '') || null,
          cpf: cleanCPFValid, // Salvar apenas se tiver 11 dígitos
          role: 'ATLETA',
          address: endereco || null,
          address_number: numero || null,
          address_complement: complemento || null,
          neighborhood: bairro || null,
          city: cidade || null,
          state: estado || null,
          zip_code: cep?.replace(/\D/g, '') || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        })

      if (updateError) {
        console.error('❌ [API] Erro ao atualizar dados do usuário:', {
          message: updateError.message,
          code: updateError.code,
          details: updateError.details,
          hint: updateError.hint,
          cpf: cleanCPFValid,
          email: email
        })
        
        // Se o erro for de CPF duplicado, não bloquear - apenas logar
        if (updateError.code === '23505' || updateError.message?.includes('duplicate') || updateError.message?.includes('unique')) {
          console.warn('⚠️ [API] CPF duplicado detectado, mas continuando (não crítico)')
        } else {
          console.warn('⚠️ [API] Erro ao atualizar dados do usuário (não crítico):', updateError.message)
        }
      } else {
        console.log('✅ [API] Dados atualizados com sucesso, CPF salvo:', cleanCPFValid || 'NÃO SALVO (inválido ou vazio)')
      }

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

      console.log('✅ [API] Retornando userId para usuário existente:', userData.id)
      return NextResponse.json({
        success: true,
        message: 'Conta já existia, dados atualizados',
        userId: userData.id,
      })
    }

    // Se o email existe no auth mas não na tabela users, usar o userId do auth
    if (authUserId && !userData) {
      console.log('📧 [API] Email existe no auth mas não na tabela users, criando registro na tabela users')
      
      // Criar registro na tabela users com o userId do auth
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: authUserId,
          email,
          full_name: nome,
          phone: telefone?.replace(/\D/g, '') || null,
          cpf: cpf?.replace(/\D/g, '') || null,
          role: 'ATLETA',
          address: endereco || null,
          address_number: numero || null,
          address_complement: complemento || null,
          neighborhood: bairro || null,
          city: cidade || null,
          state: estado || null,
          zip_code: cep?.replace(/\D/g, '') || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        })

      if (userError) {
        console.error('❌ [API] Erro ao criar registro em users:', userError)
        // Não retornar erro, pois o usuário já existe no auth
      } else {
        console.log('✅ [API] Registro criado na tabela users para:', email)
      }

      // Atualizar metadados no auth
      if (supabaseAdmin) {
        try {
          await supabaseAdmin.auth.admin.updateUserById(
            authUserId,
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
        message: 'Conta já existia no auth, registro criado na tabela users',
        userId: authUserId,
      })
    }

    // Criar novo usuário (só se não existir nem no auth nem na tabela users)
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
        // Se o erro for de email já existente, tentar buscar o usuário
        if (createError.code === 'email_exists' || createError.message?.includes('already been registered')) {
          console.log('⚠️ [API] Email já existe no auth, tentando buscar usuário...')
          
          try {
            const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
            const existingAuthUser = authUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
            
            if (existingAuthUser) {
              // Criar registro na tabela users com o userId do auth
              const { error: userError } = await supabase
                .from('users')
                .upsert({
                  id: existingAuthUser.id,
                  email,
                  full_name: nome,
                  phone: telefone?.replace(/\D/g, '') || null,
                  cpf: cpf?.replace(/\D/g, '') || null,
                  role: 'ATLETA',
                  address: endereco || null,
                  address_number: numero || null,
                  address_complement: complemento || null,
                  neighborhood: bairro || null,
                  city: cidade || null,
                  state: estado || null,
                  zip_code: cep?.replace(/\D/g, '') || null,
                  updated_at: new Date().toISOString(),
                }, {
                  onConflict: 'id'
                })

              if (userError) {
                console.error('❌ [API] Erro ao criar registro em users:', userError)
              }

              return NextResponse.json({
                success: true,
                message: 'Conta já existia no auth',
                userId: existingAuthUser.id,
              })
            }
          } catch (lookupError) {
            console.error('❌ [API] Erro ao buscar usuário no auth:', lookupError)
          }
        }
        
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
        // Se o erro for de email já existente, tentar buscar na tabela users
        if (signUpError.code === 'email_exists' || signUpError.message?.includes('already been registered')) {
          console.log('⚠️ [API] Email já existe no auth, tentando buscar na tabela users...')
          
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle()
          
          if (existingUser) {
            return NextResponse.json({
              success: true,
              message: 'Conta já existia',
              userId: existingUser.id,
            })
          }
        }
        
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

    // Limpar CPF antes de salvar
    const cleanCPF = cpf?.replace(/\D/g, '') || null
    const cleanCPFValid = cleanCPF && cleanCPF.length === 11 ? cleanCPF : null
    
    console.log('💾 [API] Salvando CPF (novo usuário):', {
      cpfOriginal: cpf,
      cleanCPF,
      cleanCPFValid,
      willSave: !!cleanCPFValid
    })

    // Criar ou atualizar registro em public.users (usar upsert para garantir que sempre salve)
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: newUser.id,
        email,
        full_name: nome,
        phone: telefone?.replace(/\D/g, '') || null,
        cpf: cleanCPFValid, // Salvar apenas se tiver 11 dígitos
        role: 'ATLETA',
        address: endereco || null,
        address_number: numero || null,
        address_complement: complemento || null,
        neighborhood: bairro || null,
        city: cidade || null,
        state: estado || null,
        zip_code: cep?.replace(/\D/g, '') || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      })

    if (userError) {
      console.error('❌ [API] Erro ao criar/atualizar registro em users:', userError)
      // Não retornar erro aqui, pois o usuário já foi criado no auth
      // Os dados podem ser salvos depois no perfil
    } else {
      console.log('✅ [API] Dados salvos na tabela users para:', email, 'CPF:', cleanCPFValid || 'NÃO SALVO (inválido ou vazio)')
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

