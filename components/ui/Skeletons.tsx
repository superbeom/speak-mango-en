"use client";

import { memo } from "react";
import { SKELETON_PAGE, type SkeletonPage } from "@/constants/ui";
import { cn } from "@/lib/utils";

/**
 * 기본 스켈레톤 베이스 (Shimmer 애니메이션 포함)
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800",
        className,
      )}
      {...props}
    />
  );
}

/**
 * 아바타/인증 버튼용 원형 스켈레톤
 */
export const SkeletonAuthButton = memo(function SkeletonAuthButton() {
  return <div className="skeleton-avatar" />;
});

/**
 * 소형 텍스트용 스켈레톤 (카테고리, 버튼, 링크 등)
 */
export const SkeletonTextSmall = memo(function SkeletonTextSmall() {
  return <Skeleton className="h-4 w-16" />;
});

/**
 * 상단 네비게이션 바 형태의 스켈레톤
 */
export const SkeletonNavbar = memo(function SkeletonNavbar({
  page = SKELETON_PAGE.HOME,
  className,
}: {
  page?: SkeletonPage;
  className?: string;
}) {
  return (
    <div className="sticky top-0 z-50 h-(--header-height) bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
      <div
        className={cn(
          "mx-auto max-w-layout px-4 py-4 sm:px-6 lg:px-8 flex items-center",
          (page === SKELETON_PAGE.HOME ||
            page === SKELETON_PAGE.DETAIL ||
            page === SKELETON_PAGE.MY_PAGE) &&
            "justify-between",
          className,
        )}
      >
        {page === SKELETON_PAGE.QUIZ ? (
          <>
            {/* Back Button Skeleton */}
            <SkeletonTextSmall />
            {/* Page Title Skeleton */}
            <Skeleton className="h-7 w-24" />
          </>
        ) : (
          <>
            {/* Logo Skeleton */}
            <Skeleton className="h-7 w-32" />
            <div className="flex items-center gap-4">
              {/* Quiz Link Skeleton */}
              <SkeletonTextSmall />
              {/* Nav/SubHeader Skeleton (Desktop only) */}
              <div className="hidden sm:flex items-center gap-4">
                <Skeleton className="h-4 w-1" />
                {page === SKELETON_PAGE.HOME && (
                  <>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-1" />
                  </>
                )}
              </div>
              {/* Auth Button Skeleton */}
              <SkeletonAuthButton />
            </div>
          </>
        )}
      </div>
    </div>
  );
});

/**
 * 홈 페이지 히어로 섹션(제목 및 설명) 형태의 스켈레톤
 */
export const SkeletonHomeHero = memo(function SkeletonHomeHero() {
  return (
    <div className="mb-10">
      <Skeleton className="h-9 w-48 mb-3" />
      <Skeleton className="h-6 w-64" />
    </div>
  );
});

/**
 * ExpressionCard 형태의 스켈레톤
 */
export const SkeletonCard = memo(function SkeletonCard() {
  return (
    <div className="h-full rounded-card border border-zinc-100 dark:border-zinc-800 bg-surface p-7 shadow-sm">
      <div className="mb-5">
        <div className="mb-4 flex items-center justify-between">
          {/* Domain Tag Skeleton */}
          <Skeleton className="h-6 w-20 rounded-full" />
          {/* Category Label Skeleton */}
          <SkeletonTextSmall />
        </div>
        {/* Expression Title Skeleton */}
        <Skeleton className="h-8 w-3/4 mb-3" />
        {/* Meaning Skeleton */}
        <Skeleton className="h-6 w-1/2" />
      </div>

      <div className="space-y-3 border-t border-subtle pt-5">
        <Skeleton className="h-3 w-24 mb-2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Skeleton className="h-6 w-12 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
});

/**
 * FilterBar 형태의 스켈레톤
 */
export const SkeletonFilterBar = memo(function SkeletonFilterBar() {
  return (
    <div className="space-y-4 pt-2 pb-4 mb-8 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      {/* Search Bar Skeleton */}
      <Skeleton className="h-12 w-full rounded-2xl" />

      <div className="flex gap-2 overflow-hidden py-1">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-8 w-20 shrink-0 rounded-lg" />
        ))}
      </div>
    </div>
  );
});

/**
 * 상세 페이지 콘텐츠용 스켈레톤
 */
