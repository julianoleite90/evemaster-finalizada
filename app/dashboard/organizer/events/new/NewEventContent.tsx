"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Loader2, Check, Calendar, Package, FileText } from "lucide-react"

// Componentes de step
import { EventInfoStep, BatchesTicketsStep, ReviewStep } from "@/components/new-event"

// Hook
import { useNewEvent } from "@/hooks/use-new-event"

const STEPS = [
  { number: 1, title: "Informações", icon: Calendar },
  { number: 2, title: "Lotes e Ingressos", icon: Package },
  { number: 3, title: "Revisão", icon: FileText },
]

export function NewEventContent() {
  const {
    currentStep,
    totalSteps,
    formData,
    lotesExpandidos,
    loadingCep,
    submitting,
    updateField,
    updatePaymentMethod,
    handleFileUpload,
    buscarCep,
    handleDistanciaChange,
    addDistanciaCustom,
    removeDistanciaCustom,
    addLote,
    updateLote,
    removeLote,
    toggleLoteExpandido,
    salvarLote,
    addIngresso,
    updateIngresso,
    removeIngresso,
    handleNext,
    handlePrevious,
    handleSubmit,
  } = useNewEvent()

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Criar Novo Evento</h1>
        <p className="text-muted-foreground">
          Preencha as informações do seu evento esportivo
        </p>
      </div>

      {/* Steps indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.number
            const isCompleted = currentStep > step.number

            return (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${isActive ? "bg-[#156634] text-white" : ""}
                      ${isCompleted ? "bg-green-100 text-green-600" : ""}
                      ${!isActive && !isCompleted ? "bg-gray-100 text-gray-400" : ""}
                    `}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span
                    className={`text-xs mt-1 ${
                      isActive ? "font-medium text-[#156634]" : "text-muted-foreground"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>

                {index < STEPS.length - 1 && (
                  <div
                    className={`
                      w-full h-0.5 mx-2 flex-1
                      ${currentStep > step.number ? "bg-green-200" : "bg-gray-200"}
                    `}
                    style={{ minWidth: "60px" }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8">
        {currentStep === 1 && (
          <EventInfoStep
            formData={formData}
            loadingCep={loadingCep}
            onUpdate={updateField}
            onFileUpload={handleFileUpload}
            onCepBlur={buscarCep}
            onDistanciaChange={handleDistanciaChange}
            onAddDistanciaCustom={addDistanciaCustom}
            onRemoveDistanciaCustom={removeDistanciaCustom}
          />
        )}

        {currentStep === 2 && (
          <BatchesTicketsStep
            formData={formData}
            lotesExpandidos={lotesExpandidos}
            onAddLote={addLote}
            onUpdateLote={updateLote}
            onRemoveLote={removeLote}
            onToggleLoteExpandido={toggleLoteExpandido}
            onSalvarLote={salvarLote}
            onAddIngresso={addIngresso}
            onUpdateIngresso={updateIngresso}
            onRemoveIngresso={removeIngresso}
          />
        )}

        {currentStep === 3 && (
          <ReviewStep
            formData={formData}
            onUpdate={updateField}
            onUpdatePayment={updatePaymentMethod}
          />
        )}
      </div>

      {/* Navigation */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>

            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Passo {currentStep} de {totalSteps}
              </Badge>
            </div>

            {currentStep < totalSteps ? (
              <Button onClick={handleNext} className="bg-[#156634] hover:bg-[#1a7a3e]">
                Próximo
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-[#156634] hover:bg-[#1a7a3e]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando evento...
                  </>
                ) : (
                  "Criar Evento"
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

