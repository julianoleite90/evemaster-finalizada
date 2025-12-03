/**
 * Utilitário para sanitização de HTML
 * Previne ataques XSS ao renderizar conteúdo HTML dinâmico
 * 
 * Nota: Usamos uma abordagem híbrida para evitar problemas com jsdom/parse5 na Vercel
 */

// Lista de tags permitidas
const ALLOWED_TAGS_BASIC = ['b', 'i', 'em', 'strong', 'u', 'br']
const ALLOWED_TAGS_FULL = [
  'p', 'br', 'b', 'i', 'em', 'strong', 'u', 's', 'strike',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'a', 'span', 'div',
  'blockquote', 'pre', 'code',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'img'
]
const ALLOWED_ATTRS = ['href', 'target', 'rel', 'class', 'id', 'src', 'alt', 'width', 'height']
const FORBIDDEN_PATTERNS = [
  /javascript:/gi,
  /vbscript:/gi,
  /data:/gi,
  /on\w+=/gi, // onclick, onerror, onload, etc.
]

/**
 * Remove tags e atributos perigosos de forma simples
 * Funciona tanto no cliente quanto no servidor sem dependências externas
 */
function simpleSanitize(html: string, allowedTags: string[]): string {
  if (!html) return ''
  
  let result = html
  
  // Remover scripts e iframes completamente
  result = result.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  result = result.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
  result = result.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
  result = result.replace(/<embed\b[^>]*>/gi, '')
  result = result.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
  
  // Remover padrões perigosos de atributos
  for (const pattern of FORBIDDEN_PATTERNS) {
    result = result.replace(pattern, '')
  }
  
  // Se não há tags permitidas, remover todas
  if (allowedTags.length === 0) {
    return result.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  }
  
  // Criar regex para tags não permitidas
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/gi
  result = result.replace(tagRegex, (match, tagName) => {
    if (allowedTags.includes(tagName.toLowerCase())) {
      // Limpar atributos perigosos da tag permitida
      return match.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
                  .replace(/\s+javascript:[^"'\s]*/gi, '')
    }
    return '' // Remove tags não permitidas
  })
  
  return result
}

/**
 * Sanitiza HTML para exibição segura
 * @param dirty - HTML potencialmente perigoso
 * @param strict - Se true, permite apenas formatação básica
 * @returns HTML sanitizado
 */
export function sanitizeHTML(dirty: string | null | undefined, strict = false): string {
  if (!dirty) return ''
  
  const allowedTags = strict ? ALLOWED_TAGS_BASIC : ALLOWED_TAGS_FULL
  return simpleSanitize(dirty, allowedTags)
}

/**
 * Remove todas as tags HTML, mantendo apenas texto
 * @param html - String com HTML
 * @returns Texto puro sem HTML
 */
export function stripHTML(html: string | null | undefined): string {
  if (!html) return ''
  return simpleSanitize(html, [])
}

/**
 * Sanitiza URL para prevenir javascript: URLs
 * @param url - URL para sanitizar
 * @returns URL segura ou string vazia
 */
export function sanitizeURL(url: string | null | undefined): string {
  if (!url) return ""
  
  const trimmed = url.trim().toLowerCase()
  
  // Bloqueia protocolos perigosos
  if (
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("vbscript:")
  ) {
    return ""
  }
  
  return url
}

/**
 * Escapa caracteres especiais para uso seguro em atributos HTML
 * @param str - String para escapar
 * @returns String com caracteres especiais escapados
 */
export function escapeHTMLAttr(str: string | null | undefined): string {
  if (!str) return ""
  
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

export default {
  sanitizeHTML,
  stripHTML,
  sanitizeURL,
  escapeHTMLAttr,
}
