import type { MetadataRoute } from "next";
import { positionsFile } from "@/lib/data";
import { URL_SITE } from "@/lib/site";

// Mapa do site para os buscadores (enviar no Google Search Console e no Bing Webmaster Tools).
// Só páginas públicas; o painel /admin fica fora (e tem noindex). Endereços com barra final, como no site.
export default function sitemap(): MetadataRoute.Sitemap {
  const conteudo = new Date(positionsFile.updatedAt);
  return [
    { url: `${URL_SITE}/`, lastModified: conteudo, changeFrequency: "weekly", priority: 1 },
    { url: `${URL_SITE}/questionario/`, lastModified: conteudo, changeFrequency: "weekly", priority: 0.8 },
    { url: `${URL_SITE}/metodologia/`, lastModified: conteudo, changeFrequency: "weekly", priority: 0.7 },
    { url: `${URL_SITE}/privacidade/`, lastModified: conteudo, changeFrequency: "monthly", priority: 0.3 },
  ];
}
