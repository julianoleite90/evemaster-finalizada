"use client"

import { useCallback } from "react"
import { toast } from "sonner"
import {
  NewEventFormData,
  BatchFormData,
  TicketFormData,
  defaultTicket,
  generateBatchId,
} from "@/lib/schemas/new-event"

export function useNewEventBatches(
  formData: NewEventFormData,
  setFormData: React.Dispatch<React.SetStateAction<NewEventFormData>>,
  lotesExpandidos: { [loteId: string]: boolean },
  setLotesExpandidos: React.Dispatch<React.SetStateAction<{ [loteId: string]: boolean }>>
) {
  // Add new batch
  const addLote = useCallback(() => {
    const novoLote: BatchFormData = {
      id: generateBatchId(),
      nome: `Lote ${formData.lotes.length + 1}`,
      dataInicio: "",
      horaInicio: "",
      quantidadeTotal: "",
      salvo: false,
      ingressos: [],
    }
    setFormData(prev => ({
      ...prev,
      lotes: [...prev.lotes, novoLote]
    }))
    setLotesExpandidos(prev => ({ ...prev, [novoLote.id]: true }))
  }, [formData.lotes.length, setFormData, setLotesExpandidos])

  // Update batch
  const updateLote = useCallback((loteId: string, updates: Partial<BatchFormData>) => {
    setFormData(prev => ({
      ...prev,
      lotes: prev.lotes.map(lote =>
        lote.id === loteId ? { ...lote, ...updates } : lote
      )
    }))
  }, [setFormData])

  // Remove batch
  const removeLote = useCallback((loteId: string) => {
    setFormData(prev => ({
      ...prev,
      lotes: prev.lotes.filter(lote => lote.id !== loteId)
    }))
    setLotesExpandidos(prev => {
      const novo = { ...prev }
      delete novo[loteId]
      return novo
    })
  }, [setFormData, setLotesExpandidos])

  // Toggle batch expanded
  const toggleLoteExpandido = useCallback((loteId: string) => {
    setLotesExpandidos(prev => ({
      ...prev,
      [loteId]: !prev[loteId]
    }))
  }, [setLotesExpandidos])

  // Save batch
  const salvarLote = useCallback((loteId: string) => {
    const lote = formData.lotes.find(l => l.id === loteId)
    if (!lote) return

    if (!lote.nome || !lote.dataInicio) {
      toast.error("Preencha o nome e a data de início do lote")
      return
    }

    if (lote.ingressos.length === 0) {
      toast.error("Adicione pelo menos um ingresso ao lote")
      return
    }

    updateLote(loteId, { salvo: true })
    setLotesExpandidos(prev => ({ ...prev, [loteId]: false }))
    toast.success("Lote salvo com sucesso!")
  }, [formData.lotes, updateLote, setLotesExpandidos])

  // Add ticket to batch
  const addIngresso = useCallback((loteId: string) => {
    const lote = formData.lotes.find(l => l.id === loteId)
    if (!lote) return

    const novoIngresso: TicketFormData = { ...defaultTicket }
    updateLote(loteId, { ingressos: [...lote.ingressos, novoIngresso] })
  }, [formData.lotes, updateLote])

  // Update ticket
  const updateIngresso = useCallback((
    loteId: string,
    ingressoIndex: number,
    updates: Partial<TicketFormData>
  ) => {
    const lote = formData.lotes.find(l => l.id === loteId)
    if (!lote) return

    const novosIngressos = lote.ingressos.map((ing, idx) =>
      idx === ingressoIndex ? { ...ing, ...updates } : ing
    )
    updateLote(loteId, { ingressos: novosIngressos })
  }, [formData.lotes, updateLote])

  // Remove ticket
  const removeIngresso = useCallback((loteId: string, ingressoIndex: number) => {
    const lote = formData.lotes.find(l => l.id === loteId)
    if (!lote) return

    const novosIngressos = lote.ingressos.filter((_, idx) => idx !== ingressoIndex)
    updateLote(loteId, { ingressos: novosIngressos })
  }, [formData.lotes, updateLote])

  return {
    addLote,
    updateLote,
    removeLote,
    toggleLoteExpandido,
    salvarLote,
    addIngresso,
    updateIngresso,
    removeIngresso,
  }
}

