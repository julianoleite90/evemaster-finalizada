// Tipos compartilhados da aplicação

export type UserRole = 'ADMIN' | 'ORGANIZER' | 'AFFILIATE' | 'ATHLETE'

export interface Event {
  id: string
  name: string
  description?: string
  start_date: string
  end_date: string
  location: string
  organizer_id: string
  status: 'draft' | 'published' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface EventModality {
  id: string
  event_id: string
  name: string // Ex: "5km", "10km", "Caminhada"
  description?: string
  max_participants?: number
  created_at: string
}

export interface Batch {
  id: string
  event_id: string
  modality_id: string
  name: string // Ex: "Lote 1"
  price: number
  start_date: string
  end_date: string
  max_quantity?: number
  created_at: string
}

export interface Registration {
  id: string
  event_id: string
  modality_id: string
  batch_id: string
  buyer_id: string // ID do usuário que comprou
  athlete_id: string // ID do atleta (pode ser diferente do comprador)
  status: 'pending' | 'confirmed' | 'cancelled'
  total_amount: number
  created_at: string
  updated_at: string
}





