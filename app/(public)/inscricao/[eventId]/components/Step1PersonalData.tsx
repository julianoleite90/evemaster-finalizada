"use client"

import { logger } from "@/lib/utils/logger"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit2, Lock, Loader2 } from "lucide-react"
import { CPFLoginInline } from "@/components/auth/CPFLoginInline"
import { Participante, PAISES, Idioma } from "../types"
import { formatDocumento, formatTelefone } from "../utils"

interface Step1PersonalDataProps {
  participante: Participante
  participantes: Participante[]
  currentParticipante: number
  usuarioLogado: any
  permiteEdicao: boolean
  setPermiteEdicao: (value: boolean) => void
  showCpfLogin: boolean
  cpfUserData: { id: string; maskedEmail: string; fullName: string } | null
  verificandoCpf: boolean
  idioma: Idioma
  isBrasil: boolean
  t: (key: string) => string
  updateParticipante: (field: keyof Participante, value: string) => void
  setParticipantes: (participantes: Participante[]) => void
  verificarCpfCadastrado: (cpf: string) => void
  handleCpfLoginSuccess: (userData: any) => void
  handleCloseCpfLogin: () => void
}

export function Step1PersonalData({
  participante,
  participantes,
  currentParticipante,
  usuarioLogado,
  permiteEdicao,
  setPermiteEdicao,
  showCpfLogin,
  cpfUserData,
  verificandoCpf,
  idioma,
  isBrasil,
  t,
  updateParticipante,
  setParticipantes,
  verificarCpfCadastrado,
  handleCpfLoginSuccess,
  handleCloseCpfLogin,
}: Step1PersonalDataProps) {
  // Verificação de segurança - se participante não existe, não renderizar
  if (!participante) {
    return null
  }
  
  const isDisabled = !!usuarioLogado && currentParticipante === 0 && !permiteEdicao

  const handlePaisChange = (value: string) => {
    logger.log('🌍 [CHECKOUT] País alterado:', value, 'Participante atual:', participante?.paisResidencia)
    const novosParticipantes = [...participantes]
    novosParticipantes[currentParticipante] = {
      ...novosParticipantes[currentParticipante],
      paisResidencia: value,
      cpf: "" // Limpar documento quando mudar o país
    }
    setParticipantes(novosParticipantes)
  }

  const getDocumentoLabel = () => {
    if (participante.paisResidencia === "brasil") return "CPF"
    if (participante.paisResidencia === "argentina") return "DNI"
    return idioma === "es" ? "Documento" : idioma === "en" ? "ID Document" : "Documento"
  }

  const getDocumentoPlaceholder = () => {
    if (participante.paisResidencia === "brasil") return "000.000.000-00"
    if (participante.paisResidencia === "argentina") return "12.345.678"
    return idioma === "es" ? "Número de documento" : "Document number"
  }

  return (
    <div className="space-y-4">
      {/* Botão de edição quando logado */}
      {usuarioLogado && currentParticipante === 0 && !permiteEdicao && (
        <div className="flex items-center justify-end mb-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPermiteEdicao(true)}
            className="flex items-center gap-2"
          >
            <Edit2 className="h-4 w-4" />
            Editar dados
          </Button>
        </div>
      )}
      
      {/* País de Residência */}
      <div className="space-y-2">
        <Label>{t("paisResidencia")} *</Label>
        <Select
          value={participante?.paisResidencia || "brasil"}
          onValueChange={handlePaisChange}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("selecione")} />
          </SelectTrigger>
          <SelectContent>
            {PAISES.map((pais) => (
              <SelectItem key={pais.value} value={pais.value}>
                {idioma === "es" ? pais.labelEs : idioma === "en" ? pais.labelEn : pais.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Documento (CPF/DNI/ID) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="cpf">{getDocumentoLabel()} *</Label>
          {isDisabled && <Lock className="h-4 w-4 text-gray-400" />}
        </div>
        <div className="relative">
          <Input
            id="cpf"
            inputMode="numeric"
            value={participante.cpf}
            onChange={(e) => {
              const formatted = formatDocumento(e.target.value, participante.paisResidencia)
              updateParticipante("cpf", formatted)
            }}
            onBlur={(e) => {
              if (currentParticipante === 0 && !usuarioLogado && participante.paisResidencia === "brasil") {
                verificarCpfCadastrado(e.target.value)
              }
            }}
            placeholder={getDocumentoPlaceholder()}
            disabled={isDisabled}
          />
          {verificandoCpf && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
        </div>
        
        {/* Login por CPF */}
        {showCpfLogin && cpfUserData && !usuarioLogado && (
          <CPFLoginInline
            cpf={participante.cpf}
            userData={cpfUserData}
            onLoginSuccess={handleCpfLoginSuccess}
            onClose={handleCloseCpfLogin}
          />
        )}
      </div>

      {/* Nome Completo */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="nome">{t("nomeCompleto")} *</Label>
          {isDisabled && <Lock className="h-4 w-4 text-gray-400" />}
        </div>
        <Input
          id="nome"
          value={participante.nome}
          onChange={(e) => updateParticipante("nome", e.target.value)}
          placeholder={t("nomeCompleto")}
          disabled={isDisabled}
        />
      </div>

      {/* Email e Telefone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("email")} *</Label>
          <Input
            id="email"
            type="email"
            value={participante.email}
            onChange={(e) => updateParticipante("email", e.target.value)}
            placeholder="email@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telefone">{t("telefone")} *</Label>
          <Input
            id="telefone"
            inputMode="tel"
            value={participante.telefone}
            onChange={(e) => updateParticipante("telefone", isBrasil ? formatTelefone(e.target.value) : e.target.value)}
            placeholder={isBrasil ? "(00) 00000-0000" : "+00 000 000 0000"}
          />
        </div>
      </div>

      {/* Idade e Gênero */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="idade">{t("idade")} *</Label>
            {isDisabled && <Lock className="h-4 w-4 text-gray-400" />}
          </div>
          <Input
            id="idade"
            type="number"
            min="1"
            max="120"
            value={participante.idade}
            onChange={(e) => updateParticipante("idade", e.target.value)}
            placeholder="Ex: 30"
            disabled={isDisabled}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{t("genero")} *</Label>
            {isDisabled && <Lock className="h-4 w-4 text-gray-400" />}
          </div>
          <Select
            value={participante.genero}
            onValueChange={(value) => updateParticipante("genero", value)}
            disabled={isDisabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("selecione")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Masculino">{t("masculino")}</SelectItem>
              <SelectItem value="Feminino">{t("feminino")}</SelectItem>
              <SelectItem value="Outro">{t("outro")}</SelectItem>
              <SelectItem value="Prefiro não informar">{t("prefiroNaoInformar")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

