import { Suspense } from "react";
import { getI18n } from "@/i18n/server";
import { getExpressions } from "@/lib/expressions";
import { SERVICE_NAME } from "@/lib/constants";
import { serializeFilters } from "@/lib/utils";
import Header from "@/components/Header";
import Logo from "@/components/Logo";
import FilterBar from "@/components/FilterBar";
import ExpressionList from "@/components/ExpressionList";

// Revalidate every hour
export const revalidate = 3600;

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;

  const category =
    typeof params.category === "string" ? params.category : undefined;
  const search = typeof params.search === "string" ? params.search : undefined;
  const tag = typeof params.tag === "string" ? params.tag : undefined;

  const filters = { category, search, tag };
  const cacheKey = serializeFilters(filters);

  // 초기 1페이지 데이터 페칭 (limit 12)
  const expressions = await getExpressions({
    ...filters,
    page: 1,
    limit: 12,
  });
  const { locale, dict } = await getI18n();

  return (
    <div className="min-h-screen bg-layout">
      {/* Header */}
      <Header>
        <div className="flex items-center justify-between">
          <Logo name={SERVICE_NAME} />
          <nav className="flex items-center gap-4">
            <span className="text-sm text-zinc-500">{dict.home.subHeader}</span>
          </nav>
        </div>
      </Header>

      {/* Main Content */}
      <main className="mx-auto max-w-layout px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-main">{dict.home.title}</h2>
          <p className="mt-2 text-secondary">{dict.home.description}</p>
        </div>

        {/* Filter & Search Bar */}
        <Suspense
          fallback={
            <div className="h-20 bg-zinc-100 animate-pulse rounded-2xl mb-10" />
          }
        >
          <FilterBar locale={locale} />
        </Suspense>

        {expressions.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-main">
            <p className="text-zinc-500 text-lg font-medium">
              {dict.home.emptyState}
            </p>
            {(category || search || tag) && (
              <p className="text-zinc-400 text-sm mt-2">
                {dict.home.emptyStateSub}
              </p>
            )}
          </div>
        ) : (
          <ExpressionList
            key={cacheKey}
            initialItems={expressions}
            filters={filters}
            locale={locale}
            loadMoreText={dict.common.loadMore}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-zinc-200 py-12 dark:border-zinc-800">
        <div className="mx-auto max-w-layout px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-zinc-500">
            &copy; {new Date().getFullYear()} {SERVICE_NAME}. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
