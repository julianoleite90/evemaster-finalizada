"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Upload, MapPin, Calendar, Clock, Trash2, Plus, Loader2 } from "lucide-react"
import Image from "next/image"
import {
  NewEventFormData,
  MODALIDADES_ESPORTIVAS,
  DISTANCIAS_PADRAO,
  DIFICULDADES,
  TIPOS_PROVA,
  IDIOMAS,
} from "@/lib/schemas/new-event"

interface EventInfoStepProps {
  formData: NewEventFormData
  loadingCep: boolean
  onUpdate: <K extends keyof NewEventFormData>(field: K, value: NewEventFormData[K]) => void
  onFileUpload: (field: "bannerEvento" | "gpxStrava", file: File | null) => void
  onCepBlur: (cep: string) => void
  onDistanciaChange: (value: string, checked: boolean) => void
  onAddDistanciaCustom: (valor: string) => void
  onRemoveDistanciaCustom: (distancia: string) => void
}

export function EventInfoStep({
  formData,
  loadingCep,
  onUpdate,
  onFileUpload,
  onCepBlur,
  onDistanciaChange,
  onAddDistanciaCustom,
  onRemoveDistanciaCustom,
}: EventInfoStepProps) {
  return (
    <div className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Informações do Evento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nome do Evento */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Evento *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => onUpdate("nome", e.target.value)}
              placeholder="Ex: Maratona de São Paulo 2025"
            />
          </div>

          {/* Data e Horários */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data do Evento *</Label>
              <Input
                id="data"
                type="date"
                value={formData.data}
                onChange={(e) => onUpdate("data", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="horarioInicio">Horário de Início</Label>
              <Input
                id="horarioInicio"
                type="time"
                value={formData.horarioInicio}
                onChange={(e) => onUpdate("horarioInicio", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="horarioFim">Horário de Término</Label>
              <Input
                id="horarioFim"
                type="time"
                value={formData.horarioFim}
                onChange={(e) => onUpdate("horarioFim", e.target.value)}
              />
            </div>
          </div>

          {/* Categoria e Idioma */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => onUpdate("categoria", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
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
            <div className="space-y-2">
              <Label>Idioma do Evento</Label>
              <Select
                value={formData.language}
                onValueChange={(value) => onUpdate("language", value as "pt" | "es" | "en")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o idioma" />
                </SelectTrigger>
                <SelectContent>
                  {IDIOMAS.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dificuldade e Tipo de Prova */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nível de Dificuldade</Label>
              <Select
                value={formData.difficulty_level}
                onValueChange={(value) => onUpdate("difficulty_level", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a dificuldade" />
                </SelectTrigger>
                <SelectContent>
                  {DIFICULDADES.map((dif) => (
                    <SelectItem key={dif.value} value={dif.value}>
                      {dif.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Prova</Label>
              <Select
                value={formData.race_type}
                onValueChange={(value) => onUpdate("race_type", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_PROVA.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Distâncias */}
          <div className="space-y-3">
            <Label>Distâncias</Label>
            <div className="flex flex-wrap gap-3">
              {DISTANCIAS_PADRAO.map((dist) => (
                <label key={dist.value} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={formData.distancias.includes(dist.value)}
                    onCheckedChange={(checked) => onDistanciaChange(dist.value, !!checked)}
                  />
                  <span className="text-sm">{dist.label}</span>
                </label>
              ))}
            </div>

            {/* Distâncias customizadas */}
            {formData.distancias.includes("custom") && (
              <div className="space-y-2 mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex gap-2">
                  <Input
                    id="distanciaCustomInput"
                    placeholder="Ex: 15"
                    className="w-32"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = document.getElementById("distanciaCustomInput") as HTMLInputElement
                      if (input?.value) {
                        onAddDistanciaCustom(input.value)
                        input.value = ""
                      }
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
                {formData.distanciasCustom.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.distanciasCustom.map((dist) => (
                      <Badge key={dist} variant="secondary" className="flex items-center gap-1">
                        {dist}
                        <button
                          onClick={() => onRemoveDistanciaCustom(dist)}
                          className="ml-1 hover:text-red-500"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Endereço */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Local do Evento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>País</Label>
              <Input
                value={formData.pais}
                onChange={(e) => onUpdate("pais", e.target.value)}
                placeholder="Brasil"
              />
            </div>
            <div className="space-y-2">
              <Label>CEP</Label>
              <div className="relative">
                <Input
                  value={formData.cep}
                  onChange={(e) => onUpdate("cep", e.target.value)}
                  onBlur={() => onCepBlur(formData.cep)}
                  placeholder="00000-000"
                />
                {loadingCep && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Endereço</Label>
            <Input
              value={formData.endereco}
              onChange={(e) => onUpdate("endereco", e.target.value)}
              placeholder="Rua, Avenida..."
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Número</Label>
              <Input
                value={formData.numero}
                onChange={(e) => onUpdate("numero", e.target.value)}
                placeholder="123"
              />
            </div>
            <div className="space-y-2">
              <Label>Complemento</Label>
              <Input
                value={formData.complemento}
                onChange={(e) => onUpdate("complemento", e.target.value)}
                placeholder="Bloco A"
              />
            </div>
            <div className="space-y-2">
              <Label>Bairro</Label>
              <Input
                value={formData.bairro}
                onChange={(e) => onUpdate("bairro", e.target.value)}
                placeholder="Centro"
              />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input
                value={formData.cidade}
                onChange={(e) => onUpdate("cidade", e.target.value)}
                placeholder="São Paulo"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Estado</Label>
            <Input
              value={formData.estado}
              onChange={(e) => onUpdate("estado", e.target.value)}
              placeholder="SP"
            />
          </div>
        </CardContent>
      </Card>

      {/* Arquivos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Arquivos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Banner */}
          <div className="space-y-2">
            <Label>Banner do Evento</Label>
            <div className="border-2 border-dashed rounded-lg p-4">
              {formData.bannerEvento ? (
                <div className="relative">
                  <Image
                    src={URL.createObjectURL(formData.bannerEvento)}
                    alt="Banner preview"
                    width={400}
                    height={200}
                    className="rounded-lg mx-auto object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => onFileUpload("bannerEvento", null)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer py-8">
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Clique para selecionar uma imagem</span>
                  <span className="text-xs text-muted-foreground">PNG, JPG até 5MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onFileUpload("bannerEvento", e.target.files?.[0] || null)}
                  />
                </label>
              )}
            </div>
          </div>

          {/* GPX */}
          <div className="space-y-2">
            <Label>Arquivo GPX (Percurso)</Label>
            <div className="border-2 border-dashed rounded-lg p-4">
              {formData.gpxStrava ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm">{formData.gpxStrava.name}</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onFileUpload("gpxStrava", null)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer py-4">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Clique para selecionar um arquivo GPX</span>
                  <input
                    type="file"
                    accept=".gpx"
                    className="hidden"
                    onChange={(e) => onFileUpload("gpxStrava", e.target.files?.[0] || null)}
                  />
                </label>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

