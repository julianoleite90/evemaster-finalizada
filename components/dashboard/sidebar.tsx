"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Calendar,
  Users,
  DollarSign,
  Settings,
  Package,
  FileText,
  QrCode,
  Link as LinkIcon,
} from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const organizerNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard/organizer", icon: LayoutDashboard },
  { title: "Eventos", href: "/dashboard/organizer/events", icon: Calendar },
  { title: "Inscritos", href: "/dashboard/organizer/registrations", icon: Users },
  { title: "Financeiro", href: "/dashboard/organizer/financial", icon: DollarSign },
  { title: "Kits", href: "/dashboard/organizer/kits", icon: Package },
  { title: "Check-in", href: "/dashboard/organizer/checkin", icon: QrCode },
  { title: "Relatórios", href: "/dashboard/organizer/reports", icon: FileText },
  { title: "Configurações", href: "/dashboard/organizer/settings", icon: Settings },
]

const affiliateNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard/affiliate", icon: LayoutDashboard },
  { title: "Meus Links", href: "/dashboard/affiliate/links", icon: LinkIcon },
  { title: "Cupons", href: "/dashboard/affiliate/coupons", icon: FileText },
  { title: "Carteira", href: "/dashboard/affiliate/wallet", icon: DollarSign },
  { title: "Configurações", href: "/dashboard/affiliate/settings", icon: Settings },
]

const adminNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
  { title: "Eventos", href: "/dashboard/admin/events", icon: Calendar },
  { title: "Usuários", href: "/dashboard/admin/users", icon: Users },
  { title: "Financeiro", href: "/dashboard/admin/financial", icon: DollarSign },
  { title: "Configurações", href: "/dashboard/admin/settings", icon: Settings },
]

interface SidebarProps {
  role: "organizer" | "affiliate" | "admin"
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  
  const navItems = 
    role === "organizer" ? organizerNavItems :
    role === "affiliate" ? affiliateNavItems :
    adminNavItems

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex-1 flex flex-col min-h-0 border-r border-border bg-card">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4 mb-8">
            <h1 className="text-2xl font-bold text-primary">EveMaster</h1>
          </div>
          <nav className="flex-1 px-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.title}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
}

