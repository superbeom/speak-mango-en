import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getI18n } from "@/i18n/server";
import { isAppError, VOCABULARY_ERROR } from "@/types/error";
import { EXPRESSION_PAGE_SIZE } from "@/constants/expressions";
import { getLearnedListDetails } from "@/services/queries/vocabulary";
import { ROUTES } from "@/lib/routes";
import { getSafePageNumber } from "@/lib/utils";
import { getAuthSession } from "@/lib/auth/utils";
import VocabularyDetailLayout from "@/components/me/vocabulary/VocabularyDetailLayout";
import LocalLearnedDetail from "@/components/me/learned/LocalLearnedDetail";
import RemoteLearnedDetail from "@/components/me/learned/RemoteLearnedDetail";

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();

  return {
    title: dict.me.learnedExpressions,
    description: dict.me.learnedMetaDescription,
    robots: { index: false, follow: false },
  };
}

export default async function LearnedPage({ searchParams }: PageProps) {
  const { page } = await searchParams;

  const currentPage = getSafePageNumber(page);
  const itemsPerPage = EXPRESSION_PAGE_SIZE;

  const { isPro } = await getAuthSession();

  let content;

  if (!isPro) {
    /** Free User: Use Client Component for Local Storage */
    content = <LocalLearnedDetail />;
  } else {
    /** Pro User: Use Server Component for DB Data */
    const list = await (async () => {
      try {
        return await getLearnedListDetails(currentPage, itemsPerPage);
      } catch (error) {
        if (isAppError(error) && error.code === VOCABULARY_ERROR.UNAUTHORIZED) {
          notFound();
        }
        throw error;
      }
    })();

    content = (
      <RemoteLearnedDetail
        initialItems={list.items}
        initialTotalCount={list.total_count}
        currentPage={currentPage}
      />
    );
  }

  return (
    <VocabularyDetailLayout backHref={ROUTES.MY_PAGE}>
      {content}
    </VocabularyDetailLayout>
  );
}
