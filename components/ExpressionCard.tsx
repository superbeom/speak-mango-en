"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Expression } from "@/types/database";
import { getDictionary } from "@/lib/i18n";
import { getExpressionUIConfig } from "@/lib/ui-config";
import Tag from "@/components/Tag";

interface ExpressionCardProps {
  item: Expression;
  locale: string;
}

export default function ExpressionCard({ item, locale }: ExpressionCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dict = getDictionary(locale);

  const content = item.content[locale] || item.content["ko"];
  const meaning = item.meaning[locale] || item.meaning["ko"];

  // UI Config 통합 가져오기
  const { domain, category } = getExpressionUIConfig(
    item.domain,
    item.category
  );

  const handleTagClick = (e: React.MouseEvent, tag: string) => {
    e.preventDefault();
    e.stopPropagation();

    const params = new URLSearchParams(searchParams.toString());
    params.set("tag", tag);
    params.delete("search"); // 태그 클릭 시 일반 검색어는 제거

    router.push(`/?${params.toString()}`);
  };

  return (
    <Link href={`/expressions/${item.id}`} className="block h-full">
      <div className="group h-full overflow-hidden rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-blue-200/50 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-500/30 dark:hover:shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)]">
        <div className="mb-5">
          <div className="mb-4 flex items-center justify-between">
            {/* Domain Tag */}
            <span
              className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${domain.styles}`}
            >
              <domain.icon className="w-3.5 h-3.5 mr-2 transition-transform duration-300 group-hover:scale-110" />
              {domain.label}
            </span>
            {/* Category Label with Icon */}
            <span
              className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider transition-colors ${category.textStyles}`}
            >
              <category.icon className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-12" />
              {item.category}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {item.expression}
          </h3>
          <p className="mt-2 text-lg font-medium text-zinc-600 dark:text-zinc-400">
            {meaning}
          </p>
        </div>

        <div className="space-y-3 border-t border-zinc-100 pt-5 dark:border-zinc-800">
          <div>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
              {dict.card.situationQuestion}
            </p>
            <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed line-clamp-2 text-sm">
              {content?.situation || dict.card.noDescription}
            </p>
          </div>
        </div>

        {item.tags && item.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <Tag
                key={tag}
                label={tag}
                onClick={(e) => handleTagClick(e, tag)}
              />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
