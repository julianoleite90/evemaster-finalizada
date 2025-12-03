"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { QrCode, CreditCard, FileText, Info } from "lucide-react"
import { Participante, TAMANHOS_CAMISETA, Idioma } from "../types"
import { formatTelefone } from "../utils"

interface Ingresso {
  kitItems?: string[]
  shirtSizes?: string[]
}

interface Step3PaymentAndTermsProps {
  participante: Participante
  participantes: Participante[]
  currentParticipante: number
  usuarioLogado: any
  salvarPerfil: { [key: number]: boolean }
  setSalvarPerfil: (value: { [key: number]: boolean }) => void
  temCamiseta: boolean
  ingresso?: Ingresso
  meioPagamento: string
  setMeioPagamento: (value: string) => void
  isGratuito: boolean
  idioma: Idioma
  isBrasil: boolean
  t: (key: string) => string
  updateParticipante: (field: keyof Participante, value: string) => void
  setParticipantes: (participantes: Participante[]) => void
  salvarPerfilParticipante: (index: number) => void
}

export function Step3PaymentAndTerms({
  participante,
  participantes,
  currentParticipante,
  usuarioLogado,
  salvarPerfil,
  setSalvarPerfil,
  temCamiseta,
  ingresso,
  meioPagamento,
  setMeioPagamento,
  isGratuito,
  idioma,
  isBrasil,
  t,
  updateParticipante,
  setParticipantes,
  salvarPerfilParticipante,
}: Step3PaymentAndTermsProps) {
  const getLabel = (pt: string, es: string, en: string) => {
    if (idioma === "es") return es
    if (idioma === "en") return en
    return pt
  }

  const handleAceiteChange = (checked: boolean) => {
    const novosParticipantes = [...participantes]
    novosParticipantes[currentParticipante] = {
      ...novosParticipantes[currentParticipante],
      aceiteTermo: checked,
    }
    setParticipantes(novosParticipantes)
  }

  return (
    <div className="space-y-6">
      {/* Opção de salvar perfil para participantes adicionais (2+) */}
      {participantes.length > 1 && currentParticipante > 0 && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`salvar-perfil-${currentParticipante}`}
              checked={salvarPerfil[currentParticipante] || false}
              onCheckedChange={(checked) => {
                setSalvarPerfil({ ...salvarPerfil, [currentParticipante]: checked === true })
                if (checked) {
                  salvarPerfilParticipante(currentParticipante)
                }
              }}
            />
            <Label htmlFor={`salvar-perfil-${currentParticipante}`} className="text-sm font-medium cursor-pointer">
              Salvar este perfil para usar em inscrições futuras?
            </Label>
          </div>
          <p className="text-xs text-gray-500 mt-1 ml-6">
            {usuarioLogado 
              ? "Os dados deste participante serão salvos no seu perfil para facilitar próximas inscrições"
              : "Os dados serão salvos no perfil do participante principal para facilitar próximas inscrições"}
          </p>
        </div>
      )}

      {/* Nome Contato de Emergência */}
      <div className="space-y-2">
        <Label htmlFor="contato-emergencia-nome">
          {getLabel("Nome do Contato de Emergência", "Nombre del Contacto de Emergencia", "Emergency Contact Name")} *
        </Label>
        <Input
          id="contato-emergencia-nome"
          value={participante.contatoEmergenciaNome}
          onChange={(e) => updateParticipante("contatoEmergenciaNome", e.target.value)}
          placeholder={getLabel("Nome completo", "Nombre completo", "Full name")}
        />
      </div>

      {/* Telefone Contato de Emergência */}
      <div className="space-y-2">
        <Label htmlFor="contato-emergencia-telefone">
          {getLabel("Telefone do Contato de Emergência", "Teléfono del Contacto de Emergencia", "Emergency Contact Phone")} *
        </Label>
        <Input
          id="contato-emergencia-telefone"
          inputMode="tel"
          value={participante.contatoEmergenciaTelefone}
          onChange={(e) => {
            const formatted = isBrasil ? formatTelefone(e.target.value) : e.target.value
            updateParticipante("contatoEmergenciaTelefone", formatted)
          }}
          placeholder={isBrasil ? "(00) 00000-0000" : "+00 000 000 0000"}
        />
      </div>

      {/* Tamanho da Camiseta (se houver kit com camiseta) */}
      {temCamiseta && ingresso?.kitItems?.includes("camiseta") && (
        <div className="space-y-2">
          <Label>{t("tamanhoCamiseta")} *</Label>
          <div className="flex flex-wrap gap-2">
            {(ingresso.shirtSizes && ingresso.shirtSizes.length > 0 ? ingresso.shirtSizes : TAMANHOS_CAMISETA).map((tamanho: string) => (
              <Button
                key={tamanho}
                type="button"
                variant={participante.tamanhoCamiseta === tamanho ? "default" : "outline"}
                size="sm"
                onClick={() => updateParticipante("tamanhoCamiseta", tamanho)}
                className={participante.tamanhoCamiseta === tamanho ? "bg-[#156634] text-white hover:bg-[#1a7a3e]" : ""}
              >
                {tamanho}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Termo de Responsabilidade */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Checkbox
            id={`aceite-${currentParticipante}`}
            checked={participante.aceiteTermo}
            onCheckedChange={(checked) => handleAceiteChange(checked === true)}
            className="mt-1"
          />
          <div className="flex-1">
            <Label 
              htmlFor={`aceite-${currentParticipante}`} 
              className="text-sm font-medium cursor-pointer flex items-center gap-2"
            >
              {t("liAceito")} *
              <Dialog>
                <DialogTrigger asChild>
                  <button type="button" className="text-blue-600 hover:text-blue-800">
                    <Info className="h-4 w-4" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t("termoResponsabilidade")}</DialogTitle>
                  </DialogHeader>
                  <div className="text-sm text-gray-600 space-y-3">
                    <p>
                      {getLabel(
                        "Declaro que estou ciente de que a prática esportiva envolve riscos inerentes à atividade física.",
                        "Declaro estar consciente de que la práctica deportiva implica riesgos inherentes a la actividad física.",
                        "I declare that I am aware that sports practice involves risks inherent to physical activity."
                      )}
                    </p>
                    <p>
                      {getLabel(
                        "Atesto estar em plenas condições de saúde para participar deste evento, tendo realizado exames médicos e obtido liberação para a prática esportiva.",
                        "Certifico estar en plenas condiciones de salud para participar en este evento, habiendo realizado exámenes médicos y obtenido autorización para la práctica deportiva.",
                        "I certify that I am in full health condition to participate in this event, having undergone medical examinations and obtained clearance for sports practice."
                      )}
                    </p>
                    <p>
                      {getLabel(
                        "Isento os organizadores de quaisquer responsabilidades por acidentes ou problemas de saúde decorrentes da minha participação.",
                        "Eximo a los organizadores de cualquier responsabilidad por accidentes o problemas de salud derivados de mi participación.",
                        "I exempt the organizers from any liability for accidents or health problems arising from my participation."
                      )}
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </Label>
          </div>
        </div>
      </div>

      {/* Meios de Pagamento (se não for gratuito) */}
      {!isGratuito && (
        <div className="space-y-4 pt-2">
          <Label className="text-base font-semibold">{t("formaPagamento")} *</Label>
          <RadioGroup
            value={meioPagamento}
            onValueChange={setMeioPagamento}
            className="space-y-3"
          >
            <div className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${meioPagamento === "pix" ? "border-[#156634] bg-green-50" : ""}`}>
              <RadioGroupItem value="pix" id="pix" />
              <Label htmlFor="pix" className="flex items-center gap-3 cursor-pointer flex-1">
                <QrCode className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">{t("pix")}</p>
                  <p className="text-xs text-muted-foreground">{t("pagamentoInstantaneo")}</p>
                </div>
              </Label>
            </div>
            <div className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${meioPagamento === "cartao" ? "border-[#156634] bg-green-50" : ""}`}>
              <RadioGroupItem value="cartao" id="cartao" />
              <Label htmlFor="cartao" className="flex items-center gap-3 cursor-pointer flex-1">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">{t("cartaoCredito")}</p>
                  <p className="text-xs text-muted-foreground">{t("parceleAte")}</p>
                </div>
              </Label>
            </div>
            <div className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${meioPagamento === "boleto" ? "border-[#156634] bg-green-50" : ""}`}>
              <RadioGroupItem value="boleto" id="boleto" />
              <Label htmlFor="boleto" className="flex items-center gap-3 cursor-pointer flex-1">
                <FileText className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium">{t("boleto")}</p>
                  <p className="text-xs text-muted-foreground">{t("vencimento")}</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>
      )}
    </div>
  )
}

