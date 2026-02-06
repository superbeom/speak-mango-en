"use client";

import { useState, useCallback } from "react";
import { Plus, Loader2 } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { VOCABULARY_ERROR } from "@/types/error";
import { useAppErrorHandler } from "@/hooks/useAppErrorHandler";
import { cn } from "@/lib/utils";

interface CreateListFormProps {
  onCreate: (title: string) => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function CreateListForm({
  onCreate,
  isLoading: isExternalLoading,
  disabled,
}: CreateListFormProps) {
  const { dict } = useI18n();
  const { handleError } = useAppErrorHandler();
  const [title, setTitle] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLoading = isExternalLoading || isSubmitting;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim() || isLoading) return;

      setIsSubmitting(true);
      try {
        await onCreate(title);
        setTitle("");
        setIsExpanded(false);
      } catch (error: unknown) {
        handleError(error, VOCABULARY_ERROR.CREATE_FAILED);
      } finally {
        setIsSubmitting(false);
      }
    },
    [title, isLoading, onCreate, handleError],
  );

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        disabled={disabled}
        className="flex w-full items-center gap-2 rounded-lg border border-dashed border-zinc-300 p-3 text-sm text-zinc-500 focus:outline-none enabled:hover:bg-zinc-50 enabled:hover:text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:enabled:hover:bg-zinc-800 dark:enabled:hover:text-zinc-50 sm:cursor-pointer disabled:sm:cursor-not-allowed"
      >
        <Plus className="h-4 w-4" />
        {dict.vocabulary.createNew}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full gap-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={dict.vocabulary.placeholder}
        disabled={isLoading}
        className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm input-focus-brand disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
        autoFocus
      />
      <button
        type="submit"
        disabled={!title.trim() || isLoading}
        className={cn(
          "flex items-center justify-center min-w-[60px] rounded-lg px-4 py-2 text-sm font-medium btn-brand-indigo disabled:opacity-50",
          isLoading
            ? "sm:cursor-wait"
            : title.trim()
              ? "sm:cursor-pointer"
              : "sm:cursor-not-allowed",
        )}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          dict.vocabulary.add
        )}
      </button>
      <button
        type="button"
        onClick={() => setIsExpanded(false)}
        disabled={isLoading}
        className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 enabled:hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-300 dark:enabled:hover:bg-zinc-800 sm:cursor-pointer disabled:sm:cursor-not-allowed"
      >
        {dict.vocabulary.cancel}
      </button>
    </form>
  );
}
