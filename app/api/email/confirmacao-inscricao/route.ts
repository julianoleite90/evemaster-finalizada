import { NextRequest, NextResponse } from 'next/server'
import { enviarEmailConfirmacao, EmailInscricao } from '@/lib/email/resend'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { inscricoes, evento } = body as {
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
        local: string
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
      const dadosEmail: EmailInscricao = {
        para: inscricao.email,
        nomeParticipante: inscricao.nome,
        nomeEvento: evento.nome,
        dataEvento: evento.data,
        localEvento: evento.local,
        categoria: inscricao.categoria,
        valor: inscricao.valor,
        gratuito: inscricao.gratuito,
        codigoInscricao: inscricao.codigoInscricao,
      }

      const resultado = await enviarEmailConfirmacao(dadosEmail)
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



