/** @type {import('next').NextConfig} */
// 페이지 접근 시 해당 페이지로
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/",
        destination: "/analy_div",
        permanent: true,
      },
    ];
  },
  env: {
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    config.externals = [...(config.externals || []), { 'utf-8-validate': 'utf-8-validate' }];
    return config
  },
  experimental: {
    esmExternals: 'loose'
  },
  transpilePackages: [
    '@radix-ui/react-menu',
    'react-remove-scroll',
    '@floating-ui/react',
    '@radix-ui/react-dialog',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/primitive',
    '@radix-ui/react-primitive',
    '@radix-ui/react-use-callback-ref',
    '@radix-ui/react-use-controllable-state',
    '@radix-ui/react-compose-refs',
    '@radix-ui/react-context',
    '@radix-ui/react-collection',
    '@radix-ui/react-direction',
    '@radix-ui/react-dismissable-layer',
    '@radix-ui/react-focus-guards',
    '@radix-ui/react-focus-scope',
    '@radix-ui/react-id',
    '@radix-ui/react-portal',
    '@radix-ui/react-presence',
    '@radix-ui/react-primitive',
    '@radix-ui/react-slot',
    '@radix-ui/react-use-layout-effect',
    'aria-hidden',
    'react-remove-scroll-bar'
  ],
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/flowise-api/:path*',
        destination: 'https://flowise-6pxd.onrender.com/:path*',
      },
    ];
  },
};

export default nextConfig;
