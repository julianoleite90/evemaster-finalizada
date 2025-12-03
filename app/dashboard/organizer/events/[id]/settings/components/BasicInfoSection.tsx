"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, MapPin, Upload, FileText, Clock, Globe2, Mountain, Award, Image as ImageIcon, Trash2, X, Lock } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"
import { EditorLoader } from "@/components/ui/dynamic-loader"
import { MODALIDADES_ESPORTIVAS, type EventData } from "../types"

const ReactQuill = dynamic(() => import("react-quill"), { 
  ssr: false,
  loading: () => <EditorLoader />
})
import "react-quill/dist/quill.snow.css"

// Componente de Card de Seção - IDÊNTICO ao da página de criação
function SectionCard({ 
  icon, 
  title, 
  description, 
  children,
  className,
  locked = false
}: { 
  icon: React.ReactNode
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  locked?: boolean
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
          {locked && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
              <Lock className="w-3 h-3" />
              Bloqueado
            </div>
          )}
        </div>
      </div>
      <div className={cn("p-6", locked && "pointer-events-none select-none")}>
        {children}
      </div>
    </div>
  )
}

interface BasicInfoSectionProps {
  eventData: EventData
  setEventData: (value: EventData | ((prev: EventData) => EventData)) => void
  editingBlocks: { [key: string]: boolean }
  setEditingBlocks: (value: { [key: string]: boolean } | ((prev: { [key: string]: boolean }) => { [key: string]: boolean })) => void
  fieldDisabled: boolean
  isEditingEnabled: boolean
  newBanner: File | null
  setNewBanner: (value: File | null) => void
  eventImages: Array<{ id: string; image_url: string; image_order: number }>
  setEventImages: (value: Array<{ id: string; image_url: string; image_order: number }>) => void
  newImages: File[]
  setNewImages: (value: File[] | ((prev: File[]) => File[])) => void
  uploadingImages: boolean
}

