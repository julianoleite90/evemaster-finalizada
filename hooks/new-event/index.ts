"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import { NewEventFormData } from "@/lib/schemas/new-event"
import { useNewEventState } from "./useNewEventState"
import { useNewEventBatches } from "./useNewEventBatches"
import { useNewEventSubmit } from "./useNewEventSubmit"

export function useNewEvent() {
  const {
    currentStep,
    setCurrentStep,
    totalSteps,
    lotesExpandidos,
    setLotesExpandidos,
    submitting,
    setSubmitting,
    formData,
    setFormData,
    updateField,
    updatePaymentMethod,
    handleFileUpload,
  } = useNewEventState()

  const {
    addLote,
    updateLote,
    removeLote,
    toggleLoteExpandido,
    salvarLote,
    addIngresso,
    updateIngresso,
    removeIngresso,
  } = useNewEventBatches(formData, setFormData, lotesExpandidos, setLotesExpandidos)

  const { handleSubmit: submitEvent } = useNewEventSubmit()

  // CEP lookup
  const [loadingCep, setLoadingCep] = useState(false)

  const buscarCep = useCallback(async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, "")
    if (cepLimpo.length !== 8) return

    setLoadingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await response.json()

      if (data.erro) {
        toast.error("CEP não encontrado")
        return
      }

      setFormData(prev => ({
        ...prev,
        endereco: data.logradouro || "",
        bairro: data.bairro || "",
        cidade: data.localidade || "",
        estado: data.uf || "",
      }))
    } catch (error) {
      console.error("Erro ao buscar CEP:", error)
      toast.error("Erro ao buscar CEP")
    } finally {
      setLoadingCep(false)
    }
  }, [setFormData])

  // Distance management
  const handleDistanciaChange = useCallback((value: string, checked: boolean) => {
    const newDistancias = checked
      ? [...formData.distancias, value]
      : formData.distancias.filter(d => d !== value)
    updateField("distancias", newDistancias)
  }, [formData.distancias, updateField])

  const addDistanciaCustom = useCallback((valor: string) => {
    const distancia = `${valor}km`
    if (!formData.distanciasCustom.includes(distancia)) {
      updateField("distanciasCustom", [...formData.distanciasCustom, distancia])
    }
  }, [formData.distanciasCustom, updateField])

  const removeDistanciaCustom = useCallback((distancia: string) => {
    updateField("distanciasCustom", formData.distanciasCustom.filter(d => d !== distancia))
  }, [formData.distanciasCustom, updateField])

  // Navigation
  const handleNext = useCallback(() => {
    if (currentStep < totalSteps) {
      if (currentStep === 1) {
        if (!formData.nome || !formData.data) {
          toast.error("Preencha o nome e a data do evento")
          return
        }
      }

      if (currentStep === 2) {
        const lotesNaoSalvos = formData.lotes.filter(lote => !lote.salvo)
        if (lotesNaoSalvos.length > 0) {
          toast.error("Salve todos os lotes antes de continuar")
          return
        }
        if (formData.lotes.some(lote => lote.ingressos.length === 0)) {
          toast.error("Todos os lotes precisam ter pelo menos um ingresso")
          return
        }
      }

      setCurrentStep(currentStep + 1)
    }
  }, [currentStep, totalSteps, formData, setCurrentStep])

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep, setCurrentStep])

  // Submit
  const handleSubmit = useCallback(async () => {
    await submitEvent(formData, setSubmitting)
  }, [submitEvent, formData, setSubmitting])

  return {
    // State
    currentStep,
    totalSteps,
    formData,
    lotesExpandidos,
    loadingCep,
    submitting,

    // Updaters
    updateField,
    updatePaymentMethod,
    handleFileUpload,
    setFormData,

    // CEP
    buscarCep,

    // Distances
    handleDistanciaChange,
    addDistanciaCustom,
    removeDistanciaCustom,

    // Batches
    addLote,
    updateLote,
    removeLote,
    toggleLoteExpandido,
    salvarLote,

    // Tickets
    addIngresso,
    updateIngresso,
    removeIngresso,

    // Navigation
    handleNext,
    handlePrevious,
    handleSubmit,
  }
}

