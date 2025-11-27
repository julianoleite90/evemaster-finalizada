// Este arquivo será gerado automaticamente pelo Supabase CLI
// Por enquanto, definimos tipos básicos para referência

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Tipos serão gerados aqui quando o schema estiver pronto
    }
    Views: {
      // Views serão definidas aqui
    }
    Functions: {
      // Functions serão definidas aqui
    }
    Enums: {
      // Enums serão definidos aqui
    }
  }
}

// Tipos de perfil de usuário
export type UserRole = 'ADMIN' | 'ORGANIZER' | 'AFFILIATE' | 'ATHLETE'

export interface Profile {
  id: string
  user_id: string
  role: UserRole
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}



