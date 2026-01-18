import { notFound } from "next/navigation";
import { getI18n } from "@/i18n/server";
import { getExpressionById } from "@/lib/expressions";
import StudioClient from "./StudioClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0; // Always fetch fresh data for studio

export default async function StudioPage({ params }: PageProps) {
  const { id } = await params;
  const expression = await getExpressionById(id);

  if (!expression) {
    notFound();
  }

  const { locale } = await getI18n();

  return <StudioClient expression={expression} locale={locale} />;
}
