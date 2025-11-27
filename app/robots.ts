import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/inscricao/*/obrigado',
          '/minha-conta',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/inscricao/*/obrigado',
          '/minha-conta',
        ],
      },
    ],
    sitemap: 'https://evemaster.com.br/sitemap.xml',
  }
}