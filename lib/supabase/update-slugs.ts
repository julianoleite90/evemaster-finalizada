import { createClient } from "@/lib/supabase/client"
import { generateSlug } from "@/lib/utils/slug"

// Função para atualizar todos os eventos sem slug
export async function updateAllEventSlugs() {
  const supabase = createClient()
  
  try {
    console.log("🔄 Iniciando atualização de slugs para todos os eventos...")
    
    // Buscar todos os eventos sem slug
    const { data: events, error } = await supabase
      .from("events")
      .select("id, name, slug")
      .is("slug", null)
    
    if (error) {
      console.error("❌ Erro ao buscar eventos:", error)
      return { success: false, error }
    }
    
    if (!events || events.length === 0) {
      console.log("✅ Todos os eventos já têm slugs")
      return { success: true, updated: 0 }
    }
    
    console.log(`📋 Encontrados ${events.length} eventos sem slug`)
    
    let updated = 0
    
    for (const event of events) {
      console.log(`🔧 Gerando slug para: ${event.name}`)
      
      const baseSlug = generateSlug(event.name)
      let finalSlug = baseSlug
      let counter = 0
      
      // Verificar se o slug já existe e gerar um único
      while (true) {
        const { data: existingEvent } = await supabase
          .from("events")
          .select("id")
          .eq("slug", finalSlug)
          .neq("id", event.id)
          .single()
        
        if (!existingEvent) {
          break // Slug é único
        }
        
        counter++
        finalSlug = `${baseSlug}-${counter}`
      }
      
      // Atualizar o evento com o slug
      const { error: updateError } = await supabase
        .from("events")
        .update({ slug: finalSlug })
        .eq("id", event.id)
      
      if (updateError) {
        console.error(`❌ Erro ao atualizar evento ${event.name}:`, updateError)
      } else {
        console.log(`✅ Slug gerado: ${finalSlug}`)
        updated++
      }
    }
    
    console.log(`🎉 Atualização concluída! ${updated} eventos atualizados`)
    return { success: true, updated }
    
  } catch (error) {
    console.error("❌ Erro geral:", error)
    return { success: false, error }
  }
}

// Função para executar via console do navegador
if (typeof window !== 'undefined') {
  (window as any).updateEventSlugs = updateAllEventSlugs
}

