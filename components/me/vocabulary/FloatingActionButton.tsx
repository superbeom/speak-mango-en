import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  variant?: "default" | "danger";
}

export default function FloatingActionButton({
  onClick,
  icon: Icon,
  label,
  variant = "default",
}: FloatingActionButtonProps) {
  return (
    <button
      className={cn(
        "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors min-w-[60px] sm:cursor-pointer",
        variant === "default"
          ? "hover:bg-white/10 dark:hover:bg-black/10"
          : "text-red-400 dark:text-red-600 hover:bg-red-500/10",
      )}
      onClick={onClick}
    >
      <Icon size={20} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
