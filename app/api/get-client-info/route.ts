import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Capturar IP do cliente
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     request.headers.get('x-real-ip') || 
                     null
    
    // Capturar User Agent
    const userAgent = request.headers.get('user-agent') || null

    return NextResponse.json({
      ip: ipAddress,
      userAgent: userAgent,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao obter informações do cliente' },
      { status: 500 }
    )
  }
}

