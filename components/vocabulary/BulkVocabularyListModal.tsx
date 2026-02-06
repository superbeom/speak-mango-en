"use client";

import { useState } from "react";
import { X, Check, Loader2, Star } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useI18n } from "@/context/I18nContext";
import { useVocabularyLists } from "@/hooks/user/useVocabularyLists";
import { cn, formatMessage } from "@/lib/utils";
import { SkeletonVocabularyList } from "@/components/ui/Skeletons";
import CreateListForm from "./CreateListForm";
import VocabularyPlanStatus from "./VocabularyPlanStatus";

interface BulkVocabularyListModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  actionLabel: string;
  onSubmit: (listId: string) => Promise<void>;
  currentListId?: string; // To disable moving/copying to the same list if needed
}

export default function BulkVocabularyListModal({
  isOpen,
  onOpenChange,
  title,
  actionLabel,
  onSubmit,
  currentListId,
}: BulkVocabularyListModalProps) {
  const { lists, createList, isLoading } = useVocabularyLists();
  const { dict } = useI18n();
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedListId) return;

    setIsSubmitting(true);
    try {
      await onSubmit(selectedListId);
      onOpenChange(false);
      setSelectedListId(null);
    } catch (error) {
      console.error("Failed to submit bulk action:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreate = async (title: string) => {
    try {
      const newListId = await createList(title);
      // Automatically select the newly created list
      if (newListId) setSelectedListId(newListId);
    } catch (error) {
      console.error("Failed to create list:", error);
    }
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          onClick={(e) => {
            e.stopPropagation();
            onOpenChange(false);
          }}
        />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-50 flex w-[92vw] max-w-sm translate-x-[-50%] translate-y-[-50%] flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 dark:border-zinc-800 dark:bg-zinc-950"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <DialogPrimitive.Title className="text-lg font-semibold tracking-tight">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close className="rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-zinc-100 data-[state=open]:text-zinc-500 dark:ring-offset-zinc-950 dark:data-[state=open]:bg-zinc-800 dark:data-[state=open]:text-zinc-400 sm:cursor-pointer">
              <X className="h-4 w-4" />
              <span className="sr-only">{dict.common.close}</span>
            </DialogPrimitive.Close>
          </div>

          <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto py-2">
            {isLoading && lists.length === 0 ? (
              <SkeletonVocabularyList />
            ) : (
              lists.map((list) => {
                const isDisabled = list.id === currentListId;
                const isSelected = selectedListId === list.id;

                return (
                  <button
                    key={list.id}
                    onClick={() => {
                      if (isDisabled) return;
                      if (isSelected) {
                        setSelectedListId(null);
                      } else {
                        setSelectedListId(list.id);
                      }
                    }}
                    disabled={isDisabled}
                    className={cn(
                      "vocab-list-item",
                      isDisabled
                        ? "vocab-list-item-disabled"
                        : "sm:cursor-pointer",
                      !isDisabled && isSelected
                        ? "vocab-list-item-selected"
                        : !isDisabled && "vocab-list-item-default",
                    )}
                  >
                    <div className="flex flex-col items-start gap-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "font-medium text-sm",
                            isSelected
                              ? "vocab-list-text-selected"
                              : "vocab-list-text-default",
                          )}
                        >
                          {list.title}
                        </span>
                        {list.is_default && (
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />
                        )}
                      </div>
                      <span className="text-xs text-zinc-400">
                        {formatMessage(dict.vocabulary.itemsCount, {
                          count: list.item_count?.toString() || "0",
                        })}
                      </span>
                    </div>

                    {isSelected && (
                      <div className="vocab-list-check">
                        <Check size={18} />
                      </div>
                    )}
                  </button>
                );
              })
            )}

            {lists.length === 0 && !isLoading && (
              <div className="py-4 text-center text-sm text-zinc-500">
                {dict.vocabulary.emptyState}
              </div>
            )}
          </div>

          <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800 space-y-4">
            <CreateListForm
              onCreate={handleCreate}
              isLoading={isLoading}
              disabled={lists.length >= 5}
            />

            <VocabularyPlanStatus
              currentCount={lists.length}
              isLoading={isLoading}
            />

            <button
              onClick={handleSubmit}
              disabled={!selectedListId || isSubmitting}
              className={cn(
                "w-full py-3 rounded-xl font-medium transition-all text-sm",
                selectedListId && !isSubmitting
                  ? "btn-brand-indigo shadow-brand-indigo-lg active:scale-[0.98] sm:cursor-pointer"
                  : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed",
              )}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                actionLabel
              )}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
