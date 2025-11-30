/**
 * Logger helper para garantir que todos os erros sejam logados corretamente no Vercel
 */

export interface ErrorContext {
  route?: string
  method?: string
  userId?: string
  email?: string
  requestId?: string
  [key: string]: any
}

export function logError(
  error: any,
  message: string,
  context?: ErrorContext
) {
  const errorDetails = {
    message,
    error: {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      status: error?.status,
      statusCode: error?.statusCode,
      cause: error?.cause,
    },
    context: context || {},
    timestamp: new Date().toISOString(),
  }

  // Log completo para Vercel (aparece nos logs)
  console.error('❌ [ERROR]', JSON.stringify(errorDetails, null, 2))
  
  // Log também em formato legível
  console.error('❌ [ERROR]', message)
  console.error('   Context:', context)
  console.error('   Error:', error?.message || error)
  if (error?.stack) {
    console.error('   Stack:', error.stack)
  }
}

export function logInfo(message: string, data?: any) {
  console.log('ℹ️ [INFO]', message, data ? JSON.stringify(data, null, 2) : '')
}

export function logWarning(message: string, data?: any) {
  console.warn('⚠️ [WARN]', message, data ? JSON.stringify(data, null, 2) : '')
}

