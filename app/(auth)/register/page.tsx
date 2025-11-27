"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  User,
  Mail,
  Phone,
  Building2,
  UserCircle,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  Search,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { buscarCNPJ } from "@/lib/api/receita-federal"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import Link from "next/link"

export default function RegisterPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loadingCNPJ, setLoadingCNPJ] = useState(false)
  const cnpjSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [formData, setFormData] = useState({
    // Step 1: Dados Básicos
    nomeCompleto: "",
    email: "",
    telefone: "",
    senha: "",
    confirmarSenha: "",
    tipoCadastro: "" as "organizador" | "afiliado" | "",
    tipoPessoa: "" as "fisica" | "juridica" | "",

    // Step 2: Dados da Empresa (se jurídica)
    cnpj: "",
    razaoSocial: "",
    nomeFantasia: "",
    dataAbertura: "",
    situacao: "",
    inscricaoEstadual: "",
    endereco: {
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      municipio: "",
      uf: "",
      cep: "",
    },
    telefoneEmpresa: "",
    emailEmpresa: "",
    capitalSocial: "",

    // Step 3: Dados do Administrador (apenas jurídica)
    administrador: {
      nome: "",
      cpf: "",
      email: "",
      telefone: "",
      cargo: "",
    },

    // Step 4: Dados Bancários
    dadosBancarios: {
      banco: "",
      agencia: "",
      conta: "",
      tipoConta: "" as "corrente" | "poupanca" | "",
      titular: "",
      cpfCnpjTitular: "",
    },

    // Dados Pessoa Física (se física)
    pessoaFisica: {
      cpf: "",
      dataNascimento: "",
      genero: "" as "Masculino" | "Feminino" | "Outro" | "Prefiro não informar" | "",
    },
  })

  const handleNext = () => {
    // Validações por step
    if (currentStep === 1) {
      if (!formData.nomeCompleto || !formData.email || !formData.telefone || !formData.senha || !formData.confirmarSenha || !formData.tipoCadastro || !formData.tipoPessoa) {
        toast.error("Preencha todos os campos obrigatórios")
        return
      }
      
      // Validar se as senhas coincidem
      if (formData.senha !== formData.confirmarSenha) {
        toast.error("As senhas não coincidem")
        return
      }
      
      // Validar força da senha (mínimo 6 caracteres)
      if (formData.senha.length < 6) {
        toast.error("A senha deve ter no mínimo 6 caracteres")
        return
      }
    }

    if (currentStep === 2 && formData.tipoPessoa === "juridica") {
      if (!formData.cnpj || !formData.razaoSocial) {
        toast.error("Preencha todos os campos obrigatórios")
        return
      }
    }

    if (currentStep === 3 && formData.tipoPessoa === "juridica") {
      if (!formData.administrador.nome || !formData.administrador.cpf || !formData.administrador.email) {
        toast.error("Preencha todos os campos obrigatórios do administrador")
        return
      }
    }

    if (currentStep === 4 || (currentStep === 3 && formData.tipoPessoa === "fisica")) {
      if (
        !formData.dadosBancarios.banco ||
        !formData.dadosBancarios.agencia ||
        !formData.dadosBancarios.conta ||
        !formData.dadosBancarios.tipoConta ||
        !formData.dadosBancarios.titular ||
        !formData.dadosBancarios.cpfCnpjTitular
      ) {
        toast.error("Preencha todos os dados bancários")
        return
      }
    }

    setCurrentStep(currentStep + 1)
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleBuscarCNPJ = async () => {
    const cnpjLimpo = formData.cnpj.replace(/\D/g, "")
    
    if (!cnpjLimpo || cnpjLimpo.length !== 14) {
      toast.error("CNPJ inválido. Digite um CNPJ com 14 dígitos")
      return
    }

    setLoadingCNPJ(true)
    try {
      const dadosCNPJ = await buscarCNPJ(formData.cnpj)

      setFormData({
        ...formData,
        cnpj: dadosCNPJ.cnpj,
        razaoSocial: dadosCNPJ.nome,
        nomeFantasia: dadosCNPJ.fantasia,
        dataAbertura: dadosCNPJ.abertura,
        situacao: dadosCNPJ.situacao,
        endereco: {
          logradouro: dadosCNPJ.logradouro,
          numero: dadosCNPJ.numero,
          complemento: dadosCNPJ.complemento,
          bairro: dadosCNPJ.bairro,
          municipio: dadosCNPJ.municipio,
          uf: dadosCNPJ.uf,
          cep: dadosCNPJ.cep.replace(/\D/g, "").replace(/(\d{5})(\d{3})/, "$1-$2"),
        },
        telefoneEmpresa: dadosCNPJ.telefone,
        emailEmpresa: dadosCNPJ.email,
        capitalSocial: dadosCNPJ.capital_social,
      })

      toast.success("Dados da empresa preenchidos automaticamente!")
    } catch (error: any) {
      console.error("Erro ao buscar CNPJ:", error)
      toast.error(error.message || "Erro ao buscar CNPJ. Você pode preencher os dados manualmente.")
    } finally {
      setLoadingCNPJ(false)
    }
  }

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .slice(0, 18)
  }

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .slice(0, 14)
  }

  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .slice(0, 9)
  }

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4,5})(\d{4})$/, "$1-$2")
      .slice(0, 15)
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      // 1. Preparar dados para salvar nos metadados
      const role = formData.tipoCadastro === "organizador" ? "ORGANIZADOR" : "AFILIADO"
      const cpf = formData.tipoPessoa === "fisica" 
        ? formData.pessoaFisica.cpf.replace(/\D/g, "")
        : formData.administrador.cpf.replace(/\D/g, "")

      // 2. Preparar dados completos para salvar nos metadados
      // Isso garante que mesmo se a criação do perfil falhar, os dados estarão salvos
      const enderecoCompleto = formData.tipoPessoa === "juridica"
        ? `${formData.endereco.logradouro}, ${formData.endereco.numero}${formData.endereco.complemento ? ` - ${formData.endereco.complemento}` : ""}`
        : ""

      const metadataCompleto: any = {
        full_name: formData.nomeCompleto,
        phone: formData.telefone,
        role: role,
        cpf: cpf || null,
        registration_complete: true,
      }

      // Se for organizador, salvar TODOS os dados nos metadados
      if (formData.tipoCadastro === "organizador") {
        metadataCompleto.organizer_data = {
          company_name: formData.tipoPessoa === "juridica" ? formData.razaoSocial : formData.nomeCompleto,
          company_cnpj: formData.tipoPessoa === "juridica" ? formData.cnpj.replace(/\D/g, "") : "",
          company_address: enderecoCompleto,
          company_city: formData.tipoPessoa === "juridica" ? formData.endereco.municipio : "",
          company_state: formData.tipoPessoa === "juridica" ? formData.endereco.uf : "",
          company_zip_code: formData.tipoPessoa === "juridica" ? formData.endereco.cep.replace(/\D/g, "") : "",
          company_phone: formData.tipoPessoa === "juridica" 
            ? formData.telefoneEmpresa.replace(/\D/g, "") 
            : formData.telefone.replace(/\D/g, ""),
          legal_responsible: formData.tipoPessoa === "juridica" ? formData.administrador.nome : formData.nomeCompleto,
          state_registration: formData.tipoPessoa === "juridica" ? formData.inscricaoEstadual : "",
          bank_name: formData.dadosBancarios.banco,
          agency: formData.dadosBancarios.agencia,
          account_number: formData.dadosBancarios.conta,
          account_type: formData.dadosBancarios.tipoConta,
          account_holder_name: formData.dadosBancarios.titular,
          account_cpf_cnpj: formData.dadosBancarios.cpfCnpjTitular.replace(/\D/g, ""),
        }
      }

      // Criar usuário no Auth com TODOS os dados nos metadados
      // IMPORTANTE: Se a confirmação de email estiver habilitada, o usuário só será
      // criado em auth.users DEPOIS que confirmar o email. Por isso, salvamos todos
      // os dados nos metadados para usar quando o registro em users for criado.
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.senha,
        options: {
          data: metadataCompleto,
          emailRedirectTo: `${window.location.origin}/login`,
        },
      })

      if (authError) {
        if (authError.message.includes("already registered")) {
          toast.error("Este email já está cadastrado. Faça login ou recupere sua senha.")
          router.push("/login")
          return
        }
        throw authError
      }
      
      if (!authData.user) throw new Error("Erro ao criar usuário")

      // 3. Tentar criar o registro em users
      // IMPORTANTE: Se a confirmação de email estiver habilitada, o usuário só será
      // criado em auth.users DEPOIS que confirmar o email. Por isso, esta inserção
      // pode falhar com foreign key constraint. Não é problema - o registro será
      // criado automaticamente no primeiro login pelo middleware usando os dados
      // salvos nos metadados do signUp.
      const { error: userError } = await supabase.from("users").insert({
        id: authData.user.id,
        email: formData.email,
        full_name: formData.nomeCompleto,
        phone: formData.telefone.replace(/\D/g, ""),
        cpf: cpf || null,
        role: role,
      }).select().single()

      // Se der erro de foreign key, significa que o usuário ainda não confirmou o email
      // Isso é esperado e será resolvido automaticamente no primeiro login
      if (userError) {
        if (userError.message?.includes('violates foreign key constraint')) {
          console.log("Usuário ainda não confirmou email. Registro será criado automaticamente no primeiro login.")
        } else {
          console.error("Erro ao criar usuário:", userError)
          // Se não for erro de foreign key, pode ser outro problema, mas não bloqueia o fluxo
        }
      }

      // 4. Se for organizador, criar perfil de organizador
      // Nota: Se o registro em users ainda não existe (email não confirmado),
      // o perfil será criado quando o usuário confirmar o email e fizer login.
      if (formData.tipoCadastro === "organizador") {
        const enderecoCompleto = formData.tipoPessoa === "juridica"
          ? `${formData.endereco.logradouro}, ${formData.endereco.numero}${formData.endereco.complemento ? ` - ${formData.endereco.complemento}` : ""}`
          : ""

        // Usar função RPC com SECURITY DEFINER para evitar problemas de RLS
        const { error: organizerError } = await supabase.rpc('create_organizer_profile', {
          p_user_id: authData.user.id,
          p_company_name: formData.tipoPessoa === "juridica" ? formData.razaoSocial : formData.nomeCompleto,
          p_company_cnpj: formData.tipoPessoa === "juridica" ? formData.cnpj.replace(/\D/g, "") : "",
          p_company_address: enderecoCompleto,
          p_company_city: formData.tipoPessoa === "juridica" ? formData.endereco.municipio : "",
          p_company_state: formData.tipoPessoa === "juridica" ? formData.endereco.uf : "",
          p_company_zip_code: formData.tipoPessoa === "juridica" ? formData.endereco.cep.replace(/\D/g, "") : "",
          p_company_phone: formData.tipoPessoa === "juridica" 
            ? formData.telefoneEmpresa.replace(/\D/g, "") 
            : formData.telefone.replace(/\D/g, ""),
          p_legal_responsible: formData.tipoPessoa === "juridica" ? formData.administrador.nome : formData.nomeCompleto,
          p_state_registration: formData.tipoPessoa === "juridica" ? formData.inscricaoEstadual : "",
          p_bank_name: formData.dadosBancarios.banco,
          p_agency: formData.dadosBancarios.agencia,
          p_account_number: formData.dadosBancarios.conta,
          p_account_type: formData.dadosBancarios.tipoConta,
          p_account_holder_name: formData.dadosBancarios.titular,
          p_account_cpf_cnpj: formData.dadosBancarios.cpfCnpjTitular.replace(/\D/g, ""),
        })

        if (organizerError) {
          // Se o erro for foreign key, significa que o registro em users ainda não existe
          // (usuário não confirmou email). Isso será resolvido no primeiro login.
          if (organizerError.message?.includes('violates foreign key constraint') || 
              organizerError.message?.includes('row-level security policy')) {
            console.log("Perfil de organizador será criado quando o usuário confirmar o email e fizer login.")
          } else {
            console.error("Erro ao criar organizador:", organizerError)
            throw organizerError
          }
        }
      }

      // 5. Se for afiliado, criar perfil de afiliado
      // Nota: Se o registro em users ainda não existe (email não confirmado),
      // o perfil será criado quando o usuário confirmar o email e fizer login.
      if (formData.tipoCadastro === "afiliado") {
        const referralCode = `AFF-${Date.now().toString(36).toUpperCase()}`
        // Usar função RPC com SECURITY DEFINER para evitar problemas de RLS
        const { error: affiliateError } = await supabase.rpc('create_affiliate_profile', {
          p_user_id: authData.user.id,
          p_referral_code: referralCode,
        })

        if (affiliateError) {
          // Se o erro for foreign key, significa que o registro em users ainda não existe
          // (usuário não confirmou email). Isso será resolvido no primeiro login.
          if (affiliateError.message?.includes('violates foreign key constraint') || 
              affiliateError.message?.includes('row-level security policy')) {
            console.log("Perfil de afiliado será criado quando o usuário confirmar o email e fizer login.")
          } else {
            console.error("Erro ao criar afiliado:", affiliateError)
            throw affiliateError
          }
        }
      }

      toast.success("Cadastro realizado com sucesso! Verifique seu email para confirmar a conta.")
      router.push("/login")
    } catch (error: any) {
      console.error("Erro ao criar cadastro:", error)
      toast.error(error.message || "Erro ao criar cadastro. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const getTotalSteps = () => {
    if (formData.tipoPessoa === "fisica") {
      return 3
    }
    return 4
  }

  const totalSteps = getTotalSteps()
  const stepLabels = formData.tipoPessoa === "fisica" 
    ? ["Dados Básicos", "Dados Pessoais", "Dados Bancários"]
    : ["Dados Básicos", "Dados da Empresa", "Administrador", "Dados Bancários"]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto">
        {/* Header com Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                <Image
                  src="/images/logo/logo.png"
                  alt="Logo"
                  fill
                  className="object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = "none"
                  }}
                />
              </div>
            </div>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Criar sua conta</h2>
          <p className="text-gray-600">Preencha os dados abaixo para começar</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {Array.from({ length: totalSteps }).map((_, index) => {
              const step = index + 1
              const isActive = step === currentStep
              const isCompleted = step < currentStep
              
              return (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                        isCompleted
                          ? "bg-[#156634] text-white"
                          : isActive
                          ? "bg-[#156634] text-white ring-4 ring-[#156634]/20"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        step
                      )}
                    </div>
                    <p
                      className={`mt-2 text-xs font-medium text-center max-w-[100px] ${
                        isActive ? "text-[#156634]" : "text-gray-500"
                      }`}
                    >
                      {stepLabels[index]}
                    </p>
                  </div>
                  {step < totalSteps && (
                    <div
                      className={`h-1 flex-1 mx-2 -mt-6 ${
                        isCompleted ? "bg-[#156634]" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 lg:p-10">
            {/* Step 1: Dados Básicos */}
            {currentStep === 1 && (
              <div className="space-y-4 w-full">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">Dados Básicos</h3>
                  <p className="text-sm text-gray-600">Informe seus dados pessoais</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="nomeCompleto" className="text-sm font-medium">
                      Nome Completo *
                    </Label>
                    <Input
                      id="nomeCompleto"
                      value={formData.nomeCompleto}
                      onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
                      placeholder="Seu nome completo"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="seu@email.com"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-4">
                    <Label htmlFor="telefone" className="text-sm font-medium">
                      Telefone *
                    </Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => {
                        const formatted = formatPhone(e.target.value)
                        setFormData({ ...formData, telefone: formatted })
                      }}
                      placeholder="(11) 98765-4321"
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="senha" className="text-sm font-medium">
                      Senha *
                    </Label>
                    <Input
                      id="senha"
                      type="password"
                      value={formData.senha}
                      onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmarSenha" className="text-sm font-medium">
                      Confirmar Senha *
                    </Label>
                    <Input
                      id="confirmarSenha"
                      type="password"
                      value={formData.confirmarSenha}
                      onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                      placeholder="Digite a senha novamente"
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Tipo de Cadastro *</Label>
                    <RadioGroup
                      value={formData.tipoCadastro}
                      onValueChange={(value) =>
                        setFormData({ ...formData, tipoCadastro: value as "organizador" | "afiliado" })
                      }
                      className="space-y-3"
                    >
                      <div className="flex items-center space-x-3 p-3 border-2 rounded-lg hover:border-[#156634] transition-colors cursor-pointer">
                        <RadioGroupItem value="organizador" id="organizador" />
                        <Label htmlFor="organizador" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-[#156634]" />
                            <div>
                              <p className="font-medium text-gray-900 text-sm">Organizador</p>
                              <p className="text-xs text-gray-600">Crie e gerencie eventos</p>
                            </div>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 border-2 rounded-lg hover:border-[#156634] transition-colors cursor-pointer">
                        <RadioGroupItem value="afiliado" id="afiliado" />
                        <Label htmlFor="afiliado" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <UserCircle className="h-4 w-4 text-blue-600" />
                            <div>
                              <p className="font-medium text-gray-900 text-sm">Afiliado</p>
                              <p className="text-xs text-gray-600">Divulgue e ganhe comissões</p>
                            </div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Pessoa Física ou Jurídica? *</Label>
                    <RadioGroup
                      value={formData.tipoPessoa}
                      onValueChange={(value) =>
                        setFormData({ ...formData, tipoPessoa: value as "fisica" | "juridica" })
                      }
                      className="space-y-3"
                    >
                      <div className="flex items-center space-x-3 p-3 border-2 rounded-lg hover:border-[#156634] transition-colors cursor-pointer">
                        <RadioGroupItem value="fisica" id="fisica" />
                        <Label htmlFor="fisica" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-purple-600" />
                            <div>
                              <p className="font-medium text-gray-900 text-sm">Pessoa Física</p>
                              <p className="text-xs text-gray-600">CPF</p>
                            </div>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 border-2 rounded-lg hover:border-[#156634] transition-colors cursor-pointer">
                        <RadioGroupItem value="juridica" id="juridica" />
                        <Label htmlFor="juridica" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-orange-600" />
                            <div>
                              <p className="font-medium text-gray-900 text-sm">Pessoa Jurídica</p>
                              <p className="text-xs text-gray-600">CNPJ</p>
                            </div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Dados da Empresa (Jurídica) ou Dados Pessoais (Física) */}
            {currentStep === 2 && (
              <div className="space-y-4 w-full">
                {formData.tipoPessoa === "juridica" ? (
                  <>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Dados da Empresa</h3>
                      <p className="text-sm text-gray-600">Informe os dados da sua empresa</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cnpj" className="text-sm font-medium">CNPJ *</Label>
                      <Input
                        id="cnpj"
                        value={formData.cnpj}
                        onChange={(e) => {
                          const formatted = formatCNPJ(e.target.value)
                          const cnpjLimpo = formatted.replace(/\D/g, "")
                          setFormData({ ...formData, cnpj: formatted })
                          
                          // Limpa timeout anterior
                          if (cnpjSearchTimeoutRef.current) {
                            clearTimeout(cnpjSearchTimeoutRef.current)
                          }
                          
                          // Busca automática quando CNPJ estiver completo (14 dígitos)
                          if (cnpjLimpo.length === 14 && !loadingCNPJ && !formData.razaoSocial) {
                            cnpjSearchTimeoutRef.current = setTimeout(() => {
                              handleBuscarCNPJ()
                            }, 800) // Delay para evitar múltiplas chamadas enquanto digita
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            const cnpjLimpo = formData.cnpj.replace(/\D/g, "")
                            if (cnpjLimpo.length === 14 && !loadingCNPJ) {
                              if (cnpjSearchTimeoutRef.current) {
                                clearTimeout(cnpjSearchTimeoutRef.current)
                              }
                              handleBuscarCNPJ()
                            }
                          }
                        }}
                        placeholder="00.000.000/0000-00"
                        maxLength={18}
                        className="h-10"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Digite o CNPJ completo (14 dígitos) para buscar automaticamente
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="razaoSocial" className="text-sm font-medium">Razão Social *</Label>
                        <Input
                          id="razaoSocial"
                          value={formData.razaoSocial}
                          onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                          placeholder="Razão Social da Empresa"
                          className="h-10"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nomeFantasia" className="text-sm font-medium">Nome Fantasia</Label>
                        <Input
                          id="nomeFantasia"
                          value={formData.nomeFantasia}
                          onChange={(e) =>
                            setFormData({ ...formData, nomeFantasia: e.target.value })
                          }
                          placeholder="Nome Fantasia"
                          className="h-10"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="inscricaoEstadual" className="text-sm font-medium">Inscrição Estadual</Label>
                        <Input
                          id="inscricaoEstadual"
                          value={formData.inscricaoEstadual}
                          onChange={(e) =>
                            setFormData({ ...formData, inscricaoEstadual: e.target.value })
                          }
                          placeholder="IE"
                          className="h-10"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dataAbertura" className="text-sm font-medium">Data de Abertura</Label>
                        <Input
                          id="dataAbertura"
                          type="date"
                          value={formData.dataAbertura}
                          onChange={(e) => setFormData({ ...formData, dataAbertura: e.target.value })}
                          className="h-10"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="logradouro" className="text-sm font-medium">Endereço *</Label>
                        <Input
                          id="logradouro"
                          value={formData.endereco.logradouro}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              endereco: { ...formData.endereco, logradouro: e.target.value },
                            })
                          }
                          placeholder="Rua, Avenida, etc."
                          className="h-10"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-2">
                          <Label htmlFor="numero" className="text-sm font-medium">Número *</Label>
                          <Input
                            id="numero"
                            value={formData.endereco.numero}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                endereco: { ...formData.endereco, numero: e.target.value },
                              })
                            }
                            placeholder="123"
                            className="h-10"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="complemento" className="text-sm font-medium">Complemento</Label>
                          <Input
                            id="complemento"
                            value={formData.endereco.complemento}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                endereco: { ...formData.endereco, complemento: e.target.value },
                              })
                            }
                            placeholder="Apto"
                            className="h-10"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bairro" className="text-sm font-medium">Bairro *</Label>
                          <Input
                            id="bairro"
                            value={formData.endereco.bairro}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                endereco: { ...formData.endereco, bairro: e.target.value },
                              })
                            }
                            placeholder="Bairro"
                            className="h-10"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="municipio" className="text-sm font-medium">Município *</Label>
                        <Input
                          id="municipio"
                          value={formData.endereco.municipio}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              endereco: { ...formData.endereco, municipio: e.target.value },
                            })
                          }
                          placeholder="Cidade"
                          className="h-10"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="uf" className="text-sm font-medium">UF *</Label>
                        <Input
                          id="uf"
                          value={formData.endereco.uf}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              endereco: { ...formData.endereco, uf: e.target.value.toUpperCase() },
                            })
                          }
                          placeholder="SP"
                          maxLength={2}
                          className="h-10"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cep" className="text-sm font-medium">CEP *</Label>
                        <Input
                          id="cep"
                          value={formData.endereco.cep}
                          onChange={(e) => {
                            const formatted = formatCEP(e.target.value)
                            setFormData({
                              ...formData,
                              endereco: { ...formData.endereco, cep: formatted },
                            })
                          }}
                          placeholder="00000-000"
                          maxLength={9}
                          className="h-10"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="telefoneEmpresa" className="text-sm font-medium">Telefone da Empresa</Label>
                        <Input
                          id="telefoneEmpresa"
                          value={formData.telefoneEmpresa}
                          onChange={(e) => {
                            const formatted = formatPhone(e.target.value)
                            setFormData({ ...formData, telefoneEmpresa: formatted })
                          }}
                          placeholder="(11) 3456-7890"
                          className="h-10"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emailEmpresa" className="text-sm font-medium">Email da Empresa</Label>
                        <Input
                          id="emailEmpresa"
                          type="email"
                          value={formData.emailEmpresa}
                          onChange={(e) => setFormData({ ...formData, emailEmpresa: e.target.value })}
                          placeholder="empresa@email.com"
                          className="h-10"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">Dados Pessoais</h3>
                      <p className="text-sm text-gray-600">Informe seus dados pessoais</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cpf" className="text-sm font-medium">CPF *</Label>
                        <Input
                          id="cpf"
                          value={formData.pessoaFisica.cpf}
                          onChange={(e) => {
                            const formatted = formatCPF(e.target.value)
                            setFormData({
                              ...formData,
                              pessoaFisica: { ...formData.pessoaFisica, cpf: formatted },
                            })
                          }}
                          placeholder="000.000.000-00"
                          maxLength={14}
                          className="h-10"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dataNascimento" className="text-sm font-medium">Data de Nascimento *</Label>
                        <Input
                          id="dataNascimento"
                          type="date"
                          value={formData.pessoaFisica.dataNascimento}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              pessoaFisica: {
                                ...formData.pessoaFisica,
                                dataNascimento: e.target.value,
                              },
                            })
                          }
                          className="h-10"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="genero" className="text-sm font-medium">Gênero</Label>
                        <select
                          id="genero"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                          value={formData.pessoaFisica.genero}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              pessoaFisica: {
                                ...formData.pessoaFisica,
                                genero: e.target.value as any,
                              },
                            })
                          }
                        >
                          <option value="">Selecione</option>
                          <option value="Masculino">Masculino</option>
                          <option value="Feminino">Feminino</option>
                          <option value="Outro">Outro</option>
                          <option value="Prefiro não informar">Prefiro não informar</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 3: Administrador (apenas jurídica) */}
            {currentStep === 3 && formData.tipoPessoa === "juridica" && (
              <div className="space-y-4 w-full">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">Dados do Administrador</h3>
                  <p className="text-sm text-gray-600">Informe os dados do responsável legal da empresa</p>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                  <p className="text-xs text-blue-800">
                    <strong>Dados do Administrador/Responsável Legal</strong> - Informe os dados da pessoa responsável pela empresa
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminNome" className="text-sm font-medium">Nome Completo *</Label>
                    <Input
                      id="adminNome"
                      value={formData.administrador.nome}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          administrador: { ...formData.administrador, nome: e.target.value },
                        })
                      }
                      placeholder="Nome do administrador"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminCargo" className="text-sm font-medium">Cargo</Label>
                    <Input
                      id="adminCargo"
                      value={formData.administrador.cargo}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          administrador: { ...formData.administrador, cargo: e.target.value },
                        })
                      }
                      placeholder="Ex: Diretor, Gerente, etc."
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminCPF" className="text-sm font-medium">CPF *</Label>
                    <Input
                      id="adminCPF"
                      value={formData.administrador.cpf}
                      onChange={(e) => {
                        const formatted = formatCPF(e.target.value)
                        setFormData({
                          ...formData,
                          administrador: { ...formData.administrador, cpf: formatted },
                        })
                      }}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminEmail" className="text-sm font-medium">Email *</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={formData.administrador.email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          administrador: { ...formData.administrador, email: e.target.value },
                        })
                      }
                      placeholder="admin@email.com"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminTelefone" className="text-sm font-medium">Telefone</Label>
                    <Input
                      id="adminTelefone"
                      value={formData.administrador.telefone}
                      onChange={(e) => {
                        const formatted = formatPhone(e.target.value)
                        setFormData({
                          ...formData,
                          administrador: { ...formData.administrador, telefone: formatted },
                        })
                      }}
                      placeholder="(11) 98765-4321"
                      className="h-10"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step Final: Dados Bancários */}
            {(currentStep === 4 || (currentStep === 3 && formData.tipoPessoa === "fisica")) && (
              <div className="space-y-4 w-full">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">Dados Bancários</h3>
                  <p className="text-sm text-gray-600">Informações necessárias para recebimento de pagamentos</p>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                  <p className="text-xs text-amber-800">
                    <strong>Dados Bancários</strong> - Informações necessárias para recebimento de pagamentos
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="banco" className="text-sm font-medium">Banco *</Label>
                    <select
                      id="banco"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      value={formData.dadosBancarios.banco}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dadosBancarios: { ...formData.dadosBancarios, banco: e.target.value },
                        })
                      }
                    >
                      <option value="">Selecione o banco</option>
                      <option value="001 - Banco do Brasil">001 - Banco do Brasil</option>
                      <option value="033 - Banco Santander">033 - Banco Santander</option>
                      <option value="104 - Caixa Econômica Federal">104 - Caixa Econômica Federal</option>
                      <option value="237 - Banco Bradesco">237 - Banco Bradesco</option>
                      <option value="341 - Banco Itaú">341 - Banco Itaú</option>
                      <option value="356 - Banco Real">356 - Banco Real</option>
                      <option value="422 - Banco Safra">422 - Banco Safra</option>
                      <option value="748 - Banco Cooperativo Sicredi">748 - Banco Cooperativo Sicredi</option>
                      <option value="756 - Banco Inter">756 - Banco Inter</option>
                      <option value="260 - Nu Pagamentos (Nubank)">260 - Nu Pagamentos (Nubank)</option>
                      <option value="290 - PagBank">290 - PagBank</option>
                      <option value="323 - Mercado Pago">323 - Mercado Pago</option>
                      <option value="212 - Banco Original">212 - Banco Original</option>
                      <option value="655 - Banco Votorantim">655 - Banco Votorantim</option>
                      <option value="070 - Banco de Brasília">070 - Banco de Brasília</option>
                      <option value="208 - Banco BTG Pactual">208 - Banco BTG Pactual</option>
                      <option value="336 - Banco C6">336 - Banco C6</option>
                      <option value="197 - Stone Pagamentos">197 - Stone Pagamentos</option>
                      <option value="077 - Banco Inter">077 - Banco Inter</option>
                      <option value="085 - Cooperativa Central de Crédito">085 - Cooperativa Central de Crédito</option>
                      <option value="089 - Banco Rural">089 - Banco Rural</option>
                      <option value="104 - Caixa Econômica Federal">104 - Caixa Econômica Federal</option>
                      <option value="107 - Banco BBM">107 - Banco BBM</option>
                      <option value="116 - Banco Único">116 - Banco Único</option>
                      <option value="151 - Banco Nossa Caixa">151 - Banco Nossa Caixa</option>
                      <option value="184 - Banco Itaú BBA">184 - Banco Itaú BBA</option>
                      <option value="204 - Banco Bradesco Cartões">204 - Banco Bradesco Cartões</option>
                      <option value="208 - Banco BTG Pactual">208 - Banco BTG Pactual</option>
                      <option value="212 - Banco Original">212 - Banco Original</option>
                      <option value="213 - Banco Arbi">213 - Banco Arbi</option>
                      <option value="214 - Banco Dibens">214 - Banco Dibens</option>
                      <option value="217 - Banco John Deere">217 - Banco John Deere</option>
                      <option value="218 - Banco BS2">218 - Banco BS2</option>
                      <option value="222 - Banco Credit Agricole Brasil">222 - Banco Credit Agricole Brasil</option>
                      <option value="224 - Banco Fibra">224 - Banco Fibra</option>
                      <option value="233 - Banco Cifra">233 - Banco Cifra</option>
                      <option value="237 - Banco Bradesco">237 - Banco Bradesco</option>
                      <option value="241 - Banco Classico">241 - Banco Classico</option>
                      <option value="243 - Banco Máxima">243 - Banco Máxima</option>
                      <option value="246 - Banco ABC Brasil">246 - Banco ABC Brasil</option>
                      <option value="249 - Banco Investcred Unibanco">249 - Banco Investcred Unibanco</option>
                      <option value="250 - Banco Schahin">250 - Banco Schahin</option>
                      <option value="254 - Banco Paraná">254 - Banco Paraná</option>
                      <option value="260 - Nu Pagamentos">260 - Nu Pagamentos</option>
                      <option value="265 - Banco Fator">265 - Banco Fator</option>
                      <option value="266 - Banco Cédula">266 - Banco Cédula</option>
                      <option value="290 - PagBank">290 - PagBank</option>
                      <option value="318 - Banco BMG">318 - Banco BMG</option>
                      <option value="320 - Banco Industrial e Comercial">320 - Banco Industrial e Comercial</option>
                      <option value="336 - Banco C6">336 - Banco C6</option>
                      <option value="341 - Itaú Unibanco">341 - Itaú Unibanco</option>
                      <option value="356 - Banco Real">356 - Banco Real</option>
                      <option value="366 - Banco Société Générale Brasil">366 - Banco Société Générale Brasil</option>
                      <option value="370 - Banco Mizuho">370 - Banco Mizuho</option>
                      <option value="376 - Banco J.P. Morgan">376 - Banco J.P. Morgan</option>
                      <option value="389 - Banco Mercantil do Brasil">389 - Banco Mercantil do Brasil</option>
                      <option value="394 - Banco Bradesco Financiamentos">394 - Banco Bradesco Financiamentos</option>
                      <option value="399 - HSBC Bank Brasil">399 - HSBC Bank Brasil</option>
                      <option value="422 - Banco Safra">422 - Banco Safra</option>
                      <option value="456 - Banco de Tokyo-Mitsubishi UFJ Brasil">456 - Banco de Tokyo-Mitsubishi UFJ Brasil</option>
                      <option value="464 - Banco Sumitomo Mitsui Brasileiro">464 - Banco Sumitomo Mitsui Brasileiro</option>
                      <option value="477 - Citibank">477 - Citibank</option>
                      <option value="479 - Banco ItauBank">479 - Banco ItauBank</option>
                      <option value="487 - Deutsche Bank">487 - Deutsche Bank</option>
                      <option value="488 - Banco JPMorgan">488 - Banco JPMorgan</option>
                      <option value="492 - Banco Inbursa">492 - Banco Inbursa</option>
                      <option value="494 - Banco da República">494 - Banco da República</option>
                      <option value="495 - Banco La Provincia">495 - Banco La Provincia</option>
                      <option value="505 - Banco Credit Suisse">505 - Banco Credit Suisse</option>
                      <option value="600 - Banco Luso Brasileiro">600 - Banco Luso Brasileiro</option>
                      <option value="604 - Banco Industrial do Brasil">604 - Banco Industrial do Brasil</option>
                      <option value="610 - Banco VR">610 - Banco VR</option>
                      <option value="611 - Banco Paulista">611 - Banco Paulista</option>
                      <option value="612 - Banco Guanabara">612 - Banco Guanabara</option>
                      <option value="613 - Banco Pecúnia">613 - Banco Pecúnia</option>
                      <option value="623 - Banco Pan">623 - Banco Pan</option>
                      <option value="626 - Banco Ficsa">626 - Banco Ficsa</option>
                      <option value="630 - Banco Intercap">630 - Banco Intercap</option>
                      <option value="633 - Banco Rendimento">633 - Banco Rendimento</option>
                      <option value="634 - Banco Triângulo">634 - Banco Triângulo</option>
                      <option value="637 - Banco Sofisa">637 - Banco Sofisa</option>
                      <option value="641 - Banco Alvorada">641 - Banco Alvorada</option>
                      <option value="643 - Banco Pine">643 - Banco Pine</option>
                      <option value="652 - Banco Itaú Holding Financeira">652 - Banco Itaú Holding Financeira</option>
                      <option value="653 - Banco Indusval">653 - Banco Indusval</option>
                      <option value="654 - Banco A.J. Renner">654 - Banco A.J. Renner</option>
                      <option value="655 - Banco Votorantim">655 - Banco Votorantim</option>
                      <option value="707 - Banco Daycoval">707 - Banco Daycoval</option>
                      <option value="712 - Banco Ourinvest">712 - Banco Ourinvest</option>
                      <option value="719 - Banco Banif">719 - Banco Banif</option>
                      <option value="721 - Banco Credibel">721 - Banco Credibel</option>
                      <option value="724 - Banco Porto Seguro">724 - Banco Porto Seguro</option>
                      <option value="734 - Banco Gerdau">734 - Banco Gerdau</option>
                      <option value="735 - Banco Neon">735 - Banco Neon</option>
                      <option value="738 - Banco Morada">738 - Banco Morada</option>
                      <option value="739 - Banco Cetelem">739 - Banco Cetelem</option>
                      <option value="740 - Banco Barclays">740 - Banco Barclays</option>
                      <option value="741 - Banco Ribeirão Preto">741 - Banco Ribeirão Preto</option>
                      <option value="743 - Banco Semear">743 - Banco Semear</option>
                      <option value="744 - Banco Citibank">744 - Banco Citibank</option>
                      <option value="745 - Banco Citibank">745 - Banco Citibank</option>
                      <option value="746 - Banco Modal">746 - Banco Modal</option>
                      <option value="747 - Banco Rabobank International">747 - Banco Rabobank International</option>
                      <option value="748 - Banco Cooperativo Sicredi">748 - Banco Cooperativo Sicredi</option>
                      <option value="751 - Banco Scotiabank">751 - Banco Scotiabank</option>
                      <option value="752 - Banco BNP Paribas Brasil">752 - Banco BNP Paribas Brasil</option>
                      <option value="753 - Banco Comercial Uruguai">753 - Banco Comercial Uruguai</option>
                      <option value="754 - Banco Sistema">754 - Banco Sistema</option>
                      <option value="755 - Banco Merrill Lynch">755 - Banco Merrill Lynch</option>
                      <option value="756 - Banco Cooperativo do Brasil">756 - Banco Cooperativo do Brasil</option>
                      <option value="757 - Banco KEB Hana do Brasil">757 - Banco KEB Hana do Brasil</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="agencia" className="text-sm font-medium">Agência *</Label>
                    <Input
                      id="agencia"
                      value={formData.dadosBancarios.agencia}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dadosBancarios: { ...formData.dadosBancarios, agencia: e.target.value },
                        })
                      }
                      placeholder="0000"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="conta" className="text-sm font-medium">Conta *</Label>
                    <Input
                      id="conta"
                      value={formData.dadosBancarios.conta}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dadosBancarios: { ...formData.dadosBancarios, conta: e.target.value },
                        })
                      }
                      placeholder="00000-0"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tipo de Conta *</Label>
                    <RadioGroup
                      value={formData.dadosBancarios.tipoConta}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          dadosBancarios: {
                            ...formData.dadosBancarios,
                            tipoConta: value as "corrente" | "poupanca",
                          },
                        })
                      }
                      className="flex gap-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="corrente" id="corrente" />
                        <Label htmlFor="corrente" className="cursor-pointer text-sm">Corrente</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="poupanca" id="poupanca" />
                        <Label htmlFor="poupanca" className="cursor-pointer text-sm">Poupança</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="titular" className="text-sm font-medium">Titular da Conta *</Label>
                    <Input
                      id="titular"
                      value={formData.dadosBancarios.titular}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dadosBancarios: { ...formData.dadosBancarios, titular: e.target.value },
                        })
                      }
                      placeholder="Nome do titular"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpfCnpjTitular" className="text-sm font-medium">
                      {formData.tipoPessoa === "juridica" ? "CPF/CNPJ do Titular *" : "CPF do Titular *"}
                    </Label>
                    <Input
                      id="cpfCnpjTitular"
                      value={formData.dadosBancarios.cpfCnpjTitular}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "")
                        const formatted =
                          formData.tipoPessoa === "juridica"
                            ? formatCNPJ(value)
                            : formatCPF(value)
                        setFormData({
                          ...formData,
                          dadosBancarios: {
                            ...formData.dadosBancarios,
                            cpfCnpjTitular: formatted,
                          },
                        })
                      }}
                      placeholder={
                        formData.tipoPessoa === "juridica"
                          ? "00.000.000/0000-00"
                          : "000.000.000-00"
                      }
                      maxLength={formData.tipoPessoa === "juridica" ? 18 : 14}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>
            )}

          {/* Botões de Navegação */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentStep === 1 || loading}
              className="text-gray-600"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            {currentStep < totalSteps ? (
              <Button 
                onClick={handleNext} 
                disabled={loading} 
                className="bg-[#156634] hover:bg-[#125529] h-11 px-6"
              >
                Continuar
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={loading} 
                className="bg-[#156634] hover:bg-[#125529] h-11 px-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Criar Conta
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Link para Login */}
          <div className="text-center mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{" "}
              <Link href="/login" className="text-[#156634] font-semibold hover:underline">
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
