"use client"

import Script from "next/script"

export interface FAQ {
  question: string
  answer: string
}

interface FAQSchemaProps {
  faqs: FAQ[]
  pageUrl: string
}

export function FAQSchema({ faqs, pageUrl }: FAQSchemaProps) {
  if (!faqs || faqs.length === 0) {
    return null
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
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

export function getDefaultEventFAQs(
  eventName: string,
  eventDate: string,
  location: string
): FAQ[] {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  return [
    {
      question: `Quando acontece o evento ${eventName}?`,
      answer: `O evento ${eventName} acontece no dia ${formatDate(eventDate)}${location ? ` em ${location}` : ''}.`
    },
    {
      question: `Onde será realizado o evento ${eventName}?`,
      answer: location 
        ? `O evento ${eventName} será realizado em ${location}.`
        : `O evento ${eventName} será realizado conforme informações disponíveis na página do evento.`
    },
    {
      question: `Como me inscrever no evento ${eventName}?`,
      answer: `Você pode se inscrever no evento ${eventName} diretamente nesta página. Basta escolher a categoria desejada e seguir o processo de inscrição.`
    },
    {
      question: `Quais são as categorias disponíveis para o evento ${eventName}?`,
      answer: `As categorias disponíveis para o evento ${eventName} estão listadas na página de inscrição. Cada categoria possui características específicas e valores diferentes.`
    },
    {
      question: `O evento ${eventName} oferece kit do participante?`,
      answer: `As informações sobre o kit do participante do evento ${eventName} estão disponíveis na página de inscrição. Verifique os detalhes de cada categoria para mais informações.`
    },
    {
      question: `Como funciona o pagamento para o evento ${eventName}?`,
      answer: `O pagamento para o evento ${eventName} pode ser realizado através de PIX, cartão de crédito ou boleto bancário, conforme as opções disponíveis no processo de inscrição.`
    }
  ]
}

