import { cn } from "@/lib/utils";

interface VocabularyDetailHeaderProps {
  title: string;
  itemCount: number;
  className?: string;
}

export default function VocabularyDetailHeader({
  title,
  itemCount,
  className,
}: VocabularyDetailHeaderProps) {
  return (
    <div className={cn("mb-8", className)}>
      <div className="flex items-end gap-3 min-w-0">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 truncate">
          {title}
        </h1>
        <span className="mb-1.5 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-500 dark:text-zinc-400">
          {itemCount}
        </span>
      </div>
    </div>
  );
}
