"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { FileText, Calendar, MapPin, Save, Loader2, Pencil } from "lucide-react"
import { eventBasicSchema, EventBasicFormData, MODALIDADES_ESPORTIVAS } from "@/lib/schemas/event-settings"
import dynamic from "next/dynamic"
import "react-quill/dist/quill.snow.css"
import { EditorLoader } from "@/components/ui/dynamic-loader"

const ReactQuill = dynamic(() => import("react-quill"), { 
  ssr: false,
  loading: () => <EditorLoader />
})

interface EventBasicFormProps {
  defaultValues: EventBasicFormData
  onSubmit: (data: EventBasicFormData) => Promise<void>
  disabled?: boolean
  isEditing: boolean
  onToggleEdit: () => void
}

export function EventBasicForm({ 
  defaultValues, 
  onSubmit, 
  disabled,
  isEditing,
  onToggleEdit,
}: EventBasicFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EventBasicFormData>({
    resolver: zodResolver(eventBasicSchema),
    defaultValues,
  })

  const status = watch("status")
  const showInShowcase = watch("show_in_showcase")
  const majorAccess = watch("major_access")
  const category = watch("category")
  const language = watch("language")
  const raceType = watch("race_type")
  const difficultyLevel = watch("difficulty_level")

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Card: Informações Básicas */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#156634]" />
                Informações Básicas
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Dados principais do evento
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onToggleEdit}
            >
              <Pencil className={`h-4 w-4 ${isEditing ? 'text-[#156634]' : 'text-gray-400'}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-0">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Nome do Evento *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Nome do evento"
              disabled={disabled || !isEditing}
              className="h-10"
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Categoria *</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={disabled || !isEditing}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {MODALIDADES_ESPORTIVAS.map((mod) => (
                        <SelectItem key={mod.value} value={mod.value}>
                          {mod.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && (
                <p className="text-xs text-red-500">{errors.category.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Idioma do Evento *</Label>
              <Controller
                name="language"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={disabled || !isEditing}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecione o idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt">
                        <span className="flex items-center gap-2">
                          <span>🇧🇷</span> <span>Português</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="es">
                        <span className="flex items-center gap-2">
                          <span>🇦🇷</span> <span>Español</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="en">
                        <span className="flex items-center gap-2">
                          <span>🇺🇸</span> <span>English</span>
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={disabled || !isEditing}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="published">Publicado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                      <SelectItem value="completed">Finalizado</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Tipo de Prova</Label>
              <Controller
                name="race_type"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    disabled={disabled || !isEditing}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asfalto">Asfalto</SelectItem>
                      <SelectItem value="trail">Trail</SelectItem>
                      <SelectItem value="misto">Misto</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-sm font-medium">Exibir no Showcase</Label>
              <p className="text-xs text-gray-500">Mostrar evento na página inicial</p>
            </div>
            <Controller
              name="show_in_showcase"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={disabled || !isEditing}
                />
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Card: Data e Hora */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#156634]" />
            Data e Hora
          </CardTitle>
          <CardDescription className="text-xs mt-1">
            Configure quando o evento acontecerá
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_date">Data do Evento *</Label>
              <Input
                id="event_date"
                type="date"
                {...register("event_date")}
                disabled={disabled || !isEditing}
              />
              {errors.event_date && (
                <p className="text-xs text-red-500">{errors.event_date.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_time">Hora de Início</Label>
              <Input
                id="start_time"
                type="time"
                {...register("start_time")}
                disabled={disabled || !isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">Hora de Término</Label>
              <Input
                id="end_time"
                type="time"
                {...register("end_time")}
                disabled={disabled || !isEditing}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card: Localização */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#156634]" />
            Localização
          </CardTitle>
          <CardDescription className="text-xs mt-1">
            Onde o evento será realizado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="location">Nome do Local</Label>
            <Input
              id="location"
              {...register("location")}
              placeholder="Ex: Parque Ibirapuera"
              disabled={disabled || !isEditing}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                {...register("address")}
                placeholder="Rua, Avenida..."
                disabled={disabled || !isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address_number">Número</Label>
              <Input
                id="address_number"
                {...register("address_number")}
                placeholder="123"
                disabled={disabled || !isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip_code">CEP</Label>
              <Input
                id="zip_code"
                {...register("zip_code")}
                placeholder="00000-000"
                disabled={disabled || !isEditing}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                {...register("city")}
                placeholder="São Paulo"
                disabled={disabled || !isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                {...register("state")}
                placeholder="SP"
                disabled={disabled || !isEditing}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card: Descrição */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#156634]" />
            Descrição do Evento
          </CardTitle>
          <CardDescription className="text-xs mt-1">
            Descreva os detalhes do seu evento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <ReactQuill
                theme="snow"
                value={field.value || ""}
                onChange={field.onChange}
                readOnly={disabled || !isEditing}
                className="bg-white"
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
            )}
          />
        </CardContent>
      </Card>

      {/* Botão de Salvar */}
      {isEditing && isDirty && (
        <div className="sticky bottom-4 flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#156634] hover:bg-[#1a7a3e] text-white shadow-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      )}
    </form>
  )
}

