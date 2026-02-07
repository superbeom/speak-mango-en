import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getExpressionById } from "@/services/queries/expressions";
import StudioClient from "./StudioClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0; // Always fetch fresh data for studio

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false, follow: false } };
}

export default async function StudioPage({ params }: PageProps) {
  const { id } = await params;
  const expression = await getExpressionById(id);

  if (!expression) {
    notFound();
  }

  return <StudioClient expression={expression} />;
}
