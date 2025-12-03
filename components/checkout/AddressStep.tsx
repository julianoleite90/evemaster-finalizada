"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { ParticipantFormData, formatCEP, PAISES } from "@/lib/schemas/checkout"

// Lista de estados brasileiros
const ESTADOS_BR = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
]

// Províncias da Argentina
const PROVINCIAS_AR = [
  { value: "Buenos Aires", label: "Buenos Aires" },
  { value: "CABA", label: "Ciudad Autónoma de Buenos Aires" },
  { value: "Catamarca", label: "Catamarca" },
  { value: "Chaco", label: "Chaco" },
  { value: "Chubut", label: "Chubut" },
  { value: "Córdoba", label: "Córdoba" },
  { value: "Corrientes", label: "Corrientes" },
  { value: "Entre Ríos", label: "Entre Ríos" },
  { value: "Formosa", label: "Formosa" },
  { value: "Jujuy", label: "Jujuy" },
  { value: "La Pampa", label: "La Pampa" },
  { value: "La Rioja", label: "La Rioja" },
  { value: "Mendoza", label: "Mendoza" },
  { value: "Misiones", label: "Misiones" },
  { value: "Neuquén", label: "Neuquén" },
  { value: "Río Negro", label: "Río Negro" },
  { value: "Salta", label: "Salta" },
  { value: "San Juan", label: "San Juan" },
  { value: "San Luis", label: "San Luis" },
  { value: "Santa Cruz", label: "Santa Cruz" },
  { value: "Santa Fe", label: "Santa Fe" },
  { value: "Santiago del Estero", label: "Santiago del Estero" },
  { value: "Tierra del Fuego", label: "Tierra del Fuego" },
  { value: "Tucumán", label: "Tucumán" },
]

// Traduções
const traducoes: Record<string, Record<string, string>> = {
  pt: {
    cep: "CEP",
    codigoPostal: "Código Postal",
    zipCode: "Zip Code",
    endereco: "Endereço",
    numero: "Número",
    complemento: "Complemento",
    bairro: "Bairro",
    cidade: "Cidade",
    estado: "Estado",
    provincia: "Província",
    buscando: "Buscando...",
    opcional: "opcional",
  },
  es: {
    cep: "CEP",
    codigoPostal: "Código Postal",
    zipCode: "Zip Code",
    endereco: "Dirección",
    numero: "Número",
    complemento: "Complemento",
    bairro: "Barrio",
    cidade: "Ciudad",
    estado: "Estado",
    provincia: "Provincia",
    buscando: "Buscando...",
    opcional: "opcional",
  },
  en: {
    cep: "CEP",
    codigoPostal: "Postal Code",
    zipCode: "Zip Code",
    endereco: "Address",
    numero: "Number",
    complemento: "Apartment/Suite",
    bairro: "Neighborhood",
    cidade: "City",
    estado: "State",
    provincia: "Province",
    buscando: "Searching...",
    opcional: "optional",
  },
}

interface AddressStepProps {
  participant: ParticipantFormData
  idioma: string
  loadingCep: boolean
  onUpdate: (field: keyof ParticipantFormData, value: any) => void
  onCepBlur: (cep: string) => void
}

export function AddressStep({
  participant,
  idioma,
  loadingCep,
  onUpdate,
  onCepBlur,
}: AddressStepProps) {
  const t = (key: string) => traducoes[idioma]?.[key] || traducoes.pt[key] || key
  
  const isBrasil = participant.paisResidencia === "brasil"
  const isArgentina = participant.paisResidencia === "argentina"
  
  // Label do código postal
  const getCepLabel = () => {
    if (isBrasil) return t("cep")
    if (idioma === "en") return t("zipCode")
    return t("codigoPostal")
  }
  
  // Label do estado/província
  const getEstadoLabel = () => {
    if (isArgentina) return t("provincia")
    return t("estado")
  }
  
  // Lista de estados/províncias
  const getEstadoOptions = () => {
    if (isBrasil) return ESTADOS_BR
    if (isArgentina) return PROVINCIAS_AR
    return []
  }

  return (
    <div className="space-y-4">
      {/* CEP/Código Postal */}
      <div className="space-y-2">
        <Label>{getCepLabel()} {isBrasil ? "*" : ""}</Label>
        <div className="relative">
          <Input
            value={participant.cep}
            onChange={(e) => onUpdate("cep", formatCEP(e.target.value))}
            onBlur={() => isBrasil && participant.cep && onCepBlur(participant.cep)}
            placeholder={isBrasil ? "00000-000" : ""}
            className="pr-10"
          />
          {loadingCep && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* Endereço */}
      <div className="space-y-2">
        <Label>{t("endereco")} *</Label>
        <Input
          value={participant.endereco}
          onChange={(e) => onUpdate("endereco", e.target.value)}
          placeholder={
            idioma === "es" ? "Calle, Avenida..." : 
            idioma === "en" ? "Street, Avenue..." : 
            "Rua, Avenida..."
          }
        />
      </div>

      {/* Número e Complemento */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("numero")} *</Label>
          <Input
            value={participant.numero}
            onChange={(e) => onUpdate("numero", e.target.value)}
            placeholder="123"
          />
        </div>
        <div className="space-y-2">
          <Label>{t("complemento")} <span className="text-muted-foreground text-xs">({t("opcional")})</span></Label>
          <Input
            value={participant.complemento}
            onChange={(e) => onUpdate("complemento", e.target.value)}
            placeholder={idioma === "es" ? "Depto, Piso" : idioma === "en" ? "Apt, Floor" : "Apto, Bloco"}
          />
        </div>
      </div>

      {/* Bairro */}
      <div className="space-y-2">
        <Label>{t("bairro")} {isBrasil ? "*" : ""}</Label>
        <Input
          value={participant.bairro}
          onChange={(e) => onUpdate("bairro", e.target.value)}
          placeholder={idioma === "es" ? "Nombre del barrio" : idioma === "en" ? "Neighborhood name" : "Nome do bairro"}
        />
      </div>

      {/* Cidade e Estado */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("cidade")} *</Label>
          <Input
            value={participant.cidade}
            onChange={(e) => onUpdate("cidade", e.target.value)}
            placeholder={idioma === "es" ? "Ciudad" : idioma === "en" ? "City" : "Cidade"}
          />
        </div>
        <div className="space-y-2">
          <Label>{getEstadoLabel()} {(isBrasil || isArgentina) ? "*" : ""}</Label>
          {(isBrasil || isArgentina) ? (
            <Select 
              value={participant.estado} 
              onValueChange={(value) => onUpdate("estado", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={getEstadoLabel()} />
              </SelectTrigger>
              <SelectContent>
                {getEstadoOptions().map((estado) => (
                  <SelectItem key={estado.value} value={estado.value}>
                    {estado.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={participant.estado}
              onChange={(e) => onUpdate("estado", e.target.value)}
              placeholder={getEstadoLabel()}
            />
          )}
        </div>
      </div>
    </div>
  )
}
