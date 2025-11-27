"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
    address: "",
    address_number: "",
    address_complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zip_code: "",
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

        console.log("🔍 [Profile] Buscando dados do usuário:", user.id)

        // Buscar dados do usuário
        const { data: userData, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single()

        console.log("📊 [Profile] Dados retornados do banco:", userData)
        console.log("📊 [Profile] Erro (se houver):", error)

        if (error && error.code !== "PGRST116") {
          console.error("❌ [Profile] Erro ao buscar dados:", error)
          // Mesmo com erro, tentar usar dados dos metadados
        }

        if (userData) {
          console.log("✅ [Profile] Dados encontrados na tabela users")
          setUserData({
            full_name: userData.full_name || "",
            email: user.email || "",
            phone: userData.phone || "",
            address: userData.address || "",
            address_number: userData.address_number || "",
            address_complement: userData.address_complement || "",
            neighborhood: userData.neighborhood || "",
            city: userData.city || "",
            state: userData.state || "",
            zip_code: userData.zip_code || "",
          })
        } else {
          console.log("ℹ️ [Profile] Usuário não encontrado na tabela users, usando metadados")
          // Tentar buscar dos metadados do auth
          const metadata = user.user_metadata || {}
          setUserData({
            full_name: metadata.full_name || "",
            email: user.email || "",
            phone: metadata.phone || "",
            address: metadata.address || "",
            address_number: metadata.address_number || "",
            address_complement: metadata.address_complement || "",
            neighborhood: metadata.neighborhood || "",
            city: metadata.city || "",
            state: metadata.state || "",
            zip_code: metadata.zip_code || "",
          })
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error)
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

      console.log("💾 [Profile] Salvando dados:", {
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
          phone: userData.phone,
          address: userData.address,
          address_number: userData.address_number || null,
          address_complement: userData.address_complement || null,
          neighborhood: userData.neighborhood || null,
          city: userData.city,
          state: userData.state,
          zip_code: userData.zip_code,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        })

      console.log("💾 [Profile] Resultado do upsert:", error ? { error } : "sucesso")

      if (error) {
        console.error("Erro ao salvar:", error)
        toast.error("Erro ao salvar dados")
        return
      }

      toast.success("Perfil atualizado com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar:", error)
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

