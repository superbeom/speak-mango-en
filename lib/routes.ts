/**
 * 앱 내의 모든 경로를 중앙 관리하는 파일입니다.
 */

export const ROUTES = {
  HOME: "/",
  EXPRESSION_DETAIL: (id: string) => `/expressions/${id}`,
  STUDIO: "/studio",
} as const;

/**
 * 필터 조합에 따른 홈 경로를 생성합니다.
 * 각 필터는 독립적으로 존재하거나 서로 조합될 수 있으므로(예: 특정 카테고리 내 검색),
 * 상호 배타적인 else if나 switch 대신 독립적인 if 문을 사용합니다.
 */
export function getHomeWithFilters(filters: {
  category?: string;
  search?: string;
  tag?: string;
}) {
  const params = new URLSearchParams();

  if (filters.category && filters.category !== "all") {
    params.set("category", filters.category);
  }
  if (filters.search) {
    params.set("search", filters.search);
  }
  if (filters.tag) {
    params.set("tag", filters.tag);
  }

  const queryString = params.toString();
  return queryString ? `${ROUTES.HOME}?${queryString}` : ROUTES.HOME;
}
