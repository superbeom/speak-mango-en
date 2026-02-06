import { useI18n } from "@/context/I18nContext";
import { BULK_ACTION_TYPE, BulkActionType } from "@/hooks/user/useBulkAction";
import BulkVocabularyListModal from "@/components/vocabulary/BulkVocabularyListModal";

interface BulkActionModalWrapperProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  type: BulkActionType;
  currentListId?: string;
  onSubmit: (targetListId: string) => Promise<void>;
}

export default function BulkActionModalWrapper({
  isOpen,
  onOpenChange,
  type,
  currentListId,
  onSubmit,
}: BulkActionModalWrapperProps) {
  const { dict } = useI18n();

  return (
    <BulkVocabularyListModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={
        type === BULK_ACTION_TYPE.COPY
          ? dict.vocabulary.copy
          : dict.vocabulary.move
      }
      actionLabel={
        type === BULK_ACTION_TYPE.COPY
          ? dict.vocabulary.copy
          : dict.vocabulary.move
      }
      currentListId={currentListId}
      onSubmit={onSubmit}
    />
  );
}
