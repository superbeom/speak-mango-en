"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Expression } from "@/types/database";
import { useEnableHover } from "@/hooks/useIsMobile";
import { getDictionary } from "@/i18n";
import { SCROLL_RESET_KEY } from "@/constants";
import { cn } from "@/lib/utils";
import { ROUTES, getHomeWithFilters } from "@/lib/routes";
import { getExpressionUIConfig } from "@/lib/ui-config";
import CategoryLabel from "@/components/CategoryLabel";
import Tag from "@/components/Tag";

interface ExpressionCardProps {
  item: Expression;
  locale: string;
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.21, 0.47, 0.32, 0.98] as const,
    },
  },
};

export default function ExpressionCard({ item, locale }: ExpressionCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const enableHover = useEnableHover();
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

    // 현재 필터 상태 유지 (카테고리 등)
    router.push(
      getHomeWithFilters({
        category: searchParams.get("category") || undefined,
        tag: tag,
        // 태그 클릭 시 일반 검색어는 혼동을 줄 수 있으므로 제거
        search: undefined,
      })
    );
  };

  const handleCategoryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 현재 필터 상태 유지 (태그 등)
    router.push(
      getHomeWithFilters({
        category: item.category,
        tag: searchParams.get("tag") || undefined,
        search: searchParams.get("search") || undefined,
      })
    );
  };

  return (
    <motion.div
      variants={itemVariants}
      layout
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      whileHover={enableHover ? { y: -5 } : undefined}
      whileTap={enableHover ? { scale: 0.98 } : undefined}
      className="h-full"
    >
      <Link
        href={ROUTES.EXPRESSION_DETAIL(item.id)}
        className="block h-full"
        onClick={() => {
          // 1. 새 페이지 진입 신호를 남깁니다. (app/expressions/[id]/template.tsx에서 확인)
          if (typeof sessionStorage !== "undefined") {
            sessionStorage.setItem(SCROLL_RESET_KEY, "true");
          }

          // 2. 즉시 auto 모드로 전환하여 Next.js/Browser의 기본 동작을 돕습니다.
          if (typeof history !== "undefined" && "scrollRestoration" in history) {
            history.scrollRestoration = "auto";
          }
        }}
      >
        <div
          className={cn(
            "group h-full overflow-hidden rounded-3xl border border-main bg-surface p-7 shadow-sm transition-all duration-300 ease-out",
            enableHover &&
            "hover:border-blue-200/50 hover:shadow-xl dark:hover:border-blue-500/30 dark:hover:shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)]"
          )}
        >
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
              <CategoryLabel
                label={item.category}
                icon={category.icon}
                textStyles={category.textStyles}
                onClick={handleCategoryClick}
              />
            </div>
            <h3
              className={cn(
                "text-2xl font-bold text-main leading-tight transition-colors",
                enableHover &&
                "group-hover:text-blue-600 dark:group-hover:text-blue-400"
              )}
            >
              {item.expression}
            </h3>
            <p className="mt-2 text-lg font-medium text-secondary">{meaning}</p>
          </div>

          <div className="space-y-3 border-t border-subtle pt-5">
            <div>
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                {dict.card.situationQuestion}
              </p>
              <p className="text-body leading-relaxed line-clamp-2 text-sm">
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
    </motion.div>
  );
}
