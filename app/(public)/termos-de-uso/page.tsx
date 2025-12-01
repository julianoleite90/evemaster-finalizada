"use client"

import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

export default function TermosDeUsoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Termos de Uso
            </h1>
            
            <div className="prose prose-sm max-w-none text-gray-600">
              <p className="text-sm text-muted-foreground mb-6">
                Última atualização: {new Date().toLocaleDateString("pt-BR")}
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                1. Aceitação dos Termos
              </h2>
              <p>
                Ao acessar e usar a plataforma Evemaster, você concorda com estes Termos de Uso. 
                Se você não concordar com qualquer parte destes termos, não use nossos serviços.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                2. Descrição do Serviço
              </h2>
              <p>
                A Evemaster é uma plataforma de gestão de eventos esportivos que conecta organizadores 
                e participantes, facilitando inscrições, pagamentos e comunicação.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                3. Cadastro e Conta
              </h2>
              <p>
                Você é responsável por manter a confidencialidade de sua conta e senha. 
                Todas as atividades realizadas em sua conta são de sua responsabilidade.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                4. Inscrições e Pagamentos
              </h2>
              <p>
                Ao se inscrever em um evento, você concorda em pagar os valores indicados. 
                Políticas de cancelamento e reembolso são definidas por cada organizador.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                5. Responsabilidades do Usuário
              </h2>
              <p>
                Você concorda em fornecer informações verdadeiras, não violar direitos de terceiros 
                e não usar a plataforma para fins ilegais.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                6. Limitação de Responsabilidade
              </h2>
              <p>
                A Evemaster não é responsável pelos eventos em si, apenas pela plataforma de gestão. 
                Organizadores são responsáveis pela realização e qualidade de seus eventos.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                7. Modificações
              </h2>
              <p>
                Reservamo-nos o direito de modificar estes termos a qualquer momento. 
                Alterações serão comunicadas através da plataforma.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                8. Contato
              </h2>
              <p>
                Para dúvidas sobre estes termos, entre em contato pelo e-mail: 
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





