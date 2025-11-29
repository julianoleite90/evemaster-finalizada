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

  // Criar um novo File com o content-type correto
  const gpxFile = new File([file], file.name, {
    type: file.type || 'application/gpx+xml',
    lastModified: file.lastModified,
  })

  const { data, error } = await supabase.storage
    .from("event-gpx")
    .upload(fileName, gpxFile, {
      cacheControl: "3600",
      upsert: false,
      contentType: 'application/gpx+xml',
    })

  if (error) throw error

  const {
    data: { publicUrl },
  } = supabase.storage.from("event-gpx").getPublicUrl(data.path)

  return publicUrl
}

/**
 * Upload de arquivo GPX para ticket/ingresso
 */
export async function uploadTicketGPX(file: File, eventId: string, ticketId: string): Promise<string> {
  const supabase = createClient()

  const fileExt = file.name.split(".").pop()
  const fileName = `${eventId}/tickets/${ticketId}/gpx-${Date.now()}.${fileExt}`

  // Criar um novo File com o content-type correto
  const gpxFile = new File([file], file.name, {
    type: file.type || 'application/gpx+xml',
    lastModified: file.lastModified,
  })

  const { data, error } = await supabase.storage
    .from("event-gpx")
    .upload(fileName, gpxFile, {
      cacheControl: "3600",
      upsert: false,
      contentType: 'application/gpx+xml',
    })

  if (error) throw error

  const {
    data: { publicUrl },
  } = supabase.storage.from("event-gpx").getPublicUrl(data.path)

  return publicUrl
}

/**
 * Upload de imagem do evento (galeria)
 */
export async function uploadEventImage(file: File, eventId: string): Promise<string> {
  const supabase = createClient()

  const fileExt = file.name.split(".").pop()
  const fileName = `${eventId}/images/image-${Date.now()}.${fileExt}`

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
 * Deletar arquivo do storage
 */
export async function deleteEventFile(bucket: string, filePath: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.storage.from(bucket).remove([filePath])

  if (error) throw error
}




