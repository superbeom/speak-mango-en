import Link from "next/link";
import { Expression } from "@/types/database";
import { getDictionary } from "@/lib/i18n";
import { getExpressionUIConfig } from "@/lib/ui-config";

interface ExpressionCardProps {
  item: Expression;
  locale: string;
}

export function ExpressionCard({ item, locale }: ExpressionCardProps) {
  const dict = getDictionary(locale);
  const content = item.content[locale] || item.content["ko"];
  const meaning = item.meaning[locale] || item.meaning["ko"];

  // UI Config 통합 가져오기
  const { domain, category } = getExpressionUIConfig(
    item.domain,
    item.category
  );

  return (
    <Link href={`/expressions/${item.id}`} className="block h-full">
      <div className="group h-full overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4">
          <div className="mb-3 flex items-center justify-between">
            {/* Domain Tag */}
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${domain.styles}`}
            >
              <domain.icon className="w-3 h-3 mr-1.5" />
              {domain.label}
            </span>
            {/* Category Label with Icon */}
            <span
              className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider ${category.textStyles}`}
            >
              <category.icon className="w-3 h-3" />
              {item.category}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
            {item.expression}
          </h3>
          <p className="mt-1.5 text-lg font-medium text-blue-600 dark:text-blue-400">
            {meaning}
          </p>
        </div>

        <div className="space-y-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <div>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              {dict.card.situationQuestion}
            </p>
            <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed line-clamp-2 text-sm">
              {content?.situation || dict.card.noDescription}
            </p>
          </div>
        </div>

        {item.tags && item.tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-800"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
