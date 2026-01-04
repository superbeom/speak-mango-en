import { notFound } from "next/navigation";
import Link from "next/link";
import { getI18n } from "@/i18n/server";
import { getExpressionById, getRelatedExpressions } from "@/lib/expressions";
import { getExpressionUIConfig } from "@/lib/ui-config";
import Header from "@/components/Header";
import CategoryLabel from "@/components/CategoryLabel";
import Tag from "@/components/Tag";
import RelatedExpressions from "@/components/RelatedExpressions";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export const revalidate = 3600;

export default async function ExpressionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const expression = await getExpressionById(id);

  if (!expression) {
    notFound();
  }

  const { locale, dict } = await getI18n();

  // 감지된 언어의 데이터가 있는지 확인, 없으면 한국어(ko)를 기본값으로 사용
  const content = expression.content[locale] || expression.content["ko"];
  const meaning = expression.meaning[locale] || expression.meaning["ko"];

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
          <Link
            href="/"
            className="group flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors"
          >
            <span className="transition-transform group-hover:-translate-x-1">
              ←
            </span>{" "}
            {dict.common.back}
          </Link>
        </div>
      </Header>

      <main className="mx-auto max-w-layout px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        <article className="mx-auto max-w-3xl space-y-6">
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
                  href={`/?category=${expression.category}`}
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
                <div>
                  <h2 className="mb-4 flex items-center gap-2 text-[11px] sm:text-sm font-bold uppercase tracking-wide text-zinc-400">
                    {dict.detail.dialogueTitle}
                  </h2>
                  <div className="space-y-4">
                    {content?.dialogue.map((chat, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col ${
                          idx % 2 === 0 ? "items-start" : "items-end"
                        }`}
                      >
                        <div
                          className={`max-w-[90%] sm:max-w-[85%] rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 ${
                            idx % 2 === 0
                              ? "bg-muted text-zinc-900 dark:text-zinc-100 rounded-tl-none"
                              : "bg-blue-600 text-white rounded-tr-none"
                          }`}
                        >
                          <p className="text-base sm:text-lg font-semibold">
                            {chat.en}
                          </p>
                          <p
                            className={`mt-1 text-xs sm:text-sm ${
                              idx % 2 === 0 ? "text-zinc-500" : "text-blue-100"
                            }`}
                          >
                            {chat.translation}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

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
                <Tag key={tag} label={tag} href={`/?tag=${tag}`} />
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
