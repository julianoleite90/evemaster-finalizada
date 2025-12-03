/**
 * Utilitário para validação de CPF brasileiro
 * Implementa validação completa com dígitos verificadores
 */

/**
 * Remove caracteres não numéricos do CPF
 */
export function cleanCPF(cpf: string | null | undefined): string {
  if (!cpf) return ""
  return cpf.replace(/\D/g, "")
}

/**
 * Formata CPF para exibição (XXX.XXX.XXX-XX)
 */
export function formatCPF(cpf: string): string {
  const cleaned = cleanCPF(cpf)
  if (cleaned.length !== 11) return cpf
  
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
}

/**
 * Valida se o CPF é válido (estrutura e dígitos verificadores)
 * @param cpf - CPF a ser validado (com ou sem formatação)
 * @returns true se válido, false caso contrário
 */
export function isValidCPF(cpf: string | null | undefined): boolean {
  if (!cpf) return false
  
  // Remover caracteres não numéricos
  const cleaned = cleanCPF(cpf)
  
  // Verificar se tem 11 dígitos
  if (cleaned.length !== 11) return false
  
  // Verificar se todos os dígitos são iguais (CPFs inválidos conhecidos)
  // Ex: 111.111.111-11, 222.222.222-22, etc.
  if (/^(\d)\1+$/.test(cleaned)) return false
  
  // Calcular primeiro dígito verificador
  let soma = 0
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cleaned[i]) * (10 - i)
  }
  let resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(cleaned[9])) return false
  
  // Calcular segundo dígito verificador
  soma = 0
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cleaned[i]) * (11 - i)
  }
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(cleaned[10])) return false
  
  return true
}

/**
 * Mascara CPF para exibição parcial (XXX.***.**X-XX)
 * Útil para exibir em logs ou confirmações
 */
export function maskCPF(cpf: string | null | undefined): string {
  if (!cpf) return ""
  
  const cleaned = cleanCPF(cpf)
  if (cleaned.length !== 11) return cpf
  
  return `${cleaned.substring(0, 3)}.***.**${cleaned.substring(7, 8)}-${cleaned.substring(9)}`
}

/**
 * Gera um CPF válido para testes
 * ATENÇÃO: Use apenas para testes, nunca em produção!
 */
export function generateTestCPF(): string {
  // Gerar 9 dígitos aleatórios
  const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10))
  
  // Calcular primeiro dígito verificador
  let soma = digits.reduce((acc, digit, i) => acc + digit * (10 - i), 0)
  let resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  digits.push(resto)
  
  // Calcular segundo dígito verificador
  soma = digits.reduce((acc, digit, i) => acc + digit * (11 - i), 0)
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  digits.push(resto)
  
  return digits.join("")
}

/**
 * Valida CPF e retorna resultado detalhado
 */
export function validateCPF(cpf: string | null | undefined): {
  valid: boolean
  cleaned: string
  formatted: string
  error?: string
} {
  if (!cpf) {
    return {
      valid: false,
      cleaned: "",
      formatted: "",
      error: "CPF não fornecido",
    }
  }
  
  const cleaned = cleanCPF(cpf)
  
  if (cleaned.length === 0) {
    return {
      valid: false,
      cleaned: "",
      formatted: "",
      error: "CPF não fornecido",
    }
  }
  
  if (cleaned.length !== 11) {
    return {
      valid: false,
      cleaned,
      formatted: cpf,
      error: `CPF deve ter 11 dígitos (tem ${cleaned.length})`,
    }
  }
  
  if (/^(\d)\1+$/.test(cleaned)) {
    return {
      valid: false,
      cleaned,
      formatted: formatCPF(cleaned),
      error: "CPF inválido (dígitos repetidos)",
    }
  }
  
  if (!isValidCPF(cleaned)) {
    return {
      valid: false,
      cleaned,
      formatted: formatCPF(cleaned),
      error: "CPF inválido (dígitos verificadores incorretos)",
    }
  }
  
  return {
    valid: true,
    cleaned,
    formatted: formatCPF(cleaned),
  }
}

export default {
  cleanCPF,
  formatCPF,
  isValidCPF,
  maskCPF,
  validateCPF,
  generateTestCPF,
}

