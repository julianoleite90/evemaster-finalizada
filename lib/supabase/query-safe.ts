/**
 * Utility para queries seguras do Supabase
 * 
 * Implementa:
 * - Timeout automático
 * - Retry com exponential backoff
 * - Error handling
 * - Logging de performance
 */

import { SupabaseClient } from '@supabase/supabase-js'

interface QueryOptions {
  timeout?: number // em ms, default 30000 (30s)
  retries?: number // número de tentativas, default 2
  retryDelay?: number // delay inicial em ms, default 1000
  logPerformance?: boolean // log de performance, default true
}

interface QueryResult<T> {
  data: T | null
  error: Error | null
  duration: number
  retryCount: number
}

/**
 * Executa uma query do Supabase com timeout e retry
 */
export async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: QueryOptions = {}
): Promise<QueryResult<T>> {
  const {
    timeout = 30000,
    retries = 2,
    retryDelay = 1000,
    logPerformance = true,
  } = options

  const startTime = performance.now()
  let retryCount = 0
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Criar promise com timeout
      const queryPromise = queryFn()
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Query timeout after ${timeout}ms`)),
          timeout
        )
      )

      const result = await Promise.race([queryPromise, timeoutPromise])

      const duration = performance.now() - startTime

      if (logPerformance && duration > 5000) {
        console.warn(`⚠️ [SLOW QUERY] Query took ${duration.toFixed(0)}ms`)
      }

      if (result.error) {
        throw new Error(result.error.message || 'Query failed')
      }

      if (logPerformance && retryCount > 0) {
        console.log(`✅ [QUERY RETRY] Succeeded after ${retryCount} retries`)
      }

      // Preservar .count quando existe (head: true)
      // Para queries com count: retornar { data: resultCompleto, ... }
      // Para queries normais: retornar { data: result.data, ... }
      const finalData = 'count' in result ? result : result.data
      
      return {
        data: finalData as T | null,
        error: null,
        duration,
        retryCount,
      }
    } catch (error: any) {
      lastError = error
      retryCount = attempt + 1

      // Se não for a última tentativa, aguardar antes de retry
      if (attempt < retries) {
        const delay = retryDelay * Math.pow(2, attempt) // Exponential backoff
        console.warn(
          `⚠️ [QUERY RETRY] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`,
          error.message
        )
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  const duration = performance.now() - startTime

  console.error(
    `❌ [QUERY FAILED] Failed after ${retries + 1} attempts (${duration.toFixed(0)}ms)`,
    lastError
  )

  return {
    data: null,
    error: lastError,
    duration,
    retryCount,
  }
}

/**
 * Busca dados com paginação automática
 */
export async function paginatedQuery<T = any>(
  supabase: SupabaseClient,
  tableName: string,
  options: {
    select?: string
    filters?: Record<string, any>
    order?: { column: string; ascending?: boolean }
    limit?: number
    offset?: number
  } = {}
): Promise<QueryResult<T[]>> {
  const {
    select = '*',
    filters = {},
    order,
    limit = 50,
    offset = 0,
  } = options

  const startTime = performance.now()

  try {
    let query: any = supabase
      .from(tableName)
      .select(select, { count: 'exact' })
      .range(offset, offset + limit - 1)

    // Aplicar filtros
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        query = query.in(key, value)
      } else {
        query = query.eq(key, value)
      }
    })

    // Aplicar ordenação
    if (order) {
      query = query.order(order.column, { ascending: order.ascending ?? true })
    }

    const result = await query
    const duration = performance.now() - startTime

    if (result.error) {
      throw new Error(result.error.message || 'Query failed')
    }

    return {
      data: result.data as T[],
      error: null,
      duration,
      retryCount: 0,
    }
  } catch (error: any) {
    return {
      data: null,
      error,
      duration: performance.now() - startTime,
      retryCount: 0,
    }
  }
}

/**
 * Executa múltiplas queries em paralelo com allSettled
 */
export async function parallelQueries<T extends Record<string, any>>(
  queries: Record<string, () => Promise<{ data: any; error: any }>>,
  options: QueryOptions = {}
): Promise<{
  data: { [K in keyof T]: T[K] | null }
  errors: { [K in keyof T]?: Error }
  duration: number
}> {
  const startTime = performance.now()

  const queryEntries = Object.entries(queries)
  const results = await Promise.allSettled(
    queryEntries.map(([key, queryFn]) =>
      safeQuery(queryFn, { ...options, logPerformance: false })
    )
  )

  const data: any = {}
  const errors: any = {}

  results.forEach((result, index) => {
    const [key] = queryEntries[index]

    if (result.status === 'fulfilled') {
      data[key] = result.value.data
      if (result.value.error) {
        errors[key] = result.value.error
      }
    } else {
      data[key] = null
      errors[key] = result.reason
    }
  })

  const duration = performance.now() - startTime

  if (options.logPerformance !== false && duration > 5000) {
    console.warn(
      `⚠️ [PARALLEL QUERIES] Took ${duration.toFixed(0)}ms for ${queryEntries.length} queries`
    )
  }

  if (Object.keys(errors).length > 0) {
    console.error('❌ [PARALLEL QUERIES] Some queries failed:', errors)
  }

  return { data, errors, duration }
}

/**
 * Helper para JSON.parse seguro
 */
export function safeJsonParse<T = any>(
  jsonString: string | null | undefined,
  fallback: T | null = null
): T | null {
  if (!jsonString) return fallback

  try {
    return JSON.parse(jsonString) as T
  } catch (error) {
    console.error('❌ [JSON PARSE] Failed to parse:', {
      error,
      preview: jsonString.substring(0, 100),
    })
    return fallback
  }
}

/**
 * Helper para decodificar URL params com segurança
 */
export function safeDecodeURIComponent(
  encoded: string | null | undefined
): string | null {
  if (!encoded) return null

  try {
    return decodeURIComponent(encoded)
  } catch (error) {
    console.error('❌ [URI DECODE] Failed to decode:', {
      error,
      preview: encoded.substring(0, 100),
    })
    return null
  }
}

/**
 * Helper para localStorage seguro
 */
export const safeLocalStorage = {
  getItem<T = any>(key: string, fallback: T | null = null): T | null {
    if (typeof window === 'undefined') return fallback

    try {
      const item = localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : fallback
    } catch (error) {
      console.error(`❌ [LOCALSTORAGE] Failed to get ${key}:`, error)
      return fallback
    }
  },

  setItem(key: string, value: any): boolean {
    if (typeof window === 'undefined') return false

    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error(`❌ [LOCALSTORAGE] Failed to set ${key}:`, error)
      return false
    }
  },

  removeItem(key: string): boolean {
    if (typeof window === 'undefined') return false

    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error(`❌ [LOCALSTORAGE] Failed to remove ${key}:`, error)
      return false
    }
  },
}

