"use client";

import { createContext, useContext, ReactNode } from "react";
import { Dictionary } from "@/i18n";

interface I18nContextType {
  locale: string;
  dict: Dictionary;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({
  locale,
  dict,
  children,
}: {
  locale: string;
  dict: Dictionary;
  children: ReactNode;
}) {
  return (
    <I18nContext.Provider value={{ locale, dict }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
