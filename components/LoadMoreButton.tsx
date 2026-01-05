"use client";

import { Plus } from "lucide-react";
import { useEnableHover } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

interface LoadMoreButtonProps {
  onClick: () => void;
  label: string;
  className?: string;
}

export default function LoadMoreButton({
  onClick,
  label,
  className,
}: LoadMoreButtonProps) {
  const enableHover = useEnableHover();

  return (
    <div className={cn("flex justify-center pt-4", className)}>
      <button
        onClick={onClick}
        className={cn(
          "group relative flex items-center gap-2 px-10 py-4 rounded-2xl transition-all duration-200 cursor-pointer shadow-sm",
          "bg-surface border-main text-main",
          "dark:shadow-none",
          // 모바일 최적화: 마우스 호버 시에만 효과 적용
          enableHover && "hover:shadow-md hover:text-secondary"
        )}
      >
        <Plus
          className={cn(
            "w-5 h-5 transition-transform",
            enableHover && "group-hover:rotate-90"
          )}
          strokeWidth={2.5}
        />
        <span className="font-bold text-lg">{label}</span>
      </button>
    </div>
  );
}
