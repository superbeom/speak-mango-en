import Link from "next/link";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";

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
  return (
    <Link
      href={ROUTES.EXPRESSION_DETAIL(expressionId)}
      target="_blank"
      className={cn(
        "inline-flex items-center justify-center px-4 py-2 rounded-xl font-bold bg-zinc-600 text-zinc-100 hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-600 dark:hover:bg-zinc-300 transition-colors",
        className,
      )}
    >
      {label}
    </Link>
  );
}
