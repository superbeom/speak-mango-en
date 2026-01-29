"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { ToastType, TOAST_TYPE } from "@/types/toast";
import Toast from "@/components/ui/Toast";

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
    isVisible: boolean;
  }>({
    message: "",
    type: TOAST_TYPE.SUCCESS,
    isVisible: false,
  });

  const showToast = useCallback(
    (message: string, type: ToastType = TOAST_TYPE.SUCCESS) => {
      setToast({ message, type, isVisible: true });
      setTimeout(() => {
        setToast((prev) => ({ ...prev, isVisible: false }));
      }, 2000);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
