"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Expression } from "@/types/database";
import { ExpressionFilters } from "@/lib/expressions";

interface ExpressionState {
  items: Expression[];
  page: number;
  hasMore: boolean;
  filters: ExpressionFilters;
  scrollPosition: number;
}

interface ExpressionContextType {
  state: ExpressionState;
  setState: (state: ExpressionState) => void;
  // 특정 필드만 업데이트하는 헬퍼
  updateState: (updates: Partial<ExpressionState>) => void;
}

const ExpressionContext = createContext<ExpressionContextType | undefined>(
  undefined
);

export function ExpressionProvider({ children }: { children: ReactNode }) {
  // 초기 상태는 비워둡니다. 컴포넌트 마운트 시 채워집니다.
  const [state, setState] = useState<ExpressionState>({
    items: [],
    page: 1,
    hasMore: true,
    filters: {},
    scrollPosition: 0,
  });

  const updateState = (updates: Partial<ExpressionState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  return (
    <ExpressionContext.Provider value={{ state, setState, updateState }}>
      {children}
    </ExpressionContext.Provider>
  );
}

export function useExpressionStore() {
  const context = useContext(ExpressionContext);
  if (!context) {
    throw new Error(
      "useExpressionStore must be used within an ExpressionProvider"
    );
  }
  return context;
}