export function BasicInfoSection({
  eventData,
  setEventData,
  editingBlocks,
  setEditingBlocks,
  fieldDisabled,
  isEditingEnabled,
  newBanner,
  setNewBanner,
  eventImages,
  setEventImages,
  newImages,
  setNewImages,
  uploadingImages,
}: BasicInfoSectionProps) {
  const isDisabled = !isEditingEnabled
  return (
    <div className="space-y-6">
        {/* Informações Básicas */}
      <SectionCard 
        icon={<Calendar className="w-5 h-5" />} 
        title="Informações Básicas"
        description="Nome, data e horários do evento"
        locked={isDisabled}
      >
        <div className="space-y-5">
          {/* Nome do Evento */}
            <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Nome do Evento <span className="text-red-500">*</span>
            </Label>
              <Input
                id="name"
                value={eventData.name}
                onChange={(e) => setEventData({ ...eventData, name: e.target.value })}
              placeholder="Ex: Maratona de Florianópolis 2025"
              disabled={isDisabled}
              className={cn(
                "h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500",
                isDisabled && "bg-gray-50 cursor-not-allowed"
              )}
            />
          </div>

          {/* Data e Horários */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Data <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={eventData.event_date}
                onChange={(e) => setEventData({ ...eventData, event_date: e.target.value })}
                className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Início <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="time"
                  value={eventData.start_time}
                  onChange={(e) => setEventData({ ...eventData, start_time: e.target.value })}
                  className="h-11 pl-10 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Término</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="time"
                  value={eventData.end_time || ""}
                  onChange={(e) => setEventData({ ...eventData, end_time: e.target.value })}
                  className="h-11 pl-10 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Categoria e Idioma */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard 
          icon={<Award className="w-5 h-5" />} 
          title="Categoria"
          description="Tipo de modalidade esportiva"
          locked={isDisabled}
        >
          <div className="space-y-4">
              <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Modalidade <span className="text-red-500">*</span>
              </Label>
                <Select
                  value={eventData.category}
                  onValueChange={(value) => setEventData({ ...eventData, category: value })}
                >
                <SelectTrigger className="h-11 rounded-xl border-gray-200">
                  <SelectValue placeholder="Selecione a modalidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODALIDADES_ESPORTIVAS.map((mod) => (
                      <SelectItem key={mod.value} value={mod.value}>
                        {mod.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            {/* Status */}
              <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Status</Label>
                <Select
                  value={eventData.status}
                  onValueChange={(value) => setEventData({ ...eventData, status: value })}
                >
                <SelectTrigger className="h-11 rounded-xl border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="finished">Finalizado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
          </div>
        </SectionCard>

        <SectionCard 
          icon={<Globe2 className="w-5 h-5" />} 
          title="Idioma e Características"
          description="Configurações adicionais"
          locked={isDisabled}
        >
          <div className="space-y-4">
            {/* Idioma */}
              <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Idioma do Evento</Label>
              <Select
                value={eventData.language}
                onValueChange={(value) => setEventData({ ...eventData, language: value as "pt" | "es" | "en" })}
              >
                <SelectTrigger className="h-11 rounded-xl border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt">Português</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dificuldade e Tipo */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Dificuldade</Label>
                <Select
                  value={eventData.difficulty_level || ""}
                  onValueChange={(value) => setEventData({ ...eventData, difficulty_level: value as any })}
                >
                  <SelectTrigger className="h-11 rounded-xl border-gray-200">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fácil">Fácil</SelectItem>
                    <SelectItem value="Moderado">Moderado</SelectItem>
                    <SelectItem value="Difícil">Difícil</SelectItem>
                    <SelectItem value="Muito Difícil">Muito Difícil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Tipo</Label>
                <Select
                  value={eventData.race_type || ""}
                  onValueChange={(value) => setEventData({ ...eventData, race_type: value as any })}
                >
                  <SelectTrigger className="h-11 rounded-xl border-gray-200">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asfalto">Asfalto</SelectItem>
                    <SelectItem value="trail">Trail</SelectItem>
                    <SelectItem value="misto">Misto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              </div>

            {/* Exibir na Vitrine */}
            <div className="space-y-2 pt-2 border-t">
              <Label className="text-sm font-medium text-gray-700">Exibir na Vitrine</Label>
              <div className="flex items-center gap-4">
                <label className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-all",
                  eventData.show_in_showcase === true
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-white border-gray-200 hover:border-gray-300"
                )}>
                    <input
                      type="radio"
                    name="show_in_showcase"
                    checked={eventData.show_in_showcase === true}
                    onChange={() => setEventData({ ...eventData, show_in_showcase: true })}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">Sim</span>
                </label>
                <label className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-all",
                  eventData.show_in_showcase === false
                    ? "bg-gray-100 border-gray-300 text-gray-700"
                    : "bg-white border-gray-200 hover:border-gray-300"
                )}>
                    <input
                      type="radio"
                    name="show_in_showcase"
                    checked={eventData.show_in_showcase === false}
                    onChange={() => setEventData({ ...eventData, show_in_showcase: false })}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">Não</span>
                </label>
                  </div>
                </div>
              </div>
        </SectionCard>
            </div>

      {/* Localização */}
      <SectionCard 
        icon={<MapPin className="w-5 h-5" />} 
        title="Localização"
        description="Onde o evento será realizado"
        locked={isDisabled}
      >
        <div className="space-y-4">
              <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Local / Nome do Estabelecimento</Label>
                <Input
              value={eventData.location}
              onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
              placeholder="Ex: Praça da Liberdade"
              className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Endereço</Label>
                <Input
                value={eventData.address}
                onChange={(e) => setEventData({ ...eventData, address: e.target.value })}
                placeholder="Ex: Av. Beira Mar, 1000"
                className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">CEP</Label>
              <Input
                value={eventData.zip_code}
                onChange={(e) => setEventData({ ...eventData, zip_code: e.target.value })}
                placeholder="00000-000"
                className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
              </div>

          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Cidade</Label>
                <Input
                  value={eventData.city}
                  onChange={(e) => setEventData({ ...eventData, city: e.target.value })}
                  placeholder="Ex: Florianópolis"
                className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Estado</Label>
                <Input
                  value={eventData.state}
                  onChange={(e) => setEventData({ ...eventData, state: e.target.value })}
                  placeholder="Ex: SC"
                className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
      </div>
              </div>
      </SectionCard>

      {/* Banner e Galeria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard 
          icon={<ImageIcon className="w-5 h-5" />} 
          title="Banner do Evento"
          description="Imagem principal (21:9)"
          locked={isDisabled}
        >
          <div className="space-y-4">
            {eventData.banner_url && (
              <div className="relative w-full h-32 bg-gray-100 rounded-xl overflow-hidden">
                <Image
                  src={eventData.banner_url}
                  alt="Banner atual"
                  fill
                  className="object-cover"
                />
              </div>
            )}
            
              <div className="relative">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    setNewBanner(file)
                    if (file) {
                    toast.success(`Banner "${file.name}" selecionado`)
                    }
                  }}
                  className="h-24 cursor-pointer opacity-0 absolute inset-0 z-10"
              />
              <div className={cn(
                "h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all",
                newBanner 
                  ? "border-emerald-300 bg-emerald-50" 
                  : "border-gray-200 bg-gray-50 hover:border-emerald-300"
              )}>
                {newBanner ? (
                  <>
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center mb-2">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    <p className="text-sm font-medium text-emerald-600 truncate max-w-[90%]">{newBanner.name}</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Clique para selecionar</p>
                    </>
                  )}
                </div>
              </div>
            </div>
        </SectionCard>

        <SectionCard 
          icon={<ImageIcon className="w-5 h-5" />} 
          title="Galeria de Imagens"
          description="Imagens adicionais do evento"
          locked={isDisabled}
        >
          <div className="space-y-4">
            {eventImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {eventImages.map((img, index) => (
                  <div key={img.id} className="relative aspect-video rounded-lg overflow-hidden group">
                      <Image
                        src={img.image_url}
                        alt={`Imagem ${index + 1}`}
                        fill
                        className="object-cover"
                    />
                    <button
                      onClick={() => setEventImages(eventImages.filter(i => i.id !== img.id))}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

              <div className="relative">
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || [])
                    setNewImages(prev => [...prev, ...files])
                  }}
                className="h-20 cursor-pointer opacity-0 absolute inset-0 z-10"
              />
              <div className={cn(
                "h-20 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all",
                newImages.length > 0 
                  ? "border-emerald-300 bg-emerald-50" 
                  : "border-gray-200 bg-gray-50 hover:border-emerald-300"
              )}>
                {newImages.length > 0 ? (
                  <p className="text-sm font-medium text-emerald-600">{newImages.length} arquivo(s) selecionado(s)</p>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-gray-400 mb-1" />
                    <p className="text-xs text-gray-500">Adicionar imagens</p>
                    </>
                  )}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Descrição */}
      <SectionCard 
        icon={<FileText className="w-5 h-5" />} 
        title="Descrição do Evento"
        description="Texto que será exibido na página do evento"
        locked={isDisabled}
      >
        <div className="border rounded-xl overflow-hidden">
          <ReactQuill
            theme="snow"
            value={eventData.description}
            onChange={(value) => setEventData({ ...eventData, description: value })}
            placeholder="Descreva seu evento aqui..."
            className="bg-white"
            modules={{
              toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'color': [] }, { 'background': [] }],
                ['link'],
                ['clean']
              ],
            }}
          />
        </div>
      </SectionCard>
    </div>
  )
}
