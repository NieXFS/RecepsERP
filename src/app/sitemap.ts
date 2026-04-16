import type { MetadataRoute } from "next";
import { helpArticles } from "@/lib/help/articles";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "/",
    "/assinar",
    "/cadastro",
    "/atendentes-ia",
    "/erp",
    "/erp-atendente-ia",
    "/ajuda",
    "/termos",
    "/privacidade",
  ];

  return [
    ...staticRoutes.map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
    })),
    ...helpArticles.map((article) => ({
      url: `${baseUrl}/ajuda/${article.slug}`,
      lastModified: new Date(article.updatedAt),
    })),
  ];
}
