"use client"

import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface SubMenuItem {
  id: string
  title: string
  icon: LucideIcon
}

interface ModernSubMenuProps {
  items: SubMenuItem[]
  currentItem: string
  onItemClick: (item: string) => void
}

export function ModernSubMenu({ items, currentItem, onItemClick }: ModernSubMenuProps) {
  return (
    <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-xl">
      {items.map((item) => {
        const isCurrent = currentItem === item.id
        const Icon = item.icon
        
        return (
          <button
            key={item.id}
            onClick={() => onItemClick(item.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              isCurrent 
                ? "bg-white text-gray-900 shadow-sm" 
                : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
            )}
          >
            <Icon className="w-4 h-4" />
            {item.title}
          </button>
        )
      })}
    </div>
  )
}

