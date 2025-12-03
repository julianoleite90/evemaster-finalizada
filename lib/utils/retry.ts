/**
 * Utilitário de retry para operações que podem falhar por timeout/rede
 */

import { logger } from './logger'

interface RetryOptions {
  retries?: number
  delay?: number
  onRetry?: (attempt: number, error: any) => void
}

/**
 * Executa uma função com retry automático em caso de erros de rede
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { retries = 3, delay = 1000, onRetry } = options
  let lastError: any

  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      
      // Só retry em erros de rede/timeout
      const isNetworkError = 
        error?.code === 'UND_ERR_SOCKET' ||
        error?.code === 'ECONNRESET' ||
        error?.code === 'ETIMEDOUT' ||
        error?.message?.includes('fetch failed') ||
        error?.message?.includes('network') ||
        error?.message?.includes('timeout') ||
        error?.name === 'AuthRetryableFetchError' ||
        error?.name === 'FetchError'

      if (isNetworkError && i < retries - 1) {
        const waitTime = delay * (i + 1)
        logger.warn(`[RETRY] Tentativa ${i + 1}/${retries} falhou, aguardando ${waitTime}ms...`)
        onRetry?.(i + 1, error)
        await new Promise(r => setTimeout(r, waitTime))
        continue
      }
      
      throw error
    }
  }
  
  throw lastError
}

/**
 * Verifica se um erro é de rede/timeout (pode ser retryable)
 */
export function isNetworkError(error: any): boolean {
  return (
    error?.code === 'UND_ERR_SOCKET' ||
    error?.code === 'ECONNRESET' ||
    error?.code === 'ETIMEDOUT' ||
    error?.message?.includes('fetch failed') ||
    error?.message?.includes('network') ||
    error?.message?.includes('timeout') ||
    error?.name === 'AuthRetryableFetchError' ||
    error?.name === 'FetchError'
  )
}

export default { withRetry, isNetworkError }

/**
 * Utilitário de retry para operações que podem falhar por timeout/rede
 */

import { logger } from './logger'

interface RetryOptions {
  retries?: number
  delay?: number
  onRetry?: (attempt: number, error: any) => void
}

/**
 * Executa uma função com retry automático em caso de erros de rede
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { retries = 3, delay = 1000, onRetry } = options
  let lastError: any

  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      
      // Só retry em erros de rede/timeout
      const isNetworkError = 
        error?.code === 'UND_ERR_SOCKET' ||
        error?.code === 'ECONNRESET' ||
        error?.code === 'ETIMEDOUT' ||
        error?.message?.includes('fetch failed') ||
        error?.message?.includes('network') ||
        error?.message?.includes('timeout') ||
        error?.name === 'AuthRetryableFetchError' ||
        error?.name === 'FetchError'

      if (isNetworkError && i < retries - 1) {
        const waitTime = delay * (i + 1)
        logger.warn(`[RETRY] Tentativa ${i + 1}/${retries} falhou, aguardando ${waitTime}ms...`)
        onRetry?.(i + 1, error)
        await new Promise(r => setTimeout(r, waitTime))
        continue
      }
      
      throw error
    }
  }
  
  throw lastError
}

/**
 * Verifica se um erro é de rede/timeout (pode ser retryable)
 */
export function isNetworkError(error: any): boolean {
  return (
    error?.code === 'UND_ERR_SOCKET' ||
    error?.code === 'ECONNRESET' ||
    error?.code === 'ETIMEDOUT' ||
    error?.message?.includes('fetch failed') ||
    error?.message?.includes('network') ||
    error?.message?.includes('timeout') ||
    error?.name === 'AuthRetryableFetchError' ||
    error?.name === 'FetchError'
  )
}

export default { withRetry, isNetworkError }

/**
 * Utilitário de retry para operações que podem falhar por timeout/rede
 */

import { logger } from './logger'

interface RetryOptions {
  retries?: number
  delay?: number
  onRetry?: (attempt: number, error: any) => void
}

/**
 * Executa uma função com retry automático em caso de erros de rede
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { retries = 3, delay = 1000, onRetry } = options
  let lastError: any

  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      
      // Só retry em erros de rede/timeout
      const isNetworkError = 
        error?.code === 'UND_ERR_SOCKET' ||
        error?.code === 'ECONNRESET' ||
        error?.code === 'ETIMEDOUT' ||
        error?.message?.includes('fetch failed') ||
        error?.message?.includes('network') ||
        error?.message?.includes('timeout') ||
        error?.name === 'AuthRetryableFetchError' ||
        error?.name === 'FetchError'

      if (isNetworkError && i < retries - 1) {
        const waitTime = delay * (i + 1)
        logger.warn(`[RETRY] Tentativa ${i + 1}/${retries} falhou, aguardando ${waitTime}ms...`)
        onRetry?.(i + 1, error)
        await new Promise(r => setTimeout(r, waitTime))
        continue
      }
      
      throw error
    }
  }
  
  throw lastError
}

/**
 * Verifica se um erro é de rede/timeout (pode ser retryable)
 */
