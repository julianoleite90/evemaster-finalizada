import { NextRequest, NextResponse } from 'next/server'
import { logError, ErrorContext, ErrorType } from '@/lib/error-logger'

export const runtime = 'nodejs'

/**
 * API para logar erros do lado do cliente
 * Usada pelo Error Boundary e outros componentes client-side
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      errorMessage,
      errorStack,
      errorType = 'unknown',
      componentStack,
      url,
      userAgent,
      eventId,
      eventName,
      userId,
      userEmail,
      page,
      additionalData,
    } = body

    // Extrair IP do request
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown'

    // Construir contexto do erro
    const context: ErrorContext = {
      errorType: errorType as ErrorType,
      errorSeverity: 'error',
      userId,
      userEmail,
      ipAddress,
      userAgent,
      requestPath: url,
      stackTrace: errorStack,
      metadata: {
        page,
        componentStack: componentStack?.substring(0, 1000),
        eventId,
        eventName,
        source: 'client-side',
        ...additionalData,
      },
    }

    // Criar erro para logar
    const error = {
      message: errorMessage || 'Erro desconhecido no cliente',
      stack: errorStack,
      name: 'ClientSideError',
    }

    // Logar o erro (salva no banco e envia email)
    const errorId = await logError(error, context)

    console.log('🚨 [CLIENT ERROR LOGGED]', {
      errorId,
      page,
      eventId,
      errorMessage: errorMessage?.substring(0, 100),
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ 
      success: true, 
      errorId,
      message: 'Erro registrado com sucesso' 
    })

  } catch (error: any) {
    console.error('❌ [LOG ERROR API] Falha ao registrar erro:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Falha ao registrar erro',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

