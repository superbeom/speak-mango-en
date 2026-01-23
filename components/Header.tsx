"use client";

import { ReactNode } from "react";
import { useScroll } from "@/hooks/useScroll";
import { cn } from "@/lib/utils";

interface HeaderProps {
  children: ReactNode;
  className?: string;
  scrolledClassName?: string;
}

export default function Header({
  children,
  className,
  scrolledClassName,
}: HeaderProps) {
  const isScrolled = useScroll(80);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 h-(--header-height) backdrop-blur-md transition-colors duration-200",
        "bg-white/80 dark:bg-black/80 border-layout",
        className,
        isScrolled && scrolledClassName,
      )}
    >
      <div className="mx-auto max-w-layout px-4 py-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </header>
  );
}
