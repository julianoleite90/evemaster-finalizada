"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Trophy, Plus, Mail, Calendar, Loader2, Users, CheckCircle2, XCircle, Clock } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface RunningClubsTabProps {
  eventId: string
}

export function RunningClubsTabContent({ eventId }: RunningClubsTabProps) {
  console.log('RunningClubsTabContent renderizado com eventId:', eventId)
  const [loading, setLoading] = useState(true)
  const [clubs, setClubs] = useState<any[]>([])
  const [showAddClub, setShowAddClub] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newClub, setNewClub] = useState({
    email: "",
    tickets_allocated: "",
    base_discount: "",
    progressive_discount_threshold: "",
    progressive_discount_value: "",
    deadline: "",
    extend_on_deadline: false,
    release_after_deadline: true,
  })

  useEffect(() => {
    if (eventId) {
      fetchClubs()
    } else {
      console.error('RunningClubsTabContent: eventId não fornecido')
      setLoading(false)
    }
  }, [eventId])

  const fetchClubs = async () => {
    try {
      setLoading(true)
      if (!eventId) {
        console.error('RunningClubsTabContent: eventId não fornecido')
        setLoading(false)
        return
      }
      console.log('RunningClubsTabContent: Buscando clubes para eventId:', eventId)
      const res = await fetch(`/api/events/running-clubs?event_id=${eventId}`)
      console.log('RunningClubsTabContent: Resposta da API:', res.status, res.statusText)
      if (res.ok) {
        const data = await res.json()
        console.log('RunningClubsTabContent: Clubes recebidos:', data.clubs?.length || 0)
        setClubs(data.clubs || [])
      } else {
        const errorData = await res.json().catch(() => ({}))
        console.error('RunningClubsTabContent: Erro ao buscar clubes:', errorData)
        toast.error(errorData.error || 'Erro ao carregar clubes')
      }
    } catch (error) {
      console.error('RunningClubsTabContent: Erro ao buscar clubes:', error)
      toast.error('Erro ao carregar clubes')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClub = async () => {
    if (!newClub.email || !newClub.tickets_allocated || !newClub.deadline) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      setSaving(true)
      const res = await fetch('/api/events/running-clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          email: newClub.email,
          tickets_allocated: parseInt(newClub.tickets_allocated),
          base_discount: newClub.base_discount ? parseFloat(newClub.base_discount) : 0,
          progressive_discount_threshold: newClub.progressive_discount_threshold 
            ? parseInt(newClub.progressive_discount_threshold) 
            : null,
          progressive_discount_value: newClub.progressive_discount_value 
            ? parseFloat(newClub.progressive_discount_value) 
            : null,
          deadline: newClub.deadline,
          extend_on_deadline: newClub.extend_on_deadline,
          release_after_deadline: newClub.release_after_deadline,
        }),
      })

      if (res.ok) {
        toast.success('Clube cadastrado com sucesso! Email enviado.')
        setShowAddClub(false)
        setNewClub({
          email: "",
          tickets_allocated: "",
          base_discount: "",
          progressive_discount_threshold: "",
          progressive_discount_value: "",
          deadline: "",
          extend_on_deadline: false,
          release_after_deadline: true,
        })
        fetchClubs()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Erro ao cadastrar clube')
      }
    } catch (error) {
      console.error('Erro ao criar clube:', error)
      toast.error('Erro ao criar clube')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#156634]" />
      </div>
    )
  }

  if (!eventId) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              ID do evento não encontrado
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Trophy className="h-5 w-5 text-[#156634]" />
                Clubes de Corrida
              </CardTitle>
              <CardDescription>
                Gerencie clubes de corrida com ingressos reservados e descontos progressivos
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddClub(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Clube
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {clubs.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum clube cadastrado ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {clubs.map((club) => {
                const isExpired = club.deadline && new Date(club.deadline) < new Date()
                const ticketsRemaining = club.tickets_allocated - (club.tickets_used || 0)

                return (
                  <Card key={club.id} className="border">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{club.name || club.email}</CardTitle>
                          <CardDescription className="mt-1">
                            {club.email}
                          </CardDescription>
                        </div>
                        <Badge variant={
                          club.status === 'accepted' ? 'default' :
                          club.status === 'pending' ? 'secondary' :
                          'destructive'
                        }>
                          {club.status === 'accepted' ? (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          ) : club.status === 'pending' ? (
                            <Clock className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {club.status === 'accepted' ? 'Aceito' :
                           club.status === 'pending' ? 'Pendente' :
                           'Expirado'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <Label className="text-xs text-muted-foreground">Ingressos Alocados</Label>
                          <p className="font-semibold">{club.tickets_allocated}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Ingressos Usados</Label>
                          <p className="font-semibold">{club.tickets_used || 0}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Disponíveis</Label>
                          <p className="font-semibold text-green-600">{ticketsRemaining}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Desconto Base</Label>
                          <p className="font-semibold">{club.base_discount}%</p>
                        </div>
                        {club.progressive_discount_threshold && (
                          <>
                            <div>
                              <Label className="text-xs text-muted-foreground">Desconto Progressivo</Label>
                              <p className="font-semibold">
                                A partir de {club.progressive_discount_threshold} ingressos: +{club.progressive_discount_value}%
                              </p>
                            </div>
                          </>
                        )}
                        <div>
                          <Label className="text-xs text-muted-foreground">Prazo Final</Label>
                          <p className="font-semibold">
                            {format(new Date(club.deadline), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Prorrogar 24h</Label>
                          <p className="font-semibold">
                            {club.extend_on_deadline ? 'Sim' : 'Não'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Liberar após prazo</Label>
                          <p className="font-semibold">
                            {club.release_after_deadline ? 'Sim' : 'Não'}
                          </p>
                        </div>
                      </div>
                      {isExpired && (
                        <Badge variant="destructive" className="mt-4 w-full justify-center">
                          Prazo expirado
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Cadastro */}
      <Dialog open={showAddClub} onOpenChange={setShowAddClub}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar Clube de Corrida</DialogTitle>
            <DialogDescription>
              Cadastre um clube de corrida e reserve ingressos com desconto progressivo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="club_email">Email do Clube *</Label>
              <Input
                id="club_email"
                type="email"
                placeholder="clube@exemplo.com"
                value={newClub.email}
                onChange={(e) => setNewClub({ ...newClub, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tickets_allocated">Quantidade de Ingressos *</Label>
                <Input
                  id="tickets_allocated"
                  type="number"
                  min="1"
                  placeholder="Ex: 50"
                  value={newClub.tickets_allocated}
                  onChange={(e) => setNewClub({ ...newClub, tickets_allocated: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="base_discount">Desconto Base (%)</Label>
                <Input
                  id="base_discount"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="Ex: 10"
                  value={newClub.base_discount}
                  onChange={(e) => setNewClub({ ...newClub, base_discount: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="progressive_discount_threshold">Desconto Progressivo - A partir de quantos ingressos?</Label>
              <Input
                id="progressive_discount_threshold"
                type="number"
                min="1"
                placeholder="Ex: 20 (a partir de 20 ingressos)"
                value={newClub.progressive_discount_threshold}
                onChange={(e) => setNewClub({ ...newClub, progressive_discount_threshold: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Deixe em branco se não quiser desconto progressivo
              </p>
            </div>

            {newClub.progressive_discount_threshold && (
              <div className="space-y-2">
                <Label htmlFor="progressive_discount_value">Desconto Progressivo Adicional (%)</Label>
                <Input
                  id="progressive_discount_value"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="Ex: 5 (desconto adicional de 5%)"
                  value={newClub.progressive_discount_value}
                  onChange={(e) => setNewClub({ ...newClub, progressive_discount_value: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="deadline">Prazo Máximo para Usar os Ingressos *</Label>
              <Input
                id="deadline"
                type="date"
                value={newClub.deadline}
                onChange={(e) => setNewClub({ ...newClub, deadline: e.target.value })}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="extend_on_deadline">Prorrogar automaticamente por 24h</Label>
                  <p className="text-xs text-muted-foreground">
                    Se chegar no prazo e os ingressos não forem usados, prorrogar por mais 24 horas
                  </p>
                </div>
                <Switch
                  id="extend_on_deadline"
                  checked={newClub.extend_on_deadline}
                  onCheckedChange={(checked) => setNewClub({ ...newClub, extend_on_deadline: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="release_after_deadline">Liberar ingressos após prazo final</Label>
                  <p className="text-xs text-muted-foreground">
                    Após o prazo final, liberar ingressos não usados para venda geral
                  </p>
                </div>
                <Switch
                  id="release_after_deadline"
                  checked={newClub.release_after_deadline}
                  onCheckedChange={(checked) => setNewClub({ ...newClub, release_after_deadline: checked })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddClub(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateClub} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                'Cadastrar Clube'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

