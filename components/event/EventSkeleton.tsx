"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Skeleton de carregamento para a página de evento
 * Exibe uma versão "placeholder" enquanto os dados são carregados
 */
export function EventSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner Skeleton */}
      <div className="relative w-full aspect-[21/11] md:aspect-[21/6] bg-gray-200 animate-pulse" />

      {/* Conteúdo Principal */}
      <div className="container mx-auto px-4 -mt-9 md:-mt-16 pb-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Esquerda */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card Principal */}
            <Card>
              <CardContent className="p-6 md:p-8">
                {/* Título */}
                <div className="mb-6">
                  <Skeleton className="h-10 w-3/4 mb-3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>

                {/* Informações Principais */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg md:col-span-2">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                </div>

                {/* Separator */}
                <Skeleton className="h-px w-full my-8" />

                {/* Descrição */}
                <div className="space-y-4">
                  <Skeleton className="h-8 w-48 mb-6" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </CardContent>
            </Card>

            {/* Card Local */}
            <Card>
              <CardContent className="p-4 md:p-8">
                <Skeleton className="h-6 w-40 mb-4" />
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-[200px] w-full rounded-lg" />
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita - Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              {/* Card Ingressos */}
              <Card className="border-2 border-gray-200">
                <CardContent className="p-6">
                  <Skeleton className="h-8 w-32 mb-4" />
                  
                  {/* Lote Info */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>

                  {/* Lista de Ingressos */}
                  <div className="space-y-3 mb-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="border-2 rounded-lg p-4">
                        <div className="flex justify-between mb-2">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-5 w-16" />
                        </div>
                        <Skeleton className="h-3 w-full mb-3" />
                        <div className="flex justify-between items-center">
                          <Skeleton className="h-3 w-16" />
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-7 w-7 rounded" />
                            <Skeleton className="h-5 w-6" />
                            <Skeleton className="h-7 w-7 rounded" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Botão */}
                  <Skeleton className="h-14 w-full rounded-lg" />
                </CardContent>
              </Card>

              {/* Card Organizador */}
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-28 mb-4" />
                  
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex-1">
                          <Skeleton className="h-3 w-16 mb-1" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventSkeleton

