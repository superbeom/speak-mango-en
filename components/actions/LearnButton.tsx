"use client";

import { useRef, useState, useEffect } from "react";
import { CheckCircle, Circle, Loader2 } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { useAuthUser } from "@/hooks/user/useAuthUser";
import { useUserActions } from "@/hooks/user/useUserActions";
import { cn } from "@/lib/utils";
import { smoothScrollTo } from "@/lib/scroll";
import LoginModal from "@/components/auth/LoginModal";

interface LearnButtonProps {
  expressionId: string;
  className?: string;
  onLearnComplete?: () => void;
  scrollToId?: string;
}

export default function LearnButton({
  expressionId,
  className,
  onLearnComplete,
  scrollToId,
}: LearnButtonProps) {
  const { dict } = useI18n();
  const { user } = useAuthUser();
  const { toggleAction, hasAction, isLoading } = useUserActions();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Timer Ref for cleanup
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
    };
  }, []);

  const isLearned = hasAction(expressionId, "learn");
  const isInitialLoading = isLoading.learn;

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isInitialLoading) return;

    if (!user) {
      setIsModalOpen(true);
      return;
    }

    // Toggle Action triggers Optimistic Update in useUserActions
    const newStatus = !isLearned;

    try {
      await toggleAction(expressionId, "learn");

      if (newStatus && onLearnComplete) {
        onLearnComplete();
      }

      // Auto-scroll to target section if provided
      if (newStatus && scrollToId) {
        scrollTimerRef.current = setTimeout(() => {
          smoothScrollTo(scrollToId, 1000);
        }, 100);
      }
    } catch (error) {
      console.error("Failed to toggle learn:", error);
      // Rollback is handled by SWR inside useUserActions
    }
  };

  return (
    <>
      <button
        onClick={handleToggle}
        disabled={isInitialLoading}
        className={cn(
          "group flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all focus:outline-none",
          isInitialLoading
            ? "bg-zinc-100 text-zinc-400 cursor-wait pointer-events-none dark:bg-zinc-800"
            : cn(
                "sm:cursor-pointer sm:active:scale-95",
                isLearned
                  ? "bg-green-600 text-white hover:bg-green-700 shadow-md shadow-green-500/20"
                  : "bg-white/90 text-zinc-700 shadow-sm hover:bg-white dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700",
              ),
          className,
        )}
      >
        {isInitialLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isLearned ? (
          <CheckCircle className="h-5 w-5" />
        ) : (
          <Circle className="h-5 w-5 text-zinc-400 group-hover:text-zinc-500 dark:text-zinc-500 dark:group-hover:text-zinc-400" />
        )}
        {isLearned ? dict.detail.actionLearned : dict.detail.actionLearnThis}
      </button>

      <LoginModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
