"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useI18n } from "@/context/I18nContext";
import { VOCABULARY_ERROR } from "@/types/error";
import { useAppErrorHandler } from "@/hooks/useAppErrorHandler";
import { useAuthUser } from "@/hooks/user/useAuthUser";
import { useVocabularyLists } from "@/hooks/user/useVocabularyLists";
import { formatMessage } from "@/lib/utils";
import LoginModal from "@/components/auth/LoginModal";
import CreateListForm from "./CreateListForm";
import VocabularyListItem from "./VocabularyListItem";

interface VocabularyListModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  expressionId: string;
  trigger?: React.ReactNode;
  onListAction?: (listId: string, added: boolean) => void;
}

export default function VocabularyListModal({
  isOpen,
  onOpenChange,
  expressionId,
  trigger,
  onListAction,
}: VocabularyListModalProps) {
  const {
    lists,
    createList,
    toggleInList,
    getContainingListIds,
    isLoading,
    isPro,
    setDefaultList,
  } = useVocabularyLists();
  const { dict } = useI18n();
  const { handleError } = useAppErrorHandler();
  const { user } = useAuthUser();
  const [savedListIds, setSavedListIds] = useState<Set<string>>(new Set());

  // Load saved state when modal opens
  useEffect(() => {
    if (isOpen && expressionId) {
      getContainingListIds(expressionId).then((ids) => {
        setSavedListIds(new Set(ids));
      });
    }
  }, [isOpen, expressionId, getContainingListIds]);

  const handleToggle = async (listId: string) => {
    const isCurrentlyIn = savedListIds.has(listId);

    // Optimistic Update
    const nextSet = new Set(savedListIds);
    if (isCurrentlyIn) {
      nextSet.delete(listId);
    } else {
      nextSet.add(listId);
    }
    setSavedListIds(nextSet);

    try {
      await toggleInList(listId, expressionId, isCurrentlyIn);
      onListAction?.(listId, !isCurrentlyIn);
    } catch (error) {
      console.error("Failed to toggle list:", error);
      // Revert
      setSavedListIds(new Set(savedListIds));
      handleError(error);
    }
  };

  const handleCreate = async (title: string) => {
    try {
      await createList(title);
    } catch (error: unknown) {
      handleError(error, VOCABULARY_ERROR.CREATE_FAILED);
    }
  };

  if (!user) {
    return (
      <LoginModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        trigger={trigger}
      />
    );
  }

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
      {trigger && (
        <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      )}
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
              {dict.vocabulary.modalTitle}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close className="rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-zinc-100 data-[state=open]:text-zinc-500 dark:ring-offset-zinc-950 dark:data-[state=open]:bg-zinc-800 dark:data-[state=open]:text-zinc-400 sm:cursor-pointer">
              <X className="h-4 w-4" />
              <span className="sr-only">{dict.common.close}</span>
            </DialogPrimitive.Close>
          </div>

          <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto py-2">
            {lists.map((list) => (
              <VocabularyListItem
                key={list.id}
                list={list}
                isSelected={savedListIds.has(list.id)}
                onToggle={() => handleToggle(list.id)}
                isDefault={list.is_default}
                onSetDefault={() => setDefaultList(list.id)}
              />
            ))}

            {lists.length === 0 && !isLoading && (
              <div className="py-4 text-center text-sm text-zinc-500">
                {dict.vocabulary.emptyState}
              </div>
            )}
          </div>

          <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <CreateListForm onCreate={handleCreate} isLoading={isLoading} />
            {!isPro && (
              <p className="mt-2 text-xs text-zinc-400 text-center">
                {formatMessage(dict.vocabulary.freePlanLimit, {
                  count: lists.length.toString(),
                  total: "5",
                })}
              </p>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
