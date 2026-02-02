"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { ViewMode } from "@/constants/ui";
import { cn } from "@/lib/utils";

interface ViewModeButtonProps {
  mode: ViewMode;
  currentMode: ViewMode;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}

const ViewModeButton = memo(function ViewModeButton({
  mode,
  currentMode,
  onClick,
  icon: Icon,
  label,
}: ViewModeButtonProps) {
  const isActive = mode === currentMode;

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 group focus-visible:ring-2 focus-visible:ring-blue-500 outline-hidden",
        isActive
          ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs cursor-default"
          : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50",
      )}
    >
      <Icon size={14} className="transition-transform duration-200" />
      {label}
    </motion.button>
  );
});

ViewModeButton.displayName = "ViewModeButton";

export default ViewModeButton;
