"use client"

import { useState, useCallback } from "react"
import { Idioma } from "../types"

// Tipos para o estado do checkout
export interface CheckoutLoadingState {
  loading: boolean
  submitting: boolean
  loadingCep: boolean
  verificandoCpf: boolean
}

export interface CheckoutStepState {
  currentStep: number
  currentParticipante: number
}

export interface CheckoutUIState {
  showCpfLogin: boolean
  mostrarSelecaoParticipantes: boolean
  mostrarPopupIncluirParticipantes: boolean
  mostrarBuscaParticipantes: boolean
  permiteEdicao: boolean
}

/**
 * Hook para gerenciar estados de loading do checkout
 */
export function useCheckoutLoading() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [loadingCep, setLoadingCep] = useState(false)
  const [verificandoCpf, setVerificandoCpf] = useState(false)

  return {
    loading,
    setLoading,
    submitting,
    setSubmitting,
    loadingCep,
    setLoadingCep,
    verificandoCpf,
    setVerificandoCpf,
  }
}

/**
 * Hook para gerenciar navegação entre steps
 */
export function useCheckoutNavigation(totalSteps = 3) {
  const [currentStep, setCurrentStep] = useState(1)
  const [currentParticipante, setCurrentParticipante] = useState(0)

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1)
    }
  }, [currentStep, totalSteps])

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step)
    }
  }, [totalSteps])

  const nextParticipante = useCallback(() => {
    setCurrentParticipante(prev => prev + 1)
    setCurrentStep(1) // Volta para o primeiro step do próximo participante
  }, [])

  const prevParticipante = useCallback(() => {
    if (currentParticipante > 0) {
      setCurrentParticipante(prev => prev - 1)
    }
  }, [currentParticipante])

  return {
    currentStep,
    setCurrentStep,
    currentParticipante,
    setCurrentParticipante,
    nextStep,
    prevStep,
    goToStep,
    nextParticipante,
    prevParticipante,
  }
}

/**
 * Hook para gerenciar configurações do evento (idioma, país, etc)
 */
export function useCheckoutConfig() {
  const [idioma, setIdioma] = useState<Idioma>("pt")
  const [paisEvento, setPaisEvento] = useState("brasil")
  const [temKit, setTemKit] = useState(false)
  const [temCamiseta, setTemCamiseta] = useState(false)

  const isBrasil = paisEvento === "brasil"

  return {
    idioma,
    setIdioma,
    paisEvento,
    setPaisEvento,
    temKit,
    setTemKit,
    temCamiseta,
    setTemCamiseta,
    isBrasil,
  }
}

/**
 * Hook para gerenciar estados de UI/modais
 */
export function useCheckoutUI() {
  const [showCpfLogin, setShowCpfLogin] = useState(false)
  const [mostrarSelecaoParticipantes, setMostrarSelecaoParticipantes] = useState(false)
  const [mostrarPopupIncluirParticipantes, setMostrarPopupIncluirParticipantes] = useState(false)
  const [mostrarBuscaParticipantes, setMostrarBuscaParticipantes] = useState(false)
  const [permiteEdicao, setPermiteEdicao] = useState(false)

  return {
    showCpfLogin,
    setShowCpfLogin,
    mostrarSelecaoParticipantes,
    setMostrarSelecaoParticipantes,
    mostrarPopupIncluirParticipantes,
    setMostrarPopupIncluirParticipantes,
    mostrarBuscaParticipantes,
    setMostrarBuscaParticipantes,
    permiteEdicao,
    setPermiteEdicao,
  }
}

