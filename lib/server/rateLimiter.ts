/**
 * In-Memory Sliding Window Rate Limiter
 *
 * 서버 액션 및 인증 라우트에 대한 요청 빈도를 제한합니다.
 * 외부 의존성(Redis 등) 없이 동작하며, Vercel Serverless 환경에 최적화되어 있습니다.
 *
 * @see docs/technical_implementation/rate_limiting.md
 */

import { createAppError, COMMON_ERROR } from "@/types/error";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RateLimitConfig {
  /** 윈도우 내 최대 허용 요청 수 */
  limit: number;
  /** 윈도우 크기 (밀리초) */
  windowMs: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** 기본 설정: 분당 60회 */
const DEFAULT_CONFIG: RateLimitConfig = {
  limit: 60,
  windowMs: 60_000,
};

/** 메모리 정리 주기: 5분 */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

/**
 * In-Memory 저장소: key → 요청 타임스탬프 배열
 *
 * Vercel Serverless 환경에서 함수 인스턴스가 "Warm" 상태인 동안 유지됩니다.
 * Cold Start 시 자동으로 리셋됩니다.
 */
const store = new Map<string, number[]>();

// ---------------------------------------------------------------------------
// Periodic Cleanup
// ---------------------------------------------------------------------------

/** 마지막 정리 시각 */
let lastCleanup = Date.now();

/**
 * 만료된 윈도우 데이터를 정리하여 메모리 누수를 방지합니다.
 * 매 요청마다 호출되지만, CLEANUP_INTERVAL_MS 이내에는 실제 정리가 실행되지 않습니다.
 */
function cleanupIfNeeded(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;

  lastCleanup = now;

  // 가장 긴 윈도우(기본 60초)보다 오래된 엔트리를 제거
  const maxWindowMs = DEFAULT_CONFIG.windowMs;
  const cutoff = now - maxWindowMs;

  for (const [key, timestamps] of store) {
    const valid = timestamps.filter((t) => t > cutoff);
    if (valid.length === 0) {
      store.delete(key);
    } else {
      store.set(key, valid);
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * 주어진 키(userId 또는 IP)에 대해 Rate Limit을 확인합니다.
 *
 * Sliding Window Counter 알고리즘을 사용하여 윈도우 경계 문제를 방지합니다.
 *
 * @param key - Rate Limit 식별자 (예: `action:${userId}`, `auth:${ip}`)
 * @param config - 커스텀 Rate Limit 설정 (선택)
 * @throws {AppError} RATE_LIMIT_EXCEEDED - 제한 초과 시
 *
 * @example
 * // Server Action에서 사용
 * checkRateLimit(`action:${userId}`);
 *
 * // 커스텀 설정
 * checkRateLimit(`auth:${ip}`, { limit: 20, windowMs: 60_000 });
 */
export function checkRateLimit(
  key: string,
  config?: Partial<RateLimitConfig>,
): void {
  // 주기적 메모리 정리
  cleanupIfNeeded();

  const { limit, windowMs } = { ...DEFAULT_CONFIG, ...config };
  const now = Date.now();
  const windowStart = now - windowMs;

  // 현재 윈도우 내 요청만 필터링
  const timestamps = store.get(key) || [];
  const windowTimestamps = timestamps.filter((t) => t > windowStart);

  // 제한 초과 검사
  if (windowTimestamps.length >= limit) {
    throw createAppError(COMMON_ERROR.RATE_LIMIT_EXCEEDED);
  }

  // 현재 요청 타임스탬프 기록
  windowTimestamps.push(now);
  store.set(key, windowTimestamps);
}
