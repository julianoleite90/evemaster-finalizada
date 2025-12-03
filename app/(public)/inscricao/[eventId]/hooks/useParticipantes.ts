"use client"

import { useState, useCallback } from "react"
import { Participante, participanteVazio } from "../types"

/**
 * Hook para gerenciar participantes do checkout
 */
export function useParticipantes(initialCount = 1) {
  const [participantes, setParticipantes] = useState<Participante[]>(
    Array(initialCount).fill(null).map(() => ({ ...participanteVazio }))
  )
  const [salvarPerfil, setSalvarPerfil] = useState<{ [key: number]: boolean }>({})

  // Atualiza um campo específico de um participante
  const updateParticipante = useCallback((
    index: number,
    field: keyof Participante,
    value: string | boolean
  ) => {
    setParticipantes(prev => {
      const novos = [...prev]
      novos[index] = {
        ...novos[index],
        [field]: value,
      }
      return novos
    })
  }, [])

  // Atualiza o participante atual (helper para uso com currentParticipante)
  const updateCurrentParticipante = useCallback((
    currentIndex: number,
    field: keyof Participante,
    value: string | boolean
  ) => {
    updateParticipante(currentIndex, field, value)
  }, [updateParticipante])

  // Adiciona um novo participante
  const addParticipante = useCallback((dados?: Partial<Participante>) => {
    setParticipantes(prev => [
      ...prev,
      { ...participanteVazio, ...dados }
    ])
  }, [])

  // Remove um participante por índice
  const removeParticipante = useCallback((index: number) => {
    setParticipantes(prev => prev.filter((_, i) => i !== index))
    // Também remove do salvarPerfil
    setSalvarPerfil(prev => {
      const novo = { ...prev }
      delete novo[index]
      return novo
    })
  }, [])

  // Substitui um participante inteiro
  const setParticipante = useCallback((index: number, participante: Participante) => {
    setParticipantes(prev => {
      const novos = [...prev]
      novos[index] = participante
      return novos
    })
  }, [])

  // Define todos os participantes de uma vez
  const setAllParticipantes = useCallback((novosParticipantes: Participante[]) => {
    setParticipantes(novosParticipantes)
  }, [])

  // Obtém um participante por índice (com fallback para vazio)
  const getParticipante = useCallback((index: number): Participante => {
    return participantes[index] || participanteVazio
  }, [participantes])

  // Toggle para salvar perfil
  const toggleSalvarPerfil = useCallback((index: number, value: boolean) => {
    setSalvarPerfil(prev => ({ ...prev, [index]: value }))
  }, [])

  return {
    participantes,
    setParticipantes: setAllParticipantes,
    updateParticipante,
    updateCurrentParticipante,
    addParticipante,
    removeParticipante,
    setParticipante,
    getParticipante,
    salvarPerfil,
    setSalvarPerfil,
    toggleSalvarPerfil,
    totalParticipantes: participantes.length,
  }
}

