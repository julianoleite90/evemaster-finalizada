/**
 * Error Logger Utility
 * 
 * This utility provides functions to log errors to the database
 * with full context and automatic error code resolution.
 * Also sends email notifications for each error.
 */

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { enviarEmailErro } from '@/lib/email/resend'

// Error types for categorization
export type ErrorType = 
  | 'database'
  | 'api'
  | 'auth'
  | 'payment'
  | 'registration'
  | 'email'
  | 'validation'
  | 'file_upload'
  | 'external_api'
  | 'unknown'

// Error severity levels
export type ErrorSeverity = 'debug' | 'info' | 'warning' | 'error' | 'critical'

// Interface for error context
export interface ErrorContext {
  errorType?: ErrorType
  errorSeverity?: ErrorSeverity
  userId?: string
  userEmail?: string
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  requestMethod?: string
  requestPath?: string
  requestBody?: Record<string, any>
  schemaName?: string
  tableName?: string
  columnName?: string
  constraintName?: string
  queryText?: string
  queryParams?: Record<string, any>
  stackTrace?: string
  metadata?: Record<string, any>
}

// Common PostgreSQL error codes with human-readable titles
const ERROR_CODE_TITLES: Record<string, string> = {
  '23000': 'Constraint Violation',
  '23001': 'Restrict Violation',
  '23502': 'NOT NULL Violation - Required Field Missing',
  '23503': 'Foreign Key Violation - Referenced Record Not Found',
  '23505': 'Unique Violation - Duplicate Entry',
  '23514': 'Check Constraint Violation',
  '22001': 'String Too Long',
  '22003': 'Numeric Value Out of Range',
  '22007': 'Invalid Date/Time Format',
  '22012': 'Division by Zero',
  '22P02': 'Invalid Data Type',
  '42501': 'Permission Denied',
  '42601': 'SQL Syntax Error',
  '42703': 'Column Does Not Exist',
  '42704': 'Object Does Not Exist',
  '42710': 'Object Already Exists',
  '42P01': 'Table Does Not Exist',
  '42P07': 'Table Already Exists',
  '28000': 'Authentication Failed',
  '28P01': 'Invalid Password',
  '40001': 'Serialization Failure',
  '40P01': 'Deadlock Detected',
  '53000': 'Insufficient Resources',
  '53200': 'Out of Memory',
  '53300': 'Too Many Connections',
  '57014': 'Query Cancelled / Timeout',
  'P0001': 'Custom Error (Raise Exception)',
  'PGRST116': 'Record Not Found (Single)',
  'PGRST204': 'Column Not Found in Schema Cache',
}

/**
 * Extract error code from Supabase/PostgreSQL error
 */
function extractErrorCode(error: any): string | null {
  if (error?.code) return error.code
  if (error?.error?.code) return error.error.code
  if (typeof error === 'string' && error.match(/^\d{5}$/)) return error
  return null
}

/**
 * Get human-readable title for error code
 */
function getErrorTitle(code: string | null, defaultTitle: string = 'Unknown Error'): string {
  if (!code) return defaultTitle
  return ERROR_CODE_TITLES[code] || defaultTitle
}

/**
 * Sanitize request body to remove sensitive data
 */
function sanitizeRequestBody(body: any): any {
  if (!body) return null
  
  const sensitiveFields = ['password', 'senha', 'token', 'secret', 'credit_card', 'cvv', 'card_number']
  const sanitized = { ...body }
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]'
    }
  }
  
  return sanitized
}

/**
 * Log an error to the database
 * 
 * @param error - The error object or message
 * @param context - Additional context about the error
 * @returns The error log ID or null if logging failed
 */
export async function logError(
  error: any,
  context: ErrorContext = {}
): Promise<string | null> {
  try {
    // Create admin client to bypass RLS
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // Extract error information
    const errorCode = extractErrorCode(error)
    const errorMessage = error?.message || error?.error?.message || String(error)
    const errorDetail = error?.details || error?.error?.details || null
    const errorHint = error?.hint || error?.error?.hint || null

    // Build error title
    const errorTitle = getErrorTitle(errorCode, error?.name || 'Application Error')

    // Insert error log
    const { data, error: insertError } = await supabaseAdmin
      .from('error_logs')
      .insert({
        error_type: context.errorType || 'unknown',
        error_code: errorCode,
        error_severity: context.errorSeverity || 'error',
        error_title: errorTitle,
        error_message: errorMessage,
        error_detail: errorDetail,
        error_hint: errorHint,
        schema_name: context.schemaName || null,
        table_name: context.tableName || null,
        column_name: context.columnName || null,
        constraint_name: context.constraintName || null,
        query_text: context.queryText || null,
        query_params: context.queryParams || null,
        user_id: context.userId || null,
        user_email: context.userEmail || null,
        session_id: context.sessionId || null,
        ip_address: context.ipAddress || null,
        user_agent: context.userAgent || null,
        request_method: context.requestMethod || null,
        request_path: context.requestPath || null,
        request_body: sanitizeRequestBody(context.requestBody),
        stack_trace: context.stackTrace || error?.stack || null,
        metadata: context.metadata || {},
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('[ERROR LOGGER] Failed to log error:', insertError)
      // Still try to send email even if DB insert failed
    }

    // Send email notification (async, don't wait)
    enviarEmailErro({
      errorType: context.errorType || 'unknown',
      errorCode,
      errorTitle,
      errorMessage,
      errorDetail,
      errorHint,
      tableName: context.tableName,
      userEmail: context.userEmail,
      requestPath: context.requestPath,
      requestMethod: context.requestMethod,
      stackTrace: context.stackTrace || error?.stack,
      timestamp: new Date(),
      errorId: data?.id || null,
    }).catch(emailError => {
      console.error('[ERROR LOGGER] Failed to send email notification:', emailError)
    })

    return data?.id || null
  } catch (loggerError) {
    // Don't let the logger itself cause issues
    console.error('[ERROR LOGGER] Exception while logging:', loggerError)
    return null
  }
}

/**
 * Log a database error with automatic context extraction
 */
export async function logDatabaseError(
  error: any,
  tableName?: string,
  context: Partial<ErrorContext> = {}
): Promise<string | null> {
  return logError(error, {
    errorType: 'database',
    tableName,
    ...context,
  })
}

/**
 * Log an API error with request context
 */
export async function logApiError(
  error: any,
  request: Request,
  context: Partial<ErrorContext> = {}
): Promise<string | null> {
  const url = new URL(request.url)
  
  let requestBody = null
  try {
    requestBody = await request.clone().json()
  } catch {
    // Body might not be JSON
  }

  return logError(error, {
    errorType: 'api',
    requestMethod: request.method,
    requestPath: url.pathname,
    requestBody,
    userAgent: request.headers.get('user-agent') || undefined,
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    ...context,
  })
}

/**
 * Log an authentication error
 */
export async function logAuthError(
  error: any,
  userEmail?: string,
  context: Partial<ErrorContext> = {}
): Promise<string | null> {
  return logError(error, {
    errorType: 'auth',
    errorSeverity: 'warning',
    userEmail,
    ...context,
  })
}

/**
 * Log a payment error
 */
export async function logPaymentError(
  error: any,
  context: Partial<ErrorContext> = {}
): Promise<string | null> {
  return logError(error, {
    errorType: 'payment',
    errorSeverity: 'critical',
    ...context,
  })
}

/**
 * Log a registration error
 */
export async function logRegistrationError(
  error: any,
  context: Partial<ErrorContext> = {}
): Promise<string | null> {
  return logError(error, {
    errorType: 'registration',
    ...context,
  })
}


