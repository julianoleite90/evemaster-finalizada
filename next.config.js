/** @type {import('next').NextConfig} */
const nextConfig = {
  // Redirects permanentes
  async redirects() {
    return [
      {
        source: '/minha-conta',
        destination: '/my-account',
        permanent: true,
      },
      {
        source: '/minha-conta/:path*',
        destination: '/my-account/:path*',
        permanent: true,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  // Garantir que erros não quebrem o build
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Configurações para melhorar a estabilidade
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { isServer }) => {
    // Externalizar xlsx no servidor para evitar problemas de bundling
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        'xlsx': 'commonjs xlsx'
      })
    }
    return config
  },
}

module.exports = nextConfig

  swcMinify: true,
  webpack: (config, { isServer }) => {
    // Externalizar xlsx no servidor para evitar problemas de bundling
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        'xlsx': 'commonjs xlsx'
      })
    }
    return config
  },
}

module.exports = nextConfig

  swcMinify: true,
  webpack: (config, { isServer }) => {
    // Externalizar xlsx no servidor para evitar problemas de bundling
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        'xlsx': 'commonjs xlsx'
      })
    }
    return config
  },
}

module.exports = nextConfig

  swcMinify: true,
  webpack: (config, { isServer }) => {
    // Externalizar xlsx no servidor para evitar problemas de bundling
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        'xlsx': 'commonjs xlsx'
      })
    }
    return config
  },
}

module.exports = nextConfig

  swcMinify: true,
  webpack: (config, { isServer }) => {
    // Externalizar xlsx no servidor para evitar problemas de bundling
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        'xlsx': 'commonjs xlsx'
      })
    }
    return config
  },
}

module.exports = nextConfig
