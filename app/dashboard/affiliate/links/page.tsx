"use client"

import { useState, useEffect, Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Copy, Plus, Trash2, ExternalLink, Link2, Loader2, Check } from "lucide-react"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"

interface Link {
  id: string
  short_code: string
  title: string
  full_url: string
  short_url: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  src?: string
  is_active: boolean
  click_count: number
  conversion_count: number
  created_at: string
  event: {
    id: string
    name: string
    slug: string
  }
}

interface Event {
  id: string
  name: string
  slug: string
}

function AffiliateLinksPageContent() {
  const searchParams = useSearchParams()
  const eventIdParam = searchParams.get('event_id')
  
  const [loading, setLoading] = useState(true)
  const [links, setLinks] = useState<Link[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    event_id: eventIdParam || '',
    title: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_term: '',
    utm_content: '',
    src: '',
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

      // Buscar links
      const linksRes = await fetch('/api/affiliate/links')
      if (linksRes.ok) {
        const linksData = await linksRes.json()
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://evemaster.com'
        const formattedLinks = (linksData.links || []).map((link: any) => ({
          ...link,
          short_url: `${baseUrl}/ref/${link.short_code}`,
        }))
        setLinks(formattedLinks)
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLink = async () => {
    if (!formData.event_id) {
      toast.error('Selecione um evento')
      return
    }

    try {
      const res = await fetch('/api/affiliate/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        toast.success('Link criado com sucesso!')
        setShowCreateDialog(false)
        setFormData({
          event_id: '',
          title: '',
          utm_source: '',
          utm_medium: '',
          utm_campaign: '',
          utm_term: '',
          utm_content: '',
          src: '',
        })
        fetchData()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Erro ao criar link')
      }
    } catch (error) {
      console.error('Erro ao criar link:', error)
      toast.error('Erro ao criar link')
    }
  }

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm('Tem certeza que deseja excluir este link?')) return

    try {
      const res = await fetch(`/api/affiliate/links/${linkId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Link excluído com sucesso!')
        fetchData()
      } else {
        toast.error('Erro ao excluir link')
      }
    } catch (error) {
      console.error('Erro ao excluir link:', error)
      toast.error('Erro ao excluir link')
    }
  }

  const handleCopyLink = async (link: Link) => {
    try {
      await navigator.clipboard.writeText(link.short_url)
      setCopiedLinkId(link.id)
      toast.success('Link copiado!')
      setTimeout(() => setCopiedLinkId(null), 2000)
    } catch (error) {
      toast.error('Erro ao copiar link')
    }
  }

  const filteredLinks = eventIdParam
    ? links.filter(link => link.event.id === eventIdParam)
    : links

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
          <h1 className="text-3xl font-bold tracking-tight">Meus Links</h1>
          <p className="text-muted-foreground">
            Crie e gerencie seus links de divulgação
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Criar Link
        </Button>
      </div>

      {filteredLinks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Link2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum link criado</h3>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro link de divulgação para começar a ganhar comissões
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Link
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredLinks.map((link) => (
            <Card key={link.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{link.title || 'Link sem título'}</CardTitle>
                    <CardDescription className="mt-1">
                      {link.event.name}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={link.is_active ? 'default' : 'secondary'}>
                      {link.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteLink(link.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Link Encurtado</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 p-2 bg-muted rounded-md font-mono text-sm">
                        {link.short_url}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopyLink(link)}
                      >
                        {copiedLinkId === link.id ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground">Cliques</Label>
                      <p className="font-semibold">{link.click_count}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Conversões</Label>
                      <p className="font-semibold">{link.conversion_count}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Taxa</Label>
                      <p className="font-semibold">
                        {link.click_count > 0
                          ? `${((link.conversion_count / link.click_count) * 100).toFixed(1)}%`
                          : '0%'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Criado em</Label>
                      <p className="font-semibold text-xs">
                        {new Date(link.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  {(link.utm_source || link.utm_medium || link.utm_campaign || link.src) && (
                    <div className="pt-2 border-t">
                      <Label className="text-xs text-muted-foreground">Parâmetros UTM</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {link.utm_source && (
                          <Badge variant="outline" className="text-xs">
                            source: {link.utm_source}
                          </Badge>
                        )}
                        {link.utm_medium && (
                          <Badge variant="outline" className="text-xs">
                            medium: {link.utm_medium}
                          </Badge>
                        )}
                        {link.utm_campaign && (
                          <Badge variant="outline" className="text-xs">
                            campaign: {link.utm_campaign}
                          </Badge>
                        )}
                        {link.src && (
                          <Badge variant="outline" className="text-xs">
                            src: {link.src}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de Criação */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Link</DialogTitle>
            <DialogDescription>
              Crie um link de divulgação com parâmetros UTM para rastrear suas conversões
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
              <Label htmlFor="title">Título do Link (opcional)</Label>
              <Input
                id="title"
                placeholder="Ex: Link Instagram, Link Facebook, etc."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="utm_source">UTM Source</Label>
                <Input
                  id="utm_source"
                  placeholder="Ex: instagram, facebook, email"
                  value={formData.utm_source}
                  onChange={(e) => setFormData({ ...formData, utm_source: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="utm_medium">UTM Medium</Label>
                <Input
                  id="utm_medium"
                  placeholder="Ex: social, cpc, email"
                  value={formData.utm_medium}
                  onChange={(e) => setFormData({ ...formData, utm_medium: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="utm_campaign">UTM Campaign</Label>
              <Input
                id="utm_campaign"
                placeholder="Ex: lancamento, promocao, blackfriday"
                value={formData.utm_campaign}
                onChange={(e) => setFormData({ ...formData, utm_campaign: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="utm_term">UTM Term (opcional)</Label>
                <Input
                  id="utm_term"
                  placeholder="Palavras-chave"
                  value={formData.utm_term}
                  onChange={(e) => setFormData({ ...formData, utm_term: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="utm_content">UTM Content (opcional)</Label>
                <Input
                  id="utm_content"
                  placeholder="Conteúdo específico"
                  value={formData.utm_content}
                  onChange={(e) => setFormData({ ...formData, utm_content: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="src">Fonte Customizada (opcional)</Label>
              <Input
                id="src"
                placeholder="Ex: newsletter, banner, post"
                value={formData.src}
                onChange={(e) => setFormData({ ...formData, src: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateLink}>
              Criar Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function AffiliateLinksPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#156634]" />
      </div>
    }>
      <AffiliateLinksPageContent />
    </Suspense>
  )
}

