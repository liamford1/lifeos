/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack(config, { isServer }) {
    // Silence Node `punycode` deprecation
    config.resolve.fallback = {
      ...config.resolve.fallback,
      punycode: false, // use user-land polyfill from OTEL bundle instead
    };
    // Filter OTEL’s dynamic-require warning
    config.infrastructureLogging = {
      ...config.infrastructureLogging,
      level: 'warn',
    };
    config.ignoreWarnings = [
      (warning) =>
        warning.message.includes(
          'Critical dependency: the request of a dependency is an expression'
        ),
    ];
    // Strip Day.js locales to save ~10 kB
    config.resolve.alias = {
      ...config.resolve.alias,
      'dayjs/locale': false,
    };
    return config;
  },
};

export default nextConfig;