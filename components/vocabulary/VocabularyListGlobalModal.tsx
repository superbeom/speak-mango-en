"use client";

import { useVocabularyModalStore } from "@/store/useVocabularyModalStore";
import VocabularyListModal from "./VocabularyListModal";

export default function VocabularyListGlobalModal() {
  const { isOpen, expressionId, closeModal, onListAction } =
    useVocabularyModalStore();

  return (
    <VocabularyListModal
      isOpen={isOpen}
      onOpenChange={(open: boolean) => !open && closeModal()}
      expressionId={expressionId}
      onListAction={onListAction}
    />
  );
}
