"use client"

/**
 * Skeleton da landing page do evento
 * Exibe uma versão "fantasma" enquanto os dados carregam
 * Isso faz a página parecer carregar instantaneamente
 */
export function EventSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      {/* Banner Skeleton */}
      <div className="relative w-full aspect-[21/11] md:aspect-[21/6] bg-gray-200" />

      {/* Conteúdo Principal */}
      <div className="container mx-auto px-4 -mt-9 md:-mt-16 pb-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Esquerda */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card Principal */}
            <div className="bg-white rounded-xl shadow-sm border p-6 md:p-8">
              {/* Título */}
              <div className="mb-6">
                <div className="h-10 bg-gray-200 rounded-lg w-3/4 mb-3" />
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 rounded-full w-20" />
                  <div className="h-6 bg-gray-200 rounded-full w-24" />
                  <div className="h-6 bg-gray-200 rounded-full w-16" />
                </div>
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6">
                <div className="h-20 bg-gray-100 rounded-lg" />
                <div className="h-20 bg-gray-100 rounded-lg" />
                <div className="h-20 bg-gray-100 rounded-lg md:col-span-2" />
              </div>

              {/* Separador */}
              <div className="h-px bg-gray-200 my-8" />

              {/* Descrição */}
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded-lg w-48 mb-6" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            </div>

            {/* Local do Evento Skeleton */}
            <div className="bg-white rounded-xl shadow-sm border p-4 md:p-8">
              <div className="h-7 bg-gray-200 rounded-lg w-40 mb-4" />
              <div className="h-16 bg-gray-100 rounded-lg mb-4" />
              <div className="h-[250px] md:h-[400px] bg-gray-200 rounded-lg" />
            </div>
          </div>

          {/* Coluna Direita - Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              {/* Card de Ingressos */}
              <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-6">
                <div className="h-8 bg-gray-200 rounded-lg w-32 mb-4" />
                <div className="h-16 bg-gray-100 rounded-lg mb-4" />
                
                {/* Tickets skeleton */}
                <div className="space-y-3 mb-6">
                  <div className="h-24 bg-gray-100 rounded-lg border-2 border-gray-200" />
                  <div className="h-24 bg-gray-100 rounded-lg border-2 border-gray-200" />
                </div>

                {/* Separador */}
                <div className="h-px bg-gray-200 my-4" />

                {/* Botão */}
                <div className="h-14 bg-gray-200 rounded-lg" />
              </div>

              {/* Card do Organizador */}
              <div className="bg-white rounded-xl shadow-sm border p-6 mt-6">
                <div className="h-6 bg-gray-200 rounded-lg w-28 mb-4" />
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-32" />
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-16 mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-36" />
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-14 mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-40" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventSkeleton

