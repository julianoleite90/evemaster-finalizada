"use client"

interface NewEventStepperProps {
  currentStep: number
}

const STEP_LABELS = {
  1: "Informações",
  2: "Lotes e Ingressos",
  3: "Descrição"
} as const

export function NewEventStepper({ currentStep }: NewEventStepperProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                currentStep === step
                  ? "bg-primary text-primary-foreground"
                  : currentStep > step
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {currentStep > step ? "✓" : step}
            </div>
            <p className="text-xs mt-2 text-center text-muted-foreground">
              {STEP_LABELS[step as keyof typeof STEP_LABELS]}
            </p>
          </div>
          {step < 3 && (
            <div
              className={`h-1 flex-1 mx-2 ${
                currentStep > step ? "bg-green-500" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

