/**
 * 스켈레톤 Navbar에서 지원하는 페이지 타입
 */
export const SKELETON_PAGE = {
  HOME: "home",
  DETAIL: "detail",
  QUIZ: "quiz",
} as const;

export type SkeletonPage = (typeof SKELETON_PAGE)[keyof typeof SKELETON_PAGE];

/**
 * 액션 버튼 (좋아요, 저장) 아이콘 크기
 */
export const ACTION_ICON_SIZE = {
  SM: "sm",
  MD: "md",
  LG: "lg",
} as const;

export type ActionIconSize =
  (typeof ACTION_ICON_SIZE)[keyof typeof ACTION_ICON_SIZE];

export const DEFAULT_ACTION_ICON_SIZE = ACTION_ICON_SIZE.MD;

export const ACTION_ICON_SIZE_CLASSES: Record<ActionIconSize, string> = {
  [ACTION_ICON_SIZE.SM]: "h-5 w-5",
  [ACTION_ICON_SIZE.MD]: "h-6 w-6",
  [ACTION_ICON_SIZE.LG]: "h-7 w-7",
};
