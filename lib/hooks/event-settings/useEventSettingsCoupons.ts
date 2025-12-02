import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface NewCoupon {
  code: string
  discount_type: "percentage" | "fixed"
  discount_value: string
  affiliate_id: string | ""
  max_uses: string
  expires_at: string
  is_active: boolean
}

export function useEventSettingsCoupons(eventId: string) {
  const [coupons, setCoupons] = useState<any[]>([])
  const [showAddCoupon, setShowAddCoupon] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null)
  const [newCoupon, setNewCoupon] = useState<NewCoupon>({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    affiliate_id: "",
    max_uses: "",
    expires_at: "",
    is_active: true,
  })

  const fetchCoupons = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("affiliate_coupons")
        .select(`
          *,
          affiliate:affiliates(
            id,
            name,
            user:users(email)
          )
        `)
        .eq("event_id", eventId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setCoupons(data || [])
    } catch (error: any) {
      console.error("Erro ao buscar cupons:", error)
    }
  }

  const addCoupon = async () => {
    try {
      const supabase = createClient()
      
      const couponData: any = {
        event_id: eventId,
        code: newCoupon.code.toUpperCase(),
        discount_type: newCoupon.discount_type,
        discount_value: parseFloat(newCoupon.discount_value),
        is_active: newCoupon.is_active,
      }

      if (newCoupon.affiliate_id) {
        couponData.affiliate_id = newCoupon.affiliate_id
      }

      if (newCoupon.max_uses) {
        couponData.max_uses = parseInt(newCoupon.max_uses)
      }

      if (newCoupon.expires_at) {
        couponData.expires_at = newCoupon.expires_at
      }

      const { error } = await supabase
        .from("affiliate_coupons")
        .insert(couponData)

      if (error) throw error

      toast.success("Cupom criado com sucesso!")
      setShowAddCoupon(false)
      setNewCoupon({
        code: "",
        discount_type: "percentage",
        discount_value: "",
        affiliate_id: "",
        max_uses: "",
        expires_at: "",
        is_active: true,
      })
      fetchCoupons()
    } catch (error: any) {
      console.error("Erro ao criar cupom:", error)
      toast.error("Erro ao criar cupom")
    }
  }

  const updateCoupon = async (couponId: string, updates: Partial<NewCoupon>) => {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from("affiliate_coupons")
        .update(updates)
        .eq("id", couponId)

      if (error) throw error

      toast.success("Cupom atualizado com sucesso!")
      setEditingCoupon(null)
      fetchCoupons()
    } catch (error: any) {
      console.error("Erro ao atualizar cupom:", error)
      toast.error("Erro ao atualizar cupom")
    }
  }

  const deleteCoupon = async (couponId: string) => {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from("affiliate_coupons")
        .delete()
        .eq("id", couponId)

      if (error) throw error

      toast.success("Cupom deletado com sucesso!")
      fetchCoupons()
    } catch (error: any) {
      console.error("Erro ao deletar cupom:", error)
      toast.error("Erro ao deletar cupom")
    }
  }

  return {
    coupons,
    showAddCoupon,
    setShowAddCoupon,
    editingCoupon,
    setEditingCoupon,
    newCoupon,
    setNewCoupon,
    fetchCoupons,
    addCoupon,
    updateCoupon,
    deleteCoupon,
  }
}

