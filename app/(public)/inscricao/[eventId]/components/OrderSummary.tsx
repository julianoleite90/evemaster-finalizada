"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Participante, participanteVazio } from "../types"

interface IngressoSelecionado {
  id: string
  categoria: string
  valor: number
  gratuito?: boolean
  possuiKit?: boolean
  itensKit?: string[]
}

interface RunningClub {
  name?: string
  base_discount: number
  progressive_discount_threshold?: number
  progressive_discount_value?: number
}

interface OrderSummaryProps {
  eventData: {
    name: string
    event_date?: string
    location?: string
  }
  ingresso?: {
    categoria: string
  }
  ingressosSelecionados: IngressoSelecionado[]
  participantes: Participante[]
  runningClub?: RunningClub | null
  subtotal: number
  desconto: number
  taxa: number
  total: number
  isGratuito: boolean
  isBrasil: boolean
  idioma: "pt" | "es" | "en"
  salvarPerfil: { [key: number]: boolean }
  onSalvarPerfilChange: (index: number, checked: boolean) => void
  t: (key: string) => string
}

export function OrderSummary({
  eventData,
  ingresso,
  ingressosSelecionados,
  participantes,
  runningClub,
  subtotal,
  desconto,
  taxa,
  total,
  isGratuito,
  isBrasil,
  idioma,
  salvarPerfil,
  onSalvarPerfilChange,
  t,
}: OrderSummaryProps) {
  return (
    <Card className="sticky top-4 min-h-[400px] flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg">{t("resumoInscricao")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
          <div className="space-y-1">
            <p className="font-medium text-gray-900">{eventData?.name}</p>
            <p className="text-sm text-muted-foreground">
              {eventData?.event_date && (() => {
                const [year, month, day] = eventData.event_date.split('-').map(Number)
                const date = new Date(year, month - 1, day)
                return date.toLocaleDateString(idioma === "en" ? "en-US" : idioma === "es" ? "es-AR" : "pt-BR")
              })()}
            </p>
            {eventData?.location && (
              <p className="text-sm text-muted-foreground">
                {eventData.location}
              </p>
            )}
            {ingresso && (
              <p className="text-xs text-[#156634] font-semibold">
                {t("categoria")}: {ingresso.categoria}
              </p>
            )}
          </div>

          <Separator />

          <div className="space-y-3 flex-1">
            {runningClub && runningClub.base_discount > 0 && (
              <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-md">
                <p className="text-xs font-semibold text-green-700">
                  🏃 {idioma === "es" ? "Descuento de Clube de Corrida aplicado" : idioma === "en" ? "Running Club discount applied" : "Desconto de Clube de Corrida aplicado"}
                </p>
                <p className="text-xs text-green-600">
                  {runningClub.name || "Clube de Corrida"} - {runningClub.base_discount}%
                  {runningClub.progressive_discount_threshold && ingressosSelecionados.length >= runningClub.progressive_discount_threshold
                    ? ` + ${runningClub.progressive_discount_value}%`
                    : ""}
                </p>
              </div>
            )}
            {ingressosSelecionados.map((ing, i) => {
              const participanteResumo = participantes[i] || participantes[0] || participanteVazio
              // Calcular valor com desconto para exibição
              let valorExibicao = ing.valor
              if (runningClub && runningClub.base_discount > 0) {
                let descontoIngresso = (ing.valor * runningClub.base_discount) / 100
                if (runningClub.progressive_discount_threshold && 
                    runningClub.progressive_discount_value &&
                    ingressosSelecionados.length >= runningClub.progressive_discount_threshold) {
                  descontoIngresso += (ing.valor * runningClub.progressive_discount_value) / 100
                }
                valorExibicao = Math.max(0, ing.valor - descontoIngresso)
              }
              return (
                <div key={i} className="border rounded-md p-3 text-sm space-y-2">
                  <div className="flex items-center justify-between font-medium">
                    <span>{ing.categoria}</span>
                    <div className="text-right">
                      {ing.valor !== valorExibicao && (
                        <span className="text-xs text-muted-foreground line-through mr-1">
                          {isBrasil ? "R$" : "$"} {ing.valor.toFixed(2)}
                        </span>
                      )}
                      <span className={ing.valor !== valorExibicao ? "text-green-600" : ""}>
                        {ing.valor === 0 || ing.gratuito ? (isBrasil ? "R$ 0,00" : "$ 0.00") : `${isBrasil ? "R$" : "$"} ${valorExibicao.toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("participante")}:{" "}
                    <span className="text-foreground">{participanteResumo?.nome || t("participante")}</span>
                  </p>
                  {participanteResumo?.tamanhoCamiseta && (
                    <p className="text-xs text-muted-foreground">
                      {t("tamanhoCamiseta")}:{" "}
                      <span className="text-foreground">{participanteResumo.tamanhoCamiseta}</span>
                    </p>
                  )}
                  {ing.possuiKit && ing.itensKit && ing.itensKit.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Kit: <span className="text-foreground">{ing.itensKit.join(", ")}</span>
                    </p>
                  )}
                  {/* Checkbox para salvar participante adicional */}
                  {i > 0 && participanteResumo?.nome && participanteResumo?.cpf && (
                    <div className="pt-1 border-t border-dashed">
                      <label className="flex items-start gap-2 cursor-pointer">
                        <Checkbox
                          checked={salvarPerfil[i] || false}
                          onCheckedChange={(checked) => {
                            onSalvarPerfilChange(i, checked === true)
                          }}
                          className="mt-0.5"
                        />
                        <span className="text-xs text-gray-600 leading-tight">
                          Salvar <strong>{participanteResumo.nome.split(' ')[0]}</strong> para inscrições futuras
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("subtotal")}</span>
              <span>{isBrasil ? "R$" : "$"} {subtotal.toFixed(2)}</span>
            </div>
            {desconto > 0 && runningClub && (
              <div className="flex justify-between text-green-600">
                <span className="text-muted-foreground">
                  {idioma === "es" ? "Descuento" : idioma === "en" ? "Discount" : "Desconto"}
                  {runningClub.progressive_discount_threshold && ingressosSelecionados.length >= runningClub.progressive_discount_threshold
                    ? ` (${runningClub.base_discount}% + ${runningClub.progressive_discount_value}%)`
                    : ` (${runningClub.base_discount}%)`}
                </span>
                <span className="font-semibold">-{isBrasil ? "R$" : "$"} {desconto.toFixed(2)}</span>
              </div>
            )}
            {!isGratuito && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("taxaServico")}</span>
                <span>{isBrasil ? "R$" : "$"} {taxa.toFixed(2)}</span>
              </div>
            )}
          </div>

          <Separator />

          <div className="flex justify-between font-bold">
            <span>{t("total")}</span>
            <span className="text-[#156634]">
              {isBrasil ? "R$" : "$"} {total.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>
  )
}

