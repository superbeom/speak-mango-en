import MainHeader from "@/components/MainHeader";

interface VocabularyDetailLayoutProps {
  children: React.ReactNode;
}

export default function VocabularyDetailLayout({
  children,
}: VocabularyDetailLayoutProps) {
  return (
    <div className="min-h-screen bg-layout pb-24">
      <MainHeader transparentOnScroll showBackButton />
      <main>{children}</main>
    </div>
  );
}
