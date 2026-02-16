"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { DIALOG_MODE, DialogMode, DialogVariant } from "@/constants/ui";

interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: DialogVariant;
  onConfirm: () => void;
}

interface AlertOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: DialogVariant;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => void;
  alert: (options: AlertOptions) => void;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<
    (ConfirmOptions & { mode: DialogMode }) | null
  >(null);

  const confirm = useCallback((newOptions: ConfirmOptions) => {
    setOptions({ ...newOptions, mode: DIALOG_MODE.CONFIRM });
    setIsOpen(true);
  }, []);

  const alert = useCallback((newOptions: AlertOptions) => {
    setOptions({ ...newOptions, onConfirm: () => {}, mode: DIALOG_MODE.ALERT });
    setIsOpen(true);
  }, []);

  const handleConfirm = useCallback(() => {
    if (options?.onConfirm) {
      options.onConfirm();
    }
    setIsOpen(false);
  }, [options]);

  return (
    <ConfirmContext.Provider value={{ confirm, alert }}>
      {children}
      {options && (
        <ConfirmDialog
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          title={options.title}
          description={options.description}
          confirmLabel={options.confirmLabel}
          cancelLabel={
            options.mode === DIALOG_MODE.CONFIRM
              ? options.cancelLabel
              : undefined
          }
          variant={options.variant}
          onConfirm={handleConfirm}
          mode={options.mode}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
}
