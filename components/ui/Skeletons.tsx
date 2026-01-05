"use client";

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
        className
      )}
      {...props}
    />
  );
}

/**
 * 상단 네비게이션 바 형태의 스켈레톤
 */
export function SkeletonNavbar({ isDetail = false }: { isDetail?: boolean }) {
  return (
    <div className="sticky top-0 z-50 h-(--header-height) bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
      <div
        className={cn(
          "mx-auto max-w-layout px-4 py-4 sm:px-6 lg:px-8 flex items-center",
          !isDetail && "justify-between"
        )}
      >
        {isDetail ? (
          /* Back Button Skeleton */
          <Skeleton className="h-4 w-16" />
        ) : (
          <>
            {/* Logo Skeleton */}
            <Skeleton className="h-7 w-32" />
            {/* Nav/SubHeader Skeleton */}
            <Skeleton className="h-4 w-24" />
          </>
        )}
      </div>
    </div>
  );
}

/**
 * 홈 페이지 히어로 섹션(제목 및 설명) 형태의 스켈레톤
 */
export function SkeletonHomeHero() {
  return (
    <div className="mb-10">
      <Skeleton className="h-9 w-48 mb-3" />
      <Skeleton className="h-6 w-64" />
    </div>
  );
}

/**
 * ExpressionCard 형태의 스켈레톤
 */
export function SkeletonCard() {
  return (
    <div className="h-full rounded-3xl border border-zinc-100 dark:border-zinc-800 bg-surface p-7 shadow-sm">
      <div className="mb-5">
        <div className="mb-4 flex items-center justify-between">
          {/* Domain Tag Skeleton */}
          <Skeleton className="h-6 w-20 rounded-full" />
          {/* Category Label Skeleton */}
          <Skeleton className="h-4 w-16" />
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
}

/**
 * FilterBar 형태의 스켈레톤
 */
export function SkeletonFilterBar() {
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
}

/**
 * 상세 페이지 콘텐츠용 스켈레톤
 */
export function SkeletonDetail() {
  return (
    <article className="mx-auto max-w-3xl space-y-6">
      {/* Main Content Card Skeleton */}
      <section className="overflow-hidden rounded-3xl border border-zinc-100 dark:border-zinc-800 bg-surface shadow-sm">
        <div className="p-6 sm:p-10">
          <div className="mb-6 sm:mb-8 flex items-center justify-between">
            {/* Domain Tag Skeleton */}
            <Skeleton className="h-6 w-20 rounded-full" />
            {/* Category Label Skeleton */}
            <Skeleton className="h-4 w-16" />
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
      <section className="rounded-3xl bg-zinc-900 p-6 sm:p-8">
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
}
