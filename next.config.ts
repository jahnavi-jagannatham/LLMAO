import type { NextConfig } from "next";

// @ts-ignore
import webpack from "webpack";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^(porto|porto\/internal|accounts|@coinbase\/wallet-sdk|@metamask\/connect-evm|@safe-global\/safe-apps-sdk|@safe-global\/safe-apps-provider|@walletconnect\/ethereum-provider)$/,
      })
    );
    return config;
  },
};

export default nextConfig;
