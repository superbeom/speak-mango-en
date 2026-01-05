import Link from "next/link";
import { cn } from "@/lib/utils";

interface TagProps {
  label: string;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

export default function Tag({
  label,
  href,
  onClick,
  className = "",
}: TagProps) {
  const baseStyles =
    "inline-flex items-center rounded-lg bg-subtle px-2.5 py-1 text-xs font-semibold text-zinc-500 border border-subtle transition-all hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:text-zinc-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 dark:hover:border-blue-800 cursor-pointer";

  if (href) {
    return (
      <Link href={href} className={cn(baseStyles, className)}>
        #{label}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(baseStyles, className)}
    >
      #{label}
    </button>
  );
}