export const SkeletonDetail = memo(function SkeletonDetail() {
  return (
    <article className="mx-auto max-w-3xl space-y-6">
      {/* Main Content Card Skeleton */}
      <section className="overflow-hidden rounded-card border border-zinc-100 dark:border-zinc-800 bg-surface shadow-sm">
        <div className="p-6 sm:p-10">
          <div className="mb-6 sm:mb-8 flex items-center justify-between">
            {/* Domain Tag Skeleton */}
            <Skeleton className="h-6 w-20 rounded-full" />
            {/* Category Label Skeleton */}
            <SkeletonTextSmall />
          </div>

          {/* Expression & Meaning Skeleton */}
          <Skeleton className="h-10 sm:h-14 w-3/4 mb-4" />
          <Skeleton className="h-7 w-1/2 mb-10" />

          <div className="mt-8 sm:mt-10 space-y-6 sm:space-y-8">
            {/* Situation block Skeleton */}
            <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 p-5 sm:p-6">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-20 w-full" />
            </div>

            {/* Dialogue block Skeleton */}
            <div>
              <Skeleton className="h-4 w-24 mb-4" />
              <div className="space-y-4">
                <Skeleton className="h-16 w-3/4 rounded-2xl rounded-tl-none" />
                <div className="flex justify-end">
                  <Skeleton className="h-16 w-3/4 rounded-2xl rounded-tr-none" />
                </div>
              </div>
            </div>

            {/* Tip block Skeleton */}
            <div className="rounded-2xl bg-blue-50/30 dark:bg-blue-900/10 p-5 sm:p-6">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Quiz Card Skeleton */}
      <section className="rounded-card bg-zinc-900 p-6 sm:p-8">
        <Skeleton className="h-4 w-24 mb-4 bg-zinc-800" />
        <Skeleton className="h-8 w-full mb-6 bg-zinc-800" />
        <Skeleton className="h-10 w-32 rounded-xl bg-zinc-800" />
      </section>

      {/* Tags Skeleton */}
      <div className="flex flex-wrap gap-2 px-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-8 w-16 rounded-full" />
        ))}
      </div>
    </article>
  );
});

/**
 * ExpressionList 로딩 시 보여줄 스켈레톤 그리드
 */
export const SkeletonExpressionList = memo(function SkeletonExpressionList() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
      {[1, 2, 3].map((i) => (
        <SkeletonCard key={`skeleton-${i}`} />
      ))}
    </div>
  );
});

/**
 * 퀴즈 페이지용 스켈레톤 (Progress Bar + Question Card)
 */
export const SkeletonQuiz = memo(function SkeletonQuiz() {
  return (
    <div className="max-w-xl mx-auto px-4 py-6 sm:py-10">
      {/* Progress Bar Skeleton */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Question Card Skeleton */}
      <section className="rounded-card border border-zinc-100 dark:border-zinc-800 bg-surface shadow-lg overflow-hidden p-6 sm:p-8 space-y-6">
        {/* Question Text Skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
        </div>

        {/* Options Skeleton */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-full p-4 rounded-xl border-2 border-zinc-100 dark:border-zinc-800 flex items-center gap-3"
            >
              <Skeleton className="h-6 w-6 rounded-md" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
});

/**
 * 단어장 목록 로딩 시 보여줄 스켈레톤
 */
export const SkeletonVocabularyList = memo(function SkeletonVocabularyList() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div
          key={`vocab-skeleton-${i}`}
          className="flex items-center justify-between rounded-xl border border-zinc-100 p-4 dark:border-zinc-800"
        >
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-4 w-4" />
        </div>
      ))}
    </div>
  );
});

/**
 * 마이 페이지 - 프로필 헤더 스켈레톤
 */
export const SkeletonProfileHeader = memo(function SkeletonProfileHeader() {
  return (
    <div className="flex items-center gap-5 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-surface shadow-sm">
      <Skeleton className="h-18 w-18 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </div>
  );
});

/**
 * 마이 페이지 - 학습 모드 그리드 스켈레톤
 */
export const SkeletonStudyModesGrid = memo(function SkeletonStudyModesGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-40 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-surface p-5 space-y-3"
        >
          <Skeleton className="h-14 w-14 rounded-xl" />
          <div className="pt-2 space-y-1.5">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
});

/**
 * 마이 페이지 - 단어장 목록 섹션 스켈레톤
 */
export const SkeletonVocabularyListSection = memo(
  function SkeletonVocabularyListSection() {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-24 rounded-lg mb-6 opacity-30" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
          <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
        </div>
      </div>
    );
  },
);

/**
 * 단어장 상세 페이지 - 헤더 스켈레톤
 */
export const SkeletonVocabularyDetailHeader = memo(
  function SkeletonVocabularyDetailHeader({
    readonly = false,
  }: {
    readonly?: boolean;
  }) {
    return (
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-48 sm:h-9 sm:w-64" />
          <Skeleton className="h-6 w-12 rounded-md" />
        </div>
        {!readonly && <Skeleton className="h-10 w-10 rounded-lg" />}
      </div>
    );
  },
);

/**
 * 단어장 상세 페이지 - 툴바 스켈레톤
 */
export const SkeletonVocabularyToolbar = memo(
  function SkeletonVocabularyToolbar() {
    return (
      <div className="sticky-toolbar flex items-center justify-between p-2 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-surface">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>
    );
  },
);

/**
 * 단어장 상세 페이지 - 전체 레이아웃 스켈레톤
 */
export const SkeletonVocabularyDetail = memo(function SkeletonVocabularyDetail({
  readonly = false,
  showToolbar = false,
}: {
  readonly?: boolean;
  showToolbar?: boolean;
}) {
  return (
    <div className="py-8">
      <div className="layout-container">
        <SkeletonVocabularyDetailHeader readonly={readonly} />
      </div>

      <div className="layout-container mt-8 space-y-10">
        {showToolbar && <SkeletonVocabularyToolbar />}
        <SkeletonExpressionList />
      </div>
    </div>
  );
});
