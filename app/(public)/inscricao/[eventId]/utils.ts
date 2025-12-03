/**
 * Funções utilitárias para a página de checkout
 * Todas são funções puras - não dependem de estado externo
 */

// ===== FORMATAÇÃO DE DOCUMENTOS =====

/**
 * Formatar CPF brasileiro (000.000.000-00)
 */
export const formatCPF = (value: string): string => {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
}

/**
 * Formatar DNI argentino (00.000.000)
 */
export const formatDNI = (value: string): string => {
  const cleaned = value.replace(/\D/g, "")
  if (cleaned.length <= 2) return cleaned
  if (cleaned.length <= 5) return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`
  return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}`
}

/**
 * Formatar documento baseado no país
 */
export const formatDocumento = (value: string, pais: string): string => {
  if (pais === "brasil") {
    return formatCPF(value)
  } else if (pais === "argentina") {
    return formatDNI(value)
  }
  // Para outros países, apenas remover caracteres não numéricos e limitar tamanho
  return value.replace(/\D/g, "").slice(0, 20)
}

// ===== FORMATAÇÃO DE CONTATO =====

/**
 * Formatar telefone brasileiro ((00) 00000-0000)
 */
export const formatTelefone = (value: string): string => {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
}

/**
 * Formatar CEP brasileiro (00000-000)
 */
export const formatCEP = (value: string): string => {
  return value
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, "$1-$2")
}

/**
 * Mascarar email para exibição (julianode*******@g******)
 */
export const mascararEmail = (email: string): string => {
  if (!email) return ''
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  
  // Mostrar primeiras 7 letras do local + asteriscos
  const localMasked = local.length > 7 
    ? local.substring(0, 7) + '*'.repeat(7)
    : local.substring(0, Math.min(3, local.length)) + '*'.repeat(Math.max(3, local.length - 3))
  
  // Mostrar primeira letra do domínio + asteriscos
  const domainMasked = domain.length > 1
    ? domain.substring(0, 1) + '*'.repeat(6)
    : domain
  
  return `${localMasked}@${domainMasked}`
}

// ===== CÁLCULOS =====

interface RunningClub {
  base_discount: number
  progressive_discount_threshold?: number
  progressive_discount_value?: number
}

interface Ingresso {
  valor: number
  gratuito?: boolean
}

interface TotalCalculado {
  subtotal: number
  desconto: number
  subtotalComDesconto: number
  taxa: number
  total: number
}

/**
 * Calcular total do pedido com descontos
 */
export const calcularTotalPedido = (
  ingressos: Ingresso[],
  runningClub?: RunningClub | null
): TotalCalculado => {
  let subtotal = ingressos.reduce((sum, ing) => sum + ing.valor, 0)
  let desconto = 0
  
  // Aplicar desconto do clube de corrida se houver
  if (runningClub && runningClub.base_discount > 0) {
    // Calcular desconto base (percentual)
    const descontoBase = (subtotal * runningClub.base_discount) / 100
    desconto += descontoBase
    
    // Verificar desconto progressivo
    if (runningClub.progressive_discount_threshold && 
        runningClub.progressive_discount_value &&
        ingressos.length >= runningClub.progressive_discount_threshold) {
      const descontoProgressivo = (subtotal * runningClub.progressive_discount_value) / 100
      desconto += descontoProgressivo
    }
  }
  
  // Limitar desconto ao valor do subtotal (nunca pode ser maior que 100%)
  const descontoFinal = Math.min(desconto, subtotal)
  const subtotalComDesconto = Math.max(0, subtotal - descontoFinal)
  
  // Taxa de serviço só é cobrada se houver valor a pagar
  const taxa = subtotalComDesconto > 0 ? ingressos.length * 5 : 0
  const total = subtotalComDesconto + taxa
  
  return { 
    subtotal, 
    desconto: descontoFinal, 
    subtotalComDesconto,
    taxa, 
    total 
  }
}

/**
 * Verificar se todos os ingressos são gratuitos
 */
export const isEventoGratuito = (ingressos: Ingresso[]): boolean => {
  return ingressos.every(ing => ing.gratuito)
}

// ===== VALIDAÇÃO =====

/**
 * Validar documento por país
 */
export const validarDocumento = (documento: string, pais: string): { valido: boolean; erro?: string } => {
  const cleanDoc = documento.replace(/\D/g, '')
  
  if (pais === "brasil") {
    if (cleanDoc.length !== 11) {
      return { valido: false, erro: "CPF inválido - deve ter 11 dígitos" }
    }
  } else if (pais === "argentina") {
    if (cleanDoc.length < 7) {
      return { valido: false, erro: "DNI inválido - deve ter pelo menos 7 dígitos" }
    }
  }
  
  return { valido: true }
}

/**
 * Validar email
 */
export const validarEmail = (email: string): boolean => {
  return email.includes("@") && email.includes(".")
}

