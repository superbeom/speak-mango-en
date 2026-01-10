import { MetadataRoute } from "next";
import { BASE_URL } from "@/constants";
import { getAllExpressionIds } from "@/lib/expressions";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // 1. Static Routes
    const routes = [
        "", // Home
    ].map((route) => ({
        url: `${BASE_URL}${route}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 1,
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
