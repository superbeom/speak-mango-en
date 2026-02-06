"use client";

import { memo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useAnimation } from "framer-motion";
import { trackExpressionClick } from "@/analytics";
import { useI18n } from "@/context/I18nContext";
import { Expression } from "@/types/database";
import { useEnableHover } from "@/hooks/useIsMobile";
import { SupportedLanguage } from "@/i18n";
import { SCROLL_RESET_KEY } from "@/constants";
import { cn } from "@/lib/utils";
import { ROUTES, getHomeWithFilters } from "@/lib/routes";
import { getExpressionUIConfig } from "@/lib/ui-config";
import CategoryLabel from "@/components/CategoryLabel";
import Tag from "@/components/Tag";
import ExpressionActions from "@/components/actions/ExpressionActions";
import InteractiveLink from "@/components/ui/InteractiveLink";

interface ExpressionCardProps {
  item: Expression;
  isStatic?: boolean;
  className?: string;
  hideSaveButton?: boolean;
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

const ExpressionCard = memo(function ExpressionCard({
  item,
  isStatic = false,
  className,
  hideSaveButton = false,
}: ExpressionCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, dict } = useI18n();
  const enableHover = useEnableHover() && !isStatic;
  const controls = useAnimation();

  useEffect(() => {
    controls.start("visible");
  }, [controls]);

  const content = item.content[locale] || item.content[SupportedLanguage.EN];
  const meaning = item.meaning[locale] || item.meaning[SupportedLanguage.EN];

  // UI Config 통합 가져오기
  const { domain, category } = getExpressionUIConfig(
    item.domain,
    item.category,
  );

  const handleTagClick = (e: React.MouseEvent, tag: string) => {
    if (isStatic) return;
    e.preventDefault();
    e.stopPropagation();

    // 현재 필터 상태 유지 (카테고리 등)
    router.push(
      getHomeWithFilters({
        category: searchParams.get("category") || undefined,
        tag: tag,
        // 태그 클릭 시 일반 검색어는 혼동을 줄 수 있으므로 제거
        search: undefined,
      }),
    );
  };

  const handleCategoryClick = (e: React.MouseEvent) => {
    if (isStatic) return;
    e.preventDefault();
    e.stopPropagation();

    // 현재 필터 상태 유지 (태그 등)
    router.push(
      getHomeWithFilters({
        category: item.category,
        tag: searchParams.get("tag") || undefined,
        search: searchParams.get("search") || undefined,
      }),
    );
  };

  const CardContent = (
    <div
      className={cn(
        "group overflow-hidden rounded-card border border-main bg-surface p-7 shadow-sm transition-all duration-300 ease-out h-full",
        enableHover &&
          "hover:border-blue-200/50 hover:shadow-lg dark:hover:border-blue-500/20 dark:hover:shadow-[0_0_15px_-5px_rgba(59,130,246,0.2)]",
      )}
    >
      <div className="mb-5">
        <div className="mb-4 flex items-center justify-between">
          {/* Domain Tag */}
          <span
            className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${domain.styles}`}
          >
            <domain.icon
              className={cn(
                "w-3.5 h-3.5 mr-2 transition-transform duration-300",
                enableHover && "group-hover:scale-110",
              )}
            />
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
              "group-hover:text-blue-600 dark:group-hover:text-blue-400",
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
        <div data-action-buttons className="mt-6 flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <Tag
              key={tag}
              label={tag}
              source="card"
              onClick={(e) => handleTagClick(e, tag)}
            />
          ))}
        </div>
      )}

      {/* Action Bar */}
      <ExpressionActions
        className={cn(
          "mt-6 border-t border-subtle pt-4 transition-opacity duration-300",
          isStatic && "invisible pointer-events-none opacity-0",
        )}
        expressionId={item.id}
        expressionText={item.expression}
        meaning={meaning}
        shareVariant="compact"
        onShareClick={(e) => e.stopPropagation()}
        hideSaveButton={hideSaveButton}
      />
    </div>
  );

  return (
    <motion.div
      variants={itemVariants}
      layout
      initial="hidden"
      animate={controls}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      whileHover={enableHover ? { y: -5 } : undefined}
      className={cn("h-full rounded-card", className)}
    >
      <InteractiveLink
        href={ROUTES.EXPRESSION_DETAIL(item.id)}
        isStatic={isStatic}
        enableHover={enableHover}
        controls={controls}
        onClick={() => {
          // Track expression click event
          trackExpressionClick({
            expressionId: item.id,
            expressionText: item.expression,
            category: item.category,
            source: "home_feed",
          });

          // 1. 새 페이지 진입 신호를 남깁니다. (app/expressions/[id]/template.tsx에서 확인)
          if (typeof sessionStorage !== "undefined") {
            sessionStorage.setItem(SCROLL_RESET_KEY, "true");
          }

          // 2. 즉시 auto 모드로 전환하여 Next.js/Browser의 기본 동작을 돕습니다.
          if (
            typeof history !== "undefined" &&
            "scrollRestoration" in history
          ) {
            history.scrollRestoration = "auto";
          }
        }}
      >
        {CardContent}
      </InteractiveLink>
    </motion.div>
  );
});

ExpressionCard.displayName = "ExpressionCard";

export default ExpressionCard;
