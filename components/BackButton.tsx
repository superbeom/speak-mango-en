"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";

interface BackButtonProps {
  label: string;
  className?: string;
}

export default function BackButton({ label, className }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    // 브라우저 히스토리가 있으면 뒤로가기, 없으면(새 탭 등) 홈으로 이동
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(ROUTES.HOME);
    }
  };

  return (
    <button
      onClick={handleBack}
      type="button"
      className={cn(
        "group flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors cursor-pointer",
        className
      )}
    >
      <span className="transition-transform group-hover:-translate-x-1">←</span>{" "}
      {label}
    </button>
  );
}
