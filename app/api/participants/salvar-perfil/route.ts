import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id, // userId do usuário principal (quem está logado)
      full_name,
      email,
      phone,
      cpf,
      birth_date,
      age,
      gender,
      country,
      zip_code,
      address,
      address_number,
      address_complement,
      neighborhood,
      city,
      state,
      shirt_size,
      emergency_contact_name,
      emergency_contact_phone,
    } = body

    if (!full_name || !email || !cpf) {
      return NextResponse.json(
        { error: 'Nome, email e CPF são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Usar userId do usuário autenticado OU o user_id fornecido (se logado)
    const targetUserId = user?.id || user_id

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Usuário não identificado. Faça login primeiro.' },
        { status: 401 }
      )
    }

    // Usar admin client para bypass RLS quando salvando perfil de participante adicional
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const cleanCPF = cpf.replace(/\D/g, '')

    console.log('💾 [SALVAR PERFIL] Salvando perfil para user_id:', targetUserId)

    // Verificar se já existe perfil com este CPF para este usuário (usando admin)
    const { data: existing } = await supabaseAdmin
      .from('saved_participant_profiles')
      .select('id')
      .eq('user_id', targetUserId)
      .eq('cpf', cleanCPF)
      .maybeSingle()

    const profileData = {
      user_id: targetUserId,
      full_name,
      email: email.toLowerCase(),
      phone: phone?.replace(/\D/g, '') || null,
      cpf: cleanCPF,
      birth_date: birth_date || null,
      age: age ? parseInt(age) : null,
      gender: gender || null,
      country: country || 'brasil',
      zip_code: zip_code?.replace(/\D/g, '') || null,
      address: address || null,
      address_number: address_number || null,
      address_complement: address_complement || null,
      neighborhood: neighborhood || null,
      city: city || null,
      state: state || null,
      shirt_size: shirt_size || null,
      emergency_contact_name: emergency_contact_name || null,
      emergency_contact_phone: emergency_contact_phone?.replace(/\D/g, '') || null,
    }

    let result
    if (existing) {
      // Atualizar perfil existente
      console.log('📝 [SALVAR PERFIL] Atualizando perfil existente:', existing.id)
      const { data, error } = await supabaseAdmin
        .from('saved_participant_profiles')
        .update(profileData)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Criar novo perfil
      console.log('➕ [SALVAR PERFIL] Criando novo perfil')
      const { data, error } = await supabaseAdmin
        .from('saved_participant_profiles')
        .insert(profileData)
        .select()
        .single()

      if (error) throw error
      result = data
    }
    
    console.log('✅ [SALVAR PERFIL] Perfil salvo com sucesso:', result.id)

    return NextResponse.json({
      success: true,
      profile: result,
    })
  } catch (error: any) {
    console.error('Erro ao salvar perfil:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao salvar perfil' },
      { status: 500 }
    )
  }
}

