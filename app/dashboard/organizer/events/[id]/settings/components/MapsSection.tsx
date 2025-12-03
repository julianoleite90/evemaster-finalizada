"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Save, Loader2, Upload, Route, MapPin, Mountain, X, Lock, Ticket } from "lucide-react"
import { cn } from "@/lib/utils"

interface TicketType {
  id: string
  category: string
  quantity: number
  gpx_file_url?: string
  newGpxFile?: File | null
  show_route?: boolean
  show_map?: boolean
  show_elevation?: boolean
}

interface Batch {
  id: string
  name: string
  tickets?: TicketType[]
}

interface MapsSectionProps {
  batches: Batch[]
  saving: boolean
  fieldDisabled: boolean
  isEditingEnabled?: boolean
  editingBlocks: { [key: string]: boolean }
  setEditingBlocks: (blocks: { [key: string]: boolean }) => void
  updateTicket: (batchId: string, ticketId: string, field: string, value: any) => void
  handleSaveBatches: () => void
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

export function MapsSection({
  batches,
  saving,
  fieldDisabled,
  isEditingEnabled = true,
  editingBlocks,
  setEditingBlocks,
  updateTicket,
  handleSaveBatches,
}: MapsSectionProps) {
  const isDisabled = !isEditingEnabled

  return (
    <div className="space-y-6">
      <SectionCard
        icon={<Route className="w-5 h-5" />}
        title="Mapas e Percursos GPX"
        description="Gerencie os arquivos GPX e opções de exibição para cada distância"
        locked={isDisabled}
        action={
          !isDisabled && (
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
                  Salvar
                </>
              )}
            </Button>
          )
        }
      >
        {batches.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Route className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">Nenhum lote cadastrado</p>
            <p className="text-sm text-gray-500 mt-1">Configure os lotes primeiro na aba &quot;Lotes &amp; Ingressos&quot;</p>
          </div>
        ) : (
          <div className="space-y-4">
            {batches.map((batch) => (
              batch.tickets && batch.tickets.length > 0 && (
                <div key={batch.id} className="rounded-xl border border-gray-200 overflow-hidden">
                  {/* Header do Lote */}
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-emerald-600" />
                      <span className="font-medium text-gray-900">{batch.name}</span>
                      <span className="text-xs text-gray-500">({batch.tickets.length} categorias)</span>
                    </div>
                  </div>
                  
                  {/* Tickets */}
                  <div className="divide-y divide-gray-100">
                    {batch.tickets.map((ticket) => (
                      <div key={ticket.id} className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{ticket.category}</h4>
                            <p className="text-sm text-gray-500">
                              {ticket.quantity ? `${ticket.quantity} ingressos` : 'Ilimitado'}
                            </p>
                          </div>
                          {ticket.gpx_file_url && (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                              GPX Carregado
                            </Badge>
                          )}
                        </div>

                        {/* Upload GPX */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Arquivo GPX</Label>
                          <div className="relative">
                            <Input
                              type="file"
                              accept=".gpx"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null
                                if (file) {
                                  updateTicket(batch.id, ticket.id, "newGpxFile", file)
                                }
                              }}
                              className="h-20 cursor-pointer opacity-0 absolute inset-0 z-10"
                              disabled={isDisabled}
                            />
                            <div className={cn(
                              "h-20 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all",
                              ticket.newGpxFile || ticket.gpx_file_url 
                                ? "border-emerald-300 bg-emerald-50" 
                                : "border-gray-200 bg-gray-50 hover:border-emerald-300"
                            )}>
                              {ticket.newGpxFile || ticket.gpx_file_url ? (
                                <>
                                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center mb-1">
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                  <p className="text-xs font-medium text-emerald-600 truncate max-w-[90%]">
                                    {ticket.newGpxFile?.name || ticket.gpx_file_url?.split('/').pop()}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-5 h-5 text-gray-400 mb-1" />
                                  <p className="text-xs text-gray-500">Clique para carregar GPX</p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Opções de Exibição */}
                        {(ticket.gpx_file_url || ticket.newGpxFile) && (
                          <div className="flex flex-wrap gap-3 p-3 bg-gray-50 rounded-xl">
                            <label className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm",
                              ticket.show_route
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                : "bg-white border-gray-200 hover:border-gray-300"
                            )}>
                              <Checkbox
                                checked={ticket.show_route || false}
                                onCheckedChange={(checked) => updateTicket(batch.id, ticket.id, "show_route", checked)}
                                disabled={isDisabled}
                                className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                              />
                              <Route className="w-4 h-4" />
                              Percurso
                            </label>
                            <label className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm",
                              ticket.show_map
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                : "bg-white border-gray-200 hover:border-gray-300"
                            )}>
                              <Checkbox
                                checked={ticket.show_map || false}
                                onCheckedChange={(checked) => updateTicket(batch.id, ticket.id, "show_map", checked)}
                                disabled={isDisabled}
                                className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                              />
                              <MapPin className="w-4 h-4" />
                              Mapa
                            </label>
                            <label className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm",
                              ticket.show_elevation
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                : "bg-white border-gray-200 hover:border-gray-300"
                            )}>
                              <Checkbox
                                checked={ticket.show_elevation || false}
                                onCheckedChange={(checked) => updateTicket(batch.id, ticket.id, "show_elevation", checked)}
                                disabled={isDisabled}
                                className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                              />
                              <Mountain className="w-4 h-4" />
                              Altimetria
                            </label>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}