"use client"

import Script from "next/script"

interface FAQ {
  question: string
  answer: string
}

interface FAQSchemaProps {
  faqs: FAQ[]
  pageUrl?: string
}

/**
 * Componente para gerar schema JSON-LD de FAQ
 * Melhora SEO ao exibir perguntas e respostas nos resultados de busca
 */
export function FAQSchema({ faqs, pageUrl }: FAQSchemaProps) {
  if (!faqs || faqs.length === 0) return null

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    })),
    ...(pageUrl && { "url": pageUrl })
  }

  return (
    <Script
      id="faq-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(faqSchema)
      }}
    />
  )
}

// FAQs padrão para eventos esportivos (automático)
export function getDefaultEventFAQs(eventName: string, eventDate: string, location: string): FAQ[] {
  const formattedDate = new Date(eventDate).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  
  return [
    {
      question: `Como me inscrever no ${eventName}?`,
      answer: `Para se inscrever no ${eventName}, basta acessar esta página e clicar no botão de inscrição. Selecione a categoria desejada, preencha seus dados e finalize o pagamento. Você receberá a confirmação por e-mail.`
    },
    {
      question: `Quando acontece o ${eventName}?`,
      answer: `O ${eventName} acontecerá no dia ${formattedDate}${location ? `, em ${location}` : ''}.`
    },
    {
      question: `Posso transferir minha inscrição para outra pessoa?`,
      answer: `A política de transferência varia de acordo com o organizador do evento. Consulte o regulamento do evento ou entre em contato diretamente com a organização para verificar as condições de transferência.`
    },
    {
      question: `Qual é a política de reembolso?`,
      answer: `A política de reembolso é definida pelo organizador do evento e está descrita no regulamento. Em geral, eventos esportivos possuem regras específicas para cancelamento que devem ser consultadas antes da inscrição.`
    },
    {
      question: `Onde retiro meu kit?`,
      answer: `As informações sobre local e data de retirada do kit serão enviadas por e-mail aos inscritos. Geralmente a retirada ocorre nos dias que antecedem o evento ou no dia da prova, conforme orientações do organizador.`
    },
    {
      question: `O evento é seguro?`,
      answer: `Todos os eventos cadastrados na plataforma EveMaster passam por verificação. Além disso, trabalhamos apenas com organizadores comprometidos com a segurança dos participantes, seguindo todas as normas e regulamentações vigentes.`
    }
  ]
}

