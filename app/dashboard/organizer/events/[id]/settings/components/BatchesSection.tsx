"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Trash2,
  Save,
  ChevronDown,
  ChevronUp,
  Ticket,
  Calendar,
  Package,
  Check,
  DollarSign,
  Loader2,
  Pencil,
  Lock
} from "lucide-react"
import { cn } from "@/lib/utils"
import { TAMANHOS_CAMISETA, ITENS_KIT } from "../types"

interface BatchesSectionProps {
  batches: any[]
  expandedBatches: { [key: string]: boolean }
  editingBlocks: { [key: string]: boolean }
  saving: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  isPrimary: boolean
  fieldDisabled: boolean
  isEditingEnabled?: boolean
  addNewBatch: () => void
  updateBatch: (batchId: string, field: string, value: any) => void
  removeBatch: (batchId: string) => void
  toggleBatch: (batchId: string) => void
  addTicketToBatch: (batchId: string) => void
  updateTicket: (batchId: string, ticketId: string, field: string, value: any) => void
  removeTicket: (batchId: string, ticketId: string) => void
  handleSaveBatches: () => void
  setEditingBlocks: (value: { [key: string]: boolean } | ((prev: { [key: string]: boolean }) => { [key: string]: boolean })) => void
}

// Componente de Card de Seção
function SectionCard({ 
  icon, 
  title, 
  description, 
  children,
  action,
  locked = false,
  className
}: { 
  icon: React.ReactNode
  title: string
  description?: string
  children: React.ReactNode
  action?: React.ReactNode
  locked?: boolean
  className?: string
}) {
  return (
    <div className={cn(
      "bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-shadow",
      locked ? "opacity-75" : "hover:shadow-md",
      className
    )}>
      <div className="px-6 py-4 border-b border-gray-50 bg-gradient-to-r from-gray-50/50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              locked ? "bg-gray-100 text-gray-400" : "bg-emerald-50 text-emerald-600"
            )}>
              {icon}
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">{title}</h3>
              {description && (
                <p className="text-sm text-gray-500">{description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {locked && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                <Lock className="w-3 h-3" />
                Bloqueado
              </div>
            )}
            {action}
          </div>
        </div>
      </div>
      <div className={cn("p-6", locked && "pointer-events-none select-none")}>
        {children}
      </div>
    </div>
  )
}

