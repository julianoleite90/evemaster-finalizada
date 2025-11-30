import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const linkId = params.id
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar afiliado
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (affiliateError || !affiliate) {
      return NextResponse.json({ error: 'Afiliado não encontrado' }, { status: 404 })
    }

    // Verificar se o link pertence ao afiliado
    const { data: link, error: linkError } = await supabase
      .from('affiliate_links')
      .select('id, affiliate_id')
      .eq('id', linkId)
      .single()

    if (linkError || !link) {
      return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })
    }

    if (link.affiliate_id !== affiliate.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Deletar link
    const { error: deleteError } = await supabase
      .from('affiliate_links')
      .delete()
      .eq('id', linkId)

    if (deleteError) {
      console.error('Erro ao deletar link:', deleteError)
      return NextResponse.json({ error: 'Erro ao deletar link' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao deletar link:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const linkId = params.id
    const body = await request.json()
    const { title, is_active } = body

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar afiliado
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (affiliateError || !affiliate) {
      return NextResponse.json({ error: 'Afiliado não encontrado' }, { status: 404 })
    }

    // Verificar se o link pertence ao afiliado
    const { data: link, error: linkError } = await supabase
      .from('affiliate_links')
      .select('id, affiliate_id')
      .eq('id', linkId)
      .single()

    if (linkError || !link) {
      return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })
    }

    if (link.affiliate_id !== affiliate.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Atualizar link
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (is_active !== undefined) updateData.is_active = is_active

    const { error: updateError } = await supabase
      .from('affiliate_links')
      .update(updateData)
      .eq('id', linkId)

    if (updateError) {
      console.error('Erro ao atualizar link:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar link' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao atualizar link:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

