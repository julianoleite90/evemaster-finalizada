"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import { ParticipantFormData } from "@/lib/schemas/checkout"

export function useCheckoutCep() {
  const [loadingCep, setLoadingCep] = useState(false)

  const buscarCep = useCallback(async (
    cep: string,
    index: number,
    participantes: ParticipantFormData[],
    setParticipantes: React.Dispatch<React.SetStateAction<ParticipantFormData[]>>
  ) => {
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

      setParticipantes(prev => {
        const novos = [...prev]
        novos[index] = {
          ...novos[index],
          endereco: data.logradouro || "",
          bairro: data.bairro || "",
          cidade: data.localidade || "",
          estado: data.uf || "",
        }
        return novos
      })
    } catch (error) {
      console.error("Erro ao buscar CEP:", error)
    } finally {
      setLoadingCep(false)
    }
  }, [])

  return { loadingCep, buscarCep }
}

