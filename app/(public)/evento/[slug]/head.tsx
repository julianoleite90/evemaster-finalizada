import { getEventBySlug } from "@/lib/supabase/events-server"

type HeadProps = {
  params: { slug: string }
}

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://evemaster.com.br"
const defaultTitle = "EveMaster - Plataforma para Eventos Esportivos"
const defaultDescription =
  "Encontre e gerencie eventos esportivos com a EveMaster, plataforma completa de ingressos e inscrições."

const stripHtml = (value?: string) =>
  value
    ? value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
    : ""

export default async function Head({ params }: HeadProps) {
  const event = await getEventBySlug(params.slug).catch(() => null)

  const title = event
    ? `${event.name} | EveMaster plataforma para eventos esportivos`
    : defaultTitle

  const description =
    stripHtml(event?.description) || event?.summary || defaultDescription

  const ogImage =
    event?.banner_url || `${siteUrl}/images/logo/logo.png`
  const canonicalUrl = event?.slug
    ? `${siteUrl}/evento/${event.slug}`
    : siteUrl

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <link rel="canonical" href={canonicalUrl} />
    </>
  )
}

