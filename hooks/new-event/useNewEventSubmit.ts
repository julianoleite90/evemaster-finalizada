"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { createEvent } from "@/lib/supabase/events"
import { uploadEventBanner, uploadEventGPX, uploadTicketGPX } from "@/lib/supabase/storage"
import { NewEventFormData, DISTANCIAS_PADRAO } from "@/lib/schemas/new-event"

export function useNewEventSubmit() {
  const router = useRouter()

  const handleSubmit = useCallback(async (
    formData: NewEventFormData,
    setSubmitting: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setSubmitting(true)
    try {
      const supabase = createClient()

      // Verify auth
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user

      if (!user) {
        toast.error("Você precisa estar logado para criar um evento")
        router.push("/login/organizer")
        return
      }

      // Get organizer
      let organizer: { id: string } | null = null

      const { data: organizerByUserId, error: errorByUserId } = await supabase
        .from("organizers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()

      if (organizerByUserId && !errorByUserId) {
        organizer = organizerByUserId
      } else {
        const { data: userData } = await supabase
          .from("users")
          .select("role, full_name")
          .eq("id", user.id)
          .maybeSingle()

        const companyName = userData?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || "Organizador"

        const { data: newOrganizer, error: insertError } = await supabase
          .from("organizers")
          .insert({
            user_id: user.id,
            company_name: companyName,
            legal_responsible: companyName,
          })
          .select("id")
          .single()

        if (newOrganizer && !insertError) {
          organizer = newOrganizer
        }
      }

      if (!organizer) {
        toast.error("Perfil de organizador não encontrado")
        return
      }

      // Prepare batches
      const lotes = formData.lotes.map((lote, index) => {
        let dataFim = lote.dataInicio
        if (index < formData.lotes.length - 1) {
          dataFim = formData.lotes[index + 1].dataInicio
        } else {
          const data = new Date(lote.dataInicio)
          data.setDate(data.getDate() + 15)
          dataFim = data.toISOString().split("T")[0]
        }

        return {
          name: lote.nome,
          start_date: lote.dataInicio,
          start_time: lote.horaInicio,
          end_date: dataFim,
          total_quantity: lote.quantidadeTotal && lote.quantidadeTotal !== "" ? parseInt(lote.quantidadeTotal) : null,
          tickets: lote.ingressos.map((ingresso) => {
            const shirtQuantities = Object.entries(ingresso.quantidadeCamisetasPorTamanho || {}).reduce<Record<string, number>>(
              (acc, [size, value]) => {
                if (value !== null && value !== undefined && value !== "") {
                  const parsed = parseInt(value as string, 10)
                  if (!Number.isNaN(parsed)) acc[size] = parsed
                }
                return acc
              },
              {}
            )

            return {
              category: ingresso.categoria,
              price: ingresso.gratuito ? 0 : parseFloat(ingresso.valor) || 0,
              is_free: ingresso.gratuito,
              quantity: ingresso.quantidade || null,
              has_kit: ingresso.possuiKit,
              kit_items: ingresso.possuiKit ? ingresso.itensKit : [],
              shirt_sizes: ingresso.tamanhosCamiseta,
              shirt_quantities: shirtQuantities,
            }
          }),
        }
      })

      // Prepare distances
      const distancias = formData.distancias.filter((d) => d !== "custom")
      const distanciasPadrao = distancias.map((d) => {
        const distancia = DISTANCIAS_PADRAO.find((dp) => dp.value === d)
        return distancia ? distancia.label : `${d}km`
      })
      const todasDistancias = [...distanciasPadrao, ...formData.distanciasCustom]

      // Address
      const enderecoCompleto = [formData.endereco, formData.numero, formData.complemento, formData.bairro].filter(Boolean).join(", ")
      const localCompleto = [formData.cidade, formData.estado, formData.pais].filter(Boolean).join(", ")

      // Create event
      const event = await createEvent({
        organizer_id: organizer.id,
        name: formData.nome,
        description: formData.descricao,
        event_date: formData.data,
        start_time: formData.horarioInicio,
        end_time: formData.horarioFim,
        category: formData.categoria,
        language: formData.language,
        distances: todasDistancias,
        difficulty_level: formData.difficulty_level || undefined,
        race_type: formData.race_type || undefined,
        major_access: formData.major_access,
        major_access_type: formData.major_access ? formData.major_access_type : undefined,
        address: enderecoCompleto,
        location: localCompleto,
        city: formData.cidade,
        state: formData.estado,
        zip_code: formData.cep,
        lotes: lotes,
        quantidade_total: (() => {
          const todasQuantidades = formData.lotes.map(lote => 
            lote.quantidadeTotal && lote.quantidadeTotal !== "" ? parseInt(lote.quantidadeTotal) : null
          )
          const todosIlimitados = todasQuantidades.every(qtd => qtd === null)
          if (todosIlimitados) return undefined
          const soma = todasQuantidades.reduce((total: number, qtd) => total + (qtd || 0), 0)
          return soma > 0 ? soma : undefined
        })(),
        settings: {
          payment_pix_enabled: formData.meiosPagamento.pix,
          payment_credit_card_enabled: formData.meiosPagamento.cartaoCredito,
          payment_boleto_enabled: formData.meiosPagamento.boleto,
          payment_max_installments: formData.meiosPagamento.parcelamento.maxParcelas,
          payment_assume_interest: formData.meiosPagamento.parcelamento.assumirJuros,
        },
      })

      if (!event) {
        toast.error("Erro ao criar evento")
        return
      }

      // Upload banner
      if (formData.bannerEvento) {
        try {
          const bannerUrl = await uploadEventBanner(formData.bannerEvento, event.id)
          if (bannerUrl) {
            await supabase.from("events").update({ banner_url: bannerUrl }).eq("id", event.id)
          }
        } catch (error) {
          console.error("Erro ao fazer upload do banner:", error)
        }
      }

      // Upload GPX
      if (formData.gpxStrava) {
        try {
          const gpxUrl = await uploadEventGPX(formData.gpxStrava, event.id)
          if (gpxUrl) {
            await supabase.from("events").update({ gpx_url: gpxUrl }).eq("id", event.id)
          }
        } catch (error) {
          console.error("Erro ao fazer upload do GPX:", error)
        }
      }

      // Upload ticket GPX files
      const { data: ticketBatches } = await supabase
        .from("event_batches")
        .select("id, name, tickets(*)")
        .eq("event_id", event.id)

      if (ticketBatches) {
        for (const lote of formData.lotes) {
          for (const ingresso of lote.ingressos) {
            if (ingresso.gpxFile) {
              const batch = ticketBatches.find((b: any) => b.name === lote.nome)
              if (batch) {
                const ticket = ((batch as any).tickets as any[]).find(
                  (t: any) => t.category === ingresso.categoria
                )
                if (ticket) {
                  try {
                    const gpxUrl = await uploadTicketGPX(ingresso.gpxFile, event.id, ticket.id)
                    if (gpxUrl) {
                      await supabase.from("tickets").update({
                        gpx_url: gpxUrl,
                        show_route: ingresso.showRoute,
                        show_map: ingresso.showMap,
                        show_elevation: ingresso.showElevation,
                      }).eq("id", ticket.id)
                    }
                  } catch (error) {
                    console.error("Erro ao fazer upload do GPX do ticket:", error)
                  }
                }
              }
            }
          }
        }
      }

      toast.success("Evento criado com sucesso!")
      router.push(event.slug ? `/evento/${event.slug}` : `/evento/${event.id}`)

    } catch (error: any) {
      console.error("Erro ao criar evento:", error)
      toast.error(error?.message || "Erro ao criar evento")
    } finally {
      setSubmitting(false)
    }
  }, [router])

  return { handleSubmit }
}

