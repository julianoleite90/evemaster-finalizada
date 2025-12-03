"use client"

import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, MapPin, DollarSign, FileText, CreditCard, Package } from "lucide-react"
import { NewEventFormData, MODALIDADES_ESPORTIVAS, DISTANCIAS_PADRAO } from "@/lib/schemas/new-event"
import { EditorLoader } from "@/components/ui/dynamic-loader"

// ReactQuill carregado dinamicamente para evitar problemas de SSR
const ReactQuill = dynamic(() => import("react-quill"), { 
  ssr: false,
  loading: () => <EditorLoader />
})
import "react-quill/dist/quill.snow.css"

interface ReviewStepProps {
  formData: NewEventFormData
  onUpdate: <K extends keyof NewEventFormData>(field: K, value: NewEventFormData[K]) => void
  onUpdatePayment: <K extends keyof NewEventFormData["meiosPagamento"]>(
    field: K,
    value: NewEventFormData["meiosPagamento"][K]
  ) => void
}

export function ReviewStep({
  formData,
  onUpdate,
  onUpdatePayment,
}: ReviewStepProps) {
  const getModalidadeLabel = (value: string) => {
    const mod = MODALIDADES_ESPORTIVAS.find((m) => m.value === value)
    return mod?.label || value
  }

  const getDistanciaLabel = (value: string) => {
    const dist = DISTANCIAS_PADRAO.find((d) => d.value === value)
    return dist?.label || value
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-"
    const date = new Date(dateStr + "T12:00:00")
    return date.toLocaleDateString("pt-BR")
  }

  return (
    <div className="space-y-6">
      {/* Resumo do Evento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Resumo do Evento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">{formData.nome || "Sem nome"}</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(formData.data)}
                  {formData.horarioInicio && ` às ${formData.horarioInicio}`}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {[formData.cidade, formData.estado].filter(Boolean).join(", ") || "Local não definido"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {formData.categoria && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Categoria:</span>
                  <Badge variant="secondary">{getModalidadeLabel(formData.categoria)}</Badge>
                </div>
              )}
              {formData.difficulty_level && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Dificuldade:</span>
                  <Badge variant="outline">{formData.difficulty_level}</Badge>
                </div>
              )}
              {formData.race_type && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Tipo:</span>
                  <Badge variant="outline">{formData.race_type}</Badge>
                </div>
              )}
            </div>
          </div>

          {/* Distâncias */}
          {(formData.distancias.length > 0 || formData.distanciasCustom.length > 0) && (
            <div>
              <span className="text-sm text-muted-foreground">Distâncias:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {formData.distancias
                  .filter((d) => d !== "custom")
                  .map((d) => (
                    <Badge key={d} variant="secondary">
                      {getDistanciaLabel(d)}
                    </Badge>
                  ))}
                {formData.distanciasCustom.map((d) => (
                  <Badge key={d} variant="secondary">
                    {d}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo dos Lotes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            Lotes e Ingressos ({formData.lotes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {formData.lotes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum lote configurado
            </p>
          ) : (
            <div className="space-y-4">
              {formData.lotes.map((lote, index) => (
                <div key={lote.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{lote.nome}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant={lote.salvo ? "default" : "destructive"}>
                        {lote.salvo ? "Salvo" : "Não salvo"}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Início: {formatDate(lote.dataInicio)}
                    {lote.horaInicio && ` às ${lote.horaInicio}`}
                  </p>
                  <div className="space-y-1">
                    {lote.ingressos.map((ing, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span>{ing.categoria || `Ingresso ${i + 1}`}</span>
                        <span className="font-medium">
                          {ing.gratuito ? "Grátis" : `R$ ${ing.valor || "0"}`}
                        </span>
                      </div>
                    ))}
                    {lote.ingressos.length === 0 && (
                      <p className="text-sm text-muted-foreground">Nenhum ingresso</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Meios de Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Meios de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={formData.meiosPagamento.pix}
                onCheckedChange={(checked) => onUpdatePayment("pix", !!checked)}
              />
              <span>PIX</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={formData.meiosPagamento.cartaoCredito}
                onCheckedChange={(checked) => onUpdatePayment("cartaoCredito", !!checked)}
              />
              <span>Cartão de Crédito</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={formData.meiosPagamento.boleto}
                onCheckedChange={(checked) => onUpdatePayment("boleto", !!checked)}
              />
              <span>Boleto</span>
            </label>
          </div>

          <Separator />

          {/* Parcelamento */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={formData.meiosPagamento.parcelamento.habilitado}
                onCheckedChange={(checked) =>
                  onUpdatePayment("parcelamento", {
                    ...formData.meiosPagamento.parcelamento,
                    habilitado: !!checked,
                  })
                }
              />
              <span>Habilitar parcelamento</span>
            </label>

            {formData.meiosPagamento.parcelamento.habilitado && (
              <div className="ml-6 space-y-3 p-3 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm">Máximo de parcelas</Label>
                    <Input
                      type="number"
                      min="2"
                      max="12"
                      value={formData.meiosPagamento.parcelamento.maxParcelas}
                      onChange={(e) =>
                        onUpdatePayment("parcelamento", {
                          ...formData.meiosPagamento.parcelamento,
                          maxParcelas: parseInt(e.target.value) || 12,
                        })
                      }
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <Checkbox
                    checked={formData.meiosPagamento.parcelamento.assumirJuros}
                    onCheckedChange={(checked) =>
                      onUpdatePayment("parcelamento", {
                        ...formData.meiosPagamento.parcelamento,
                        assumirJuros: !!checked,
                      })
                    }
                  />
                  <span>Assumir juros do parcelamento</span>
                </label>
              </div>
            )}
          </div>

          <Separator />

          {/* Taxa de administração */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-sm">Taxa de serviço (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="30"
                  value={formData.meiosPagamento.taxaAdministracao.percentual}
                  onChange={(e) =>
                    onUpdatePayment("taxaAdministracao", {
                      ...formData.meiosPagamento.taxaAdministracao,
                      percentual: parseInt(e.target.value) || 10,
                    })
                  }
                />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <Checkbox
                checked={formData.meiosPagamento.taxaAdministracao.assumirTaxa}
                onCheckedChange={(checked) =>
                  onUpdatePayment("taxaAdministracao", {
                    ...formData.meiosPagamento.taxaAdministracao,
                    assumirTaxa: !!checked,
                  })
                }
              />
              <span>Assumir taxa de serviço (não cobrar do participante)</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Descrição */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Descrição do Evento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="min-h-[200px]">
            <ReactQuill
              theme="snow"
              value={formData.descricao}
              onChange={(value) => onUpdate("descricao", value)}
              placeholder="Descreva seu evento..."
              modules={{
                toolbar: [
                  [{ header: [1, 2, 3, false] }],
                  ["bold", "italic", "underline", "strike"],
                  [{ list: "ordered" }, { list: "bullet" }],
                  ["link"],
                  ["clean"],
                ],
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

