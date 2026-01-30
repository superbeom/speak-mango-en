"use client";

import { memo } from "react";
import Link from "next/link";
import { trackTagClick } from "@/analytics";
import { cn } from "@/lib/utils";

interface TagProps {
  label: string;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  source?: "card" | "detail" | "filter"; // Analytics용 출처
}

const Tag = memo(function Tag({
  label,
  href,
  onClick,
  className = "",
  source = "detail",
}: TagProps) {
  const baseStyles =
    "inline-flex items-center rounded-lg bg-subtle px-2.5 py-1 text-xs font-semibold text-zinc-500 border border-subtle transition-all hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:text-zinc-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 dark:hover:border-blue-800 cursor-pointer";

  const handleClick = (e: React.MouseEvent) => {
    // 태그 클릭 추적
    trackTagClick({
      tagName: label,
      source: source,
    });

    // 기존 onClick 핸들러 실행
    if (onClick) {
      onClick(e);
    }
  };

  if (href) {
    return (
      <Link
        href={href}
        className={cn(baseStyles, className)}
        onClick={handleClick}
      >
        #{label}
      </Link>
    );
  }

  return (
    <button
      onClick={handleClick}
      type="button"
      className={cn(baseStyles, className)}
    >
      #{label}
    </button>
  );
});

Tag.displayName = "Tag";

export default Tag;
