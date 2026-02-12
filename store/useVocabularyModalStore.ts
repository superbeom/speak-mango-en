import { create } from "zustand";

interface VocabularyModalStore {
  isOpen: boolean;
  expressionId: string | undefined;
  onListAction?: (listId: string, added: boolean) => void;
  openModal: (expressionId?: string) => void;
  closeModal: () => void;
  setOnListAction: (
    callback?: (listId: string, added: boolean) => void,
  ) => void;
}

export const useVocabularyModalStore = create<VocabularyModalStore>((set) => ({
  isOpen: false,
  expressionId: undefined,
  onListAction: undefined,
  openModal: (expressionId) => set({ isOpen: true, expressionId }),
  closeModal: () =>
    set({ isOpen: false, expressionId: undefined, onListAction: undefined }),
  setOnListAction: (callback) => set({ onListAction: callback }),
}));
