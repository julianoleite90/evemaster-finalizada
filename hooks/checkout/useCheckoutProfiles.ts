"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import { ParticipantFormData, defaultParticipant } from "@/lib/schemas/checkout"
import { PerfilSalvo } from "./types"

export function useCheckoutProfiles(paisEvento: string) {
  const [perfisSalvos, setPerfisSalvos] = useState<PerfilSalvo[]>([])
  const [termoBuscaParticipante, setTermoBuscaParticipante] = useState("")
  const [participanteAtualEmEdicao, setParticipanteAtualEmEdicao] = useState<number | null>(null)
  const [mostrarBuscaParticipantes, setMostrarBuscaParticipantes] = useState(false)
  const [mostrarPopupIncluirParticipantes, setMostrarPopupIncluirParticipantes] = useState(false)
  const [perfisSelecionadosPopup, setPerfisSelecionadosPopup] = useState<{ perfilId: string; categoriaId: string }[]>([])

  const buscarPerfisSalvos = useCallback(async (usuarioLogado: any) => {
    if (!usuarioLogado) return

    try {
      const res = await fetch('/api/participants/perfis-salvos')
      const data = await res.json()
      if (res.ok && data.profiles) {
        setPerfisSalvos(data.profiles)
      }
    } catch (error) {
      console.error('Erro ao buscar perfis salvos:', error)
    }
  }, [])

  const selecionarParticipanteSalvo = useCallback((
    perfil: PerfilSalvo,
    setParticipantes: React.Dispatch<React.SetStateAction<ParticipantFormData[]>>,
    setCurrentParticipante: React.Dispatch<React.SetStateAction<number>>,
    setCurrentStep: React.Dispatch<React.SetStateAction<number>>
  ) => {
    if (participanteAtualEmEdicao === null) return
    
    setParticipantes(prev => {
      const novos = [...prev]
      novos[participanteAtualEmEdicao] = {
        ...defaultParticipant,
        nome: perfil.full_name || "",
        email: perfil.email || "",
        telefone: perfil.phone || "",
        idade: perfil.age ? String(perfil.age) : "",
        genero: perfil.gender === 'male' ? 'Masculino' : perfil.gender === 'female' ? 'Feminino' : "",
        paisResidencia: perfil.country || paisEvento,
        cep: perfil.zip_code || "",
        endereco: perfil.address || "",
        numero: perfil.address_number || "",
        complemento: perfil.address_complement || "",
        bairro: perfil.neighborhood || "",
        cidade: perfil.city || "",
        estado: perfil.state || "",
        cpf: perfil.cpf || "",
        tamanhoCamiseta: perfil.shirt_size || "",
        aceiteTermo: false,
        contatoEmergenciaNome: perfil.emergency_contact_name || "",
        contatoEmergenciaTelefone: perfil.emergency_contact_phone || "",
      }
      return novos
    })
    
    setCurrentParticipante(participanteAtualEmEdicao)
    setCurrentStep(1)
    setMostrarBuscaParticipantes(false)
    setParticipanteAtualEmEdicao(null)
    setTermoBuscaParticipante("")
    toast.success('Participante adicionado!')
  }, [participanteAtualEmEdicao, paisEvento])

  // Perfis filtrados por busca
  const perfisFiltrados = perfisSalvos.filter(perfil => {
    if (!termoBuscaParticipante) return true
    const termo = termoBuscaParticipante.toLowerCase()
    return (
      perfil.full_name?.toLowerCase().includes(termo) ||
      perfil.email?.toLowerCase().includes(termo) ||
      perfil.cpf?.replace(/\D/g, '').includes(termo.replace(/\D/g, ''))
    )
  })

  return {
    perfisSalvos,
    perfisFiltrados,
    termoBuscaParticipante,
    setTermoBuscaParticipante,
    participanteAtualEmEdicao,
    setParticipanteAtualEmEdicao,
    mostrarBuscaParticipantes,
    setMostrarBuscaParticipantes,
    mostrarPopupIncluirParticipantes,
    setMostrarPopupIncluirParticipantes,
    perfisSelecionadosPopup,
    setPerfisSelecionadosPopup,
    buscarPerfisSalvos,
    selecionarParticipanteSalvo,
  }
}

