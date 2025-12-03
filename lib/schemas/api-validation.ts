/**
 * Schemas de validação Zod para APIs
 * Garante que dados de entrada estão no formato correto
 */

import { z } from "zod"
import { isValidCPF, cleanCPF } from "@/lib/utils/cpf-validator"

// === VALIDADORES CUSTOMIZADOS ===

/**
 * Schema de CPF com validação completa de dígitos verificadores
 */
const cpfSchema = z.string()
  .min(11, "CPF deve ter 11 dígitos")
  .max(14, "CPF inválido")
  .transform(val => cleanCPF(val))
  .refine(val => val.length === 11, "CPF deve ter 11 dígitos")
  .refine(val => isValidCPF(val), "CPF inválido (dígitos verificadores incorretos)")

/**
 * Schema de CPF básico (apenas formato, sem validação de dígitos)
 * Útil para quando não queremos bloquear por CPF inválido
 */
const cpfSchemaBasic = z.string()
  .min(11, "CPF deve ter 11 dígitos")
  .max(14, "CPF inválido")
  .transform(val => cleanCPF(val))

// === SCHEMAS DE AUTENTICAÇÃO ===

export const enviarOTPSchema = z.object({
  cpf: cpfSchema,
  eventId: z.string().uuid().optional(),
})

export const verificarOTPSchema = z.object({
  cpf: cpfSchema,
  otp: z.string()
    .length(6, "Código deve ter 6 dígitos")
    .regex(/^\d+$/, "Código deve conter apenas números"),
})

export const verificarCPFSchema = z.object({
  cpf: cpfSchema,
})

// === SCHEMAS DE CUPONS ===

export const criarCupomSchema = z.object({
  event_id: z.string().uuid("ID do evento inválido"),
  code: z.string()
    .min(3, "Código deve ter pelo menos 3 caracteres")
    .max(20, "Código deve ter no máximo 20 caracteres")
    .transform(val => val.toUpperCase().replace(/[^A-Z0-9]/g, "")),
  discount_percentage: z.number()
    .min(1, "Desconto deve ser pelo menos 1%")
    .max(100, "Desconto não pode exceder 100%")
    .nullable()
    .optional(),
  discount_amount: z.number()
    .min(0.01, "Valor mínimo de R$ 0,01")
    .max(10000, "Valor máximo de R$ 10.000")
    .nullable()
    .optional(),
  affiliate_id: z.string().uuid().nullable().optional(),
  max_uses: z.number()
    .int("Deve ser número inteiro")
    .min(1, "Mínimo de 1 uso")
    .max(100000, "Máximo de 100.000 usos")
    .nullable()
    .optional(),
  expires_at: z.string().datetime().nullable().optional(),
  is_active: z.boolean().default(true),
}).refine(
  data => data.discount_percentage || data.discount_amount,
  { message: "Informe desconto percentual ou valor fixo" }
)

// Schema base sem o refine para permitir .partial()
const cupomBaseSchema = z.object({
  event_id: z.string().uuid("ID do evento inválido"),
  code: z.string()
    .min(3, "Código deve ter pelo menos 3 caracteres")
    .max(20, "Código deve ter no máximo 20 caracteres")
    .transform(val => val.toUpperCase().replace(/[^A-Z0-9]/g, "")),
  discount_percentage: z.number()
    .min(1, "Desconto deve ser pelo menos 1%")
    .max(100, "Desconto não pode exceder 100%")
    .nullable()
    .optional(),
  discount_amount: z.number()
    .min(0.01, "Valor mínimo de R$ 0,01")
    .max(10000, "Valor máximo de R$ 10.000")
    .nullable()
    .optional(),
  affiliate_id: z.string().uuid().nullable().optional(),
  max_uses: z.number()
    .int("Deve ser número inteiro")
    .min(1, "Mínimo de 1 uso")
    .max(100000, "Máximo de 100.000 usos")
    .nullable()
    .optional(),
  expires_at: z.string().datetime().nullable().optional(),
  is_active: z.boolean().default(true),
})

export const atualizarCupomSchema = cupomBaseSchema.partial()

// === SCHEMAS DE AFILIADOS ===

export const convidarAfiliadoSchema = z.object({
  event_id: z.string().uuid("ID do evento inválido"),
  email: z.string().email("Email inválido"),
  commission_type: z.enum(["percentage", "fixed"], {
    errorMap: () => ({ message: "Tipo de comissão deve ser 'percentage' ou 'fixed'" })
  }),
  commission_value: z.number()
    .min(0.01, "Valor mínimo de 0,01")
    .max(100, "Valor máximo de 100"),
})

// === SCHEMAS DE EVENTOS ===

export const criarEventoSchema = z.object({
  name: z.string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(200, "Nome deve ter no máximo 200 caracteres"),
  description: z.string().max(10000, "Descrição muito longa").optional(),
  category: z.string().min(1, "Categoria é obrigatória"),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (use YYYY-MM-DD)"),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido (use HH:MM)").optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido (use HH:MM)").optional(),
  address: z.string().max(500, "Endereço muito longo").optional(),
  city: z.string().max(100, "Cidade muito longa").optional(),
  state: z.string().max(50, "Estado muito longo").optional(),
  zip_code: z.string()
    .transform(val => val.replace(/\D/g, ""))
    .optional(),
})

// === SCHEMAS DE PARTICIPANTES ===

export const salvarPerfilSchema = z.object({
  full_name: z.string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(200, "Nome muito longo"),
  email: z.string().email("Email inválido"),
  phone: z.string()
    .transform(val => val.replace(/\D/g, ""))
    .optional(),
  cpf: cpfSchemaBasic.optional(), // Usa validação básica para não bloquear checkout
  age: z.number().int().min(1).max(120).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zip_code: z.string()
    .transform(val => val.replace(/\D/g, ""))
    .optional(),
  shirt_size: z.enum(["PP", "P", "M", "G", "GG", "XG", "XXG"]).optional(),
})

// === SCHEMAS DE INSCRIÇÃO ===

export const criarInscricaoSchema = z.object({
  event_id: z.string().uuid("ID do evento inválido"),
  ticket_id: z.string().uuid("ID do ingresso inválido"),
  participant: salvarPerfilSchema,
  payment_method: z.enum(["pix", "credit_card", "boleto"]).optional(),
  coupon_code: z.string().max(20).optional(),
})

// === UTILITÁRIOS ===

/**
 * Valida dados contra um schema e retorna resultado tipado
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}

/**
 * Formata erros do Zod para resposta de API
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const issue of error.issues) {
    const path = issue.path.join(".")
    errors[path || "root"] = issue.message
  }
  return errors
}

export default {
  // Auth
  enviarOTPSchema,
  verificarOTPSchema,
  verificarCPFSchema,
  // Cupons
  criarCupomSchema,
  atualizarCupomSchema,
  // Afiliados
  convidarAfiliadoSchema,
  // Eventos
  criarEventoSchema,
  // Participantes
  salvarPerfilSchema,
  criarInscricaoSchema,
  // Utils
  validateRequest,
  formatZodErrors,
}

