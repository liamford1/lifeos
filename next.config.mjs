import withBundleAnalyzer from "@next/bundle-analyzer";

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})({
  reactStrictMode: true,
  trailingSlash: false,
  webpack(config) {
    // Strip Day.js locales to save ~10 kB
    config.resolve.alias["dayjs/locale"] = false;
    return config;
  },
});