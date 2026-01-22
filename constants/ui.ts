/**
 * 스켈레톤 Navbar에서 지원하는 페이지 타입
 */
export const SKELETON_PAGE = {
  HOME: "home",
  DETAIL: "detail",
  QUIZ: "quiz",
} as const;

export type SkeletonPage = (typeof SKELETON_PAGE)[keyof typeof SKELETON_PAGE];
