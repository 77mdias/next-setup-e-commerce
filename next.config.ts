import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  // Isolate dev artifacts from production build output to avoid
  // chunk-mismatch/corruption when `next dev` and `next build` run in parallel.
  distDir: isDevelopment ? ".next-dev" : ".next",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "u9a6wmr3as.ufs.sh", // Para imagens de exemplo
      },
      {
        protocol: "https",
        hostname: "cdn.awsli.com.br", // Para imagens de exemplo
      },
      {
        protocol: "https",
        hostname: "cwsmgmt.corsair.com", // Para imagens de exemplo
      },
      {
        protocol: "https",
        hostname: "cdn.pichau.com.br", // Para imagens de exemplo
      },
      {
        protocol: "https",
        hostname: "i.zst.com.br", // Para imagens de exemplo
      },
      {
        protocol: "https",
        hostname: "horizonplay.fbitsstatic.net", // Para imagens de exemplo
      },
      {
        protocol: "https",
        hostname: "logos-world.net", // Para imagens de exemplo
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "1000logos.net",
      },
      {
        protocol: "https",
        hostname: "logodownload.org",
      },
      {
        protocol: "https",
        hostname: "logos-world.net",
      },
      {
        protocol: "https",
        hostname: "cwsmgmt.corsair.com",
      },
      {
        protocol: "https",
        hostname: "encrypted-tbn0.gstatic.com",
      },
      {
        protocol: "https",
        hostname: "cdn.freebiesupply.com",
      },
      {
        protocol: "https",
        hostname: "gazin-images.gazin.com.br",
      },
      {
        protocol: "https",
        hostname: "www.mielectro.es",
      },
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
      },
      {
        protocol: "https",
        hostname: "http2.mlstatic.com",
      },
      {
        protocol: "https",
        hostname: "images.kabum.com.br",
      },
      {
        protocol: "https",
        hostname: "cdn.dooca.store",
      },
      {
        protocol: "https",
        hostname: "media.pichau.com.br",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
      {
        protocol: "https",
        hostname: "a-static.mlcdn.com.br",
      },
      {
        protocol: "https",
        hostname: "dlcdnwebimgs.asus.com",
      },
      {
        protocol: "https",
        hostname: "www.kabum.com.br",
      },
      {
        protocol: "https",
        hostname: "images.kabum.com.br",
      },
      {
        protocol: "https",
        hostname: "horizonplay.fbitsstatic.net",
      },
      {
        protocol: "https",
        hostname: "samsungbrshop.vtexassets.com",
      },
      // Adicione aqui outros domínios de imagens que você usar
    ],
  },
};

export default nextConfig;
