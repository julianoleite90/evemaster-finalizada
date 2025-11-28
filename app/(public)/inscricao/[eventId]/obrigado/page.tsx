"use client"

import { useParams, useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield, Download, ArrowRight, Mail, User, Calendar, MapPin, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { getEventById } from "@/lib/supabase/events"

interface ResumoInscricao {
  evento: string
  eventoData?: string
  eventoLocal?: string
  ingressos: {
    categoria: string
    participante: string
    valor: number
  }[]
  subtotal: number
  taxa: number
  total: number
  gratuito: boolean
}

export default function ObrigadoPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const eventId = params.eventId as string
  
  const [resumo, setResumo] = useState<ResumoInscricao | null>(null)
  const [showCheck, setShowCheck] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [language, setLanguage] = useState<"pt" | "es" | "en">("pt")

  const translations = {
    pt: {
      paymentSecure: "Pagamento 100% seguro",
      registrationCompleted: "Inscrição Realizada!",
      registrationSuccess: "Inscrição Realizada com Sucesso!",
      registrationProcessed: "Sua inscrição foi processada com sucesso.",
      registrationConfirmed: "Sua inscrição foi confirmada automaticamente.",
      registrationPending: "Sua inscrição foi registrada. Finalize o pagamento para confirmar.",
      backHome: "Voltar ao Início",
      privacyPolicy: "Política de Privacidade",
      termsOfUse: "Termos de Uso",
      registeredParticipants: "Participantes Inscritos",
      free: "Gratuito",
      subtotal: "Subtotal",
      serviceFee: "Taxa de serviço",
      total: "Total",
      nextSteps: "Próximos Passos",
      emailConfirmation: "Confirmação por Email",
      emailConfirmationDesc: "Enviamos um email com os detalhes da sua inscrição e o comprovante em PDF para todos os participantes cadastrados.",
      memberArea: "Área de Membros",
      memberAreaDesc: "Acesse sua área de membros para gerenciar suas inscrições, baixar comprovantes e acompanhar o status do pagamento.",
      pendingPayment: "Pagamento Pendente",
      pendingPaymentDesc: "Sua inscrição será confirmada após a aprovação do pagamento. Fique atento ao seu email.",
      downloadReceipt: "Baixar Comprovante",
      generating: "Gerando...",
      accessMemberArea: "Acessar Área de Membros",
      language: "Idioma",
    },
    es: {
      paymentSecure: "Pago 100% seguro",
      registrationCompleted: "¡Inscripción Realizada!",
      registrationSuccess: "¡Inscripción Realizada con Éxito!",
      registrationProcessed: "Su inscripción ha sido procesada con éxito.",
      registrationConfirmed: "Su inscripción ha sido confirmada automáticamente.",
      registrationPending: "Su inscripción ha sido registrada. Finalice el pago para confirmar.",
      backHome: "Volver al Inicio",
      privacyPolicy: "Política de Privacidad",
      termsOfUse: "Términos de Uso",
      registeredParticipants: "Participantes Inscritos",
      free: "Gratuito",
      subtotal: "Subtotal",
      serviceFee: "Costo de servicio",
      total: "Total",
      nextSteps: "Próximos Pasos",
      emailConfirmation: "Confirmación por Correo",
      emailConfirmationDesc: "Enviamos un correo con los detalles de su inscripción y el comprobante en PDF para todos los participantes registrados.",
      memberArea: "Área de Miembros",
      memberAreaDesc: "Acceda a su área de miembros para gestionar sus inscripciones, descargar comprobantes y seguir el estado del pago.",
      pendingPayment: "Pago Pendiente",
      pendingPaymentDesc: "Su inscripción será confirmada después de la aprobación del pago. Esté atento a su correo.",
      downloadReceipt: "Descargar Comprobante",
      generating: "Generando...",
      accessMemberArea: "Acceder al Área de Miembros",
      language: "Idioma",
    },
    en: {
      paymentSecure: "100% secure payment",
      registrationCompleted: "Registration Completed!",
      registrationSuccess: "Registration Completed Successfully!",
      registrationProcessed: "Your registration has been processed successfully.",
      registrationConfirmed: "Your registration has been automatically confirmed.",
      registrationPending: "Your registration has been recorded. Complete payment to confirm.",
      backHome: "Back to Home",
      privacyPolicy: "Privacy Policy",
      termsOfUse: "Terms of Use",
      registeredParticipants: "Registered Participants",
      free: "Free",
      subtotal: "Subtotal",
      serviceFee: "Service fee",
      total: "Total",
      nextSteps: "Next Steps",
      emailConfirmation: "Email Confirmation",
      emailConfirmationDesc: "We sent an email with your registration details and PDF receipt to all registered participants.",
      memberArea: "Member Area",
      memberAreaDesc: "Access your member area to manage your registrations, download receipts and track payment status.",
      pendingPayment: "Pending Payment",
      pendingPaymentDesc: "Your registration will be confirmed after payment approval. Keep an eye on your email.",
      downloadReceipt: "Download Receipt",
      generating: "Generating...",
      accessMemberArea: "Access Member Area",
      language: "Language",
    },
  }

  const t = (key: string) => translations[language]?.[key as keyof typeof translations.pt] || translations.pt[key as keyof typeof translations.pt] || key

  const handleDownloadPDF = async () => {
    if (!resumo) return
    
    setDownloading(true)
    try {
      const response = await fetch('/api/inscricao/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resumo),
      })

      if (!response.ok) throw new Error('Erro ao gerar comprovante')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `inscricao-${resumo.evento.replace(/\s+/g, '-').toLowerCase()}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Erro ao gerar comprovante:', error)
    } finally {
      setDownloading(false)
    }
  }

  useEffect(() => {
    const fetchEventLanguage = async () => {
      try {
        const event = await getEventById(eventId)
        if (event?.language && (event.language === "pt" || event.language === "es" || event.language === "en")) {
          setLanguage(event.language)
        }
      } catch (error) {
        console.error("Erro ao buscar idioma do evento:", error)
      }
    }

    fetchEventLanguage()
  }, [eventId])

  useEffect(() => {
    const resumoParam = searchParams.get("resumo")
    if (resumoParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(resumoParam))
        setResumo(parsed)
      } catch (error) {
        console.error("Erro ao parsear resumo:", error)
      }
    }
    
    // Animação do check
    setTimeout(() => setShowCheck(true), 100)
  }, [searchParams])

  if (!resumo) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-[#156634] text-white py-3 px-4 md:py-4 md:px-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Image
              src="/images/logo/logo.png"
              alt="Logo EveMaster"
              width={120}
              height={32}
              className="h-5 md:h-8 w-auto"
              priority
            />
            <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <Shield className="h-4 w-4 md:h-5 md:w-5" />
              <span>{t("paymentSecure")}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-2">{t("registrationCompleted")}</h1>
              <p className="text-muted-foreground mb-6">
                {t("registrationProcessed")}
              </p>
              <Button asChild className="bg-[#156634] hover:bg-[#1a7a3e]">
                <Link href="/">{t("backHome")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="bg-gray-50 text-gray-400 border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-center gap-4 text-xs">
              <Link href="/politica-de-privacidade" className="hover:text-gray-600 transition-colors">
                {t("privacyPolicy")}
              </Link>
              <span>•</span>
              <Link href="/termos-de-uso" className="hover:text-gray-600 transition-colors">
                {t("termsOfUse")}
              </Link>
            </div>
          </div>
        </footer>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-[#156634] text-white py-3 px-4 md:py-4 md:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Image
            src="/images/logo/logo.png"
            alt="Logo EveMaster"
            width={120}
            height={32}
            className="h-5 md:h-8 w-auto"
            priority
          />
          <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <Shield className="h-4 w-4 md:h-5 md:w-5" />
            <span>{t("paymentSecure")}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-3xl mx-auto px-4 py-8 md:py-12 w-full">
        {/* Sucesso com Check Animado */}
        <div className="text-center mb-8">
          <div 
            className={`w-24 h-24 md:w-28 md:h-28 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center transition-all duration-500 ${
              showCheck ? "scale-100 opacity-100" : "scale-50 opacity-0"
            }`}
          >
            <svg 
              className={`w-12 h-12 md:w-14 md:h-14 text-green-600 transition-all duration-700 delay-300 ${
                showCheck ? "scale-100 opacity-100" : "scale-0 opacity-0"
              }`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={3} 
                d="M5 13l4 4L19 7"
                className={showCheck ? "animate-draw-check" : ""}
              />
            </svg>
          </div>
          <h1 className={`text-2xl md:text-3xl font-bold text-gray-900 mb-2 transition-all duration-500 delay-500 ${
            showCheck ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}>
            {t("registrationSuccess")}
          </h1>
          <p className={`text-muted-foreground transition-all duration-500 delay-700 ${
            showCheck ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}>
            {resumo.gratuito 
              ? t("registrationConfirmed")
              : t("registrationPending")}
          </p>
        </div>

        {/* Dados da Inscrição */}
        <Card className="mb-6">
          <CardHeader className="bg-gradient-to-r from-[#156634] to-[#1a7a3e] text-white rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {resumo.evento}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">{t("registeredParticipants")}</h3>
            
            <div className="space-y-3">
              {resumo.ingressos.map((ingresso, index) => (
                <div key={index} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#156634]/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-[#156634]" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{ingresso.participante}</p>
                      <p className="text-sm text-muted-foreground">{ingresso.categoria}</p>
                    </div>
                  </div>
                  <p className="font-medium text-gray-900">
                    {ingresso.valor === 0 ? t("free") : `R$ ${ingresso.valor.toFixed(2)}`}
                  </p>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("subtotal")}</span>
                <span>R$ {resumo.subtotal.toFixed(2)}</span>
              </div>
              {!resumo.gratuito && resumo.taxa > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("serviceFee")}</span>
                  <span>R$ {resumo.taxa.toFixed(2)}</span>
                </div>
              )}
            </div>

            <Separator className="my-4" />

            <div className="flex justify-between font-bold text-lg">
              <span>{t("total")}</span>
              <span className="text-[#156634]">
                R$ {resumo.total.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Informações Complementares */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">{t("nextSteps")}</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{t("emailConfirmation")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("emailConfirmationDesc")}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{t("memberArea")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("memberAreaDesc")}
                  </p>
                </div>
              </div>

              {!resumo.gratuito && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-yellow-600 font-bold">$</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{t("pendingPayment")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("pendingPaymentDesc")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="outline" 
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="gap-2"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {downloading ? t("generating") : t("downloadReceipt")}
          </Button>
          <Button asChild className="bg-[#156634] hover:bg-[#1a7a3e]">
            <Link href="/minha-conta" className="inline-flex items-center gap-2">
              {t("accessMemberArea")} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        </div>

      {/* Rodapé Profissional */}
      <footer className="bg-gray-50/50 border-t border-gray-100 mt-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 pt-8 md:pt-10 pb-6">
          <div className="max-w-7xl mx-auto">
            {/* Grid Principal - 2 colunas no mobile, 4 no desktop */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-6 lg:gap-8 mb-6 md:mb-8">
              {/* Coluna 1: Logo e Descrição */}
              <div className="col-span-2 md:col-span-1 space-y-3 flex flex-col items-center md:items-start">
                <div>
              <Image
                src="/images/logo/logo.png"
                alt="EveMaster"
                    width={140}
                    height={40}
                    className="h-7 md:h-8 w-auto opacity-80"
                  />
                </div>
                <p className="text-xs text-gray-500 leading-relaxed max-w-xs text-center md:text-left">
                  Plataforma para gestão, compra e venda de ingressos para eventos esportivos.
                </p>
            </div>

              {/* Coluna 2: Formas de Pagamento */}
              <div className="col-span-2 md:col-span-1 space-y-3 flex flex-col items-center md:items-start">
                <h3 className="text-xs font-medium text-gray-600">
                  {language === "es" ? "Medios de Pago Aceptados" : language === "en" ? "Accepted Payment Methods" : "Meios de Pagamento Aceitos"}
                </h3>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <Image
                    src="/images/ic-payment-visa.svg"
                    alt="Visa"
                    width={40}
                    height={25}
                    className="h-5 md:h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
                  />
                  <Image
                    src="/images/ic-payment-master-card.svg"
                    alt="Mastercard"
                    width={40}
                    height={25}
                    className="h-5 md:h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
                  />
                  <Image
                    src="/images/ic-payment-elo.svg"
                    alt="Elo"
                    width={40}
                    height={25}
                    className="h-5 md:h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
                  />
                  <Image
                    src="/images/ic-payment-american-express.svg"
                    alt="American Express"
                    width={40}
                    height={25}
                    className="h-5 md:h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
                  />
                  <Image
                    src="/images/ic-payment-hipercard.svg"
                    alt="Hipercard"
                    width={40}
                    height={25}
                    className="h-5 md:h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
                  />
                  <Image
                    src="/images/ic-payment-pix.svg"
                    alt="Pix"
                    width={40}
                    height={25}
                    className="h-5 md:h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
                  />
                  <Image
                    src="/images/ic-payment-boleto.svg"
                    alt="Boleto"
                    width={40}
                    height={25}
                    className="h-5 md:h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-center md:text-left">
                  <span className="text-[#156634]">Parcelamento em até 12x</span> no cartão
                </p>
              </div>

              {/* Coluna 3: Links Legais */}
              <div className="col-span-1 md:col-span-1 space-y-3 flex flex-col items-center md:items-start md:ml-[20%]">
                <h3 className="text-xs font-medium text-gray-600">
                  Legal
                </h3>
                <div className="flex flex-col gap-1.5">
                  <Link 
                    href="/termos-de-uso" 
                    className="text-xs text-gray-500 hover:text-[#156634] transition-colors text-center md:text-left"
                  >
                    {t("termsOfUse")}
              </Link>
                  <Link 
                    href="/politica-de-privacidade" 
                    className="text-xs text-gray-500 hover:text-[#156634] transition-colors text-center md:text-left"
                  >
                    {t("privacyPolicy")}
              </Link>
                </div>
              </div>

              {/* Coluna 4: Idioma */}
              <div className="col-span-1 md:col-span-1 space-y-3 flex flex-col items-center md:items-start">
                <h3 className="text-xs font-medium text-gray-600 hidden md:block">
                  Idioma
                </h3>
                <Select value={language} onValueChange={(val: "pt" | "es" | "en") => setLanguage(val)}>
                  <SelectTrigger className="w-full max-w-[140px] md:w-[140px] bg-white border-gray-200 text-gray-600 text-xs h-8 md:h-9">
                    <SelectValue asChild>
                      <span className="flex items-center">
                        <span className="text-sm">{language === "pt" ? "🇧🇷" : language === "es" ? "🇦🇷" : "🇺🇸"}</span>
                        <span className="text-xs hidden sm:inline ml-[5px]">{language === "pt" ? "Português" : language === "es" ? "Español" : "English"}</span>
                        <span className="text-xs sm:hidden ml-[5px]">{language === "pt" ? "PT" : language === "es" ? "ES" : "EN"}</span>
                      </span>
                    </SelectValue>
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
              </div>
            </div>

            {/* Separador */}
            <Separator className="my-6 opacity-30" />

            {/* Rodapé Inferior: CNPJ e Copyright */}
            <div className="flex flex-col items-center justify-center gap-2 text-xs text-gray-400 text-center">
              <p>
                © {new Date().getFullYear()} Evemaster. Todos os direitos reservados.
                </p>
              <p>
                Fulsale LTDA - CNPJ: 41.953.551/0001-57
                </p>
            </div>
          </div>
        </div>
      </footer>

      {/* CSS para animação do check */}
      <style jsx global>{`
        @keyframes draw-check {
          0% {
            stroke-dasharray: 100;
            stroke-dashoffset: 100;
          }
          100% {
            stroke-dasharray: 100;
            stroke-dashoffset: 0;
          }
        }
        .animate-draw-check {
          animation: draw-check 0.5s ease-out forwards;
          stroke-dasharray: 100;
          stroke-dashoffset: 0;
        }
      `}</style>
    </div>
  )
}
