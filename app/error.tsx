"use client";

import { useEffect } from "react";
import { RefreshCcw } from "lucide-react";
import { useI18n } from "@/context/I18nContext";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { dict } = useI18n();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
      <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-full mb-6">
        <div className="w-12 h-12 text-red-600 dark:text-red-400">
          <svg
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
      </div>
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
        {dict.error.title}
      </h2>
      <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-md">
        {dict.error.description}
      </p>
      <button
        onClick={() => reset()}
        className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 rounded-xl font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-95 sm:cursor-pointer"
      >
        <RefreshCcw className="w-4 h-4" />
        {dict.error.retry}
      </button>
    </div>
  );
}
