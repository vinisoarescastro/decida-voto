import type { MetadataRoute } from "next";
import { URL_SITE } from "@/lib/site";

// Regras para buscadores: páginas públicas liberadas; painel e APIs fora do índice.
// (A Cloudflare acrescenta as próprias linhas de "content signals" a este arquivo.)
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/"] },
    sitemap: `${URL_SITE}/sitemap.xml`,
  };
}
