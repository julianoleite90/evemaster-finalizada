"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CreditCard, QrCode, FileText } from "lucide-react"
import { ParticipantFormData, formatTelefone, TAMANHOS_CAMISETA } from "@/lib/schemas/checkout"

// Traduções
const traducoes: Record<string, Record<string, string>> = {
  pt: {
    tamanhoCamiseta: "Tamanho da camiseta",
    contatoEmergencia: "Contato de Emergência",
    nomeContato: "Nome do contato",
    telefoneContato: "Telefone do contato",
    termoResponsabilidade: "Li e aceito o termo de responsabilidade",
    verTermo: "Ver termo completo",
    formaPagamento: "Forma de Pagamento",
    pix: "PIX",
    pixDesc: "Pagamento instantâneo",
    cartaoCredito: "Cartão de Crédito",
    cartaoDesc: "Parcelamento disponível",
    boleto: "Boleto Bancário",
    boletoDesc: "Vencimento em 3 dias",
    salvarPerfil: "Salvar este participante para próximas inscrições",
    termoTitulo: "Termo de Responsabilidade",
    termoTexto: `TERMO DE RESPONSABILIDADE E AUTORIZAÇÃO

Declaro que:

1. Estou em plenas condições físicas e de saúde para participar do evento.

2. Assumo total responsabilidade pela minha participação, isentando os organizadores de qualquer responsabilidade civil ou criminal por acidentes que possam ocorrer durante o evento.

3. Autorizo o uso de minha imagem em fotos e vídeos para divulgação do evento.

4. Comprometo-me a respeitar as regras do evento e as orientações dos organizadores.

5. Tenho ciência de que devo portar documento de identificação com foto durante o evento.

6. Autorizo o recebimento de comunicações relacionadas ao evento por e-mail e WhatsApp.

Ao marcar esta opção, confirmo que li, compreendi e aceito todos os termos acima.`,
  },
  es: {
    tamanhoCamiseta: "Talla de la camiseta",
    contatoEmergencia: "Contacto de Emergencia",
    nomeContato: "Nombre del contacto",
    telefoneContato: "Teléfono del contacto",
    termoResponsabilidade: "He leído y acepto el término de responsabilidad",
    verTermo: "Ver término completo",
    formaPagamento: "Forma de Pago",
    pix: "PIX",
    pixDesc: "Pago instantáneo",
    cartaoCredito: "Tarjeta de Crédito",
    cartaoDesc: "Cuotas disponibles",
    boleto: "Boleto Bancario",
    boletoDesc: "Vencimiento en 3 días",
    salvarPerfil: "Guardar este participante para próximas inscripciones",
    termoTitulo: "Término de Responsabilidad",
    termoTexto: `TÉRMINO DE RESPONSABILIDAD Y AUTORIZACIÓN

Declaro que:

1. Estoy en plenas condiciones físicas y de salud para participar del evento.

2. Asumo total responsabilidad por mi participación, eximiendo a los organizadores de cualquier responsabilidad civil o criminal por accidentes que puedan ocurrir durante el evento.

3. Autorizo el uso de mi imagen en fotos y videos para divulgación del evento.

4. Me comprometo a respetar las reglas del evento y las orientaciones de los organizadores.

5. Tengo conocimiento de que debo portar documento de identificación con foto durante el evento.

6. Autorizo la recepción de comunicaciones relacionadas al evento por e-mail y WhatsApp.

Al marcar esta opción, confirmo que leí, comprendí y acepto todos los términos anteriores.`,
  },
  en: {
    tamanhoCamiseta: "T-shirt size",
    contatoEmergencia: "Emergency Contact",
    nomeContato: "Contact name",
    telefoneContato: "Contact phone",
    termoResponsabilidade: "I have read and accept the liability waiver",
    verTermo: "View full waiver",
    formaPagamento: "Payment Method",
    pix: "PIX",
    pixDesc: "Instant payment",
    cartaoCredito: "Credit Card",
    cartaoDesc: "Installments available",
    boleto: "Bank Slip",
    boletoDesc: "Due in 3 days",
    salvarPerfil: "Save this participant for future registrations",
    termoTitulo: "Liability Waiver",
    termoTexto: `LIABILITY WAIVER AND AUTHORIZATION

I declare that:

1. I am in full physical and health condition to participate in the event.

2. I assume full responsibility for my participation, releasing the organizers from any civil or criminal liability for accidents that may occur during the event.

3. I authorize the use of my image in photos and videos for event promotion.

4. I commit to respecting the event rules and organizers' guidelines.

5. I am aware that I must carry a photo ID during the event.

6. I authorize receiving event-related communications via email and WhatsApp.

By checking this option, I confirm that I have read, understood and accept all the above terms.`,
  },
}

