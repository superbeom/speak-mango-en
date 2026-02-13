"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useI18n } from "@/context/I18nContext";
import { VOCABULARY_ERROR } from "@/types/error";
import { useAppErrorHandler } from "@/hooks/useAppErrorHandler";
import { useAuthUser } from "@/hooks/user/useAuthUser";
import { useVocabularyLists } from "@/hooks/user/useVocabularyLists";
import {
  useVocabularyStore,
  selectSavedListIds,
} from "@/store/useVocabularyStore";
import LoginModal from "@/components/auth/LoginModal";
import EmptyListMessage from "./EmptyListMessage";
import CreateListForm from "./CreateListForm";
import VocabularyListItem from "./VocabularyListItem";
import VocabularyPlanStatus from "./VocabularyPlanStatus";

interface VocabularyListModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  expressionId?: string;
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
    setDefaultList,
  } = useVocabularyLists();
  const { dict } = useI18n();
  const { handleError } = useAppErrorHandler();
  const { user } = useAuthUser();

  // 스토어에서 바로 가져옴 (로컬 State 제거)
  const savedListIds = useVocabularyStore(
    selectSavedListIds(expressionId || ""),
  );

  // 토글 발생 시 대기 중인 서버 응답이 낙관적 업데이트를 덮어쓰지 않도록
  // generation counter로 stale 응답 무시
  const toggleGenRef = useRef(0);

  // 모달 열 때 최신 데이터 로드 → 스토어에 동기화
  useEffect(() => {
    if (isOpen && expressionId) {
      const gen = toggleGenRef.current;
      getContainingListIds(expressionId).then((ids) => {
        // 토글이 발생했으면 stale 응답이므로 무시
        if (gen === toggleGenRef.current) {
          useVocabularyStore.getState().syncSavedListIds(expressionId, ids);
        }
      });
    }
  }, [isOpen, expressionId, getContainingListIds]);

  const handleToggle = async (listId: string) => {
    const isCurrentlyIn = savedListIds.has(listId);

    // 대기 중인 getContainingListIds 응답 무효화
    toggleGenRef.current++;

    if (!expressionId) return;

    // save 버튼 상태를 즉시 반영 (서버 응답 대기 전)
    onListAction?.(listId, !isCurrentlyIn);

    try {
      // toggleInList 내부에서 optimisticToggle + savedListIds 업데이트 수행
      await toggleInList(listId, expressionId, isCurrentlyIn);
    } catch (error) {
      // 실패 시 롤백: save 상태 원복
      onListAction?.(listId, isCurrentlyIn);
      console.error("Failed to toggle list:", error);
      handleError(error);
    }
  };

  const handleCreate = async (title: string) => {
    try {
      await createList(title);
      // If used as a standalone creator (no expressionId), close after creation
      if (!expressionId) {
        onOpenChange(false);
      }
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
              {expressionId ? dict.vocabulary.modalTitle : dict.vocabulary.add}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close className="rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-zinc-100 data-[state=open]:text-zinc-500 dark:ring-offset-zinc-950 dark:data-[state=open]:bg-zinc-800 dark:data-[state=open]:text-zinc-400 sm:cursor-pointer">
              <X className="h-4 w-4" />
              <span className="sr-only">{dict.common.close}</span>
            </DialogPrimitive.Close>
          </div>

          <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto py-2">
            {lists.length === 0 ? (
              <EmptyListMessage message={dict.vocabulary.emptyState} />
            ) : (
              lists.map((list) => (
                <VocabularyListItem
                  key={list.id}
                  list={list}
                  isSelected={expressionId ? savedListIds.has(list.id) : false}
                  onToggle={() => handleToggle(list.id)}
                  isDefault={list.is_default}
                  onSetDefault={() => setDefaultList(list.id)}
                  disabled={!expressionId}
                />
              ))
            )}
          </div>

          <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <CreateListForm
              onCreate={handleCreate}
              disabled={lists.length >= 5}
            />
            {/* 
              TODO: Currently we don't have a paid version, so we show simple limit status.
              'vocabulary.freePlanLimit' (e.g., "Free Plan: 3 / 5 lists used") is kept for future use.
            */}
            <VocabularyPlanStatus currentCount={lists.length} />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
