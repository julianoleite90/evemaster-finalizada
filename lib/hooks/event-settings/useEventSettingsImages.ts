import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { uploadEventImage } from "@/lib/supabase/storage"
import { toast } from "sonner"

export function useEventSettingsImages(eventId: string) {
  const [eventImages, setEventImages] = useState<Array<{ id: string; image_url: string; image_order: number }>>([])
  const [newImages, setNewImages] = useState<File[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)

  const fetchImages = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("event_images")
        .select("*")
        .eq("event_id", eventId)
        .order("image_order", { ascending: true })

      if (error) throw error
      setEventImages(data || [])
    } catch (error: any) {
      console.error("Erro ao buscar imagens:", error)
    }
  }

  const handleImageUpload = async () => {
    if (newImages.length === 0) return

    try {
      setUploadingImages(true)
      const supabase = createClient()

      for (const image of newImages) {
        const imageUrl = await uploadEventImage(eventId, image)
        
        await supabase
          .from("event_images")
          .insert({
            event_id: eventId,
            image_url: imageUrl,
            image_order: eventImages.length + 1
          })
      }

      toast.success("Imagens enviadas com sucesso!")
      setNewImages([])
      fetchImages()
    } catch (error: any) {
      console.error("Erro ao enviar imagens:", error)
      toast.error("Erro ao enviar imagens")
    } finally {
      setUploadingImages(false)
    }
  }

  const deleteImage = async (imageId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("event_images")
        .delete()
        .eq("id", imageId)

      if (error) throw error

      toast.success("Imagem removida com sucesso!")
      fetchImages()
    } catch (error: any) {
      console.error("Erro ao remover imagem:", error)
      toast.error("Erro ao remover imagem")
    }
  }

  return {
    eventImages,
    setEventImages,
    newImages,
    setNewImages,
    uploadingImages,
    fetchImages,
    handleImageUpload,
    deleteImage,
  }
}

