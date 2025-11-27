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
import { Separator } from "@/components/ui/separator"
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
  MapPin,
  Calendar,
  Clock,
  Trophy,
  Package,
  Plus,
  Trash2,
  Edit,
  ChevronDown,
  ChevronUp,
  Route,
  Mountain,
  Edit3,
  Tag,
  UserPlus,
  TrendingUp,
  Users,
  DollarSign,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { getEventById } from "@/lib/supabase/events"
import { uploadEventBanner, uploadTicketGPX } from "@/lib/supabase/storage"
import dynamic from "next/dynamic"
import Image from "next/image"

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

// Tamanhos de camiseta
const TAMANHOS_CAMISETA = [
  { value: "PP", label: "PP" },
  { value: "P", label: "P" },
  { value: "M", label: "M" },
  { value: "G", label: "G" },
  { value: "GG", label: "GG" },
  { value: "XG", label: "XG" },
  { value: "XXG", label: "XXG" },
]

// Itens do kit
const ITENS_KIT = [
  { value: "camiseta", label: "Camiseta" },
  { value: "medalha", label: "Medalha" },
  { value: "numero", label: "Número de Peito" },
  { value: "chip", label: "Chip de Cronometragem" },
  { value: "sacola", label: "Sacola" },
  { value: "outros", label: "Outros" },
]

