import { NextRequest, NextResponse } from 'next/server'

/**
 * API para obter informações do cliente (IP, localização aproximada)
 * Usado principalmente para registrar a aceitação do termo de responsabilidade
 */
export async function GET(request: NextRequest) {
  try {
    // Tentar obter o IP real do cliente
    // Em ordem de prioridade (mais confiável primeiro)
    let ip: string | null = null
    
    // 1. Cloudflare
    const cfConnectingIP = request.headers.get('cf-connecting-ip')
    if (cfConnectingIP) {
      ip = cfConnectingIP
    }
    
    // 2. X-Real-IP (usado por muitos proxies reversos)
    if (!ip) {
      const xRealIP = request.headers.get('x-real-ip')
      if (xRealIP) {
        ip = xRealIP
      }
    }
    
    // 3. X-Forwarded-For (padrão para proxies)
    // Formato: "client, proxy1, proxy2" - pegamos o primeiro
    if (!ip) {
      const xForwardedFor = request.headers.get('x-forwarded-for')
      if (xForwardedFor) {
        // Pega o primeiro IP da lista (IP original do cliente)
        ip = xForwardedFor.split(',')[0]?.trim() || null
      }
    }
    
    // 4. Vercel específico
    if (!ip) {
      const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for')
      if (vercelForwardedFor) {
        ip = vercelForwardedFor.split(',')[0]?.trim() || null
      }
    }
    
    // 5. Fallback - IP da conexão (em dev será ::1 ou 127.0.0.1)
    if (!ip) {
      // Em Next.js, não temos acesso direto ao socket, mas em dev é sempre localhost
      ip = request.headers.get('host')?.includes('localhost') 
        ? '127.0.0.1' 
        : null
    }
    
    // Se ainda não temos IP, pode ser ambiente de desenvolvimento
    if (!ip || ip === '::1' || ip === '127.0.0.1') {
      // Em desenvolvimento, podemos tentar obter o IP público via serviço externo
      // Mas isso é opcional e pode adicionar latência
      if (process.env.NODE_ENV === 'development') {
        try {
          const externalResponse = await fetch('https://api.ipify.org?format=json', {
            signal: AbortSignal.timeout(2000) // timeout de 2 segundos
          })
          if (externalResponse.ok) {
            const data = await externalResponse.json()
            if (data.ip) {
              ip = data.ip
            }
          }
        } catch {
          // Se falhar, manter o IP local
          ip = ip || '::1'
        }
      }
    }
    
    // Coletar informações adicionais disponíveis
    const userAgent = request.headers.get('user-agent') || null
    const acceptLanguage = request.headers.get('accept-language') || null
    const referer = request.headers.get('referer') || null
    
    // Informações de geo do Vercel (se disponível)
    const country = request.headers.get('x-vercel-ip-country') || null
    const city = request.headers.get('x-vercel-ip-city') || null
    const region = request.headers.get('x-vercel-ip-country-region') || null
    
    return NextResponse.json({
      ip: ip || 'unknown',
      userAgent,
      acceptLanguage,
      referer,
      geo: {
        country,
        city,
        region,
      },
      timestamp: new Date().toISOString(),
    })
    
  } catch (error) {
    return NextResponse.json(
      { 
        ip: 'error',
        error: 'Failed to get client info'
      },
      { status: 500 }
    )
  }
}
