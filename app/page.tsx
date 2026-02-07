import { Suspense } from "react";
import { Metadata } from "next";
import { getI18n, getLocale } from "@/i18n/server";
import { SERVICE_NAME, BASE_URL } from "@/constants";
import { serializeFilters } from "@/lib/utils";
import { getExpressions } from "@/services/queries/expressions";
import MainHeader from "@/components/MainHeader";
import FilterBar from "@/components/FilterBar";
import ExpressionList from "@/components/ExpressionList";

// Revalidate every hour
export const revalidate = 3600;

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// SEO Metadata with Canonical URL
export async function generateMetadata(): Promise<Metadata> {
  return {
    alternates: {
      canonical: "./",
    },
  };
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
  const locale = await getLocale();
  const [{ dict }, expressions] = await Promise.all([
    getI18n(),
    getExpressions({
      ...filters,
      page: 1,
      limit: 12,
      locale, // 로케일별 검색을 위해 추가
    }),
  ]);

  return (
    <div className="min-h-screen bg-layout">
      {/* Header */}
      <MainHeader transparentOnScroll showSubHeader />

      {/* Main Content */}
      <main className="mx-auto max-w-layout px-4 py-8 sm:px-6 lg:px-8">
        {/* SearchAction Schema - 홈페이지에만 검색 기능이 있으므로 여기에만 설정 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: SERVICE_NAME,
              url: BASE_URL,
              potentialAction: {
                "@type": "SearchAction",
                target: `${BASE_URL}/?search={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
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
          <FilterBar />
        </Suspense>

        {expressions.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-card border-2 border-dashed border-main">
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
