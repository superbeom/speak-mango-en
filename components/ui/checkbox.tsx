"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <div className="relative flex items-center">
    <input
      type="checkbox"
      className="peer absolute h-4 w-4 opacity-0 cursor-pointer z-10"
      ref={ref}
      {...props}
    />
    <div
      className={cn(
        "h-4 w-4 shrink-0 rounded-sm border border-zinc-200 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-zinc-900 data-[state=checked]:text-zinc-50 dark:border-zinc-800 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300 dark:data-[state=checked]:bg-zinc-50 dark:data-[state=checked]:text-zinc-900 peer-checked:bg-zinc-900 peer-checked:border-zinc-900 dark:peer-checked:bg-zinc-50 dark:peer-checked:border-zinc-50 transition-colors flex items-center justify-center",
        className,
      )}
    >
      <Check className="h-3 w-3 text-white dark:text-black opacity-0 peer-checked:opacity-100 transition-opacity" />
    </div>
  </div>
));

Checkbox.displayName = "Checkbox";

export { Checkbox };
