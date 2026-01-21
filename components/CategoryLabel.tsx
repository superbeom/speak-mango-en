import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryLabelProps {
  label: string;
  icon: LucideIcon;
  textStyles?: string;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

export default function CategoryLabel({
  label,
  icon: Icon,
  textStyles = "",
  href,
  onClick,
  className = "",
}: CategoryLabelProps) {
  const baseStyles = cn(
    "group flex items-center gap-1.5 text-xs font-black uppercase tracking-wider transition-colors z-10 cursor-pointer",
    textStyles,
    className,
  );

  const content = (
    <>
      <Icon className="w-3.5 h-3.5 transition-transform duration-300 safe-hover-rotate-12" />
      {label}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={baseStyles}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={baseStyles}>
      {content}
    </button>
  );
}
