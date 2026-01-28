"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateListFormProps {
  onCreate: (title: string) => Promise<void>;
  isLoading?: boolean;
}

export default function CreateListForm({
  onCreate,
  isLoading,
}: CreateListFormProps) {
  const [title, setTitle] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isLoading) return;

    await onCreate(title);
    setTitle("");
    setIsExpanded(false);
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="flex w-full items-center gap-2 rounded-lg border border-dashed border-zinc-300 p-3 text-sm text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 sm:cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        Create new list
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full gap-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="List name (e.g., Travel)"
        className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
        autoFocus
      />
      <button
        type="submit"
        disabled={!title.trim() || isLoading}
        className={cn(
          "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50",
          isLoading
            ? "sm:cursor-wait"
            : title.trim()
              ? "sm:cursor-pointer"
              : "sm:cursor-not-allowed",
        )}
      >
        Add
      </button>
      <button
        type="button"
        onClick={() => setIsExpanded(false)}
        className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:cursor-pointer"
      >
        Cancel
      </button>
    </form>
  );
}
