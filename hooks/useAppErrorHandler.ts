"use client";

import { useCallback } from "react";
import { useI18n } from "@/context/I18nContext";
import { useToast } from "@/context/ToastContext";
import {
  isAppError,
  VocabularyErrorCode,
  ActionErrorCode,
} from "@/types/error";
import { TOAST_TYPE } from "@/types/toast";

/**
 * 전역 에러 핸들링을 위한 커스텀 훅
 * AppError를 다국어 메시지로 변환하여 토스트로 보여줍니다.
 */
export function useAppErrorHandler() {
  const { dict } = useI18n();
  const { showToast } = useToast();

  const handleError = useCallback(
    (error: unknown, fallbackCode?: VocabularyErrorCode | ActionErrorCode) => {
      if (isAppError(error)) {
        const code = error.message as string;
        // 1. 에러 코드에 해당하는 다국어 메시지 찾기 (런타임 체크)
        // 2. 없으면 일반 에러 메시지(description) 사용
        const message =
          code in dict.error.codes
            ? dict.error.codes[code as keyof typeof dict.error.codes]
            : dict.error.description;
        showToast(message, TOAST_TYPE.ERROR);
      } else {
        // AppError가 아닌 일반 에러일 경우
        // fallbackCode가 있으면 해당 코드의 메시지 사용, 없으면 일반 에러 메시지 사용
        const fallbackMessage = fallbackCode
          ? dict.error.codes[fallbackCode as keyof typeof dict.error.codes]
          : dict.error.description;

        showToast(fallbackMessage || dict.error.description, TOAST_TYPE.ERROR);
      }
    },
    [showToast, dict],
  );

  return { handleError };
}
