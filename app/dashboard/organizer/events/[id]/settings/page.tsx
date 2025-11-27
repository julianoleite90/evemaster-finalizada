"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Settings,
  CreditCard,
  BarChart3,
  Mail,
  ShoppingCart,
  Save,
  ArrowLeft,
  Info,
  Facebook,
  Search,
  Code,
  FileText,
  Loader2,
  Upload,
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { getEventById, updateEvent } from "@/lib/supabase/events"
import { uploadEventBanner } from "@/lib/supabase/storage"
import dynamic from "next/dynamic"

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false })
import "react-quill/dist/quill.snow.css"

// Modalidades esportivas
const MODALIDADES_ESPORTIVAS = [
  { value: "corrida", label: "Corrida" },
  { value: "ciclismo", label: "Ciclismo" },
  { value: "triatlo", label: "Triatlo" },
  { value: "natacao", label: "Natação" },
  { value: "caminhada", label: "Caminhada" },
  { value: "trail-running", label: "Trail Running" },
  { value: "mountain-bike", label: "Mountain Bike" },
  { value: "duatlo", label: "Duatlo" },
  { value: "aquatlo", label: "Aquatlo" },
  { value: "ciclismo-estrada", label: "Ciclismo de Estrada" },
  { value: "ciclismo-mtb", label: "Ciclismo MTB" },
  { value: "outro", label: "Outro" },
]

