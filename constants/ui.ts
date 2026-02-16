/**
 * 스켈레톤 Navbar에서 지원하는 페이지 타입
 */
export const SKELETON_PAGE = {
  HOME: "home",
  DETAIL: "detail",
  QUIZ: "quiz",
  MY_PAGE: "my_page",
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

/**
 * 뷰 모드 타입 (리스트/그리드)
 */
export const VIEW_MODE = {
  COMPACT: "compact",
  FULL: "full",
} as const;

export type ViewMode = (typeof VIEW_MODE)[keyof typeof VIEW_MODE];

/**
 * 다이얼로그 모드 (confirm: 2버튼, alert: 1버튼)
 */
export const DIALOG_MODE = {
  CONFIRM: "confirm",
  ALERT: "alert",
} as const;

export type DialogMode = (typeof DIALOG_MODE)[keyof typeof DIALOG_MODE];

/**
 * 다이얼로그 스타일 변형
 */
export const DIALOG_VARIANT = {
  DEFAULT: "default",
  DESTRUCTIVE: "destructive",
  INFO: "info",
} as const;

export type DialogVariant =
  (typeof DIALOG_VARIANT)[keyof typeof DIALOG_VARIANT];
