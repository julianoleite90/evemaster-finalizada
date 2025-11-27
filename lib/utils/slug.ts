/**
 * Gera um slug amigável a partir de um texto
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Substituir acentos
    .replace(/[áàâãä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôõö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    // Remover caracteres especiais
    .replace(/[^a-z0-9\s-]/g, '')
    // Substituir espaços por hífens
    .replace(/\s+/g, '-')
    // Remover hífens múltiplos
    .replace(/-+/g, '-')
    // Remover hífens do início e fim
    .replace(/^-+|-+$/g, '')
}

/**
 * Gera um slug único adicionando um sufixo baseado no ID
 */
export function generateUniqueSlug(text: string, id: string): string {
  const baseSlug = generateSlug(text)
  const shortId = id.substring(0, 8)
  return `${baseSlug}-${shortId}`
}

/**
 * Extrai o ID de um slug que contém ID no final
 */
export function extractIdFromSlug(slug: string): string | null {
  const parts = slug.split('-')
  const lastPart = parts[parts.length - 1]
  
  // Verificar se a última parte parece um ID (8+ caracteres alfanuméricos)
  if (lastPart && lastPart.length >= 8 && /^[a-f0-9]+$/i.test(lastPart)) {
    return lastPart
  }
  
  return null
}
