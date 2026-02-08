export const EXPRESSION_PAGE_SIZE = 24;

export const EXPRESSION_SORT = {
  LATEST: "latest",
  RANDOM: "random",
} as const;

export type ExpressionSortType =
  (typeof EXPRESSION_SORT)[keyof typeof EXPRESSION_SORT];
