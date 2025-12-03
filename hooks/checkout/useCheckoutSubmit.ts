"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { ParticipantFormData } from "@/lib/schemas/checkout"
import { IngressoSelecionado, RunningClubData, ResumoFinanceiro } from "./types"

// Função para detectar informações do dispositivo
const detectDeviceInfo = () => {
  if (typeof window === 'undefined') {
    return { deviceType: null, browser: null, os: null, userAgent: null }
  }

  const userAgent = navigator.userAgent
  let deviceType: string | null = null
  let browser: string | null = null
  let os: string | null = null

  if (/mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
    deviceType = 'mobile'
  } else if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    deviceType = 'tablet'
  } else {
    deviceType = 'desktop'
  }

  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browser = 'Chrome'
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox'
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari'
  } else if (userAgent.includes('Edg')) {
    browser = 'Edge'
  } else {
    browser = 'Other'
  }

  if (userAgent.includes('Windows')) os = 'Windows'
  else if (userAgent.includes('Mac OS')) os = 'macOS'
  else if (userAgent.includes('Linux')) os = 'Linux'
  else if (userAgent.includes('Android')) os = 'Android'
  else if (userAgent.includes('iOS') || userAgent.includes('iPhone')) os = 'iOS'
  else os = 'Other'

  return { deviceType, browser, os, userAgent }
}

