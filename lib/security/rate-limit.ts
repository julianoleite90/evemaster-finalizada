/**
 * Rate Limiting para APIs
 * Protege contra DDoS, brute force e spam
 * 
 * Usa Upstash Redis para funcionar em ambiente serverless/multi-instance
 * Fallback para in-memory quando Redis não está configurado (desenvolvimento)
 */

import { NextRequest, NextResponse } from "next/server"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Verificar se Upstash está configurado
const isUpstashConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL && 
  process.env.UPSTASH_REDIS_REST_TOKEN
)

// Cliente Redis do Upstash (se configurado)
let redis: Redis | null = null
if (isUpstashConfigured) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
}

// Rate limiters do Upstash para diferentes cenários
const upstashLimiters = redis ? {
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 tentativas em 15 minutos
    analytics: true,
    prefix: "ratelimit:auth:",
  }),
  create: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 criações por minuto
    analytics: true,
    prefix: "ratelimit:create:",
  }),
  read: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 leituras por minuto
    analytics: true,
    prefix: "ratelimit:read:",
  }),
  default: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1 m"), // 30 requests por minuto
    analytics: true,
    prefix: "ratelimit:default:",
  }),
} : null

// Fallback: In-memory store para desenvolvimento local
// AVISO: Não funciona em produção com múltiplas instâncias!
const inMemoryStore = new Map<string, { count: number; resetTime: number }>()

interface RateLimitConfig {
  windowMs: number // Janela de tempo em ms
  maxRequests: number // Máximo de requests na janela
  message?: string // Mensagem de erro
}

// Configurações padrão para diferentes tipos de endpoints
export const RATE_LIMIT_CONFIGS = {
  // APIs de autenticação (mais restritivas)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 5, // 5 tentativas
    message: "Muitas tentativas. Aguarde 15 minutos.",
  },
  // APIs de criação de recursos
  create: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 10, // 10 criações por minuto
    message: "Limite de criação atingido. Aguarde um momento.",
  },
  // APIs de leitura (mais permissivas)
  read: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 100, // 100 leituras por minuto
    message: "Muitas requisições. Aguarde um momento.",
  },
  // APIs gerais
  default: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 30, // 30 requests por minuto
    message: "Limite de requisições atingido.",
  },
} as const

export type RateLimitType = keyof typeof RATE_LIMIT_CONFIGS

/**
 * Extrai identificador único do request (IP + User-Agent hash)
 */
function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  const ip = forwarded ? forwarded.split(",")[0].trim() : realIp || "unknown"
  const userAgent = request.headers.get("user-agent") || "unknown"
  
  // Combina IP com hash simples do user-agent para evitar bypass por troca de IP
  const hash = userAgent.length.toString(36) + userAgent.charCodeAt(0).toString(36)
  return `${ip}-${hash}`
}

/**
 * Limpa entradas expiradas do store in-memory (garbage collection)
 */
function cleanupExpiredInMemory(): void {
  const now = Date.now()
  for (const [key, value] of inMemoryStore.entries()) {
    if (value.resetTime < now) {
      inMemoryStore.delete(key)
    }
  }
}

/**
 * Verifica rate limit usando in-memory (fallback para desenvolvimento)
 */
function checkRateLimitInMemory(
  identifier: string,
  pathname: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetIn: number } {
  const key = `${pathname}-${identifier}`
  const now = Date.now()
  
  // Limpar entradas expiradas ocasionalmente
  if (Math.random() < 0.01) cleanupExpiredInMemory()
  
  const entry = inMemoryStore.get(key)
  
  if (!entry || entry.resetTime < now) {
    // Nova janela
    inMemoryStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    }
  }
  
  if (entry.count >= config.maxRequests) {
    // Limite excedido
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    }
  }
  
  // Incrementar contador
  entry.count++
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetIn: entry.resetTime - now,
  }
}

/**
 * Verifica rate limit para um request
 * Usa Upstash em produção, fallback para in-memory em dev
 */
export async function checkRateLimit(
  request: NextRequest,
  configOrType: RateLimitConfig | RateLimitType = "default"
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const identifier = getClientIdentifier(request)
  const config = typeof configOrType === "string" 
    ? RATE_LIMIT_CONFIGS[configOrType] 
    : configOrType
  
  // Usar Upstash se configurado
  if (upstashLimiters && typeof configOrType === "string") {
    const limiter = upstashLimiters[configOrType] || upstashLimiters.default
    const uniqueKey = `${request.nextUrl.pathname}:${identifier}`
    
    try {
      const result = await limiter.limit(uniqueKey)
      
      return {
        allowed: result.success,
        remaining: result.remaining,
        resetIn: result.reset - Date.now(),
      }
    } catch (error) {
      console.error("❌ [RATE LIMIT] Erro no Upstash, usando fallback:", error)
      // Fallback para in-memory se Upstash falhar
    }
  }
  
  // Fallback para in-memory
  if (!isUpstashConfigured && process.env.NODE_ENV === "development") {
    console.warn("⚠️ [RATE LIMIT] Usando in-memory (apenas dev). Configure UPSTASH para produção.")
  }
  
  return checkRateLimitInMemory(identifier, request.nextUrl.pathname, config)
}

/**
 * Middleware de rate limit para usar em API routes
 * @param request - NextRequest
 * @param configOrType - Configuração de rate limit ou tipo predefinido
 * @returns NextResponse de erro ou null se permitido
 */
export async function rateLimitMiddleware(
  request: NextRequest,
  configOrType: RateLimitConfig | RateLimitType = "default"
): Promise<NextResponse | null> {
  const config = typeof configOrType === "string" 
    ? RATE_LIMIT_CONFIGS[configOrType] 
    : configOrType
    
  const result = await checkRateLimit(request, configOrType)
  
  if (!result.allowed) {
    return NextResponse.json(
      {
        error: config.message || "Rate limit exceeded",
        retryAfter: Math.ceil(result.resetIn / 1000),
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(result.resetIn / 1000)),
          "X-RateLimit-Limit": String(config.maxRequests),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(result.resetIn / 1000)),
        },
      }
    )
  }
  
  return null // Permitido
}

/**
 * Higher-order function para proteger API route com rate limit
 * @param handler - API route handler
 * @param configOrType - Configuração de rate limit ou tipo predefinido
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  configOrType: RateLimitConfig | RateLimitType = "default"
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const rateLimitResponse = await rateLimitMiddleware(request, configOrType)
    if (rateLimitResponse) return rateLimitResponse
    
    const response = await handler(request)
    
    // Adicionar headers de rate limit na resposta
    const config = typeof configOrType === "string" 
      ? RATE_LIMIT_CONFIGS[configOrType] 
      : configOrType
    const result = await checkRateLimit(request, configOrType)
    response.headers.set("X-RateLimit-Limit", String(config.maxRequests))
    response.headers.set("X-RateLimit-Remaining", String(result.remaining))
    response.headers.set("X-RateLimit-Reset", String(Math.ceil(result.resetIn / 1000)))
    
    return response
  }
}

export default {
  checkRateLimit,
  rateLimitMiddleware,
  withRateLimit,
  RATE_LIMIT_CONFIGS,
}
