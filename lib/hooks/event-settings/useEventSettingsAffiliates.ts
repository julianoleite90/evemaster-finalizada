import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface Affiliate {
  id: string
  email: string
  commission_type: "percentage" | "fixed"
  commission_value: number
  status: string
  created_at: string
}

interface NewAffiliate {
  email: string
  commission_type: "percentage" | "fixed"
  commission_value: string
}

export function useEventSettingsAffiliates(eventId: string, organizerId: string | null) {
  const [affiliates, setAffiliates] = useState<any[]>([])
  const [acceptedAffiliates, setAcceptedAffiliates] = useState<any[]>([])
  const [showAddAffiliate, setShowAddAffiliate] = useState(false)
  const [editingAffiliate, setEditingAffiliate] = useState<any | null>(null)
  const [newAffiliate, setNewAffiliate] = useState<NewAffiliate>({
    email: "",
    commission_type: "percentage",
    commission_value: "",
  })

  const fetchAffiliates = async () => {
    if (!organizerId) return
    
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("event_affiliate_invites")
        .select(`
          *,
          affiliate:affiliates(
            id,
            user:users(id, email, full_name)
          )
        `)
        .eq("event_id", eventId)
        .eq("organizer_id", organizerId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setAffiliates(data || [])
    } catch (error: any) {
      console.error("Erro ao buscar afiliados:", error)
    }
  }

  const fetchAcceptedAffiliates = async () => {
    if (!organizerId) return
    
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("event_affiliate_commission")
        .select(`
          *,
          affiliate:affiliates(
            id,
            name,
            user:users(email)
          )
        `)
        .eq("event_id", eventId)

      if (error) throw error
      setAcceptedAffiliates(data || [])
    } catch (error: any) {
      console.error("Erro ao buscar afiliados aceitos:", error)
    }
  }

  const addAffiliate = async () => {
    if (!organizerId) return
    
    try {
      const supabase = createClient()
      
      // Buscar usuário por email
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("email", newAffiliate.email)
        .maybeSingle()

      if (!userData) {
        toast.error("Usuário não encontrado com este email")
        return
      }

      // Buscar ou criar afiliado
      let { data: affiliateData } = await supabase
        .from("affiliates")
        .select("id")
        .eq("user_id", userData.id)
        .maybeSingle()

      if (!affiliateData) {
        const { data: newAffiliateData, error: affiliateError } = await supabase
          .from("affiliates")
          .insert({
            user_id: userData.id,
            name: newAffiliate.email.split("@")[0]
          })
          .select()
          .single()

        if (affiliateError) throw affiliateError
        affiliateData = newAffiliateData
      }

      // Criar convite
      const { error: inviteError } = await supabase
        .from("event_affiliate_invites")
        .insert({
          event_id: eventId,
          organizer_id: organizerId,
          affiliate_id: affiliateData.id,
          status: "pending"
        })

      if (inviteError) throw inviteError

      toast.success("Afiliado convidado com sucesso!")
      setShowAddAffiliate(false)
      setNewAffiliate({ email: "", commission_type: "percentage", commission_value: "" })
      fetchAffiliates()
    } catch (error: any) {
      console.error("Erro ao adicionar afiliado:", error)
      toast.error("Erro ao convidar afiliado")
    }
  }

  const removeAffiliate = async (inviteId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("event_affiliate_invites")
        .delete()
        .eq("id", inviteId)

      if (error) throw error

      toast.success("Afiliado removido com sucesso!")
      fetchAffiliates()
    } catch (error: any) {
      console.error("Erro ao remover afiliado:", error)
      toast.error("Erro ao remover afiliado")
    }
  }

  return {
    affiliates,
    acceptedAffiliates,
    showAddAffiliate,
    setShowAddAffiliate,
    editingAffiliate,
    setEditingAffiliate,
    newAffiliate,
    setNewAffiliate,
    fetchAffiliates,
    fetchAcceptedAffiliates,
    addAffiliate,
    removeAffiliate,
  }
}

