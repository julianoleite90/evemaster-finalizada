"use client"

import { useState, useCallback } from "react"
import {
  NewEventFormData,
  BatchFormData,
  TicketFormData,
  defaultNewEventForm,
  defaultTicket,
  generateBatchId,
} from "@/lib/schemas/new-event"

export function useNewEventState() {
  const [currentStep, setCurrentStep] = useState(1)
  const [lotesExpandidos, setLotesExpandidos] = useState<{ [loteId: string]: boolean }>({})
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<NewEventFormData>(defaultNewEventForm)

  const totalSteps = 3

  // Update form field
  const updateField = useCallback(<K extends keyof NewEventFormData>(
    field: K,
    value: NewEventFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  // Update payment method
  const updatePaymentMethod = useCallback(<K extends keyof NewEventFormData["meiosPagamento"]>(
    field: K,
    value: NewEventFormData["meiosPagamento"][K]
  ) => {
    setFormData(prev => ({
      ...prev,
      meiosPagamento: { ...prev.meiosPagamento, [field]: value }
    }))
  }, [])

  // File upload
  const handleFileUpload = useCallback((
    field: "bannerEvento" | "gpxStrava",
    file: File | null
  ) => {
    setFormData(prev => ({ ...prev, [field]: file }))
  }, [])

  return {
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
  }
}

