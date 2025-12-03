"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Trash2, 
  Save, 
  Edit, 
  ChevronDown, 
  ChevronUp,
  Ticket,
  Calendar,
  Clock,
  Package,
  Upload,
  MapPin,
  Check,
  DollarSign
} from "lucide-react"
import { cn } from "@/lib/utils"
import { TAMANHOS_CAMISETA, ITENS_KIT, DISTANCIAS_PADRAO } from "../constants"
import type { NewEventFormData, Lote } from "../types"

interface Step2BatchesProps {
  formData: NewEventFormData
  setFormData: React.Dispatch<React.SetStateAction<NewEventFormData>>
  getCategoriasDisponiveis: () => string[]
}

// Componente de Card de Lote
function LoteCard({ 
  lote, 
  index,
  isExpanded,
  onToggle,
  onUpdate,
  onRemove,
  onSave,
  onEdit,
  onUpdateIngresso,
  disabled
}: { 
  lote: Lote
  index: number
  isExpanded: boolean
  onToggle: () => void
  onUpdate: (field: string, value: any) => void
  onRemove: () => void
  onSave: () => void
  onEdit: () => void
  onUpdateIngresso: (categoria: string, field: string, value: any) => void
  disabled?: boolean
}) {
  return (
    <div className={cn(
      "bg-white rounded-2xl border overflow-hidden transition-all duration-300",
      lote.salvo 
        ? "border-emerald-200 shadow-emerald-50 shadow-sm" 
        : "border-gray-200 shadow-sm"
    )}>
      {/* Header do Lote */}
      <div 
        className={cn(
          "px-5 py-4 flex items-center justify-between cursor-pointer transition-colors",
          lote.salvo ? "bg-gradient-to-r from-emerald-50 to-white" : "bg-gray-50"
        )}
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          {lote.salvo && (
            <button 
              onClick={(e) => { e.stopPropagation(); onToggle(); }}
              className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Ticket className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            {lote.salvo ? (
              <h4 className="font-semibold text-gray-900">{lote.nome}</h4>
            ) : (
              <Input
                value={lote.nome}
                onChange={(e) => onUpdate("nome", e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="h-8 w-48 font-semibold"
                placeholder="Nome do lote"
              />
            )}
            <p className="text-xs text-gray-500">
              {lote.ingressos.length} categoria{lote.ingressos.length !== 1 ? 's' : ''}
              {lote.quantidadeTotal && ` • ${lote.quantidadeTotal} ingressos`}
            </p>
          </div>
          {lote.salvo && (
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
              <Check className="w-3 h-3 mr-1" />
              Salvo
            </Badge>
          )}
          {!lote.salvo && (
            <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
              Em edição
            </Badge>
          )}
          {index === 0 && (
            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
              Lote Atual
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {lote.salvo ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="rounded-lg"
            >
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onSave(); }}
              className="bg-[#156634] hover:bg-[#1a7a3e]"
            >
              <Save className="w-4 h-4 mr-1" />
              Salvar
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Conteúdo do Lote */}
      {isExpanded && (
        <div className="p-5 border-t border-gray-100 space-y-6">
          {/* Data, Hora e Quantidade */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                Data de Início <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={lote.dataInicio}
                onChange={(e) => onUpdate("dataInicio", e.target.value)}
                disabled={lote.salvo}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                Hora de Início <span className="text-red-500">*</span>
              </Label>
              <Input
                type="time"
                value={lote.horaInicio}
                onChange={(e) => onUpdate("horaInicio", e.target.value)}
                disabled={lote.salvo}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-gray-400" />
                Qtd. Total
              </Label>
              <Input
                type="number"
                min="0"
                value={lote.quantidadeTotal}
                onChange={(e) => onUpdate("quantidadeTotal", e.target.value)}
                disabled={lote.salvo}
                placeholder="Ilimitado"
                className="h-10 rounded-xl"
              />
              <p className="text-xs text-gray-500">Deixe vazio para ilimitado</p>
            </div>
          </div>

          {/* Ingressos */}
          <div className="space-y-4">
            <h5 className="font-medium text-gray-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Ingressos por Categoria
            </h5>
            <div className="space-y-3">
              {lote.ingressos.map((ingresso) => (
                <IngressoCard
                  key={ingresso.categoria}
                  ingresso={ingresso}
                  lote={lote}
                  onUpdate={(field, value) => onUpdateIngresso(ingresso.categoria, field, value)}
                  disabled={lote.salvo}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Componente de Card de Ingresso
function IngressoCard({ 
  ingresso, 
  lote,
  onUpdate,
  disabled 
}: { 
  ingresso: Lote['ingressos'][0]
  lote: Lote
  onUpdate: (field: string, value: any) => void
  disabled?: boolean
}) {
  const [showKit, setShowKit] = useState(ingresso.possuiKit)
  const [showGpx, setShowGpx] = useState(false)

  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-4">
      {/* Linha Principal */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[150px]">
          <span className="text-sm font-semibold text-gray-900">{ingresso.categoria}</span>
          {lote.quantidadeTotal && (
            <div className="flex items-center gap-2 mt-1">
              <Input
                type="number"
                min="0"
                value={ingresso.quantidade ?? ""}
                onChange={(e) => {
                  const val = e.target.value
                  onUpdate("quantidade", val === "" ? null : parseInt(val))
                }}
                disabled={disabled}
                placeholder="Ilimitado"
                className="w-20 h-7 text-xs rounded-lg"
              />
              <span className="text-xs text-gray-500">unidades</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={ingresso.gratuito}
              onCheckedChange={(checked) => onUpdate("gratuito", checked)}
              disabled={disabled}
              className="data-[state=checked]:bg-emerald-500"
            />
            <span className="text-sm text-gray-600">Gratuito</span>
          </label>

          {!ingresso.gratuito && (
            <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 px-2">
              <span className="text-sm text-gray-500">R$</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={ingresso.valor}
                onChange={(e) => onUpdate("valor", e.target.value)}
                disabled={disabled}
                placeholder="0,00"
                className="w-24 h-8 border-0 p-0 text-right focus-visible:ring-0"
              />
            </div>
          )}
        </div>
      </div>

      {/* Configurações Adicionais (apenas em edição) */}
      {!disabled && (
        <div className="space-y-4 pt-3 border-t border-gray-200">
          {/* Kit */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={ingresso.possuiKit}
                onCheckedChange={(checked) => {
                  onUpdate("possuiKit", checked)
                  setShowKit(!!checked)
                }}
                className="data-[state=checked]:bg-emerald-500"
              />
              <Package className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Possui Kit</span>
            </label>

            {ingresso.possuiKit && (
              <div className="pl-6 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {ITENS_KIT.map((item) => (
                    <label
                      key={item.value}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-all",
                        (ingresso.itensKit || []).includes(item.value)
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <Checkbox
                        checked={(ingresso.itensKit || []).includes(item.value)}
                        onCheckedChange={(checked) => {
                          const itens = ingresso.itensKit || []
                          const novos = checked
                            ? [...itens, item.value]
                            : itens.filter(i => i !== item.value)
                          onUpdate("itensKit", novos)
                          if (!checked && item.value === "camiseta") {
                            onUpdate("tamanhosCamiseta", [])
                            onUpdate("quantidadeCamisetasPorTamanho", {})
                          }
                        }}
                        className="hidden"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>

                {/* Tamanhos de Camiseta */}
                {(ingresso.itensKit || []).includes("camiseta") && (
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 space-y-3">
                    <Label className="text-xs font-medium text-blue-700">Tamanhos de Camiseta</Label>
                    <div className="flex flex-wrap gap-2">
                      {TAMANHOS_CAMISETA.map((tam) => (
                        <label
                          key={tam.value}
                          className={cn(
                            "w-10 h-10 flex items-center justify-center rounded-lg border text-sm font-medium cursor-pointer transition-all",
                            (ingresso.tamanhosCamiseta || []).includes(tam.value)
                              ? "bg-blue-500 border-blue-500 text-white"
                              : "bg-white border-gray-200 hover:border-blue-300"
                          )}
                        >
                          <Checkbox
                            checked={(ingresso.tamanhosCamiseta || []).includes(tam.value)}
                            onCheckedChange={(checked) => {
                              const tamanhos = ingresso.tamanhosCamiseta || []
                              const novos = checked
                                ? [...tamanhos, tam.value]
                                : tamanhos.filter(t => t !== tam.value)
                              onUpdate("tamanhosCamiseta", novos)
                              if (!checked) {
                                const qtds = { ...ingresso.quantidadeCamisetasPorTamanho }
                                delete qtds[tam.value]
                                onUpdate("quantidadeCamisetasPorTamanho", qtds)
                              }
                            }}
                            className="hidden"
                          />
                          {tam.label}
                        </label>
                      ))}
                    </div>
                    
                    {/* Quantidades por tamanho */}
                    {(ingresso.tamanhosCamiseta || []).length > 0 && (
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-2 pt-2 border-t border-blue-100">
                        {(ingresso.tamanhosCamiseta || []).map((tam) => (
                          <div key={tam} className="space-y-1">
                            <Label className="text-xs text-blue-600">{tam}</Label>
                            <Input
                              type="number"
                              min="0"
                              value={(ingresso.quantidadeCamisetasPorTamanho || {})[tam] ?? ""}
                              onChange={(e) => {
                                const qtds = { ...ingresso.quantidadeCamisetasPorTamanho }
                                qtds[tam] = e.target.value
                                onUpdate("quantidadeCamisetasPorTamanho", qtds)
                              }}
                              placeholder="∞"
                              className="h-8 text-xs rounded-lg"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* GPX */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={showGpx}
                onCheckedChange={(checked) => setShowGpx(!!checked)}
                className="data-[state=checked]:bg-emerald-500"
              />
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Percurso GPX</span>
            </label>

            {showGpx && (
              <div className="pl-6 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".gpx"
                    onChange={(e) => onUpdate("gpxFile", e.target.files?.[0] || null)}
                    className="hidden"
                    id={`gpx-${ingresso.categoria}`}
                  />
                  <label htmlFor={`gpx-${ingresso.categoria}`} className="flex-1">
                    <Button type="button" variant="outline" size="sm" className="w-full rounded-lg" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {ingresso.gpxFile ? ingresso.gpxFile.name : "Selecionar arquivo GPX"}
                      </span>
                    </Button>
                  </label>
                  {ingresso.gpxFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onUpdate("gpxFile", null)}
                      className="text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {(ingresso.gpxFile || ingresso.gpxFileUrl) && (
                  <div className="flex flex-wrap gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={ingresso.showRoute || false}
                        onCheckedChange={(checked) => onUpdate("showRoute", checked)}
                        className="data-[state=checked]:bg-emerald-500"
                      />
                      <span className="text-xs text-gray-700">Exibir percurso</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={ingresso.showMap || false}
                        onCheckedChange={(checked) => onUpdate("showMap", checked)}
                        className="data-[state=checked]:bg-emerald-500"
                      />
                      <span className="text-xs text-gray-700">Exibir mapa</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={ingresso.showElevation || false}
                        onCheckedChange={(checked) => onUpdate("showElevation", checked)}
                        className="data-[state=checked]:bg-emerald-500"
                      />
                      <span className="text-xs text-gray-700">Exibir altimetria</span>
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function Step2Batches({ formData, setFormData, getCategoriasDisponiveis }: Step2BatchesProps) {
  const [lotesExpandidos, setLotesExpandidos] = useState<{ [key: string]: boolean }>({})

  // Adicionar novo lote
  const addLote = () => {
    const categorias = getCategoriasDisponiveis()
    const novoLote: Lote = {
      id: Date.now().toString(),
      nome: `Lote ${formData.lotes.length + 1}`,
      dataInicio: "",
      horaInicio: "",
      quantidadeTotal: "",
      salvo: false,
      ingressos: categorias.map(cat => ({
        categoria: cat,
        valor: "",
        gratuito: false,
        quantidade: null,
        possuiKit: false,
        itensKit: [],
        tamanhosCamiseta: [],
        quantidadeCamisetasPorTamanho: {},
        gpxFile: null,
        gpxFileUrl: null,
        showRoute: false,
        showMap: false,
        showElevation: false,
      })),
    }
    setFormData({ ...formData, lotes: [...formData.lotes, novoLote] })
    setLotesExpandidos({ ...lotesExpandidos, [novoLote.id]: true })
  }

  // Salvar lote
  const salvarLote = (loteId: string) => {
    const lote = formData.lotes.find(l => l.id === loteId)
    if (!lote) return

    if (!lote.dataInicio || !lote.horaInicio) {
      return // A validação será feita na página principal
    }

    setFormData({
      ...formData,
      lotes: formData.lotes.map(l => l.id === loteId ? { ...l, salvo: true } : l),
    })
    setLotesExpandidos({ ...lotesExpandidos, [loteId]: false })
  }

  // Editar lote
  const editarLote = (loteId: string) => {
    setFormData({
      ...formData,
      lotes: formData.lotes.map(l => l.id === loteId ? { ...l, salvo: false } : l),
    })
    setLotesExpandidos({ ...lotesExpandidos, [loteId]: true })
  }

  // Remover lote
  const removeLote = (loteId: string) => {
    setFormData({
      ...formData,
      lotes: formData.lotes.filter(l => l.id !== loteId),
    })
  }

  // Atualizar lote
  const updateLote = (loteId: string, field: string, value: any) => {
    setFormData({
      ...formData,
      lotes: formData.lotes.map(l => l.id === loteId ? { ...l, [field]: value } : l),
    })
  }

  // Atualizar ingresso
  const updateIngresso = (loteId: string, categoria: string, field: string, value: any) => {
    setFormData({
      ...formData,
      lotes: formData.lotes.map(l =>
        l.id === loteId
          ? {
              ...l,
              ingressos: l.ingressos.map(ing =>
                ing.categoria === categoria ? { ...ing, [field]: value } : ing
              ),
            }
          : l
      ),
    })
  }

  // Toggle expandir/recolher
  const toggleLote = (loteId: string) => {
    const lote = formData.lotes.find(l => l.id === loteId)
    if (lote?.salvo) {
      setLotesExpandidos({ ...lotesExpandidos, [loteId]: !lotesExpandidos[loteId] })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Lotes e Ingressos</h3>
          <p className="text-sm text-gray-500">Configure os lotes de vendas e valores por categoria</p>
        </div>
        <Button
          type="button"
          onClick={addLote}
          className="bg-[#156634] hover:bg-[#1a7a3e]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Lote
        </Button>
      </div>

      {/* Lista de Lotes */}
      {formData.lotes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Ticket className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhum lote criado</h4>
          <p className="text-sm text-gray-500 mb-6">
            Crie seu primeiro lote para definir os preços e quantidades
          </p>
          <Button onClick={addLote} className="bg-[#156634] hover:bg-[#1a7a3e]">
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeiro Lote
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {formData.lotes.map((lote, index) => (
            <LoteCard
              key={lote.id}
              lote={lote}
              index={index}
              isExpanded={lote.salvo ? (lotesExpandidos[lote.id] === true) : true}
              onToggle={() => toggleLote(lote.id)}
              onUpdate={(field, value) => updateLote(lote.id, field, value)}
              onRemove={() => removeLote(lote.id)}
              onSave={() => salvarLote(lote.id)}
              onEdit={() => editarLote(lote.id)}
              onUpdateIngresso={(cat, field, value) => updateIngresso(lote.id, cat, field, value)}
              disabled={lote.salvo}
            />
          ))}
        </div>
      )}
    </div>
  )
}
