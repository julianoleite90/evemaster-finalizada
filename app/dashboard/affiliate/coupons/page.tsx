"use client"

import { useState, useEffect, Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Copy, Plus, Tag, Loader2, Calendar, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Coupon {
  id: string
  code: string
  discount_percentage?: number
  discount_amount?: number
  max_uses?: number
  current_uses?: number
  expires_at?: string
  is_active: boolean
  created_at: string
  event: {
    id: string
    name: string
    slug: string
    event_date?: string
  }
}

interface Event {
  id: string
  name: string
  slug: string
}

function AffiliateCouponsPageContent() {
  const searchParams = useSearchParams()
  const eventIdParam = searchParams.get('event_id')
  
  const [loading, setLoading] = useState(true)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  
  const [formData, setFormData] = useState({
    event_id: eventIdParam || '',
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    max_uses: '',
    expires_at: '',
    is_active: true,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Buscar eventos
      const eventsRes = await fetch('/api/affiliate/events')
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        setEvents(eventsData.events || [])
      }

      // Buscar cupons
      const couponsRes = await fetch('/api/affiliate/coupons')
      if (couponsRes.ok) {
        const couponsData = await couponsRes.json()
        setCoupons(couponsData.coupons || [])
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCoupon = async () => {
    if (!formData.event_id) {
      toast.error('Selecione um evento')
      return
    }

    if (!formData.code) {
      toast.error('Informe o código do cupom')
      return
    }

    if (!formData.discount_value) {
      toast.error('Informe o valor do desconto')
      return
    }

    try {
      const payload: any = {
        event_id: formData.event_id,
        code: formData.code,
        is_active: formData.is_active,
      }

      if (formData.discount_type === 'percentage') {
        payload.discount_percentage = parseFloat(formData.discount_value)
      } else {
        payload.discount_amount = parseFloat(formData.discount_value)
      }

      if (formData.max_uses) {
        payload.max_uses = parseInt(formData.max_uses)
      }

      if (formData.expires_at) {
        payload.expires_at = new Date(formData.expires_at).toISOString()
      }

      const res = await fetch('/api/affiliate/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success('Cupom criado com sucesso!')
        setShowCreateDialog(false)
        setFormData({
          event_id: '',
          code: '',
          discount_type: 'percentage',
          discount_value: '',
          max_uses: '',
          expires_at: '',
          is_active: true,
        })
        fetchData()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Erro ao criar cupom')
      }
    } catch (error) {
      console.error('Erro ao criar cupom:', error)
      toast.error('Erro ao criar cupom')
    }
  }

  const filteredCoupons = eventIdParam
    ? coupons.filter(coupon => coupon.event.id === eventIdParam)
    : coupons

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#156634]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meus Cupons</h1>
          <p className="text-muted-foreground">
            Crie e gerencie cupons de desconto para seus seguidores
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Criar Cupom
        </Button>
      </div>

      {filteredCoupons.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum cupom criado</h3>
            <p className="text-muted-foreground mb-4">
              Crie cupons de desconto exclusivos para aumentar suas conversões
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Cupom
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCoupons.map((coupon) => {
            const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date()
            const currentUses = coupon.current_uses || 0
            const isMaxUsesReached = coupon.max_uses && currentUses >= coupon.max_uses
            const isActive = coupon.is_active && !isExpired && !isMaxUsesReached

            return (
              <Card key={coupon.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl font-mono">{coupon.code}</CardTitle>
                      <CardDescription className="mt-1">
                        {coupon.event.name}
                      </CardDescription>
                    </div>
                    <Badge variant={isActive ? 'default' : 'secondary'}>
                      {isActive ? (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Desconto</Label>
                      <p className="text-2xl font-bold text-green-600">
                        {coupon.discount_percentage
                          ? `${coupon.discount_percentage}%`
                          : `R$ ${coupon.discount_amount?.toFixed(2)}`}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {coupon.max_uses && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Usos</Label>
                          <p className="font-semibold">
                            {currentUses} / {coupon.max_uses}
                          </p>
                        </div>
                      )}
                      {coupon.expires_at && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Expira em</Label>
                          <p className="font-semibold text-xs">
                            {format(new Date(coupon.expires_at), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      )}
                    </div>

                    {isExpired && (
                      <Badge variant="destructive" className="w-full justify-center">
                        Expirado
                      </Badge>
                    )}

                    {isMaxUsesReached && (
                      <Badge variant="destructive" className="w-full justify-center">
                        Limite de usos atingido
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog de Criação */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Novo Cupom</DialogTitle>
            <DialogDescription>
              Crie um cupom de desconto exclusivo para seus seguidores
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="event_id">Evento *</Label>
              <Select
                value={formData.event_id}
                onValueChange={(value) => setFormData({ ...formData, event_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um evento" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Código do Cupom *</Label>
              <Input
                id="code"
                placeholder="Ex: CORRA10, MARATONA15"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                maxLength={20}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount_type">Tipo de Desconto *</Label>
              <Select
                value={formData.discount_type}
                onValueChange={(value: 'percentage' | 'fixed') => 
                  setFormData({ ...formData, discount_type: value, discount_value: '' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentual (%)</SelectItem>
                  <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount_value">
                Valor do Desconto * ({formData.discount_type === 'percentage' ? '%' : 'R$'})
              </Label>
              <Input
                id="discount_value"
                type="number"
                min="0"
                step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                placeholder={formData.discount_type === 'percentage' ? 'Ex: 10' : 'Ex: 50.00'}
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_uses">Limite de Usos (opcional)</Label>
                <Input
                  id="max_uses"
                  type="number"
                  min="1"
                  placeholder="Ex: 100"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires_at">Data de Expiração (opcional)</Label>
                <Input
                  id="expires_at"
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCoupon}>
              Criar Cupom
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function AffiliateCouponsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#156634]" />
      </div>
    }>
      <AffiliateCouponsPageContent />
    </Suspense>
  )
}

