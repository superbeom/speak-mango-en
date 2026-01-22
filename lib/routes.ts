import { BASE_URL } from "@/constants";

/**
 * 앱 내의 모든 경로를 중앙 관리하는 파일입니다.
 */
export const ROUTES = {
  HOME: "/",
  EXPRESSION_DETAIL: (id: string) => `/expressions/${id}`,
  STUDIO: "/studio",
  QUIZ: "/quiz",
} as const;

/**
 * SEO 메타데이터 및 오픈 그래프(Open Graph) 태그에 사용되는 절대 경로(Canonical URL)를 관리합니다.
 * 환경 변수(BASE_URL)를 포함한 완전한 URL 문자열을 반환하므로,
 * 검색 엔진 크롤러나 소셜 미디어 봇이 참조하기에 적합합니다.
 */
export const CANONICAL_URLS = {
  /**
   * 표현 상세 페이지의 절대 경로를 반환합니다.
   * 예: https://speakmango.com/expressions/123
   */
  EXPRESSION_DETAIL: (id: string) =>
    `${BASE_URL}${ROUTES.EXPRESSION_DETAIL(id)}`,

  /**
   * 퀴즈 페이지의 절대 경로를 반환합니다.
   * 예: https://speakmango.com/quiz
   */
  QUIZ: () => `${BASE_URL}${ROUTES.QUIZ}`,
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