export function BatchesSection({
  batches,
  expandedBatches,
  editingBlocks,
  saving,
  canCreate,
  canEdit,
  canDelete,
  isPrimary,
  fieldDisabled,
  isEditingEnabled = true,
  addNewBatch,
  updateBatch,
  removeBatch,
  toggleBatch,
  addTicketToBatch,
  updateTicket,
  removeTicket,
  handleSaveBatches,
  setEditingBlocks,
}: BatchesSectionProps) {
  const isDisabled = !isEditingEnabled
  return (
    <div className="space-y-6">
      <SectionCard
        icon={<Ticket className="w-5 h-5" />}
        title="Lotes e Ingressos"
        description="Gerencie os lotes de venda e os ingressos do evento"
        locked={isDisabled}
        action={!isDisabled && (
          <div className="flex items-center gap-2">
            {(canCreate || isPrimary) && (
          <Button
                onClick={addNewBatch} 
                variant="outline" 
                size="sm"
                className="rounded-xl"
              >
              <Plus className="mr-2 h-4 w-4" />
              Novo Lote
            </Button>
          )}
          {(canEdit || isPrimary) && (
            <Button 
              onClick={handleSaveBatches} 
                disabled={saving}
                size="sm"
                className="bg-[#156634] hover:bg-[#1a7a3e] rounded-xl"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                    Salvar Lotes
                </>
              )}
            </Button>
          )}
        </div>
        )}
      >
      {batches.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Ticket className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">Nenhum lote criado</p>
            <p className="text-sm text-gray-500 mt-1">Clique em &quot;Novo Lote&quot; para começar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {batches.map((batch, index) => (
              <div 
                key={batch.id}
                className={cn(
                  "rounded-2xl border overflow-hidden transition-all",
                  expandedBatches[batch.id] 
                    ? "border-emerald-200 shadow-sm" 
                    : "border-gray-200"
                )}
              >
                {/* Header do Lote */}
                <div 
                  className={cn(
                    "px-5 py-4 flex items-center justify-between cursor-pointer transition-colors",
                    expandedBatches[batch.id] 
                      ? "bg-gradient-to-r from-emerald-50 to-white" 
                      : "bg-gray-50 hover:bg-gray-100"
                  )}
                  onClick={() => toggleBatch(batch.id)}
                >
                  <div className="flex items-center gap-3">
                    <button 
                      className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      {expandedBatches[batch.id] ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <Ticket className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{batch.name || `Lote ${index + 1}`}</h4>
                      <p className="text-xs text-gray-500">
                        {batch.tickets?.length || 0} categoria{(batch.tickets?.length || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {index === 0 && (
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                        Lote Atual
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {(canDelete || isPrimary) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBatch(batch.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Conteúdo do Lote */}
              {expandedBatches[batch.id] && (
                  <div className="p-5 border-t border-gray-100 space-y-6">
                    {/* Informações do Lote */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Nome do Lote</Label>
                        <Input
                          value={batch.name || ""}
                          onChange={(e) => updateBatch(batch.id, "name", e.target.value)}
                          placeholder="Ex: Lote 1"
                          className="h-11 rounded-xl border-gray-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Data de Início</Label>
                        <Input
                          type="date"
                          value={batch.start_date?.split('T')[0] || ""}
                          onChange={(e) => updateBatch(batch.id, "start_date", e.target.value)}
                          className="h-11 rounded-xl border-gray-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Data de Término</Label>
                        <Input
                          type="date"
                          value={batch.end_date?.split('T')[0] || ""}
                          onChange={(e) => updateBatch(batch.id, "end_date", e.target.value)}
                          className="h-11 rounded-xl border-gray-200"
                        />
                    </div>
                  </div>

                    {/* Ingressos */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-gray-900 flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                          Ingressos deste lote
                        </h5>
                        {(canCreate || isPrimary) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addTicketToBatch(batch.id)}
                            className="rounded-xl"
                      >
                            <Plus className="w-4 h-4 mr-1" />
                        Adicionar Ingresso
                      </Button>
                        )}
                    </div>

                      {(!batch.tickets || batch.tickets.length === 0) ? (
                        <div className="text-center py-8 bg-gray-50 rounded-xl">
                          <p className="text-sm text-gray-500">Nenhum ingresso neste lote</p>
                      </div>
                    ) : (
                        <div className="space-y-3">
                          {batch.tickets.map((ticket: any, ticketIndex: number) => (
                            <div 
                              key={ticket.id}
                              className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-4"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">
                                  Ingresso {ticketIndex + 1}
                                </span>
                                {(canDelete || isPrimary) && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
                                    onClick={() => removeTicket(batch.id, ticket.id)}
                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
          >
                                    <Trash2 className="w-4 h-4" />
          </Button>
                                )}
        </div>

                              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div className="space-y-1.5">
                                  <Label className="text-xs text-gray-600">Categoria</Label>
              <Input
                                    value={ticket.category || ""}
                                    onChange={(e) => updateTicket(batch.id, ticket.id, "category", e.target.value)}
                                    placeholder="Ex: 5km"
                                    className="h-10 rounded-lg border-gray-200 text-sm"
              />
            </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs text-gray-600">Preço (R$)</Label>
              <Input
                type="number"
                                    min="0"
                step="0.01"
                value={ticket.price || ""}
                                    onChange={(e) => updateTicket(batch.id, ticket.id, "price", parseFloat(e.target.value) || 0)}
                                    placeholder="0,00"
                                    className="h-10 rounded-lg border-gray-200 text-sm"
              />
            </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs text-gray-600">Quantidade</Label>
              <Input
                type="number"
                min="0"
                                    value={ticket.quantity || ""}
                                    onChange={(e) => updateTicket(batch.id, ticket.id, "quantity", parseInt(e.target.value) || null)}
                                    placeholder="Ilimitado"
                                    className="h-10 rounded-lg border-gray-200 text-sm"
                                  />
            </div>
                                <div className="space-y-1.5 flex items-end">
                                  <label className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all w-full",
                                    ticket.absorb_fee
                                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                      : "bg-white border-gray-200 hover:border-gray-300"
                                  )}>
                <Checkbox
                                      checked={ticket.absorb_fee || false}
                                      onCheckedChange={(checked) => updateTicket(batch.id, ticket.id, "absorb_fee", !!checked)}
                                      className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                                    />
                                    <span className="text-xs">Absorver taxa</span>
                                  </label>
          </div>
        </div>

                              {/* Kit e Tamanhos de Camiseta */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-200">
                                <div className="space-y-2">
                                  <Label className="text-xs text-gray-600 flex items-center gap-1">
                                    <Package className="w-3 h-3" />
                                    Itens do Kit
              </Label>
                                  <div className="flex flex-wrap gap-2">
                  {ITENS_KIT.map((item) => (
                                      <label
                                        key={item.value}
                                        className={cn(
                                          "flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs cursor-pointer transition-all",
                                          (ticket.kit_items || []).includes(item.value)
                                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                            : "bg-white border-gray-200 hover:border-gray-300"
                                        )}
                                      >
                      <Checkbox
                        checked={(ticket.kit_items || []).includes(item.value)}
                        onCheckedChange={(checked) => {
                                            const current = ticket.kit_items || []
                                            const updated = checked 
                                              ? [...current, item.value]
                                              : current.filter((i: string) => i !== item.value)
                                            updateTicket(batch.id, ticket.id, "kit_items", updated)
                                          }}
                                          className="w-3 h-3 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                                        />
                        {item.label}
                                      </label>
                  ))}
                </div>
              </div>
                                <div className="space-y-2">
                                  <Label className="text-xs text-gray-600">Tamanhos de Camiseta</Label>
                                  <div className="flex flex-wrap gap-2">
                                    {TAMANHOS_CAMISETA.map((size) => (
                                      <label
                                        key={size.value}
                                        className={cn(
                                          "flex items-center justify-center w-10 h-8 rounded-lg border text-xs font-medium cursor-pointer transition-all",
                                          (ticket.shirt_sizes || []).includes(size.value)
                                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                            : "bg-white border-gray-200 hover:border-gray-300"
                                        )}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={(ticket.shirt_sizes || []).includes(size.value)}
                                          onChange={(e) => {
                                            const current = ticket.shirt_sizes || []
                                            const updated = e.target.checked
                                              ? [...current, size.value]
                                              : current.filter((s: string) => s !== size.value)
                                            updateTicket(batch.id, ticket.id, "shirt_sizes", updated)
                                          }}
                                          className="sr-only"
                                        />
                                        {size.label}
                                      </label>
                      ))}
                    </div>
                  </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                </div>
              )}
              </div>
            ))}
            </div>
          )}
      </SectionCard>
        </div>
  )
}