export default function EventSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newBanner, setNewBanner] = useState<File | null>(null)

  // Dados básicos do evento
  const [eventData, setEventData] = useState({
    name: "",
    description: "",
    category: "",
    event_date: "",
    start_time: "",
    end_time: "",
    location: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    banner_url: "",
    status: "draft",
  })

  // Carregar dados do evento
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true)
        const event = await getEventById(eventId)
        if (event) {
          setEventData({
            name: event.name || "",
            description: event.description || "",
            category: event.category || "",
            event_date: event.event_date || "",
            start_time: event.start_time || "",
            end_time: event.end_time || "",
            location: event.location || "",
            address: event.address || "",
            city: event.city || "",
            state: event.state || "",
            zip_code: event.zip_code || "",
            banner_url: event.banner_url || "",
            status: event.status || "draft",
          })
        }
      } catch (error) {
        console.error("Erro ao carregar evento:", error)
        toast.error("Erro ao carregar dados do evento")
      } finally {
        setLoading(false)
      }
    }

    if (eventId) {
      fetchEvent()
    }
  }, [eventId])

  const [settings, setSettings] = useState({
    // Meios de Pagamento
    meiosPagamento: {
      pix: {
        habilitado: true,
      },
      cartaoCredito: {
        habilitado: true,
        maxParcelas: 12,
        assumirJuros: false,
      },
      boleto: {
        habilitado: true,
      },
    },

    // Analytics
    analytics: {
      facebookPixel: {
        habilitado: false,
        pixelId: "",
      },
      googleAnalytics: {
        habilitado: false,
        trackingId: "",
      },
      googleTagManager: {
        habilitado: false,
        containerId: "",
      },
    },

    // Orderbump
    orderbump: {
      habilitado: false,
      titulo: "",
      descricao: "",
      valor: "",
      imagem: null as File | null,
    },

    // Email Marketing
    emailMarketing: {
      habilitado: false,
      emailConfirmacao: {
        habilitado: true,
        assunto: "Confirmação de Inscrição",
        template: "",
      },
      emailLembrete: {
        habilitado: false,
        diasAntes: 7,
        assunto: "Lembrete do Evento",
        template: "",
      },
      emailBoasVindas: {
        habilitado: false,
        assunto: "Bem-vindo ao Evento",
        template: "",
      },
    },
  })

  const handleSaveEventData = async () => {
    try {
      setSaving(true)
      const supabase = createClient()

      console.log("=== SALVANDO EVENTO ===")
      console.log("Event ID:", eventId)
      console.log("Status a salvar:", eventData.status)

      // Se tem novo banner, fazer upload
      let bannerUrl = eventData.banner_url
      if (newBanner) {
        try {
          bannerUrl = await uploadEventBanner(newBanner, eventId)
          toast.success("Banner atualizado!")
        } catch (error) {
          console.error("Erro ao fazer upload do banner:", error)
          toast.error("Erro ao fazer upload do banner")
        }
      }

      const updateData = {
        name: eventData.name,
        description: eventData.description,
        category: eventData.category,
        event_date: eventData.event_date,
        start_time: eventData.start_time,
        end_time: eventData.end_time || null,
        location: eventData.location,
        address: eventData.address,
        city: eventData.city,
        state: eventData.state,
        zip_code: eventData.zip_code,
        banner_url: bannerUrl,
        status: eventData.status,
        updated_at: new Date().toISOString(),
      }

      console.log("Dados a atualizar:", updateData)

      // Atualizar evento
      const { data, error } = await supabase
        .from("events")
        .update(updateData)
        .eq("id", eventId)
        .select()
        .single()

      console.log("Resultado update:", { data, error })

      if (error) {
        console.error("Erro no update:", error)
        throw error
      }

      if (!data) {
        console.error("Nenhum dado retornado do update")
        toast.error("Erro: evento não encontrado")
        return
      }

      console.log("Status salvo no banco:", data.status)

      setEventData(prev => ({ ...prev, banner_url: bannerUrl, status: data.status }))
      setNewBanner(null)
      
      toast.success(`Evento salvo! Status: ${data.status === 'active' ? 'Ativo' : data.status === 'draft' ? 'Rascunho' : data.status}`)
    } catch (error: any) {
      console.error("Erro ao salvar evento:", error)
      toast.error("Erro ao salvar evento")
    } finally {
      setSaving(false)
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configurações do Evento</h1>
            <p className="text-muted-foreground">
              Personalize e configure todas as opções do seu evento
            </p>
          </div>
        </div>
        <Button onClick={handleSaveEventData} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="evento" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="evento" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Dados do Evento
          </TabsTrigger>
          <TabsTrigger value="pagamento" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Pagamento
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="orderbump" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Orderbump
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="outros" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Outros
          </TabsTrigger>
        </TabsList>

        {/* Tab: Dados do Evento */}
        <TabsContent value="evento" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>
                Edite as informações principais do evento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="name">Nome do Evento *</Label>
                  <Input
                    id="name"
                    value={eventData.name}
                    onChange={(e) => setEventData({ ...eventData, name: e.target.value })}
                    placeholder="Nome do evento"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select
                    value={eventData.category}
                    onValueChange={(value) => setEventData({ ...eventData, category: value })}
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
                  <Label htmlFor="status">Status do Evento</Label>
                  <Select
                    value={eventData.status}
                    onValueChange={(value) => {
                      console.log("Mudando status para:", value)
                      setEventData({ ...eventData, status: value })
                    }}
                  >
                    <SelectTrigger>
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

                <div className="space-y-2">
                  <Label htmlFor="event_date">Data do Evento *</Label>
                  <Input
                    id="event_date"
                    type="date"
                    value={eventData.event_date}
                    onChange={(e) => setEventData({ ...eventData, event_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_time">Horário de Início *</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={eventData.start_time}
                    onChange={(e) => setEventData({ ...eventData, start_time: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_time">Horário de Término</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={eventData.end_time}
                    onChange={(e) => setEventData({ ...eventData, end_time: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Local do Evento</CardTitle>
              <CardDescription>
                Endereço onde o evento será realizado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="location">Local / Nome do Estabelecimento</Label>
                  <Input
                    id="location"
                    value={eventData.location}
                    onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
                    placeholder="Ex: Praça da Liberdade"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={eventData.address}
                    onChange={(e) => setEventData({ ...eventData, address: e.target.value })}
                    placeholder="Ex: Av. Beira Mar, 1000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={eventData.city}
                    onChange={(e) => setEventData({ ...eventData, city: e.target.value })}
                    placeholder="Ex: Florianópolis"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={eventData.state}
                    onChange={(e) => setEventData({ ...eventData, state: e.target.value })}
                    placeholder="Ex: SC"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip_code">CEP</Label>
                  <Input
                    id="zip_code"
                    value={eventData.zip_code}
                    onChange={(e) => setEventData({ ...eventData, zip_code: e.target.value })}
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Banner do Evento</CardTitle>
              <CardDescription>
                Imagem que será exibida no topo da página do evento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {eventData.banner_url && (
                <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={eventData.banner_url}
                    alt="Banner atual"
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-2 right-2 bg-green-600">
                    Banner atual
                  </Badge>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="newBanner">
                  {eventData.banner_url ? "Trocar Banner" : "Adicionar Banner"}
                </Label>
                <Input
                  id="newBanner"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewBanner(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
                {newBanner && (
                  <p className="text-sm text-green-600">
                    ✓ Novo banner selecionado: {newBanner.name}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Tamanho recomendado: 1920x600px (formato JPG ou PNG)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Descrição do Evento</CardTitle>
              <CardDescription>
                Texto que será exibido na página do evento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
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
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveEventData} disabled={saving}>
              {saving ? (
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
        </TabsContent>

        {/* Tab: Meios de Pagamento */}
        <TabsContent value="pagamento" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Meios de Pagamento</CardTitle>
              <CardDescription>
                Configure quais meios de pagamento estarão disponíveis para os participantes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* PIX */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-700 font-bold text-sm">PIX</span>
                  </div>
                  <div>
                    <Label className="text-base font-medium cursor-pointer">PIX</Label>
                    <p className="text-xs text-muted-foreground">Pagamento instantâneo</p>
                  </div>
                </div>
                <Checkbox
                  checked={settings.meiosPagamento.pix.habilitado}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      meiosPagamento: {
                        ...settings.meiosPagamento,
                        pix: {
                          ...settings.meiosPagamento.pix,
                          habilitado: checked as boolean,
                        },
                      },
                    })
                  }
                />
              </div>

              {/* Cartão de Crédito */}
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <div>
                      <Label className="text-base font-medium cursor-pointer">
                        Cartão de Crédito
                      </Label>
                      <p className="text-xs text-muted-foreground">Pagamento parcelado</p>
                    </div>
                  </div>
                  <Checkbox
                    checked={settings.meiosPagamento.cartaoCredito.habilitado}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        meiosPagamento: {
                          ...settings.meiosPagamento,
                          cartaoCredito: {
                            ...settings.meiosPagamento.cartaoCredito,
                            habilitado: checked as boolean,
                          },
                        },
                      })
                    }
                  />
                </div>

                {settings.meiosPagamento.cartaoCredito.habilitado && (
                  <div className="space-y-4 pt-4 border-t pl-8">
                    <div className="space-y-2">
                      <Label htmlFor="maxParcelas">Máximo de Parcelas</Label>
                      <Select
                        value={settings.meiosPagamento.cartaoCredito.maxParcelas.toString()}
                        onValueChange={(value) =>
                          setSettings({
                            ...settings,
                            meiosPagamento: {
                              ...settings.meiosPagamento,
                              cartaoCredito: {
                                ...settings.meiosPagamento.cartaoCredito,
                                maxParcelas: parseInt(value),
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger id="maxParcelas" className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num}x
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex-1">
                        <Label className="text-sm font-medium cursor-pointer">
                          Assumir Juros do Parcelamento
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Se não assumir, os juros serão repassados para o comprador final
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {settings.meiosPagamento.cartaoCredito.assumirJuros ? "Sim" : "Não"}
                        </span>
                        <Checkbox
                          checked={settings.meiosPagamento.cartaoCredito.assumirJuros}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              meiosPagamento: {
                                ...settings.meiosPagamento,
                                cartaoCredito: {
                                  ...settings.meiosPagamento.cartaoCredito,
                                  assumirJuros: checked as boolean,
                                },
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Boleto Bancário */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-orange-700 font-bold text-xs">BOLETO</span>
                  </div>
                  <div>
                    <Label className="text-base font-medium cursor-pointer">
                      Boleto Bancário
                    </Label>
                    <p className="text-xs text-muted-foreground">Pagamento com vencimento</p>
                  </div>
                </div>
                <Checkbox
                  checked={settings.meiosPagamento.boleto.habilitado}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      meiosPagamento: {
                        ...settings.meiosPagamento,
                        boleto: {
                          ...settings.meiosPagamento.boleto,
                          habilitado: checked as boolean,
                        },
                      },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tags de Analytics</CardTitle>
              <CardDescription>
                Configure as tags de rastreamento para monitorar conversões e comportamento dos visitantes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Facebook Pixel */}
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Facebook className="h-5 w-5 text-blue-600" />
                    <div>
                      <Label className="text-base font-medium cursor-pointer">
                        Facebook Pixel
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Rastreie conversões e crie públicos personalizados
                      </p>
                    </div>
                  </div>
                  <Checkbox
                    checked={settings.analytics.facebookPixel.habilitado}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        analytics: {
                          ...settings.analytics,
                          facebookPixel: {
                            ...settings.analytics.facebookPixel,
                            habilitado: checked as boolean,
                          },
                        },
                      })
                    }
                  />
                </div>

                {settings.analytics.facebookPixel.habilitado && (
                  <div className="space-y-2 pl-8">
                    <Label htmlFor="facebookPixelId">ID do Pixel</Label>
                    <Input
                      id="facebookPixelId"
                      placeholder="Ex: 123456789012345"
                      value={settings.analytics.facebookPixel.pixelId}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          analytics: {
                            ...settings.analytics,
                            facebookPixel: {
                              ...settings.analytics.facebookPixel,
                              pixelId: e.target.value,
                            },
                          },
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Encontre o ID do seu Pixel no{" "}
                      <a
                        href="https://business.facebook.com/events_manager"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#156634] hover:underline"
                      >
                        Gerenciador de Eventos do Facebook
                      </a>
                    </p>
                  </div>
                )}
              </div>

              {/* Google Analytics */}
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Search className="h-5 w-5 text-blue-600" />
                    <div>
                      <Label className="text-base font-medium cursor-pointer">
                        Google Analytics
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Analise o comportamento dos visitantes e conversões
                      </p>
                    </div>
                  </div>
                  <Checkbox
                    checked={settings.analytics.googleAnalytics.habilitado}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        analytics: {
                          ...settings.analytics,
                          googleAnalytics: {
                            ...settings.analytics.googleAnalytics,
                            habilitado: checked as boolean,
                          },
                        },
                      })
                    }
                  />
                </div>

                {settings.analytics.googleAnalytics.habilitado && (
                  <div className="space-y-2 pl-8">
                    <Label htmlFor="gaTrackingId">ID de Rastreamento (G-XXXXXXXXXX)</Label>
                    <Input
                      id="gaTrackingId"
                      placeholder="Ex: G-XXXXXXXXXX"
                      value={settings.analytics.googleAnalytics.trackingId}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          analytics: {
                            ...settings.analytics,
                            googleAnalytics: {
                              ...settings.analytics.googleAnalytics,
                              trackingId: e.target.value,
                            },
                          },
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Encontre o ID no{" "}
                      <a
                        href="https://analytics.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#156634] hover:underline"
                      >
                        Google Analytics
                      </a>
                    </p>
                  </div>
                )}
              </div>

              {/* Google Tag Manager */}
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Code className="h-5 w-5 text-green-600" />
                    <div>
                      <Label className="text-base font-medium cursor-pointer">
                        Google Tag Manager
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Gerencie todas as tags de rastreamento em um só lugar
                      </p>
                    </div>
                  </div>
                  <Checkbox
                    checked={settings.analytics.googleTagManager.habilitado}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        analytics: {
                          ...settings.analytics,
                          googleTagManager: {
                            ...settings.analytics.googleTagManager,
                            habilitado: checked as boolean,
                          },
                        },
                      })
                    }
                  />
                </div>

                {settings.analytics.googleTagManager.habilitado && (
                  <div className="space-y-2 pl-8">
                    <Label htmlFor="gtmContainerId">ID do Container (GTM-XXXXXXX)</Label>
                    <Input
                      id="gtmContainerId"
                      placeholder="Ex: GTM-XXXXXXX"
                      value={settings.analytics.googleTagManager.containerId}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          analytics: {
                            ...settings.analytics,
                            googleTagManager: {
                              ...settings.analytics.googleTagManager,
                              containerId: e.target.value,
                            },
                          },
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Encontre o ID no{" "}
                      <a
                        href="https://tagmanager.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#156634] hover:underline"
                      >
                        Google Tag Manager
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Orderbump */}
        <TabsContent value="orderbump" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Orderbump</CardTitle>
              <CardDescription>
                Ofereça um produto adicional durante o processo de checkout para aumentar sua receita
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base font-medium cursor-pointer">
                    Habilitar Orderbump
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Exibir oferta adicional durante a inscrição
                  </p>
                </div>
                <Checkbox
                  checked={settings.orderbump.habilitado}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      orderbump: {
                        ...settings.orderbump,
                        habilitado: checked as boolean,
                      },
                    })
                  }
                />
              </div>

              {settings.orderbump.habilitado && (
                <div className="space-y-4 p-4 bg-gray-50 border rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="orderbumpTitulo">Título do Orderbump *</Label>
                    <Input
                      id="orderbumpTitulo"
                      placeholder="Ex: Kit Premium do Atleta"
                      value={settings.orderbump.titulo}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          orderbump: {
                            ...settings.orderbump,
                            titulo: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="orderbumpDescricao">Descrição *</Label>
                    <textarea
                      id="orderbumpDescricao"
                      className="w-full min-h-[100px] px-3 py-2 text-sm border rounded-md resize-none"
                      placeholder="Descreva o produto ou serviço adicional..."
                      value={settings.orderbump.descricao}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          orderbump: {
                            ...settings.orderbump,
                            descricao: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="orderbumpValor">Valor *</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">R$</span>
                      <Input
                        id="orderbumpValor"
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={settings.orderbump.valor}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            orderbump: {
                              ...settings.orderbump,
                              valor: e.target.value,
                            },
                          })
                        }
                        className="w-32"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="orderbumpImagem">Imagem do Produto</Label>
                    <Input
                      id="orderbumpImagem"
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          orderbump: {
                            ...settings.orderbump,
                            imagem: e.target.files?.[0] || null,
                          },
                        })
                      }
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">
                      Tamanho recomendado: 400x400px
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Email Marketing */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Marketing</CardTitle>
              <CardDescription>
                Configure os emails automáticos enviados aos participantes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email de Confirmação */}
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium cursor-pointer">
                      Email de Confirmação
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Enviado automaticamente após a inscrição
                    </p>
                  </div>
                  <Checkbox
                    checked={settings.emailMarketing.emailConfirmacao.habilitado}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        emailMarketing: {
                          ...settings.emailMarketing,
                          emailConfirmacao: {
                            ...settings.emailMarketing.emailConfirmacao,
                            habilitado: checked as boolean,
                          },
                        },
                      })
                    }
                  />
                </div>

                {settings.emailMarketing.emailConfirmacao.habilitado && (
                  <div className="space-y-4 pl-8 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="confirmacaoAssunto">Assunto do Email</Label>
                      <Input
                        id="confirmacaoAssunto"
                        value={settings.emailMarketing.emailConfirmacao.assunto}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            emailMarketing: {
                              ...settings.emailMarketing,
                              emailConfirmacao: {
                                ...settings.emailMarketing.emailConfirmacao,
                                assunto: e.target.value,
                              },
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Email de Lembrete */}
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium cursor-pointer">
                      Email de Lembrete
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Enviado alguns dias antes do evento
                    </p>
                  </div>
                  <Checkbox
                    checked={settings.emailMarketing.emailLembrete.habilitado}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        emailMarketing: {
                          ...settings.emailMarketing,
                          emailLembrete: {
                            ...settings.emailMarketing.emailLembrete,
                            habilitado: checked as boolean,
                          },
                        },
                      })
                    }
                  />
                </div>

                {settings.emailMarketing.emailLembrete.habilitado && (
                  <div className="space-y-4 pl-8 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="lembreteDias">Enviar quantos dias antes?</Label>
                      <Input
                        id="lembreteDias"
                        type="number"
                        min="1"
                        value={settings.emailMarketing.emailLembrete.diasAntes}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            emailMarketing: {
                              ...settings.emailMarketing,
                              emailLembrete: {
                                ...settings.emailMarketing.emailLembrete,
                                diasAntes: parseInt(e.target.value) || 7,
                              },
                            },
                          })
                        }
                        className="w-32"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lembreteAssunto">Assunto do Email</Label>
                      <Input
                        id="lembreteAssunto"
                        value={settings.emailMarketing.emailLembrete.assunto}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            emailMarketing: {
                              ...settings.emailMarketing,
                              emailLembrete: {
                                ...settings.emailMarketing.emailLembrete,
                                assunto: e.target.value,
                              },
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Email de Boas-vindas */}
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium cursor-pointer">
                      Email de Boas-vindas
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Enviado após a confirmação da inscrição
                    </p>
                  </div>
                  <Checkbox
                    checked={settings.emailMarketing.emailBoasVindas.habilitado}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        emailMarketing: {
                          ...settings.emailMarketing,
                          emailBoasVindas: {
                            ...settings.emailMarketing.emailBoasVindas,
                            habilitado: checked as boolean,
                          },
                        },
                      })
                    }
                  />
                </div>

                {settings.emailMarketing.emailBoasVindas.habilitado && (
                  <div className="space-y-4 pl-8 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="boasVindasAssunto">Assunto do Email</Label>
                      <Input
                        id="boasVindasAssunto"
                        value={settings.emailMarketing.emailBoasVindas.assunto}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            emailMarketing: {
                              ...settings.emailMarketing,
                              emailBoasVindas: {
                                ...settings.emailMarketing.emailBoasVindas,
                                assunto: e.target.value,
                              },
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Outros */}
        <TabsContent value="outros" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Outras Configurações</CardTitle>
              <CardDescription>
                Configurações adicionais do evento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Mais configurações em breve
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Novas funcionalidades serão adicionadas aqui
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

