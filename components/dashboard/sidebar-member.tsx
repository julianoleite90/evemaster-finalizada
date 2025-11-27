"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Ticket, User, LogOut, Menu, X } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const memberNavItems: NavItem[] = [
  { title: "Minhas Inscrições", href: "/my-account", icon: Ticket },
  { title: "Meu Perfil", href: "/my-account/profile", icon: User },
]

export function SidebarMember() {
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

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo/Header */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
        <Link href="/" className="flex items-center space-x-3">
          <div className="relative h-8 w-auto">
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
        <div className="space-y-1">
          {memberNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
            
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
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4 space-y-2">
        <div className="flex items-center space-x-3 px-3 py-2 rounded-lg">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-gray-600 text-xs font-medium">{userInitials || "U"}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{userName || "Usuário"}</p>
            <p className="text-xs text-gray-500 truncate">{userEmail || ""}</p>
          </div>
        </div>
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

