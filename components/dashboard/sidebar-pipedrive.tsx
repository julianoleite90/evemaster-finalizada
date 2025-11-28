"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Calendar,
  Users,
  DollarSign,
  Settings,
  Link as LinkIcon,
  Menu,
  X,
  ChevronRight,
  Home,
  TrendingUp,
  AlertCircle,
  Wallet,
  Ticket,
  User,
} from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { LogOut } from "lucide-react"
import { toast } from "sonner"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
}

interface NavSection {
  title?: string
  items: NavItem[]
}

const organizerSections: NavSection[] = [
  {
    items: [
      { title: "Dashboard", href: "/dashboard/organizer", icon: LayoutDashboard },
      { title: "Inscritos", href: "/dashboard/organizer/registrations", icon: Users },
      { title: "Eventos", href: "/dashboard/organizer/events", icon: Calendar },
      { title: "Financeiro", href: "/dashboard/organizer/financial", icon: DollarSign },
    ],
  },
  {
    items: [
      { title: "Meu Perfil", href: "/dashboard/organizer/profile", icon: User },
      { title: "Configurações", href: "/dashboard/organizer/settings", icon: Settings },
    ],
  },
]

const affiliateSections: NavSection[] = [
  {
    items: [
      { title: "Dashboard", href: "/dashboard/affiliate", icon: LayoutDashboard },
      { title: "Meus Links", href: "/dashboard/affiliate/links", icon: LinkIcon },
      { title: "Cupons", href: "/dashboard/affiliate/coupons", icon: Ticket },
      { title: "Carteira", href: "/dashboard/affiliate/wallet", icon: Wallet },
    ],
  },
  {
    items: [
      { title: "Configurações", href: "/dashboard/affiliate/settings", icon: Settings },
    ],
  },
]

const adminSections: NavSection[] = [
  {
    items: [
      { title: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
      { title: "Aprovações", href: "/dashboard/admin/approvals", icon: AlertCircle },
      { title: "Organizadores", href: "/dashboard/admin/organizers", icon: Users },
      { title: "Afiliados", href: "/dashboard/admin/affiliates", icon: Users },
      { title: "Usuários", href: "/dashboard/admin/users", icon: Users },
      { title: "Eventos", href: "/dashboard/admin/events", icon: Calendar },
      { title: "Financeiro", href: "/dashboard/admin/financial", icon: DollarSign },
    ],
  },
  {
    items: [
      { title: "Configurações", href: "/dashboard/admin/settings", icon: Settings },
    ],
  },
]

interface SidebarPipedriveProps {
  role: "organizer" | "affiliate" | "admin"
}

export function SidebarPipedrive({ role }: SidebarPipedriveProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [userInitials, setUserInitials] = useState("")

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        toast.error("Erro ao fazer logout")
        return
      }

      toast.success("Logout realizado com sucesso")
      router.push("/login")
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
      toast.error("Erro ao fazer logout")
    }
  }

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          setUserEmail(user.email || "")
          
          // Buscar dados do usuário na tabela users
          const { data: userData } = await supabase
            .from("users")
            .select("full_name")
            .eq("id", user.id)
            .single()
          
          const name = userData?.full_name || user.user_metadata?.full_name || ""
          setUserName(name)
          
          // Gerar iniciais
          if (name) {
            const names = name.split(" ")
            const initials = names.length > 1 
              ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
              : name.substring(0, 2).toUpperCase()
            setUserInitials(initials)
          } else if (user.email) {
            setUserInitials(user.email.substring(0, 2).toUpperCase())
          }
        }
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error)
      }
    }

    fetchUserData()
  }, [])

  const sections =
    role === "organizer" ? organizerSections :
    role === "affiliate" ? affiliateSections :
    adminSections

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo/Header */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
        <Link href="/" className="flex items-center space-x-3">
          <div className="relative h-8 w-auto">
            {/* Logo Evemaster */}
            <Image
              src="/images/logo/logo.png"
              alt="Evemaster Logo"
              width={120}
              height={32}
              className="object-contain h-8 w-auto"
              priority
              unoptimized
            />
          </div>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMobileOpen(false)}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className={cn("mb-6", sectionIndex > 0 && "mt-8")}>
            {section.title && (
              <div className="px-3 mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {section.title}
                </p>
              </div>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                // Dashboard ativo apenas se estiver exatamente na rota do dashboard
                const isDashboard = item.href === "/dashboard/organizer" || item.href === "/dashboard/affiliate" || item.href === "/dashboard/admin"
                
                let isActive = false
                if (isDashboard) {
                  // Dashboard só fica verde quando está exatamente na página do dashboard
                  isActive = pathname === item.href
                } else {
                  // Outras páginas ficam verdes quando você está nelas ou em sub-rotas
                  isActive = pathname === item.href || (pathname?.startsWith(item.href + "/") && pathname !== "/dashboard/organizer" && pathname !== "/dashboard/affiliate" && pathname !== "/dashboard/admin")
                }
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-[#156634] text-white shadow-sm"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon
                        className={cn(
                          "h-5 w-5 flex-shrink-0",
                          isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700"
                        )}
                      />
                      <span>{item.title}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={cn(
                          "px-2 py-0.5 text-xs font-semibold rounded-full",
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-gray-200 text-gray-700"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <ChevronRight className="h-4 w-4 text-white ml-auto" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4 space-y-2">
        <Link href={role === "organizer" ? "/dashboard/organizer/profile" : role === "affiliate" ? "/dashboard/affiliate/profile" : "/dashboard/admin/profile"}>
          <div className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 text-xs font-medium">{userInitials || "U"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{userName || "Usuário"}</p>
              <p className="text-xs text-gray-500 truncate">{userEmail || ""}</p>
            </div>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-red-50 cursor-pointer transition-colors text-red-600 hover:text-red-700"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm font-medium">Sair</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileOpen(true)}
          className="bg-white shadow-md"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar (always visible) */}
      <aside className="hidden md:block fixed inset-y-0 left-0 z-30 w-64">
        {sidebarContent}
      </aside>
    </>
  )
}