export function useCheckoutSubmit() {
  const router = useRouter()

  const handleSubmit = useCallback(async (
    eventId: string,
    eventData: any,
    participantes: ParticipantFormData[],
    ingressosSelecionados: IngressoSelecionado[],
    paisEvento: string,
    isGratuito: boolean,
    meioPagamento: string,
    runningClub: RunningClubData | null,
    calcularTotal: () => ResumoFinanceiro,
    setSubmitting: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setSubmitting(true)
    
    try {
      const supabase = createClient()

      // Buscar IP do cliente
      let clientIP: string | null = null
      try {
        const ipResponse = await fetch('/api/get-client-info')
        if (ipResponse.ok) {
          const ipData = await ipResponse.json()
          clientIP = ipData.ip || null
        }
      } catch (error) {}

      // Criar contas automaticamente
      const userIdsMap = new Map<string, string>()
      
      for (const p of participantes) {
        try {
          const createAccountResponse = await fetch('/api/auth/criar-conta-automatica', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: p.email,
              nome: p.nome,
              telefone: p.telefone,
              cpf: p.cpf,
              endereco: p.endereco,
              numero: p.numero,
              complemento: p.complemento,
              bairro: p.bairro,
              cidade: p.cidade,
              estado: p.estado,
              cep: p.cep,
              pais: p.paisResidencia || paisEvento || 'brasil',
              idade: p.idade ? parseInt(p.idade) : null,
              genero: p.genero === 'Masculino' ? 'male' : p.genero === 'Feminino' ? 'female' : null,
              emergency_contact_name: p.contatoEmergenciaNome || null,
              emergency_contact_phone: p.contatoEmergenciaTelefone?.replace(/\D/g, '') || null,
            }),
          })

          if (createAccountResponse.ok) {
            const accountResult = await createAccountResponse.json()
            if (accountResult.userId) {
              userIdsMap.set(p.email, accountResult.userId)
            }
          }
        } catch (accountError) {
          console.error('Erro ao criar conta:', accountError)
        }
      }

      const registrationNumbers: string[] = []

      // Criar registro para cada participante
      for (let i = 0; i < participantes.length; i++) {
        const p = participantes[i]
        const ingresso = ingressosSelecionados[i]
        const userId = userIdsMap.get(p.email) || null

        const registrationNumber = `EVE-${Date.now().toString(36).toUpperCase()}-${i + 1}`

        // Verificar disponibilidade do ticket
        const { data: ticketData, error: ticketFetchError } = await supabase
          .from("tickets")
          .select("quantity")
          .eq("id", ingresso.id)
          .single()

        if (ticketFetchError) {
          toast.error("Erro ao validar ticket")
          throw ticketFetchError
        }

        const isUnlimited = !ticketData || ticketData.quantity === null || ticketData.quantity === undefined || ticketData.quantity === 0
        
        if (!isUnlimited && ticketData.quantity <= 0) {
          toast.error("Ingresso esgotado")
          throw new Error("Ticket esgotado")
        }

        const deviceInfo = detectDeviceInfo()
        const now = new Date()

        // Buscar ou criar athlete_id
        let athleteId = null
        const { data: existingUserByEmail } = await supabase
          .from('users')
          .select('id')
          .eq('email', p.email)
          .maybeSingle()
        
        if (existingUserByEmail) {
          athleteId = existingUserByEmail.id
        } else if (userId) {
          const { data: existingUserById } = await supabase
            .from('users')
            .select('id')
            .eq('id', userId)
            .maybeSingle()
          
          if (existingUserById) {
            athleteId = existingUserById.id
          } else {
            const { data: newUser, error: userError } = await supabase
              .from('users')
              .insert({
                id: userId,
                email: p.email,
                full_name: p.nome,
                role: 'ATLETA',
              })
              .select('id')
              .single()
            
            if (newUser && !userError) {
              athleteId = newUser.id
            }
          }
        } else {
          const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert({
              email: p.email,
              full_name: p.nome,
              role: 'ATLETA',
            })
            .select('id')
            .single()
          
          if (newUser && !userError) {
            athleteId = newUser.id
          }
        }

        if (!athleteId) {
          toast.error("Erro ao vincular usuário")
          throw new Error("Erro ao criar usuário")
        }

        // Criar inscrição
        const insertData: any = {
          event_id: eventId,
          ticket_id: ingresso.id,
          registration_number: registrationNumber,
          registration_date: now.toISOString().split('T')[0],
          registration_time: now.toTimeString().split(' ')[0],
          status: isGratuito ? "confirmed" : "pending",
          shirt_size: p.tamanhoCamiseta || null,
          liability_waiver_accepted: p.aceiteTermo || false,
          liability_waiver_timestamp: p.aceiteTermo ? now.toISOString() : null,
          liability_waiver_ip: p.aceiteTermo ? clientIP : null,
          liability_waiver_user_agent: p.aceiteTermo ? deviceInfo.userAgent : null,
          liability_waiver_device_type: p.aceiteTermo ? deviceInfo.deviceType : null,
          liability_waiver_browser: p.aceiteTermo ? deviceInfo.browser : null,
          liability_waiver_os: p.aceiteTermo ? deviceInfo.os : null,
          athlete_id: athleteId,
          buyer_id: athleteId,
        }
        
        if (userId) {
          insertData.user_id = userId
        }

        const { data: registration, error: regError } = await supabase
          .from("registrations")
          .insert(insertData)
          .select("id, registration_number")
          .single()

        if (regError) {
          toast.error(`Erro ao criar inscrição: ${regError.message}`)
          throw regError
        }

        if (registration?.registration_number) {
          registrationNumbers.push(registration.registration_number)
        }

        // Criar atleta
        const paisParticipante = p.paisResidencia || paisEvento || 'brasil'
        const athleteData = {
          registration_id: registration.id,
          full_name: p.nome,
          email: p.email,
          phone: p.telefone,
          cpf: p.cpf?.replace(/\D/g, "") || null,
          gender: p.genero || null,
          birth_date: null,
          age: p.idade ? parseInt(p.idade) : null,
          country: paisParticipante,
          address: p.endereco || null,
          address_number: p.numero || null,
          address_complement: p.complemento || null,
          neighborhood: p.bairro || null,
          city: p.cidade || null,
          state: p.estado || null,
          zip_code: p.cep?.replace(/\D/g, "") || null,
          emergency_contact_name: p.contatoEmergenciaNome || null,
          emergency_contact_phone: p.contatoEmergenciaTelefone?.replace(/\D/g, "") || null,
        }

        await supabase.from("athletes").insert(athleteData)

        // Criar pagamento se necessário
        if (!isGratuito) {
          let valorIngresso = ingresso.valor
          let descontoAplicado = 0
          
          if (runningClub && runningClub.base_discount > 0) {
            const descontoBase = (valorIngresso * runningClub.base_discount) / 100
            descontoAplicado += descontoBase
            
            if (runningClub.progressive_discount_threshold && 
                runningClub.progressive_discount_value &&
                ingressosSelecionados.length >= runningClub.progressive_discount_threshold) {
              descontoAplicado += (valorIngresso * runningClub.progressive_discount_value) / 100
            }
            
            valorIngresso = Math.max(0, valorIngresso - descontoAplicado)
          }
          
          const taxa = 5
          const valorTotal = valorIngresso + taxa
          
          await supabase.from("payments").insert({
            registration_id: registration.id,
            amount: valorTotal,
            discount_amount: descontoAplicado > 0 ? descontoAplicado.toString() : null,
            payment_method: meioPagamento || "pix",
            payment_status: "pending",
            running_club_id: runningClub?.id || null,
          })
        }

        // Decrementar quantidade do ticket
        if (ticketData?.quantity) {
          await supabase
            .from("tickets")
            .update({ quantity: Math.max(0, ticketData.quantity - 1) })
            .eq("id", ingresso.id)
        }

        // Atualizar clube de corrida
        if (runningClub) {
          await supabase
            .from("running_clubs")
            .update({ 
              tickets_used: (runningClub.tickets_used || 0) + 1,
              updated_at: new Date().toISOString()
            })
            .eq("id", runningClub.id)
        }
      }

      toast.success("Inscrição realizada com sucesso!")
      localStorage.setItem(`event_updated_${eventId}`, 'true')

      // Enviar emails
      const resumoFinanceiro = calcularTotal()
      const dataEvento = eventData.event_date
        ? (() => {
            const [year, month, day] = eventData.event_date.split('-').map(Number)
            const date = new Date(year, month - 1, day)
            return date.toLocaleDateString('pt-BR')
          })()
        : ''

      try {
        await fetch('/api/email/confirmacao-inscricao', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inscricoes: participantes.map((p, i) => ({
              email: p.email,
              nome: p.nome,
              categoria: ingressosSelecionados[i].categoria,
              valor: ingressosSelecionados[i].valor,
              gratuito: ingressosSelecionados[i].gratuito,
              codigoInscricao: registrationNumbers[i],
            })),
            evento: {
              nome: eventData.name,
              data: dataEvento,
              hora: eventData.start_time?.substring(0, 5) || '',
              local: eventData.location || eventData.address || '',
            },
            resumoFinanceiro: {
              subtotal: resumoFinanceiro.subtotal,
              taxa: resumoFinanceiro.taxa,
              total: resumoFinanceiro.total,
            },
          }),
        })
      } catch (emailError) {
        console.error('Erro ao enviar emails:', emailError)
      }
      
      // Redirecionar
      const { subtotal, taxa, total } = resumoFinanceiro
      const resumoParam = encodeURIComponent(JSON.stringify({
        evento: eventData.name,
        eventoData: dataEvento,
        eventoLocal: eventData.location || eventData.address || '',
        ingressos: ingressosSelecionados.map((ing, i) => ({
          categoria: ing.categoria,
          participante: participantes[i].nome,
          valor: ing.valor,
        })),
        subtotal,
        taxa,
        total,
        gratuito: isGratuito,
      }))
      
      router.push(`/inscricao/${eventId}/obrigado?resumo=${resumoParam}`)
      
    } catch (error: any) {
      console.error("Erro ao finalizar inscrição:", error)
      
      try {
        await fetch('/api/log-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            errorMessage: error?.message || 'Erro ao finalizar inscrição',
            errorStack: error?.stack,
            errorType: 'registration',
            eventId,
            page: 'checkout-submit',
          }),
        })
      } catch (logError) {}
      
    } finally {
      setSubmitting(false)
    }
  }, [router])

  return { handleSubmit }
}

