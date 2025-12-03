"use client"

import { useCallback } from "react"
import { IngressoSelecionado, RunningClubData, ResumoFinanceiro } from "./types"

export function useCheckoutCalculations() {
  const calcularTotal = useCallback((
    ingressosSelecionados: IngressoSelecionado[],
    runningClub: RunningClubData | null
  ): ResumoFinanceiro => {
    let subtotal = ingressosSelecionados.reduce((sum, ing) => sum + ing.valor, 0)
    let desconto = 0
    
    // Aplicar desconto do clube de corrida
    if (runningClub && runningClub.base_discount > 0) {
      const descontoBase = (subtotal * runningClub.base_discount) / 100
      desconto += descontoBase
      
      if (runningClub.progressive_discount_threshold && 
          runningClub.progressive_discount_value &&
          ingressosSelecionados.length >= runningClub.progressive_discount_threshold) {
        const descontoProgressivo = (subtotal * runningClub.progressive_discount_value) / 100
        desconto += descontoProgressivo
      }
    }
    
    const subtotalComDesconto = Math.max(0, subtotal - desconto)
    const taxa = subtotalComDesconto > 0 ? ingressosSelecionados.length * 5 : 0
    const total = subtotalComDesconto + taxa
    
    return { subtotal, desconto, subtotalComDesconto, taxa, total }
  }, [])

  const isGratuito = useCallback((ingressosSelecionados: IngressoSelecionado[]): boolean => {
    return ingressosSelecionados.every(ing => ing.gratuito)
  }, [])

  return { calcularTotal, isGratuito }
}

