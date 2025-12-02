"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, User, HelpCircle, LogOut, Gift, TrendingUp, Award, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface CashbackTier {
  minAmount: number
  percentage: number
  label: string
}

const CASHBACK_TIERS: CashbackTier[] = [
  { minAmount: 0, percentage: 0, label: "Inativo" },
  { minAmount: 100000, percentage: 0.5, label: "Bronze" },
  { minAmount: 500000, percentage: 1, label: "Prata" },
  { minAmount: 1000000, percentage: 2, label: "Ouro" },
  { minAmount: 10000000, percentage: 3, label: "Diamante" },
]

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`
  } else if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}k`
  }
  return `R$ ${value.toFixed(0)}`
}

function getCurrentTier(totalSales: number): CashbackTier {
  for (let i = CASHBACK_TIERS.length - 1; i >= 0; i--) {
    if (totalSales >= CASHBACK_TIERS[i].minAmount) {
      return CASHBACK_TIERS[i]
    }
  }
  return CASHBACK_TIERS[0]
}

function getNextTier(totalSales: number): CashbackTier | null {
  for (let i = 0; i < CASHBACK_TIERS.length; i++) {
    if (totalSales < CASHBACK_TIERS[i].minAmount) {
      return CASHBACK_TIERS[i]
    }
  }
  return null
}

