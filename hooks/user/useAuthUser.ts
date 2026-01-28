"use client";

import { useSession } from "next-auth/react";

/**
 * 클라이언트 컴포넌트에서 사용자 인증 정보를 가져오는 훅
 *
 * @returns {Object} auth - 인증 정보 객체
 * @returns {Object|null} auth.user - 사용자 정보 (id, name, email, tier, subscriptionEndDate 포함)
 * @returns {string} auth.status - 로딩 상태 ("loading" | "authenticated" | "unauthenticated")
 * @returns {boolean} auth.isLoading - 세션 로딩 중 여부
 * @returns {boolean} auth.isAuthenticated - 로그인 여부
 * @returns {boolean} auth.isPro - 유료(Pro) 티어 여부
 *
 * @example
 * const { user, isAuthenticated, isLoading, isPro } = useAuthUser();
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (!isAuthenticated) return <div>Please login</div>;
 *
 * return (
 *   <div>
 *     Welcome {user?.name}!
 *     {isPro ? <span>Premium Member</span> : <span>Free Member</span>}
 *   </div>
 * );
 */
export function useAuthUser() {
  const { data: session, status } = useSession();

  return {
    user: session?.user ?? null,
    status,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    isPro: session?.user?.tier === "pro",
  };
}
