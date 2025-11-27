import { NextRequest, NextResponse } from 'next/server'
import { enviarEmailConfirmacao, EmailInscricao } from '@/lib/email/resend'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    console.log('📧 [API] Recebida requisição de envio de emails')
    
    const body = await request.json()
    console.log('📧 [API] Body recebido:', {
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
      console.log(`📧 [API] Processando email para: ${inscricao.email}`)
      
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
      console.log(`📧 [API] Resultado para ${inscricao.email}:`, resultado)
      
      resultados.push({
        email: inscricao.email,
        ...resultado,
      })
    }

    return NextResponse.json({
      success: true,
      message: `${resultados.length} email(s) processado(s)`,
      resultados,
    })

  } catch (error: any) {
    console.error('Erro ao processar emails:', error)
    return NextResponse.json(
      { error: 'Erro ao processar emails', details: error.message },
      { status: 500 }
    )
  }
}



