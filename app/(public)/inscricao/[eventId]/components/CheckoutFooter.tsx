"use client"

import Image from "next/image"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CheckoutFooterProps {
  idioma: "pt" | "es" | "en"
  onIdiomaChange: (idioma: "pt" | "es" | "en") => void
  t: (key: string) => string
}

export function CheckoutFooter({ idioma, onIdiomaChange, t }: CheckoutFooterProps) {
  return (
    <footer className="bg-gray-50/50 border-t border-gray-100 mt-16">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 pt-8 md:pt-10 pb-6">
        <div className="max-w-7xl mx-auto">
          {/* Grid Principal - 2 colunas no mobile, 4 no desktop */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-6 lg:gap-8 mb-6 md:mb-8">
            {/* Coluna 1: Logo e Descrição */}
            <div className="col-span-2 md:col-span-1 space-y-3 flex flex-col items-center md:items-start">
              <div>
                <Image
                  src="/images/logo/logo.png"
                  alt="EveMaster"
                  width={126}
                  height={36}
                  className="h-6 md:h-7 w-auto opacity-80"
                />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-xs text-center md:text-left">
                {t("plataformaDescricao")}
              </p>
            </div>

            {/* Coluna 2: Formas de Pagamento */}
            <div className="col-span-2 md:col-span-1 space-y-3 flex flex-col items-center md:items-start">
              <h3 className="text-xs font-medium text-gray-600">
                {idioma === "es" ? "Medios de Pago Aceptados" : idioma === "en" ? "Accepted Payment Methods" : "Meios de Pagamento Aceitos"}
              </h3>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <Image
                  src="/images/ic-payment-visa.svg"
                  alt="Visa"
                  width={40}
                  height={25}
                  className="h-5 md:h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
                />
                <Image
                  src="/images/ic-payment-master-card.svg"
                  alt="Mastercard"
                  width={40}
                  height={25}
                  className="h-5 md:h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
                />
                <Image
                  src="/images/ic-payment-elo.svg"
                  alt="Elo"
                  width={40}
                  height={25}
                  className="h-5 md:h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
                />
                <Image
                  src="/images/ic-payment-american-express.svg"
                  alt="American Express"
                  width={40}
                  height={25}
                  className="h-5 md:h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
                />
                <Image
                  src="/images/ic-payment-hipercard.svg"
                  alt="Hipercard"
                  width={40}
                  height={25}
                  className="h-5 md:h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
                />
                <Image
                  src="/images/ic-payment-pix.svg"
                  alt="Pix"
                  width={40}
                  height={25}
                  className="h-5 md:h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
                />
                <Image
                  src="/images/ic-payment-boleto.svg"
                  alt="Boleto"
                  width={40}
                  height={25}
                  className="h-5 md:h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center md:text-left">
                <span className="text-[#156634]">{t("parceleAteCartao")}</span>
              </p>
            </div>

            {/* Coluna 3: Links Legais */}
            <div className="col-span-1 md:col-span-1 space-y-3 flex flex-col items-center md:items-start md:ml-[20%]">
              <h3 className="text-xs font-medium text-gray-600">
                Legal
              </h3>
              <div className="flex flex-col gap-1.5">
                <Link 
                  href="/termos-de-uso" 
                  className="text-xs text-gray-500 hover:text-[#156634] transition-colors text-center md:text-left"
                >
                  {idioma === "es" ? "Términos de Uso" : idioma === "en" ? "Terms of Use" : "Termos de Uso"}
                </Link>
                <Link 
                  href="/politica-de-privacidade" 
                  className="text-xs text-gray-500 hover:text-[#156634] transition-colors text-center md:text-left"
                >
                  {idioma === "es" ? "Política de Privacidad" : idioma === "en" ? "Privacy Policy" : "Política de Privacidade"}
                </Link>
              </div>
            </div>

            {/* Coluna 4: Idioma */}
            <div className="col-span-1 md:col-span-1 space-y-3 flex flex-col items-center md:items-start">
              <h3 className="text-xs font-medium text-gray-600 hidden md:block">
                Idioma
              </h3>
              <Select value={idioma} onValueChange={(val: "pt" | "es" | "en") => onIdiomaChange(val)}>
                <SelectTrigger className="w-full max-w-[140px] md:w-[140px] bg-white border-gray-200 text-gray-600 text-xs h-8 md:h-9">
                  <SelectValue asChild>
                    <span className="flex items-center">
                      <span className="text-sm">{idioma === "pt" ? "🇧🇷" : idioma === "es" ? "🇦🇷" : "🇺🇸"}</span>
                      <span className="text-xs hidden sm:inline ml-[5px]">{idioma === "pt" ? "Português" : idioma === "es" ? "Español" : "English"}</span>
                      <span className="text-xs sm:hidden ml-[5px]">{idioma === "pt" ? "PT" : idioma === "es" ? "ES" : "EN"}</span>
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt">
                    <span className="flex items-center gap-2">
                      <span>🇧🇷</span> <span>Português</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="es">
                    <span className="flex items-center gap-2">
                      <span>🇦🇷</span> <span>Español</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="en">
                    <span className="flex items-center gap-2">
                      <span>🇺🇸</span> <span>English</span>
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Separador */}
          <Separator className="my-6 opacity-30" />

          {/* Rodapé Inferior: CNPJ e Copyright */}
          <div className="flex flex-col items-center justify-center gap-2 text-xs text-gray-400 text-center">
            <p>
              © {new Date().getFullYear()} Evemaster. Todos os direitos reservados.
            </p>
            <p>
              Um software do grupo Fullsale Ltda - CNPJ: 41.953.551/0001-57
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

