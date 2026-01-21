import { MetadataRoute } from "next";
import { BASE_URL } from "@/constants";
import { getAllExpressionIds } from "@/lib/expressions";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Static Routes
  const routes = [
    "", // Home
    "/quiz", // Quiz
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1 : 0.7,
  }));

  // 2. Dynamic Routes (Expressions)
  const expressionIds = await getAllExpressionIds();
  const expressionRoutes = expressionIds.map((id) => ({
    url: `${BASE_URL}/expressions/${id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...routes, ...expressionRoutes];
}
