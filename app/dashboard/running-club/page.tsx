"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Trophy, Plus, Mail, Users, Loader2, CheckCircle2, Clock, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function RunningClubDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [club, setClub] = useState<any>(null)
  const [participants, setParticipants] = useState<any[]>([])
  const [showAddParticipant, setShowAddParticipant] = useState(false)
  const [addMode, setAddMode] = useState<"email" | "full">("email")
  const [saving, setSaving] = useState(false)
  const [newParticipant, setNewParticipant] = useState({
    email: "",
    full_name: "",
    phone: "",
    cpf: "",
    birth_date: "",
    gender: "",
  })

  useEffect(() => {
    fetchClubData()
  }, [])

  const fetchClubData = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      // Buscar clube do usuário
      const { data: clubData, error: clubError } = await supabase
        .from("running_clubs")
        .select(`
          *,
          events:event_id (
            id,
            name,
            event_date,
            slug
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "accepted")
        .maybeSingle()

      if (clubError || !clubData) {
        toast.error("Clube não encontrado ou não autorizado")
        router.push("/")
        return
      }

      setClub(clubData)

      // Buscar participantes
      const { data: participantsData, error: participantsError } = await supabase
        .from("running_club_participants")
        .select("*")
        .eq("club_id", clubData.id)
        .order("created_at", { ascending: false })

      if (!participantsError && participantsData) {
        setParticipants(participantsData)
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Erro ao carregar dados do clube")
    } finally {
      setLoading(false)
    }
  }

  const handleAddParticipant = async () => {
    if (addMode === "email") {
      if (!newParticipant.email) {
        toast.error("Email é obrigatório")
        return
      }
    } else {
      if (!newParticipant.email || !newParticipant.full_name) {
        toast.error("Email e nome são obrigatórios")
        return
      }
    }

    try {
      setSaving(true)
      const res = await fetch("/api/running-club/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          club_id: club.id,
          event_id: club.event_id,
          email: newParticipant.email,
          full_name: addMode === "full" ? newParticipant.full_name : null,
          phone: addMode === "full" ? newParticipant.phone : null,
          cpf: addMode === "full" ? newParticipant.cpf : null,
          birth_date: addMode === "full" ? newParticipant.birth_date : null,
          gender: addMode === "full" ? newParticipant.gender : null,
        }),
      })

      if (res.ok) {
        toast.success(
          addMode === "email"
            ? "Email enviado para o participante!"
            : "Participante cadastrado com sucesso!"
        )
        setShowAddParticipant(false)
        setNewParticipant({
          email: "",
          full_name: "",
          phone: "",
          cpf: "",
          birth_date: "",
          gender: "",
        })
        fetchClubData()
      } else {
        const error = await res.json()
        toast.error(error.error || "Erro ao adicionar participante")
      }
    } catch (error) {
      console.error("Erro ao adicionar participante:", error)
      toast.error("Erro ao processar participante")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#156634]" />
      </div>
    )
  }

  if (!club) {
    return null
  }

  const ticketsRemaining = club.tickets_allocated - (club.tickets_used || 0)
  const eventUrl = club.events?.slug
    ? `/inscricao/${club.events.slug}`
    : `/inscricao/${club.event_id}`

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trophy className="h-8 w-8 text-[#156634]" />
          {club.name || "Clube de Corrida"}
        </h1>
        <p className="text-gray-600 mt-2">{club.events?.name}</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ingressos Alocados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{club.tickets_allocated}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ingressos Usados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{club.tickets_used || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Disponíveis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{ticketsRemaining}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Desconto</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{club.base_discount}%</div>
            {club.progressive_discount_threshold && (
              <p className="text-xs text-muted-foreground mt-1">
                +{club.progressive_discount_value}% a partir de {club.progressive_discount_threshold}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Informações do Evento */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Informações do Evento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Data do Evento</Label>
              <p className="font-semibold">
                {club.events?.event_date
                  ? format(new Date(club.events.event_date), "dd/MM/yyyy", { locale: ptBR })
                  : "N/A"}
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Prazo para Usar Ingressos</Label>
              <p className="font-semibold">
                {format(new Date(club.deadline), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm text-muted-foreground">Link do Evento</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}${eventUrl}?club=${club.id}`}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      navigator.clipboard.writeText(
                        `${window.location.origin}${eventUrl}?club=${club.id}`
                      )
                      toast.success("Link copiado!")
                    }
                  }}
                >
                  Copiar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Participantes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Participantes</CardTitle>
              <CardDescription>
                Gerencie os participantes do seu clube
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddParticipant(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Participante
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum participante cadastrado ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {participants.map((participant) => (
                <Card key={participant.id} className="border">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold">
                            {participant.full_name || participant.email}
                          </p>
                          <Badge variant={
                            participant.status === "registered"
                              ? "default"
                              : participant.status === "invited"
                              ? "secondary"
                              : "outline"
                          }>
                            {participant.status === "registered"
                              ? "Inscrito"
                              : participant.status === "invited"
                              ? "Convite Enviado"
                              : "Pendente"}
                          </Badge>
                        </div>
                        {participant.full_name && (
                          <p className="text-sm text-muted-foreground">{participant.email}</p>
                        )}
                        {participant.phone && (
                          <p className="text-sm text-muted-foreground">Tel: {participant.phone}</p>
                        )}
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {participant.invited_at && (
                          <p>
                            Convite: {format(new Date(participant.invited_at), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        )}
                        {participant.registered_at && (
                          <p>
                            Inscrito: {format(new Date(participant.registered_at), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Adicionar Participante */}
      <Dialog open={showAddParticipant} onOpenChange={setShowAddParticipant}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Participante</DialogTitle>
            <DialogDescription>
              Cadastre um participante completo ou apenas envie um email para ele completar a inscrição
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={addMode === "email" ? "default" : "outline"}
                onClick={() => setAddMode("email")}
                className="flex-1"
              >
                <Mail className="h-4 w-4 mr-2" />
                Apenas Email
              </Button>
              <Button
                variant={addMode === "full" ? "default" : "outline"}
                onClick={() => setAddMode("full")}
                className="flex-1"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Cadastro Completo
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newParticipant.email}
                onChange={(e) => setNewParticipant({ ...newParticipant, email: e.target.value })}
                placeholder="participante@exemplo.com"
              />
            </div>

            {addMode === "full" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo *</Label>
                  <Input
                    id="full_name"
                    value={newParticipant.full_name}
                    onChange={(e) => setNewParticipant({ ...newParticipant, full_name: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={newParticipant.phone}
                      onChange={(e) => setNewParticipant({ ...newParticipant, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={newParticipant.cpf}
                      onChange={(e) => setNewParticipant({ ...newParticipant, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="birth_date">Data de Nascimento</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={newParticipant.birth_date}
                      onChange={(e) => setNewParticipant({ ...newParticipant, birth_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gênero</Label>
                    <Input
                      id="gender"
                      value={newParticipant.gender}
                      onChange={(e) => setNewParticipant({ ...newParticipant, gender: e.target.value })}
                      placeholder="Masculino, Feminino, etc."
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddParticipant(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddParticipant} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {addMode === "email" ? "Enviando..." : "Salvando..."}
                </>
              ) : (
                addMode === "email" ? "Enviar Email" : "Cadastrar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

