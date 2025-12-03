"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { ParticipantFormData, formatCPF } from "@/lib/schemas/checkout"
import { CpfUserData } from "./types"

export function useCheckoutCpf() {
  const [showCpfLogin, setShowCpfLogin] = useState(false)
  const [cpfVerificado, setCpfVerificado] = useState<string | null>(null)
  const [cpfUserData, setCpfUserData] = useState<CpfUserData | null>(null)
  const [verificandoCpf, setVerificandoCpf] = useState(false)

  const verificarCpfCadastrado = useCallback(async (
    cpf: string,
    participante: ParticipantFormData,
    usuarioLogado: any
  ) => {
    const cleanCPF = cpf.replace(/\D/g, '')
    
    if (participante.paisResidencia && participante.paisResidencia !== "brasil") return
    if (cleanCPF.length !== 11) return
    if (usuarioLogado) return
    if (cpfVerificado === cleanCPF) return
    
    try {
      setVerificandoCpf(true)
      
      const response = await fetch('/api/auth/verificar-cpf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: cleanCPF }),
      })
      
      const data = await response.json()
      
      if (response.ok && data.exists && data.userData) {
        setCpfVerificado(cleanCPF)
        setCpfUserData(data.userData)
        setShowCpfLogin(true)
      } else {
        setShowCpfLogin(false)
      }
    } catch (error) {
      console.error('Erro ao verificar CPF:', error)
    } finally {
      setVerificandoCpf(false)
    }
  }, [cpfVerificado])

  const handleCpfLoginSuccess = useCallback(async (
    userData: any,
    currentParticipante: number,
    setParticipantes: React.Dispatch<React.SetStateAction<ParticipantFormData[]>>,
    setUsuarioLogado: React.Dispatch<React.SetStateAction<any>>,
    buscarPerfisSalvos: () => Promise<void>
  ) => {
    setShowCpfLogin(false)
    
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      setUsuarioLogado(user)
    }
    
    setParticipantes(prev => {
      const novos = [...prev]
      novos[currentParticipante] = {
        ...novos[currentParticipante],
        nome: userData.fullName || novos[currentParticipante].nome,
        email: userData.email || novos[currentParticipante].email,
        telefone: userData.phone || novos[currentParticipante].telefone,
        cpf: userData.cpf ? formatCPF(userData.cpf) : novos[currentParticipante].cpf,
        idade: userData.age?.toString() || novos[currentParticipante].idade,
        genero: userData.gender || novos[currentParticipante].genero,
        endereco: userData.address || novos[currentParticipante].endereco,
        numero: userData.addressNumber || novos[currentParticipante].numero,
        complemento: userData.addressComplement || novos[currentParticipante].complemento,
        bairro: userData.neighborhood || novos[currentParticipante].bairro,
        cidade: userData.city || novos[currentParticipante].cidade,
        estado: userData.state || novos[currentParticipante].estado,
        cep: userData.zipCode || novos[currentParticipante].cep,
      }
      return novos
    })
    
    await buscarPerfisSalvos()
    toast.success('Dados preenchidos automaticamente!')
  }, [])

  const handleCloseCpfLogin = useCallback((cpf: string) => {
    setShowCpfLogin(false)
    setCpfVerificado(cpf.replace(/\D/g, ''))
  }, [])

  return {
    showCpfLogin,
    cpfVerificado,
    cpfUserData,
    verificandoCpf,
    verificarCpfCadastrado,
    handleCpfLoginSuccess,
    handleCloseCpfLogin,
    setShowCpfLogin,
  }
}

