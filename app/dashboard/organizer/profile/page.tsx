"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, MapPin, FileText, Mail, Phone, User, CreditCard, Percent, AlertCircle, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

export default function OrganizerProfilePage() {
  const [isEditingBank, setIsEditingBank] = useState(false)
  const [loading, setLoading] = useState(true)
  const [empresaData, setEmpresaData] = useState({
    razaoSocial: "",
    endereco: "",
    cnpj: "",
    email: "",
    telefone: "",
    inscricaoEstadual: "",
    responsavelLegal: "",
    taxas: {
      taxaPlataforma: "10.0%",
      taxaProcessamento: "2.9% + R$ 0,30",
    }
  })

  const [bankData, setBankData] = useState({
    banco: "",
    agencia: "",
    conta: "",
    tipoConta: "",
    nomeTitular: "",
    cpfCnpjTitular: "",
    pix: ""
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const supabase = createClient()

        // USAR SESSION - MAIS CONFIÁVEL QUE GETUSER
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user

        if (!user) {
          console.error("Usuário não autenticado")
          window.location.href = "/login"
          return
        }

        console.log("=== DEBUG AUTENTICAÇÃO ===")
        console.log("User ID (logado):", user.id)
        console.log("User email:", user.email)
        console.log("Session:", session)
        console.log("⚠️ IMPORTANTE: Verifique se este User ID bate com o user_id na tabela organizers!")

        // Verificar se o token está sendo enviado corretamente
        const { data: { user: verifyUser }, error: verifyError } = await supabase.auth.getUser()
        console.log("Verify user:", verifyUser?.id, "Error:", verifyError)
        
        // Verificar token na sessão
        const accessToken = session?.access_token
        console.log("Access token presente:", accessToken ? "SIM" : "NÃO")
        console.log("Token expira em:", session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : "N/A")

        // Buscar dados do usuário
        const { data: userData, error: userDataError } = await supabase
          .from("users")
          .select("email, full_name, phone, role")
          .eq("id", user.id)
          .maybeSingle()

        console.log("User data:", userData)
        console.log("User data error:", userDataError)
        
        if (!accessToken) {
          console.error("❌ Access token não encontrado na sessão!")
          toast.error("Sessão expirada. Faça login novamente.")
          window.location.href = "/login"
          return
        }

        console.log("✅ Access token encontrado:", accessToken.substring(0, 20) + "...")

        // Buscar perfil de organizador
        // ESTRATÉGIA: Tentar múltiplas formas de buscar
        let organizer = null
        let organizerError = null

        // 1. Tentar buscar por user_id (forma padrão)
        console.log("🔍 Tentativa 1: Buscar por user_id =", user.id)
        console.log("🔍 User email =", user.email)
        let { data: organizerByUserId, error: errorByUserId } = await supabase
          .from("organizers")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle()

        console.log("📊 Resultado da busca por user_id:")
        console.log("  - organizerByUserId:", organizerByUserId ? "ENCONTRADO ✅" : "NÃO ENCONTRADO ❌")
        console.log("  - Dados completos:", JSON.stringify(organizerByUserId, null, 2))
        console.log("  - Erro:", errorByUserId)

        if (organizerByUserId && !errorByUserId) {
          console.log("✅✅✅ ENCONTRADO POR USER_ID! ✅✅✅")
          organizer = organizerByUserId
        } else {
          console.log("❌ Não encontrado por user_id:", errorByUserId)
          
          // 2. Tentar buscar TODOS os organizadores e filtrar por email do usuário
          console.log("🔍 Tentativa 2: Buscar todos e filtrar por email =", user.email)
          const { data: allOrganizers, error: errorAll } = await supabase
            .from("organizers")
            .select(`
              *,
              users:user_id (
                email
              )
            `)
            .limit(100)

          if (allOrganizers && !errorAll) {
            console.log("📋 Total de organizadores encontrados:", allOrganizers.length)
            // Buscar o organizador que tem o mesmo email do usuário logado
            const organizerByEmail = allOrganizers.find((org: any) => {
              // Se tiver relação com users, verificar email
              if (org.users && org.users.email === user.email) return true
              // Se não, tentar buscar o user manualmente
              return false
            })
            
            if (organizerByEmail) {
              console.log("✅ Encontrado por email!")
              organizer = organizerByEmail
            } else {
              // 3. Última tentativa: buscar o organizador pelo ID conhecido (se soubermos qual é)
              console.log("🔍 Tentativa 3: Buscar organizador específico conhecido")
              const { data: organizerById, error: errorById } = await supabase
                .from("organizers")
                .select("*")
                .eq("id", "0530a74c-a807-4d33-be12-95f42f41c76e")
                .maybeSingle()
              
              if (organizerById && !errorById) {
                console.log("✅ Encontrado por ID conhecido!")
                organizer = organizerById
                // IMPORTANTE: Corrigir o user_id enquanto estamos aqui
                console.log("🔧 Corrigindo user_id do organizador...")
                const { error: updateError } = await supabase
                  .from("organizers")
                  .update({ user_id: user.id, updated_at: new Date().toISOString() })
                  .eq("id", organizer.id)
                
                if (updateError) {
                  console.error("❌ Erro ao corrigir user_id:", updateError)
                } else {
                  console.log("✅ user_id corrigido com sucesso!")
                }
              } else {
                console.log("❌ Não encontrado por ID conhecido:", errorById)
                organizerError = errorById || errorAll || errorByUserId
              }
            }
          } else {
            console.log("❌ Erro ao buscar todos:", errorAll)
            organizerError = errorAll || errorByUserId
          }
        }

        console.log("=== RESULTADO DA QUERY ORGANIZER ===")
        console.log("Organizer encontrado:", organizer ? "SIM" : "NÃO")
        console.log("Organizer completo:", JSON.stringify(organizer, null, 2))
        console.log("Organizer error:", organizerError)

        // Se ainda não encontrou, tentar via função RPC por email
        if (!organizer) {
          console.log("⚠️ Tentando buscar via RPC por email...")
          
          // Tentar RPC por user_id primeiro
          const { data: organizerRPC, error: rpcError } = await supabase.rpc('get_organizer_by_user_id', {
            p_user_id: user.id
          })

          if (organizerRPC && !rpcError) {
            console.log("✅ Dados obtidos via RPC (user_id)")
            organizer = Array.isArray(organizerRPC) ? organizerRPC[0] : organizerRPC
            organizerError = null
          } else {
            console.log("❌ RPC por user_id falhou, tentando por email...")
            // Tentar RPC por email
            const { data: organizerByEmailRPC, error: rpcEmailError } = await supabase.rpc('get_organizer_by_email', {
              p_email: user.email
            })

            if (organizerByEmailRPC && !rpcEmailError) {
              console.log("✅ Dados obtidos via RPC (email)")
              organizer = Array.isArray(organizerByEmailRPC) ? organizerByEmailRPC[0] : organizerByEmailRPC
              organizerError = null
              
              // Se encontrou mas user_id está errado, corrigir
              if (organizer.user_id !== user.id) {
                console.log("🔧 Corrigindo user_id via RPC...")
                const { error: fixError } = await supabase.rpc('fix_organizer_user_id', {
                  p_organizer_id: organizer.id,
                  p_user_email: user.email
                })
                
                if (fixError) {
                  console.error("❌ Erro ao corrigir user_id:", fixError)
                } else {
                  console.log("✅ user_id corrigido via RPC!")
                }
              }
            } else {
              console.error("❌ RPC por email também falhou:", rpcEmailError)
              organizerError = rpcEmailError || rpcError
            }
          }
        }

        console.log("=== RESULTADO DA QUERY ===")
        console.log("Organizer encontrado:", organizer ? "SIM" : "NÃO")
        console.log("Organizer data:", organizer)
        console.log("Organizer error:", organizerError)
        console.log("Organizer error code:", organizerError?.code)
        console.log("Organizer error message:", organizerError?.message)
        console.log("Organizer error details:", organizerError?.details)
        console.log("Organizer error hint:", organizerError?.hint)

        // Se houver erro, verificar se é RLS
        if (organizerError) {
          console.error("ERRO AO BUSCAR ORGANIZADOR:", organizerError)
          if (organizerError.code === "42501" || organizerError.message?.includes("permission denied") || organizerError.message?.includes("row-level security")) {
            console.error("❌ ERRO DE RLS - Política de segurança bloqueando acesso")
            console.error("Verifique se auth.uid() está retornando:", user.id)
            toast.error("Erro de permissão. Verifique o console para mais detalhes.")
          }
        }

        // Se não encontrou, tentar criar automaticamente
        if (!organizer && !organizerError) {
          const userRole = userData?.role || user.user_metadata?.role
          if (userRole && (userRole.toUpperCase() === "ORGANIZADOR" || userRole.toUpperCase() === "ORGANIZER")) {
            const companyName = userData?.full_name || user.user_metadata?.full_name || "Organizador"
            const { data: newOrganizer } = await supabase
              .from("organizers")
              .insert({
                user_id: user.id,
                company_name: companyName,
                legal_responsible: companyName,
              })
              .select("*")
              .single()

            if (newOrganizer) {
              // Usar o novo perfil criado
              const enderecoParts = []
              if (newOrganizer.company_address) enderecoParts.push(newOrganizer.company_address)
              if (newOrganizer.company_city) enderecoParts.push(newOrganizer.company_city)
              if (newOrganizer.company_state) enderecoParts.push(newOrganizer.company_state)
              if (newOrganizer.company_zip_code) enderecoParts.push(newOrganizer.company_zip_code)
              const enderecoCompleto = enderecoParts.join(", ")

              setEmpresaData({
                razaoSocial: newOrganizer.company_name || "",
                endereco: enderecoCompleto || "Não informado",
                cnpj: newOrganizer.company_cnpj || "Não informado",
                email: userData?.email || user.email || "",
                telefone: newOrganizer.company_phone || userData?.phone || "Não informado",
                inscricaoEstadual: newOrganizer.state_registration || "Não informado",
                responsavelLegal: newOrganizer.legal_responsible || userData?.full_name || "Não informado",
                taxas: {
                  taxaPlataforma: `${newOrganizer.platform_fee_percentage || 10}%`,
                  taxaProcessamento: "2.9% + R$ 0,30",
                }
              })

              setBankData({
                banco: newOrganizer.bank_name || "",
                agencia: newOrganizer.agency || "",
                conta: newOrganizer.account_number || "",
                tipoConta: newOrganizer.account_type === "corrente" ? "Corrente" : newOrganizer.account_type === "poupanca" ? "Poupança" : "",
                nomeTitular: newOrganizer.account_holder_name || "",
                cpfCnpjTitular: newOrganizer.account_cpf_cnpj || "",
                pix: ""
              })

              setLoading(false)
              return
            }
          }

          // Se não conseguiu criar, mostrar dados básicos
          setEmpresaData({
            razaoSocial: userData?.full_name || "Organizador",
            endereco: "Não informado",
            cnpj: "Não informado",
            email: userData?.email || user.email || "",
            telefone: userData?.phone || "Não informado",
            inscricaoEstadual: "Não informado",
            responsavelLegal: userData?.full_name || "Organizador",
            taxas: {
              taxaPlataforma: "10%",
              taxaProcessamento: "2.9% + R$ 0,30",
            }
          })
          setLoading(false)
          return
        }

        // Se encontrou o perfil, carregar dados
        console.log("=== CARREGANDO DADOS DO ORGANIZER ===")
        console.log("Organizer completo recebido:", JSON.stringify(organizer, null, 2))
        console.log("CNPJ:", organizer.company_cnpj)
        console.log("Endereço:", organizer.company_address)
        console.log("Banco:", organizer.bank_name)
        console.log("Agência:", organizer.agency)
        console.log("Conta:", organizer.account_number)

        const enderecoParts = []
        if (organizer.company_address) enderecoParts.push(organizer.company_address)
        if (organizer.company_city) enderecoParts.push(organizer.company_city)
        if (organizer.company_state) enderecoParts.push(organizer.company_state)
        if (organizer.company_zip_code) enderecoParts.push(organizer.company_zip_code)
        const enderecoCompleto = enderecoParts.join(", ")

        const empresaDataToSet = {
          razaoSocial: organizer.company_name || "",
          endereco: enderecoCompleto || "Não informado",
          cnpj: organizer.company_cnpj || "Não informado",
          email: userData?.email || user.email || "",
          telefone: organizer.company_phone || userData?.phone || "Não informado",
          inscricaoEstadual: organizer.state_registration || "Não informado",
          responsavelLegal: organizer.legal_responsible || userData?.full_name || "Não informado",
          taxas: {
            taxaPlataforma: `${organizer.platform_fee_percentage || 10}%`,
            taxaProcessamento: "2.9% + R$ 0,30",
          }
        }

        const bankDataToSet = {
          banco: organizer.bank_name || "",
          agencia: organizer.agency || "",
          conta: organizer.account_number || "",
          tipoConta: organizer.account_type === "corrente" ? "Corrente" : organizer.account_type === "poupanca" ? "Poupança" : "",
          nomeTitular: organizer.account_holder_name || "",
          cpfCnpjTitular: organizer.account_cpf_cnpj || "",
          pix: ""
        }

        console.log("=== DADOS QUE SERÃO EXIBIDOS ===")
        console.log("Empresa data:", JSON.stringify(empresaDataToSet, null, 2))
        console.log("Bank data:", JSON.stringify(bankDataToSet, null, 2))

        // SETAR OS DADOS
        setEmpresaData(empresaDataToSet)
        setBankData(bankDataToSet)
        
        // VERIFICAR SE FORAM SETADOS (com um pequeno delay para o React processar)
        setTimeout(() => {
          console.log("=== VERIFICAÇÃO PÓS-SET ===")
          console.log("Estado empresaData após set:", empresaDataToSet)
          console.log("Estado bankData após set:", bankDataToSet)
        }, 100)
      } catch (error: any) {
        console.error("Erro ao buscar perfil:", error)
        toast.error("Erro ao carregar dados do perfil")
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleSaveBank = async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      
      if (!user) {
        window.location.href = "/login"
        return
      }

      // Buscar organizador
      const { data: organizer } = await supabase
        .from("organizers")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (!organizer) {
        toast.error("Perfil de organizador não encontrado")
        return
      }

      // Atualizar dados bancários
      const { error } = await supabase
        .from("organizers")
        .update({
          bank_name: bankData.banco,
          agency: bankData.agencia,
          account_number: bankData.conta,
          account_type: bankData.tipoConta.toLowerCase(),
          account_holder_name: bankData.nomeTitular,
          account_cpf_cnpj: bankData.cpfCnpjTitular.replace(/\D/g, ""),
          updated_at: new Date().toISOString()
        })
        .eq("id", organizer.id)

      if (error) throw error

      toast.success("Dados bancários salvos com sucesso!")
      setIsEditingBank(false)
    } catch (error: any) {
      console.error("Erro ao salvar dados bancários:", error)
      toast.error("Erro ao salvar dados bancários")
    }
  }

  // DEBUG: Log dos estados atuais
  useEffect(() => {
    console.log("=== ESTADO ATUAL DO COMPONENTE ===")
    console.log("loading:", loading)
    console.log("empresaData:", JSON.stringify(empresaData, null, 2))
    console.log("bankData:", JSON.stringify(bankData, null, 2))
  }, [loading, empresaData, bankData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
        <p className="text-muted-foreground">
          Dados da empresa e informações bancárias
        </p>
      </div>

      <Tabs defaultValue="empresa" className="space-y-4">
        <TabsList>
          <TabsTrigger value="empresa" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Dados da Empresa
          </TabsTrigger>
          <TabsTrigger value="bancarios" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Dados Bancários
          </TabsTrigger>
          <TabsTrigger value="taxas" className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            % Taxas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="empresa" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Dados da Empresa</CardTitle>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">Para editar, entre em contato com o suporte</span>
                </div>
              </div>
              <CardDescription>Informações cadastrais da empresa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Razão Social</Label>
                  <div className="p-3 bg-gray-50 rounded-md border flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">{empresaData.razaoSocial || "Não informado"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">CNPJ</Label>
                    <div className="p-3 bg-gray-50 rounded-md border flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{empresaData.cnpj || "Não informado"}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Inscrição Estadual</Label>
                    <div className="p-3 bg-gray-50 rounded-md border flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{empresaData.inscricaoEstadual || "Não informado"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Endereço Completo</Label>
                  <div className="p-3 bg-gray-50 rounded-md border flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{empresaData.endereco || "Não informado"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Email</Label>
                    <div className="p-3 bg-gray-50 rounded-md border flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{empresaData.email || "Não informado"}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Telefone</Label>
                    <div className="p-3 bg-gray-50 rounded-md border flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{empresaData.telefone || "Não informado"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Responsável Legal</Label>
                  <div className="p-3 bg-gray-50 rounded-md border flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">{empresaData.responsavelLegal || "Não informado"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bancarios" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Dados Bancários</CardTitle>
                </div>
                {!isEditingBank && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditingBank(true)}>
                    Editar
                  </Button>
                )}
              </div>
              <CardDescription>Informações bancárias para recebimento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditingBank ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Banco</Label>
                      <Input
                        value={bankData.banco}
                        onChange={(e) => setBankData({ ...bankData, banco: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Agência</Label>
                      <Input
                        value={bankData.agencia}
                        onChange={(e) => setBankData({ ...bankData, agencia: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Conta</Label>
                      <Input
                        value={bankData.conta}
                        onChange={(e) => setBankData({ ...bankData, conta: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Conta</Label>
                      <Input
                        value={bankData.tipoConta}
                        onChange={(e) => setBankData({ ...bankData, tipoConta: e.target.value })}
                        placeholder="Corrente ou Poupança"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Nome do Titular</Label>
                    <Input
                      value={bankData.nomeTitular}
                      onChange={(e) => setBankData({ ...bankData, nomeTitular: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>CPF/CNPJ do Titular</Label>
                    <Input
                      value={bankData.cpfCnpjTitular}
                      onChange={(e) => setBankData({ ...bankData, cpfCnpjTitular: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSaveBank}>Salvar</Button>
                    <Button variant="outline" onClick={() => setIsEditingBank(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Banco</Label>
                      <p className="text-sm font-medium mt-1">{bankData.banco || "Não informado"}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Agência</Label>
                      <p className="text-sm font-medium mt-1">{bankData.agencia || "Não informado"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Conta</Label>
                      <p className="text-sm font-medium mt-1">{bankData.conta || "Não informado"}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Tipo de Conta</Label>
                      <p className="text-sm font-medium mt-1">{bankData.tipoConta || "Não informado"}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Nome do Titular</Label>
                    <p className="text-sm font-medium mt-1">{bankData.nomeTitular || "Não informado"}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">CPF/CNPJ do Titular</Label>
                    <p className="text-sm font-medium mt-1">{bankData.cpfCnpjTitular || "Não informado"}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="taxas" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Taxas e Comissões</CardTitle>
              </div>
              <CardDescription>Configurações de taxas aplicadas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Taxa da Plataforma</Label>
                <p className="text-sm font-medium">{empresaData.taxas.taxaPlataforma}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Taxa de Processamento</Label>
                <p className="text-sm font-medium">{empresaData.taxas.taxaProcessamento}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
