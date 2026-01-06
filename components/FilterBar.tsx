"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter } from "lucide-react";
import { getDictionary } from "@/i18n";
import { useScroll } from "@/hooks/useScroll";
import { getCategoryConfig } from "@/lib/ui-config";
import { CATEGORIES } from "@/lib/constants";
import { cn, formatMessage } from "@/lib/utils";
import { getHomeWithFilters } from "@/lib/routes";
import SearchBar from "@/components/SearchBar";

interface FilterBarProps {
  locale: string;
}

export default function FilterBar({ locale }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dict = getDictionary(locale);

  const currentCategory = searchParams.get("category") || "all";
  const currentSearch = searchParams.get("search") || "";
  const currentTag = searchParams.get("tag") || "";

  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);
  const isStuck = useScroll(80);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setShowLeftFade(scrollLeft > 0);
    setShowRightFade(scrollLeft < scrollWidth - clientWidth - 1); // -1 for tolerance
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  // 선택된 카테고리가 변경될 때 자동으로 스크롤하여 화면 중앙에 위치시킴
  useEffect(() => {
    if (!scrollContainerRef.current) return;

    const activeBtn = scrollContainerRef.current.querySelector(
      `button[data-category="${currentCategory}"]`
    ) as HTMLElement;

    if (activeBtn) {
      const container = scrollContainerRef.current;
      const { offsetLeft, offsetWidth } = activeBtn;
      const { clientWidth } = container;

      const scrollLeft = offsetLeft - clientWidth / 2 + offsetWidth / 2;

      container.scrollTo({
        left: scrollLeft,
        behavior: "smooth",
      });
    }
  }, [currentCategory]);

  const updateFilters = (updates: Record<string, string | null>) => {
    // 현재 필터 상태 유지하면서 업데이트
    const newFilters = {
      category: currentCategory,
      search: currentSearch,
      tag: currentTag,
      ...Object.fromEntries(
        Object.entries(updates).map(([k, v]) => [k, v === null ? undefined : v])
      ),
    };

    router.push(
      getHomeWithFilters(newFilters as Parameters<typeof getHomeWithFilters>[0])
    );
  };

  const handleSearch = (term: string) => {
    if (!term) {
      updateFilters({ search: null, tag: null });
      return;
    }

    // 태그 검색 지원 (#으로 시작하면 태그 필터로 처리)
    if (term.startsWith("#")) {
      const tagQuery = term.slice(1).trim();
      if (tagQuery) {
        updateFilters({ search: null, tag: tagQuery });
      } else {
        // #만 입력된 경우 초기화
        updateFilters({ search: null, tag: null });
      }
    } else {
      updateFilters({ search: term, tag: null });
    }
  };

  const handleClear = () => {
    updateFilters({ search: null, tag: null });
  };

  return (
    <div
      className={cn(
        "sticky top-(--header-height) z-40 space-y-4 pt-2 pb-4 mb-8 bg-layout-transparent backdrop-blur-xl -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 transition-all duration-200",
        isStuck ? "border-layout" : "border-none-layout"
      )}
    >
      {/* Search Bar */}
      <SearchBar
        key={`${currentSearch}-${currentTag}`}
        initialValue={currentSearch}
        hasActiveFilter={!!currentTag}
        placeholder={
          currentTag
            ? formatMessage(dict.filter.filteringByTag, { tag: currentTag })
            : dict.filter.searchPlaceholder
        }
        onSearch={handleSearch}
        onClear={handleClear}
      />

      <div className="space-y-4">
        {/* Category Chips */}
        <div className="relative">
          {/* Left Fade */}
          <div
            className={`absolute left-0 top-0 bottom-0 w-12 bg-linear-to-r fade-mask-base ${
              showLeftFade ? "opacity-100" : "opacity-0"
            }`}
          />
          {/* Right Fade */}
          <div
            className={`absolute right-0 top-0 bottom-0 w-12 bg-linear-to-l fade-mask-base ${
              showRightFade ? "opacity-100" : "opacity-0"
            }`}
          />

          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="flex items-center gap-3 overflow-x-auto scrollbar-hide py-1 px-1"
          >
            <div className="flex gap-2 pr-2">
              {CATEGORIES.map((cat) => {
                const config =
                  cat === "all"
                    ? {
                        icon: Filter,
                        textStyles: "text-zinc-500",
                        label: dict.filter.all,
                      }
                    : {
                        icon: getCategoryConfig(cat).icon,
                        textStyles: getCategoryConfig(cat).textStyles,
                        label: cat.charAt(0).toUpperCase() + cat.slice(1),
                      };

                const isActive = currentCategory === cat;

                const handleCategoryClick = () => {
                  if (isActive) {
                    // 이미 선택된 카테고리를 다시 누른 경우
                    if (cat === "all") return; // '전체'는 아무 동작 안 함 (중복 페칭 방지)
                    updateFilters({ category: "all" }); // 다른 카테고리는 선택 해제
                  } else {
                    updateFilters({ category: cat });
                  }
                };

                return (
                  <button
                    key={cat}
                    data-category={cat}
                    onClick={handleCategoryClick}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shrink-0 cursor-pointer
                      ${
                        isActive
                          ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black border-zinc-900 dark:border-zinc-100 shadow-sm"
                          : "bg-surface text-zinc-500 border border-main hover:border-zinc-300 dark:hover:border-zinc-700"
                      }
                    `}
                  >
                    <config.icon
                      className={`w-3.5 h-3.5 ${
                        !isActive && config.textStyles
                      }`}
                    />
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
