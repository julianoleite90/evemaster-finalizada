"use client"

import { Check, Calendar, Ticket, FileText, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step {
  id: number
  title: string
  description: string
  icon: React.ReactNode
}

interface ModernStepperProps {
  currentStep: number
  onStepClick?: (step: number) => void
}

const STEPS: Step[] = [
  {
    id: 1,
    title: "Informações",
    description: "Dados básicos do evento",
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    id: 2,
    title: "Lotes",
    description: "Ingressos e preços",
    icon: <Ticket className="w-5 h-5" />,
  },
  {
    id: 3,
    title: "Descrição",
    description: "Detalhes do evento",
    icon: <FileText className="w-5 h-5" />,
  },
]

export function ModernStepper({ currentStep, onStepClick }: ModernStepperProps) {
  return (
    <div className="w-full">
      {/* Desktop Stepper */}
      <div className="hidden md:flex items-center justify-between relative">
        {/* Progress Line Background */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 mx-16" />
        
        {/* Progress Line Active */}
        <div 
          className="absolute top-6 left-0 h-0.5 bg-[#156634] mx-16 transition-all duration-500 ease-out"
          style={{ 
            width: `calc(${((currentStep - 1) / (STEPS.length - 1)) * 100}% - 128px)`,
            marginLeft: '64px'
          }}
        />
        
        {STEPS.map((step, index) => {
          const isCompleted = currentStep > step.id
          const isCurrent = currentStep === step.id
          const isPending = currentStep < step.id
          
          return (
            <div
              key={step.id}
              className={cn(
                "relative flex flex-col items-center z-10 group cursor-pointer",
                isPending && "opacity-60"
              )}
              onClick={() => {
                if (onStepClick && (isCompleted || isCurrent)) {
                  onStepClick(step.id)
                }
              }}
            >
              {/* Step Circle */}
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                  isCompleted && "bg-[#156634] border-[#156634] text-white shadow-lg shadow-green-200",
                  isCurrent && "bg-white border-[#156634] text-[#156634] shadow-lg shadow-green-100 ring-4 ring-green-50",
                  isPending && "bg-white border-gray-200 text-gray-400",
                  (isCompleted || isCurrent) && "group-hover:scale-110"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" strokeWidth={3} />
                ) : (
                  step.icon
                )}
              </div>
              
              {/* Step Label */}
              <div className="mt-3 text-center">
                <p
                  className={cn(
                    "text-sm font-semibold transition-colors",
                    isCompleted && "text-[#156634]",
                    isCurrent && "text-gray-900",
                    isPending && "text-gray-400"
                  )}
                >
                  {step.title}
                </p>
                <p
                  className={cn(
                    "text-xs mt-0.5 transition-colors",
                    isCurrent ? "text-gray-500" : "text-gray-400"
                  )}
                >
                  {step.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile Stepper */}
      <div className="md:hidden">
        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-4">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div
                className={cn(
                  "h-1.5 rounded-full flex-1 transition-all duration-300",
                  currentStep >= step.id ? "bg-[#156634]" : "bg-gray-200"
                )}
              />
              {index < STEPS.length - 1 && <div className="w-1" />}
            </div>
          ))}
        </div>
        
        {/* Current Step Info */}
        <div className="flex items-center gap-3 bg-green-50 rounded-xl p-4">
          <div className="w-10 h-10 rounded-full bg-[#156634] text-white flex items-center justify-center">
            {STEPS[currentStep - 1]?.icon}
          </div>
          <div>
            <p className="text-xs text-[#156634] font-medium">
              Passo {currentStep} de {STEPS.length}
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {STEPS[currentStep - 1]?.title}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