export function OrganizerHeader() {
  const router = useRouter()
  const [totalSales, setTotalSales] = useState<number>(0)
  const [loadingCashback, setLoadingCashback] = useState(true)
  const [showCashbackInfo, setShowCashbackInfo] = useState(false)

  useEffect(() => {
    const fetchTotalSales = async () => {
      try {
        const supabase = createClient()
        
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: organizer } = await supabase
          .from("organizers")
          .select("id")
          .eq("user_id", user.id)
          .single()

        if (!organizer) return

        const { data: events } = await supabase
          .from("events")
          .select("id")
          .eq("organizer_id", organizer.id)

        if (!events || events.length === 0) {
          setLoadingCashback(false)
          return
        }

        const eventIds = events.map(e => e.id)

        const { data: registrations } = await supabase
          .from("registrations")
          .select("id")
          .in("event_id", eventIds)

        if (!registrations || registrations.length === 0) {
          setLoadingCashback(false)
          return
        }

        const registrationIds = registrations.map(r => r.id)

        const { data: payments } = await supabase
          .from("payments")
          .select("total_amount")
          .in("registration_id", registrationIds)
          .eq("payment_status", "paid")

        const total = payments?.reduce((sum, p) => sum + Number(p.total_amount || 0), 0) || 0
        setTotalSales(total)
      } catch (error) {
        console.error("Erro ao buscar vendas:", error)
      } finally {
        setLoadingCashback(false)
      }
    }

    fetchTotalSales()
  }, [])

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        toast.error("Erro ao fazer logout")
        return
      }

      toast.success("Logout realizado com sucesso")
      router.push("/login/organizer")
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
      toast.error("Erro ao fazer logout")
    }
  }

  const currentTier = getCurrentTier(totalSales)
  const nextTier = getNextTier(totalSales)
  
  let progress = 0
  if (nextTier) {
    const previousTierAmount = currentTier.minAmount
    const range = nextTier.minAmount - previousTierAmount
    const current = totalSales - previousTierAmount
    progress = Math.min((current / range) * 100, 100)
  } else {
    progress = 100
  }

  const getTierColor = (tier: CashbackTier) => {
    switch (tier.label) {
      case "Bronze": return "from-amber-500 to-amber-600"
      case "Prata": return "from-gray-400 to-gray-500"
      case "Ouro": return "from-yellow-400 to-yellow-500"
      case "Diamante": return "from-cyan-400 to-blue-500"
      default: return "from-gray-300 to-gray-400"
    }
  }

  const getTierBgLight = (tier: CashbackTier) => {
    switch (tier.label) {
      case "Bronze": return "bg-amber-50 text-amber-700 border-amber-200"
      case "Prata": return "bg-gray-50 text-gray-700 border-gray-200"
      case "Ouro": return "bg-yellow-50 text-yellow-700 border-yellow-200"
      case "Diamante": return "bg-cyan-50 text-cyan-700 border-cyan-200"
      default: return "bg-gray-50 text-gray-600 border-gray-200"
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white shadow-sm">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        {/* Lado Esquerdo - Barra de Cashback */}
        <div className="flex items-center gap-3 relative">
          {!loadingCashback && (
            <>
              {/* Ícone do Tier */}
              <div 
                className={`p-1.5 rounded-lg bg-gradient-to-br ${getTierColor(currentTier)} shadow-sm cursor-pointer transition-transform hover:scale-105`}
                onMouseEnter={() => setShowCashbackInfo(true)}
                onMouseLeave={() => setShowCashbackInfo(false)}
              >
                {currentTier.percentage > 0 ? (
                  <Award className="w-4 h-4 text-white" />
                ) : (
                  <Gift className="w-4 h-4 text-white" />
                )}
              </div>

              {/* Info Tier + Barra */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${getTierBgLight(currentTier)}`}>
                      {currentTier.label}
                    </span>
                    {currentTier.percentage > 0 && (
                      <span className="text-[10px] text-[#156634] font-bold hidden sm:inline">
                        {currentTier.percentage}%
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-gray-400 hidden sm:inline">
                    {formatCurrency(totalSales)} vendido
                  </span>
                </div>

                {/* Barra de Progresso Compacta */}
                <div className="hidden md:flex items-center gap-2">
                  <div className="w-28 lg:w-36 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${nextTier ? getTierColor(nextTier) : getTierColor(currentTier)} transition-all duration-500 rounded-full`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {nextTier && (
                    <span className="text-[9px] text-gray-400 whitespace-nowrap">
                      {formatCurrency(nextTier.minAmount - totalSales)}
                    </span>
                  )}
                  {!nextTier && (
                    <span className="text-[9px] text-yellow-600 whitespace-nowrap">
                      MAX
                    </span>
                  )}
                </div>
              </div>

              {/* Popup de Info */}
              {showCashbackInfo && (
                <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-3 min-w-[220px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-4 h-4 text-[#156634]" />
                    <p className="font-semibold text-sm text-gray-800">Programa de Cashback</p>
                  </div>
                  <p className="text-[10px] text-gray-500 mb-2">
                    Ganhe cashback sobre a taxa da plataforma!
                  </p>
                  
                  {/* Aviso se estiver inativo */}
                  {currentTier.label === "Inativo" && (
                    <div className="bg-amber-50 border border-amber-200 rounded p-2 mb-2">
                      <p className="text-[10px] text-amber-700">
                        <strong>Por que está inativo?</strong><br/>
                        Atinja <strong>R$ 100k</strong> em vendas para ativar o cashback e começar a ganhar 0.5% de volta!
                      </p>
                      <p className="text-[9px] text-amber-600 mt-1">
                        Faltam {formatCurrency(100000 - totalSales)} para ativar
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-1 border-t pt-2">
                    {CASHBACK_TIERS.filter(t => t.percentage > 0).map((tier) => (
                      <div 
                        key={tier.label} 
                        className={`flex justify-between text-[10px] py-0.5 px-1 rounded ${currentTier.label === tier.label ? 'bg-[#156634]/10 font-bold text-[#156634]' : 'text-gray-600'}`}
                      >
                        <span>{tier.label} ({formatCurrency(tier.minAmount)}+)</span>
                        <span>{tier.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Lado Direito - Ações */}
        <div className="flex items-center gap-1 md:gap-2">
          <Button variant="ghost" size="icon" type="button" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 h-8 w-8">
            <HelpCircle className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" type="button" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 relative h-8 w-8">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-red-500 rounded-full" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" type="button" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 h-8 w-8">
                <div className="h-7 w-7 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-gray-600" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/dashboard/organizer/profile" className="flex items-center gap-2 cursor-pointer">
                  <User className="h-4 w-4" />
                  Meu Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600">
                <LogOut className="h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

