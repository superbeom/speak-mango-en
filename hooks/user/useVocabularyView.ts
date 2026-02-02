import { useState, useCallback } from "react";
import { VIEW_MODE, ViewMode } from "@/constants/ui";

export function useVocabularyView() {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(VIEW_MODE.FULL);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode((prev) => {
      if (prev) {
        setSelectedIds(new Set());
        setViewMode(VIEW_MODE.FULL);
      }
      return !prev;
    });
  }, []);

  const toggleItem = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const setMode = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  return {
    isSelectionMode,
    viewMode,
    selectedIds,
    toggleSelectionMode,
    toggleItem,
    setViewMode: setMode,
  };
}
