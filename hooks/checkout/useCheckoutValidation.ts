"use client"

import { useCallback } from "react"
import { toast } from "sonner"
import { ParticipantFormData } from "@/lib/schemas/checkout"

// Traduções de erros
const traducoes: Record<string, Record<string, string>> = {
  pt: {
    erroCampos: "Preencha todos os campos obrigatórios",
    erroEmail: "Email inválido",
    erroCpf: "CPF inválido - deve ter 11 dígitos",
    erroDni: "DNI inválido - deve ter pelo menos 7 dígitos",
    erroCep: "Preencha o CEP",
    erroEndereco: "Preencha o endereço completo",
    erroCamiseta: "Selecione o tamanho da camiseta",
    erroEmergencia: "Preencha o contato de emergência",
    erroTermo: "Você precisa aceitar o termo de responsabilidade",
    erroPagamento: "Selecione o meio de pagamento",
  },
  es: {
    erroCampos: "Complete todos los campos obligatorios",
    erroEmail: "Email inválido",
    erroCpf: "CPF inválido - debe tener 11 dígitos",
    erroDni: "DNI inválido - debe tener al menos 7 dígitos",
    erroCep: "Complete el código postal",
    erroEndereco: "Complete la dirección",
    erroCamiseta: "Seleccione la talla de la camiseta",
    erroEmergencia: "Complete el contacto de emergencia",
    erroTermo: "Debe aceptar el término de responsabilidad",
    erroPagamento: "Seleccione el método de pago",
  },
  en: {
    erroCampos: "Fill in all required fields",
    erroEmail: "Invalid email",
    erroCpf: "Invalid CPF - must have 11 digits",
    erroDni: "Invalid DNI - must have at least 7 digits",
    erroCep: "Fill in the zip code",
    erroEndereco: "Fill in the complete address",
    erroCamiseta: "Select the t-shirt size",
    erroEmergencia: "Fill in the emergency contact",
    erroTermo: "You must accept the liability waiver",
    erroPagamento: "Select the payment method",
  },
}

export function useCheckoutValidation(idioma: string) {
  const t = useCallback((key: string) => {
    return traducoes[idioma]?.[key] || traducoes.pt[key] || key
  }, [idioma])

  const validarStep = useCallback((
    participante: ParticipantFormData,
    currentStep: number,
    temCamiseta: boolean,
    isGratuito: boolean,
    meioPagamento: string
  ): boolean => {
    if (!participante) return false
    
    if (currentStep === 1) {
      if (!participante.cpf || !participante.nome || !participante.email || !participante.telefone || !participante.idade || !participante.genero) {
        toast.error(t("erroCampos"))
        return false
      }
      if (!participante.email.includes("@")) {
        toast.error(t("erroEmail"))
        return false
      }
      if (participante.paisResidencia === "brasil" && participante.cpf.replace(/\D/g, '').length !== 11) {
        toast.error(t("erroCpf"))
        return false
      }
      if (participante.paisResidencia === "argentina" && participante.cpf.replace(/\D/g, '').length < 7) {
        toast.error(t("erroDni"))
        return false
      }
    }
    
    if (currentStep === 2) {
      if (!participante.paisResidencia) {
        toast.error(t("erroCampos"))
        return false
      }
      if (participante.paisResidencia === "brasil" && !participante.cep) {
        toast.error(t("erroCep"))
        return false
      }
      if (!participante.endereco || !participante.numero || !participante.cidade) {
        toast.error(t("erroEndereco"))
        return false
      }
    }
    
    if (currentStep === 3) {
      if (temCamiseta && !participante.tamanhoCamiseta) {
        toast.error(t("erroCamiseta"))
        return false
      }
      if (!participante.contatoEmergenciaNome || !participante.contatoEmergenciaTelefone) {
        toast.error(t("erroEmergencia"))
        return false
      }
      if (!participante.aceiteTermo) {
        toast.error(t("erroTermo"))
        return false
      }
      if (!isGratuito && !meioPagamento) {
        toast.error(t("erroPagamento"))
        return false
      }
    }
    
    return true
  }, [t])

  return { validarStep, t }
}

