export const EXPRESSION_SORT = {
  LATEST: "latest",
  RANDOM: "random",
} as const;

export type ExpressionSortType =
  (typeof EXPRESSION_SORT)[keyof typeof EXPRESSION_SORT];
