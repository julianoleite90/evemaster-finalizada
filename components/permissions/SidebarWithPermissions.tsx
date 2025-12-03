"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Calendar,
  Users,
  DollarSign,
  Settings,
  Menu,
  X,
  LogOut,
  Lock,
} from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { usePermissionContext } from "./PermissionProvider"
import { UserPermissions } from "@/lib/supabase/user-permissions"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  permission?: keyof UserPermissions
  badge?: string | number
}

interface NavSection {
  title?: string
  items: NavItem[]
}

const organizerSections: NavSection[] = [
  {
    items: [
      { title: "Dashboard", href: "/dashboard/organizer", icon: LayoutDashboard, permission: "can_view_dashboard" },
      { title: "Inscritos", href: "/dashboard/organizer/registrations", icon: Users, permission: "can_view_registrations" },
      { title: "Eventos", href: "/dashboard/organizer/events", icon: Calendar, permission: "can_view_events" },
      { title: "Financeiro", href: "/dashboard/organizer/financial", icon: DollarSign, permission: "can_view_financial" },
    ],
  },
  {
    items: [
      { title: "Configurações", href: "/dashboard/organizer/settings", icon: Settings, permission: "can_view_settings" },
    ],
  },
]

export function SidebarWithPermissions() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [userInitials, setUserInitials] = useState("")
  
  const { hasPermission, isPrimary, loading } = usePermissionContext()

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

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          setUserEmail(user.email || "")
          
          const { data: userData } = await supabase
            .from("users")
            .select("full_name")
            .eq("id", user.id)
            .single()
          
          const name = userData?.full_name || user.user_metadata?.full_name || ""
          setUserName(name)
          
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

  const canAccessItem = (item: NavItem): boolean => {
    if (isPrimary) return true
    if (!item.permission) return true
    return hasPermission(item.permission)
  }

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
        {organizerSections.map((section, sectionIndex) => (
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
                const canAccess = canAccessItem(item)
                const isDashboard = item.href === "/dashboard/organizer"
                
                let isActive = false
                if (isDashboard) {
                  isActive = pathname === item.href
                } else {
                  isActive = pathname === item.href || (pathname?.startsWith(item.href + "/") && pathname !== "/dashboard/organizer")
                }
                
                const linkContent = (
                  <div className="flex items-center space-x-3">
                    <Icon
                      className={cn(
                        "h-5 w-5 flex-shrink-0",
                        isActive ? "text-white" : canAccess ? "text-gray-500 group-hover:text-gray-700" : "text-gray-300"
                      )}
                    />
                    <span className={cn(!canAccess && "text-gray-400")}>{item.title}</span>
                  </div>
                )

                if (!canAccess) {
                  return (
                    <div
                      key={item.href}
                      className={cn(
                        "group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg cursor-not-allowed",
                        "text-gray-400 bg-gray-50"
                      )}
                      title={`Você não tem permissão para acessar ${item.title.toLowerCase()}`}
                    >
                      {linkContent}
                      <Lock className="h-4 w-4 text-gray-300" />
                    </div>
                  )
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
                    {linkContent}
                    {item.badge && (
                      <span className={cn(
                        "ml-auto px-2 py-0.5 text-xs font-medium rounded-full",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-gray-100 text-gray-600"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-gray-200 p-4">
        <Link 
          href="/dashboard/organizer/profile"
          onClick={() => setIsMobileOpen(false)}
          className="flex items-center space-x-3 mb-3 p-2 -mx-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#156634] flex items-center justify-center">
            <span className="text-white text-sm font-medium">{userInitials || "?"}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {userName || "Usuário"}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {userEmail || ""}
            </p>
            {!isPrimary && !loading && (
              <p className="text-xs text-amber-600 mt-0.5">
                Acesso limitado
              </p>
            )}
          </div>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Mobile */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </div>

      {/* Sidebar Desktop */}
      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:flex md:w-64 md:flex-col">
        {sidebarContent}
      </div>
    </>
  )
}
