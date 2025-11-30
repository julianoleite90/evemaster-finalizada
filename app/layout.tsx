import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://evemaster.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "EveMaster - Plataforma de Ingressos para Eventos Esportivos",
    template: "%s | EveMaster",
  },
  description: "Plataforma SaaS de venda de ingressos para corridas, maratonas, triatlon e ciclismo",
  icons: {
    icon: "/logo/faviconeve.png",
    shortcut: "/logo/faviconeve.png",
    apple: "/logo/faviconeve.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
