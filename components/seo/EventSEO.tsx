import Head from "next/head"

interface EventSEOProps {
  title: string
  description: string
  ogImage?: string
  slug: string
  eventName: string
  eventDate?: string
  location?: string
  organizer?: string
}

export default function EventSEO({
  title,
  description,
  ogImage,
  slug,
  eventName,
  eventDate,
  location,
  organizer,
}: EventSEOProps) {
  const url = `https://evemaster.com.br/evento/${slug}`
  const dynamicOgImage = ogImage || `https://evemaster.com.br/api/og/evento/${slug}`

  const keywords = [
    eventName,
    "evento esportivo",
    "inscrições",
    "EveMaster",
    location,
    organizer,
    "corrida",
    "esporte",
    "competição",
  ]
    .filter(Boolean)
    .join(", ")

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: eventName,
    description,
    startDate: eventDate,
    location: location
      ? {
          "@type": "Place",
          name: location,
        }
      : undefined,
    organizer: organizer
      ? {
          "@type": "Organization",
          name: organizer,
        }
      : undefined,
    url,
    image: dynamicOgImage,
  }

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="EveMaster" />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />

      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={dynamicOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="EveMaster" />
      <meta property="og:locale" content="pt_BR" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={dynamicOgImage} />
      <meta name="twitter:creator" content="@evemaster" />

      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#156634" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
    </Head>
  )
}


