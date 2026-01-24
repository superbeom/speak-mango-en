"use client";

import { useSession } from "next-auth/react";

/**
 * 클라이언트 컴포넌트에서 사용자 인증 정보를 가져오는 훅
 *
 * @returns {Object} 세션 정보
 * @returns {Object|null} session.user - 사용자 정보 (id, name, email, tier, subscriptionEndDate 포함)
 * @returns {string} session.status - 로딩 상태 ("loading" | "authenticated" | "unauthenticated")
 *
 * @example
 * const { user, status } = useAuthUser();
 *
 * if (status === "loading") return <div>Loading...</div>;
 * if (status === "unauthenticated") return <div>Please login</div>;
 *
 * return <div>Welcome {user.name}! Your tier: {user.tier}</div>;
 */
export function useAuthUser() {
  const { data: session, status } = useSession();

  return {
    user: session?.user ?? null,
    status,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
  };
}
