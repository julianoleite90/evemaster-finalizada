/**
 * Utilitário para sanitização de HTML
 * Previne ataques XSS ao renderizar conteúdo HTML dinâmico
 */

import DOMPurify from "isomorphic-dompurify"

/**
 * Sanitiza HTML para exibição segura
 * @param dirty - HTML potencialmente perigoso
 * @param strict - Se true, permite apenas formatação básica
 * @returns HTML sanitizado
 */
export function sanitizeHTML(dirty: string | null | undefined, strict = false): string {
  if (!dirty) return ""
  
  if (strict) {
    // Configuração mais restritiva para campos de texto simples
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: ["b", "i", "em", "strong", "u", "br"],
      ALLOWED_ATTR: [],
    })
  }
  
  // Configuração padrão
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "p", "br", "b", "i", "em", "strong", "u", "s", "strike",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li",
      "a", "span", "div",
      "blockquote", "pre", "code",
      "table", "thead", "tbody", "tr", "th", "td",
      "img"
    ],
    ALLOWED_ATTR: [
      "href", "target", "rel", "class", "id", "style",
      "src", "alt", "width", "height"
    ],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ["target"],
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
  })
}

/**
 * Remove todas as tags HTML, mantendo apenas texto
 * @param html - String com HTML
 * @returns Texto puro sem HTML
 */
export function stripHTML(html: string | null | undefined): string {
  if (!html) return ""
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] })
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

