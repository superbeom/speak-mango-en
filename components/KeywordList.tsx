import { Tag } from "lucide-react";

interface KeywordListProps {
  keywords: string[];
  title?: string;
}

export default function KeywordList({
  keywords,
  title = "Related Topics",
}: KeywordListProps) {
  if (!keywords || keywords.length === 0) return null;

  return (
    <div className="mt-12 pt-6">
      {/* Title with icon */}
      <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
        <Tag className="w-3 h-3" />
        {title}
      </h3>

      {/* Visual Tag Cloud */}
      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword, index) => (
          <span
            key={index}
            className="inline-flex items-center px-2.5 py-1 rounded-md bg-zinc-50 text-xs text-zinc-500 border border-zinc-100 dark:bg-zinc-800/50 dark:text-zinc-400 dark:border-zinc-800/50 cursor-default select-none"
          >
            {keyword}
          </span>
        ))}
      </div>
    </div>
  );
}
