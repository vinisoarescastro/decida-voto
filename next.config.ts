import type { NextConfig } from "next";

const producao = process.env.NODE_ENV === "production";

// Cabeçalhos de segurança aplicados pela própria aplicação (o Nginx acrescenta o HSTS).
// 'unsafe-inline' em script-src é necessário para os scripts inline do Next.js.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  // Servidor Node enxuto (pasta .next/standalone), executado em Docker atrás do Nginx.
  output: "standalone",
  trailingSlash: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  async headers() {
    const comuns = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
      { key: "X-Frame-Options", value: "DENY" },
      // Em desenvolvimento o Next precisa de eval para recarregamento; a CSP vale só em produção.
      ...(producao ? [{ key: "Content-Security-Policy", value: CSP }] : []),
    ];
    return [
      { source: "/:path*", headers: comuns },
      {
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
