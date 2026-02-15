import { ReactNode } from "react";

/**
 * RefreshGuard
 *
 * SWR revalidation 등 데이터 갱신 중일 때 콘텐츠를 반투명 + 클릭 차단 처리하여
 * 사용자에게 로딩 피드백을 제공하는 래퍼 컴포넌트.
 */
export default function RefreshGuard({
  isRefreshing,
  children,
}: {
  isRefreshing: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`transition-opacity duration-300 ${
        isRefreshing ? "opacity-50 pointer-events-none" : "opacity-100"
      }`}
    >
      {children}
    </div>
  );
}
