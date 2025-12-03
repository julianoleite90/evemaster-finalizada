import { NextRequest, NextResponse } from 'next/server'
import { enviarEmailConfirmacao, EmailInscricao } from '@/lib/email/resend'
import { apiLogger as logger } from '@/lib/utils/logger'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    logger.log('📧 [API] Recebida requisição de envio de emails')
    
    const body = await request.json()
    logger.log('📧 [API] Body recebido:', {
      quantidadeInscricoes: body.inscricoes?.length,
      nomeEvento: body.evento?.nome,
    })
    
    const { inscricoes, evento, resumoFinanceiro } = body as {
      inscricoes: Array<{
        email: string
        nome: string
        categoria: string
        valor: number
        gratuito: boolean
        codigoInscricao: string
      }>
      evento: {
        nome: string
        data: string
        hora?: string
        local: string
        descricao?: string
      }
      resumoFinanceiro?: {
        subtotal: number
        taxa: number
        total: number
      }
    }

    if (!inscricoes || !evento) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    const resultados = []

    // Enviar email para cada participante
    for (const inscricao of inscricoes) {
      logger.log(`📧 [API] Processando email para: ${inscricao.email}`)
      
      const dadosEmail: EmailInscricao = {
        para: inscricao.email,
        nomeParticipante: inscricao.nome,
        nomeEvento: evento.nome,
        dataEvento: evento.data,
        horaEvento: evento.hora,
        localEvento: evento.local,
        descricaoEvento: evento.descricao,
        categoria: inscricao.categoria,
        valor: inscricao.valor,
        gratuito: inscricao.gratuito,
        codigoInscricao: inscricao.codigoInscricao,
        resumoFinanceiro,
      }

      const resultado = await enviarEmailConfirmacao(dadosEmail)
      logger.log(`📧 [API] Resultado para ${inscricao.email}:`, resultado)
      
      resultados.push({
        email: inscricao.email,
        ...resultado,
      })
    }

    // Verificar se houve algum erro
    const sucessos = resultados.filter(r => r.success).length
    const falhas = resultados.filter(r => !r.success).length

    logger.log('📧 [API] Resumo do envio:', {
      total: resultados.length,
      sucessos,
      falhas,
    })

    if (falhas > 0) {
      logger.error('❌ [API] Alguns emails falharam:', resultados.filter(r => !r.success))
    }

    return NextResponse.json({
      success: falhas === 0,
      message: `${sucessos} email(s) enviado(s) com sucesso${falhas > 0 ? `, ${falhas} falharam` : ''}`,
      resultados,
      sucessos,
      falhas,
    })

  } catch (error: any) {
    logger.error('Erro ao processar emails:', error)
    return NextResponse.json(
      { error: 'Erro ao processar emails', details: error.message },
      { status: 500 }
    )
  }
}