interface PaymentStepProps {
  participant: ParticipantFormData
  participantIndex?: number
  idioma: string
  temCamiseta: boolean
  temKit: boolean
  isGratuito: boolean
  meioPagamento: string
  showSalvarPerfil?: boolean
  salvarPerfilChecked?: boolean
  onUpdate: (field: keyof ParticipantFormData, value: any) => void
  onMeioPagamentoChange: (value: string) => void
  onSalvarPerfilChange?: (checked: boolean) => void
}

export function PaymentStep({
  participant,
  participantIndex = 0,
  idioma,
  temCamiseta,
  temKit,
  isGratuito,
  meioPagamento,
  showSalvarPerfil = false,
  salvarPerfilChecked = false,
  onUpdate,
  onMeioPagamentoChange,
  onSalvarPerfilChange,
}: PaymentStepProps) {
  const t = (key: string) => traducoes[idioma]?.[key] || traducoes.pt[key] || key

  return (
    <div className="space-y-6">
      {/* Tamanho da camiseta */}
      {temCamiseta && (
        <div className="space-y-2">
          <Label>{t("tamanhoCamiseta")} *</Label>
          <Select 
            value={participant.tamanhoCamiseta} 
            onValueChange={(value) => onUpdate("tamanhoCamiseta", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("tamanhoCamiseta")} />
            </SelectTrigger>
            <SelectContent>
              {TAMANHOS_CAMISETA.map((tamanho) => (
                <SelectItem key={tamanho} value={tamanho}>
                  {tamanho}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Contato de emergência */}
      <div className="space-y-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
        <h4 className="font-medium text-orange-800">{t("contatoEmergencia")}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t("nomeContato")} *</Label>
            <Input
              value={participant.contatoEmergenciaNome}
              onChange={(e) => onUpdate("contatoEmergenciaNome", e.target.value)}
              placeholder={idioma === "es" ? "Nombre completo" : idioma === "en" ? "Full name" : "Nome completo"}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("telefoneContato")} *</Label>
            <Input
              value={participant.contatoEmergenciaTelefone}
              onChange={(e) => onUpdate("contatoEmergenciaTelefone", formatTelefone(e.target.value))}
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>
      </div>

      {/* Termo de responsabilidade */}
      <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-start gap-3">
          <Checkbox
            id="termo"
            checked={participant.aceiteTermo}
            onCheckedChange={(checked) => onUpdate("aceiteTermo", checked)}
          />
          <div className="flex-1">
            <label 
              htmlFor="termo" 
              className="text-sm cursor-pointer leading-relaxed"
            >
              {t("termoResponsabilidade")} *
            </label>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="link" className="h-auto p-0 text-xs text-blue-600">
                  {t("verTermo")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t("termoTitulo")}</DialogTitle>
                </DialogHeader>
                <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {t("termoTexto")}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Forma de pagamento */}
      {!isGratuito && (
        <div className="space-y-3">
          <Label>{t("formaPagamento")} *</Label>
          <RadioGroup value={meioPagamento} onValueChange={onMeioPagamentoChange}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* PIX */}
              <label 
                className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  meioPagamento === "pix" 
                    ? "border-[#156634] bg-green-50" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <RadioGroupItem value="pix" id="pix" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-[#156634]" />
                    <span className="font-medium">{t("pix")}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{t("pixDesc")}</p>
                </div>
              </label>

              {/* Cartão */}
              <label 
                className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  meioPagamento === "credit_card" 
                    ? "border-[#156634] bg-green-50" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <RadioGroupItem value="credit_card" id="credit_card" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">{t("cartaoCredito")}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{t("cartaoDesc")}</p>
                </div>
              </label>

              {/* Boleto */}
              <label 
                className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  meioPagamento === "boleto" 
                    ? "border-[#156634] bg-green-50" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <RadioGroupItem value="boleto" id="boleto" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-600" />
                    <span className="font-medium">{t("boleto")}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{t("boletoDesc")}</p>
                </div>
              </label>
            </div>
          </RadioGroup>
        </div>
      )}

      {/* Salvar perfil */}
      {showSalvarPerfil && participantIndex > 0 && (
        <div className="flex items-center gap-3 pt-2">
          <Checkbox
            id="salvarPerfil"
            checked={salvarPerfilChecked}
            onCheckedChange={(checked) => onSalvarPerfilChange?.(!!checked)}
          />
          <label htmlFor="salvarPerfil" className="text-sm cursor-pointer">
            {t("salvarPerfil")}
          </label>
        </div>
      )}
    </div>
  )
}
