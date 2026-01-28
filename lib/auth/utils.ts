import { auth } from "./config";

/**
 * 서버 사이드(Server Components, Server Actions, Route Handlers) 전용 인증 헬퍼
 *
 * NextAuth의 auth() 기능을 래핑하여, 자주 사용되는 인증 상태 정보를
 * 더 직관적인 필드명(userId, isPro, isAuthenticated 등)으로 가공하여 반환합니다.
 *
 * @returns {Object} auth - 서버 사이드 인증 정보 객체
 * @returns {Object|null} auth.session - NextAuth 세션 원본 객체
 * @returns {Object|null} auth.user - 세션 내 사용자 객체
 * @returns {string|undefined} auth.userId - 사용자의 고유 ID (UUID)
 * @returns {boolean} auth.isAuthenticated - 로그인 여부 (user 존재 여부)
 * @returns {boolean} auth.isPro - 유료(Pro) 티어 여부
 *
 * @example
 * // Server Action 예시
 * export async function myAction() {
 *   const { userId, isPro, isAuthenticated } = await getAuthSession();
 *   if (!isAuthenticated) throw new Error("로그인이 필요합니다.");
 *   if (!isPro) throw new Error("Premium 기능입니다.");
 *   // ... logic using userId
 * }
 */
export async function getAuthSession() {
  const session = await auth();
  const user = session?.user;

  return {
    session,
    user,
    userId: user?.id,
    isAuthenticated: !!user,
    isPro: user?.tier === "pro",
  };
}
