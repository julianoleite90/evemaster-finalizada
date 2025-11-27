import { createClient } from "@/lib/supabase/client"

/**
 * Upload de banner do evento
 */
export async function uploadEventBanner(file: File, eventId: string): Promise<string> {
  const supabase = createClient()

  const fileExt = file.name.split(".").pop()
  const fileName = `${eventId}/banner-${Date.now()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from("event-banners")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    })

  if (error) throw error

  const {
    data: { publicUrl },
  } = supabase.storage.from("event-banners").getPublicUrl(data.path)

  return publicUrl
}

/**
 * Upload de arquivo GPX
 */
export async function uploadEventGPX(file: File, eventId: string): Promise<string> {
  const supabase = createClient()

  const fileExt = file.name.split(".").pop()
  const fileName = `${eventId}/gpx-${Date.now()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from("event-gpx")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    })

  if (error) throw error

  const {
    data: { publicUrl },
  } = supabase.storage.from("event-gpx").getPublicUrl(data.path)

  return publicUrl
}

/**
 * Deletar arquivo do storage
 */
export async function deleteEventFile(bucket: string, filePath: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.storage.from(bucket).remove([filePath])

  if (error) throw error
}



