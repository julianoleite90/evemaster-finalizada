"use client"

import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

export default function PoliticaPrivacidadePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Política de Privacidade
            </h1>
            
            <div className="prose prose-sm max-w-none text-gray-600">
              <p className="text-sm text-muted-foreground mb-6">
                Última atualização: {new Date().toLocaleDateString("pt-BR")}
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                1. Informações que Coletamos
              </h2>
              <p>
                A Evemaster coleta informações que você nos fornece diretamente, como nome, e-mail, 
                telefone, CPF e dados de pagamento quando você se inscreve em eventos ou cria uma conta.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                2. Como Usamos suas Informações
              </h2>
              <p>
                Utilizamos suas informações para processar inscrições em eventos, enviar confirmações 
                e atualizações, melhorar nossos serviços e cumprir obrigações legais.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                3. Compartilhamento de Informações
              </h2>
              <p>
                Compartilhamos suas informações apenas com os organizadores dos eventos em que você 
                se inscreve e com prestadores de serviços necessários para o funcionamento da plataforma.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                4. Segurança dos Dados
              </h2>
              <p>
                Implementamos medidas de segurança técnicas e organizacionais para proteger suas 
                informações contra acesso não autorizado, alteração, divulgação ou destruição.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                5. Seus Direitos
              </h2>
              <p>
                Você tem o direito de acessar, corrigir ou excluir suas informações pessoais. 
                Entre em contato conosco para exercer esses direitos.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                6. Contato
              </h2>
              <p>
                Para dúvidas sobre esta política, entre em contato pelo e-mail: 
                <a href="mailto:contato@evemaster.com.br" className="text-[#156634] hover:underline ml-1">
                  contato@evemaster.com.br
                </a>
              </p>
            </div>

            <div className="mt-8 pt-6 border-t">
              <Link 
                href="/" 
                className="text-[#156634] hover:underline text-sm"
              >
                ← Voltar para a página inicial
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}




