"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useScroll } from "@/hooks/useScroll";
import { useEnableHover } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

export default function ScrollToTop() {
  const isVisible = useScroll(300);
  const enableHover = useEnableHover();

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          whileHover={enableHover ? { scale: 1.1 } : undefined}
          whileTap={enableHover ? { scale: 0.9 } : undefined}
          onClick={scrollToTop}
          className={cn(
            "fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 p-3 sm:p-3.5 rounded-full shadow-lg cursor-pointer",
            "bg-white dark:bg-zinc-800",
            "border border-zinc-200 dark:border-zinc-700",
            "text-zinc-600 dark:text-zinc-300",
            "transition-colors duration-200",
            // 모바일이 아닌 경우에만 호버 스타일 적용
            enableHover &&
              "hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white"
          )}
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
