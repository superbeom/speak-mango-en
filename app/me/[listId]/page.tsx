import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getI18n } from "@/i18n/server";
import { isAppError, VOCABULARY_ERROR } from "@/types/error";
import { EXPRESSION_PAGE_SIZE } from "@/constants/expressions";
import { getVocabularyListDetails } from "@/services/queries/vocabulary";
import { getAuthSession } from "@/lib/auth/utils";
import VocabularyDetailLayout from "@/components/me/vocabulary/VocabularyDetailLayout";
import LocalVocabularyDetail from "@/components/me/vocabulary/LocalVocabularyDetail";
import RemoteVocabularyDetail from "@/components/me/vocabulary/RemoteVocabularyDetail";

interface PageProps {
  params: Promise<{ listId: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();

  return {
    title: dict.me.myList,
    description: dict.me.metaDescription,
    robots: { index: false, follow: false },
  };
}

export default async function VocabularyListPage({
  params,
  searchParams,
}: PageProps) {
  const { listId } = await params;
  const { page } = await searchParams;

  const pageNumber = Number(page);
  const currentPage = pageNumber > 0 ? pageNumber : 1;
  const itemsPerPage = EXPRESSION_PAGE_SIZE;

  const { isPro } = await getAuthSession();

  let content;

  if (!isPro) {
    /** Free User: Use Client Component for Local Storage */
    content = (
      <LocalVocabularyDetail listId={listId} currentPage={currentPage} />
    );
  } else {
    /** Pro User: Use Server Component for DB Data */
    const list = await (async () => {
      try {
        return await getVocabularyListDetails(
          listId,
          currentPage,
          itemsPerPage,
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
    })();

    content = (
      <RemoteVocabularyDetail
        listId={listId}
        title={list.title}
        items={list.items}
        isDefault={list.is_default}
        totalCount={list.total_count}
        currentPage={currentPage}
      />
    );
  }

  return <VocabularyDetailLayout>{content}</VocabularyDetailLayout>;
}
