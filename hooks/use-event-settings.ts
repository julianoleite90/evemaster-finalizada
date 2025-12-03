"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { parallelQueries, safeQuery } from "@/lib/supabase/query-safe"
import { EventBasicFormData, PixelsFormData, CouponFormData, AffiliateFormData } from "@/lib/schemas/event-settings"
import { uploadEventBanner, uploadEventImage } from "@/lib/supabase/storage"

interface ViewStats {
  totalViews: number
  viewsToday: number
  viewsLast7Days: number
  viewsLast30Days: number
  conversions: number
  conversionRate: number
}

interface ReportData {
  registrationsOverTime: Array<{ date: string; count: number; views: number }>
  revenueOverTime: Array<{ date: string; amount: number }>
  ticketsByCategory: Array<{ name: string; value: number; percent: number }>
  topCoupons: Array<{ code: string; uses: number; discount: number; revenue: number }>
  financialMetrics: {
    totalRevenue: number
    totalDiscounts: number
    netRevenue: number
    averageTicket: number
    estimatedRevenue: number
  }
  affiliatePerformance: Array<{ name: string; sales: number; commission: number; revenue: number }>
  byGender: Array<{ name: string; value: number; percent: number }>
  byAge: Array<{ name: string; value: number; percent: number }>
  byShirtSize: Array<{ name: string; value: number; percent: number }>
  loading: boolean
}

const defaultReportData: ReportData = {
  registrationsOverTime: [],
  revenueOverTime: [],
  ticketsByCategory: [],
  topCoupons: [],
  financialMetrics: {
    totalRevenue: 0,
    totalDiscounts: 0,
    netRevenue: 0,
    averageTicket: 0,
    estimatedRevenue: 0
  },
  affiliatePerformance: [],
  byGender: [],
  byAge: [],
  byShirtSize: [],
  loading: false
}

