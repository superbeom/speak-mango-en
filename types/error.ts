/**
 * 애플리케이션 레벨의 표준 에러 인터페이스
 * 애플리케이션 전반에서 일관된 에러 처리를 위해 사용됩니다.
 */
export interface AppError {
  message: string; // 사람이 읽을 수 있는 에러 메시지 또는 에러 코드
  code?: string; // 프로그램 방식의 에러 처리를 위한 선택적 에러 코드
  status?: number; // 선택적 HTTP 상태 코드
}

/**
 * 공통으로 사용되는 에러 코드
 */
export type CommonErrorCode = "UNAUTHORIZED";

/**
 * 사용자 활동(저장, 학습 등) 관련 작업을 위한 에러 코드
 */
export type ActionErrorCode =
  | CommonErrorCode
  | "ACTION_TOGGLE_FAILED"
  | "ACTION_SYNC_FAILED";

/**
 * 단어장 관련 작업을 위한 에러 코드
 * 이 코드들은 다국어 에러 메시지를 위한 로케일 파일의 키로 사용됩니다.
 */
export type VocabularyErrorCode =
  | CommonErrorCode
  | "VOCABULARY_FETCH_FAILED"
  | "VOCABULARY_CREATE_FAILED"
  | "VOCABULARY_PREMIUM_REQUIRED"
  | "VOCABULARY_ADD_FAILED"
  | "VOCABULARY_UPDATE_FAILED"
  | "VOCABULARY_REMOVE_FAILED"
  | "VOCABULARY_LIMIT_REACHED"
  | "VOCABULARY_NOT_FOUND";

/**
 * 공통 에러 코드 상수
 */
export const COMMON_ERROR = {
  UNAUTHORIZED: "UNAUTHORIZED",
} as const;

/**
 * 사용자 활동 에러 코드 상수
 */
export const ACTION_ERROR = {
  UNAUTHORIZED: COMMON_ERROR.UNAUTHORIZED,
  TOGGLE_FAILED: "ACTION_TOGGLE_FAILED",
  SYNC_FAILED: "ACTION_SYNC_FAILED",
} as const;

/**
 * 단어장 에러 코드 상수
 */
export const VOCABULARY_ERROR = {
  UNAUTHORIZED: COMMON_ERROR.UNAUTHORIZED,
  FETCH_FAILED: "VOCABULARY_FETCH_FAILED",
  CREATE_FAILED: "VOCABULARY_CREATE_FAILED",
  PREMIUM_REQUIRED: "VOCABULARY_PREMIUM_REQUIRED",
  ADD_FAILED: "VOCABULARY_ADD_FAILED",
  UPDATE_FAILED: "VOCABULARY_UPDATE_FAILED",
  REMOVE_FAILED: "VOCABULARY_REMOVE_FAILED",
  LIMIT_REACHED: "VOCABULARY_LIMIT_REACHED",
  NOT_FOUND: "VOCABULARY_NOT_FOUND",
} as const;

/**
 * 알 수 없는 에러가 AppError인지 확인하는 타입 가드
 * @param error - 확인할 에러
 * @returns 에러가 AppError인 경우 true
 */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as Record<string, unknown>).message === "string"
  );
}

/**
 * 에러 코드로 표준화된 AppError를 생성합니다.
 * 에러 코드는 i18n 조회를 위한 메시지와 코드 역할을 모두 수행합니다.
 * @param code - 에러 코드
 * @returns 메시지와 코드에 모두 해당 코드가 설정된 AppError 객체
 */
export function createAppError(
  code: VocabularyErrorCode | ActionErrorCode,
): AppError {
  return {
    message: code,
    code,
  };
}
