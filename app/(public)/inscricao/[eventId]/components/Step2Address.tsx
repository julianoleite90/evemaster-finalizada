"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Participante, Idioma } from "../types"
import { formatCEP } from "../utils"

interface Step2AddressProps {
  participante: Participante
  currentParticipante: number
  loadingCep: boolean
  idioma: Idioma
  t: (key: string) => string
  updateParticipante: (field: keyof Participante, value: string) => void
  buscarCep: (cep: string, index: number) => void
}

export function Step2Address({
  participante,
  currentParticipante,
  loadingCep,
  idioma,
  t,
  updateParticipante,
  buscarCep,
}: Step2AddressProps) {
  const isBrasil = participante.paisResidencia === "brasil"
  const isArgentina = participante.paisResidencia === "argentina"

  const getLabel = (pt: string, es: string, en: string) => {
    if (idioma === "es") return es
    if (idioma === "en") return en
    return pt
  }

  return (
    <div className="space-y-4">
      {/* CEP apenas para Brasil */}
      {isBrasil ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cep">CEP *</Label>
              <Input
                id="cep"
                inputMode="numeric"
                value={participante.cep}
                onChange={(e) => updateParticipante("cep", formatCEP(e.target.value))}
                onBlur={(e) => buscarCep(e.target.value, currentParticipante)}
                placeholder="00000-000"
                disabled={loadingCep}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">{getLabel("Estado", "Estado", "State")}</Label>
              <Input
                id="estado"
                value={participante.estado}
                onChange={(e) => updateParticipante("estado", e.target.value)}
                placeholder="UF"
                disabled={loadingCep}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cidade">{getLabel("Cidade", "Ciudad", "City")}</Label>
              <Input
                id="cidade"
                value={participante.cidade}
                onChange={(e) => updateParticipante("cidade", e.target.value)}
                placeholder={getLabel("Cidade", "Ciudad", "City")}
                disabled={loadingCep}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bairro">{getLabel("Bairro", "Barrio", "Neighborhood")}</Label>
              <Input
                id="bairro"
                value={participante.bairro}
                onChange={(e) => updateParticipante("bairro", e.target.value)}
                placeholder={getLabel("Bairro", "Barrio", "Neighborhood")}
                disabled={loadingCep}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco">{getLabel("Endereço", "Dirección", "Address")}</Label>
            <Input
              id="endereco"
              value={participante.endereco}
              onChange={(e) => updateParticipante("endereco", e.target.value)}
              placeholder="Rua, Avenida..."
              disabled={loadingCep}
            />
          </div>
        </>
      ) : (
        <>
          {/* Endereço para outros países */}
          <div className="space-y-2">
            <Label htmlFor="endereco">{getLabel("Endereço", "Dirección", "Address")} *</Label>
            <Input
              id="endereco"
              value={participante.endereco}
              onChange={(e) => updateParticipante("endereco", e.target.value)}
              placeholder={isArgentina ? "Calle, Avenida..." : getLabel("Rua, Avenida...", "Calle, Avenida...", "Street, Avenue...")}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cidade">{getLabel("Cidade", "Ciudad", "City")} *</Label>
              <Input
                id="cidade"
                value={participante.cidade}
                onChange={(e) => updateParticipante("cidade", e.target.value)}
                placeholder={getLabel("Cidade", "Ciudad", "City")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">
                {isArgentina ? "Provincia" : getLabel("Estado", "Estado/Provincia", "State/Province")}
              </Label>
              <Input
                id="estado"
                value={participante.estado}
                onChange={(e) => updateParticipante("estado", e.target.value)}
                placeholder={isArgentina ? "Provincia" : getLabel("Estado", "Estado/Provincia", "State/Province")}
              />
            </div>
          </div>

          {/* Código Postal para Argentina */}
          {isArgentina && (
            <div className="space-y-2">
              <Label htmlFor="cep">Código Postal</Label>
              <Input
                id="cep"
                value={participante.cep}
                onChange={(e) => updateParticipante("cep", e.target.value)}
                placeholder="Ej: C1425"
              />
            </div>
          )}
        </>
      )}

      {/* Número e Complemento - comum a todos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="numero">{getLabel("Número", "Número", "Number")} *</Label>
          <Input
            id="numero"
            inputMode="numeric"
            value={participante.numero}
            onChange={(e) => updateParticipante("numero", e.target.value)}
            placeholder="Nº"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="complemento">{getLabel("Complemento", "Depto/Piso", "Apt/Suite")}</Label>
          <Input
            id="complemento"
            value={participante.complemento}
            onChange={(e) => updateParticipante("complemento", e.target.value)}
            placeholder={getLabel("Apto, Bloco...", "Depto, Piso...", "Apt, Suite...")}
          />
        </div>
      </div>
    </div>
  )
}

