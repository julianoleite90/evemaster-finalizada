"use client"

import { cn } from "@/lib/utils"

interface SubMenuItem {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
}

interface ModernSubMenuProps {
  items: SubMenuItem[]
  currentItem: string
  onItemClick: (itemId: string) => void
}

export function ModernSubMenu({ items, currentItem, onItemClick }: ModernSubMenuProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {items.map((item) => {
        const isCurrent = currentItem === item.id
        const Icon = item.icon
        
        return (
          <button
            key={item.id}
            onClick={() => onItemClick(item.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
              isCurrent 
                ? "bg-[#156634] text-white" 
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
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

