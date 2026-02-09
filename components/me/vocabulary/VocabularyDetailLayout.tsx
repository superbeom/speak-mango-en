import MainHeader from "@/components/MainHeader";

interface VocabularyDetailLayoutProps {
  children: React.ReactNode;
  backHref?: string;
}

export default function VocabularyDetailLayout({
  children,
  backHref,
}: VocabularyDetailLayoutProps) {
  return (
    <div className="min-h-screen bg-layout pb-24">
      <MainHeader transparentOnScroll showBackButton backHref={backHref} />
      <main>{children}</main>
    </div>
  );
}
