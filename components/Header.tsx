"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  children: ReactNode;
  className?: string;
}

export default function Header({ children, className }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-black/80",
        className
      )}
    >
      <div className="mx-auto max-w-layout px-4 py-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </header>
  );
}
