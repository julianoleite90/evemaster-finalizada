"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { StarRating } from "./StarRating"
import { Loader2, Send, Trophy, MessageSquare, Building2, Banknote } from "lucide-react"
import { toast } from "sonner"

interface ReviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizerId: string
  organizerName: string
  eventId?: string
  eventName?: string
  registrationId?: string
  onSuccess?: () => void
}

export function ReviewModal({
  open,
  onOpenChange,
  organizerId,
  organizerName,
  eventId,
  eventName,
  registrationId,
  onSuccess,
}: ReviewModalProps) {
  const [loading, setLoading] = useState(false)
  const [rating, setRating] = useState(0)
  const [ratingOrganization, setRatingOrganization] = useState(0)
  const [ratingCommunication, setRatingCommunication] = useState(0)
  const [ratingStructure, setRatingStructure] = useState(0)
  const [ratingValue, setRatingValue] = useState(0)
  const [comment, setComment] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  
  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Selecione uma avaliação geral")
      return
    }
    
    try {
      setLoading(true)
      
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizerId,
          eventId,
          registrationId,
          rating,
          comment: comment.trim() || null,
          ratingOrganization: ratingOrganization || null,
          ratingCommunication: ratingCommunication || null,
          ratingStructure: ratingStructure || null,
          ratingValue: ratingValue || null,
          isAnonymous,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Erro ao enviar avaliação")
      }
      
      toast.success("Avaliação enviada com sucesso! Obrigado pelo feedback.")
      onOpenChange(false)
      onSuccess?.()
      
      // Reset form
      setRating(0)
      setRatingOrganization(0)
      setRatingCommunication(0)
      setRatingStructure(0)
      setRatingValue(0)
      setComment("")
      setIsAnonymous(false)
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar avaliação")
    } finally {
      setLoading(false)
    }
  }
  
  const getRatingLabel = (value: number) => {
    const labels = ["", "Péssimo", "Ruim", "Regular", "Bom", "Excelente"]
    return labels[value] || ""
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Avaliar Organizador</DialogTitle>
          <DialogDescription>
            Avalie sua experiência com <span className="font-semibold text-gray-800">{organizerName}</span>
            {eventName && (
              <span className="block mt-1 text-sm">
                Evento: <span className="font-medium">{eventName}</span>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Avaliação Geral */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Avaliação Geral *</Label>
            <div className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg">
              <StarRating
                rating={rating}
                size="lg"
                interactive
                onRatingChange={setRating}
              />
              {rating > 0 && (
                <span className="text-sm font-medium text-[#156634]">
                  {getRatingLabel(rating)}
                </span>
              )}
            </div>
          </div>
          
          {/* Avaliações Detalhadas */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Avaliações Detalhadas (opcional)</Label>
            
            <div className="grid gap-4">
              {/* Organização */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-[#156634]" />
                  <span className="text-sm font-medium">Organização</span>
                </div>
                <StarRating
                  rating={ratingOrganization}
                  size="sm"
                  interactive
                  onRatingChange={setRatingOrganization}
                />
              </div>
              
              {/* Comunicação */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Comunicação</span>
                </div>
                <StarRating
                  rating={ratingCommunication}
                  size="sm"
                  interactive
                  onRatingChange={setRatingCommunication}
                />
              </div>
              
              {/* Estrutura */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Estrutura</span>
                </div>
                <StarRating
                  rating={ratingStructure}
                  size="sm"
                  interactive
                  onRatingChange={setRatingStructure}
                />
              </div>
              
              {/* Custo-benefício */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Custo-benefício</span>
                </div>
                <StarRating
                  rating={ratingValue}
                  size="sm"
                  interactive
                  onRatingChange={setRatingValue}
                />
              </div>
            </div>
          </div>
          
          {/* Comentário */}
          <div className="space-y-2">
            <Label htmlFor="comment">Comentário (opcional)</Label>
            <Textarea
              id="comment"
              placeholder="Conte como foi sua experiência..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={1000}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 text-right">
              {comment.length}/1000 caracteres
            </p>
          </div>
          
          {/* Anônimo */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={(checked) => setIsAnonymous(checked === true)}
            />
            <Label htmlFor="anonymous" className="text-sm cursor-pointer">
              Enviar avaliação de forma anônima
            </Label>
          </div>
        </div>
        
        {/* Botões */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || rating === 0}
            className="flex-1 bg-[#156634] hover:bg-[#1a7a3e]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Avaliação
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

