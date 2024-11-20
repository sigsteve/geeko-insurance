/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hebbkx1anhila5yf.public.blob.vercel-storage.com',
      },
    ],
    domains: ['localhost'],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
      encoding: false,
    }
    
    config.module.rules.push({
      test: /\.node/,
      use: 'raw-loader',
    })

    return config
  },
  output: 'standalone',
  outputFileTracing: true,
  experimental: {
    outputFileTracingRoot: './',
    outputFileTracingIncludes: {
      '/**': ['protected-images/**/*'],
    },
  },
  async rewrites() {
    return [
      {
        source: '/api/llm/:path*',
        destination: 'http://10.0.0.40:11434/api/:path*',
      },
    ]
  },
}

export default nextConfig
