"use client"

import { useParams, useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Shield, Download, ArrowRight, Mail, User, Calendar, MapPin, Loader2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

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
            <img src="/images/logo/logo.png" alt="Logo" className="h-5 md:h-8" />
            <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <Shield className="h-4 w-4 md:h-5 md:w-5" />
              <span>Pagamento 100% seguro</span>
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
              <h1 className="text-2xl font-bold mb-2">Inscrição Realizada!</h1>
              <p className="text-muted-foreground mb-6">
                Sua inscrição foi processada com sucesso.
              </p>
              <Button asChild className="bg-[#156634] hover:bg-[#1a7a3e]">
                <Link href="/">Voltar ao Início</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="bg-gray-50 text-gray-400 border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-center gap-4 text-xs">
              <Link href="/politica-de-privacidade" className="hover:text-gray-600 transition-colors">
                Política de Privacidade
              </Link>
              <span>•</span>
              <Link href="/termos-de-uso" className="hover:text-gray-600 transition-colors">
                Termos de Uso
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
          <img src="/images/logo/logo.png" alt="Logo" className="h-5 md:h-8" />
          <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <Shield className="h-4 w-4 md:h-5 md:w-5" />
            <span>Pagamento 100% seguro</span>
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
            Inscrição Realizada com Sucesso!
          </h1>
          <p className={`text-muted-foreground transition-all duration-500 delay-700 ${
            showCheck ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}>
            {resumo.gratuito 
              ? "Sua inscrição foi confirmada automaticamente."
              : "Sua inscrição foi registrada. Finalize o pagamento para confirmar."}
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
            <h3 className="font-semibold text-gray-900 mb-4">Participantes Inscritos</h3>
            
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
                    {ingresso.valor === 0 ? "Gratuito" : `R$ ${ingresso.valor.toFixed(2)}`}
                  </p>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>R$ {resumo.subtotal.toFixed(2)}</span>
              </div>
              {!resumo.gratuito && resumo.taxa > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa de serviço</span>
                  <span>R$ {resumo.taxa.toFixed(2)}</span>
                </div>
              )}
            </div>

            <Separator className="my-4" />

            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-[#156634]">
                R$ {resumo.total.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Informações Complementares */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Próximos Passos</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Confirmação por Email</p>
                  <p className="text-sm text-muted-foreground">
                    Enviamos um email com os detalhes da sua inscrição e o comprovante em PDF para todos os participantes cadastrados.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Área de Membros</p>
                  <p className="text-sm text-muted-foreground">
                    Acesse sua área de membros para gerenciar suas inscrições, baixar comprovantes e acompanhar o status do pagamento.
                  </p>
                </div>
              </div>

              {!resumo.gratuito && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-yellow-600 font-bold">$</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Pagamento Pendente</p>
                    <p className="text-sm text-muted-foreground">
                      Sua inscrição será confirmada após a aprovação do pagamento. Fique atento ao seu email.
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
            {downloading ? "Gerando..." : "Baixar Comprovante"}
          </Button>
          <Button asChild className="bg-[#156634] hover:bg-[#1a7a3e]">
            <Link href="/minha-conta" className="inline-flex items-center gap-2">
              Acessar Área de Membros <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        </div>

      {/* Footer */}
      <footer className="bg-gray-50 text-gray-400 border-t border-gray-100 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-4 text-xs">
            <Link href="/politica-de-privacidade" className="hover:text-gray-600 transition-colors">
              Política de Privacidade
            </Link>
            <span>•</span>
            <Link href="/termos-de-uso" className="hover:text-gray-600 transition-colors">
              Termos de Uso
            </Link>
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
