"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, Edit2, Lock, Info } from "lucide-react"
import { CPFLoginInline } from "@/components/auth/CPFLoginInline"
import { 
  ParticipantFormData, 
  formatCPF, 
  formatDNI, 
  formatDocumento, 
  formatTelefone,
  PAISES 
} from "@/lib/schemas/checkout"

// Traduções para labels
const traducoes: Record<string, Record<string, string>> = {
  pt: {
    cpf: "CPF",
    dni: "DNI",
    documento: "Documento de identificação",
    nome: "Nome completo",
    email: "E-mail",
    telefone: "Telefone",
    idade: "Idade",
    genero: "Gênero",
    masculino: "Masculino",
    feminino: "Feminino",
    outro: "Outro",
    paisResidencia: "País de residência",
    dadosPreenchidos: "Dados preenchidos automaticamente",
    editarDados: "Editar dados",
    contaEncontrada: "Encontramos uma conta com este CPF",
    verificando: "Verificando...",
  },
  es: {
    cpf: "CPF",
    dni: "DNI",
    documento: "Documento de identificación",
    nome: "Nombre completo",
    email: "E-mail",
    telefone: "Teléfono",
    idade: "Edad",
    genero: "Género",
    masculino: "Masculino",
    feminino: "Femenino",
    outro: "Otro",
    paisResidencia: "País de residencia",
    dadosPreenchidos: "Datos completados automáticamente",
    editarDados: "Editar datos",
    contaEncontrada: "Encontramos una cuenta con este CPF",
    verificando: "Verificando...",
  },
  en: {
    cpf: "CPF",
    dni: "DNI",
    documento: "ID Document",
    nome: "Full name",
    email: "E-mail",
    telefone: "Phone",
    idade: "Age",
    genero: "Gender",
    masculino: "Male",
    feminino: "Female",
    outro: "Other",
    paisResidencia: "Country of residence",
    dadosPreenchidos: "Data filled automatically",
    editarDados: "Edit data",
    contaEncontrada: "We found an account with this CPF",
    verificando: "Verifying...",
  },
}

interface PersonalDataStepProps {
  participant: ParticipantFormData
  participantIndex: number
  idioma: string
  usuarioLogado: any
  permiteEdicao: boolean
  verificandoCpf: boolean
  showCpfLogin?: boolean
  cpfUserData?: { id: string; maskedEmail: string; fullName: string } | null
  onUpdate: (field: keyof ParticipantFormData, value: any) => void
  onToggleEdicao: () => void
  onCpfBlur?: (cpf: string) => void
  onCpfLoginSuccess?: (userData: any) => void
  onCloseCpfLogin?: () => void
}

export function PersonalDataStep({
  participant,
  participantIndex,
  idioma,
  usuarioLogado,
  permiteEdicao,
  verificandoCpf,
  showCpfLogin,
  cpfUserData,
  onUpdate,
  onToggleEdicao,
  onCpfBlur,
  onCpfLoginSuccess,
  onCloseCpfLogin,
}: PersonalDataStepProps) {
  const t = (key: string) => traducoes[idioma]?.[key] || traducoes.pt[key] || key
  
  // Determinar label do documento baseado no país
  const getDocumentoLabel = () => {
    if (participant.paisResidencia === "brasil") return t("cpf")
    if (participant.paisResidencia === "argentina") return t("dni")
    return t("documento")
  }

  // Formatar documento baseado no país
  const handleDocumentoChange = (value: string) => {
    const formatted = formatDocumento(value, participant.paisResidencia)
    onUpdate("cpf", formatted)
  }

  // Campos bloqueados quando logado (exceto se permitir edição)
  const isFieldLocked = (field: string) => {
    if (!usuarioLogado || permiteEdicao) return false
    return participantIndex === 0 && ["cpf", "nome", "email"].includes(field)
  }

  return (
    <div className="space-y-4">
      {/* Aviso de dados preenchidos */}
      {usuarioLogado && participantIndex === 0 && !permiteEdicao && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm">{t("dadosPreenchidos")}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onToggleEdicao}
            className="text-green-700 hover:text-green-800"
          >
            <Edit2 className="h-4 w-4 mr-1" />
            {t("editarDados")}
          </Button>
        </div>
      )}

      {/* País de Residência */}
      <div className="space-y-2">
        <Label>{t("paisResidencia")} *</Label>
        <Select 
          value={participant.paisResidencia} 
          onValueChange={(value) => onUpdate("paisResidencia", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("paisResidencia")} />
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

      {/* Documento (CPF/DNI) */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          {getDocumentoLabel()} *
          {isFieldLocked("cpf") && <Lock className="h-3 w-3 text-muted-foreground" />}
        </Label>
        <div className="relative">
          <Input
            value={participant.cpf}
            onChange={(e) => handleDocumentoChange(e.target.value)}
            onBlur={() => onCpfBlur?.(participant.cpf)}
            placeholder={
              participant.paisResidencia === "brasil" ? "000.000.000-00" : 
              participant.paisResidencia === "argentina" ? "00.000.000" : 
              idioma === "es" ? "Número de documento" : 
              idioma === "en" ? "Document number" : 
              "Número do documento"
            }
            disabled={isFieldLocked("cpf")}
            className="pr-10"
          />
          {verificandoCpf && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* Login por CPF */}
      {showCpfLogin && cpfUserData && onCpfLoginSuccess && onCloseCpfLogin && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-800 font-medium">{t("contaEncontrada")}</p>
              <p className="text-xs text-blue-600 mt-1">
                {cpfUserData.fullName} - {cpfUserData.maskedEmail}
              </p>
              <div className="mt-3">
                <CPFLoginInline 
                  cpf={participant.cpf.replace(/\D/g, '')} 
                  userData={cpfUserData}
                  onLoginSuccess={onCpfLoginSuccess}
                  onClose={onCloseCpfLogin}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nome */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          {t("nome")} *
          {isFieldLocked("nome") && <Lock className="h-3 w-3 text-muted-foreground" />}
        </Label>
        <Input
          value={participant.nome}
          onChange={(e) => onUpdate("nome", e.target.value)}
          placeholder={idioma === "es" ? "Tu nombre completo" : idioma === "en" ? "Your full name" : "Seu nome completo"}
          disabled={isFieldLocked("nome")}
        />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          {t("email")} *
          {isFieldLocked("email") && <Lock className="h-3 w-3 text-muted-foreground" />}
        </Label>
        <Input
          type="email"
          value={participant.email}
          onChange={(e) => onUpdate("email", e.target.value)}
          placeholder="email@exemplo.com"
          disabled={isFieldLocked("email")}
        />
      </div>

      {/* Telefone */}
      <div className="space-y-2">
        <Label>{t("telefone")} *</Label>
        <Input
          value={participant.telefone}
          onChange={(e) => onUpdate("telefone", formatTelefone(e.target.value))}
          placeholder={participant.paisResidencia === "brasil" ? "(00) 00000-0000" : "+00 00000000"}
        />
      </div>

      {/* Idade e Gênero */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("idade")} *</Label>
          <Input
            type="number"
            min="1"
            max="120"
            value={participant.idade}
            onChange={(e) => onUpdate("idade", e.target.value)}
            placeholder="25"
          />
        </div>
        <div className="space-y-2">
          <Label>{t("genero")} *</Label>
          <Select 
            value={participant.genero} 
            onValueChange={(value) => onUpdate("genero", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("genero")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Masculino">{t("masculino")}</SelectItem>
              <SelectItem value="Feminino">{t("feminino")}</SelectItem>
              <SelectItem value="Outro">{t("outro")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
