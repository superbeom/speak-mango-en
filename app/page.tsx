import { getI18n } from "@/lib/i18n/server";
import { getExpressions } from "@/lib/expressions";
import { ExpressionCard } from "@/components/ExpressionCard";

// Revalidate every hour
export const revalidate = 3600;

export default async function Home() {
  const expressions = await getExpressions();
  const { locale, dict } = await getI18n();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-black/80">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Daily English
            </h1>
            <nav className="flex items-center gap-4">
              <span className="text-sm text-zinc-500">
                {dict.home.subHeader}
              </span>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            {dict.home.title}
          </h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            {dict.home.description}
          </p>
        </div>

        {expressions.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-500">{dict.home.emptyState}</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {expressions.map((item) => (
              <ExpressionCard key={item.id} item={item} locale={locale} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-zinc-200 py-12 dark:border-zinc-800">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} Daily English. Powered by n8n & Gemini.
          </p>
        </div>
      </footer>
    </div>
  );
}
