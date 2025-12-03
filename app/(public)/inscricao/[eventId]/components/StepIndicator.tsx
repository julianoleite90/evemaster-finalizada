"use client"

import { Check } from "lucide-react"

interface StepIndicatorProps {
  currentStep: number
  totalSteps?: number
}

export function StepIndicator({ currentStep, totalSteps = 3 }: StepIndicatorProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1)
  
  return (
    <div className="flex items-center gap-2">
      {steps.map((step) => (
        <div
          key={step}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep === step
              ? "bg-[#156634] text-white"
              : currentStep > step
              ? "bg-green-500 text-white"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          {currentStep > step ? <Check className="h-4 w-4" /> : step}
        </div>
      ))}
    </div>
  )
}

