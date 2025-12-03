"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Upload, 
  Info, 
  Globe2,
  Mountain,
  Route,
  Award,
  Plus,
  X,
  Loader2,
  Image as ImageIcon
} from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { MODALIDADES_ESPORTIVAS, DISTANCIAS_PADRAO, STEPS } from "../constants"
import type { NewEventFormData } from "../types"

interface Step1EventInfoProps {
  formData: NewEventFormData
  setFormData: React.Dispatch<React.SetStateAction<NewEventFormData>>
  onFileUpload: (field: "bannerEvento" | "gpxStrava", file: File | null) => void
}

// Componente de Card de Seção
function SectionCard({ 
  icon, 
  title, 
  description, 
  children,
  className
}: { 
  icon: React.ReactNode
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn(
      "bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-shadow hover:shadow-md",
      className
    )}>
      <div className="px-6 py-4 border-b border-gray-50 bg-gradient-to-r from-gray-50/50 to-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            {icon}
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            {description && (
              <p className="text-sm text-gray-500">{description}</p>
            )}
          </div>
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}

export function Step1EventInfo({ formData, setFormData, onFileUpload }: Step1EventInfoProps) {
  const [loadingCep, setLoadingCep] = useState(false)

  // Buscar CEP
  const buscarCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, "")
    if (cepLimpo.length !== 8) return

    setLoadingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await response.json()
      
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          endereco: data.logradouro || "",
          bairro: data.bairro || "",
          cidade: data.localidade || "",
          estado: data.uf || "",
        }))
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error)
    } finally {
      setLoadingCep(false)
    }
  }

  // Handler para distâncias
  const handleDistanciaChange = (value: string, checked: boolean) => {
    if (value === "custom") {
      const newDistancias = checked
        ? [...formData.distancias, "custom"]
        : formData.distancias.filter(d => d !== "custom")
      setFormData({ ...formData, distancias: newDistancias })
    } else {
      const newDistancias = checked
        ? [...formData.distancias.filter(d => d !== "custom"), value]
        : formData.distancias.filter(d => d !== value)
      setFormData({ ...formData, distancias: newDistancias })
    }
  }

  // Adicionar distância custom
  const addDistanciaCustom = () => {
    const input = document.getElementById("distanciaCustomInput") as HTMLInputElement
    const valor = input?.value.trim()
    if (valor && !isNaN(Number(valor)) && Number(valor) > 0) {
      const distancia = `${valor}km`
      if (!formData.distanciasCustom.includes(distancia)) {
        setFormData({
          ...formData,
          distanciasCustom: [...formData.distanciasCustom, distancia],
        })
        input.value = ""
      }
    }
  }

  // Remover distância custom
  const removeDistanciaCustom = (distancia: string) => {
    setFormData({
      ...formData,
      distanciasCustom: formData.distanciasCustom.filter(d => d !== distancia),
    })
  }

  return (
    <div className="space-y-6">
      {/* Informações Básicas */}
      <SectionCard 
        icon={<Calendar className="w-5 h-5" />} 
        title="Informações Básicas"
        description="Nome, data e horários do evento"
      >
        <div className="space-y-5">
          {/* Nome do Evento */}
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-sm font-medium text-gray-700">
              Nome do Evento <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Maratona de Florianópolis 2025"
              className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          {/* Data e Horários */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Data <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Início <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="time"
                  value={formData.horarioInicio}
                  onChange={(e) => setFormData({ ...formData, horarioInicio: e.target.value })}
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
                  value={formData.horarioFim}
                  onChange={(e) => setFormData({ ...formData, horarioFim: e.target.value })}
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
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Modalidade <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => setFormData({ ...formData, categoria: value, modalidades: [] })}
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

            {/* Distâncias para corrida */}
            {formData.categoria === "corrida" && (
              <div className="space-y-3 pt-3 border-t">
                <Label className="text-sm font-medium text-gray-700">
                  Distâncias <span className="text-red-500">*</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {DISTANCIAS_PADRAO.map((dist) => (
                    <label
                      key={dist.value}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all",
                        formData.distancias.includes(dist.value)
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <Checkbox
                        checked={formData.distancias.includes(dist.value)}
                        onCheckedChange={(checked) => handleDistanciaChange(dist.value, !!checked)}
                        className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                      />
                      <span className="text-sm">{dist.label}</span>
                    </label>
                  ))}
                </div>

                {/* Distâncias Custom */}
                {formData.distancias.includes("custom") && (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                    <div className="flex gap-2">
                      <Input
                        id="distanciaCustomInput"
                        placeholder="Ex: 15"
                        className="w-24 h-9 rounded-lg"
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDistanciaCustom())}
                      />
                      <span className="text-sm text-gray-500 self-center">km</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addDistanciaCustom}
                        className="rounded-lg"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                    {formData.distanciasCustom.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.distanciasCustom.map((dist) => (
                          <Badge 
                            key={dist} 
                            variant="secondary"
                            className="flex items-center gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                          >
                            {dist}
                            <button onClick={() => removeDistanciaCustom(dist)}>
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard 
          icon={<Globe2 className="w-5 h-5" />} 
          title="Idioma e Características"
          description="Configurações adicionais"
        >
          <div className="space-y-4">
            {/* Idioma */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Idioma do Evento</Label>
              <Select
                value={formData.language}
                onValueChange={(value) => setFormData({ ...formData, language: value as "pt" | "es" | "en" })}
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
                  value={formData.difficulty_level}
                  onValueChange={(value) => setFormData({ ...formData, difficulty_level: value as any })}
                >
                  <SelectTrigger className="h-10 rounded-xl border-gray-200 text-sm">
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
                  value={formData.race_type}
                  onValueChange={(value) => setFormData({ ...formData, race_type: value as any })}
                >
                  <SelectTrigger className="h-10 rounded-xl border-gray-200 text-sm">
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

            {/* Major Access */}
            <div className="p-4 bg-gray-50 rounded-xl space-y-3">
              <Label className="text-sm font-medium text-gray-700">Acesso a Prova Major</Label>
              <div className="flex gap-4">
                <label className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all flex-1 justify-center",
                  formData.major_access
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-white border-gray-200"
                )}>
                  <input
                    type="radio"
                    checked={formData.major_access === true}
                    onChange={() => setFormData({ ...formData, major_access: true })}
                    className="accent-emerald-500"
                  />
                  <span className="text-sm">Sim</span>
                </label>
                <label className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all flex-1 justify-center",
                  !formData.major_access
                    ? "bg-gray-100 border-gray-300"
                    : "bg-white border-gray-200"
                )}>
                  <input
                    type="radio"
                    checked={formData.major_access === false}
                    onChange={() => setFormData({ ...formData, major_access: false, major_access_type: "" })}
                    className="accent-emerald-500"
                  />
                  <span className="text-sm">Não</span>
                </label>
              </div>
              {formData.major_access && (
                <Select
                  value={formData.major_access_type}
                  onValueChange={(value) => setFormData({ ...formData, major_access_type: value })}
                >
                  <SelectTrigger className="h-10 rounded-xl border-gray-200">
                    <SelectValue placeholder="Selecione a prova major" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Boston Marathon">Boston Marathon</SelectItem>
                    <SelectItem value="New York City Marathon">New York City Marathon</SelectItem>
                    <SelectItem value="Chicago Marathon">Chicago Marathon</SelectItem>
                    <SelectItem value="Berlin Marathon">Berlin Marathon</SelectItem>
                    <SelectItem value="London Marathon">London Marathon</SelectItem>
                    <SelectItem value="Tokyo Marathon">Tokyo Marathon</SelectItem>
                    <SelectItem value="Outra">Outra</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Local do Evento */}
      <SectionCard 
        icon={<MapPin className="w-5 h-5" />} 
        title="Local do Evento"
        description="Endereço completo do evento"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">País</Label>
              <Select
                value={formData.pais}
                onValueChange={(value) => setFormData({ ...formData, pais: value })}
              >
                <SelectTrigger className="h-11 rounded-xl border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Brasil">Brasil</SelectItem>
                  <SelectItem value="Argentina">Argentina</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">CEP</Label>
              <div className="relative">
                <Input
                  value={formData.cep}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 8)
                    const formatted = value.replace(/(\d{5})(\d{3})/, "$1-$2")
                    setFormData({ ...formData, cep: formatted })
                  }}
                  onBlur={(e) => buscarCep(e.target.value)}
                  placeholder="00000-000"
                  disabled={loadingCep}
                  className="h-11 rounded-xl border-gray-200"
                />
                {loadingCep && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Estado</Label>
              <Input
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                placeholder="Ex: SC"
                className="h-11 rounded-xl border-gray-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Cidade <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                placeholder="Ex: Florianópolis"
                className="h-11 rounded-xl border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Bairro</Label>
              <Input
                value={formData.bairro}
                onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                placeholder="Ex: Centro"
                className="h-11 rounded-xl border-gray-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3 space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Endereço <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                placeholder="Ex: Av. Beira Mar Norte"
                className="h-11 rounded-xl border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Número</Label>
              <Input
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                placeholder="Nº"
                className="h-11 rounded-xl border-gray-200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Complemento / Referência</Label>
            <Input
              value={formData.complemento}
              onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
              placeholder="Ex: Próximo ao Terminal de Integração"
              className="h-11 rounded-xl border-gray-200"
            />
          </div>
        </div>
      </SectionCard>

      {/* Banner do Evento */}
      <SectionCard 
        icon={<ImageIcon className="w-5 h-5" />} 
        title="Banner do Evento"
        description="Imagem de destaque (proporção 21:9)"
      >
        <div className="space-y-4">
          {formData.bannerEvento ? (
            <div className="relative rounded-xl overflow-hidden border border-gray-200">
              <Image
                src={URL.createObjectURL(formData.bannerEvento)}
                alt="Preview do banner"
                width={800}
                height={342}
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <span className="text-white text-sm font-medium">
                  {formData.bannerEvento.name}
                </span>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => onFileUpload("bannerEvento", null)}
                  className="rounded-lg"
                >
                  <X className="w-4 h-4 mr-1" />
                  Remover
                </Button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center py-6">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">
                  Clique para fazer upload
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG até 5MB • Proporção ideal: 1920x823px
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onFileUpload("bannerEvento", e.target.files?.[0] || null)}
              />
            </label>
          )}
        </div>
      </SectionCard>
    </div>
  )
}

