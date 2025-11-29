"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin, FileText, Mail, Phone, User, CreditCard, Percent, AlertCircle, Loader2, Settings, Eye, Edit, FilePlus, Trash2, Plus, Users, XCircle, CheckCircle2 } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { getOrganizerAccess } from "@/lib/supabase/organizer-access"

export default function OrganizerSettingsPage() {
  const [isEditingBank, setIsEditingBank] = useState(false)
  const [loading, setLoading] = useState(true)
  const [organizerId, setOrganizerId] = useState<string | null>(null)
  const [empresaData, setEmpresaData] = useState({
    razaoSocial: "",
    endereco: "",
    cnpj: "",
    email: "",
    telefone: "",
    inscricaoEstadual: "",
    responsavelLegal: "",
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

  // Usuários da organização
  const [organizationUsers, setOrganizationUsers] = useState<any[]>([])
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<any | null>(null)
  const [editUserPermissions, setEditUserPermissions] = useState({
    can_view: true,
    can_edit: false,
    can_create: false,
    can_delete: false,
  })
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserName, setNewUserName] = useState("")
  const [newUserPassword, setNewUserPassword] = useState("")
  const [newUserPhone, setNewUserPhone] = useState("")
  const [userExists, setUserExists] = useState<boolean | null>(null)
  const [checkingUser, setCheckingUser] = useState(false)
  const [newUserPermissions, setNewUserPermissions] = useState({
    can_view: true,
    can_edit: false,
    can_create: false,
    can_delete: false,
  })
  const [addingUser, setAddingUser] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user

      if (!user) {
        window.location.href = "/login"
        return
      }

      // Verificar acesso (organizador principal OU membro de organização)
      const access = await getOrganizerAccess(supabase, user.id)
      
      if (!access) {
        console.error("❌ [SETTINGS] Usuário não tem acesso ao dashboard do organizador")
        toast.error("Você não tem permissão para acessar este dashboard")
        setLoading(false)
        return
      }

      const organizerId = access.organizerId
      setOrganizerId(organizerId)

      // Buscar dados completos do organizador
      const { data: organizer } = await supabase
        .from("organizers")
        .select("*")
        .eq("id", organizerId)
        .single()

      if (!organizer) {
        toast.error("Organizador não encontrado")
        setLoading(false)
        return
      }

      // Buscar dados do usuário
      const { data: userData } = await supabase
        .from("users")
        .select("email, full_name, phone")
        .eq("id", user.id)
        .maybeSingle()

      setEmpresaData({
        razaoSocial: organizer.company_name || "",
        endereco: organizer.company_address || "",
        cnpj: organizer.company_cnpj || "",
        email: userData?.email || "",
        telefone: organizer.company_phone || userData?.phone || "",
        inscricaoEstadual: organizer.state_registration || "",
        responsavelLegal: organizer.legal_responsible || "",
      })

      setBankData({
        banco: organizer.bank_name || "",
        agencia: organizer.agency || "",
        conta: organizer.account_number || "",
        tipoConta: organizer.account_type || "",
        nomeTitular: organizer.account_holder_name || "",
        cpfCnpjTitular: organizer.account_cpf_cnpj || "",
        pix: ""
      })

      // Buscar usuários da organização (ativos e inativos)
      const { data: orgUsers, error: orgUsersError } = await supabase
        .from("organization_users")
        .select("*")
        .eq("organizer_id", organizerId)
        .order("created_at", { ascending: false })

      if (orgUsersError) {
        console.error("Erro ao buscar usuários da organização:", orgUsersError)
        toast.error("Erro ao carregar usuários: " + orgUsersError.message)
        setOrganizationUsers([])
        return
      }

      // Buscar dados dos usuários separadamente
      if (orgUsers && orgUsers.length > 0) {
        const userIds = orgUsers.map(ou => ou.user_id).filter(Boolean)
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, email, full_name, is_active")
          .in("id", userIds)

        if (usersError) {
          console.error("Erro ao buscar dados dos usuários:", usersError)
        } else {
          // Combinar dados
          const orgUsersWithUserData = orgUsers.map(orgUser => ({
            ...orgUser,
            user: usersData?.find(u => u.id === orgUser.user_id) || null
          }))
          console.log("Usuários encontrados:", orgUsersWithUserData.length, orgUsersWithUserData)
          setOrganizationUsers(orgUsersWithUserData)
        }
      } else {
        console.log("Nenhum usuário encontrado na organização")
        setOrganizationUsers([])
      }
    } catch (error: any) {
      console.error("Erro ao buscar perfil:", error)
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveBank = async () => {
    if (!organizerId) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("organizers")
        .update({
          bank_name: bankData.banco,
          agency: bankData.agencia,
          account_number: bankData.conta,
          account_type: bankData.tipoConta,
          account_holder_name: bankData.nomeTitular,
          account_cpf_cnpj: bankData.cpfCnpjTitular,
          updated_at: new Date().toISOString(),
        })
        .eq("id", organizerId)

      if (error) throw error

      toast.success("Dados bancários salvos com sucesso!")
      setIsEditingBank(false)
    } catch (error: any) {
      console.error("Erro ao salvar:", error)
      toast.error("Erro ao salvar dados bancários")
    }
  }

  const checkUserExists = async (email: string) => {
    if (!email || !email.includes("@")) {
      setUserExists(null)
      return
    }

    try {
      setCheckingUser(true)
      const supabase = createClient()
      const { data: user } = await supabase
        .from("users")
        .select("id, email, full_name")
        .eq("email", email)
        .maybeSingle()

      setUserExists(!!user)
    } catch (error) {
      console.error("Erro ao verificar usuário:", error)
      setUserExists(null)
    } finally {
      setCheckingUser(false)
    }
  }

  const handleEmailChange = (email: string) => {
    setNewUserEmail(email)
    if (email) {
      checkUserExists(email)
    } else {
      setUserExists(null)
    }
  }

  const handleAddUser = async () => {
    if (!organizerId || !newUserEmail) {
      toast.error("Preencha o email do usuário")
      return
    }

    try {
      setAddingUser(true)
      const supabase = createClient()

      let userId: string

      // Se o usuário não existe, criar novo usuário
      if (userExists === false) {
        if (!newUserName || !newUserPassword) {
          toast.error("Preencha o nome e a senha para criar um novo usuário")
          return
        }

        // Criar novo usuário via API
        const response = await fetch("/api/organizer/create-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: newUserEmail,
            password: newUserPassword,
            full_name: newUserName,
            phone: newUserPhone,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          const errorMessage = data.details || data.error || "Erro ao criar usuário"
          console.error("Erro da API:", errorMessage, data)
          throw new Error(errorMessage)
        }

        userId = data.user.id
        
        // Enviar email com credenciais (não bloqueia se falhar)
        try {
          const response = await fetch("/api/organizer/send-credentials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: newUserEmail,
              password: newUserPassword,
              full_name: newUserName,
            }),
          })
          if (response.ok) {
            toast.success("Usuário criado e email enviado com sucesso!")
          } else {
            toast.success("Usuário criado com sucesso! (Email não foi enviado)")
          }
        } catch (emailError) {
          console.error("Erro ao enviar email:", emailError)
          toast.success("Usuário criado com sucesso! (Email não foi enviado)")
        }
      } else {
        // Buscar usuário existente
        const { data: user } = await supabase
          .from("users")
          .select("id")
          .eq("email", newUserEmail)
          .single()

        if (!user) {
          toast.error("Usuário não encontrado com este email")
          return
        }

        userId = user.id
      }

      // Verificar se já está na organização
      const { data: existing } = await supabase
        .from("organization_users")
        .select("id")
        .eq("organizer_id", organizerId)
        .eq("user_id", userId)
        .maybeSingle()

      if (existing) {
        toast.error("Usuário já está na organização")
        return
      }

      // Adicionar usuário à organização
      const { error } = await supabase
        .from("organization_users")
        .insert({
          organizer_id: organizerId,
          user_id: userId,
          can_view: newUserPermissions.can_view,
          can_edit: newUserPermissions.can_edit,
          can_create: newUserPermissions.can_create,
          can_delete: newUserPermissions.can_delete,
          is_active: true,
        })

      if (error) throw error

      toast.success("Usuário adicionado com sucesso!")
      setShowAddUserDialog(false)
      setNewUserEmail("")
      setNewUserName("")
      setNewUserPassword("")
      setNewUserPhone("")
      setUserExists(null)
      setNewUserPermissions({
        can_view: true,
        can_edit: false,
        can_create: false,
        can_delete: false,
      })
      // Aguardar um pouco antes de recarregar para garantir que o banco foi atualizado
      setTimeout(() => {
        fetchProfile()
      }, 500)
    } catch (error: any) {
      console.error("Erro ao adicionar usuário:", error)
      const errorMessage = error.message || "Erro desconhecido"
      
      // Mensagens mais específicas baseadas no erro
      if (errorMessage.includes("já existe")) {
        toast.error("Este email já está cadastrado no sistema")
      } else if (errorMessage.includes("senha") || errorMessage.includes("password")) {
        toast.error("A senha deve ter no mínimo 6 caracteres")
      } else if (errorMessage.includes("email") || errorMessage.includes("Email")) {
        toast.error("Email inválido")
      } else if (errorMessage.includes("Não autorizado") || errorMessage.includes("organizador")) {
        toast.error("Você não tem permissão para criar usuários")
      } else {
        toast.error("Erro ao adicionar usuário: " + errorMessage)
      }
    } finally {
      setAddingUser(false)
    }
  }

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
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie seu perfil, dados bancários e usuários da organização
        </p>
      </div>

      <Tabs defaultValue="perfil" className="space-y-4">
        <TabsList>
          <TabsTrigger value="perfil" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Meu Perfil
          </TabsTrigger>
          <TabsTrigger value="bancarios" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Dados Bancários
          </TabsTrigger>
          <TabsTrigger value="taxas" className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Taxas
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
        </TabsList>

        {/* Tab: Meu Perfil */}
        <TabsContent value="perfil" className="space-y-4">
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

        {/* Tab: Dados Bancários */}
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

        {/* Tab: Taxas */}
        <TabsContent value="taxas" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Taxas e Prazos</CardTitle>
              </div>
              <CardDescription>Configurações de taxas e prazos de recebimento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Taxa da Plataforma</Label>
                <p className="text-sm font-medium">10%</p>
                <p className="text-xs text-muted-foreground mt-1">Taxa única cobrada pela plataforma</p>
              </div>
              
              <div className="space-y-4 pt-4 border-t">
                <h4 className="text-sm font-semibold">Prazo de Recebimento</h4>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Cartão de Crédito</Label>
                    <p className="text-sm font-medium">2 dias úteis</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Boleto</Label>
                    <p className="text-sm font-medium">1 dia útil</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">PIX</Label>
                    <p className="text-sm font-medium">1 dia útil</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Label className="text-sm text-muted-foreground">Taxa de Saque</Label>
                <p className="text-sm font-medium">R$ 0,00</p>
                <p className="text-xs text-muted-foreground mt-1">Sem taxa para saques</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Usuários */}
        <TabsContent value="usuarios" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Usuários da Organização</CardTitle>
                  <CardDescription>
                    Gerencie permissões dos usuários ({organizationUsers.length} usuário{organizationUsers.length !== 1 ? 's' : ''})
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchProfile()}
                    disabled={loading}
                  >
                    <Loader2 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                  <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Usuário
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Usuário</DialogTitle>
                      <DialogDescription>
                        Adicione um usuário à sua organização com permissões específicas
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email do Usuário</Label>
                        <div className="relative">
                          <Input
                            id="email"
                            type="email"
                            value={newUserEmail}
                            onChange={(e) => handleEmailChange(e.target.value)}
                            placeholder="usuario@exemplo.com"
                            className={checkingUser ? "pr-10" : ""}
                          />
                          {checkingUser && (
                            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                          )}
                        </div>
                        {userExists === false && (
                          <p className="text-xs text-blue-600 mt-1">
                            Usuário não encontrado. Preencha os dados para criar um novo usuário.
                          </p>
                        )}
                        {userExists === true && (
                          <p className="text-xs text-green-600 mt-1">
                            Usuário encontrado. Será adicionado à organização.
                          </p>
                        )}
                      </div>

                      {/* Campos para cadastro de novo usuário */}
                      <div className="space-y-2">
                        <Label htmlFor="name">
                          Nome Completo {userExists === false && "*"}
                        </Label>
                        <Input
                          id="name"
                          type="text"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          placeholder="Nome completo do usuário"
                          disabled={userExists === true}
                        />
                        {userExists === true && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Nome não pode ser alterado para usuários existentes
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">
                          Senha {userExists === false && "*"}
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={newUserPassword}
                          onChange={(e) => setNewUserPassword(e.target.value)}
                          placeholder="Senha do usuário"
                          disabled={userExists === true}
                        />
                        <p className="text-xs text-muted-foreground">
                          {userExists === false 
                            ? "Mínimo de 6 caracteres (obrigatório para novo usuário)"
                            : userExists === true
                            ? "Usuário existente já possui senha cadastrada"
                            : "Defina uma senha para criar novo usuário (mínimo 6 caracteres)"}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone (opcional)</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={newUserPhone}
                          onChange={(e) => setNewUserPhone(e.target.value)}
                          placeholder="(00) 00000-0000"
                          disabled={userExists === true}
                        />
                        {userExists === true && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Telefone não pode ser alterado para usuários existentes
                          </p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <Label>Permissões</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="can_view"
                              checked={newUserPermissions.can_view}
                              onCheckedChange={(checked) =>
                                setNewUserPermissions({ ...newUserPermissions, can_view: !!checked })
                              }
                            />
                            <Label htmlFor="can_view" className="flex items-center gap-2 cursor-pointer">
                              <Eye className="h-4 w-4" />
                              Visualizar
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="can_edit"
                              checked={newUserPermissions.can_edit}
                              onCheckedChange={(checked) =>
                                setNewUserPermissions({ ...newUserPermissions, can_edit: !!checked })
                              }
                            />
                            <Label htmlFor="can_edit" className="flex items-center gap-2 cursor-pointer">
                              <Edit className="h-4 w-4" />
                              Editar
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="can_create"
                              checked={newUserPermissions.can_create}
                              onCheckedChange={(checked) =>
                                setNewUserPermissions({ ...newUserPermissions, can_create: !!checked })
                              }
                            />
                            <Label htmlFor="can_create" className="flex items-center gap-2 cursor-pointer">
                              <FilePlus className="h-4 w-4" />
                              Criar
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="can_delete"
                              checked={newUserPermissions.can_delete}
                              onCheckedChange={(checked) =>
                                setNewUserPermissions({ ...newUserPermissions, can_delete: !!checked })
                              }
                            />
                            <Label htmlFor="can_delete" className="flex items-center gap-2 cursor-pointer">
                              <Trash2 className="h-4 w-4" />
                              Deletar
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleAddUser}
                        disabled={addingUser || !newUserEmail || (userExists === false && (!newUserName || !newUserPassword))}
                        className="bg-[#156634] hover:bg-[#1a7a3e]"
                      >
                        {addingUser ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {userExists === false ? "Criando..." : "Adicionando..."}
                          </>
                        ) : (
                          userExists === false ? "Criar e Adicionar Usuário" : "Adicionar Usuário"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Permissões</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizationUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Nenhum usuário adicionado
                      </TableCell>
                    </TableRow>
                  ) : (
                    organizationUsers.map((orgUser) => (
                      <TableRow key={orgUser.id} className={!orgUser.is_active ? "opacity-60" : ""}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{orgUser.user?.full_name || "-"}</span>
                          </div>
                        </TableCell>
                        <TableCell>{orgUser.user?.email || "-"}</TableCell>
                        <TableCell>
                          {orgUser.is_active ? (
                            <Badge className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Ativo
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-50 text-gray-700 border-gray-200">
                              <XCircle className="h-3 w-3 mr-1" />
                              Inativo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 flex-wrap">
                            {orgUser.can_view && <Badge variant="outline" className="text-xs">Visualizar</Badge>}
                            {orgUser.can_edit && <Badge variant="outline" className="text-xs">Editar</Badge>}
                            {orgUser.can_create && <Badge variant="outline" className="text-xs">Criar</Badge>}
                            {orgUser.can_delete && <Badge variant="outline" className="text-xs">Deletar</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                console.log("🔧 [EDIT USER] Clicou em editar:", orgUser)
                                setEditingUser(orgUser)
                                setEditUserPermissions({
                                  can_view: orgUser.can_view || false,
                                  can_edit: orgUser.can_edit || false,
                                  can_create: orgUser.can_create || false,
                                  can_delete: orgUser.can_delete || false,
                                })
                                console.log("🔧 [EDIT USER] Estado atualizado:", {
                                  editingUser: orgUser,
                                  permissions: {
                                    can_view: orgUser.can_view || false,
                                    can_edit: orgUser.can_edit || false,
                                    can_create: orgUser.can_create || false,
                                    can_delete: orgUser.can_delete || false,
                                  }
                                })
                              }}
                              title="Editar usuário"
                            >
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                if (confirm(`Tem certeza que deseja ${orgUser.is_active ? "inativar" : "ativar"} este usuário?`)) {
                                  const supabase = createClient()
                                  const { error } = await supabase
                                    .from("organization_users")
                                    .update({ is_active: !orgUser.is_active })
                                    .eq("id", orgUser.id)
                                  if (error) {
                                    toast.error("Erro ao atualizar usuário")
                                  } else {
                                    toast.success(`Usuário ${orgUser.is_active ? "inativado" : "ativado"} com sucesso`)
                                    fetchProfile()
                                  }
                                }
                              }}
                              title={orgUser.is_active ? "Inativar usuário" : "Ativar usuário"}
                            >
                              {orgUser.is_active ? (
                                <XCircle className="h-4 w-4 text-yellow-600" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                if (confirm("Tem certeza que deseja remover este usuário da organização? Esta ação não pode ser desfeita.")) {
                                  const supabase = createClient()
                                  const { error } = await supabase
                                    .from("organization_users")
                                    .delete()
                                    .eq("id", orgUser.id)
                                  if (error) {
                                    toast.error("Erro ao remover usuário")
                                  } else {
                                    toast.success("Usuário removido com sucesso")
                                    fetchProfile()
                                  }
                                }
                              }}
                              title="Remover usuário"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Editar Usuário */}
      <Dialog open={!!editingUser} onOpenChange={(open) => {
        console.log("🔧 [EDIT USER DIALOG] onOpenChange:", open, "editingUser:", editingUser)
        if (!open) setEditingUser(null)
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as permissões do usuário {editingUser?.user?.full_name || editingUser?.user?.email || "N/A"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-base font-semibold">Permissões</Label>
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit_can_view"
                    checked={editUserPermissions.can_view}
                    onCheckedChange={(checked) =>
                      setEditUserPermissions({ ...editUserPermissions, can_view: !!checked })
                    }
                  />
                  <Label htmlFor="edit_can_view" className="flex items-center gap-2 cursor-pointer font-normal">
                    Visualizar
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit_can_edit"
                    checked={editUserPermissions.can_edit}
                    onCheckedChange={(checked) =>
                      setEditUserPermissions({ ...editUserPermissions, can_edit: !!checked })
                    }
                  />
                  <Label htmlFor="edit_can_edit" className="flex items-center gap-2 cursor-pointer font-normal">
                    Editar
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit_can_create"
                    checked={editUserPermissions.can_create}
                    onCheckedChange={(checked) =>
                      setEditUserPermissions({ ...editUserPermissions, can_create: !!checked })
                    }
                  />
                  <Label htmlFor="edit_can_create" className="flex items-center gap-2 cursor-pointer font-normal">
                    Criar
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit_can_delete"
                    checked={editUserPermissions.can_delete}
                    onCheckedChange={(checked) =>
                      setEditUserPermissions({ ...editUserPermissions, can_delete: !!checked })
                    }
                  />
                  <Label htmlFor="edit_can_delete" className="flex items-center gap-2 cursor-pointer font-normal">
                    Deletar
                  </Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (!editingUser || !organizerId) return

                try {
                  const supabase = createClient()
                  const { error } = await supabase
                    .from("organization_users")
                    .update({
                      can_view: editUserPermissions.can_view,
                      can_edit: editUserPermissions.can_edit,
                      can_create: editUserPermissions.can_create,
                      can_delete: editUserPermissions.can_delete,
                    })
                    .eq("id", editingUser.id)

                  if (error) {
                    console.error("Erro ao atualizar permissões:", error)
                    toast.error("Erro ao atualizar permissões")
                  } else {
                    toast.success("Permissões atualizadas com sucesso!")
                    setEditingUser(null)
                    fetchProfile()
                  }
                } catch (error: any) {
                  console.error("Erro ao atualizar permissões:", error)
                  toast.error("Erro ao atualizar permissões")
                }
              }}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

