import { createAppError, COMMON_ERROR } from "@/types/error";
import { getAuthSession } from "@/lib/auth/utils";
import { checkRateLimit } from "./rateLimiter";

type AuthAction<T extends unknown[], R> = (
  userId: string,
  isPro: boolean,
  ...args: T
) => Promise<R>;

/**
 * Pro 유저 전용 서버 액션 래퍼 함수입니다.
 * 로그인 여부, Pro 권한, 요청 빈도(Rate Limit)를 자동으로 확인합니다.
 *
 * @param action - 실행할 비즈니스 로직 함수 (첫 번째 인자로 userId와 isPro를 받습니다)
 */
export function withPro<T extends unknown[], R>(action: AuthAction<T, R>) {
  return async (...args: T): Promise<R> => {
    const { userId, isPro } = await getAuthSession();

    if (!userId) {
      throw createAppError(COMMON_ERROR.UNAUTHORIZED);
    }

    if (!isPro) {
      throw createAppError(COMMON_ERROR.PREMIUM_REQUIRED);
    }

    // Rate Limit: 유저당 분당 60회
    checkRateLimit(`action:${userId}`);

    return action(userId, isPro, ...args);
  };
}