export function isNetworkError(error: any): boolean {
  return (
    error?.code === 'UND_ERR_SOCKET' ||
    error?.code === 'ECONNRESET' ||
    error?.code === 'ETIMEDOUT' ||
    error?.message?.includes('fetch failed') ||
    error?.message?.includes('network') ||
    error?.message?.includes('timeout') ||
    error?.name === 'AuthRetryableFetchError' ||
    error?.name === 'FetchError'
  )
}

export default { withRetry, isNetworkError }

/**
 * Utilitário de retry para operações que podem falhar por timeout/rede
 */

import { logger } from './logger'

interface RetryOptions {
  retries?: number
  delay?: number
  onRetry?: (attempt: number, error: any) => void
}

/**
 * Executa uma função com retry automático em caso de erros de rede
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { retries = 3, delay = 1000, onRetry } = options
  let lastError: any

  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      
      // Só retry em erros de rede/timeout
      const isNetworkError = 
        error?.code === 'UND_ERR_SOCKET' ||
        error?.code === 'ECONNRESET' ||
        error?.code === 'ETIMEDOUT' ||
        error?.message?.includes('fetch failed') ||
        error?.message?.includes('network') ||
        error?.message?.includes('timeout') ||
        error?.name === 'AuthRetryableFetchError' ||
        error?.name === 'FetchError'

      if (isNetworkError && i < retries - 1) {
        const waitTime = delay * (i + 1)
        logger.warn(`[RETRY] Tentativa ${i + 1}/${retries} falhou, aguardando ${waitTime}ms...`)
        onRetry?.(i + 1, error)
        await new Promise(r => setTimeout(r, waitTime))
        continue
      }
      
      throw error
    }
  }
  
  throw lastError
}

/**
 * Verifica se um erro é de rede/timeout (pode ser retryable)
 */
export function isNetworkError(error: any): boolean {
  return (
    error?.code === 'UND_ERR_SOCKET' ||
    error?.code === 'ECONNRESET' ||
    error?.code === 'ETIMEDOUT' ||
    error?.message?.includes('fetch failed') ||
    error?.message?.includes('network') ||
    error?.message?.includes('timeout') ||
    error?.name === 'AuthRetryableFetchError' ||
    error?.name === 'FetchError'
  )
}

export default { withRetry, isNetworkError }

/**
 * Utilitário de retry para operações que podem falhar por timeout/rede
 */

import { logger } from './logger'

interface RetryOptions {
  retries?: number
  delay?: number
  onRetry?: (attempt: number, error: any) => void
}

/**
 * Executa uma função com retry automático em caso de erros de rede
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { retries = 3, delay = 1000, onRetry } = options
  let lastError: any

  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      
      // Só retry em erros de rede/timeout
      const isNetworkError = 
        error?.code === 'UND_ERR_SOCKET' ||
        error?.code === 'ECONNRESET' ||
        error?.code === 'ETIMEDOUT' ||
        error?.message?.includes('fetch failed') ||
        error?.message?.includes('network') ||
        error?.message?.includes('timeout') ||
        error?.name === 'AuthRetryableFetchError' ||
        error?.name === 'FetchError'

      if (isNetworkError && i < retries - 1) {
        const waitTime = delay * (i + 1)
        logger.warn(`[RETRY] Tentativa ${i + 1}/${retries} falhou, aguardando ${waitTime}ms...`)
        onRetry?.(i + 1, error)
        await new Promise(r => setTimeout(r, waitTime))
        continue
      }
      
      throw error
    }
  }
  
  throw lastError
}

/**
 * Verifica se um erro é de rede/timeout (pode ser retryable)
 */
export function isNetworkError(error: any): boolean {
  return (
    error?.code === 'UND_ERR_SOCKET' ||
    error?.code === 'ECONNRESET' ||
    error?.code === 'ETIMEDOUT' ||
    error?.message?.includes('fetch failed') ||
    error?.message?.includes('network') ||
    error?.message?.includes('timeout') ||
    error?.name === 'AuthRetryableFetchError' ||
    error?.name === 'FetchError'
  )
}

export default { withRetry, isNetworkError }

