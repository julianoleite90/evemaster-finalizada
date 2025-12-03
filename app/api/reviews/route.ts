import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiLogger as logger } from '@/lib/utils/logger'

export const runtime = 'nodejs'

// GET - Buscar avaliações de um organizador
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizerId = searchParams.get('organizerId')
    const eventId = searchParams.get('eventId')
    const userId = searchParams.get('userId')
    
    if (!organizerId && !eventId && !userId) {
      return NextResponse.json(
        { error: 'Informe organizerId, eventId ou userId' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    let query = supabase
      .from('organizer_reviews')
      .select(`
        *,
        user:users(id, full_name),
        event:events(id, name, event_date)
      `)
      .eq('is_visible', true)
      .order('created_at', { ascending: false })
    
    if (organizerId) {
      query = query.eq('organizer_id', organizerId)
    }
    
    if (eventId) {
      query = query.eq('event_id', eventId)
    }
    
    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    const { data: reviews, error } = await query
    
    if (error) {
      logger.error('Erro ao buscar avaliações:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar avaliações' },
        { status: 500 }
      )
    }
    
    // Calcular estatísticas se buscando por organizador
    let stats = null
    if (organizerId && reviews) {
      const totalReviews = reviews.length
      const avgRating = totalReviews > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
        : 0
      
      // Distribuição de estrelas
      const distribution = [0, 0, 0, 0, 0] // 1-5 estrelas
      reviews.forEach(r => {
        distribution[r.rating - 1]++
      })
      
      stats = {
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews,
        distribution: {
          '5': distribution[4],
          '4': distribution[3],
          '3': distribution[2],
          '2': distribution[1],
          '1': distribution[0],
        }
      }
    }
    
    return NextResponse.json({
      reviews,
      stats,
    })
  } catch (error: any) {
    logger.error('Erro na API de avaliações:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    )
  }
}

// POST - Criar nova avaliação
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      organizerId,
      eventId,
      registrationId,
      rating,
      comment,
      ratingOrganization,
      ratingCommunication,
      ratingStructure,
      ratingValue,
      isAnonymous,
    } = body
    
    if (!organizerId || !rating) {
      return NextResponse.json(
        { error: 'organizerId e rating são obrigatórios' },
        { status: 400 }
      )
    }
    
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'rating deve ser entre 1 e 5' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Você precisa estar logado para avaliar' },
        { status: 401 }
      )
    }
    
    // Verificar se o usuário já avaliou este organizador para este evento
    if (eventId) {
      const { data: existingReview } = await supabase
        .from('organizer_reviews')
        .select('id')
        .eq('user_id', user.id)
        .eq('organizer_id', organizerId)
        .eq('event_id', eventId)
        .maybeSingle()
      
      if (existingReview) {
        return NextResponse.json(
          { error: 'Você já avaliou este organizador para este evento' },
          { status: 400 }
        )
      }
    }
    
    // Verificar se o usuário participou de algum evento deste organizador
    const { data: userRegistrations } = await supabase
      .from('registrations')
      .select(`
        id,
        event:events!inner(
          id,
          organizer_id
        )
      `)
      .or(`athlete_id.eq.${user.id},buyer_id.eq.${user.id}`)
    
    const hasParticipated = userRegistrations?.some(
      (reg: any) => reg.event?.organizer_id === organizerId
    )
    
    // Criar avaliação
    const { data: review, error } = await supabase
      .from('organizer_reviews')
      .insert({
        organizer_id: organizerId,
        user_id: user.id,
        event_id: eventId || null,
        registration_id: registrationId || null,
        rating,
        comment: comment || null,
        rating_organization: ratingOrganization || null,
        rating_communication: ratingCommunication || null,
        rating_structure: ratingStructure || null,
        rating_value: ratingValue || null,
        is_anonymous: isAnonymous || false,
        is_verified: hasParticipated || false,
      })
      .select()
      .single()
    
    if (error) {
      logger.error('Erro ao criar avaliação:', error)
      
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Você já avaliou este organizador para este evento' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: 'Erro ao salvar avaliação' },
        { status: 500 }
      )
    }
    
    // Atualizar média e total de avaliações do organizador
    try {
      const { data: allReviews } = await supabase
        .from('organizer_reviews')
        .select('rating')
        .eq('organizer_id', organizerId)
        .eq('is_visible', true)
      
      if (allReviews && allReviews.length > 0) {
        const totalReviews = allReviews.length
        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        
        await supabase
          .from('organizers')
          .update({
            average_rating: Math.round(avgRating * 100) / 100,
            total_reviews: totalReviews,
          })
          .eq('id', organizerId)
        
        logger.log(`✅ Organizador ${organizerId} atualizado: ${avgRating.toFixed(2)} (${totalReviews} avaliações)`)
      }
    } catch (updateError) {
      logger.error('Erro ao atualizar média do organizador:', updateError)
      // Não falha a requisição se não conseguir atualizar
    }
    
    return NextResponse.json({
      success: true,
      review,
    })
  } catch (error: any) {
    logger.error('Erro na API de avaliações:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar avaliação existente
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      reviewId,
      rating,
      comment,
      ratingOrganization,
      ratingCommunication,
      ratingStructure,
      ratingValue,
      isAnonymous,
    } = body
    
    if (!reviewId) {
      return NextResponse.json(
        { error: 'reviewId é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Você precisa estar logado' },
        { status: 401 }
      )
    }
    
    // Verificar se a avaliação pertence ao usuário
    const { data: existingReview } = await supabase
      .from('organizer_reviews')
      .select('id, user_id')
      .eq('id', reviewId)
      .single()
    
    if (!existingReview || existingReview.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Avaliação não encontrada ou não autorizada' },
        { status: 404 }
      )
    }
    
    // Atualizar
    const updateData: any = {}
    if (rating !== undefined) updateData.rating = rating
    if (comment !== undefined) updateData.comment = comment
    if (ratingOrganization !== undefined) updateData.rating_organization = ratingOrganization
    if (ratingCommunication !== undefined) updateData.rating_communication = ratingCommunication
    if (ratingStructure !== undefined) updateData.rating_structure = ratingStructure
    if (ratingValue !== undefined) updateData.rating_value = ratingValue
    if (isAnonymous !== undefined) updateData.is_anonymous = isAnonymous
    
    const { data: review, error } = await supabase
      .from('organizer_reviews')
      .update(updateData)
      .eq('id', reviewId)
      .select()
      .single()
    
    if (error) {
      logger.error('Erro ao atualizar avaliação:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar avaliação' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      review,
    })
  } catch (error: any) {
    logger.error('Erro na API de avaliações:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    )
  }
}

// DELETE - Remover avaliação
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reviewId = searchParams.get('reviewId')
    
    if (!reviewId) {
      return NextResponse.json(
        { error: 'reviewId é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Você precisa estar logado' },
        { status: 401 }
      )
    }
    
    // Deletar (RLS vai garantir que só o dono pode deletar)
    const { error } = await supabase
      .from('organizer_reviews')
      .delete()
      .eq('id', reviewId)
      .eq('user_id', user.id)
    
    if (error) {
      logger.error('Erro ao deletar avaliação:', error)
      return NextResponse.json(
        { error: 'Erro ao deletar avaliação' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    logger.error('Erro na API de avaliações:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    )
  }
}

