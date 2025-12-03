"use client"

import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield, Loader2, ChevronRight, ChevronLeft, Check, User, MapPin, Users, Search, Plus, X } from "lucide-react"
import EventPixels from "@/components/analytics/EventPixels"
import { CheckoutErrorBoundary } from "@/components/error/CheckoutErrorBoundary"
import Link from "next/link"
import Image from "next/image"

// Componentes de step
import { PersonalDataStep, AddressStep, PaymentStep } from "@/components/checkout"

// Hook completo
import { useCheckout } from "@/hooks/use-checkout"

export function CheckoutContent() {
  const checkout = useCheckout()
  
  const {
    loading,
    submitting,
    loadingCep,
    eventData,
    eventId,
    ingressosSelecionados,
    currentStep,
    currentParticipante,
    participantes,
    participante,
    meioPagamento,
    temKit,
    temCamiseta,
    idioma,
    runningClub,
    usuarioLogado,
    perfisSalvos,
    perfisFiltrados,
    showCpfLogin,
    cpfUserData,
    verificandoCpf,
    permiteEdicao,
    salvarPerfil,
    mostrarPopupIncluirParticipantes,
    mostrarBuscaParticipantes,
    termoBuscaParticipante,
    perfisSelecionadosPopup,
    totalSteps,
    t,
    buscarCep,
    updateParticipante,
    verificarCpfCadastrado,
    handleCpfLoginSuccess,
    handleCloseCpfLogin,
    calcularTotal,
    isGratuito,
    handleNext,
    handleBack,
    selecionarParticipanteSalvo,
    setMeioPagamento,
    setPermiteEdicao,
    setMostrarPopupIncluirParticipantes,
    setMostrarBuscaParticipantes,
    setTermoBuscaParticipante,
    setPerfisSelecionadosPopup,
    setSalvarPerfil,
  } = checkout

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#156634] mx-auto mb-4" />
          <p className="text-muted-foreground">{t("carregando")}</p>
        </div>
      </div>
    )
  }

  // Evento não encontrado
  if (!eventData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Evento não encontrado</p>
          <Button asChild>
            <Link href="/">Voltar ao início</Link>
          </Button>
        </div>
      </div>
    )
  }

  const resumoFinanceiro = calcularTotal()

  return (
    <CheckoutErrorBoundary>
      {eventData && (
        <EventPixels
          googleAnalyticsId={eventData.analytics_google_analytics_enabled ? eventData.analytics_google_analytics_id : null}
          googleTagManagerId={eventData.analytics_gtm_enabled ? eventData.analytics_gtm_id : null}
          facebookPixelId={eventData.analytics_facebook_pixel_enabled ? eventData.analytics_facebook_pixel_id : null}
        />
      )}
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <Image src="/logo.svg" alt="Logo" width={120} height={40} />
              </Link>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-green-600" />
                <span>{t("ambienteSeguro")}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulário */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <CardTitle className="text-xl">
                      {t("inscricao")} - {eventData.name}
                    </CardTitle>
                    {participantes.length > 1 && (
                      <Badge variant="outline">
                        {t("participante")} {currentParticipante + 1}/{participantes.length}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Indicador de clube */}
                  {runningClub && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2 text-blue-700">
                        <Users className="h-4 w-4" />
                        <span className="text-sm font-medium">{runningClub.name}</span>
                        <Badge variant="secondary" className="ml-auto">
                          {runningClub.base_discount}% desconto
                        </Badge>
                      </div>
                    </div>
                  )}
                  
                  {/* Steps */}
                  <div className="flex items-center gap-2">
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="flex items-center">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                          ${currentStep === step 
                            ? "bg-[#156634] text-white" 
                            : currentStep > step 
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-100 text-gray-400"}
                        `}>
                          {currentStep > step ? <Check className="h-4 w-4" /> : step}
                        </div>
                        {step < 3 && (
                          <div className={`w-12 h-0.5 ${currentStep > step ? "bg-green-200" : "bg-gray-200"}`} />
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {currentStep === 1 && t("dadosPessoais")}
                    {currentStep === 2 && t("endereco")}
                    {currentStep === 3 && (isGratuito() ? t("finalizarInscricao") : t("pagamento"))}
                  </p>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Step 1: Dados Pessoais */}
                  {currentStep === 1 && (
                    <PersonalDataStep
                      participant={participante}
                      participantIndex={currentParticipante}
                      idioma={idioma}
                      usuarioLogado={usuarioLogado}
                      permiteEdicao={permiteEdicao}
                      verificandoCpf={verificandoCpf}
                      showCpfLogin={showCpfLogin}
                      cpfUserData={cpfUserData}
                      onUpdate={updateParticipante}
                      onToggleEdicao={() => setPermiteEdicao(true)}
                      onCpfBlur={verificarCpfCadastrado}
                      onCpfLoginSuccess={handleCpfLoginSuccess}
                      onCloseCpfLogin={handleCloseCpfLogin}
                    />
                  )}

                  {/* Step 2: Endereço */}
                  {currentStep === 2 && (
                    <AddressStep
                      participant={participante}
                      idioma={idioma}
                      loadingCep={loadingCep}
                      onUpdate={updateParticipante}
                      onCepBlur={(cep) => buscarCep(cep, currentParticipante)}
                    />
                  )}

                  {/* Step 3: Pagamento/Finalização */}
                  {currentStep === 3 && (
                    <PaymentStep
                      participant={participante}
                      participantIndex={currentParticipante}
                      idioma={idioma}
                      temCamiseta={temCamiseta}
                      temKit={temKit}
                      isGratuito={isGratuito()}
                      meioPagamento={meioPagamento}
                      showSalvarPerfil={!!usuarioLogado}
                      salvarPerfilChecked={salvarPerfil[currentParticipante] || false}
                      onUpdate={updateParticipante}
                      onMeioPagamentoChange={setMeioPagamento}
                      onSalvarPerfilChange={(checked) => setSalvarPerfil(prev => ({ ...prev, [currentParticipante]: checked }))}
                    />
                  )}

                  {/* Navegação */}
                  <div className="flex justify-between pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      disabled={currentStep === 1 && currentParticipante === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      {t("voltar")}
                    </Button>
                    <Button
                      onClick={handleNext}
                      disabled={submitting}
                      className="bg-[#156634] hover:bg-[#1a7a3e]"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t("processando")}
                        </>
                      ) : currentStep === totalSteps && currentParticipante === participantes.length - 1 ? (
                        isGratuito() ? t("finalizarInscricao") : t("finalizarPagar")
                      ) : (
                        <>
                          {t("continuar")}
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resumo */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg">{t("resumoInscricao")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Info do evento */}
                  <div>
                    <p className="font-medium">{eventData.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {eventData.event_date && new Date(eventData.event_date + 'T12:00:00').toLocaleDateString(
                        idioma === "en" ? "en-US" : idioma === "es" ? "es-AR" : "pt-BR"
                      )}
                    </p>
                    {eventData.location && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {eventData.location}
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* Ingressos */}
                  <div className="space-y-3">
                    {ingressosSelecionados.map((ing, i) => (
                      <div key={i} className="border rounded-md p-3 text-sm">
                        <div className="flex justify-between font-medium">
                          <span>{ing.categoria}</span>
                          <span>
                            {ing.gratuito ? "Grátis" : `R$ ${ing.valor.toFixed(2)}`}
                          </span>
                        </div>
                        {participantes[i]?.nome && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <User className="h-3 w-3 inline mr-1" />
                            {participantes[i].nome}
                          </p>
                        )}
                        {i === currentParticipante && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            Preenchendo
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Totais */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("subtotal")}</span>
                      <span>R$ {resumoFinanceiro.subtotal.toFixed(2)}</span>
                    </div>
                    {resumoFinanceiro.desconto > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Desconto</span>
                        <span>- R$ {resumoFinanceiro.desconto.toFixed(2)}</span>
                      </div>
                    )}
                    {!isGratuito() && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("taxaServico")}</span>
                        <span>R$ {resumoFinanceiro.taxa.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex justify-between font-bold text-lg">
                    <span>{t("total")}</span>
                    <span className="text-[#156634]">R$ {resumoFinanceiro.total.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog: Incluir mais participantes */}
      <Dialog open={mostrarPopupIncluirParticipantes} onOpenChange={setMostrarPopupIncluirParticipantes}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("adicionarParticipante")}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Deseja adicionar mais participantes usando seus perfis salvos?
            </p>

            {perfisSalvos.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {perfisSalvos.map((perfil) => {
                  const isSelected = perfisSelecionadosPopup.some(p => p.perfilId === perfil.id)
                  const selectedItem = perfisSelecionadosPopup.find(p => p.perfilId === perfil.id)
                  
                  return (
                    <div 
                      key={perfil.id}
                      className={`p-3 border rounded-lg ${isSelected ? 'border-[#156634] bg-green-50' : 'border-gray-200'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{perfil.full_name}</p>
                          <p className="text-xs text-muted-foreground">{perfil.email}</p>
                        </div>
                        <Button
                          variant={isSelected ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => {
                            if (isSelected) {
                              setPerfisSelecionadosPopup(prev => prev.filter(p => p.perfilId !== perfil.id))
                            } else {
                              setPerfisSelecionadosPopup(prev => [...prev, { perfilId: perfil.id, categoriaId: '' }])
                            }
                          }}
                        >
                          {isSelected ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        </Button>
                      </div>
                      
                      {isSelected && (
                        <div className="mt-2">
                          <Select
                            value={selectedItem?.categoriaId || ''}
                            onValueChange={(value) => {
                              setPerfisSelecionadosPopup(prev => 
                                prev.map(p => p.perfilId === perfil.id ? { ...p, categoriaId: value } : p)
                              )
                            }}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                            <SelectContent>
                              {ingressosSelecionados.length > 0 && eventData?.ticket_batches?.flatMap((b: any) => b.tickets || []).map((ticket: any) => (
                                <SelectItem key={ticket.id} value={ticket.id}>
                                  {ticket.category} - R$ {ticket.price || '0'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Nenhum perfil salvo encontrado
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMostrarPopupIncluirParticipantes(false)}>
              Continuar sem adicionar
            </Button>
            {perfisSelecionadosPopup.length > 0 && (
              <Button 
                className="bg-[#156634] hover:bg-[#1a7a3e]"
                onClick={() => {
                  // Lógica de confirmar inclusão de participantes
                  setMostrarPopupIncluirParticipantes(false)
                }}
              >
                Adicionar {perfisSelecionadosPopup.length} participante(s)
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Busca de participantes */}
      <Dialog open={mostrarBuscaParticipantes} onOpenChange={setMostrarBuscaParticipantes}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("buscarPerfil")}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={termoBuscaParticipante}
                onChange={(e) => setTermoBuscaParticipante(e.target.value)}
                placeholder="Buscar por nome, email ou CPF..."
                className="pl-10"
              />
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {perfisFiltrados.map((perfil) => (
                <div 
                  key={perfil.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => selecionarParticipanteSalvo(perfil)}
                >
                  <p className="font-medium">{perfil.full_name}</p>
                  <p className="text-xs text-muted-foreground">{perfil.email}</p>
                </div>
              ))}
              {perfisFiltrados.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum perfil encontrado
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMostrarBuscaParticipantes(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              setMostrarBuscaParticipantes(false)
              // Criar novo perfil em branco
            }}>
              {t("novoPerfil")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CheckoutErrorBoundary>
  )
}
