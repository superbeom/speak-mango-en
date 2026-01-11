import { Metadata } from "next";
import { notFound } from "next/navigation";
import { SUPPORTED_LANGUAGES, getContentLocale, SupportedLanguage } from "@/i18n";
import { SERVICE_NAME, BASE_URL } from "@/constants";
import { getI18n } from "@/i18n/server";
import { getExpressionById, getRelatedExpressions } from "@/lib/expressions";
import { getHomeWithFilters } from "@/lib/routes";
import { getExpressionUIConfig } from "@/lib/ui-config";
import { formatMessage } from "@/lib/utils";
import Header from "@/components/Header";
import CategoryLabel from "@/components/CategoryLabel";
import Tag from "@/components/Tag";
import RelatedExpressions from "@/components/RelatedExpressions";
import BackButton from "@/components/BackButton";
import DialogueSection from "@/components/DialogueSection";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const expression = await getExpressionById(id);

  if (!expression) {
    return {
      title: "Expression Not Found",
    };
  }

  const { locale, fullLocale, dict } = await getI18n();
  const contentLocale = getContentLocale(expression.meaning, locale);
  const primaryMeaning = expression.meaning[contentLocale] || "";

  const title = formatMessage(dict.meta.expressionTitle, {
    expression: expression.expression,
    serviceName: SERVICE_NAME,
  });

  const description = formatMessage(dict.meta.expressionDesc, {
    expression: expression.expression,
    meaning: primaryMeaning,
    serviceName: SERVICE_NAME,
  });

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/expressions/${id}`,
      locale: fullLocale,
      type: "article",
    },
    alternates: {
      canonical: `${BASE_URL}/expressions/${id}`,
    },
  };
}

export default async function ExpressionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const expression = await getExpressionById(id);

  if (!expression) {
    notFound();
  }

  const { locale, dict } = await getI18n();

  // 감지된 언어의 데이터가 있는지 확인, 없으면 영어(en)를 기본값으로 사용
  const content = expression.content[getContentLocale(expression.content, locale)] || expression.content[SupportedLanguage.EN];
  const meaning = expression.meaning[getContentLocale(expression.meaning, locale)] || expression.meaning[SupportedLanguage.EN];

  if (!content || !meaning) {
    notFound();
  }

  // 관련 표현 가져오기 (같은 카테고리)
  const relatedExpressions = await getRelatedExpressions(
    id,
    expression.category,
    6 // 넉넉하게 6개까지 가져와서 스크롤 가능하게 함
  );

  // UI Config 통합 가져오기
  const { domain, category } = getExpressionUIConfig(
    expression.domain,
    expression.category
  );

  return (
    <div className="min-h-screen bg-layout pb-20">
      <Header>
        <div className="flex items-center">
          <BackButton label={dict.common.back} />
        </div>
      </Header>

      <main className="mx-auto max-w-layout px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        <article className="mx-auto max-w-3xl space-y-6">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "LearningResource",
                name: expression.expression,
                description: formatMessage(dict.meta.expressionDesc, {
                  expression: expression.expression,
                  meaning: meaning,
                  serviceName: SERVICE_NAME,
                }),
                learningResourceType: "Expression",
                inLanguage: locale,
                author: {
                  "@type": "Organization",
                  name: SERVICE_NAME,
                },
                url: `${BASE_URL}/expressions/${id}`,
                image: `${BASE_URL}/expressions/${id}/opengraph-image`,
                workTranslation: SUPPORTED_LANGUAGES.map((lang) => ({
                  "@type": "LearningResource",
                  inLanguage: lang,
                  url: `${BASE_URL}/expressions/${id}?lang=${lang}`,
                })),
              }),
            }}
          />
          {/* Main Content Card */}
          <section className="overflow-hidden rounded-3xl border border-main bg-surface shadow-sm">
            <div className="p-6 sm:p-10">
              <div className="mb-6 sm:mb-8 flex items-center justify-between">
                {/* Domain Tag */}
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider ${domain.styles}`}
                >
                  <domain.icon className="w-3 h-3 mr-1.5" />
                  {domain.label}
                </span>
                {/* Category Label */}
                <CategoryLabel
                  label={expression.category}
                  icon={category.icon}
                  textStyles={category.textStyles}
                  href={getHomeWithFilters({ category: expression.category })}
                  className="text-[10px] sm:text-xs"
                />
              </div>

              <h1 className="mb-3 sm:mb-4 text-4xl sm:text-6xl font-extrabold tracking-tight text-main">
                {expression.expression}
              </h1>
              <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                {meaning}
              </p>

              <div className="mt-8 sm:mt-10 space-y-6 sm:space-y-8">
                {/* Situation */}
                <div className="rounded-2xl bg-subtle p-5 sm:p-6 border border-subtle">
                  <h2 className="mb-2 sm:mb-3 flex items-center gap-2 text-[11px] sm:text-sm font-bold uppercase tracking-wide text-zinc-400">
                    {dict.detail.situationTitle}
                  </h2>
                  <p className="text-lg sm:text-xl leading-relaxed text-body break-keep">
                    {content?.situation}
                  </p>
                </div>

                {/* Dialogue */}
                <DialogueSection
                  title={dict.detail.dialogueTitle}
                  dialogue={expression.dialogue || []}
                  locale={locale}
                  playAllLabel={dict.detail.playAll}
                  stopLabel={dict.detail.stop}
                  loadingLabel={dict.common.loading}
                />

                {/* Tip */}
                <div className="rounded-2xl border-2 border-dashed border-blue-100 bg-blue-50/30 p-5 sm:p-6 dark:border-blue-900/30 dark:bg-blue-900/10">
                  <h2 className="mb-2 flex items-center gap-2 text-[11px] sm:text-sm font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                    {dict.detail.tipTitle}
                  </h2>
                  <p className="text-base sm:text-lg text-zinc-700 dark:text-zinc-300 break-keep">
                    {content?.tip}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Quiz Card */}
          <section className="rounded-3xl border border-zinc-200 bg-linear-to-br from-zinc-900 to-zinc-800 p-6 sm:p-8 text-white shadow-lg dark:border-zinc-700">
            <h2 className="mb-4 flex items-center gap-2 text-[11px] sm:text-sm font-bold uppercase tracking-wide text-zinc-400">
              {dict.detail.missionTitle}
            </h2>
            <p className="text-xl sm:text-2xl font-bold mb-6 whitespace-pre-wrap">
              {content?.quiz.question}
            </p>
            <details className="group cursor-pointer">
              <summary className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-bold transition-colors hover:bg-white/20 list-none">
                {dict.detail.checkAnswer}{" "}
                <span className="transition-transform group-open:rotate-180">
                  👇
                </span>
              </summary>
              <p className="mt-4 text-2xl sm:text-3xl font-black text-blue-400 animate-in fade-in slide-in-from-top-2">
                {content?.quiz.answer}
              </p>
            </details>
          </section>

          {/* Tags & Source */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4">
            <div className="flex flex-wrap gap-2">
              {expression.tags?.map((tag) => (
                <Tag key={tag} label={tag} href={getHomeWithFilters({ tag })} />
              ))}
            </div>
          </div>
        </article>

        {/* Related Expressions Section */}
        {relatedExpressions.length > 0 && (
          <RelatedExpressions
            expressions={relatedExpressions}
            locale={locale}
            title={dict.detail.relatedTitle}
          />
        )}
      </main>
    </div>
  );
}