export default function EventSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newBanner, setNewBanner] = useState<File | null>(null)
  const [expandedBatches, setExpandedBatches] = useState<{ [key: string]: boolean }>({})
  const [mainMenu, setMainMenu] = useState<"edicao" | "configuracao" | "relatorios">("edicao")
  const [subMenu, setSubMenu] = useState<string>("basico")

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

  // Lotes e ingressos
  const [batches, setBatches] = useState<any[]>([])

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

          // Carregar lotes e ingressos
          if (event.ticket_batches) {
            setBatches(event.ticket_batches.map((batch: any) => ({
              ...batch,
              tickets: batch.tickets || [],
            })))
            // Expandir primeiro lote por padrão
            if (event.ticket_batches.length > 0) {
              setExpandedBatches({ [event.ticket_batches[0].id]: true })
            }
          }
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

  const toggleBatch = (batchId: string) => {
    setExpandedBatches(prev => ({
      ...prev,
      [batchId]: !prev[batchId]
    }))
  }

  const handleSaveEventData = async () => {
    try {
      setSaving(true)
      const supabase = createClient()

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

      const { data, error } = await supabase
        .from("events")
        .update(updateData)
        .eq("id", eventId)
        .select()
        .single()

      if (error) throw error

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

  const handleSaveBatches = async () => {
    try {
      setSaving(true)
      const supabase = createClient()

      for (const batch of batches) {
        let batchId = batch.id

        // Se é um novo lote, criar
        if (batch.isNew || batch.id.startsWith('new-')) {
          const { data: newBatch, error: batchError } = await supabase
            .from("ticket_batches")
            .insert({
              event_id: eventId,
              name: batch.name,
              start_date: batch.start_date,
              start_time: batch.start_time,
              end_date: batch.end_date || batch.start_date,
              total_quantity: batch.total_quantity,
              is_active: batch.is_active !== false,
            })
            .select()
            .single()

          if (batchError) {
            console.error("Erro ao criar lote:", batchError)
            toast.error(`Erro ao criar lote ${batch.name}`)
            continue
          }

          batchId = newBatch.id
          // Atualizar o ID no estado
          setBatches(prev => prev.map(b =>
            b.id === batch.id ? { ...b, id: batchId, isNew: false } : b
          ))
        } else {
          // Atualizar lote existente
          const { error: batchError } = await supabase
            .from("ticket_batches")
            .update({
              name: batch.name,
              start_date: batch.start_date,
              start_time: batch.start_time,
              end_date: batch.end_date,
              total_quantity: batch.total_quantity,
              is_active: batch.is_active,
              updated_at: new Date().toISOString(),
            })
            .eq("id", batch.id)

          if (batchError) {
            console.error("Erro ao atualizar lote:", batchError)
            toast.error(`Erro ao atualizar lote ${batch.name}`)
            continue
          }
        }

        // Processar ingressos
        for (const ticket of batch.tickets || []) {
          // Se é um novo ingresso, criar
          if (ticket.isNew || ticket.id.startsWith('new-ticket-')) {
            // Converter shirt_quantities para o formato correto (objeto com números)
            const shirtQuantities = Object.entries(ticket.shirt_quantities || {}).reduce<Record<string, number>>(
              (acc, [size, value]) => {
                const parsed = parseInt(value as string || "0", 10)
                if (!Number.isNaN(parsed)) {
                  acc[size] = parsed
                }
                return acc
              },
              {}
            )

            const ticketData: any = {
              batch_id: batchId,
              category: ticket.category,
              price: ticket.price || 0,
              is_free: ticket.is_free || false,
              quantity: ticket.quantity || 0,
              has_kit: ticket.has_kit || false,
              kit_items: ticket.kit_items || [],
              shirt_sizes: ticket.shirt_sizes || [],
              shirt_quantities: shirtQuantities,
              show_route: ticket.show_route || false,
              show_map: ticket.show_map || false,
              show_elevation: ticket.show_elevation || false,
            }

            const { data: newTicket, error: ticketError } = await supabase
              .from("tickets")
              .insert(ticketData)
              .select()
              .single()

            if (ticketError) {
              console.error("Erro ao criar ticket:", ticketError)
              toast.error(`Erro ao criar ingresso ${ticket.category}`)
              continue
            }

            // Se tem novo arquivo GPX, fazer upload
            if (ticket.newGpxFile && newTicket.id) {
              try {
                const gpxUrl = await uploadTicketGPX(ticket.newGpxFile, eventId, newTicket.id)
                await supabase
                  .from("tickets")
                  .update({ gpx_file_url: gpxUrl })
                  .eq("id", newTicket.id)
              } catch (error) {
                console.error("Erro ao fazer upload do GPX:", error)
                toast.error(`Erro ao fazer upload do GPX para ${ticket.category}`)
              }
            }

            // Atualizar o ID no estado
            setBatches(prev => prev.map(b =>
              b.id === batchId
                ? {
                    ...b,
                    tickets: b.tickets.map((t: any) =>
                      t.id === ticket.id ? { ...t, id: newTicket.id, isNew: false } : t
                    )
                  }
                : b
            ))
          } else {
            // Atualizar ingresso existente
            // Converter shirt_quantities para o formato correto (objeto com números)
            const shirtQuantities = Object.entries(ticket.shirt_quantities || {}).reduce<Record<string, number>>(
              (acc, [size, value]) => {
                const parsed = parseInt(value as string || "0", 10)
                if (!Number.isNaN(parsed)) {
                  acc[size] = parsed
                }
                return acc
              },
              {}
            )

            const ticketUpdate: any = {
              category: ticket.category,
              price: ticket.price,
              is_free: ticket.is_free,
              quantity: ticket.quantity,
              has_kit: ticket.has_kit,
              kit_items: ticket.kit_items || [],
              shirt_sizes: ticket.shirt_sizes || [],
              shirt_quantities: shirtQuantities,
              show_route: ticket.show_route || false,
              show_map: ticket.show_map || false,
              show_elevation: ticket.show_elevation || false,
              updated_at: new Date().toISOString(),
            }

            // Se tem novo arquivo GPX, fazer upload
            if (ticket.newGpxFile) {
              try {
                const gpxUrl = await uploadTicketGPX(ticket.newGpxFile, eventId, ticket.id)
                ticketUpdate.gpx_file_url = gpxUrl
              } catch (error) {
                console.error("Erro ao fazer upload do GPX:", error)
                toast.error(`Erro ao fazer upload do GPX para ${ticket.category}`)
              }
            }

            const { error: ticketError } = await supabase
              .from("tickets")
              .update(ticketUpdate)
              .eq("id", ticket.id)

            if (ticketError) {
              console.error("Erro ao atualizar ticket:", ticketError)
              toast.error(`Erro ao atualizar ingresso ${ticket.category}`)
            }
          }
        }
      }

      toast.success("Lotes e ingressos salvos com sucesso!")
      
      // Recarregar dados para atualizar IDs
      const event = await getEventById(eventId)
      if (event && event.ticket_batches) {
        setBatches(event.ticket_batches.map((batch: any) => ({
          ...batch,
          tickets: batch.tickets || [],
        })))
      }
    } catch (error: any) {
      console.error("Erro ao salvar lotes:", error)
      toast.error("Erro ao salvar lotes e ingressos")
    } finally {
      setSaving(false)
    }
  }

  const updateBatch = (batchId: string, field: string, value: any) => {
    setBatches(prev => prev.map(batch =>
      batch.id === batchId ? { ...batch, [field]: value } : batch
    ))
  }

  const updateTicket = (batchId: string, ticketId: string, field: string, value: any) => {
    setBatches(prev => prev.map(batch =>
      batch.id === batchId
        ? {
            ...batch,
            tickets: batch.tickets.map((ticket: any) =>
              ticket.id === ticketId ? { ...ticket, [field]: value } : ticket
            )
          }
        : batch
    ))
  }

  const addNewBatch = () => {
    const newBatch = {
      id: `new-${Date.now()}`,
      name: `Lote ${batches.length + 1}`,
      start_date: eventData.event_date || new Date().toISOString().split('T')[0],
      start_time: "00:00",
      end_date: eventData.event_date || new Date().toISOString().split('T')[0],
      total_quantity: 0,
      is_active: true,
      tickets: [],
      isNew: true,
    }
    setBatches(prev => [...prev, newBatch])
    setExpandedBatches(prev => ({ ...prev, [newBatch.id]: true }))
  }

  const removeBatch = (batchId: string) => {
    setBatches(prev => prev.filter(batch => batch.id !== batchId))
    setExpandedBatches(prev => {
      const newState = { ...prev }
      delete newState[batchId]
      return newState
    })
  }

  const addTicketToBatch = (batchId: string) => {
    setBatches(prev => prev.map(batch =>
      batch.id === batchId
        ? {
            ...batch,
            tickets: [
              ...(batch.tickets || []),
              {
                id: `new-ticket-${Date.now()}`,
                category: "Nova Categoria",
                price: 0,
                is_free: false,
                quantity: 0,
                has_kit: false,
                kit_items: [],
                shirt_sizes: [],
                shirt_quantities: {},
                show_route: false,
                show_map: false,
                show_elevation: false,
                isNew: true,
              }
            ]
          }
        : batch
    ))
  }

  const removeTicket = (batchId: string, ticketId: string) => {
    setBatches(prev => prev.map(batch =>
      batch.id === batchId
        ? {
            ...batch,
            tickets: batch.tickets.filter((ticket: any) => ticket.id !== ticketId)
          }
        : batch
    ))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Profissional */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
                  {eventData.name || "Editar Evento"}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Gerencie todas as configurações do seu evento
            </p>
          </div>
        </div>
            <Button 
              onClick={handleSaveEventData} 
              disabled={saving} 
              className="bg-[#156634] hover:bg-[#1a7a3e] text-white shadow-md"
            >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
                  Salvar Evento
            </>
          )}
        </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">

      {/* Menu Superior Principal */}
      <div className="mb-6">
        <div className="flex items-center gap-2 border-b border-gray-200">
          <button
            onClick={() => {
              setMainMenu("edicao")
              setSubMenu("basico")
            }}
            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
              mainMenu === "edicao"
                ? "border-[#156634] text-[#156634]"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Edição
            </div>
          </button>
          <button
            onClick={() => {
              setMainMenu("configuracao")
              setSubMenu("pixels")
            }}
            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
              mainMenu === "configuracao"
                ? "border-[#156634] text-[#156634]"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuração
            </div>
          </button>
          <button
            onClick={() => {
              setMainMenu("relatorios")
              setSubMenu("inscricoes")
            }}
            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
              mainMenu === "relatorios"
                ? "border-[#156634] text-[#156634]"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Relatórios
            </div>
          </button>
        </div>
      </div>

      {/* Submenu de Edição */}
      {mainMenu === "edicao" && (
        <div className="mb-6">
          <Tabs value={subMenu} onValueChange={setSubMenu} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2 bg-gray-100 p-1 rounded-lg">
              <TabsTrigger 
                value="basico" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
            <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Básico</span>
          </TabsTrigger>
              <TabsTrigger 
                value="lotes" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Trophy className="h-4 w-4" />
                <span className="hidden sm:inline">Lotes & Ingressos</span>
                <span className="sm:hidden">Lotes</span>
          </TabsTrigger>
              <TabsTrigger 
                value="mapas" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Route className="h-4 w-4" />
                <span className="hidden sm:inline">Mapas</span>
          </TabsTrigger>
              <TabsTrigger 
                value="pagamento" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Pagamento</span>
          </TabsTrigger>
              <TabsTrigger 
                value="outros" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
            <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Outros</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Básico */}
        <TabsContent value="basico" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna Principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Informações Básicas */}
          <Card className="border-2 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#156634]" />
                Informações Básicas
              </CardTitle>
              <CardDescription>
                    Dados principais do evento
              </CardDescription>
            </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                  <Label htmlFor="name">Nome do Evento *</Label>
                  <Input
                    id="name"
                    value={eventData.name}
                    onChange={(e) => setEventData({ ...eventData, name: e.target.value })}
                    placeholder="Nome do evento"
                  />
                </div>

                  <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select
                    value={eventData.category}
                    onValueChange={(value) => setEventData({ ...eventData, category: value })}
                  >
                    <SelectTrigger>
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
                </div>

                <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                  <Select
                    value={eventData.status}
                        onValueChange={(value) => setEventData({ ...eventData, status: value })}
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
                </div>

                  <div className="grid grid-cols-2 gap-4">
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
              </div>
            </CardContent>
          </Card>

              {/* Localização */}
          <Card className="border-2 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[#156634]" />
                    Localização
                  </CardTitle>
              <CardDescription>
                    Onde o evento será realizado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                  <div className="space-y-2">
                  <Label htmlFor="location">Local / Nome do Estabelecimento</Label>
                  <Input
                    id="location"
                    value={eventData.location}
                    onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
                    placeholder="Ex: Praça da Liberdade"
                  />
                </div>

                  <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={eventData.address}
                    onChange={(e) => setEventData({ ...eventData, address: e.target.value })}
                    placeholder="Ex: Av. Beira Mar, 1000"
                  />
                </div>

                  <div className="grid grid-cols-3 gap-4">
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

              {/* Descrição */}
              <Card className="border-2 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[#156634]" />
                    Descrição do Evento
                  </CardTitle>
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
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Banner */}
          <Card className="border-2 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="h-5 w-5 text-[#156634]" />
                Banner do Evento
              </CardTitle>
              <CardDescription>
                    Imagem principal do evento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {eventData.banner_url && (
                    <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={eventData.banner_url}
                    alt="Banner atual"
                    fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
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
                        ✓ Novo banner: {newBanner.name}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
              </div>
          </div>
        </TabsContent>

        {/* Tab: Lotes & Ingressos */}
        <TabsContent value="lotes" className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Trophy className="h-6 w-6 text-[#156634]" />
                Lotes e Ingressos
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Gerencie os lotes de venda e os ingressos do evento
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button onClick={addNewBatch} variant="outline" className="flex-1 sm:flex-initial">
                <Plus className="mr-2 h-4 w-4" />
                Novo Lote
              </Button>
              <Button 
                onClick={handleSaveBatches} 
                disabled={saving}
                className="bg-[#156634] hover:bg-[#1a7a3e] text-white flex-1 sm:flex-initial"
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
          </div>
          </div>

          {batches.length === 0 ? (
          <Card className="border-2 border-dashed">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum lote cadastrado</h3>
                <p className="text-sm text-gray-600 mb-6">Comece criando seu primeiro lote de ingressos</p>
                <Button onClick={addNewBatch} className="bg-[#156634] hover:bg-[#1a7a3e]">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Lote
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {batches.map((batch) => (
                <Card key={batch.id} className="overflow-hidden border-2 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader 
                    className="cursor-pointer hover:bg-gray-50 transition-colors bg-gradient-to-r from-gray-50 to-white border-b"
                    onClick={() => toggleBatch(batch.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          {expandedBatches[batch.id] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {batch.name}
                            {batch.isNew && (
                              <Badge variant="default" className="bg-blue-600">
                                Novo
                              </Badge>
                            )}
                          </CardTitle>
              <CardDescription>
                            {batch.total_quantity === null || batch.total_quantity === undefined
                              ? "Ilimitado"
                              : `${batch.total_quantity} ingressos`} • {batch.tickets?.length || 0} categorias
              </CardDescription>
                  </div>
                  </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={batch.is_active ? "default" : "secondary"}>
                          {batch.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                        {batch.isNew && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeBatch(batch.id)
                            }}
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                </div>
              </div>
            </CardHeader>

                  {expandedBatches[batch.id] && (
                    <CardContent className="space-y-6 pt-0">
                      {/* Dados do Lote */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Nome do Lote</Label>
                          <Input
                            value={batch.name}
                            onChange={(e) => updateBatch(batch.id, "name", e.target.value)}
                            className="h-9"
                          />
                  </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Data Início</Label>
                          <Input
                            type="date"
                            value={batch.start_date}
                            onChange={(e) => updateBatch(batch.id, "start_date", e.target.value)}
                            className="h-9"
                  />
                  </div>
                    <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Hora Início</Label>
                          <Input
                            type="time"
                            value={batch.start_time}
                            onChange={(e) => updateBatch(batch.id, "start_time", e.target.value)}
                            className="h-9"
                  />
                </div>
                    <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Quantidade Total</Label>
                          <Input
                            type="number"
                            min="0"
                            value={batch.total_quantity ?? ""}
                            onChange={(e) => {
                              const valor = e.target.value
                              if (valor === "") {
                                updateBatch(batch.id, "total_quantity", null)
                              } else {
                                const num = parseInt(valor)
                                if (!isNaN(num) && num >= 0) {
                                  updateBatch(batch.id, "total_quantity", num)
                                }
                              }
                            }}
                            placeholder="Deixe vazio para ilimitado"
                            className="h-9"
                        />
                        <p className="text-xs text-muted-foreground">
                          Deixe vazio para ilimitado
                        </p>
                      </div>
              </div>

                      <Separator />

                      {/* Ingressos */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b">
                          <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-[#156634]" />
                            Ingressos
                          </h3>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addTicketToBatch(batch.id)}
                            className="border-[#156634] text-[#156634] hover:bg-[#156634] hover:text-white"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar Ingresso
                          </Button>
                      </div>
                        {batch.tickets && batch.tickets.length > 0 ? (
                          <div className="space-y-4">
                            {batch.tickets.map((ticket: any) => (
                              <Card key={ticket.id} className="border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-5 space-y-5">
                                  <div className="flex items-center justify-between mb-3 pb-3 border-b">
                      <div className="flex items-center gap-2">
                                      <Badge variant={ticket.isNew ? "default" : "secondary"} className={ticket.isNew ? "bg-blue-600" : ""}>
                                        {ticket.isNew ? "Novo" : "Existente"}
                                      </Badge>
                                      <h4 className="font-semibold text-gray-900">{ticket.category}</h4>
                      </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeTicket(batch.id, ticket.id)}
                                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                    </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                      <Label className="text-xs font-medium text-gray-700">Categoria *</Label>
                                      <Input
                                        value={ticket.category}
                                        onChange={(e) => updateTicket(batch.id, ticket.id, "category", e.target.value)}
                                        className="h-10"
                                        placeholder="Ex: 5km, 10km"
                                      />
                  </div>
                                    <div className="space-y-2">
                                      <Label className="text-xs font-medium text-gray-700">Preço (R$)</Label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={ticket.price}
                                        onChange={(e) => updateTicket(batch.id, ticket.id, "price", parseFloat(e.target.value) || 0)}
                                        className="h-10"
                                        disabled={ticket.is_free}
                                        placeholder="0.00"
                                      />
              </div>
                                    <div className="space-y-2">
                                      <Label className="text-xs font-medium text-gray-700">Quantidade *</Label>
                                      <Input
                                        type="number"
                                        value={ticket.quantity}
                                        onChange={(e) => updateTicket(batch.id, ticket.id, "quantity", parseInt(e.target.value) || 0)}
                                        className="h-10"
                                        placeholder="0"
                                      />
                  </div>
                                    <div className="flex items-end">
                                      <div className="flex items-center space-x-2 w-full p-3 bg-gray-50 rounded-md border">
                <Checkbox
                                          id={`free-${ticket.id}`}
                                          checked={ticket.is_free}
                                          onCheckedChange={(checked) => updateTicket(batch.id, ticket.id, "is_free", checked)}
                                        />
                                        <Label htmlFor={`free-${ticket.id}`} className="text-xs font-medium cursor-pointer">
                                          Gratuito
                      </Label>
                    </div>
                  </div>
                                  </div>

                                  <Separator />

                                  {/* Configuração de Kit */}
                                  <div className="space-y-4 pt-3 border-t">
                                    <div className="flex items-center space-x-2">
                  <Checkbox
                                        id={`kit-${ticket.id}`}
                                        checked={ticket.has_kit || false}
                                        onCheckedChange={(checked) => {
                                          updateTicket(batch.id, ticket.id, "has_kit", checked)
                                          // Se desmarcar, limpa os dados do kit
                                          if (!checked) {
                                            updateTicket(batch.id, ticket.id, "kit_items", [])
                                            updateTicket(batch.id, ticket.id, "shirt_sizes", [])
                                            updateTicket(batch.id, ticket.id, "shirt_quantities", {})
                                          }
                                        }}
                                      />
                                      <Label htmlFor={`kit-${ticket.id}`} className="text-sm font-medium cursor-pointer flex items-center gap-2">
                                        <Package className="h-4 w-4" />
                                        Possui Kit
                                      </Label>
                </div>

                                    {ticket.has_kit && (
                                      <div className="pl-6 space-y-4">
                                        {/* Seleção de itens do kit */}
                    <div className="space-y-2">
                                          <Label className="text-sm">Itens do Kit</Label>
                                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {ITENS_KIT.map((item) => (
                                              <div key={item.value} className="flex items-center space-x-2">
                                                <Checkbox
                                                  id={`item-${batch.id}-${ticket.id}-${item.value}`}
                                                  checked={(ticket.kit_items || []).includes(item.value)}
                                                  onCheckedChange={(checked) => {
                                                    const itensAtuais = ticket.kit_items || []
                                                    const novosItens = checked
                                                      ? [...itensAtuais, item.value]
                                                      : itensAtuais.filter((i: string) => i !== item.value)
                                                    updateTicket(batch.id, ticket.id, "kit_items", novosItens)
                                                    
                                                    // Se desmarcar camiseta, limpa tamanhos e quantidades
                                                    if (!checked && item.value === "camiseta") {
                                                      updateTicket(batch.id, ticket.id, "shirt_sizes", [])
                                                      updateTicket(batch.id, ticket.id, "shirt_quantities", {})
                                                    }
                                                  }}
                                                />
                                                <Label
                                                  htmlFor={`item-${batch.id}-${ticket.id}-${item.value}`}
                                                  className="text-sm font-normal cursor-pointer"
                                                >
                                                  {item.label}
                      </Label>
                    </div>
                                            ))}
                  </div>
                    </div>

                                        {/* Configuração de camiseta */}
                                        {(ticket.kit_items || []).includes("camiseta") && (
                                          <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                            <Label className="text-sm font-medium">Configuração de Camiseta</Label>
                                            
                                            <div className="space-y-2">
                                              <Label className="text-xs text-muted-foreground">Tamanhos Disponíveis *</Label>
                                              <div className="flex flex-wrap gap-2">
                                                {TAMANHOS_CAMISETA.map((tamanho) => (
                                                  <div key={tamanho.value} className="flex items-center space-x-2">
                  <Checkbox
                                                      id={`tamanho-${batch.id}-${ticket.id}-${tamanho.value}`}
                                                      checked={(ticket.shirt_sizes || []).includes(tamanho.value)}
                                                      onCheckedChange={(checked) => {
                                                        const tamanhosAtuais = ticket.shirt_sizes || []
                                                        const novosTamanhos = checked
                                                          ? [...tamanhosAtuais, tamanho.value]
                                                          : tamanhosAtuais.filter(t => t !== tamanho.value)
                                                        updateTicket(batch.id, ticket.id, "shirt_sizes", novosTamanhos)
                                                        
                                                        // Se desmarcar um tamanho, remove a quantidade
                                                        if (!checked) {
                                                          const quantidadesAtuais = ticket.shirt_quantities || {}
                                                          const novasQuantidades = { ...quantidadesAtuais }
                                                          delete novasQuantidades[tamanho.value]
                                                          updateTicket(batch.id, ticket.id, "shirt_quantities", novasQuantidades)
                                                        }
                                                      }}
                                                    />
                                                    <Label
                                                      htmlFor={`tamanho-${batch.id}-${ticket.id}-${tamanho.value}`}
                                                      className="text-xs font-normal cursor-pointer"
                                                    >
                                                      {tamanho.label}
                        </Label>
                      </div>
                                                ))}
                                              </div>
                </div>

                                            {/* Quantidade por tamanho */}
                                            {(ticket.shirt_sizes || []).length > 0 && (
                                              <div className="space-y-3 pt-2 border-t">
                                                <Label className="text-xs text-muted-foreground">
                                                  Quantidade de Camisetas por Tamanho para {ticket.category} *
                                                </Label>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                  {(ticket.shirt_sizes || []).map((tamanho: string) => {
                                                    const tamanhoLabel = TAMANHOS_CAMISETA.find(t => t.value === tamanho)?.label || tamanho
                                                    return (
                                                      <div key={tamanho} className="space-y-1">
                                                        <Label htmlFor={`qtd-${tamanho}-${batch.id}-${ticket.id}`} className="text-xs">
                                                          Tamanho {tamanhoLabel}
                                                        </Label>
                    <Input
                                                          id={`qtd-${tamanho}-${batch.id}-${ticket.id}`}
                                                          type="number"
                                                          min="0"
                                                          step="1"
                                                          value={(ticket.shirt_quantities || {})[tamanho] || ""}
                                                          onChange={(e) => {
                                                            const valor = e.target.value
                                                            const quantidadesAtuais = ticket.shirt_quantities || {}
                                                            updateTicket(
                                                              batch.id,
                                                              ticket.id,
                                                              "shirt_quantities",
                                                              {
                                                                ...quantidadesAtuais,
                                                                [tamanho]: valor === "" ? "" : valor,
                                                              }
                                                            )
                                                          }}
                                                          placeholder="0"
                                                          className="w-full h-9"
                        />
                      </div>
                                                    )
                                                  })}
                    </div>
                                                {(ticket.shirt_sizes || []).length > 0 && (
                                                  <p className="text-xs text-muted-foreground pt-1">
                                                    Total: {
                                                      Object.values(ticket.shirt_quantities || {})
                                                        .reduce((sum: number, qtd: any) => sum + (parseInt(qtd) || 0), 0)
                                                    } camisetas
                                                  </p>
                                                )}
                  </div>
                )}
              </div>
                                        )}
                  </div>
                                    )}
                  </div>
                                </CardContent>
                              </Card>
                            ))}
                </div>
                        ) : (
                          <div className="text-center py-8 border-2 border-dashed rounded-lg">
                            <p className="text-sm text-muted-foreground mb-4">
                              Nenhum ingresso cadastrado neste lote
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => addTicketToBatch(batch.id)}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Adicionar Primeiro Ingresso
                            </Button>
                  </div>
                )}
              </div>
            </CardContent>
                  )}
          </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab: Mapas & Percursos */}
        <TabsContent value="mapas" className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
              <h2 className="text-2xl font-bold">Mapas e Percursos GPX</h2>
              <p className="text-muted-foreground">
                Gerencie os arquivos GPX e opções de exibição para cada distância
                      </p>
                    </div>
            <Button onClick={handleSaveBatches} disabled={saving}>
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

          {batches.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Route className="h-8 w-8 text-gray-400" />
                  </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum lote cadastrado</h3>
                <p className="text-sm text-gray-600">Configure os lotes primeiro na aba &quot;Lotes &amp; Ingressos&quot;</p>
            </CardContent>
          </Card>
          ) : (
            <div className="space-y-4">
              {batches.map((batch) => (
                batch.tickets && batch.tickets.length > 0 && (
                  <Card key={batch.id} className="border-2 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-[#156634]" />
                        {batch.name}
                      </CardTitle>
              <CardDescription>
                        Gerencie os percursos GPX para cada distância deste lote
              </CardDescription>
            </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                      {batch.tickets.map((ticket: any) => (
                        <Card key={ticket.id} className="border-2 border-gray-200 shadow-sm">
                          <CardContent className="p-5 space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                                <h4 className="font-semibold">{ticket.category}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {ticket.quantity} ingressos disponíveis
                      </p>
                    </div>
                              {ticket.gpx_file_url && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                  GPX Carregado
                                </Badge>
                              )}
                </div>

                            <Separator />

                            {/* Upload GPX */}
                    <div className="space-y-2">
                              <Label>Arquivo GPX do Percurso</Label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="file"
                                  accept=".gpx"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0] || null
                                    if (file) {
                                      updateTicket(batch.id, ticket.id, "newGpxFile", file)
                                      toast.success(`Arquivo ${file.name} selecionado`)
                                    }
                                  }}
                                  className="hidden"
                                  id={`gpx-${batch.id}-${ticket.id}`}
                                />
                                <label htmlFor={`gpx-${batch.id}-${ticket.id}`} className="flex-1 cursor-pointer">
                                  <div className="w-full">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="w-full"
                                      onClick={() => {
                                        const input = document.getElementById(`gpx-${batch.id}-${ticket.id}`) as HTMLInputElement
                                        input?.click()
                                      }}
                                    >
                                      <Upload className="mr-2 h-4 w-4" />
                                      {ticket.newGpxFile
                                        ? ticket.newGpxFile.name
                                        : ticket.gpx_file_url
                                        ? "Trocar GPX"
                                        : "Upload GPX"}
                                    </Button>
                  </div>
                                </label>
                                {ticket.newGpxFile && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => updateTicket(batch.id, ticket.id, "newGpxFile", null)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                )}
              </div>
                              {ticket.gpx_file_url && !ticket.newGpxFile && (
                      <p className="text-xs text-muted-foreground">
                                  GPX atual: {ticket.gpx_file_url.split('/').pop()}
                      </p>
                              )}
                    </div>

                            {/* Opções de Exibição */}
                            {(ticket.gpx_file_url || ticket.newGpxFile) && (
                              <div className="space-y-3 p-4 bg-gray-50 rounded-lg border-l-4 border-[#156634]">
                                <Label className="text-sm font-semibold">Opções de Exibição</Label>
                    <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`show-route-${ticket.id}`}
                                      checked={ticket.show_route || false}
                                      onCheckedChange={(checked) => updateTicket(batch.id, ticket.id, "show_route", checked)}
                                    />
                                    <Label htmlFor={`show-route-${ticket.id}`} className="text-sm cursor-pointer flex items-center gap-2">
                                      <Route className="h-4 w-4" />
                                      Exibir percurso no mapa
                                    </Label>
                  </div>
                                  <div className="flex items-center space-x-2">
                  <Checkbox
                                      id={`show-map-${ticket.id}`}
                                      checked={ticket.show_map || false}
                                      onCheckedChange={(checked) => updateTicket(batch.id, ticket.id, "show_map", checked)}
                                    />
                                    <Label htmlFor={`show-map-${ticket.id}`} className="text-sm cursor-pointer flex items-center gap-2">
                                      <MapPin className="h-4 w-4" />
                                      Exibir mapa na página do evento
                    </Label>
                </div>
                                  <div className="flex items-center space-x-2">
                  <Checkbox
                                      id={`show-elevation-${ticket.id}`}
                                      checked={ticket.show_elevation || false}
                                      onCheckedChange={(checked) => updateTicket(batch.id, ticket.id, "show_elevation", checked)}
                                    />
                                    <Label htmlFor={`show-elevation-${ticket.id}`} className="text-sm cursor-pointer flex items-center gap-2">
                                      <Mountain className="h-4 w-4" />
                                      Exibir gráfico de altimetria
                                    </Label>
                </div>
                    </div>
                  </div>
                )}
                          </CardContent>
                        </Card>
                      ))}
                    </CardContent>
                  </Card>
                )
              ))}
              </div>
          )}
        </TabsContent>

        {/* Tab: Pagamento */}
        <TabsContent value="pagamento" className="space-y-6">
          <Card className="border-2 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
              <CardTitle className="text-xl flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#156634]" />
                Meios de Pagamento
              </CardTitle>
              <CardDescription>
                Configure os meios de pagamento disponíveis
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600">
                  Configurações de pagamento em desenvolvimento
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Outros */}
        <TabsContent value="outros" className="space-y-6">
          <Card className="border-2 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
              <CardTitle className="text-xl flex items-center gap-2">
                <Settings className="h-5 w-5 text-[#156634]" />
                Outras Configurações
              </CardTitle>
              <CardDescription>
                Configurações adicionais
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600">
                      Mais configurações em breve
                  </p>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
          </Tabs>
              </div>
      )}

      {/* Submenu de Configuração */}
      {mainMenu === "configuracao" && (
        <div className="mb-6">
          <Tabs value={subMenu} onValueChange={setSubMenu} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 bg-gray-100 p-1 rounded-lg">
              <TabsTrigger 
                value="pixels" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Code className="h-4 w-4" />
                <span className="hidden sm:inline">Pixels Google</span>
                <span className="sm:hidden">Pixels</span>
              </TabsTrigger>
              <TabsTrigger 
                value="metodos-pagamento" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Métodos de Pagamento</span>
                <span className="sm:hidden">Pagamento</span>
              </TabsTrigger>
              <TabsTrigger 
                value="cupons" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Tag className="h-4 w-4" />
                <span className="hidden sm:inline">Cupons</span>
              </TabsTrigger>
              <TabsTrigger 
                value="afiliados" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Afiliados</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab: Pixels Google */}
            <TabsContent value="pixels" className="space-y-6">
              <Card className="border-2 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Code className="h-5 w-5 text-[#156634]" />
                    Pixels do Google
                  </CardTitle>
                  <CardDescription>
                    Configure os pixels de rastreamento do Google Analytics e Google Tag Manager
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="google_analytics_id">Google Analytics ID (G-XXXXXXXXXX)</Label>
                    <Input
                      id="google_analytics_id"
                      placeholder="G-XXXXXXXXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="google_tag_manager_id">Google Tag Manager ID (GTM-XXXXXXX)</Label>
                      <Input
                      id="google_tag_manager_id"
                      placeholder="GTM-XXXXXXX"
                      />
                    </div>
                  <div className="space-y-2">
                    <Label htmlFor="facebook_pixel_id">Facebook Pixel ID (opcional)</Label>
                    <Input
                      id="facebook_pixel_id"
                      placeholder="123456789012345"
                    />
                  </div>
                  <Button className="bg-[#156634] hover:bg-[#1a7a3e] text-white">
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Pixels
                  </Button>
            </CardContent>
          </Card>
        </TabsContent>

            {/* Tab: Métodos de Pagamento */}
            <TabsContent value="metodos-pagamento" className="space-y-6">
              <Card className="border-2 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-[#156634]" />
                    Métodos de Pagamento
                  </CardTitle>
              <CardDescription>
                    Habilite ou desabilite métodos de pagamento específicos para este evento
              </CardDescription>
            </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-[#156634]" />
                  <div>
                          <Label className="text-base font-semibold">PIX</Label>
                          <p className="text-sm text-muted-foreground">Pagamento instantâneo</p>
                  </div>
                </div>
                      <Checkbox defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-[#156634]" />
                        <div>
                          <Label className="text-base font-semibold">Cartão de Crédito</Label>
                          <p className="text-sm text-muted-foreground">Parcelamento em até 12x</p>
                  </div>
              </div>
                      <Checkbox defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-[#156634]" />
                  <div>
                          <Label className="text-base font-semibold">Boleto</Label>
                          <p className="text-sm text-muted-foreground">Vencimento em 3 dias</p>
                  </div>
                </div>
                      <Checkbox />
                    </div>
                  </div>
                  <Button className="bg-[#156634] hover:bg-[#1a7a3e] text-white">
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Cupons */}
            <TabsContent value="cupons" className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Tag className="h-6 w-6 text-[#156634]" />
                    Cupons de Desconto
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Gerencie cupons de desconto para este evento
                  </p>
                    </div>
                <Button className="bg-[#156634] hover:bg-[#1a7a3e] text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Cupom
                </Button>
                    </div>
              <Card className="border-2 shadow-sm">
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Tag className="h-8 w-8 text-gray-400" />
                  </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum cupom criado</h3>
                    <p className="text-sm text-gray-600 mb-6">Crie seu primeiro cupom de desconto para este evento</p>
                    <Button className="bg-[#156634] hover:bg-[#1a7a3e]">
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Primeiro Cupom
                    </Button>
              </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Afiliados */}
            <TabsContent value="afiliados" className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                  <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <UserPlus className="h-6 w-6 text-[#156634]" />
                    Afiliados
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Cadastre afiliados para promover este evento
                    </p>
                  </div>
                <Button className="bg-[#156634] hover:bg-[#1a7a3e] text-white">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Cadastrar Afiliado
                </Button>
                </div>
              <Card className="border-2 shadow-sm">
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <UserPlus className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum afiliado cadastrado</h3>
                    <p className="text-sm text-gray-600 mb-6">Cadastre afiliados para promover seu evento e aumentar as vendas</p>
                    <Button className="bg-[#156634] hover:bg-[#1a7a3e]">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Cadastrar Primeiro Afiliado
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
                  </div>
                )}

      {/* Submenu de Relatórios */}
      {mainMenu === "relatorios" && (
        <div className="mb-6">
          <Tabs value={subMenu} onValueChange={setSubMenu} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 bg-gray-100 p-1 rounded-lg">
              <TabsTrigger 
                value="inscricoes" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Inscrições</span>
              </TabsTrigger>
              <TabsTrigger 
                value="financeiro" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Financeiro</span>
              </TabsTrigger>
              <TabsTrigger 
                value="afiliados" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Afiliados</span>
              </TabsTrigger>
              <TabsTrigger 
                value="cupons" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Tag className="h-4 w-4" />
                <span className="hidden sm:inline">Cupons</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab: Relatório de Inscrições */}
            <TabsContent value="inscricoes" className="space-y-6">
              <Card className="border-2 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#156634]" />
                    Relatório de Inscrições
                  </CardTitle>
                  <CardDescription>
                    Visualize todas as inscrições do evento
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600">
                      Relatório de inscrições em desenvolvimento
                    </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

            {/* Tab: Relatório Financeiro */}
            <TabsContent value="financeiro" className="space-y-6">
              <Card className="border-2 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-[#156634]" />
                    Relatório Financeiro
                  </CardTitle>
              <CardDescription>
                    Visualize receitas, descontos e comissões
              </CardDescription>
            </CardHeader>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600">
                      Relatório financeiro em desenvolvimento
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Relatório de Afiliados */}
            <TabsContent value="afiliados" className="space-y-6">
              <Card className="border-2 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[#156634]" />
                    Relatório de Afiliados
                  </CardTitle>
                  <CardDescription>
                    Visualize performance dos afiliados
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600">
                      Relatório de afiliados em desenvolvimento
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Relatório de Cupons */}
            <TabsContent value="cupons" className="space-y-6">
              <Card className="border-2 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Tag className="h-5 w-5 text-[#156634]" />
                    Relatório de Cupons
                  </CardTitle>
                  <CardDescription>
                    Visualize uso e performance dos cupons
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="h-8 w-8 text-gray-400" />
                </div>
                    <p className="text-sm text-gray-600">
                      Relatório de cupons em desenvolvimento
                    </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </div>
      )}
      </div>
    </div>
  )
}
