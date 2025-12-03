"use client"

import { BarChart3, Settings, Edit3, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavigationSection {
  id: string
  title: string
  description: string
  icon: React.ReactNode
}

type SectionType = "relatorios" | "configuracao" | "edicao"

interface ModernNavigationProps {
  currentSection: SectionType
  onSectionClick: (section: SectionType) => void
}

const SECTIONS: NavigationSection[] = [
  {
    id: "relatorios",
    title: "Relatórios",
    description: "Métricas e análises",
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    id: "configuracao",
    title: "Configuração",
    description: "Pixels, pagamentos e mais",
    icon: <Settings className="w-5 h-5" />,
  },
  {
    id: "edicao",
    title: "Edição",
    description: "Dados do evento",
    icon: <Edit3 className="w-5 h-5" />,
  },
]

export function ModernNavigation({ currentSection, onSectionClick }: ModernNavigationProps) {
  return (
    <div className="flex gap-2">
      {SECTIONS.map((section) => {
        const isCurrent = currentSection === section.id
        
        return (
          <button
            key={section.id}
            onClick={() => onSectionClick(section.id as SectionType)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
              isCurrent 
                ? "bg-[#156634] text-white" 
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            )}
          >
            {section.icon}
            {section.title}
          </button>
        )
      })}
    </div>
  )
}
