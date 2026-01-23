"use client";

import Link from "next/link";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";
import { QUIZ_STORAGE_KEYS } from "@/lib/quiz";

interface StudyLinkProps {
  expressionId: string;
  label: string;
  className?: string;
}

export default function StudyButton({
  expressionId,
  label,
  className,
}: StudyLinkProps) {
  const isMobile = useIsMobile();

  const handleClick = () => {
    // 퀴즈 페이지로 돌아왔을 때 상태를 복원하기 위한 플래그 설정
    sessionStorage.setItem(QUIZ_STORAGE_KEYS.RETURN_FLAG, "true");
  };

  return (
    <Link
      href={ROUTES.EXPRESSION_DETAIL(expressionId)}
      target={isMobile ? undefined : "_blank"}
      onClick={handleClick}
      className={cn(
        "inline-flex items-center justify-center px-4 py-2 rounded-xl font-bold bg-zinc-600 text-zinc-100 hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-600 dark:hover:bg-zinc-300 transition-colors",
        className,
      )}
    >
      {label}
    </Link>
  );
}
