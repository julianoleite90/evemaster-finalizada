"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { logger } from "@/lib/utils/logger"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, User, Mail, Phone, MapPin } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function MyProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userData, setUserData] = useState({
    full_name: "",
    email: "",
    phone: "",
    cpf: "",
    age: "",
    gender: "",
    address: "",
    address_number: "",
    address_complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zip_code: "",
    country: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
  })

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        const supabase = createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          toast.error("Você precisa estar logado")
          return
        }

        logger.log("🔍 [Profile] Buscando dados do usuário:", user.id)

        // Buscar dados do usuário - buscar explicitamente todos os campos
        const { data: userData, error } = await supabase
          .from("users")
          .select(`
            id,
            email,
            full_name,
            phone,
            cpf,
            age,
            gender,
            address,
            address_number,
            address_complement,
            neighborhood,
            city,
            state,
            zip_code,
            country,
            emergency_contact_name,
            emergency_contact_phone
          `)
          .eq("id", user.id)
          .single()

        logger.log("📊 [Profile] Dados retornados do banco:", userData)
        logger.log("📊 [Profile] Erro (se houver):", error)

        if (error && error.code !== "PGRST116") {
          logger.error("❌ [Profile] Erro ao buscar dados:", error)
          // Mesmo com erro, tentar usar dados dos metadados
        }

        if (userData) {
          logger.log("✅ [Profile] Dados encontrados na tabela users")
          // Garantir que todos os campos sejam exibidos, mesmo que null/vazios
          setUserData({
            full_name: userData.full_name || "",
            email: user.email || "",
            phone: userData.phone || "",
            cpf: userData.cpf || "",
            age: userData.age?.toString() || "",
            gender: userData.gender || "",
            address: userData.address || "",
            address_number: userData.address_number || "",
            address_complement: userData.address_complement || "",
            neighborhood: userData.neighborhood || "",
            city: userData.city || "",
            state: userData.state || "",
            zip_code: userData.zip_code || "",
            country: userData.country || "",
            emergency_contact_name: userData.emergency_contact_name || "",
            emergency_contact_phone: userData.emergency_contact_phone || "",
          })
        } else {
          logger.log("ℹ️ [Profile] Usuário não encontrado na tabela users, usando metadados")
          // Tentar buscar dos metadados do auth - apenas se não houver dados na tabela
          const metadata = user.user_metadata || {}
          setUserData({
            full_name: metadata.full_name || "",
            email: user.email || "",
            phone: metadata.phone || "",
            cpf: metadata.cpf || "",
            age: metadata.age?.toString() || "",
            gender: metadata.gender || "",
            address: metadata.address || "",
            address_number: metadata.address_number || "",
            address_complement: metadata.address_complement || "",
            neighborhood: metadata.neighborhood || "",
            city: metadata.city || "",
            state: metadata.state || "",
            zip_code: metadata.zip_code || "",
            country: metadata.country || "",
            emergency_contact_name: metadata.emergency_contact_name || "",
            emergency_contact_phone: metadata.emergency_contact_phone || "",
          })
        }
      } catch (error) {
        logger.error("Erro ao buscar dados:", error)
        toast.error("Erro ao carregar dados do perfil")
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Você precisa estar logado")
        return
      }

      logger.log("💾 [Profile] Salvando dados:", {
        id: user.id,
        full_name: userData.full_name,
        phone: userData.phone,
        address: userData.address,
        address_number: userData.address_number,
        address_complement: userData.address_complement,
        neighborhood: userData.neighborhood,
        city: userData.city,
        state: userData.state,
        zip_code: userData.zip_code,
      })

      // Atualizar dados na tabela users
      const { error } = await supabase
        .from("users")
        .upsert({
          id: user.id,
          email: user.email,
          full_name: userData.full_name,
          phone: userData.phone?.replace(/\D/g, '') || null,
          cpf: userData.cpf?.replace(/\D/g, '') || null,
          age: userData.age ? parseInt(userData.age) : null,
          gender: userData.gender || null,
          address: userData.address || null,
          address_number: userData.address_number || null,
          address_complement: userData.address_complement || null,
          neighborhood: userData.neighborhood || null,
          city: userData.city || null,
          state: userData.state || null,
          zip_code: userData.zip_code?.replace(/\D/g, '') || null,
          country: userData.country || null,
          emergency_contact_name: userData.emergency_contact_name || null,
          emergency_contact_phone: userData.emergency_contact_phone?.replace(/\D/g, '') || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        })

      logger.log("💾 [Profile] Resultado do upsert:", error ? { error } : "sucesso")

      if (error) {
        logger.error("Erro ao salvar:", error)
        toast.error("Erro ao salvar dados")
        return
      }

      toast.success("Perfil atualizado com sucesso!")
    } catch (error) {
      logger.error("Erro ao salvar:", error)
      toast.error("Erro ao salvar dados")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#156634]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie suas informações pessoais
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
          <CardDescription>
            Atualize suas informações de contato e endereço
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="full_name">
                  <User className="h-4 w-4 inline mr-2" />
                  Nome Completo
                </Label>
                <Input
                  id="full_name"
                  value={userData.full_name}
                  onChange={(e) =>
                    setUserData({ ...userData, full_name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="h-4 w-4 inline mr-2" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={userData.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-muted-foreground">
                  O email não pode ser alterado
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="h-4 w-4 inline mr-2" />
                  Telefone
                </Label>
                <Input
                  id="phone"
                  value={userData.phone}
                  onChange={(e) =>
                    setUserData({ ...userData, phone: e.target.value })
                  }
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={userData.cpf}
                  onChange={(e) =>
                    setUserData({ ...userData, cpf: e.target.value })
                  }
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Idade</Label>
                <Input
                  id="age"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="120"
                  value={userData.age}
                  onChange={(e) =>
                    setUserData({ ...userData, age: e.target.value })
                  }
                  placeholder="Ex: 35"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gênero</Label>
                <select
                  id="gender"
                  value={userData.gender}
                  onChange={(e) =>
                    setUserData({ ...userData, gender: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Selecione</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                  <option value="outro">Outro</option>
                  <option value="prefiro_nao_informar">Prefiro não informar</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zip_code">
                  <MapPin className="h-4 w-4 inline mr-2" />
                  CEP
                </Label>
                <Input
                  id="zip_code"
                  value={userData.zip_code}
                  onChange={(e) =>
                    setUserData({ ...userData, zip_code: e.target.value })
                  }
                  placeholder="00000-000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={userData.address}
                  onChange={(e) =>
                    setUserData({ ...userData, address: e.target.value })
                  }
                  placeholder="Rua, avenida, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address_number">Número</Label>
                  <Input
                    id="address_number"
                    value={userData.address_number}
                    onChange={(e) =>
                      setUserData({ ...userData, address_number: e.target.value })
                    }
                    placeholder="123"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address_complement">Complemento</Label>
                  <Input
                    id="address_complement"
                    value={userData.address_complement}
                    onChange={(e) =>
                      setUserData({ ...userData, address_complement: e.target.value })
                    }
                    placeholder="Apto, bloco, etc."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={userData.neighborhood}
                  onChange={(e) =>
                    setUserData({ ...userData, neighborhood: e.target.value })
                  }
                  placeholder="Nome do bairro"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={userData.city}
                    onChange={(e) =>
                      setUserData({ ...userData, city: e.target.value })
                    }
                    placeholder="Nome da cidade"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={userData.state}
                    onChange={(e) =>
                      setUserData({ ...userData, state: e.target.value })
                    }
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Input
                  id="country"
                  value={userData.country}
                  onChange={(e) =>
                    setUserData({ ...userData, country: e.target.value })
                  }
                  placeholder="Brasil"
                />
              </div>
            </div>

            {/* Contato de Emergência */}
            <div className="space-y-4 pt-4 border-t">
              <div>
                <h3 className="text-lg font-semibold mb-2">Contato de Emergência</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Informe um contato para emergências durante eventos
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_name">Nome do Contato *</Label>
                  <Input
                    id="emergency_contact_name"
                    value={userData.emergency_contact_name}
                    onChange={(e) =>
                      setUserData({ ...userData, emergency_contact_name: e.target.value })
                    }
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_phone">Telefone do Contato *</Label>
                  <Input
                    id="emergency_contact_phone"
                    value={userData.emergency_contact_phone}
                    onChange={(e) =>
                      setUserData({ ...userData, emergency_contact_phone: e.target.value })
                    }
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

