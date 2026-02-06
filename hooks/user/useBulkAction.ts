import { useState } from "react";

export const BULK_ACTION_TYPE = {
  COPY: "copy",
  MOVE: "move",
} as const;

export type BulkActionType =
  (typeof BULK_ACTION_TYPE)[keyof typeof BULK_ACTION_TYPE];

interface BulkActionState {
  type: BulkActionType;
  isOpen: boolean;
}

export function useBulkAction() {
  const [bulkAction, setBulkAction] = useState<BulkActionState | null>(null);

  const openBulkAction = (type: BulkActionType) => {
    setBulkAction({ type, isOpen: true });
  };

  const closeBulkAction = () => {
    setBulkAction(null);
  };

  const setOpen = (isOpen: boolean) => {
    if (!isOpen) {
      setBulkAction(null);
    } else if (bulkAction) {
      setBulkAction({ ...bulkAction, isOpen: true }); // Should technically stay same type
    }
  };

  return {
    bulkAction, // Expose raw state if needed for type check
    isOpen: !!bulkAction?.isOpen,
    type: bulkAction?.type,
    openCopy: () => openBulkAction(BULK_ACTION_TYPE.COPY),
    openMove: () => openBulkAction(BULK_ACTION_TYPE.MOVE),
    close: closeBulkAction,
    onOpenChange: setOpen,
  };
}