export function useEventSettings(eventId: string) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Event Data
  const [eventData, setEventData] = useState<EventBasicFormData | null>(null)
  const [batches, setBatches] = useState<any[]>([])
  const [pixels, setPixels] = useState<PixelsFormData>({
    google_analytics_id: "",
    google_tag_manager_id: "",
    facebook_pixel_id: "",
  })
  
  // Banner
  const [newBanner, setNewBanner] = useState<File | null>(null)
  
  // Images
  const [eventImages, setEventImages] = useState<Array<{ id: string; image_url: string; image_order: number }>>([])
  const [newImages, setNewImages] = useState<File[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  
  // Affiliates
  const [affiliates, setAffiliates] = useState<any[]>([])
  const [acceptedAffiliates, setAcceptedAffiliates] = useState<any[]>([])
  const [organizerId, setOrganizerId] = useState<string | null>(null)
  
  // Coupons
  const [coupons, setCoupons] = useState<any[]>([])
  
  // Stats
  const [viewStats, setViewStats] = useState<ViewStats>({
    totalViews: 0,
    viewsToday: 0,
    viewsLast7Days: 0,
    viewsLast30Days: 0,
    conversions: 0,
    conversionRate: 0,
  })
  
  const [reportData, setReportData] = useState<ReportData>(defaultReportData)

  // Fetch view stats
  const fetchViewStats = useCallback(async () => {
    if (!eventId) return
    
    try {
      const supabase = createClient()
      
      const getStartOfDayUTC = (date: Date) => {
        const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
        return localDate.toISOString()
      }
      
      const agora = new Date()
      const inicioHojeUTC = getStartOfDayUTC(agora)
      const hojeFim = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 23, 59, 59, 999)
      const fimHojeUTC = hojeFim.toISOString()
      
      const seteDiasAtras = new Date(agora)
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)
      const seteDiasAtrasUTC = getStartOfDayUTC(seteDiasAtras)
      
      const trintaDiasAtras = new Date(agora)
      trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30)
      const trintaDiasAtrasUTC = getStartOfDayUTC(trintaDiasAtras)

      const { data: viewsData } = await parallelQueries({
        viewsToday: async () => await supabase
          .from("event_views")
          .select("*", { count: "exact", head: true })
          .eq("event_id", eventId)
          .gte("viewed_at", inicioHojeUTC)
          .lt("viewed_at", fimHojeUTC),
        viewsLast7Days: async () => await supabase
          .from("event_views")
          .select("*", { count: "exact", head: true })
          .eq("event_id", eventId)
          .gte("viewed_at", seteDiasAtrasUTC),
        viewsLast30Days: async () => await supabase
          .from("event_views")
          .select("*", { count: "exact", head: true })
          .eq("event_id", eventId)
          .gte("viewed_at", trintaDiasAtrasUTC),
        totalViews: async () => await supabase
          .from("event_views")
          .select("*", { count: "exact", head: true })
          .eq("event_id", eventId),
        registrations: async () => await supabase
          .from("registrations")
          .select("id", { count: "exact", head: true })
          .eq("event_id", eventId)
      }, { timeout: 10000, retries: 1 })

      const viewsTodayCount = (viewsData.viewsToday as any)?.count || 0
      const viewsLast7DaysCount = (viewsData.viewsLast7Days as any)?.count || 0
      const viewsLast30DaysCount = (viewsData.viewsLast30Days as any)?.count || 0
      const totalViewsCount = (viewsData.totalViews as any)?.count || 0
      const conversionsCount = (viewsData.registrations as any)?.count || 0
      const conversionRateValue = viewsLast30DaysCount > 0 
        ? ((conversionsCount / viewsLast30DaysCount) * 100)
        : 0

      setViewStats({
        totalViews: totalViewsCount,
        viewsToday: viewsTodayCount,
        viewsLast7Days: viewsLast7DaysCount,
        viewsLast30Days: viewsLast30DaysCount,
        conversions: conversionsCount,
        conversionRate: Number(conversionRateValue.toFixed(2))
      })
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error)
    }
  }, [eventId])

  // Fetch report data
  const fetchReportData = useCallback(async () => {
    if (!eventId) return
    
    setReportData(prev => ({ ...prev, loading: true }))
    try {
      const supabase = createClient()
      
      const registrationsResult = await safeQuery(
        async () => await supabase
          .from("registrations")
          .select(`id, created_at, ticket_id, shirt_size`)
          .eq("event_id", eventId)
          .order("created_at", { ascending: true })
          .limit(1000),
        { timeout: 20000, retries: 2 }
      )

      if (registrationsResult.error) {
        setReportData(prev => ({ ...prev, loading: false }))
        return
      }

      const registrationsData: any = registrationsResult.data
      const registrations = Array.isArray(registrationsData) 
        ? registrationsData 
        : (registrationsData?.data || [])

      if (!registrations || registrations.length === 0) {
        setReportData(prev => ({ ...prev, loading: false }))
        return
      }

      const registrationIds = registrations.map((r: any) => r.id)
      const ticketIds = registrations.map((r: any) => r.ticket_id).filter(Boolean)

      const { data: relatedData } = await parallelQueries({
        tickets: ticketIds.length > 0 
          ? async () => await supabase
              .from("tickets")
              .select("id, category, price")
              .in("id", ticketIds)
              .limit(1000)
          : async () => Promise.resolve({ data: [], error: null }),
        payments: registrationIds.length > 0 
          ? async () => await supabase
              .from("payments")
              .select("registration_id, total_amount, payment_status, affiliate_id")
              .in("registration_id", registrationIds)
              .limit(1000)
          : async () => Promise.resolve({ data: [], error: null }),
        athletes: registrationIds.length > 0 
          ? async () => await supabase
              .from("athletes")
              .select("registration_id, gender, birth_date, age")
              .in("registration_id", registrationIds)
              .limit(1000)
          : async () => Promise.resolve({ data: [], error: null }),
        views: async () => await supabase
          .from("event_views")
          .select("viewed_at")
          .eq("event_id", eventId)
          .limit(5000)
      }, { timeout: 15000, retries: 1 })

      const extractArray = (val: any) => Array.isArray(val) ? val : (val?.data || [])
      
      const ticketsData = extractArray(relatedData.tickets)
      const paymentsData = extractArray(relatedData.payments)
      const athletesData = extractArray(relatedData.athletes)
      const viewsDataArray = extractArray(relatedData.views)

      const ticketsMap: Map<string, any> = new Map(ticketsData.map((t: any) => [t.id, t]))
      const paymentsMap: Map<string, any> = new Map(paymentsData.map((p: any) => [p.registration_id, p]))
      const athletesMap: Map<string, any> = new Map(athletesData.map((a: any) => [a.registration_id, a]))

      const registrationsByDate = new Map<string, number>()
      const viewsByDate = new Map<string, number>()
      const revenueByDate = new Map<string, number>()
      const categoryMap = new Map<string, number>()
      const genderMap = new Map<string, number>()
      const ageMap = new Map<string, number>()
      const shirtSizeMap = new Map<string, number>()
      let totalRevenue = 0
      let totalDiscounts = 0
      let paidCount = 0

      registrations.forEach((reg: any) => {
        const regDate = new Date(reg.created_at)
        const date = `${regDate.getFullYear()}-${String(regDate.getMonth() + 1).padStart(2, '0')}-${String(regDate.getDate()).padStart(2, '0')}`
        registrationsByDate.set(date, (registrationsByDate.get(date) || 0) + 1)

        const ticket = reg.ticket_id ? ticketsMap.get(reg.ticket_id) : null
        if (ticket?.category) {
          categoryMap.set(ticket.category, (categoryMap.get(ticket.category) || 0) + 1)
        } else {
          categoryMap.set("Sem categoria", (categoryMap.get("Sem categoria") || 0) + 1)
        }

        const payment = paymentsMap.get(reg.id)
        if (payment && payment.payment_status === 'paid') {
          paidCount++
          const amount = parseFloat(payment.total_amount) || 0
          totalRevenue += amount
          revenueByDate.set(date, (revenueByDate.get(date) || 0) + amount)
        }

        const athlete = athletesMap.get(reg.id)
        if (athlete?.gender) {
          const genderValue = athlete.gender.toString().trim()
          let genderLabel = genderValue
          if (genderValue === 'M' || genderValue.toLowerCase() === 'masculino') genderLabel = 'Masculino'
          else if (genderValue === 'F' || genderValue.toLowerCase() === 'feminino') genderLabel = 'Feminino'
          genderMap.set(genderLabel, (genderMap.get(genderLabel) || 0) + 1)
        }

        if (athlete) {
          let age: number | null = null
          if (athlete.age && athlete.age > 0 && athlete.age <= 120) {
            age = athlete.age
          } else if (athlete.birth_date) {
            try {
              const birthDate = new Date(athlete.birth_date)
              if (!isNaN(birthDate.getTime())) {
                const today = new Date()
                age = today.getFullYear() - birthDate.getFullYear()
                const monthDiff = today.getMonth() - birthDate.getMonth()
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                  age--
                }
              }
            } catch {}
          }

          if (age !== null && age >= 0 && age <= 120) {
            let faixaEtaria = ''
            if (age < 18) faixaEtaria = 'Menor de 18'
            else if (age < 25) faixaEtaria = '18-24'
            else if (age < 35) faixaEtaria = '25-34'
            else if (age < 45) faixaEtaria = '35-44'
            else if (age < 55) faixaEtaria = '45-54'
            else if (age < 65) faixaEtaria = '55-64'
            else faixaEtaria = '65+'
            ageMap.set(faixaEtaria, (ageMap.get(faixaEtaria) || 0) + 1)
          }
        }

        if (reg.shirt_size) {
          const shirtSizeStr = reg.shirt_size.toString().trim().toUpperCase()
          if (shirtSizeStr) {
            shirtSizeMap.set(shirtSizeStr, (shirtSizeMap.get(shirtSizeStr) || 0) + 1)
          }
        }
      })

      // Process views
      viewsDataArray.forEach((view: any) => {
        const viewDate = new Date(view.viewed_at)
        const date = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(viewDate.getDate()).padStart(2, '0')}`
        viewsByDate.set(date, (viewsByDate.get(date) || 0) + 1)
      })

      const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00')
        const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
      }

      const allDates = new Set([...Array.from(registrationsByDate.keys()), ...Array.from(viewsByDate.keys())])
      const registrationsOverTime = Array.from(allDates)
        .map((date) => ({
          date: formatDate(date),
          count: registrationsByDate.get(date) || 0,
          views: viewsByDate.get(date) || 0,
          originalDate: date
        }))
        .sort((a, b) => a.originalDate.localeCompare(b.originalDate))

      const revenueOverTime = Array.from(revenueByDate.entries())
        .map(([date, amount]) => ({ date: formatDate(date), amount, originalDate: date }))
        .sort((a, b) => a.originalDate.localeCompare(b.originalDate))

      const totalWithCategory = Array.from(categoryMap.values()).reduce((a, b) => a + b, 0)
      const ticketsByCategory = Array.from(categoryMap.entries())
        .map(([name, value]) => ({
          name,
          value,
          percent: totalWithCategory > 0 ? (value / totalWithCategory) * 100 : 0
        }))
        .sort((a, b) => b.value - a.value)

      const totalWithGender = Array.from(genderMap.values()).reduce((a, b) => a + b, 0)
      const byGender = Array.from(genderMap.entries())
        .map(([name, value]) => ({
          name,
          value,
          percent: totalWithGender > 0 ? (value / totalWithGender) * 100 : 0
        }))
        .sort((a, b) => b.value - a.value)

      const totalWithAge = Array.from(ageMap.values()).reduce((a, b) => a + b, 0)
      const ageOrder = ['Menor de 18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+']
      const byAge = Array.from(ageMap.entries())
        .map(([name, value]) => ({
          name,
          value,
          percent: totalWithAge > 0 ? (value / totalWithAge) * 100 : 0
        }))
        .sort((a, b) => ageOrder.indexOf(a.name) - ageOrder.indexOf(b.name))

      const totalWithShirtSize = Array.from(shirtSizeMap.values()).reduce((a, b) => a + b, 0)
      const shirtOrder = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG']
      const byShirtSize = Array.from(shirtSizeMap.entries())
        .map(([name, value]) => ({
          name,
          value,
          percent: totalWithShirtSize > 0 ? (value / totalWithShirtSize) * 100 : 0
        }))
        .sort((a, b) => shirtOrder.indexOf(a.name) - shirtOrder.indexOf(b.name))

      setReportData({
        registrationsOverTime,
        revenueOverTime,
        ticketsByCategory,
        topCoupons: [],
        financialMetrics: {
          totalRevenue,
          totalDiscounts,
          netRevenue: totalRevenue - totalDiscounts,
          averageTicket: paidCount > 0 ? totalRevenue / paidCount : 0,
          estimatedRevenue: 0
        },
        affiliatePerformance: [],
        byGender,
        byAge,
        byShirtSize,
        loading: false
      })
    } catch (error) {
      console.error("Erro ao buscar dados de relatórios:", error)
      setReportData(prev => ({ ...prev, loading: false }))
    }
  }, [eventId])

  // Fetch event data
  const fetchEvent = useCallback(async () => {
    if (!eventId) return
    
    setLoading(true)
    try {
      const supabase = createClient()
      
      const { data: event, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single()
      
      if (error) throw error
      
      setEventData({
        name: event.name || "",
        description: event.description || "",
        category: event.category || "",
        language: event.language || "pt",
        event_date: event.event_date?.split("T")[0] || "",
        start_time: event.start_time || "",
        end_time: event.end_time || "",
        location: event.location || "",
        address: event.address || "",
        address_number: event.address_number || "",
        city: event.city || "",
        state: event.state || "",
        zip_code: event.zip_code || "",
        banner_url: event.banner_url || "",
        status: event.status || "draft",
        difficulty_level: event.difficulty_level || "",
        major_access: event.major_access || false,
        major_access_type: event.major_access_type || "",
        race_type: event.race_type || "",
        show_in_showcase: event.show_in_showcase || false,
        quantidade_total: event.quantidade_total || null,
      })
      
      const { data: settings } = await supabase
        .from("event_settings")
        .select("*")
        .eq("event_id", eventId)
        .maybeSingle()
      
      if (settings) {
        setPixels({
          google_analytics_id: settings.analytics_ga_measurement_id || settings.analytics_google_analytics_id || "",
          google_tag_manager_id: settings.analytics_gtm_container_id || "",
          facebook_pixel_id: settings.analytics_facebook_pixel_id || "",
        })
      }
      
      const { data: batchesData } = await supabase
        .from("event_batches")
        .select(`*, tickets:tickets(*)`)
        .eq("event_id", eventId)
        .order("created_at")
      
      if (batchesData) {
        setBatches(batchesData)
      }
      
    } catch (error) {
      console.error("Error fetching event:", error)
      toast.error("Erro ao carregar evento")
    } finally {
      setLoading(false)
    }
  }, [eventId])

  // Fetch affiliates
  const fetchAffiliates = useCallback(async () => {
    if (!eventId) return
    
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: organizer } = await supabase
        .from("organizers")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (!organizer) return
      setOrganizerId(organizer.id)

      const { data: invites, error } = await supabase
        .from("event_affiliate_invites")
        .select(`
          *,
          affiliate:affiliates(
            id,
            user:users!affiliates_user_id_fkey(id, email, full_name)
          )
        `)
        .eq("event_id", eventId)
        .eq("organizer_id", organizer.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setAffiliates(invites || [])
      
      const accepted = (invites || []).filter((a: any) => a.status === "accepted")
      setAcceptedAffiliates(accepted)
    } catch (error) {
      console.error("Erro ao buscar afiliados:", error)
    }
  }, [eventId])

  // Fetch coupons
  const fetchCoupons = useCallback(async () => {
    if (!eventId) return
    
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("event_coupons")
        .select(`
          *,
          affiliate:affiliates(
            id,
            user:users!affiliates_user_id_fkey(id, email, full_name)
          )
        `)
        .eq("event_id", eventId)
        .order("created_at", { ascending: false })
      
      if (error) throw error
      setCoupons(data || [])
    } catch (error) {
      console.error("Error fetching coupons:", error)
    }
  }, [eventId])

  // Save event data
  const saveEventData = async (data: EventBasicFormData) => {
    setSaving(true)
    try {
      const supabase = createClient()
      
      let bannerUrl = data.banner_url
      if (newBanner) {
        try {
          bannerUrl = await uploadEventBanner(newBanner, eventId)
          toast.success("Banner atualizado!")
        } catch (error) {
          toast.error("Erro ao fazer upload do banner")
        }
      }
      
      const { error } = await supabase
        .from("events")
        .update({
          name: data.name,
          description: data.description,
          category: data.category,
          language: data.language,
          event_date: data.event_date,
          start_time: data.start_time,
          end_time: data.end_time,
          location: data.location,
          address: data.address,
          address_number: data.address_number,
          city: data.city,
          state: data.state,
          zip_code: data.zip_code,
          banner_url: bannerUrl,
          status: data.status,
          difficulty_level: data.difficulty_level || null,
          major_access: data.major_access,
          major_access_type: data.major_access_type,
          race_type: data.race_type || null,
          show_in_showcase: data.show_in_showcase,
          quantidade_total: data.quantidade_total,
        })
        .eq("id", eventId)
      
      if (error) throw error
      
      setEventData({ ...data, banner_url: bannerUrl })
      setNewBanner(null)
      toast.success("Evento atualizado com sucesso!")
      
    } catch (error: any) {
      console.error("Error saving event:", error)
      toast.error(error.message || "Erro ao salvar evento")
      throw error
    } finally {
      setSaving(false)
    }
  }

  // Save pixels
  const savePixels = async (data: PixelsFormData) => {
    setSaving(true)
    try {
      const supabase = createClient()
      
      const pixelsData = {
        analytics_ga_measurement_id: data.google_analytics_id || null,
        analytics_gtm_container_id: data.google_tag_manager_id || null,
        analytics_facebook_pixel_id: data.facebook_pixel_id || null,
      }
      
      const { data: existing } = await supabase
        .from("event_settings")
        .select("id")
        .eq("event_id", eventId)
        .maybeSingle()
      
      if (existing) {
        const { error } = await supabase
          .from("event_settings")
          .update(pixelsData)
          .eq("event_id", eventId)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from("event_settings")
          .insert({ event_id: eventId, ...pixelsData })
        
        if (error) throw error
      }
      
      setPixels(data)
      toast.success("Pixels salvos com sucesso!")
      
    } catch (error: any) {
      console.error("Error saving pixels:", error)
      toast.error(error.message || "Erro ao salvar pixels")
      throw error
    } finally {
      setSaving(false)
    }
  }

  // Save coupon
  const saveCoupon = async (data: CouponFormData, editingId?: string) => {
    try {
      const isPercentage = data.discount_type === "percentage"
      const discountValue = parseFloat(data.discount_value)
      
      const requestBody = {
        event_id: eventId,
        code: data.code,
        discount_percentage: isPercentage ? discountValue : null,
        discount_amount: !isPercentage ? discountValue : null,
        affiliate_id: data.affiliate_id || null,
        max_uses: data.max_uses ? parseInt(data.max_uses) : null,
        expires_at: data.expires_at || null,
        is_active: data.is_active,
      }
      
      const response = await fetch(
        editingId ? `/api/events/coupon/${editingId}` : "/api/events/coupon",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      )
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || "Erro ao salvar cupom")
      }
      
      toast.success(editingId ? "Cupom atualizado!" : "Cupom criado!")
      await fetchCoupons()
      
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar cupom")
      throw error
    }
  }

  // Delete coupon
  const deleteCoupon = async (couponId: string) => {
    try {
      const response = await fetch(`/api/events/coupon/${couponId}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao deletar cupom")
      }
      
      toast.success("Cupom deletado!")
      await fetchCoupons()
      
    } catch (error: any) {
      toast.error(error.message || "Erro ao deletar cupom")
      throw error
    }
  }

  // Invite affiliate
  const inviteAffiliate = async (data: AffiliateFormData) => {
    try {
      const response = await fetch("/api/events/affiliate-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          email: data.email,
          commission_type: data.commission_type,
          commission_value: parseFloat(data.commission_value),
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || "Erro ao convidar afiliado")
      }
      
      toast.success("Convite enviado!")
      await fetchAffiliates()
      
    } catch (error: any) {
      toast.error(error.message || "Erro ao convidar afiliado")
      throw error
    }
  }

  // Delete event (soft delete)
  const deleteEvent = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("events")
        .update({ status: "cancelled" })
        .eq("id", eventId)
      
      if (error) throw error
      
      toast.success("Evento deletado com sucesso!")
      return true
    } catch (error: any) {
      toast.error(error.message || "Erro ao deletar evento")
      throw error
    }
  }

  // Upload images
  const uploadImages = async () => {
    if (newImages.length === 0) return
    
    setUploadingImages(true)
    try {
      for (const image of newImages) {
        const imageUrl = await uploadEventImage(image, eventId)
        if (imageUrl) {
          setEventImages(prev => [...prev, {
            id: crypto.randomUUID(),
            image_url: imageUrl,
            image_order: prev.length
          }])
        }
      }
      setNewImages([])
      toast.success("Imagens enviadas com sucesso!")
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar imagens")
    } finally {
      setUploadingImages(false)
    }
  }

  // Initial load
  useEffect(() => {
    if (eventId) {
      fetchEvent()
      fetchAffiliates()
      fetchCoupons()
    }
  }, [eventId, fetchEvent, fetchAffiliates, fetchCoupons])

  return {
    loading,
    saving,
    eventData,
    batches,
    setBatches,
    pixels,
    affiliates,
    acceptedAffiliates,
    coupons,
    viewStats,
    reportData,
    organizerId,
    newBanner,
    setNewBanner,
    eventImages,
    setEventImages,
    newImages,
    setNewImages,
    uploadingImages,
    saveEventData,
    savePixels,
    saveCoupon,
    deleteCoupon,
    inviteAffiliate,
    deleteEvent,
    uploadImages,
    refresh: {
      event: fetchEvent,
      affiliates: fetchAffiliates,
      coupons: fetchCoupons,
      viewStats: fetchViewStats,
      reportData: fetchReportData,
    },
  }
}
