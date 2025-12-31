import { getExpressionById } from "@/lib/expressions";
import { notFound } from "next/navigation";
import Link from "next/link";

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

  const { content } = expression;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pb-20">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-black/80">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="group flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors"
            >
              <span className="transition-transform group-hover:-translate-x-1">
                ←
              </span>{" "}
              뒤로가기
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <article className="space-y-6">
          {/* Main Card */}
          <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="p-8 sm:p-12">
              <div className="mb-8 flex items-center justify-between">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  Today&apos;s expression
                </span>
                <time className="text-sm font-medium text-zinc-400">
                  {new Date(expression.published_at).toLocaleDateString(
                    "ko-KR",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </time>
              </div>

              <h1 className="mb-4 text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl">
                {expression.expression}
              </h1>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {expression.meaning}
              </p>

              <div className="mt-10 space-y-8">
                {/* Situation */}
                <div className="rounded-2xl bg-zinc-50 p-6 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-zinc-400">
                    <span className="text-lg">💡</span> 어떤 상황인가요?
                  </h2>
                  <p className="text-xl leading-relaxed text-zinc-800 dark:text-zinc-200 break-keep">
                    {content?.situation}
                  </p>
                </div>

                {/* Dialogue */}
                <div>
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-zinc-400">
                    <span className="text-lg">💬</span> 실전 대화로 배워봐요!
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
                          className={`max-w-[85%] rounded-2xl px-5 py-3 ${
                            idx % 2 === 0
                              ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 rounded-tl-none"
                              : "bg-blue-600 text-white rounded-tr-none"
                          }`}
                        >
                          <p className="text-lg font-semibold">{chat.en}</p>
                          <p
                            className={`mt-1 text-sm ${
                              idx % 2 === 0 ? "text-zinc-500" : "text-blue-100"
                            }`}
                          >
                            {chat.kr}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tip */}
                <div className="rounded-2xl border-2 border-dashed border-blue-100 bg-blue-50/30 p-6 dark:border-blue-900/30 dark:bg-blue-900/10">
                  <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                    <span className="text-lg">🍯</span> 선생님의 꿀팁!
                  </h2>
                  <p className="text-lg text-zinc-700 dark:text-zinc-300 break-keep">
                    {content?.tip}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Quiz Card */}
          <section className="rounded-3xl border border-zinc-200 bg-linear-to-br from-zinc-900 to-zinc-800 p-8 text-white shadow-lg dark:border-zinc-700">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-zinc-400">
              <span className="text-lg">🔥</span> 오늘의 미션!
            </h2>
            <p className="text-2xl font-bold mb-6">{content?.quiz.question}</p>
            <details className="group cursor-pointer">
              <summary className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-bold transition-colors hover:bg-white/20 list-none">
                정답 확인하기{" "}
                <span className="transition-transform group-open:rotate-180">
                  👇
                </span>
              </summary>
              <p className="mt-4 text-3xl font-black text-blue-400 animate-in fade-in slide-in-from-top-2">
                {content?.quiz.answer}
              </p>
            </details>
          </section>

          {/* Tags & Source */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4">
            <div className="flex flex-wrap gap-2">
              {expression.tags?.map((tag) => (
                <span key={tag} className="text-sm font-medium text-zinc-400">
                  #{tag}
                </span>
              ))}
            </div>
            {expression.origin_url && (
              <a
                href={expression.origin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 underline underline-offset-4"
              >
                출처 확인하기 ↗
              </a>
            )}
          </div>
        </article>
      </main>
    </div>
  );
}
