"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Save, Edit, Package, ChevronDown, ChevronUp, DollarSign, Upload } from "lucide-react"
import {
  NewEventFormData,
  BatchFormData,
  TicketFormData,
  TAMANHOS_CAMISETA,
  ITENS_KIT,
} from "@/lib/schemas/new-event"

interface BatchesTicketsStepProps {
  formData: NewEventFormData
  lotesExpandidos: { [loteId: string]: boolean }
  onAddLote: () => void
  onUpdateLote: (loteId: string, updates: Partial<BatchFormData>) => void
  onRemoveLote: (loteId: string) => void
  onToggleLoteExpandido: (loteId: string) => void
  onSalvarLote: (loteId: string) => void
  onAddIngresso: (loteId: string) => void
  onUpdateIngresso: (loteId: string, ingressoIndex: number, updates: Partial<TicketFormData>) => void
  onRemoveIngresso: (loteId: string, ingressoIndex: number) => void
}

export function BatchesTicketsStep({
  formData,
  lotesExpandidos,
  onAddLote,
  onUpdateLote,
  onRemoveLote,
  onToggleLoteExpandido,
  onSalvarLote,
  onAddIngresso,
  onUpdateIngresso,
  onRemoveIngresso,
}: BatchesTicketsStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Lotes e Ingressos</h2>
        <Button onClick={onAddLote}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Lote
        </Button>
      </div>

      {formData.lotes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum lote criado ainda</p>
            <p className="text-sm text-muted-foreground mb-4">
              Crie lotes para organizar a venda de ingressos
            </p>
            <Button onClick={onAddLote}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Lote
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {formData.lotes.map((lote, loteIndex) => (
            <Card key={lote.id} className={lote.salvo ? "border-green-200" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">
                      {lote.nome || `Lote ${loteIndex + 1}`}
                    </CardTitle>
                    {lote.salvo && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Salvo
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {lote.salvo ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateLote(lote.id, { salvo: false })}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onSalvarLote(lote.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Salvar
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleLoteExpandido(lote.id)}
                    >
                      {lotesExpandidos[lote.id] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveLote(lote.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {lotesExpandidos[lote.id] && (
                <CardContent className="space-y-6">
                  {/* Informações do Lote */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Nome do Lote *</Label>
                      <Input
                        value={lote.nome}
                        onChange={(e) => onUpdateLote(lote.id, { nome: e.target.value })}
                        placeholder="Ex: Lote Promocional"
                        disabled={lote.salvo}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data de Início *</Label>
                      <Input
                        type="date"
                        value={lote.dataInicio}
                        onChange={(e) => onUpdateLote(lote.id, { dataInicio: e.target.value })}
                        disabled={lote.salvo}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Hora de Início</Label>
                      <Input
                        type="time"
                        value={lote.horaInicio}
                        onChange={(e) => onUpdateLote(lote.id, { horaInicio: e.target.value })}
                        disabled={lote.salvo}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quantidade Total</Label>
                      <Input
                        type="number"
                        value={lote.quantidadeTotal}
                        onChange={(e) => onUpdateLote(lote.id, { quantidadeTotal: e.target.value })}
                        placeholder="Ilimitado"
                        disabled={lote.salvo}
                      />
                    </div>
                  </div>

                  {/* Ingressos */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Ingressos do Lote</h4>
                      {!lote.salvo && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onAddIngresso(lote.id)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar Ingresso
                        </Button>
                      )}
                    </div>

                    {lote.ingressos.length === 0 ? (
                      <div className="text-center py-6 border-2 border-dashed rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Nenhum ingresso adicionado
                        </p>
                        {!lote.salvo && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => onAddIngresso(lote.id)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Adicionar Primeiro Ingresso
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {lote.ingressos.map((ingresso, ingressoIndex) => (
                          <IngressoCard
                            key={ingressoIndex}
                            loteId={lote.id}
                            ingresso={ingresso}
                            ingressoIndex={ingressoIndex}
                            disabled={lote.salvo}
                            onUpdate={(updates) => onUpdateIngresso(lote.id, ingressoIndex, updates)}
                            onRemove={() => onRemoveIngresso(lote.id, ingressoIndex)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// Componente separado para cada ingresso
interface IngressoCardProps {
  loteId: string
  ingresso: TicketFormData
  ingressoIndex: number
  disabled: boolean
  onUpdate: (updates: Partial<TicketFormData>) => void
  onRemove: () => void
}

function IngressoCard({
  ingresso,
  ingressoIndex,
  disabled,
  onUpdate,
  onRemove,
}: IngressoCardProps) {
  return (
    <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
      <div className="flex items-center justify-between">
        <h5 className="font-medium text-sm">
          Ingresso {ingressoIndex + 1}: {ingresso.categoria || "Sem nome"}
        </h5>
        {!disabled && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Categoria e Valor */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Categoria *</Label>
          <Input
            value={ingresso.categoria}
            onChange={(e) => onUpdate({ categoria: e.target.value })}
            placeholder="Ex: 10km"
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label>Valor (R$)</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              value={ingresso.valor}
              onChange={(e) => onUpdate({ valor: e.target.value })}
              placeholder="0,00"
              disabled={disabled || ingresso.gratuito}
              className="pl-10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Quantidade</Label>
          <Input
            type="number"
            value={ingresso.quantidade || ""}
            onChange={(e) => onUpdate({ quantidade: e.target.value ? parseInt(e.target.value) : null })}
            placeholder="Ilimitado"
            disabled={disabled}
          />
        </div>
      </div>

      {/* Gratuito */}
      <div className="flex items-center gap-2">
        <Checkbox
          id={`gratuito-${ingressoIndex}`}
          checked={ingresso.gratuito}
          onCheckedChange={(checked) => onUpdate({ gratuito: !!checked, valor: checked ? "0" : ingresso.valor })}
          disabled={disabled}
        />
        <Label htmlFor={`gratuito-${ingressoIndex}`} className="cursor-pointer">
          Ingresso gratuito
        </Label>
      </div>

      {/* Kit */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id={`kit-${ingressoIndex}`}
            checked={ingresso.possuiKit}
            onCheckedChange={(checked) => onUpdate({ possuiKit: !!checked })}
            disabled={disabled}
          />
          <Label htmlFor={`kit-${ingressoIndex}`} className="cursor-pointer">
            Possui kit
          </Label>
        </div>

        {ingresso.possuiKit && (
          <div className="ml-6 p-3 bg-white rounded border space-y-3">
            <div className="space-y-2">
              <Label className="text-sm">Itens do Kit</Label>
              <div className="flex flex-wrap gap-2">
                {ITENS_KIT.map((item) => (
                  <label key={item.value} className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox
                      checked={ingresso.itensKit.includes(item.value)}
                      onCheckedChange={(checked) => {
                        const novosItens = checked
                          ? [...ingresso.itensKit, item.value]
                          : ingresso.itensKit.filter((i) => i !== item.value)
                        onUpdate({ itensKit: novosItens })
                      }}
                      disabled={disabled}
                    />
                    <span className="text-sm">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tamanhos de camiseta */}
            {ingresso.itensKit.includes("camiseta") && (
              <div className="space-y-2">
                <Label className="text-sm">Tamanhos de Camiseta</Label>
                <div className="flex flex-wrap gap-2">
                  {TAMANHOS_CAMISETA.map((tam) => (
                    <label key={tam.value} className="flex items-center gap-1.5 cursor-pointer">
                      <Checkbox
                        checked={ingresso.tamanhosCamiseta.includes(tam.value)}
                        onCheckedChange={(checked) => {
                          const novosTamanhos = checked
                            ? [...ingresso.tamanhosCamiseta, tam.value]
                            : ingresso.tamanhosCamiseta.filter((t) => t !== tam.value)
                          onUpdate({ tamanhosCamiseta: novosTamanhos })
                        }}
                        disabled={disabled}
                      />
                      <span className="text-sm">{tam.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* GPX do ingresso */}
      <div className="space-y-2">
        <Label className="text-sm">Arquivo GPX (Percurso específico)</Label>
        <div className="border-2 border-dashed rounded-lg p-3">
          {ingresso.gpxFile ? (
            <div className="flex items-center justify-between">
              <span className="text-sm">{ingresso.gpxFile.name}</span>
              {!disabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onUpdate({ gpxFile: null })}
                  className="text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
            <label className="flex items-center justify-center cursor-pointer py-2">
              <Upload className="h-4 w-4 text-muted-foreground mr-2" />
              <span className="text-sm text-muted-foreground">Selecionar GPX</span>
              <input
                type="file"
                accept=".gpx"
                className="hidden"
                disabled={disabled}
                onChange={(e) => onUpdate({ gpxFile: e.target.files?.[0] || null })}
              />
            </label>
          )}
        </div>

        {ingresso.gpxFile && (
          <div className="flex flex-wrap gap-4 mt-2">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <Checkbox
                checked={ingresso.showRoute}
                onCheckedChange={(checked) => onUpdate({ showRoute: !!checked })}
                disabled={disabled}
              />
              <span className="text-sm">Mostrar rota</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <Checkbox
                checked={ingresso.showMap}
                onCheckedChange={(checked) => onUpdate({ showMap: !!checked })}
                disabled={disabled}
              />
              <span className="text-sm">Mostrar mapa</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <Checkbox
                checked={ingresso.showElevation}
                onCheckedChange={(checked) => onUpdate({ showElevation: !!checked })}
                disabled={disabled}
              />
              <span className="text-sm">Mostrar elevação</span>
            </label>
          </div>
        )}
      </div>
    </div>
  )
}

