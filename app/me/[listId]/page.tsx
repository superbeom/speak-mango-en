import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getI18n } from "@/i18n/server";
import { isAppError, VOCABULARY_ERROR } from "@/types/error";
import { getVocabularyListDetails } from "@/services/actions/vocabulary";
import { getAuthSession } from "@/lib/auth/utils";
import MainHeader from "@/components/MainHeader";
import VocabularyDetailHeader from "@/components/me/VocabularyDetailHeader";
import VocabularyItemsGrid from "@/components/me/VocabularyItemsGrid";
import LocalVocabularyDetail from "@/components/me/LocalVocabularyDetail";

interface PageProps {
  params: Promise<{ listId: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();

  return {
    title: dict.me.myLists,
    description: dict.me.metaDescription,
    robots: { index: false, follow: false },
  };
}

export default async function VocabularyListPage({ params }: PageProps) {
  const { listId } = await params;
  const { isPro } = await getAuthSession();

  /** Free User: Use Client Component for Local Storage */
  if (!isPro) {
    return (
      <div className="min-h-screen bg-layout pb-24">
        <MainHeader />
        <LocalVocabularyDetail listId={listId} />
      </div>
    );
  }

  /** Pro User: Use Server Component for DB Data */
  try {
    const list = await getVocabularyListDetails(listId);

    return (
      <div className="min-h-screen bg-layout pb-24">
        <MainHeader />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <VocabularyDetailHeader
            title={list.title}
            itemCount={list.items.length}
          />
          <div className="mt-8">
            <VocabularyItemsGrid items={list.items} />
          </div>
        </main>
      </div>
    );
  } catch (error) {
    if (
      isAppError(error) &&
      (error.code === VOCABULARY_ERROR.NOT_FOUND ||
        error.code === VOCABULARY_ERROR.UNAUTHORIZED)
    ) {
      notFound();
    }
    throw error;
  }
}
